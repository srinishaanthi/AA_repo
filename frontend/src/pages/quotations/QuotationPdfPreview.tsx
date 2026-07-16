import React from 'react';
import { Quotation, CompanySettings, Bank } from '../../types';
import { Truck, Download } from 'lucide-react';

interface Props {
  quotation: Partial<Quotation>;
  company: CompanySettings | null;
  bank?: Bank | null;
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

export default function QuotationPdfPreview({ quotation, company, bank, onDownload }: Props) {
  const defaultBank = {
    account_name: 'A & A Logistics',
    bank_name: 'State Bank of India',
    account_number: '33812345678',
    ifsc_code: 'SBIN0001234',
    branch: 'Vadavalli Branch',
    upi_id: 'aalogistics@sbi'
  };
  const activeBank = bank || defaultBank;

  const subTotal = (Number(quotation.rate) || 0) +
    (Number(quotation.loading_charge) || 0) +
    (Number(quotation.unloading_charge) || 0) +
    (Number(quotation.other_charges) || 0);

  const gstAmt = (subTotal * (Number(quotation.gst_rate) || 0)) / 100;
  const grandTotal = subTotal + gstAmt;

  return (
    <div className="pdf-preview bg-[#f7f9fb] text-[#191c1e] relative group">
      {onDownload && (
        <button
          onClick={onDownload}
          className="no-print absolute top-4 right-4 bg-white/90 backdrop-blur text-brand shadow-lg p-2 rounded-xl hover:bg-brand hover:text-white transition-all flex items-center gap-2 z-50 border border-brand/20"
          title="Download PDF"
        >
          <Download size={18} />
          <span className="font-semibold text-sm pr-1">Download PDF</span>
        </button>
      )}

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

      {/* Main Wrapper */}
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
                <h1 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1.5">{company?.company_name || 'A & A Logistics'}</h1>
                <p className="text-[9px] font-bold text-white/90 uppercase tracking-widest mb-2.5">
                  {company?.tagline || 'Transport Contractors | Full Truck Load (FTL) | Trailer Services'}
                </p>
                <div className="text-white/80 text-[11px] flex flex-wrap items-center gap-x-5 gap-y-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {company?.address || '2/7A, Jayalakshmi Nagar, Thondamuthur Road'}, {company?.city ? `${company.city} - ${company.pincode || ''}` : 'Coimbatore - 641 046'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">fingerprint</span>
                    GSTIN: {company?.gstin || '33AABCA1234D1Z5'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">call</span>
                    Mob: {company?.phone || '93603 33500'}
                  </span>
                </div>
              </div>
            </div>
            <div className="border border-white/30 px-5 py-3 text-center bg-white/10 backdrop-blur">
              <h2 className="text-[14px] font-extrabold text-white tracking-widest uppercase leading-tight">QUOTATION</h2>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-[#f2f4f6] border-b border-[#c3c5d9]">
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[11px] text-[#434656] mt-[1px]">tag</span>
            <div className="space-y-0.5">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider">QUOTATION NO.</p>
              <p className="text-[11px] font-semibold text-[#003ec7]">{quotation.quotation_number || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[11px] text-[#434656] mt-[1px]">calendar_today</span>
            <div className="space-y-0.5">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider">DATE</p>
              <p className="text-[11px] font-semibold">{quotation.date ? new Date(quotation.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[11px] text-[#434656] mt-[1px]">event_available</span>
            <div className="space-y-0.5">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider">VALID TILL</p>
              <p className="text-[11px] font-semibold">{quotation.valid_till ? new Date(quotation.valid_till).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[11px] text-[#434656] mt-[1px]">pin_drop</span>
            <div className="space-y-0.5">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider">FROM / TO</p>
              <p className="text-[11px] font-semibold">
                {quotation.from_location || '—'} / {quotation.to_location || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Row */}
        <div className="p-3 grid grid-cols-2 gap-3 bg-white">
          <div className="border border-[#e6e8eb] p-3 rounded">
            <div className="border-b border-[#e6e8eb] pb-1 mb-2">
              <h3 className="text-[9px] font-bold tracking-widest text-[#003ec7] uppercase">CUSTOMER DETAILS</h3>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className="text-[#737688] text-[8px] font-semibold tracking-wider uppercase mb-0.5">NAME</p>
                <p className="text-[11px] font-bold text-[#191c1e]">{quotation.customer_name || '—'}</p>
              </div>
            </div>
          </div>

          <div className="border border-[#e6e8eb] p-3 rounded bg-[#f4f8e6]/30">
            <div className="border-b border-[#e6e8eb] pb-1 mb-2">
              <h3 className="text-[9px] font-bold tracking-widest text-[#16a34a] uppercase">REQUIREMENT DETAILS</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[#737688] text-[8px] font-semibold tracking-wider uppercase mb-0.5">Vehicle Type</p>
                <p className="text-[11px] font-bold text-[#191c1e]">{quotation.vehicle_type || '—'}</p>
              </div>
              <div>
                <p className="text-[#737688] text-[8px] font-semibold tracking-wider uppercase mb-0.5">Est. Weight</p>
                <p className="text-[11px] font-bold text-[#191c1e]">{quotation.weight ? quotation.weight + ' kg' : '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charges Table */}
        <div className="mx-2 mb-2 border border-[#c3c5d9] overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#dbeafe] border-b border-[#c3c5d9] text-[#1e3a8a]">
              <tr>
                <th className="px-3 py-2 text-[10px] font-bold text-left">Description</th>
                <th className="px-3 py-2 text-[10px] font-bold text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="text-[#191c1e]">
              <tr>
                <td className="px-3 py-2 text-[11px]">Freight Rate</td>
                <td className="px-3 py-2 text-right text-[11px] font-semibold">{quotation.rate ? Number(quotation.rate).toLocaleString('en-IN') : '—'}</td>
              </tr>
              {(quotation.loading_charge || 0) > 0 && (
                <tr>
                  <td className="px-3 py-2 text-[11px]">Loading Charge</td>
                  <td className="px-3 py-2 text-right text-[11px] font-semibold">{Number(quotation.loading_charge).toLocaleString('en-IN')}</td>
                </tr>
              )}
              {(quotation.unloading_charge || 0) > 0 && (
                <tr>
                  <td className="px-3 py-2 text-[11px]">Unloading Charge</td>
                  <td className="px-3 py-2 text-right text-[11px] font-semibold">{Number(quotation.unloading_charge).toLocaleString('en-IN')}</td>
                </tr>
              )}
              {(quotation.other_charges || 0) > 0 && (
                <tr>
                  <td className="px-3 py-2 text-[11px]">Other Charges</td>
                  <td className="px-3 py-2 text-right text-[11px] font-semibold">{Number(quotation.other_charges).toLocaleString('en-IN')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Remarks & Total */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-[#f2f4f6] border-t border-[#c3c5d9] mt-auto">
          {/* Left Column: Bank Details, Remarks & Terms */}
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

            {quotation.remarks && (
              <div className="bg-white p-3 border border-[#c3c5d9]">
                <p className="text-[#434656] text-[9px] font-semibold tracking-wider uppercase mb-1.5 border-b border-[#e6e8eb] pb-1">Remarks</p>
                <p className="text-[10px] leading-relaxed text-[#191c1e] whitespace-pre-line">{quotation.remarks}</p>
              </div>
            )}
            
            <div className="bg-white p-3 border border-[#c3c5d9]">
              <p className="text-[#434656] text-[9px] font-semibold tracking-wider uppercase mb-1.5 border-b border-[#e6e8eb] pb-1">Terms & Conditions</p>
              <ol className="text-[9px] text-[#434656] space-y-1 pl-3 list-decimal">
                <li>Quotation is valid only till the validity date mentioned.</li>
                <li>Rates are subject to change based on actual weight / size variations.</li>
                <li>Subject to jurisdiction of {company?.city || 'Coimbatore'}.</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Charges Summary */}
          <div className="bg-[#003ec7] text-white p-0 flex flex-col justify-between">
            <div className="p-3 space-y-2">
              <p className="text-[9px] font-semibold tracking-wider uppercase tracking-widest border-b border-white/20 pb-1.5 mb-2">Quotation Summary</p>
              <div className="flex justify-between text-[10px]"><span>Sub Total</span><span className="font-semibold">{formatCurrency(subTotal)}</span></div>
              
              {(quotation.gst_rate || 0) > 0 && (
                <div className="flex justify-between text-[10px] opacity-90"><span>GST ({quotation.gst_rate}%)</span><span>{formatCurrency(gstAmt)}</span></div>
              )}
            </div>
            
            <div className="bg-[#002f99] p-3 flex justify-between items-center mt-auto border-t border-white/10">
              <span className="text-[11px] font-extrabold uppercase tracking-widest">GRAND TOTAL</span>
              <span className="text-[16px] font-bold">{formatCurrency(grandTotal)}</span>
            </div>
            
            <div className="p-3 text-right bg-[#002f99] border-t border-white/10">
              <p className="text-[8px] uppercase tracking-wider opacity-70 mb-0.5">Amount In Words</p>
              <p className="text-[10px] font-semibold leading-tight">{numWords(grandTotal)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-between items-end bg-white border-t border-[#c3c5d9]">
           <div></div>
           <div className="text-center w-48 border-t border-[#191c1e] pt-1">
             <p className="text-[10px] font-bold uppercase">FOR {company?.company_name || 'A & A LOGISTICS'}</p>
             <p className="text-[8px] text-[#434656]">Authorized Signatory</p>
           </div>
        </div>
      </div>
    </div>
  );
}
