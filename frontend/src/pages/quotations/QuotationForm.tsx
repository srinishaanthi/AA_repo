import { useState, useEffect } from 'react';
import { api, getNextNumber } from '../../lib/api';
import { Quotation, Customer, NavState, CompanySettings, Bank } from '../../types';
import QuotationPdfPreview from './QuotationPdfPreview';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Save, Printer, ArrowLeft, Eye, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface Props { editId?: string; onNav: (s: NavState) => void; }

export default function QuotationForm({ editId, onNav }: Props) {
  const [form, setForm] = useState<Partial<Quotation>>({
    date: new Date().toISOString().split('T')[0],
    rate: 0, loading_charge: 0, unloading_charge: 0, other_charges: 0,
    gst_rate: 0, gst_amount: 0, total_amount: 0, status: 'draft',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true, customer: true, transport: true, charges: true, remarks: false,
  });

  useEffect(() => {
    api.from('company_settings').select('*').maybeSingle().then(r => setCompany(r.data));
    api.from('banks').select('*').eq('is_primary', true).maybeSingle().then(r => setBank(r.data));
    api.from('customers').select('*').order('name').then(r => setCustomers(r.data || []));
    if (editId) api.from('quotations').select('*').eq('id', editId).maybeSingle().then(r => { if (r.data) setForm(r.data); });
    else getNextNumber('quotation').then(n => setForm(f => ({ ...f, quotation_number: n })));
  }, [editId]);

  function setF(field: keyof Quotation, val: unknown) { setForm(f => ({ ...f, [field]: val })); }

  function selectCustomer(id: string) {
    const c = customers.find(x => x.id === id);
    if (!c) {
      setForm(f => ({ ...f, customer_id: '', customer_name: '' }));
      return;
    }
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
    if (!error) {
      setSaved(true); 
      setTimeout(() => setSaved(false), 2000); 
      if (!editId) onNav({ page: 'quotation-list' });
    }
    else alert('Save failed: ' + error.message);
  }

  const handlePrint = async () => {
    let wasHidden = !showPreview;
    if (wasHidden) {
      setShowPreview(true);
      await new Promise(r => setTimeout(r, 100));
    }
    const originalTitle = document.title;
    document.title = `${form.quotation_number || 'Quotation'}`;
    window.print();
    document.title = originalTitle;
    if (wasHidden) setShowPreview(false);
  };

  const downloadPDF = async () => {
    let wasHidden = !showPreview;
    if (wasHidden) {
      setShowPreview(true);
      await new Promise(r => setTimeout(r, 100));
    }
    const element = document.getElementById('print-section');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Quotation_${form.quotation_number || 'New'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
    if (wasHidden) setShowPreview(false);
  };

  const inp = 'form-input';
  const lbl = 'form-label';
  const toggle = (k: string) => setExpanded(e => ({ ...e, [k]: !e[k] }));

  const secs = [
    { key: 'basic', label: 'Quotation Details' },
    { key: 'customer', label: 'Customer Details' },
    { key: 'transport', label: 'Requirements' },
    { key: 'charges', label: 'Charges & Payment' },
    { key: 'remarks', label: 'Terms & Remarks' },
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
          <button onClick={() => onNav({ page: 'quotation-list' })} className="btn-ghost"><ArrowLeft size={15} /> Back</button>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <span className="text-xs text-gray-400">Quotation</span>
            <div className="text-sm font-bold text-gray-900">{form.quotation_number || 'New Quotation'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(p => !p)} className={`btn-ghost ${showPreview ? 'text-brand' : ''}`}>
            <Eye size={15} />{showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary">
            <Save size={15} />{saving ? 'Saving…' : saved ? 'Saved!' : 'Save Draft'}
          </button>
          <button onClick={downloadPDF} className="btn-secondary text-brand hover:text-brand-dark border-brand/20 hover:border-brand/40 bg-brand/5 hover:bg-brand/10 transition-colors">
            <Download size={15} /> Download PDF
          </button>
          <button onClick={handlePrint} className="btn-secondary"><Printer size={15} /> Print</button>
          <button onClick={() => handleSave('sent')} disabled={saving} className="btn-primary">
            <FileText size={15} /> Generate & Send
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Form */}
        <div className={`no-print w-full overflow-y-auto bg-[#F5F7FA] ${showPreview ? 'hidden' : 'block'}`}>
          <div className="p-5 space-y-3 max-w-4xl mx-auto">
            {secs.map(s => (
              <div key={s.key} className="card overflow-hidden">
                <button onClick={() => toggle(s.key)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50">
                  <span className="font-semibold text-gray-800 text-sm">{s.label}</span>
                  {expanded[s.key] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                
                {expanded[s.key] && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    
                    {s.key === 'basic' && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div><label className={lbl}>Quotation Number</label><input className={inp} value={form.quotation_number || ''} onChange={e => setF('quotation_number', e.target.value)} /></div>
                        <div><label className={lbl}>Date</label><input type="date" className={inp} value={form.date || ''} onChange={e => setF('date', e.target.value)} /></div>
                        <div><label className={lbl}>Valid Till</label><input type="date" className={inp} value={form.valid_till || ''} onChange={e => setF('valid_till', e.target.value)} /></div>
                        <div><label className={lbl}>Status</label>
                          <select className={inp} value={form.status || 'draft'} onChange={e => setF('status', e.target.value)}>
                            {['draft', 'sent', 'approved', 'rejected'].map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {s.key === 'customer' && (
                      <div className="grid grid-cols-2 gap-4 mt-4 bg-white p-4 border border-gray-100 rounded-xl shadow-sm">
                        <div><label className={lbl}>Select Customer</label>
                          <select className={inp} onChange={e => selectCustomer(e.target.value)} value={form.customer_id || ''}>
                            <option value="">— Select Customer —</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div><label className={lbl}>Customer Name (Custom)</label><input className={inp} value={form.customer_name || ''} onChange={e => setF('customer_name', e.target.value)} /></div>
                      </div>
                    )}

                    {s.key === 'transport' && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div><label className={lbl}>From (Origin)</label><input className={inp} placeholder="e.g. Coimbatore" value={form.from_location || ''} onChange={e => setF('from_location', e.target.value)} /></div>
                        <div><label className={lbl}>To (Destination)</label><input className={inp} placeholder="e.g. Chennai" value={form.to_location || ''} onChange={e => setF('to_location', e.target.value)} /></div>
                        <div><label className={lbl}>Vehicle Type</label>
                          <input className={inp} placeholder="e.g. Mini Truck, Multi Axle..." value={form.vehicle_type || ''} onChange={e => setF('vehicle_type', e.target.value)} />
                        </div>
                        <div><label className={lbl}>Estimated Weight (KG)</label><input type="number" className={inp} value={form.weight || ''} onChange={e => setF('weight', Number(e.target.value))} /></div>
                      </div>
                    )}

                    {s.key === 'charges' && (
                      <div className="mt-4 flex flex-col md:flex-row gap-6">
                        <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                <th className="p-3 font-medium">Charge Details</th>
                                <th className="p-3 font-medium w-48 text-right">Amount (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {[
                                { label: 'Freight Rate', field: 'rate' as const },
                                { label: 'Loading Charge', field: 'loading_charge' as const },
                                { label: 'Unloading Charge', field: 'unloading_charge' as const },
                                { label: 'Other Charges', field: 'other_charges' as const },
                              ].map(({ label, field }) => (
                                <tr key={field} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-3 text-sm text-gray-700 font-medium">{label}</td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      className="w-full text-right bg-transparent border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-md px-2 py-1.5 text-sm outline-none transition-shadow"
                                      value={form[field] as number || ''}
                                      onChange={e => setF(field, Number(e.target.value))}
                                    />
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td className="p-3 text-sm text-gray-700 font-medium">GST Rate (%)</td>
                                <td className="p-2">
                                  <select
                                    className="w-full text-right bg-white border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-md px-2 py-1.5 text-sm outline-none transition-shadow"
                                    value={form.gst_rate || 0}
                                    onChange={e => setF('gst_rate', Number(e.target.value))}
                                  >
                                    {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                                  </select>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Payment Summary Widget */}
                        <div className="md:w-80 shrink-0">
                          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <h4 className="text-slate-400 text-xs font-semibold mb-5 uppercase tracking-widest flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-brand"></span>
                              Payment Summary
                            </h4>
                            <div className="space-y-3.5">
                              <div className="flex justify-between text-sm items-center"><span className="text-slate-300">Sub Total</span><span className="font-medium text-base">₹{subtotal.toLocaleString('en-IN')}</span></div>
                              {gstAmt > 0 && (
                                <div className="flex justify-between text-sm"><span className="text-slate-400">GST ({form.gst_rate}%)</span><span>₹{gstAmt.toLocaleString('en-IN')}</span></div>
                              )}
                            </div>

                            <div className="mt-5 pt-5 border-t border-slate-700/50 space-y-4">
                              <div className="flex justify-between items-end">
                                <span className="text-slate-300 text-sm font-medium">Grand Total</span>
                                <span className="text-2xl font-bold text-brand-400 tracking-tight">₹{grandTotal.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.key === 'remarks' && (
                      <div className="mt-4">
                        <label className={lbl}>Remarks</label>
                        <textarea rows={3} className={inp} placeholder="Any special remarks…" value={form.remarks || ''} onChange={e => setF('remarks', e.target.value)} />
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
            <div id="print-section" className="shadow-2xl overflow-hidden print:!shadow-none print:!rounded-none relative">
              <QuotationPdfPreview quotation={form} company={company} onDownload={downloadPDF} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
