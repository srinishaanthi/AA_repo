import { useState, useEffect } from 'react';
import { api, getNextNumber } from '../../lib/api';
import { LorryInvoice, LorryReceipt, Customer, CompanySettings, Bank, InvoiceGoodsLine, NavState } from '../../types';
import InvoicePdfPreview from './InvoicePdfPreview';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Save, Printer, ArrowLeft, Eye, Plus, Trash2, ChevronDown, ChevronUp, FileText, Download, Lock } from 'lucide-react';

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
  const [showPreview, setShowPreview] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true, billto: true, transport: true, goods: true, charges: true, remarks: false,
  });
  const [editBillTo, setEditBillTo] = useState(false);

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

  function selectLRForGoods(i: number, lrId: string) {
    const lr = lrs.find(l => l.id === lrId);
    if (!lr) return;
    
    const goodsList = lr.goods || [];
    const material_description = goodsList.map((g: any) => g.description).join(', ');
    const no_of_packages = goodsList.reduce((acc: number, g: any) => acc + (Number(g.packages) || 0), 0);
    const actual_weight = goodsList.reduce((acc: number, g: any) => acc + (Number(g.actual_weight) || 0), 0);
    const chargeable_weight = goodsList.reduce((acc: number, g: any) => acc + (Number(g.charged_weight) || 0), 0);

    setForm(f => {
      const g = [...(f.goods || [])];
      g[i] = {
        ...g[i],
        lr_number: lr.lr_number,
        lr_date: lr.date || '',
        vehicle_number: lr.vehicle_number || '',
        from_location: lr.from_location || '',
        to_location: lr.to_location || '',
        description: material_description,
        packages: no_of_packages ? String(no_of_packages) : '',
        actual_weight: actual_weight ? String(actual_weight) : '',
        chargeable_weight: chargeable_weight ? String(chargeable_weight) : '',
      };
      return { ...f, goods: g };
    });
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
  const amountPending = grandTotal - (Number(form.amount_received) || 0);

  const customerState = (form.customer_state || '').trim().toLowerCase();
  const isIntraState = form.party_code === 'cgst_sgst' ||
    (form.party_code !== 'igst' && (!customerState || customerState === 'tamil nadu' || customerState === 'tamilnadu' || customerState === 'tn'));

  async function handleSave(status = form.status) {
    if (!form.invoice_number) return;
    setSaving(true);
    const payload = { ...form, gst_amount: gstAmt, total_amount: grandTotal, amount_pending: amountPending, amount_received: Number(form.amount_received) || 0, status, updated_at: new Date().toISOString() };
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
      margin: 0,
      filename: `${form.invoice_number || 'invoice'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, windowWidth: element.scrollWidth, scrollY: 0, scrollX: 0, letterRendering: true },
      // Use exact un-clipped dimensions of the element so it fits perfectly on 1 page!
      jsPDF: { unit: 'px', format: [element.scrollWidth, element.scrollHeight], orientation: 'portrait' }
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

  const saveNewCustomer = async () => {
    if (!form.customer_name) {
      alert('Please enter a Customer Name first.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await api.from('customers').insert({
        name: form.customer_name,
        gstin: form.customer_gstin || null,
        state: form.customer_state || null,
        contact_person: form.customer_contact_person || null,
        phone: form.customer_phone || null,
        address: form.customer_address || null,
        type: 'Customer'
      });
      if (error) throw error;
      await loadMaster();
      if (data && data.length > 0) {
        setForm(f => ({ ...f, customer_id: data[0].id }));
      } else if (data) {
        setForm(f => ({ ...f, customer_id: (data as any).id }));
      }
      alert('Customer saved to master successfully!');
      setEditBillTo(false);
    } catch (err: any) {
      alert('Failed to save customer: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const secs = [
    { key: 'basic', label: 'Invoice Details' },
    { key: 'billto', label: 'Bill To' },
    { key: 'transport', label: 'Transport Details & Items' },
    { key: 'charges', label: 'Charges' },
    { key: 'remarks', label: 'Terms & Conditions' },
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
        <div className={`no-print w-full overflow-y-auto bg-[#F5F7FA] ${showPreview ? 'hidden' : 'block'}`}>
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
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className={lbl}>Invoice Number</label>
                          <input className={inp} value={form.invoice_number || ''} onChange={e => setF('invoice_number', e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>Date</label>
                          <input type="date" className={inp} value={form.date || ''} onChange={e => setF('date', e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>Branch</label>
                          <input list="branch-options" className={inp} value={form.branch || ''} onChange={e => setF('branch', e.target.value)} placeholder="Select or type..." />
                          <datalist id="branch-options">
                            <option value="Coimbatore" />
                            <option value="Chennai" />
                          </datalist>
                        </div>
                        <div>
                          <label className={lbl}>Auto-fill from LR</label>
                          <select 
                            className={inp} 
                            value={form.lr_number || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setF('lr_number', val);
                              if (val) {
                                const lr = lrs.find(x => x.lr_number === val);
                                if (lr) {
                                  let matchCust = customers.find(c => c.name && lr.consignor_name && c.name.toLowerCase().trim() === lr.consignor_name.toLowerCase().trim());
                                  setForm(f => ({
                                    ...f,
                                    lr_number: val,
                                    vehicle_number: lr.vehicle_number || f.vehicle_number,
                                    customer_id: matchCust ? matchCust.id : '',
                                    customer_name: lr.consignor_name || f.customer_name,
                                    customer_phone: matchCust ? (matchCust.phone || '') : (lr.consignor_phone || f.customer_phone),
                                    customer_address: matchCust ? (matchCust.address || '') : (lr.consignor_address || f.customer_address),
                                    customer_gstin: matchCust ? (matchCust.gstin || '') : f.customer_gstin,
                                    customer_state: matchCust ? (matchCust.state || '') : f.customer_state,
                                    customer_contact_person: matchCust ? (matchCust.contact_person || '') : f.customer_contact_person,
                                    consignor_name: lr.consignor_name || f.consignor_name,
                                    consignor_address: lr.consignor_address || f.consignor_address,
                                    consignor_phone: lr.consignor_phone || f.consignor_phone,
                                    consignee_name: lr.consignee_name || f.consignee_name,
                                    consignee_address: lr.consignee_address || f.consignee_address,
                                    consignee_phone: lr.consignee_phone || f.consignee_phone,
                                  }));
                                }
                              }
                            }}
                          >
                            <option value="">— Select LR —</option>
                            {lrs.map(l => <option key={l.id} value={l.lr_number}>{l.lr_number} ({l.consignor_name || 'No Name'})</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {s.key === 'billto' && (
                      <div className="grid grid-cols-2 gap-6 mt-4">
                        {/* Left Column: Bill To */}
                        <div className="space-y-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                          <h3 className="font-semibold text-gray-800">Bill To Details</h3>
                          <button onClick={() => setEditBillTo(!editBillTo)} className="text-xs text-brand hover:underline font-medium">
                            {editBillTo ? 'Done Editing' : 'Edit Details'}
                          </button>
                        </div>
                        <div>
                          <label className={lbl}>Select Customer (Optional)</label>
                          <select className={inp} value={form.customer_id || ''} onChange={e => {
                            const val = e.target.value;
                            if (!val) {
                              setForm(f => ({ ...f, customer_id: '', customer_name: '', customer_gstin: '', customer_address: '', customer_phone: '', customer_state: '', customer_contact_person: '' }));
                              return;
                            }
                            const c = customers.find(x => x.id === val);
                            if (c) {
                              setForm(f => ({ ...f, customer_id: c.id, customer_name: c.name, customer_gstin: c.gstin || '', customer_address: c.address || '', customer_phone: c.phone || '', customer_state: c.state || '', customer_contact_person: c.contact_person || '' }));
                            }
                          }}>
                            <option value="">— Select from Customers —</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        {!editBillTo ? (
                          <div className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                              <div className="col-span-2">
                                <span className="text-gray-400 text-[10px] block mb-0.5 uppercase tracking-wider font-bold">Customer Name</span>
                                <div className="font-semibold text-gray-900 text-base">{form.customer_name || '—'}</div>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px] block mb-0.5 uppercase tracking-wider font-bold">GSTIN</span>
                                <div className="text-gray-700 font-medium">{form.customer_gstin || '—'}</div>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px] block mb-0.5 uppercase tracking-wider font-bold">Mobile / Phone</span>
                                <div className="text-gray-700 font-medium">{form.customer_phone || '—'}</div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-400 text-[10px] block mb-0.5 uppercase tracking-wider font-bold">Billing Address</span>
                                <div className="text-gray-700 font-medium">
                                  {form.customer_address || form.customer_state ? (
                                    <>{form.customer_address} {form.customer_state ? `, ${form.customer_state}` : ''}</>
                                  ) : '—'}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-400 text-[10px] block mb-0.5 uppercase tracking-wider font-bold">Contact Person</span>
                                <div className="text-gray-700 font-medium">{form.customer_contact_person || '—'}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 border border-brand/20 rounded-lg">
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
                            <div className="col-span-2">
                              <label className={lbl}>Billing Address</label>
                              <textarea rows={2} className={inp} value={form.customer_address || ''} onChange={e => setF('customer_address', e.target.value)} />
                            </div>
                            <div className="col-span-2 flex justify-end mt-2">
                              <button onClick={saveNewCustomer} disabled={saving} className="btn-secondary text-xs bg-white border border-gray-200 hover:bg-gray-50 text-brand">
                                + Save as New Customer
                              </button>
                            </div>
                          </div>
                        )}
                        </div>
                        {/* Right Column: Consignor & Consignee */}
                        <div className="space-y-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <div className="border-b border-gray-100 pb-2">
                            <h3 className="font-semibold text-gray-800">Consignor & Consignee Details</h3>
                          </div>
                          <div className="space-y-4 mt-3">
                            <div>
                              <label className={lbl}>Consignor (From)</label>
                              <input className={inp} value={form.consignor_name || ''} onChange={e => setF('consignor_name', e.target.value)} />
                            </div>
                            <div>
                              <label className={lbl}>Consignee (To)</label>
                              <input className={inp} value={form.consignee_name || ''} onChange={e => setF('consignee_name', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.key === 'transport' && (
                      <div className="mt-4 overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                          <thead className="bg-[#D9EAF5] text-gray-800 text-xs font-bold text-center border-b border-gray-200">
                            <tr>
                              <th className="py-2 px-1 w-36">LR No & Date</th>
                              <th className="py-2 px-1 w-32">Vehicle No</th>
                              <th className="py-2 px-1 w-32">From / To</th>
                              <th className="py-2 px-1 min-w-[200px]">Material Description</th>
                              <th className="py-2 px-1 w-16">Pkgs</th>
                              <th className="py-2 px-1 w-20">Actual Wt</th>
                              <th className="py-2 px-1 w-24">Chargeable Wt</th>
                              <th className="py-2 px-1 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {/* Primary Transport Row */}
                            <tr>
                              <td className="p-2 border-r border-gray-100 align-middle max-w-[144px]" rowSpan={1 + (form.goods?.length || 0)}>
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <input className="w-full text-center outline-none bg-transparent font-medium text-gray-800 placeholder-gray-400" placeholder="LR No" value={form.lr_number || ''} onChange={e => {
                                    setF('lr_number', e.target.value);
                                  }} />
                                  <input type="date" className="w-full text-center outline-none bg-transparent text-[11px] text-gray-500" value={form.lr_date || ''} onChange={e => setF('lr_date', e.target.value)} />
                                </div>
                              </td>
                              <td className="p-2 border-r border-gray-100 align-middle" rowSpan={1 + (form.goods?.length || 0)}>
                                <input className="w-full text-center outline-none bg-transparent font-medium text-gray-800 pt-1 placeholder-gray-400" placeholder="Vehicle No" value={form.vehicle_number || ''} onChange={e => setF('vehicle_number', e.target.value)} />
                              </td>
                              <td className="p-2 border-r border-gray-100 text-center align-middle" rowSpan={1 + (form.goods?.length || 0)}>
                                <input className="w-full text-center outline-none bg-transparent mb-1 text-gray-800 placeholder-gray-400" placeholder="From" value={form.from_location || ''} onChange={e => setF('from_location', e.target.value)} />
                                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">to</div>
                                <input className="w-full text-center outline-none bg-transparent text-gray-800 placeholder-gray-400" placeholder="To" value={form.to_location || ''} onChange={e => setF('to_location', e.target.value)} />
                              </td>
                              <td className="p-2 border-b border-gray-100 align-top">
                                <textarea rows={2} className="w-full outline-none bg-transparent resize-none text-gray-800 pt-1 placeholder-gray-400" placeholder="Description..." value={form.material_description || ''} onChange={e => setF('material_description', e.target.value)} />
                              </td>
                              <td className="p-2 border-b border-gray-100 align-top">
                                <input type="number" className="w-full text-center outline-none bg-transparent text-gray-800 pt-1" value={form.no_of_packages || ''} onChange={e => setF('no_of_packages', e.target.value)} />
                              </td>
                              <td className="p-2 border-b border-gray-100 align-top">
                                <input type="number" className="w-full text-center outline-none bg-transparent text-gray-800 pt-1" value={form.actual_weight || ''} onChange={e => setF('actual_weight', e.target.value)} />
                              </td>
                              <td className="p-2 border-b border-gray-100 align-top font-semibold">
                                <input type="number" className="w-full text-center outline-none bg-transparent text-gray-900 pt-1 font-semibold" value={form.chargeable_weight || ''} onChange={e => setF('chargeable_weight', e.target.value)} />
                              </td>
                              <td className="p-2 border-b border-gray-100 text-center text-gray-300">
                                <Lock size={14} className="mx-auto" title="Primary details cannot be deleted" />
                              </td>
                            </tr>
                            {/* Goods Rows */}
                            {(form.goods || []).map((g: any, i) => (
                              <tr key={i}>
                                {/* LR No, Vehicle, From/To are merged via rowSpan in primary row */}
                                <td className="p-2 border-b border-gray-100 align-top">
                                  <textarea rows={2} className="w-full outline-none bg-transparent resize-none text-gray-800 pt-1 placeholder-gray-400" placeholder="Description..." value={g.description || ''} onChange={e => updateGoods(i, 'description', e.target.value)} />
                                </td>
                                <td className="p-2 border-b border-gray-100 align-top">
                                  <input type="number" className="w-full text-center outline-none bg-transparent text-gray-800 pt-1" value={g.packages || ''} onChange={e => updateGoods(i, 'packages', e.target.value)} />
                                </td>
                                <td className="p-2 border-b border-gray-100 align-top">
                                  <input type="number" className="w-full text-center outline-none bg-transparent text-gray-800 pt-1" value={g.actual_weight || ''} onChange={e => updateGoods(i, 'actual_weight', e.target.value)} />
                                </td>
                                <td className="p-2 border-b border-gray-100 align-top font-semibold">
                                  <input type="number" className="w-full text-center outline-none bg-transparent text-gray-900 pt-1 font-semibold" value={g.chargeable_weight || ''} onChange={e => updateGoods(i, 'chargeable_weight', e.target.value)} />
                                </td>
                                <td className="p-2 border-b border-gray-100 text-center">
                                  <button onClick={() => setForm(f => ({ ...f, goods: (f.goods || []).filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={14} className="mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <datalist id="lr-options">
                          {lrs.map(l => <option key={l.id} value={l.lr_number}>{l.consignee_name}</option>)}
                        </datalist>
                        <button onClick={() => setForm(f => ({ ...f, goods: [...(f.goods || []), emptyGoods()] }))} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-brand text-sm font-semibold transition-colors border-t border-gray-200">
                          <Plus size={16} /> Add Item Row
                        </button>
                      </div>
                    )}

                    {s.key === 'charges' && (
                      <div className="mt-4 flex flex-col lg:flex-row gap-6">
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
                                { label: 'Freight Charges', field: 'freight_charge' as const },
                                { label: 'Loading Charges', field: 'loading_charge' as const },
                                { label: 'Unloading Charges', field: 'unloading_charge' as const },
                                { label: 'Halting Charges', field: 'halting_charge' as const },
                                { label: 'Toll Charges', field: 'toll_charge' as const },
                                { label: 'Detention Charges', field: 'detention_charge' as const },
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
                              <tr className="bg-gray-50 border-t border-gray-200">
                                <td className="p-3 text-sm text-gray-700 font-medium">GST Type</td>
                                <td className="p-2">
                                  <select 
                                    className="w-full text-right bg-white border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-md px-2 py-1.5 text-sm outline-none transition-shadow" 
                                    value={form.party_code || (isIntraState ? 'cgst_sgst' : 'igst')} 
                                    onChange={e => setF('party_code', e.target.value)}
                                  >
                                    <option value="cgst_sgst">CGST + SGST</option>
                                    <option value="igst">IGST</option>
                                  </select>
                                </td>
                              </tr>
                              <tr className="bg-gray-50">
                                <td className="p-3 text-sm text-gray-700 font-medium">GST Rate (%)</td>
                                <td className="p-2">
                                  <select 
                                    className="w-full text-right bg-white border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-md px-2 py-1.5 text-sm outline-none transition-shadow" 
                                    value={form.party_code || 0} 
                                    onChange={e => setF('gst_rate', Number(e.target.value))}
                                  >
                                    {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                                  </select>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="lg:w-80 shrink-0">
                          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <h4 className="text-slate-400 text-xs font-semibold mb-5 uppercase tracking-widest flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-brand"></span>
                              Payment Summary
                            </h4>
                            <div className="space-y-3.5">
                              <div className="flex justify-between text-sm items-center"><span className="text-slate-300">Sub Total</span><span className="font-medium text-base">₹{subTotal.toLocaleString('en-IN')}</span></div>
                              {gstAmt > 0 && (
                                isIntraState ? (
                                  <>
                                    <div className="flex justify-between text-sm"><span className="text-slate-400">CGST ({(form.gst_rate || 0) / 2}%)</span><span>₹{(gstAmt / 2).toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-400">SGST ({(form.gst_rate || 0) / 2}%)</span><span>₹{(gstAmt / 2).toLocaleString('en-IN')}</span></div>
                                  </>
                                ) : (
                                  <div className="flex justify-between text-sm"><span className="text-slate-400">IGST ({form.gst_rate}%)</span><span>₹{gstAmt.toLocaleString('en-IN')}</span></div>
                                )
                              )}
                            </div>
                            
                            <div className="mt-5 pt-5 border-t border-slate-700/50 space-y-4">
                              <div className="flex justify-between items-end">
                                <span className="text-slate-300 text-sm font-medium">Grand Total</span>
                                <span className="text-2xl font-bold text-white tracking-tight">₹{grandTotal.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">Amount Received</span>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                  <input
                                    type="number"
                                    className="w-32 bg-slate-800/50 border border-slate-600 rounded-lg py-1.5 pl-7 pr-3 text-right text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm transition-all"
                                    value={form.amount_received || ''}
                                    onChange={(e) => setF('amount_received', Number(e.target.value))}
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                                <span className="text-brand-300 text-sm font-semibold">Pending Amount</span>
                                <span className={`text-lg font-bold tracking-tight ${amountPending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  ₹{amountPending.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.key === 'remarks' && (
                      <div className="space-y-4 mt-4">
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
