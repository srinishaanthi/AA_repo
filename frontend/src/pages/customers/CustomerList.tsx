import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Customer, NavState } from '../../types';
import { Plus, Search, Eye, Pencil, Trash2, Users, Phone, Mail } from 'lucide-react';

interface Props { onNav: (s: NavState) => void; }

export default function CustomerList({ onNav }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Partial<Customer> | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm: Partial<Customer> = { name: '', gstin: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', contact_person: '', credit_days: 0, notes: '' };

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    let q = api.from('customers').select('*').order('name');
    if (search) q = q.or(`name.ilike.%${search}%,gstin.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data } = await q;
    setCustomers(data || []);
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

  const inp = 'form-input';
  const lbl = 'form-label';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Customers</h1><p className="text-sm text-gray-400 mt-0.5">{customers.length} customers</p></div>
        <button onClick={() => { setEditCustomer(emptyForm); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Customer</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
          ) : customers.map(c => (
            <div key={c.id} className="card p-5 hover:shadow-card-lg transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
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
          ))}
      </div>
    </div>
  );
}
