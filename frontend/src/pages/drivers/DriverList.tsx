import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Driver, Vehicle } from '../../types';
import { Plus, Search, Pencil, Trash2, User, Phone, AlertTriangle } from 'lucide-react';

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

  const empty: Partial<Driver> = { name: '', phone: '', license_number: '', address: '', status: 'available' };

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    const [dr, vr] = await Promise.all([
      (() => { let q = api.from('drivers').select('*').order('name'); if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`); return q; })(),
      api.from('vehicles').select('id, vehicle_number'),
    ]);
    setDrivers(dr.data || []);
    setVehicles(vr.data || []);
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

  const statusColors: Record<string, string> = { available: 'bg-green-50 text-green-700', 'on-duty': 'bg-amber-50 text-amber-700', inactive: 'bg-gray-100 text-gray-600' };
  const inp = 'form-input', lbl = 'form-label';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Drivers</h1><p className="text-sm text-gray-400 mt-0.5">{drivers.length} drivers</p></div>
        <button onClick={() => { setEditDriver(empty); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Driver</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search drivers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
            return (
              <div key={d.id} className="card p-4 hover:shadow-card-lg transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
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
