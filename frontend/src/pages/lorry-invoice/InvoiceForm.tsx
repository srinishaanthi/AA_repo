import { useState, useEffect } from 'react';
import { api, getNextNumber } from '../../lib/api';
import { LorryInvoice, LorryReceipt, Customer, CompanySettings, Bank, InvoiceGoodsLine, NavState } from '../../types';
import InvoicePdfPreview from './InvoicePdfPreview';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Save, Printer, ArrowLeft, Eye, Plus, Trash2, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';

const emptyGoods = (): any => ({ lr_number: '', lr_date: '', vehicle_number: '', from_location: '', to_location: '', description: '', packages: '', actual_weight: '', chargeable_weight: '' });

interface Props { editId?: string; onNav: (s: NavState) => void; }

export default function InvoiceForm({ editId, onNav }: Props) {
  const [form, setForm] = useState<Partial<LorryInvoice>>({
    date: new Date().toISOString().split('T')[0],
    goods: [emptyGoods()],
    freight_charge: 0, loading_charge: 0, unloading_charge: 0, halting_charge: 0, toll_charge: 0,
    detention_charge: 0, fuel_surcharge: 0, st_charge: 0, other_charges: 0,
    gst_rate: 0, gst_amount: 0, total_amount: 0, status: 'draft',
  });
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [lrs, setLRs] = useState<LorryReceipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true, billto: true, transport: true, goods: true, charges: true, remarks: false,
  });

  useEffect(() => { loadMaster(); if (editId) loadInvoice(editId); else genNumber(); }, [editId]);

  async function loadMaster() {
    const [compRes, bankRes, lrRes, custRes] = await Promise.all([
      api.from('company_settings').select('*').maybeSingle(),
      api.from('banks').select('*').eq('is_primary', true).maybeSingle(),
      api.from('lorry_receipts').select('*').order('created_at', { ascending: false }),
      api.from('customers').select('*').order('name'),
    ]);
    setCompany(compRes.data);
    setBank(bankRes.data);
    setLRs(lrRes.data || []);
    setCustomers(custRes.data || []);
  }

  async function genNumber() {
    const n = await getNextNumber('invoice');
    setForm(f => ({ ...f, invoice_number: n }));
  }

  async function loadInvoice(id: string) {
    const { data } = await api.from('lorry_invoices').select('*').eq('id', id).maybeSingle();
    if (data) setForm({ ...data, goods: data.goods || [emptyGoods()] });
  }

  function selectLR(lrId: string) {
    const lr = lrs.find(l => l.id === lrId);
    if (!lr) return;
    const cust = customers.find(c => c.id === lr.consignee_id || c.name === lr.consignee_name);
    
    // Sum weights and packages from LR goods
    const goodsList = lr.goods || [];
    const material_description = goodsList.map((g: any) => g.description).join(', ');
    const no_of_packages = goodsList.reduce((acc: number, g: any) => acc + (Number(g.packages) || 0), 0);
    const actual_weight = goodsList.reduce((acc: number, g: any) => acc + (Number(g.actual_weight) || 0), 0);
    const chargeable_weight = goodsList.reduce((acc: number, g: any) => acc + (Number(g.charged_weight) || 0), 0);

    setForm(f => ({
      ...f,
      lr_id: lr.id,
      lr_number: lr.lr_number,
      lr_date: lr.date || '',
      vehicle_number: lr.vehicle_number || '',
      driver_name: lr.driver_name || '',
      from_location: lr.from_location || '',
      to_location: lr.to_location || '',
      trip_date: lr.trip_date || '',
      delivery_date: lr.delivery_date || '',
      consignor_name: lr.consignor_name || '',
      consignee_name: lr.consignee_name || '',
      material_description,
      no_of_packages: no_of_packages || '',
      actual_weight: actual_weight || '',
      chargeable_weight: chargeable_weight || '',
      customer_name: lr.consignee_name || '',
      customer_gstin: lr.consignee_gstin || '',
      customer_address: lr.consignee_address || '',
      customer_phone: cust?.phone || lr.consignee_phone || '',
      customer_state: cust?.state || '',
      customer_contact_person: cust?.contact_person || '',
      freight_charge: lr.freight_charge || 0,
      loading_charge: lr.loading_charge || 0,
      unloading_charge: lr.unloading_charge || 0,
      halting_charge: 0,
      toll_charge: 0,
      detention_charge: lr.detention_charge || 0,
      other_charges: lr.other_charges || 0,
    }));
  }

  function setF(field: keyof LorryInvoice, val: unknown) { setForm(f => ({ ...f, [field]: val })); }

  function updateGoods(i: number, field: keyof InvoiceGoodsLine, val: string) {
    setForm(f => {
      const g = [...(f.goods || [])];
      g[i] = { ...g[i], [field]: val };
      return { ...f, goods: g };
    });
  }

  const subTotal = (Number(form.freight_charge) || 0) + (Number(form.loading_charge) || 0) +
    (Number(form.unloading_charge) || 0) + (Number(form.halting_charge) || 0) +
    (Number(form.toll_charge) || 0) + (Number(form.detention_charge) || 0) +
    (Number(form.fuel_surcharge) || 0) + (Number(form.st_charge) || 0) +
    (Number(form.other_charges) || 0);
  const gstAmt = (subTotal * (Number(form.gst_rate) || 0)) / 100;
  const grandTotal = subTotal + gstAmt;

  const customerState = (form.customer_state || '').trim().toLowerCase();
  const isIntraState = form.party_code === 'cgst_sgst' || 
    (form.party_code !== 'igst' && (!customerState || customerState === 'tamil nadu' || customerState === 'tamilnadu' || customerState === 'tn'));

  async function handleSave(status = form.status) {
    if (!form.invoice_number) return;
    setSaving(true);
    const payload = { ...form, gst_amount: gstAmt, total_amount: grandTotal, status, updated_at: new Date().toISOString() };
    let error;
    if (editId) ({ error } = await api.from('lorry_invoices').update(payload).eq('id', editId));
    else ({ error } = await api.from('lorry_invoices').insert([payload]));
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); if (!editId) onNav({ page: 'invoice-list' }); }
    else alert('Save failed: ' + error.message);
  }

  const inp = 'form-input';
  const lbl = 'form-label';
  const toggle = (k: string) => setExpanded(e => ({ ...e, [k]: !e[k] }));

  const handleDownload = async () => {
    let wasHidden = !showPreview;
    if (wasHidden) {
      setShowPreview(true);
      // Wait for DOM to render the preview if it was hidden
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Capture the actual fixed-width invoice, not the responsive container!
    const element = document.querySelector('.pdf-preview') as HTMLElement;
    if (!element) return;
    
    // Ensure all web fonts are fully loaded before capturing
    await document.fonts.ready;
    
    // Scale up for crisp text and avoid scroll offsets
    const opt = {
      margin:       0,
      filename:     `${form.invoice_number || 'invoice'}.pdf`,
      image:        { type: 'jpeg', quality: 1 },
      html2canvas:  { scale: 3, useCORS: true, windowWidth: element.scrollWidth, scrollY: 0, scrollX: 0, letterRendering: true },
      // Use exact un-clipped dimensions of the element so it fits perfectly on 1 page!
      jsPDF:        { unit: 'px', format: [element.scrollWidth, element.scrollHeight], orientation: 'portrait' }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error('Download failed', e);
      alert('Failed to generate PDF.');
    }
    
    if (wasHidden) {
      setShowPreview(false);
    }
  };

  const secs = [
    { key: 'basic', label: 'Invoice Details' },
    { key: 'billto', label: 'Bill To' },
    { key: 'transport', label: 'Transport Details' },
    { key: 'goods', label: 'Goods' },
    { key: 'charges', label: 'Charges' },
    { key: 'remarks', label: 'Remarks & Terms' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      <style>{`
        @media print {
          body {
            visibility: hidden !important;
            background: white !important;
          }
          .print-wrapper {
            display: block !important;
          }
          #print-section {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #print-section * {
            visibility: visible !important;
          }
        }
      `}</style>
      {/* Action Bar */}
      <div className="no-print bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => onNav({ page: 'invoice-list' })} className="btn-ghost"><ArrowLeft size={15} /> Back</button>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <span className="text-xs text-gray-400">Lorry Invoice</span>
            <div className="text-sm font-bold text-gray-900">{form.invoice_number || 'New Invoice'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(p => !p)} className={`btn-ghost ${showPreview ? 'text-brand' : ''}`}>
            <Eye size={15} />{showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary">
            <Save size={15} />{saving ? 'Saving…' : saved ? 'Saved!' : 'Save Draft'}
          </button>
          <button onClick={handleDownload} className="btn-secondary">
            <Download size={15} /> Download PDF
          </button>
          <button onClick={() => window.print()} className="btn-secondary"><Printer size={15} /> Print</button>
          <button onClick={() => handleSave('issued')} disabled={saving} className="btn-primary">
            <FileText size={15} /> Generate Invoice
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Form */}
        <div className={`no-print ${showPreview ? 'w-2/5' : 'w-full'} overflow-y-auto border-r border-gray-100 bg-[#F5F7FA]`}>
          <div className="p-5 space-y-3">
            {secs.map(s => (
              <div key={s.key} className="card overflow-hidden">
                <button onClick={() => toggle(s.key)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50">
                  <span className="font-semibold text-gray-800 text-sm">{s.label}</span>
                  {expanded[s.key] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {expanded[s.key] && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    {s.key === 'basic' && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className={lbl}>Invoice Number</label>
                          <input className={inp} value={form.invoice_number || ''} onChange={e => setF('invoice_number', e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>Date</label>
                          <input type="date" className={inp} value={form.date || ''} onChange={e => setF('date', e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>Select LR</label>
                          <select className={inp} onChange={e => selectLR(e.target.value)} value={form.lr_id || ''}>
                            <option value="">— Select LR to auto-fill —</option>
                            {lrs.map(l => <option key={l.id} value={l.id}>{l.lr_number} — {l.consignee_name || ''}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Branch</label>
                          <input className={inp} value={form.branch || ''} onChange={e => setF('branch', e.target.value)} />
                        </div>
                      </div>
                    )}

                    {s.key === 'billto' && (
                      <div className="space-y-3 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lbl}>Customer Name</label>
                            <input className={inp} value={form.customer_name || ''} onChange={e => setF('customer_name', e.target.value)} />
                          </div>
                          <div>
                            <label className={lbl}>GSTIN</label>
                            <input className={inp} value={form.customer_gstin || ''} onChange={e => setF('customer_gstin', e.target.value)} />
                          </div>
                          <div>
                            <label className={lbl}>State</label>
                            <input className={inp} value={form.customer_state || ''} onChange={e => setF('customer_state', e.target.value)} />
                          </div>
                          <div>
                            <label className={lbl}>Contact Person</label>
                            <input className={inp} value={form.customer_contact_person || ''} onChange={e => setF('customer_contact_person', e.target.value)} />
                          </div>
                          <div className="col-span-2">
                            <label className={lbl}>Mobile / Phone</label>
                            <input className={inp} value={form.customer_phone || ''} onChange={e => setF('customer_phone', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className={lbl}>Billing Address</label>
                          <textarea rows={2} className={inp} value={form.customer_address || ''} onChange={e => setF('customer_address', e.target.value)} />
                        </div>
                      </div>
                    )}

                    {s.key === 'transport' && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div><label className={lbl}>LR No.</label><input className={inp} value={form.lr_number || ''} onChange={e => setF('lr_number', e.target.value)} /></div>
                        <div><label className={lbl}>LR Date</label><input type="date" className={inp} value={form.lr_date || ''} onChange={e => setF('lr_date', e.target.value)} /></div>
                        <div><label className={lbl}>Vehicle No.</label><input className={inp} value={form.vehicle_number || ''} onChange={e => setF('vehicle_number', e.target.value)} /></div>
                        <div><label className={lbl}>From</label><input className={inp} value={form.from_location || ''} onChange={e => setF('from_location', e.target.value)} /></div>
                        <div><label className={lbl}>To</label><input className={inp} value={form.to_location || ''} onChange={e => setF('to_location', e.target.value)} /></div>
                        <div><label className={lbl}>Consignor</label><input className={inp} value={form.consignor_name || ''} onChange={e => setF('consignor_name', e.target.value)} /></div>
                        <div><label className={lbl}>Consignee</label><input className={inp} value={form.consignee_name || ''} onChange={e => setF('consignee_name', e.target.value)} /></div>
                        <div><label className={lbl}>No. of Packages</label><input className={inp} value={form.no_of_packages || ''} onChange={e => setF('no_of_packages', e.target.value)} /></div>
                        <div><label className={lbl}>Actual Weight</label><input className={inp} value={form.actual_weight || ''} onChange={e => setF('actual_weight', e.target.value)} /></div>
                        <div><label className={lbl}>Chargeable Weight</label><input className={inp} value={form.chargeable_weight || ''} onChange={e => setF('chargeable_weight', e.target.value)} /></div>
                        <div className="col-span-2"><label className={lbl}>Material Description</label><textarea rows={2} className={inp} value={form.material_description || ''} onChange={e => setF('material_description', e.target.value)} /></div>
                      </div>
                    )}

                    {s.key === 'goods' && (
                      <div className="mt-4 space-y-3">
                        {(form.goods || []).map((g: any, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                              <span className="text-xs font-bold text-gray-700">Additional Item {i + 1}</span>
                              <button onClick={() => setForm(f => ({ ...f, goods: (f.goods || []).filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600">
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div><label className={lbl}>LR No & Date</label>
                                <div className="flex gap-2">
                                  <input className={inp} placeholder="LR No" value={g.lr_number || ''} onChange={e => updateGoods(i, 'lr_number', e.target.value)} />
                                  <input type="date" className={inp} value={g.lr_date || ''} onChange={e => updateGoods(i, 'lr_date', e.target.value)} />
                                </div>
                              </div>
                              <div><label className={lbl}>Vehicle No</label><input className={inp} value={g.vehicle_number || ''} onChange={e => updateGoods(i, 'vehicle_number', e.target.value)} /></div>
                              <div><label className={lbl}>From</label><input className={inp} value={g.from_location || ''} onChange={e => updateGoods(i, 'from_location', e.target.value)} /></div>
                              <div><label className={lbl}>To</label><input className={inp} value={g.to_location || ''} onChange={e => updateGoods(i, 'to_location', e.target.value)} /></div>
                              <div className="col-span-2"><label className={lbl}>Material Description</label><textarea rows={2} className={inp} value={g.description || ''} onChange={e => updateGoods(i, 'description', e.target.value)} /></div>
                              <div><label className={lbl}>Packages</label><input type="number" className={inp} value={g.packages || ''} onChange={e => updateGoods(i, 'packages', e.target.value)} /></div>
                              <div><label className={lbl}>Actual Wt (kg)</label><input type="number" className={inp} value={g.actual_weight || ''} onChange={e => updateGoods(i, 'actual_weight', e.target.value)} /></div>
                              <div><label className={lbl}>Chargeable Wt (kg)</label><input type="number" className={inp} value={g.chargeable_weight || ''} onChange={e => updateGoods(i, 'chargeable_weight', e.target.value)} /></div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setForm(f => ({ ...f, goods: [...(f.goods || []), emptyGoods()] }))} className="btn-ghost w-full justify-center border border-dashed border-gray-300 bg-white">
                          <Plus size={14} /> Add Item
                        </button>
                      </div>
                    )}

                    {s.key === 'charges' && (
                      <div className="space-y-3 mt-4">
                        {([
                          ['Freight Charges', 'freight_charge'],
                          ['Loading Charges', 'loading_charge'],
                          ['Unloading Charges', 'unloading_charge'],
                          ['Halting Charges', 'halting_charge'],
                          ['Toll Charges', 'toll_charge'],
                          ['Detention Charges', 'detention_charge'],
                          ['Other Charges', 'other_charges'],
                        ] as [string, keyof LorryInvoice][]).map(([label, field]) => (
                          <div key={field} className="flex items-center justify-between gap-4">
                            <label className="text-sm text-gray-600 flex-1">{label}</label>
                            <input type="number" className="form-input w-32 text-right" value={form[field] as number || ''} onChange={e => setF(field, Number(e.target.value))} />
                          </div>
                        ))}
                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
                          <label className="text-sm text-gray-600 flex-1">GST Type</label>
                          <select 
                            className="form-input w-32 text-right" 
                            value={form.party_code || (isIntraState ? 'cgst_sgst' : 'igst')} 
                            onChange={e => setF('party_code', e.target.value)}
                          >
                            <option value="cgst_sgst">CGST + SGST</option>
                            <option value="igst">IGST</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <label className="text-sm text-gray-600 flex-1">GST Rate (%)</label>
                          <select className="form-input w-32 text-right" value={form.gst_rate || 0} onChange={e => setF('gst_rate', Number(e.target.value))}>
                            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </div>
                        <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 space-y-1">
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
                          <div className="flex justify-between font-bold pt-1 border-t border-brand/20"><span>Grand Total</span><span className="text-brand text-lg">₹{grandTotal.toLocaleString('en-IN')}</span></div>
                        </div>
                      </div>
                    )}

                    {s.key === 'remarks' && (
                      <div className="space-y-4 mt-4">
                        <div><label className={lbl}>Remarks</label><textarea rows={3} className={inp} value={form.remarks || ''} onChange={e => setF('remarks', e.target.value)} /></div>
                        <div><label className={lbl}>Terms & Conditions</label><textarea rows={4} className={inp} value={form.terms || company?.terms || ''} onChange={e => setF('terms', e.target.value)} /></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className={`flex-1 overflow-auto bg-gray-200 p-6 print-wrapper ${showPreview ? 'block' : 'hidden'}`}>
          <div className="min-w-fit mx-auto">
            <div className="text-xs text-gray-400 text-center mb-3 font-medium no-print">LIVE PREVIEW — updates as you type</div>
            <div id="print-section" className="shadow-2xl rounded-xl overflow-hidden print:!shadow-none print:!rounded-none">
              <InvoicePdfPreview invoice={form} company={company} bank={bank} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
