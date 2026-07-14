import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Item } from '../../types';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Item> | null>(null);
  const [saving, setSaving] = useState(false);

  const empty: Partial<Item> = { name: '', hsn_code: '', unit: 'KG', gst_rate: 0, description: '' };

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    let q = api.from('items').select('*').order('name');
    if (search) q = q.or(`name.ilike.%${search}%,hsn_code.ilike.%${search}%`);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }

  async function save() {
    if (!editItem?.name) return;
    setSaving(true);
    let error;
    if (editItem.id) ({ error } = await api.from('items').update(editItem).eq('id', editItem.id));
    else ({ error } = await api.from('items').insert([editItem]));
    setSaving(false);
    if (!error) { setShowForm(false); setEditItem(null); load(); }
    else alert('Save failed: ' + error.message);
  }

  async function del(id: string) {
    if (!confirm('Delete this item?')) return;
    await api.from('items').delete().eq('id', id);
    load();
  }

  const inp = 'form-input', lbl = 'form-label';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Items / Commodities</h1><p className="text-sm text-gray-400 mt-0.5">{items.length} items</p></div>
        <button onClick={() => { setEditItem(empty); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Item</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {showForm && editItem && (
        <div className="card p-6 border-brand/30 border-2">
          <h2 className="font-semibold text-gray-900 mb-4">{editItem.id ? 'Edit Item' : 'Add Item'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Item Name *</label><input className={inp} value={editItem.name || ''} onChange={e => setEditItem(i => ({ ...i!, name: e.target.value }))} /></div>
            <div><label className={lbl}>HSN Code</label><input className={inp} value={editItem.hsn_code || ''} onChange={e => setEditItem(i => ({ ...i!, hsn_code: e.target.value }))} /></div>
            <div><label className={lbl}>Unit</label>
              <select className={inp} value={editItem.unit || 'KG'} onChange={e => setEditItem(i => ({ ...i!, unit: e.target.value }))}>
                {['KG', 'MT', 'Unit', 'Box', 'Bundle', 'Litre'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div><label className={lbl}>GST Rate (%)</label>
              <select className={inp} value={editItem.gst_rate || 0} onChange={e => setEditItem(i => ({ ...i!, gst_rate: Number(e.target.value) }))}>
                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className={lbl}>Description</label><textarea rows={2} className={inp} value={editItem.description || ''} onChange={e => setEditItem(i => ({ ...i!, description: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Item'}</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            <th className="table-th">Item Name</th>
            <th className="table-th">HSN Code</th>
            <th className="table-th">Unit</th>
            <th className="table-th">GST Rate</th>
            <th className="table-th">Description</th>
            <th className="table-th">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
              : items.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Package size={36} className="mx-auto text-gray-200 mb-3" />
                  <div className="text-gray-400 text-sm">No items found</div>
                </td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="table-td font-medium">{item.name}</td>
                  <td className="table-td font-mono text-xs">{item.hsn_code || '—'}</td>
                  <td className="table-td">{item.unit}</td>
                  <td className="table-td"><span className="status-pill bg-blue-50 text-blue-700">{item.gst_rate || 0}%</span></td>
                  <td className="table-td text-gray-400 text-xs">{item.description || '—'}</td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(item); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand"><Pencil size={14} /></button>
                      <button onClick={() => del(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
