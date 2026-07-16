import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Customer, NavState } from '../../types';
import { Plus, Search, Eye, Pencil, Trash2, Users, Phone, Mail, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props { onNav: (s: NavState) => void; }

export default function CustomerList({ onNav }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Partial<Customer> | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportPanel, setShowImportPanel] = useState(false);

  const emptyForm: Partial<Customer> = { name: '', gstin: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', contact_person: '', credit_days: 0, notes: '' };

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    let q = api.from('customers').select('*').order('name');
    if (search) q = q.or(`name.ilike.%${search}%,gstin.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data } = await q;
    const loaded = data || [];
    setCustomers(loaded);
    setSelectedIds(prev => prev.filter(id => loaded.some(c => c.id === id)));
    setLoading(false);
  }

  async function save() {
    if (!editCustomer?.name) return;
    setSaving(true);
    let error;
    if (editCustomer.id) ({ error } = await api.from('customers').update(editCustomer).eq('id', editCustomer.id));
    else ({ error } = await api.from('customers').insert([editCustomer]));
    setSaving(false);
    if (!error) { setShowForm(false); setEditCustomer(null); load(); }
    else alert('Save failed: ' + error.message);
  }

  async function del(id: string) {
    if (!confirm('Delete this customer?')) return;
    await api.from('customers').delete().eq('id', id);
    load();
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (customers.length === 0) return;
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map(c => c.id));
    }
  };

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    try {
      const headers = [
        'Company Name',
        'GSTIN',
        'PAN',
        'Phone',
        'Email',
        'Contact Person',
        'Credit Days',
        'Address',
        'City',
        'State',
        'Pincode',
        'Notes'
      ];
      const exampleRow = [
        'ABC Manufacturing Ltd',
        '33AABCA1234D1Z5',
        'AABCA1234D',
        '9876543210',
        'contact@abc.com',
        'Mr. Sharma',
        '30',
        '123 Industrial Estate',
        'Coimbatore',
        'Tamil Nadu',
        '641001',
        'Primary supplier'
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers Template');

      if (format === 'csv') {
        XLSX.writeFile(wb, 'customer_import_template.csv', { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, 'customer_import_template.xlsx', { bookType: 'xlsx' });
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

        const keyMapping: Record<string, keyof Customer> = {
          'companyname': 'name',
          'name': 'name',
          'gstin': 'gstin',
          'pan': 'pan',
          'phone': 'phone',
          'email': 'email',
          'contactperson': 'contact_person',
          'creditdays': 'credit_days',
          'address': 'address',
          'city': 'city',
          'state': 'state',
          'pincode': 'pincode',
          'notes': 'notes'
        };

        const parsedCustomers: Partial<Customer>[] = rows.map((row: any) => {
          const cust: any = {};
          for (const [key, val] of Object.entries(row)) {
            const norm = key.toLowerCase().replace(/[\s_-]/g, '');
            const mappedKey = keyMapping[norm];
            if (mappedKey) {
              if (mappedKey === 'credit_days') {
                cust[mappedKey] = val !== undefined && val !== null ? Number(val) : 0;
              } else {
                cust[mappedKey] = val !== undefined && val !== null ? String(val).trim() : '';
              }
            }
          }
          return cust;
        }).filter(c => c.name);

        if (parsedCustomers.length === 0) {
          alert('No valid customer records found. Please ensure "Company Name" column is filled.');
          return;
        }

        const res = await api.post('/customers/bulk', parsedCustomers);
        alert(`Successfully processed file. Added ${res.added_count} new customers.`);
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
        ? customers.filter(c => selectedIds.includes(c.id))
        : customers;

      if (listToExport.length === 0) {
        alert('No customers to export.');
        return;
      }

      const dataRows = listToExport.map((c, index) => ({
        'S.No': index + 1,
        'Company Name': c.name,
        'GSTIN': c.gstin || '',
        'PAN': c.pan || '',
        'Phone': c.phone || '',
        'Email': c.email || '',
        'Contact Person': c.contact_person || '',
        'Credit Days': c.credit_days || 0,
        'Address': c.address || '',
        'City': c.city || '',
        'State': c.state || '',
        'Pincode': c.pincode || '',
        'Notes': c.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');

      const wscols = [
        { wch: 6 },
        { wch: 30 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 12 },
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 30 }
      ];
      ws['!cols'] = wscols;

      XLSX.writeFile(wb, `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export data: ' + (err.message || err));
    }
  };

  const inp = 'form-input';
  const lbl = 'form-label';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {customers.length} customers {selectedIds.length > 0 ? `(${selectedIds.length} selected)` : ''}
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
          <button onClick={() => { setEditCustomer(emptyForm); setShowForm(true); }} className="btn-primary">
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {showImportPanel && (
        <div className="card p-6 border-dashed border-2 border-brand/35 bg-brand-light/10 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 text-sm">Bulk Import Customers</h3>
            <p className="text-xs text-gray-500">
              Download the template, fill in details, and upload the completed Excel or CSV file. Duplicate company names will be skipped.
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
          <input className="form-input pl-9" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {customers.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <input 
              type="checkbox" 
              id="select-all" 
              checked={selectedIds.length === customers.length && customers.length > 0} 
              onChange={toggleSelectAll} 
              className="w-4 h-4 rounded text-brand border-gray-300 focus:ring-brand cursor-pointer"
            />
            <label htmlFor="select-all" className="text-xs font-semibold text-gray-500 cursor-pointer select-none">
              SELECT ALL ({customers.length})
            </label>
          </div>
        )}
      </div>

      {showForm && editCustomer && (
        <div className="card p-6 border-brand/30 border-2">
          <h2 className="font-semibold text-gray-900 mb-4">{editCustomer.id ? 'Edit Customer' : 'Add New Customer'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className={lbl}>Company Name *</label><input className={inp} value={editCustomer.name || ''} onChange={e => setEditCustomer(c => ({ ...c!, name: e.target.value }))} /></div>
            <div><label className={lbl}>GSTIN</label><input className={inp} value={editCustomer.gstin || ''} onChange={e => setEditCustomer(c => ({ ...c!, gstin: e.target.value }))} /></div>
            <div><label className={lbl}>PAN</label><input className={inp} value={editCustomer.pan || ''} onChange={e => setEditCustomer(c => ({ ...c!, pan: e.target.value }))} /></div>
            <div><label className={lbl}>Phone</label><input className={inp} value={editCustomer.phone || ''} onChange={e => setEditCustomer(c => ({ ...c!, phone: e.target.value }))} /></div>
            <div><label className={lbl}>Email</label><input className={inp} value={editCustomer.email || ''} onChange={e => setEditCustomer(c => ({ ...c!, email: e.target.value }))} /></div>
            <div><label className={lbl}>Contact Person</label><input className={inp} value={editCustomer.contact_person || ''} onChange={e => setEditCustomer(c => ({ ...c!, contact_person: e.target.value }))} /></div>
            <div><label className={lbl}>Credit Days</label><input type="number" className={inp} value={editCustomer.credit_days || ''} onChange={e => setEditCustomer(c => ({ ...c!, credit_days: Number(e.target.value) }))} /></div>
            <div className="col-span-2"><label className={lbl}>Address</label><input className={inp} value={editCustomer.address || ''} onChange={e => setEditCustomer(c => ({ ...c!, address: e.target.value }))} /></div>
            <div><label className={lbl}>City</label><input className={inp} value={editCustomer.city || ''} onChange={e => setEditCustomer(c => ({ ...c!, city: e.target.value }))} /></div>
            <div><label className={lbl}>State</label><input className={inp} value={editCustomer.state || ''} onChange={e => setEditCustomer(c => ({ ...c!, state: e.target.value }))} /></div>
            <div className="col-span-2"><label className={lbl}>Notes</label><textarea rows={2} className={inp} value={editCustomer.notes || ''} onChange={e => setEditCustomer(c => ({ ...c!, notes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowForm(false); setEditCustomer(null); }} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Customer'}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(6)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-100" />) :
          customers.length === 0 ? (
            <div className="col-span-3 py-16 text-center">
              <Users size={36} className="mx-auto text-gray-200 mb-3" />
              <div className="text-gray-400 text-sm">No customers found</div>
            </div>
          ) : customers.map(c => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <div 
                key={c.id} 
                className={`card p-5 hover:shadow-card-lg transition-all group relative border ${
                  isSelected ? 'border-brand/40 bg-brand-light/10' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded text-brand border-gray-300 focus:ring-brand cursor-pointer" 
                    />
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{c.name}</div>
                      {c.gstin && <div className="text-[10px] text-gray-400 font-mono">{c.gstin}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditCustomer(c); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand"><Pencil size={13} /></button>
                    <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {c.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={11} className="text-gray-400" />{c.phone}</div>}
                  {c.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={11} className="text-gray-400" />{c.email}</div>}
                  {c.city && <div className="text-xs text-gray-400">{c.city}{c.state ? `, ${c.state}` : ''}</div>}
                  {c.credit_days ? <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full inline-block">Credit: {c.credit_days} days</div> : null}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
