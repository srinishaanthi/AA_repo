import { useState, useEffect } from 'react';
import { api, getNextNumber } from '../../lib/api';
import { Quotation, Customer, NavState, CompanySettings, Bank } from '../../types';
import QuotationPdfPreview from './QuotationPdfPreview';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Save, Printer, ArrowLeft, Eye, FileText, Download, ChevronDown, ChevronUp, MessageCircle, Mail, ArrowRight } from 'lucide-react';

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

  const sendWhatsApp = () => {
    const text = `Quotation ${form.quotation_number || ''}\n\nHi ${form.customer_name || ''},\n\nPlease find the details of our quotation for your transport requirements.\n\nFrom: ${form.from_location || ''}\nTo: ${form.to_location || ''}\nVehicle: ${form.vehicle_type || ''}\nFreight Rate: Rs. ${form.rate || ''}\n\nPlease let us know if you have any questions.\n\nThank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '', attachPdf: true });
  const [emailEdited, setEmailEdited] = useState(false);
  const [previewTab, setPreviewTab] = useState<'pdf' | 'email'>('pdf');

  useEffect(() => {
    if (!emailEdited) {
      const customer = customers.find(c => c.id === form.customer_id);
      setEmailData(d => ({
        ...d,
        to: customer?.email || '',
        subject: `Quotation ${form.quotation_number || ''}`,
        body: `Hi ${form.customer_name || ''},\n\nPlease find attached the quotation ${form.quotation_number || ''} for your transport requirements.\n\nFrom: ${form.from_location || ''}\nTo: ${form.to_location || ''}\nVehicle: ${form.vehicle_type || ''}\nFreight Rate: Rs. ${form.rate || ''}\n\nPlease let us know if you have any questions.\n\nThank you!`
      }));
    }
  }, [form.customer_id, form.quotation_number, form.customer_name, form.from_location, form.to_location, form.vehicle_type, form.rate, customers, emailEdited]);

  const resetEmail = () => { setEmailEdited(false); };

  const confirmSendEmail = async () => {
    setSaving(true);
    let pdfBase64 = null;
    let wasHidden = !showPreview;
    let previousTab = previewTab;

    if (emailData.attachPdf) {
      if (wasHidden) setShowPreview(true);
      if (previewTab !== 'pdf') setPreviewTab('pdf');
      
      // Wait for DOM to update and render the PDF tab
      await new Promise(r => setTimeout(r, 150));
      
      const element = document.getElementById('print-section');
      if (element) {
        const opt = {
          margin: 0,
          filename: `Quotation_${form.quotation_number || 'New'}.pdf`,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        pdfBase64 = await html2pdf().set(opt).from(element).outputPdf('datauristring');
      }
    }

    try {
      const payload: any = {
        to_email: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
      };
      
      if (pdfBase64) {
        payload.attachment_base64 = pdfBase64;
        payload.filename = `Quotation_${form.quotation_number || 'New'}.pdf`;
      }
      
      const res = await fetch('http://localhost:8000/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to send email');
      }
      
      alert("Email sent successfully!");
    } catch (e: any) {
      alert("Error sending email: " + e.message);
    } finally {
      if (wasHidden && emailData.attachPdf) setShowPreview(false);
      if (previousTab !== 'pdf') setPreviewTab(previousTab);
      setSaving(false);
    }
  };

  const convertToLR = async () => {
    if (!editId) { alert('Please save the quotation first.'); return; }
    await handleSave('converted');
    onNav({ page: 'lr-create', fromQuotationId: editId });
  };

  const convertToInvoice = async () => {
    if (!editId) { alert('Please save the quotation first.'); return; }
    await handleSave('converted');
    onNav({ page: 'invoice-create', fromQuotationId: editId });
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
          {editId && (
            <>
              <button onClick={sendWhatsApp} className="btn-secondary text-green-600 border-green-200 hover:bg-green-50" title="Send by WhatsApp"><MessageCircle size={15} /></button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button onClick={convertToLR} className="btn-secondary text-purple-600 border-purple-200 hover:bg-purple-50 flex items-center gap-1"><ArrowRight size={13} /> LR</button>
              <button onClick={convertToInvoice} className="btn-secondary text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1"><ArrowRight size={13} /> Invoice</button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
            </>
          )}
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
                            {['draft', 'sent', 'accepted', 'rejected', 'converted'].map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
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
          <div className="min-w-fit mx-auto max-w-[794px]">
            
            <div className="no-print flex items-center justify-center mb-4 space-x-2">
              <button 
                onClick={() => setPreviewTab('pdf')} 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${previewTab === 'pdf' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300/50'}`}
              >
                Quotation Preview
              </button>
              <button 
                onClick={() => setPreviewTab('email')} 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${previewTab === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300/50'}`}
              >
                <Mail size={14} /> Email Preview
              </button>
            </div>

            {previewTab === 'email' && (
              <div className="no-print mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Mail size={18} className="text-blue-600" /> Email Editor
                  </h3>
                  <button onClick={resetEmail} className="text-xs text-blue-600 hover:underline">Reset to Default</button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="form-label">To Email</label>
                    <input className="form-input" value={emailData.to} onChange={e => { setEmailEdited(true); setEmailData(d => ({ ...d, to: e.target.value })); }} />
                  </div>
                  <div>
                    <label className="form-label">Subject</label>
                    <input className="form-input" value={emailData.subject} onChange={e => { setEmailEdited(true); setEmailData(d => ({ ...d, subject: e.target.value })); }} />
                  </div>
                  <div>
                    <label className="form-label">Body Message</label>
                    <textarea rows={6} className="form-input" value={emailData.body} onChange={e => { setEmailEdited(true); setEmailData(d => ({ ...d, body: e.target.value })); }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={emailData.attachPdf} onChange={e => setEmailData(d => ({ ...d, attachPdf: e.target.checked }))} className="w-4 h-4 text-brand rounded focus:ring-brand" />
                      <span className="text-sm font-medium text-gray-700">Attach Quotation PDF</span>
                    </label>
                    <button onClick={confirmSendEmail} disabled={saving} className="btn-primary bg-blue-600 hover:bg-blue-700 border-none px-6">
                      {saving ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div id="print-section" className={`shadow-2xl overflow-hidden print:!shadow-none print:!rounded-none relative ${previewTab === 'pdf' ? 'block' : 'hidden print:block'}`}>
              <QuotationPdfPreview quotation={form} company={company} onDownload={downloadPDF} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
