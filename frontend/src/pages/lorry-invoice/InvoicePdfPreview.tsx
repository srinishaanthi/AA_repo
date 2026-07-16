import React from 'react';
import { LorryInvoice, CompanySettings, Bank } from '../../types';
import { Truck, Download } from 'lucide-react';

interface Props {
  invoice: Partial<LorryInvoice>;
  company: CompanySettings | null;
  bank: Bank | null;
  onDownload?: () => void;
}

const formatCurrency = (n?: number | string) => {
  const num = Number(n) || 0;
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const numWords = (num: number): string => {
  if (!num) return '-';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const conv = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + conv(n % 100) : '');
    if (n < 100000) return conv(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + conv(n % 1000) : '');
    if (n < 10000000) return conv(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + conv(n % 100000) : '');
    return conv(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + conv(n % 10000000) : '');
  };
  return conv(Math.floor(num)) + ' Only';
};

export default function InvoicePdfPreview({ invoice, company, bank, onDownload }: Props) {
  const defaultBank = {
    account_name: 'A & A Logistics',
    bank_name: 'State Bank of India',
    account_number: '33812345678',
    ifsc_code: 'SBIN0001234',
    branch: 'Vadavalli Branch',
    upi_id: 'aalogistics@sbi'
  };
  const activeBank = {
    account_name: bank?.account_name || defaultBank.account_name,
    bank_name: bank?.bank_name || defaultBank.bank_name,
    account_number: bank?.account_number || defaultBank.account_number,
    ifsc_code: bank?.ifsc_code || defaultBank.ifsc_code,
    branch: bank?.branch || defaultBank.branch,
    upi_id: bank?.upi_id || defaultBank.upi_id
  };

  const subTotal = (Number(invoice.freight_charge) || 0) +
    (Number(invoice.loading_charge) || 0) +
    (Number(invoice.unloading_charge) || 0) +
    (Number(invoice.halting_charge) || 0) +
    (Number(invoice.toll_charge) || 0) +
    (Number(invoice.detention_charge) || 0) +
    (Number(invoice.fuel_surcharge) || 0) +
    (Number(invoice.st_charge) || 0) +
    (Number(invoice.other_charges) || 0);

  const gstRate = Number(invoice.gst_rate) || 0;
  const gstAmt = (subTotal * gstRate) / 100;
  const grandTotal = subTotal + gstAmt;

  const customerState = (invoice.customer_state || '').trim().toLowerCase();
  const companyState = (company?.state || 'Tamil Nadu').trim().toLowerCase();
  const isIntraState = invoice.party_code === 'cgst_sgst' ||
    (invoice.party_code !== 'igst' && (!customerState || customerState === companyState || customerState.includes('tamil')));

  const cgstRate = isIntraState ? gstRate / 2 : 0;
  const sgstRate = isIntraState ? gstRate / 2 : 0;
  const igstRate = isIntraState ? 0 : gstRate;

  const cgstAmt = isIntraState ? gstAmt / 2 : 0;
  const sgstAmt = isIntraState ? gstAmt / 2 : 0;
  const igstAmt = isIntraState ? 0 : gstAmt;

  const goods = invoice.goods || [];

  return (
    <div className="pdf-preview bg-[#f7f9fb] text-[#191c1e] text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        @page {
            margin: 0;
            size: auto;
        }
        @media print {
            .no-print { display: none; }
            body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                background: white; 
                margin: 0; 
                padding: 0; 
            }
            .shadow-lg { box-shadow: none !important; }
        }
      `}</style>

      {/* Main A4 Wrapper */}
      <div className="w-[794px] mx-auto bg-white shadow-lg overflow-hidden border border-[#c3c5d9] flex flex-col">
        
        {/* Header */}
        <div className="relative bg-[#003ec7] overflow-hidden p-6 border-b-[6px] border-[#002f99]">
          <div className="relative z-10 flex flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white flex items-center justify-center p-1 shrink-0 mt-0.5">
                {company?.logo_url ? (
                  <img alt="Logo" className="max-w-full max-h-full object-contain" src={company.logo_url} />
                ) : (
                  <Truck size={32} className="text-[#003ec7]" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1.5">{company?.company_name || 'A & A LOGISTICS'}</h1>
                <p className="text-[10px] font-medium text-white/90 uppercase tracking-wider mb-2.5">
                  {company?.tagline || 'Transport Contractors | Full Truck Load (FTL) | Trailer Services'}
                </p>
                <div className="text-white/80 text-[11px] flex flex-wrap items-center gap-x-6 gap-y-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {company?.address || '2/7A, Jayalakshmi Nagar, Thondamuthur Road'}, {company?.city ? `${company.city} - ${company.pincode || ''}` : 'Coimbatore - 641 046'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[13px]">fingerprint</span>
                    GSTIN: {company?.gstin || '33AADCT0694E1ZP'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[13px]">call</span>
                    Mob: {company?.phone || '93603 33500, 89438 17500'}
                  </span>
                </div>
              </div>
            </div>
            {/* Right side Document Type */}
            <div className="text-right flex flex-col items-end gap-1">
              <div className="bg-white/10 backdrop-blur-md px-6 py-4 border border-white/20 flex items-center justify-center text-center">
                <h2 className="text-[16px] font-black text-white uppercase tracking-widest leading-tight">TAX<br />INVOICE</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-[#f2f4f6] border-b border-[#c3c5d9]">
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[11px] text-[#434656] mt-[1px]">tag</span>
            <div className="space-y-0.5">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider">INVOICE NO.</p>
              <p className="text-[11px] font-semibold text-[#003ec7]">{invoice.invoice_number || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[11px] text-[#434656] mt-[1px]">calendar_today</span>
            <div className="space-y-0.5">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider">INVOICE DATE</p>
              <p className="text-[11px] font-semibold">{invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[11px] text-[#434656] mt-[1px]">domain</span>
            <div className="space-y-0.5">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider">BRANCH</p>
              <p className="text-[11px] font-semibold">{invoice.branch || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[11px] text-[#434656] mt-[1px]">pin_drop</span>
            <div className="space-y-0.5">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider">FROM / TO</p>
              <p className="text-[11px] font-semibold">
                {invoice.from_location || '—'} / {invoice.to_location || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Consignee Row */}
        <div className="grid grid-cols-2 gap-3 p-3 mt-1 mx-2">
          {/* Bill To Card */}
          <div className="border border-[#e5e7eb] overflow-hidden bg-white">
            <div className="bg-[#f4f6fa] px-3 py-1.5 border-b border-[#e5e7eb]">
              <h3 className="text-[9px] font-bold text-[#3b82f6] uppercase tracking-wider">Customer Details / Bill To</h3>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Name</p>
                <p className="text-[10px] font-bold text-[#111827]">{invoice.customer_name || '—'}</p>
              </div>
              <div>
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Address</p>
                <p className="text-[10px] text-[#374151] leading-snug">{invoice.customer_address || '—'}</p>
              </div>
              {invoice.customer_phone && (
                <div>
                  <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Contact No.</p>
                  <p className="text-[10px] text-[#374151]">{invoice.customer_phone}</p>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1 bg-[#f9fafb] p-2 border border-[#e5e7eb] border-dashed">
                  <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">GSTIN</p>
                  <p className="text-[10px] font-bold text-[#3b82f6]">{invoice.customer_gstin || '—'}</p>
                </div>
                {invoice.customer_state && (
                  <div className="flex-1 bg-[#f9fafb] p-2 border border-[#e5e7eb] border-dashed">
                    <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">State</p>
                    <p className="text-[10px] font-bold text-[#374151]">{invoice.customer_state}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Consignee Card */}
          <div className="border border-[#e5e7eb] overflow-hidden bg-white">
            <div className="bg-[#ebf5e6] px-3 py-1.5 border-b border-[#e5e7eb]">
              <h3 className="text-[9px] font-bold text-[#16a34a] uppercase tracking-wider">Consignee Details</h3>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Name</p>
                <p className="text-[10px] font-bold text-[#111827]">{invoice.consignee_name || 'Same as Billing'}</p>
              </div>
              {invoice.consignee_address && (
                <div>
                  <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Delivery Address</p>
                  <p className="text-[10px] text-[#374151] leading-snug">{invoice.consignee_address}</p>
                </div>
              )}
              {invoice.consignee_phone && (
                <div>
                  <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Contact No.</p>
                  <p className="text-[10px] text-[#374151]">{invoice.consignee_phone}</p>
                </div>
              )}
              {invoice.consignee_gstin && (
                <div className="bg-[#f9fafb] p-2 border border-[#e5e7eb] border-dashed">
                  <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">GSTIN</p>
                  <p className="text-[10px] font-bold text-[#16a34a]">{invoice.consignee_gstin}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goods Detail Table */}
        <div className="mx-2 mb-2 border border-[#c3c5d9] overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#dbeafe] border-b border-[#c3c5d9] text-[#1e3a8a]">
              <tr>
                <th className="px-2 py-2 text-[10px] font-bold text-center">LR No & Date</th>
                <th className="px-2 py-2 text-[10px] font-bold text-center">Vehicle No</th>
                <th className="px-2 py-2 text-[10px] font-bold text-center">From / To</th>
                <th className="px-2 py-2 text-[10px] font-bold text-center">Material Description</th>
                <th className="px-2 py-2 text-[10px] font-bold text-center">Pkgs</th>
                <th className="px-2 py-2 text-[10px] font-bold text-center">Actual Wt</th>
                <th className="px-2 py-2 text-[10px] font-bold text-center">Chargeable Wt</th>
              </tr>
            </thead>
            <tbody className="text-[#191c1e]">
              {goods.length > 0 ? goods.map((g: any, i: number) => (
                <tr key={i}>
                  {i === 0 && (
                    <>
                      <td rowSpan={goods.length} className="px-2 py-1.5 text-center align-middle text-[10px]">
                        {invoice.lr_number || invoice.invoice_number || '—'}
                        {invoice.lr_date && <><br /><span className="text-[9px] text-gray-500">{new Date(invoice.lr_date).toLocaleDateString('en-IN')}</span></>}
                      </td>
                      <td rowSpan={goods.length} className="px-2 py-1.5 text-center align-middle font-bold text-[10px]">
                        {invoice.vehicle_number || '—'}
                      </td>
                      <td rowSpan={goods.length} className="px-2 py-1.5 text-center align-middle text-[10px] lowercase">
                        {invoice.from_location || '—'} <br /> to <br /> {invoice.to_location || '—'}
                      </td>
                    </>
                  )}
                  <td className="px-2 py-1.5 text-center text-[10px]">{g.description || '—'}</td>
                  <td className="px-2 py-1.5 text-center text-[10px]">{g.packages || '—'}</td>
                  <td className="px-2 py-1.5 text-center text-[10px]">{g.actual_weight ? `${g.actual_weight} kg` : '—'}</td>
                  <td className="px-2 py-1.5 text-center text-[10px] font-bold">{g.charged_weight || g.weight ? `${g.charged_weight || g.weight} kg` : '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-2 py-2 text-center text-[10px]">No goods</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Summary & Signs */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-[#f2f4f6] border-t border-[#c3c5d9] mt-auto">

          {/* Left Column: Bank Details & Terms */}
          <div className="flex flex-col gap-3">
            {/* Bank Details */}
            <div className="bg-white p-3 border border-[#c3c5d9]">
              <h3 className="text-[9px] font-semibold text-[#434656] uppercase tracking-widest border-b border-[#e5e7eb] pb-1.5 mb-2 flex items-center gap-1.5">Bank Details</h3>
              <div className="grid grid-cols-[100px_1fr] gap-y-1 text-[10px]">
                <span className="text-[#6b7280]">Account Name</span><span className="font-bold">{activeBank.account_name}</span>
                <span className="text-[#6b7280]">Bank Name</span><span>{activeBank.bank_name}</span>
                <span className="text-[#6b7280]">Account No.</span><span className="font-bold">{activeBank.account_number}</span>
                <span className="text-[#6b7280]">IFSC Code</span><span className="font-bold text-[#3b82f6]">{activeBank.ifsc_code}</span>
                <span className="text-[#6b7280]">Branch</span><span>{activeBank.branch}</span>
                <span className="text-[#6b7280]">UPI ID</span><span>{activeBank.upi_id}</span>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white p-3 border border-[#c3c5d9] mt-auto">
              <h3 className="text-[9px] font-semibold text-[#434656] uppercase tracking-widest border-b border-[#e5e7eb] pb-1.5 mb-2">Terms & Conditions</h3>
              {invoice.terms ? (
                <div className="text-[#434656] text-[9px] space-y-1">
                  {invoice.terms.split('\n').filter(Boolean).map((t, i) => (
                    <div key={i} className="flex gap-1.5"><span className="font-bold">{i + 1}.</span><span>{t}</span></div>
                  ))}
                </div>
              ) : (
                <div className="text-[#434656] text-[9px] space-y-1">
                  <div className="flex gap-1.5"><span className="font-bold">1.</span><span>Payment is due within the agreed credit period.</span></div>
                  <div className="flex gap-1.5"><span className="font-bold">2.</span><span>Interest may be charged on overdue payments.</span></div>
                  <div className="flex gap-1.5"><span className="font-bold">3.</span><span>Subject to jurisdiction of {company?.city || 'Coimbatore'}.</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Charges Summary */}
          <div className="bg-[#003ec7] text-white p-3 flex flex-col">
            <h3 className="text-[9px] font-semibold tracking-wider uppercase tracking-widest border-b border-white/20 pb-2">Charges</h3>

            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-[10px]"><span className="text-white/80">Freight Charge</span><span className="font-medium">{invoice.freight_charge ? formatCurrency(invoice.freight_charge) : '—'}</span></div>
              {Number(invoice.loading_charge) > 0 && <div className="flex justify-between text-[10px]"><span className="text-white/80">Loading Charge</span><span className="font-medium">{formatCurrency(invoice.loading_charge)}</span></div>}
              {Number(invoice.unloading_charge) > 0 && <div className="flex justify-between text-[10px]"><span className="text-white/80">Unloading Charge</span><span className="font-medium">{formatCurrency(invoice.unloading_charge)}</span></div>}
              {Number(invoice.toll_charge) > 0 && <div className="flex justify-between text-[10px]"><span className="text-white/80">Toll Charge</span><span className="font-medium">{formatCurrency(invoice.toll_charge)}</span></div>}
              {Number(invoice.detention_charge) > 0 && <div className="flex justify-between text-[10px]"><span className="text-white/80">Detention/Halting</span><span className="font-medium">{formatCurrency(invoice.detention_charge)}</span></div>}
              {Number(invoice.other_charges) > 0 && <div className="flex justify-between text-[10px]"><span className="text-white/80">Other Charges</span><span className="font-medium">{formatCurrency(invoice.other_charges)}</span></div>}
            </div>

            <div className="flex justify-between text-[11px] font-semibold pt-1 border-t border-white/20 mt-2">
              <span>Sub Total</span><span>{formatCurrency(subTotal)}</span>
            </div>

            {invoice.party_code === 'igst' || (!isIntraState && invoice.party_code !== 'cgst_sgst') ? (
              <div className="flex justify-between text-[10px] text-white/90">
                <span>IGST @ {gstRate}%</span><span>{formatCurrency(igstAmt)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-[10px] text-white/90">
                  <span>CGST @ {cgstRate}%</span><span>{formatCurrency(cgstAmt)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-white/90">
                  <span>SGST @ {sgstRate}%</span><span>{formatCurrency(sgstAmt)}</span>
                </div>
              </>
            )}

            <div className="mt-auto pt-3 border-t border-white/20">
              <div className="flex justify-between items-center pt-2 border-t border-white/20 mt-auto">
                <span className="text-[12px] font-bold text-white uppercase tracking-wider">Grand Total</span>
                <span className="text-[18px] font-bold text-white bg-white/20 px-3 py-1">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-2 text-right">
                <span className="text-[9px] text-white/70 block mb-0.5">Amount in Words</span>
                <span className="text-[10px] font-medium leading-tight">Rupees {numWords(grandTotal)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Signature */}
        <div className="px-6 py-4 flex justify-between items-end">
          <div className="text-[10px] text-gray-500">

          </div>
          <div className="text-center w-64">
            <div className="border-t border-[#191c1e] pt-1 font-bold text-[11px] text-[#191c1e] uppercase">
              For {company?.company_name || 'A & A LOGISTICS'}
            </div>
            <div className="font-medium text-[9px] text-[#434656] mt-0.5">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}