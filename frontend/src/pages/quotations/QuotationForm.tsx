import { useState, useEffect } from 'react';
import { api, getNextNumber } from '../../lib/api';
import { Quotation, Customer, NavState } from '../../types';
import { Save, ArrowLeft, FileText } from 'lucide-react';

interface Props { editId?: string; onNav: (s: NavState) => void; }

export default function QuotationForm({ editId, onNav }: Props) {
  const [form, setForm] = useState<Partial<Quotation>>({
    date: new Date().toISOString().split('T')[0],
    rate: 0, loading_charge: 0, unloading_charge: 0, other_charges: 0,
    gst_rate: 0, gst_amount: 0, total_amount: 0, status: 'draft',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.from('customers').select('*').order('name').then(r => setCustomers(r.data || []));
    if (editId) api.from('quotations').select('*').eq('id', editId).maybeSingle().then(r => { if (r.data) setForm(r.data); });
    else getNextNumber('quotation').then(n => setForm(f => ({ ...f, quotation_number: n })));
  }, [editId]);

  function setF(field: keyof Quotation, val: unknown) { setForm(f => ({ ...f, [field]: val })); }

  function selectCustomer(id: string) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    setForm(f => ({ ...f, customer_id: c.id, customer_name: c.name }));
  }

  const subtotal = (Number(form.rate) || 0) + (Number(form.loading_charge) || 0) +
    (Number(form.unloading_charge) || 0) + (Number(form.other_charges) || 0);
  const gstAmt = (subtotal * (Number(form.gst_rate) || 0)) / 100;
  const grandTotal = subtotal + gstAmt;

  async function handleSave(status = form.status) {
    setSaving(true);
    const payload = { ...form, gst_amount: gstAmt, total_amount: grandTotal, status };
    let error;
    if (editId) ({ error } = await api.from('quotations').update(payload).eq('id', editId));
    else ({ error } = await api.from('quotations').insert([payload]));
    setSaving(false);
    if (!error) onNav({ page: 'quotation-list' });
    else alert('Save failed: ' + error.message);
  }

  const inp = 'form-input';
  const lbl = 'form-label';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onNav({ page: 'quotation-list' })} className="btn-ghost"><ArrowLeft size={15} /> Back</button>
          <h1 className="text-xl font-bold text-gray-900">{editId ? 'Edit Quotation' : 'New Quotation'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary"><Save size={15} />{saving ? 'Saving…' : 'Save Draft'}</button>
          <button onClick={() => handleSave('sent')} disabled={saving} className="btn-primary"><FileText size={15} /> Generate & Send</button>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 pb-2 border-b border-gray-100">Quotation Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Quotation Number</label><input className={inp} value={form.quotation_number || ''} onChange={e => setF('quotation_number', e.target.value)} /></div>
          <div><label className={lbl}>Date</label><input type="date" className={inp} value={form.date || ''} onChange={e => setF('date', e.target.value)} /></div>
          <div><label className={lbl}>Customer</label>
            <select className={inp} onChange={e => selectCustomer(e.target.value)} value={form.customer_id || ''}>
              <option value="">— Select Customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Customer Name</label><input className={inp} value={form.customer_name || ''} onChange={e => setF('customer_name', e.target.value)} /></div>
          <div><label className={lbl}>From</label><input className={inp} placeholder="Origin" value={form.from_location || ''} onChange={e => setF('from_location', e.target.value)} /></div>
          <div><label className={lbl}>To</label><input className={inp} placeholder="Destination" value={form.to_location || ''} onChange={e => setF('to_location', e.target.value)} /></div>
          <div><label className={lbl}>Vehicle Type</label>
            <input className={inp} placeholder="e.g. Mini Truck, Multi Axle..." value={form.vehicle_type || ''} onChange={e => setF('vehicle_type', e.target.value)} />
          </div>
          <div><label className={lbl}>Weight (KG)</label><input type="number" className={inp} value={form.weight || ''} onChange={e => setF('weight', Number(e.target.value))} /></div>
          <div><label className={lbl}>Valid Till</label><input type="date" className={inp} value={form.valid_till || ''} onChange={e => setF('valid_till', e.target.value)} /></div>
          <div><label className={lbl}>Status</label>
            <select className={inp} value={form.status || 'draft'} onChange={e => setF('status', e.target.value)}>
              {['draft', 'sent', 'approved', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 pb-2 border-b border-gray-100">Charges</h2>
        {([['Freight Rate (₹)', 'rate'], ['Loading Charge', 'loading_charge'], ['Unloading Charge', 'unloading_charge'], ['Other Charges', 'other_charges']] as [string, keyof Quotation][]).map(([label, field]) => (
          <div key={field} className="flex items-center justify-between gap-4">
            <label className="text-sm text-gray-600 flex-1">{label}</label>
            <input type="number" className="form-input w-32 text-right" value={form[field] as number || ''} onChange={e => setF(field, Number(e.target.value))} />
          </div>
        ))}
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm text-gray-600 flex-1">GST Rate (%)</label>
          <select className="form-input w-32 text-right" value={form.gst_rate || 0} onChange={e => setF('gst_rate', Number(e.target.value))}>
            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
        <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Sub Total</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          {gstAmt > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">GST ({form.gst_rate}%)</span><span>₹{gstAmt.toLocaleString('en-IN')}</span></div>}
          <div className="flex justify-between font-bold pt-2 border-t border-brand/20"><span>Grand Total</span><span className="text-brand text-xl">₹{grandTotal.toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 pb-2 border-b border-gray-100 mb-4">Remarks</h2>
        <textarea rows={3} className={inp} placeholder="Any special remarks…" value={form.remarks || ''} onChange={e => setF('remarks', e.target.value)} />
      </div>
    </div>
  );
}
