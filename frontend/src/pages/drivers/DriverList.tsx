import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Driver, Vehicle } from '../../types';
import { Plus, Search, Pencil, Trash2, User, Phone, AlertTriangle, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

function isExpiring(date?: string) {
  if (!date) return false;
  return (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 30;
}

export default function DriverList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState<Partial<Driver> | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportPanel, setShowImportPanel] = useState(false);

  const empty: Partial<Driver> = { name: '', phone: '', license_number: '', address: '', status: 'available' };

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    const [dr, vr] = await Promise.all([
      (() => { let q = api.from('drivers').select('*').order('name'); if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`); return q; })(),
      api.from('vehicles').select('id, vehicle_number'),
    ]);
    const loadedDrivers = dr.data || [];
    setDrivers(loadedDrivers);
    setVehicles(vr.data || []);
    setSelectedIds(prev => prev.filter(id => loadedDrivers.some((d: any) => d.id === id)));
    setLoading(false);
  }

  async function save() {
    if (!editDriver?.name) return;
    setSaving(true);
    let error;
    if (editDriver.id) ({ error } = await api.from('drivers').update(editDriver).eq('id', editDriver.id));
    else ({ error } = await api.from('drivers').insert([editDriver]));
    setSaving(false);
    if (!error) { setShowForm(false); setEditDriver(null); load(); }
    else alert('Save failed: ' + error.message);
  }

  async function del(id: string) {
    if (!confirm('Delete this driver?')) return;
    await api.from('drivers').delete().eq('id', id);
    load();
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (drivers.length === 0) return;
    if (selectedIds.length === drivers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(drivers.map(d => d.id));
    }
  };

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    try {
      const headers = [
        'Driver Name',
        'Phone',
        'License Number',
        'License Expiry',
        'Address',
        'Status'
      ];
      const exampleRow = [
        'Ramesh Kumar',
        '9876543210',
        'TN3820101234567',
        '2030-12-31',
        '123 Main St, Coimbatore',
        'available'
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Drivers Template');

      if (format === 'csv') {
        XLSX.writeFile(wb, 'driver_import_template.csv', { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, 'driver_import_template.xlsx', { bookType: 'xlsx' });
      }
    } catch (err: any) {
      console.error('Template generation error:', err);
      alert('Failed to generate template: ' + (err.message || err));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (rows.length === 0) {
          alert('The uploaded file is empty.');
          return;
        }

        const keyMapping: Record<string, keyof Driver> = {
          'drivername': 'name',
          'name': 'name',
          'phone': 'phone',
          'licensenumber': 'license_number',
          'license': 'license_number',
          'licenseexpiry': 'license_expiry',
          'address': 'address',
          'status': 'status'
        };

        const parsedDrivers: Partial<Driver>[] = rows.map((row: any) => {
          const drv: any = {};
          for (const [key, val] of Object.entries(row)) {
            const norm = key.toLowerCase().replace(/[\s_-]/g, '');
            const mappedKey = keyMapping[norm];
            if (mappedKey) {
              drv[mappedKey] = val !== undefined && val !== null ? String(val).trim() : '';
            }
          }
          if (!drv.status) drv.status = 'available';
          return drv;
        }).filter(d => d.name);

        if (parsedDrivers.length === 0) {
          alert('No valid driver records found. Please ensure "Driver Name" column is filled.');
          return;
        }

        const res = await api.post('/drivers/bulk', parsedDrivers);
        alert(`Successfully processed file. Added ${res.added_count} new drivers.`);
        setShowImportPanel(false);
        load();
      } catch (err: any) {
        console.error(err);
        alert('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const exportToExcel = () => {
    try {
      const listToExport = selectedIds.length > 0
        ? drivers.filter(d => selectedIds.includes(d.id))
        : drivers;

      if (listToExport.length === 0) {
        alert('No drivers to export.');
        return;
      }

      const dataRows = listToExport.map((d, index) => {
        const vehicle = vehicles.find(v => v.id === d.vehicle_id);
        return {
          'S.No': index + 1,
          'Driver Name': d.name,
          'Phone': d.phone || '',
          'License Number': d.license_number || '',
          'License Expiry': d.license_expiry || '',
          'Assigned Vehicle': vehicle ? vehicle.vehicle_number : '',
          'Status': d.status,
          'Address': d.address || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Drivers');

      const wscols = [
        { wch: 6 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 12 },
        { wch: 40 }
      ];
      ws['!cols'] = wscols;

      XLSX.writeFile(wb, `drivers_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export data: ' + (err.message || err));
    }
  };

  const statusColors: Record<string, string> = { available: 'bg-green-50 text-green-700', 'on-duty': 'bg-amber-50 text-amber-700', inactive: 'bg-gray-100 text-gray-600' };
  const inp = 'form-input', lbl = 'form-label';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {drivers.length} drivers {selectedIds.length > 0 ? `(${selectedIds.length} selected)` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportPanel(prev => !prev)} className="btn-secondary">
            <Upload size={16} /> Import
          </button>
          <button onClick={exportToExcel} className="btn-secondary">
            <Download size={16} />
            {selectedIds.length > 0 ? `Export Selected (${selectedIds.length})` : 'Export All'}
          </button>
          <button onClick={() => { setEditDriver(empty); setShowForm(true); }} className="btn-primary">
            <Plus size={16} /> Add Driver
          </button>
        </div>
      </div>

      {showImportPanel && (
        <div className="card p-6 border-dashed border-2 border-brand/35 bg-brand-light/10 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 text-sm">Bulk Import Drivers</h3>
            <p className="text-xs text-gray-500">
              Download the template, fill in details, and upload the completed Excel or CSV file. Duplicate drivers will be skipped.
            </p>
            <div className="flex gap-2 text-xs font-semibold text-brand mt-1.5">
              <button onClick={() => downloadTemplate('xlsx')} className="hover:underline flex items-center gap-1">
                <Download size={12} /> Excel Template
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={() => downloadTemplate('csv')} className="hover:underline flex items-center gap-1">
                <Download size={12} /> CSV Template
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="btn-secondary cursor-pointer text-xs py-1.5 px-3">
              <span>Choose File</span>
              <input 
                type="file" 
                accept=".xlsx,.csv" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>
            <button onClick={() => setShowImportPanel(false)} className="btn-ghost text-xs py-1.5 px-3">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search drivers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {drivers.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <input 
              type="checkbox" 
              id="select-all" 
              checked={selectedIds.length === drivers.length && drivers.length > 0} 
              onChange={toggleSelectAll} 
              className="w-4 h-4 rounded text-brand border-gray-300 focus:ring-brand cursor-pointer"
            />
            <label htmlFor="select-all" className="text-xs font-semibold text-gray-500 cursor-pointer select-none">
              SELECT ALL ({drivers.length})
            </label>
          </div>
        )}
      </div>

      {showForm && editDriver && (
        <div className="card p-6 border-brand/30 border-2">
          <h2 className="font-semibold text-gray-900 mb-4">{editDriver.id ? 'Edit Driver' : 'Add Driver'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Driver Name *</label><input className={inp} value={editDriver.name || ''} onChange={e => setEditDriver(d => ({ ...d!, name: e.target.value }))} /></div>
            <div><label className={lbl}>Phone</label><input className={inp} value={editDriver.phone || ''} onChange={e => setEditDriver(d => ({ ...d!, phone: e.target.value }))} /></div>
            <div><label className={lbl}>License Number</label><input className={inp} value={editDriver.license_number || ''} onChange={e => setEditDriver(d => ({ ...d!, license_number: e.target.value }))} /></div>
            <div><label className={lbl}>License Expiry</label><input type="date" className={inp} value={editDriver.license_expiry || ''} onChange={e => setEditDriver(d => ({ ...d!, license_expiry: e.target.value }))} /></div>
            <div><label className={lbl}>Assigned Vehicle</label>
              <select className={inp} value={editDriver.vehicle_id || ''} onChange={e => setEditDriver(d => ({ ...d!, vehicle_id: e.target.value || undefined }))}>
                <option value="">None</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Status</label>
              <select className={inp} value={editDriver.status || 'available'} onChange={e => setEditDriver(d => ({ ...d!, status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="on-duty">On Duty</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2"><label className={lbl}>Address</label><input className={inp} value={editDriver.address || ''} onChange={e => setEditDriver(d => ({ ...d!, address: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowForm(false); setEditDriver(null); }} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Driver'}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? [...Array(8)].map((_, i) => <div key={i} className="card h-36 animate-pulse bg-gray-100" />) :
          drivers.length === 0 ? (
            <div className="col-span-4 py-16 text-center">
              <User size={36} className="mx-auto text-gray-200 mb-3" />
              <div className="text-gray-400 text-sm">No drivers found</div>
            </div>
          ) : drivers.map(d => {
            const vehicle = vehicles.find(v => v.id === d.vehicle_id);
            const isSelected = selectedIds.includes(d.id);
            return (
              <div 
                key={d.id} 
                className={`card p-4 hover:shadow-card-lg transition-all group relative border ${
                  isSelected ? 'border-brand/40 bg-brand-light/10' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleSelect(d.id)}
                      className="w-4 h-4 rounded text-brand border-gray-300 focus:ring-brand cursor-pointer" 
                    />
                    <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-brand" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{d.name}</div>
                      <span className={`status-pill text-[9px] ${statusColors[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditDriver(d); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand"><Pencil size={13} /></button>
                    <button onClick={() => del(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {d.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={11} className="text-gray-400" />{d.phone}</div>}
                  {d.license_number && <div className="text-xs text-gray-500">License: <span className="font-mono font-medium text-gray-700">{d.license_number}</span></div>}
                  {d.license_expiry && (
                    <div className={`flex items-center gap-1 text-xs ${isExpiring(d.license_expiry) ? 'text-red-600' : 'text-gray-500'}`}>
                      {isExpiring(d.license_expiry) && <AlertTriangle size={11} />}
                      Expiry: {new Date(d.license_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </div>
                  )}
                  {vehicle && <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full inline-block font-mono">{vehicle.vehicle_number}</div>}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
