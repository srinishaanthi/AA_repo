import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Vehicle } from '../../types';
import { Plus, Search, Pencil, Trash2, Car, AlertTriangle } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  'in-use': 'bg-amber-50 text-amber-700',
  maintenance: 'bg-red-50 text-red-700',
};

function isExpiring(date?: string) {
  if (!date) return false;
  const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff < 30;
}

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Partial<Vehicle> | null>(null);
  const [saving, setSaving] = useState(false);

  const empty: Partial<Vehicle> = { vehicle_number: '', vehicle_type: '', owner_name: '', owner_phone: '', status: 'available' };

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    let q = api.from('vehicles').select('*').order('vehicle_number');
    if (search) q = q.or(`vehicle_number.ilike.%${search}%,owner_name.ilike.%${search}%`);
    const { data } = await q;
    setVehicles(data || []);
    setLoading(false);
  }

  async function save() {
    if (!editVehicle?.vehicle_number) return;
    setSaving(true);
    let error;
    if (editVehicle.id) ({ error } = await api.from('vehicles').update(editVehicle).eq('id', editVehicle.id));
    else ({ error } = await api.from('vehicles').insert([editVehicle]));
    setSaving(false);
    if (!error) { setShowForm(false); setEditVehicle(null); load(); }
    else alert('Save failed: ' + error.message);
  }

  async function del(id: string) {
    if (!confirm('Delete this vehicle?')) return;
    await api.from('vehicles').delete().eq('id', id);
    load();
  }

  const inp = 'form-input';
  const lbl = 'form-label';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Vehicles</h1><p className="text-sm text-gray-400 mt-0.5">{vehicles.length} vehicles in fleet</p></div>
        <button onClick={() => { setEditVehicle(empty); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Vehicle</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search vehicle number, owner…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {showForm && editVehicle && (
        <div className="card p-6 border-brand/30 border-2">
          <h2 className="font-semibold text-gray-900 mb-4">{editVehicle.id ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Vehicle Number *</label><input className={inp} placeholder="TN38 AB 1234" value={editVehicle.vehicle_number || ''} onChange={e => setEditVehicle(v => ({ ...v!, vehicle_number: e.target.value.toUpperCase() }))} /></div>
            <div><label className={lbl}>Vehicle Type</label>
              <input className={inp} placeholder="e.g. Mini Truck, Multi Axle..." value={editVehicle.vehicle_type || ''} onChange={e => setEditVehicle(v => ({ ...v!, vehicle_type: e.target.value }))} />
            </div>
            <div><label className={lbl}>Owner Name</label><input className={inp} value={editVehicle.owner_name || ''} onChange={e => setEditVehicle(v => ({ ...v!, owner_name: e.target.value }))} /></div>
            <div><label className={lbl}>Owner Phone</label><input className={inp} value={editVehicle.owner_phone || ''} onChange={e => setEditVehicle(v => ({ ...v!, owner_phone: e.target.value }))} /></div>
            <div><label className={lbl}>Status</label>
              <select className={inp} value={editVehicle.status || 'available'} onChange={e => setEditVehicle(v => ({ ...v!, status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div><label className={lbl}>Insurance Expiry</label><input type="date" className={inp} value={editVehicle.insurance_expiry || ''} onChange={e => setEditVehicle(v => ({ ...v!, insurance_expiry: e.target.value }))} /></div>
            <div><label className={lbl}>Fitness Expiry</label><input type="date" className={inp} value={editVehicle.fitness_expiry || ''} onChange={e => setEditVehicle(v => ({ ...v!, fitness_expiry: e.target.value }))} /></div>
            <div><label className={lbl}>Permit Expiry</label><input type="date" className={inp} value={editVehicle.permit_expiry || ''} onChange={e => setEditVehicle(v => ({ ...v!, permit_expiry: e.target.value }))} /></div>
            <div><label className={lbl}>Pollution Expiry</label><input type="date" className={inp} value={editVehicle.pollution_expiry || ''} onChange={e => setEditVehicle(v => ({ ...v!, pollution_expiry: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowForm(false); setEditVehicle(null); }} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Vehicle'}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(6)].map((_, i) => <div key={i} className="card h-44 animate-pulse bg-gray-100" />) :
          vehicles.length === 0 ? (
            <div className="col-span-3 py-16 text-center">
              <Car size={36} className="mx-auto text-gray-200 mb-3" />
              <div className="text-gray-400 text-sm">No vehicles found</div>
            </div>
          ) : vehicles.map(v => (
            <div key={v.id} className="card p-5 hover:shadow-card-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-lg font-bold text-gray-900 tracking-widest">{v.vehicle_number}</div>
                  <div className="text-xs text-gray-400">{v.vehicle_type || 'Unknown type'}</div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`status-pill ${statusColors[v.status] || 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button onClick={() => { setEditVehicle(v); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand"><Pencil size={13} /></button>
                    <button onClick={() => del(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
              {v.owner_name && <div className="text-xs text-gray-500 mb-3">Owner: <span className="font-medium text-gray-700">{v.owner_name}</span></div>}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Insurance', date: v.insurance_expiry },
                  { label: 'Fitness', date: v.fitness_expiry },
                  { label: 'Permit', date: v.permit_expiry },
                  { label: 'Pollution', date: v.pollution_expiry },
                ].map(doc => (
                  <div key={doc.label} className={`rounded-lg p-2 ${doc.date && isExpiring(doc.date) ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1 text-[9px] text-gray-400 font-semibold">
                      {doc.date && isExpiring(doc.date) && <AlertTriangle size={10} className="text-red-500" />}
                      {doc.label}
                    </div>
                    <div className={`text-xs font-medium ${doc.date && isExpiring(doc.date) ? 'text-red-600' : 'text-gray-700'}`}>
                      {doc.date ? new Date(doc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
