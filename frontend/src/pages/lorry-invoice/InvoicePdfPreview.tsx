import React from 'react';
import { LorryInvoice, CompanySettings, Bank } from '../../types';
import { Truck, Phone, Mail, MapPin } from 'lucide-react';

interface Props {
  invoice: Partial<LorryInvoice>;
  company: CompanySettings | null;
  bank: Bank | null;
}

const fmt = (n?: number | string) => Number(n) > 0
  ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-';

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

export default function InvoicePdfPreview({ invoice, company, bank }: Props) {
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
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  return (
    <div className="pdf-preview antialiased flex flex-col bg-[#f3faff] text-[#071e27] font-sans" style={{ minHeight: '100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;700&family=Manrope:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .pdf-preview {
          font-family: 'Hanken Grotesk', sans-serif;
        }
        .font-manrope { font-family: 'Manrope', sans-serif; }
        
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        

        /* Variables for the theme */
        .pdf-preview {
          width: 210mm;
          min-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          box-sizing: border-box;
          background: white;
          --surface: #f3faff;
          --on-surface: #071e27;
          --on-surface-variant: #42474d;
          --surface-variant: #cfe6f2;
          --surface-bright: #f3faff;
          --surface-container: #dbf1fe;
          --surface-container-lowest: #ffffff;
          --surface-container-high: #d5ecf8;
          --primary: #001d2f;
          --on-primary: #ffffff;
          --primary-container: #00334e;
          --on-primary-container: #759cbb;
          --secondary: #0047b3;
          --on-secondary: #ffffff;
          --secondary-container: #cce0ff;
          --secondary-fixed: #b3d1ff;
          --outline-variant: #c2c7ce;
          --outline: #72787e;
          --inverse-on-surface: #dff4ff;
        }

        @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              -webkit-print-color-adjust: exact;
            }
            .pdf-preview {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-sizing: border-box;
              background: white !important;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
            
            /* Tighten up vertical spacing for print to fit perfectly on one page */
            .mb-4 { margin-bottom: 0.5rem !important; }
            .mb-3 { margin-bottom: 0.25rem !important; }
            .p-6 { padding: 1rem !important; }
            .pb-6 { padding-bottom: 1rem !important; }
            .py-2 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
            .p-4 { padding: 0.5rem !important; }
            .print-hidden { display: none !important; }
            .border-outline-variant { border-color: #000 !important; }
            .text-surface-variant { color: #000 !important; }
            .bg-surface { background: #fff !important; }
        }
      `}</style>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col w-full">
        {/* Invoice Document Container */}
        <div className="flex-1 p-4 bg-[var(--surface-container-lowest)] w-full mx-auto print:m-0 print:p-0">

          {/* Document Header Section */}
          <div className="relative w-full mb-4">
            {/* Branding Background Banner */}
            <div className="absolute inset-0 z-0 bg-white overflow-hidden pointer-events-none rounded-t-xl">
              <svg preserveAspectRatio="none" viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full">
                <polygon points="0,0 62,0 52,100 0,100" className="text-[var(--primary)]" fill="currentColor" />
                <polygon points="64,0 70,0 60,100 54,100" className="text-[var(--secondary)]" fill="currentColor" />
              </svg>
            </div>

            {/* Header Content */}
            <div className="relative z-10 flex justify-between items-stretch p-6 pb-6">
              {/* Left: Company Info */}
              <div className="flex items-start gap-5 text-[var(--on-primary)] w-[62%] pr-4 relative z-10 -mt-2">
                <div className="shrink-0 bg-white p-2 rounded-2xl h-20 w-20 flex items-center justify-center shadow-md">
                  {company?.logo_url ? (
                    <img alt="Logo" className="h-16 w-16 object-contain" src={company.logo_url} />
                  ) : (
                    <Truck size={40} className="text-[var(--primary)]" />
                  )}
                </div>
                <div>
                  <h1 className="font-manrope text-3xl font-extrabold text-white mb-1 tracking-tight">{company?.company_name || 'A & A Logistics'}</h1>
                  <p className="text-[11px] font-medium text-white uppercase tracking-wider mb-3">
                    {company?.tagline || 'Transport Contractors | Full Truck Load (FTL) | Trailer Services'}
                  </p>
                  <div className="space-y-1 text-sm text-white">
                    <p>{company?.address || '2/7A, Jayalakshmi Nagar, Thondamuthur Road,'}</p>
                    <p>{company?.city ? `${company.city}, ${company.pincode || ''}` : 'Vadamalli, B.U Post, Coimbatore - 641 046.'}</p>
                    <div className="flex items-center gap-2 mt-2 text-white">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span>Mob : {company?.phone || '93603 33500, 89438 17500'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      <span>{company?.email || 'info@aalogistics.com'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Invoice Metadata */}
              <div className="w-[38%] pl-2 pr-6 flex flex-col justify-center items-end text-[var(--on-surface)] pb-2 mt-4 relative z-10">
                <div className="inline-block">
                  <h2 className="font-manrope text-[28px] font-bold text-[var(--primary)] text-center mb-6 mr-4 tracking-wide">TAX <span className="text-[var(--secondary)]">INVOICE</span></h2>

                  <div className="grid grid-cols-[100px_10px_1fr] gap-x-3 gap-y-3 text-[13px] font-medium text-[var(--on-surface)]">
                    {invoice.invoice_number && (
                      <React.Fragment>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[var(--secondary)]">receipt_long</span>
                          <span className="font-bold">Invoice No.</span>
                        </div>
                        <div className="font-bold text-center">:</div>
                        <div className="text-[var(--on-surface-variant)]">{invoice.invoice_number}</div>
                      </React.Fragment>
                    )}

                    {invoice.date && (
                      <React.Fragment>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[var(--secondary)]">calendar_month</span>
                          <span className="font-bold">Invoice Date</span>
                        </div>
                        <div className="font-bold text-center">:</div>
                        <div className="text-[var(--on-surface-variant)]">{formatDate(invoice.date)}</div>
                      </React.Fragment>
                    )}

                    {invoice.branch && (
                      <React.Fragment>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[var(--secondary)]">pin_drop</span>
                          <span className="font-bold">Branch</span>
                        </div>
                        <div className="font-bold text-center">:</div>
                        <div className="text-[var(--on-surface-variant)]">{invoice.branch}</div>
                      </React.Fragment>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Info Strip */}
          <div className="flex justify-between items-center border-y border-[var(--outline-variant)] py-2 mb-4 px-4 bg-[var(--surface)] text-xs font-bold text-[var(--on-surface-variant)]">
            <div className="flex gap-4">
              <span>GSTIN : <span className="text-[var(--on-surface)]">{company?.gstin || '33AABM3640J1Z7'}</span></span>
              <span className="text-[var(--outline)]">|</span>
              <span>PAN : <span className="text-[var(--on-surface)]">{company?.pan || 'AABM3640J'}</span></span>
            </div>
            <div className="flex gap-4">
              <span>State Code : <span className="text-[var(--on-surface)]">{company?.state_code || '33 (Tamil Nadu)'}</span></span>
            </div>
          </div>

          {/* Data Blocks Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Bill To Block */}
            <div className="border border-[var(--outline-variant)] rounded-xl overflow-hidden bg-white">
              <div className="relative">
                {/* SVG Background Tab */}
                <svg preserveAspectRatio="none" viewBox="0 0 100 100" className="absolute top-0 left-0 w-[65%] h-full text-[var(--secondary)]">
                  <polygon points="0,0 100,0 85,100 0,100" fill="currentColor" />
                </svg>

                <div className="relative text-[var(--on-secondary)] px-4 py-1.5 font-bold text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>CUSTOMER DETAILS / BILL TO</span>
                </div>
              </div>
              <div className="p-3 grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
                {invoice.customer_name && (
                  <>
                    <div className="font-bold text-[var(--on-surface-variant)]">Customer Name</div>
                    <div className="text-[var(--on-surface)]">{invoice.customer_name}</div>
                  </>
                )}

                {invoice.customer_address && (
                  <>
                    <div className="font-bold text-[var(--on-surface-variant)]">Billing Address</div>
                    <div className="text-[var(--on-surface)]">{invoice.customer_address}</div>
                  </>
                )}

                {invoice.customer_gstin && (
                  <>
                    <div className="font-bold text-[var(--on-surface-variant)]">GSTIN</div>
                    <div className="text-[var(--on-surface)] text-xs font-bold">{invoice.customer_gstin}</div>
                  </>
                )}

                {invoice.customer_state && (
                  <>
                    <div className="font-bold text-[var(--on-surface-variant)]">State</div>
                    <div className="text-[var(--on-surface)]">{invoice.customer_state}</div>
                  </>
                )}

                {invoice.customer_contact_person && (
                  <>
                    <div className="font-bold text-[var(--on-surface-variant)]">Contact Person</div>
                    <div className="text-[var(--on-surface)]">{invoice.customer_contact_person}</div>
                  </>
                )}

                {invoice.customer_phone && (
                  <>
                    <div className="font-bold text-[var(--on-surface-variant)]">Mobile</div>
                    <div className="text-[var(--on-surface)]">{invoice.customer_phone}</div>
                  </>
                )}
              </div>
            </div>

            {/* Consignee Block */}
            <div className="border border-[var(--outline-variant)] rounded-xl overflow-hidden bg-white">
              <div className="relative">
                {/* SVG Background Tab */}
                <svg preserveAspectRatio="none" viewBox="0 0 100 100" className="absolute top-0 left-0 w-[65%] h-full text-[var(--secondary)]">
                  <polygon points="0,0 100,0 85,100 0,100" fill="currentColor" />
                </svg>

                <div className="relative text-[var(--on-secondary)] px-4 py-1.5 font-bold text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>CONSIGNEE DETAILS</span>
                </div>
              </div>
              <div className="p-3 grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
                <div className="font-bold text-[var(--on-surface-variant)]">Consignee Name</div>
                <div className="text-[var(--on-surface)]">{invoice.consignee_name || 'Same as Billing'}</div>

                {invoice.consignee_address && (
                  <>
                    <div className="font-bold text-[var(--on-surface-variant)]">Delivery Address</div>
                    <div className="text-[var(--on-surface)]">{invoice.consignee_address}</div>
                  </>
                )}

                {invoice.consignee_gstin && (
                  <>
                    <div className="font-bold text-[var(--on-surface-variant)]">GSTIN</div>
                    <div className="text-[var(--on-surface)]">{invoice.consignee_gstin}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Transport Details Grid */}
          <div className="border border-[var(--outline-variant)] rounded overflow-hidden mb-3">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--surface-variant)] text-[var(--primary)] text-xs font-bold border-b border-[var(--outline-variant)]">
                <tr>
                  <th className="py-2 px-3 text-center w-[15%]">LR No & Date</th>
                  <th className="py-2 px-3 text-center w-[15%]">Vehicle No</th>
                  <th className="py-2 px-3 text-center w-[15%]">From / To</th>
                  <th className="py-2 px-3 w-[35%]">Material Description</th>
                  <th className="py-2 px-3 text-center w-[8%]">Pkgs</th>
                  <th className="py-2 px-3 text-center w-[10%]">Actual Wt</th>
                  <th className="py-2 px-3 text-center w-[10%]">Chargeable Wt</th>
                </tr>
              </thead>
              <tbody className="text-sm bg-white">
                {(() => {
                  const items = [];
                  if (invoice.lr_number || invoice.vehicle_number || invoice.from_location || invoice.material_description || invoice.actual_weight) {
                    items.push({
                      lr_number: invoice.lr_number, lr_date: invoice.lr_date, vehicle_number: invoice.vehicle_number,
                      from_location: invoice.from_location, to_location: invoice.to_location,
                      description: invoice.material_description, packages: invoice.no_of_packages,
                      actual_weight: invoice.actual_weight, chargeable_weight: invoice.chargeable_weight
                    });
                  }
                  items.push(...goods);
                  if (items.length === 0) items.push({} as any);

                  return items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--surface-bright)]">
                      {idx === 0 && (
                        <>
                          <td className="py-2 px-3 text-center align-middle font-medium" rowSpan={items.length}>
                            <div>{item.lr_number || ''}</div>
                            <div className="text-[11px] text-[var(--on-surface-variant)] mt-1">{item.lr_date ? formatDate(item.lr_date) : ''}</div>
                          </td>
                          <td className="py-2 px-3 text-center align-middle text-xs font-bold" rowSpan={items.length}>{item.vehicle_number || ''}</td>
                          <td className="py-2 px-3 text-center align-middle" rowSpan={items.length}>
                            <div>{item.from_location || ''}</div>
                            {item.from_location && item.to_location && <div className="text-[var(--on-surface-variant)] text-xs my-0.5">to</div>}
                            <div>{item.to_location || ''}</div>
                          </td>
                        </>
                      )}
                      <td className="py-2 px-3 text-xs text-[var(--on-surface-variant)] align-top">
                        {item.description || ''}
                      </td>
                      <td className="py-2 px-3 text-center align-top whitespace-nowrap">
                        {item.packages || ''}
                      </td>
                      <td className="py-2 px-3 text-center align-top whitespace-nowrap">
                        {item.actual_weight ? `${item.actual_weight}\u00A0kg` : ''}
                      </td>
                      <td className="py-2 px-3 text-center font-bold align-top whitespace-nowrap">
                        {item.chargeable_weight ? `${item.chargeable_weight}\u00A0kg` : ''}
                      </td>
                    </tr>
                  ));
                })()}
                {/* Spacing Row */}
                <tr>
                  <td className="py-1 px-3 h-6"></td>
                  <td className="py-1 px-3"></td>
                  <td className="py-1 px-3"></td>
                  <td className="py-1 px-3"></td>
                  <td className="py-1 px-3"></td>
                  <td className="py-1 px-3"></td>
                  <td className="py-1 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Charges & Summary Area */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Left Column: Bank & Terms */}
            <div className="flex flex-col gap-4">
              {/* Bank Details Block */}
              <div className="border border-[var(--outline-variant)] rounded-xl overflow-hidden bg-white">
                <div className="relative">
                  {/* SVG Background Tab */}
                  <svg preserveAspectRatio="none" viewBox="0 0 100 100" className="absolute top-0 left-0 w-[65%] h-full text-[var(--secondary)]">
                    <polygon points="0,0 100,0 85,100 0,100" fill="currentColor" />
                  </svg>

                  <div className="relative text-[var(--on-secondary)] px-4 py-1.5 font-bold text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">account_balance</span>
                    <span>BANK DETAILS</span>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-[100px_1fr] gap-y-1 text-sm relative z-10">
                  <div className="font-bold text-[var(--on-surface-variant)]">Account Name</div>
                  <div className="text-[var(--on-surface)] font-bold">{activeBank.account_name}</div>

                  <div className="font-bold text-[var(--on-surface-variant)]">Bank Name</div>
                  <div className="text-[var(--on-surface)]">{activeBank.bank_name}</div>

                  <div className="font-bold text-[var(--on-surface-variant)]">Account No.</div>
                  <div className="text-[var(--on-surface)] font-bold tracking-wider">{activeBank.account_number}</div>

                  <div className="font-bold text-[var(--on-surface-variant)]">IFSC Code</div>
                  <div className="text-[var(--on-surface)] text-xs font-bold">{activeBank.ifsc_code}</div>

                  <div className="font-bold text-[var(--on-surface-variant)]">Branch</div>
                  <div className="text-[var(--on-surface)]">{activeBank.branch}</div>

                  <div className="font-bold text-[var(--on-surface-variant)]">UPI ID</div>
                  <div className="text-[var(--on-surface)]">{activeBank.upi_id}</div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border border-[var(--outline-variant)] rounded p-3 bg-[var(--surface)] text-[11px] font-medium text-[var(--on-surface-variant)]">
                <h4 className="text-xs font-bold text-[var(--primary)] mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">gavel</span> TERMS & CONDITIONS
                </h4>
                {invoice.terms ? (
                  <ol className="list-decimal pl-4 space-y-1">
                    {invoice.terms.split('\\n').filter(Boolean).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ol>
                ) : (
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Payment is due within the agreed credit period.</li>
                    <li>Interest may be charged on overdue payments.</li>
                    <li>Subject to jurisdiction of Coimbatore.</li>
                    <li>Goods are transported at owner's risk unless otherwise agreed.</li>
                    <li>Please quote Invoice Number while making payment.</li>
                  </ol>
                )}
              </div>
            </div>

            {/* Right Column: Financials */}
            {/* Charges Block */}
            <div className="border border-[var(--outline-variant)] rounded-xl overflow-hidden bg-white h-full flex flex-col">
              <div className="relative">
                {/* SVG Background Tab */}
                <svg preserveAspectRatio="none" viewBox="0 0 100 100" className="absolute top-0 left-0 w-[65%] h-full text-[var(--secondary)]">
                  <polygon points="0,0 100,0 85,100 0,100" fill="currentColor" />
                </svg>

                <div className="relative text-[var(--on-secondary)] px-4 py-1.5 font-bold text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">request_quote</span>
                    <span>CHARGES</span>
                  </div>
                  <div className="text-right">
                    <span className="bg-[#04151c] text-white px-3 py-0.5 rounded text-[10px]">Amount (₹)</span>
                  </div>
                </div>
              </div>
              <div className="p-0 text-sm mt-1">
                <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)]">
                  <span className="text-[var(--on-surface-variant)]">Freight Charge</span>
                  <span className="text-[var(--on-surface)] text-right">{fmt(invoice.freight_charge)}</span>
                </div>
                <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)]">
                  <span className="text-[var(--on-surface-variant)]">Loading Charge</span>
                  <span className="text-[var(--on-surface)] text-right">{fmt(invoice.loading_charge)}</span>
                </div>
                <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)]">
                  <span className="text-[var(--on-surface-variant)]">Unloading Charge</span>
                  <span className="text-[var(--on-surface)] text-right">{fmt(invoice.unloading_charge)}</span>
                </div>
                <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)]">
                  <span className="text-[var(--on-surface-variant)]">Toll Charge</span>
                  <span className="text-[var(--on-surface)] text-right">{fmt(invoice.toll_charge)}</span>
                </div>
                <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)]">
                  <span className="text-[var(--on-surface-variant)]">Detention/Halting</span>
                  <span className="text-[var(--on-surface)] text-right">{fmt((Number(invoice.detention_charge) || 0) + (Number(invoice.halting_charge) || 0))}</span>
                </div>
                <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)]">
                  <span className="text-[var(--on-surface-variant)]">Other Charges</span>
                  <span className="text-[var(--on-surface)] text-right">{fmt(invoice.other_charges)}</span>
                </div>

                {/* Sub Total */}
                <div className="flex justify-between py-1.5 px-3 bg-[var(--surface)] text-xs font-bold border-y border-[var(--outline-variant)]">
                  <span className="text-[var(--primary)]">Sub Total</span>
                  <span className="text-[var(--primary)] text-right">{fmt(subTotal)}</span>
                </div>

                {/* Taxes */}
                {isIntraState ? (
                  <>
                    <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)] text-sm">
                      <span className="text-[var(--on-surface-variant)]">CGST @ {cgstRate}%</span>
                      <span className="text-[var(--on-surface)] text-right">{fmt(cgstAmt)}</span>
                    </div>
                    <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)] text-sm">
                      <span className="text-[var(--on-surface-variant)]">SGST @ {sgstRate}%</span>
                      <span className="text-[var(--on-surface)] text-right">{fmt(sgstAmt)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 px-3 hover:bg-[var(--surface-bright)] text-sm">
                    <span className="text-[var(--on-surface-variant)]">IGST @ {igstRate}%</span>
                    <span className="text-[var(--on-surface)] text-right">{fmt(igstAmt)}</span>
                  </div>
                )}
              </div>
              {/* Grand Total */}
              <div className="flex justify-between items-center py-2 px-3 bg-[var(--primary-container)] text-[var(--on-primary-container)] font-manrope text-lg rounded-b mt-auto">
                <span className="font-bold">GRAND TOTAL</span>
                <span className="font-bold">{grandTotal > 0 ? `₹ ${fmt(grandTotal)}` : ''}</span>
              </div>
            </div>
          </div>

          {/* Amount in Words & Signatures */}
          {grandTotal > 0 && (
            <div className="border border-[var(--outline-variant)] rounded overflow-hidden mb-3">
              <div className="bg-[var(--surface)] py-1.5 px-3 flex flex-col md:flex-row md:items-center gap-2">
                <span className="text-xs font-bold text-[var(--secondary)]">Amount in Words :</span>
                <span className="font-manrope text-lg text-[var(--primary)] font-bold italic">Rupees {numWords(grandTotal)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 pt-16 pb-2 mt-4 border-t border-dashed border-[var(--outline-variant)] text-[11px] text-[var(--on-surface)]">
            {/* Column 1: Consignor */}
            <div className="flex flex-col justify-end text-center">
              <div className="border-t border-black w-4/5 mx-auto pt-1 font-bold">
                Consignor’s Signature & Seal
              </div>
            </div>

            {/* Column 2: Logistics */}
            <div className="flex flex-col justify-end text-center">
              <div className="border-t border-black w-4/5 mx-auto pt-1 font-bold uppercase">
                For {company?.company_name || 'A & A LOGISTICS'}
              </div>
              <div className="font-medium mt-0.5">Authorized Signatory</div>
            </div>

            {/* Column 3: Receiver */}
            <div className="flex flex-col justify-end text-left text-[10px] pl-4">
              <div className="font-bold text-[11px] mb-1">Receiver’s Acknowledgement</div>
              <div className="mb-3 text-[9.5px]">Goods Received in Good Condition (Subject to Verification)</div>
              <div className="flex items-end gap-2 mb-1.5">
                <span className="w-12">Name:</span>
                <span className="border-b border-black flex-1"></span>
              </div>
              <div className="flex items-end gap-2 mb-1.5">
                <span className="w-12">Signature:</span>
                <span className="border-b border-black flex-1"></span>
              </div>
              <div className="flex items-end gap-2">
                <span className="w-12">Date:</span>
                <span className="border-b border-black flex-1"></span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
