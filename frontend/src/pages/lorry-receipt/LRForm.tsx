import { useState, useEffect, useCallback } from 'react';
import { api, getNextNumber } from '../../lib/api';
import { LorryReceipt, Customer, Vehicle, Driver, CompanySettings, GoodsLine, NavState } from '../../types';
import LRPdfPreview from './LRPdfPreview';
import {
  Save, Printer, ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft, Eye, FileText
} from 'lucide-react';

const emptyGoods = (): GoodsLine => ({
  description: '', packages: '', actual_weight: '', charged_weight: '',
  invoice_no: '', invoice_date: '', value: '',
});

interface Props {
  editId?: string;
  onNav: (s: NavState) => void;
}

interface Section {
  key: string;
  label: string;
}

const sections: Section[] = [
  { key: 'basic', label: 'Basic Details' },
  { key: 'consignor', label: 'Consignor Details' },
  { key: 'consignee', label: 'Consignee Details' },
  { key: 'transport', label: 'Transport Details' },
  { key: 'goods', label: 'Goods' },
  { key: 'charges', label: 'Charges' },
];

export default function LRForm({ editId, onNav }: Props) {
  const [form, setForm] = useState<Partial<LorryReceipt>>({
    date: new Date().toISOString().split('T')[0],
    freight_status: 'To Pay',
    payment_terms: 'To Pay',
    goods: [emptyGoods()],
    freight_charge: 0,
    loading_charge: 0,
    unloading_charge: 0,
    detention_charge: 0,
    other_charges: 0,
    status: 'created',
  });
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true, consignor: true, consignee: true, transport: true,
    goods: true, charges: true,
  });
  const [showPreview, setShowPreview] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadMasterData();
    if (editId) loadLR(editId);
    else generateLRNumber();
  }, [editId]);

  async function loadMasterData() {
    const [compRes, custRes, vehicleRes, driverRes] = await Promise.all([
      api.from('company_settings').select('*').maybeSingle(),
      api.from('customers').select('*').order('name'),
      api.from('vehicles').select('*').order('vehicle_number'),
      api.from('drivers').select('*').order('name'),
    ]);
    setCompany(compRes.data);
    setCustomers(custRes.data || []);
    setVehicles(vehicleRes.data || []);
    setDrivers(driverRes.data || []);
  }

  async function generateLRNumber() {
    const num = await getNextNumber('lr');
    setForm(f => ({ ...f, lr_number: num }));
  }

  async function loadLR(id: string) {
    const { data } = await api.from('lorry_receipts').select('*').eq('id', id).maybeSingle();
    if (data) setForm({ ...data, goods: data.goods || [emptyGoods()] });
  }

  const setField = useCallback((field: keyof LorryReceipt, value: unknown) => {
    setForm(f => ({ ...f, [field]: value }));
  }, []);

  function selectConsignor(customerId: string) {
    const c = customers.find(x => x.id === customerId);
    if (!c) return;
    setForm(f => ({
      ...f,
      consignor_id: c.id,
      consignor_name: c.name,
      consignor_address: [c.address, c.city, c.state, c.pincode].filter(Boolean).join(', '),
      consignor_gstin: c.gstin || '',
      consignor_phone: c.phone || '',
    }));
  }

  function selectConsignee(customerId: string) {
    const c = customers.find(x => x.id === customerId);
    if (!c) return;
    setForm(f => ({
      ...f,
      consignee_id: c.id,
      consignee_name: c.name,
      consignee_address: [c.address, c.city, c.state, c.pincode].filter(Boolean).join(', '),
      consignee_gstin: c.gstin || '',
      consignee_phone: c.phone || '',
    }));
  }

  function selectVehicle(vehicleId: string) {
    const v = vehicles.find(x => x.id === vehicleId);
    if (!v) return;
    setForm(f => ({ ...f, vehicle_id: v.id, vehicle_number: v.vehicle_number }));
  }

  function selectDriver(driverId: string) {
    const d = drivers.find(x => x.id === driverId);
    if (!d) return;
    setForm(f => ({ ...f, driver_id: d.id, driver_name: d.name, driver_phone: d.phone || '' }));
  }

  function updateGoods(index: number, field: keyof GoodsLine, value: string) {
    setForm(f => {
      const goods = [...(f.goods || [])];
      goods[index] = { ...goods[index], [field]: value };
      return { ...f, goods };
    });
  }

  function addGoods() {
    setForm(f => ({ ...f, goods: [...(f.goods || []), emptyGoods()] }));
  }

  function removeGoods(index: number) {
    setForm(f => {
      const goods = (f.goods || []).filter((_, i) => i !== index);
      return { ...f, goods: goods.length ? goods : [emptyGoods()] };
    });
  }

  const subTotal = (Number(form.freight_charge) || 0) +
    (Number(form.loading_charge) || 0) +
    (Number(form.unloading_charge) || 0) +
    (Number(form.detention_charge) || 0) +
    (Number(form.other_charges) || 0);

  const gstAmt = (subTotal * (Number(form.gst_rate) || 0)) / 100;
  const total = subTotal + gstAmt;

  const isIntraState = form.party_code === 'cgst_sgst' || (!form.party_code);

  async function handleSave(status = form.status) {
    if (!form.lr_number) return;
    setSaving(true);
    const payload = { ...form, gst_amount: gstAmt, total_amount: total, status: status || 'created', updated_at: new Date().toISOString() };

    let error;
    if (editId) {
      ({ error } = await api.from('lorry_receipts').update(payload).eq('id', editId));
    } else {
      ({ error } = await api.from('lorry_receipts').insert([payload]));
    }

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (!editId) onNav({ page: 'lr-list' });
    } else {
      alert('Save failed: ' + error.message);
    }
  }

  function toggleSection(key: string) {
    setExpanded(e => ({ ...e, [key]: !e[key] }));
  }

  const inputClass = "form-input";
  const labelClass = "form-label";

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Action Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => onNav({ page: 'lr-list' })} className="btn-ghost">
            <ArrowLeft size={15} />
            Back
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <span className="text-xs text-gray-400">Lorry Receipt</span>
            <div className="text-sm font-bold text-gray-900">{form.lr_number || 'New LR'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`btn-ghost ${showPreview ? 'text-brand' : ''}`}
          >
            <Eye size={15} />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={() => handleSave('created')} disabled={saving} className="btn-secondary">
            <Save size={15} />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Draft'}
          </button>
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer size={15} />
            Print
          </button>
          <button onClick={() => handleSave('in-transit')} disabled={saving} className="btn-primary">
            <FileText size={15} />
            Generate LR
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className={`flex-1 flex overflow-hidden`}>
        {/* Form Panel */}
        <div className={`${showPreview ? 'w-2/5' : 'w-full'} overflow-y-auto border-r border-gray-100 bg-[#F5F7FA]`}>
          <div className="p-5 space-y-3">
            {sections.map(s => (
              <div key={s.key} className="card overflow-hidden">
                <button
                  onClick={() => toggleSection(s.key)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-800 text-sm">{s.label}</span>
                  {expanded[s.key] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expanded[s.key] && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    {/* BASIC */}
                    {s.key === 'basic' && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className={labelClass}>LR Number</label>
                          <input className={inputClass} value={form.lr_number || ''} onChange={e => setField('lr_number', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Date</label>
                          <input type="date" className={inputClass} value={form.date || ''} onChange={e => setField('date', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Branch</label>
                          <input className={inputClass} placeholder="e.g. Coimbatore" value={form.branch || ''} onChange={e => setField('branch', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>From Location (Origin)</label>
                          <input className={inputClass} placeholder="e.g. Coimbatore" value={form.from_location || ''} onChange={e => setField('from_location', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>To Location</label>
                          <input className={inputClass} placeholder="e.g. Chennai" value={form.to_location || ''} onChange={e => setField('to_location', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Delivery At</label>
                          <input className={inputClass} placeholder="e.g. Pune" value={form.delivery_at || ''} onChange={e => setField('delivery_at', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>E-Way Bill No.</label>
                          <input className={inputClass} placeholder="Enter e-way bill" value={form.eway_bill_no || ''} onChange={e => setField('eway_bill_no', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Payment Terms</label>
                          <select className={inputClass} value={form.payment_terms || ''} onChange={e => setField('payment_terms', e.target.value)}>
                            <option>To Pay</option>
                            <option>Paid</option>
                            <option>TBB</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* CONSIGNOR */}
                    {s.key === 'consignor' && (
                      <div className="space-y-3 mt-4">
                        <div>
                          <label className={labelClass}>Select Customer</label>
                          <select className={inputClass} onChange={e => selectConsignor(e.target.value)} value={form.consignor_id || ''}>
                            <option value="">— Select —</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Consignor Name</label>
                            <input className={inputClass} value={form.consignor_name || ''} onChange={e => setField('consignor_name', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>GSTIN</label>
                            <input className={inputClass} value={form.consignor_gstin || ''} onChange={e => setField('consignor_gstin', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>Contact No.</label>
                            <input className={inputClass} value={form.consignor_phone || ''} onChange={e => setField('consignor_phone', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Address</label>
                          <textarea rows={2} className={inputClass} value={form.consignor_address || ''} onChange={e => setField('consignor_address', e.target.value)} />
                        </div>
                      </div>
                    )}

                    {/* CONSIGNEE */}
                    {s.key === 'consignee' && (
                      <div className="space-y-3 mt-4">
                        <div>
                          <label className={labelClass}>Select Customer</label>
                          <select className={inputClass} onChange={e => selectConsignee(e.target.value)} value={form.consignee_id || ''}>
                            <option value="">— Select —</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Consignee Name</label>
                            <input className={inputClass} value={form.consignee_name || ''} onChange={e => setField('consignee_name', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>GSTIN</label>
                            <input className={inputClass} value={form.consignee_gstin || ''} onChange={e => setField('consignee_gstin', e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>Phone</label>
                            <input className={inputClass} value={form.consignee_phone || ''} onChange={e => setField('consignee_phone', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Address</label>
                          <textarea rows={2} className={inputClass} value={form.consignee_address || ''} onChange={e => setField('consignee_address', e.target.value)} />
                        </div>
                      </div>
                    )}

                    {/* TRANSPORT */}
                    {s.key === 'transport' && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                          <label className={labelClass}>Select Vehicle</label>
                          <select className={inputClass} onChange={e => selectVehicle(e.target.value)} value={form.vehicle_id || ''}>
                            <option value="">— Select —</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Vehicle No.</label>
                          <input className={inputClass} value={form.vehicle_number || ''} onChange={e => setField('vehicle_number', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Select Driver</label>
                          <select className={inputClass} onChange={e => selectDriver(e.target.value)} value={form.driver_id || ''}>
                            <option value="">— Select —</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Driver Name</label>
                          <input className={inputClass} value={form.driver_name || ''} onChange={e => setField('driver_name', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Driver Phone</label>
                          <input className={inputClass} value={form.driver_phone || ''} onChange={e => setField('driver_phone', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Carrier GSTIN</label>
                          <input className={inputClass} value={form.carrier_gstin || ''} onChange={e => setField('carrier_gstin', e.target.value)} />
                        </div>
                      </div>
                    )}

                    {/* GOODS */}
                    {s.key === 'goods' && (
                      <div className="mt-4 space-y-3">
                        {(form.goods || []).map((g, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-3 relative">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500">Item {i + 1}</span>
                              {(form.goods || []).length > 1 && (
                                <button onClick={() => removeGoods(i)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            <div>
                              <label className={labelClass}>Description</label>
                              <input className={inputClass} value={g.description} onChange={e => updateGoods(i, 'description', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className={labelClass}>Packages</label>
                                <input className={inputClass} type="number" value={g.packages as string} onChange={e => updateGoods(i, 'packages', e.target.value)} />
                              </div>
                              <div>
                                <label className={labelClass}>Actual Wt (KG)</label>
                                <input className={inputClass} type="number" value={g.actual_weight as string} onChange={e => updateGoods(i, 'actual_weight', e.target.value)} />
                              </div>
                              <div>
                                <label className={labelClass}>Charged Wt (KG)</label>
                                <input className={inputClass} type="number" value={g.charged_weight as string} onChange={e => updateGoods(i, 'charged_weight', e.target.value)} />
                              </div>
                              <div>
                                <label className={labelClass}>Invoice No.</label>
                                <input className={inputClass} value={g.invoice_no} onChange={e => updateGoods(i, 'invoice_no', e.target.value)} />
                              </div>
                              <div>
                                <label className={labelClass}>Invoice Date</label>
                                <input type="date" className={inputClass} value={g.invoice_date} onChange={e => updateGoods(i, 'invoice_date', e.target.value)} />
                              </div>
                              <div>
                                <label className={labelClass}>Value (₹)</label>
                                <input className={inputClass} type="number" value={g.value as string} onChange={e => updateGoods(i, 'value', e.target.value)} />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={addGoods} className="btn-ghost w-full justify-center border border-dashed border-gray-300">
                          <Plus size={14} /> Add Item
                        </button>
                      </div>
                    )}

                    {/* CHARGES */}
                    {s.key === 'charges' && (
                      <div className="space-y-3 mt-4">
                        {[
                          { label: 'Freight Charge', field: 'freight_charge' as const },
                          { label: 'Loading Charge', field: 'loading_charge' as const },
                          { label: 'Unloading Charge', field: 'unloading_charge' as const },
                          { label: 'Detention / Halting', field: 'detention_charge' as const },
                          { label: 'Other Charges', field: 'other_charges' as const },
                        ].map(({ label, field }) => (
                          <div key={field} className="flex items-center justify-between gap-4">
                            <label className="text-sm text-gray-600 flex-1">{label}</label>
                            <input
                              type="number"
                              className="form-input w-32 text-right"
                              value={form[field] || ''}
                              onChange={e => setField(field, Number(e.target.value))}
                            />
                          </div>
                        ))}
                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
                          <label className="text-sm text-gray-600 flex-1">GST Type</label>
                          <select 
                            className="form-input w-32 text-right" 
                            value={form.party_code || (isIntraState ? 'cgst_sgst' : 'igst')} 
                            onChange={e => setField('party_code', e.target.value)}
                          >
                            <option value="cgst_sgst">CGST + SGST</option>
                            <option value="igst">IGST</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <label className="text-sm text-gray-600 flex-1">GST Rate (%)</label>
                          <select className="form-input w-32 text-right" value={form.gst_rate || 0} onChange={e => setField('gst_rate', Number(e.target.value))}>
                            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </div>
                        <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 space-y-1 mt-3">
                          <div className="flex justify-between text-sm"><span className="text-gray-500">Sub Total</span><span>₹{subTotal.toLocaleString('en-IN')}</span></div>
                          {gstAmt > 0 && (
                            isIntraState ? (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">CGST ({(form.gst_rate || 0) / 2}%)</span>
                                  <span>₹{(gstAmt / 2).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">SGST ({(form.gst_rate || 0) / 2}%)</span>
                                  <span>₹{(gstAmt / 2).toLocaleString('en-IN')}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">IGST ({form.gst_rate}%)</span>
                                <span>₹{gstAmt.toLocaleString('en-IN')}</span>
                              </div>
                            )
                          )}
                          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-brand/20 mt-1">
                            <span>Total Amount</span>
                            <span className="text-brand">₹{total.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    )}


                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PDF Preview Panel */}
        {showPreview && (
          <div className="flex-1 overflow-y-auto bg-gray-200 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-xs text-gray-400 text-center mb-3 font-medium">LIVE PREVIEW — updates as you type</div>
              <div className="shadow-2xl rounded-xl overflow-hidden print-area">
                <LRPdfPreview lr={form} company={company} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
