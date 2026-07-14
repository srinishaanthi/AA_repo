import React from 'react';
import { LorryReceipt, CompanySettings } from '../../types';
import { Truck } from 'lucide-react';

interface Props {
  lr: Partial<LorryReceipt>;
  company: CompanySettings | null;
}

const formatCurrency = (n?: number | string) => {
  const num = Number(n) || 0;
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export default function LRPdfPreview({ lr, company }: Props) {
  const total = (Number(lr.freight_charge) || 0) +
    (Number(lr.loading_charge) || 0) +
    (Number(lr.unloading_charge) || 0) +
    (Number(lr.detention_charge) || 0) +
    (Number(lr.other_charges) || 0);

  const goods = lr.goods || [];

  return (
    <div className="pdf-preview bg-[#f7f9fb] text-[#191c1e] text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        @media print {
            .no-print { display: none; }
            body { background: white; }
        }
      `}</style>
      <div className="max-w-5xl mx-auto bg-[#ffffff] rounded-xl shadow-lg overflow-hidden border border-[#c3c5d9]">
        {/* Receipt Header */}
        <div className="relative bg-[#003ec7] overflow-hidden p-3">
          <div className="relative z-10 flex flex-row justify-between items-center gap-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shrink-0 mt-0.5">
                {company?.logo_url ? (
                  <img alt="Logo" className="w-full h-full object-contain" src={company.logo_url} />
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
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-lg border border-white/20 flex items-center justify-center text-center">
              <h2 className="text-[13px] font-bold text-white tracking-widest uppercase leading-tight">LORRY<br />RECEIPT</h2>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-[#f2f4f6] border-b border-[#c3c5d9]">
          <div className="space-y-1">
            <p className="text-[#434656] text-[9px] font-semibold tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[10px]">tag</span> LR NO.
            </p>
            <p className="text-[11px] font-semibold text-[#003ec7]">{lr.lr_number || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#434656] text-[9px] font-semibold tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[10px]">calendar_today</span> DATE
            </p>
            <p className="text-[11px] font-semibold">{lr.date ? new Date(lr.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#434656] text-[9px] font-semibold tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[10px]">local_shipping</span> VEHICLE NO.
            </p>
            <p className="text-[11px] font-semibold">{lr.vehicle_number || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#434656] text-[9px] font-semibold tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[10px]">location_on</span> DELIVERY AT
            </p>
            <p className="text-[11px] font-semibold">
              {lr.delivery_at || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[#434656] text-[9px] font-semibold tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[10px]">person</span> DRIVER NAME
            </p>
            <p className="text-[11px] font-bold">{lr.driver_name || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#434656] text-[9px] font-semibold tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[10px]">call</span> DRIVER MOBILE
            </p>
            <p className="text-[11px] font-bold">{lr.driver_phone || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#434656] text-[9px] font-semibold tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[10px]">receipt_long</span> E-WAY BILL NO.
            </p>
            <p className="text-[11px] font-bold">{lr.eway_bill_no || 'Not Provided'}</p>
          </div>
        </div>

        {/* Bento Grid Sections */}
        <div className="p-3 grid grid-cols-2 gap-3">
          {/* Consignor Card */}
          <div className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-white">
            <div className="bg-[#f4f6fb] px-3 py-1.5 border-b border-[#e5e7eb]">
              <h3 className="text-[9px] font-semibold tracking-wider text-[#3b82f6] uppercase">Consignor (From)</h3>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Name</p>
                <p className="text-[10px] font-bold text-[#111827]">{lr.consignor_name || '—'}</p>
              </div>
              <div>
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Address</p>
                <p className="text-[10px] text-[#374151] leading-snug">{lr.consignor_address || '—'}</p>
              </div>
              {lr.consignor_phone && (
                <div>
                  <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Contact No.</p>
                  <p className="text-[10px] text-[#374151]">{lr.consignor_phone}</p>
                </div>
              )}
              <div className="bg-[#f9fafb] p-2 rounded border border-[#e5e7eb] border-dashed">
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">GSTIN</p>
                <p className="text-[10px] font-bold text-[#3b82f6]">{lr.consignor_gstin || '—'}</p>
              </div>
            </div>
          </div>

          {/* Consignee Card */}
          <div className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-white">
            <div className="bg-[#ebf5e6] px-3 py-1.5 border-b border-[#e5e7eb]">
              <h3 className="text-[9px] font-semibold tracking-wider text-[#16a34a] uppercase">Consignee (To)</h3>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Name</p>
                <p className="text-[10px] font-bold text-[#111827]">{lr.consignee_name || '—'}</p>
              </div>
              <div>
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Address</p>
                <p className="text-[10px] text-[#374151] leading-snug">{lr.consignee_address || '—'}</p>
              </div>
              {lr.consignee_phone && (
                <div>
                  <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">Contact No.</p>
                  <p className="text-[10px] text-[#374151]">{lr.consignee_phone}</p>
                </div>
              )}
              <div className="bg-[#f9fafb] p-2 rounded border border-[#e5e7eb] border-dashed">
                <p className="text-[#6b7280] text-[8px] font-medium tracking-wider mb-0.5 uppercase">GSTIN</p>
                <p className="text-[10px] font-bold text-[#16a34a]">{lr.consignee_gstin || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goods Detail Table */}
        <div className="mx-2 mb-2 border border-[#c3c5d9] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#e6e8ea] border-b border-[#c3c5d9]">
              <tr>
                <th className="px-2 py-2 text-[8px] font-semibold text-[#434656] uppercase">Goods</th>
                <th className="px-2 py-2 text-[8px] font-semibold text-[#434656] uppercase text-center">Packages</th>
                <th className="px-2 py-2 text-[8px] font-semibold text-[#434656] uppercase text-center">Actual Weight (kg)</th>
                <th className="px-2 py-2 text-[8px] font-semibold text-[#434656] uppercase text-center">Charged Weight (kg)</th>
                <th className="px-2 py-2 text-[8px] font-semibold text-[#434656] uppercase text-right">Value</th>
              </tr>
            </thead>
            <tbody className="text-[#191c1e]">
              {goods.length > 0 ? goods.map((g, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5 text-[10px]">{g.description || '—'}</td>
                  <td className="px-2 py-1.5 text-center text-[10px]">{g.packages || '—'}</td>
                  <td className="px-2 py-1.5 text-center text-[10px]">{g.actual_weight || '—'}</td>
                  <td className="px-2 py-1.5 text-center text-[10px]">{g.charged_weight || '—'}</td>
                  <td className="px-2 py-1.5 text-right text-[10px]">{g.value ? Number(g.value).toLocaleString('en-IN') : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-2 py-2 text-center text-[10px]">No goods</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Summary & Signs */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-[#f2f4f6] border-t border-[#c3c5d9]">
          {/* Route & Declaration */}
          <div className="col-span-2 flex flex-col justify-between p-2 gap-3">
            <div className="flex items-center gap-6 bg-white p-3 rounded-xl border border-[#c3c5d9]">
              <div className="flex-1">
                <p className="text-[9px] font-semibold tracking-wider text-[#434656] uppercase tracking-widest mb-1">From</p>
                <p className="text-[16px] font-bold text-[#003ec7]">{lr.from_location || '—'}</p>
              </div>
              <div className="text-[#c3c5d9] flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-semibold tracking-wider text-[#434656] uppercase tracking-widest mb-1">To</p>
                <p className="text-[16px] font-bold text-[#003ec7]">{lr.to_location || '—'}</p>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="bg-white p-3 rounded-xl border border-[#c3c5d9]">
              <p className="text-[9px] font-semibold tracking-wider text-[#434656] uppercase tracking-widest mb-2">Payment Terms</p>
              <div className="flex justify-start gap-8">
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#434656]"><input className="rounded border-[#c3c5d9]" type="checkbox" checked={lr.payment_terms === 'Paid'} readOnly /> PAID</label>
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#434656]"><input className="rounded border-[#c3c5d9]" type="checkbox" checked={lr.payment_terms === 'To Pay'} readOnly /> TO PAY</label>
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#434656]"><input className="rounded border-[#c3c5d9]" type="checkbox" checked={lr.payment_terms === 'TBB'} readOnly /> TBB</label>
              </div>
            </div>

            <div className="mt-auto">
              <p className="text-[9px] font-semibold tracking-wider text-[#434656] uppercase tracking-widest mb-2">Declaration</p>
              <p className="text-[11px] leading-relaxed text-[#434656]">We declare that the contents of this consignment are true and correct as per the shipper's declaration. The carrier is not responsible for any internal damage if the packaging is intact at delivery. Subject to {company?.city || 'Coimbatore'} Jurisdiction.</p>
            </div>
          </div>

          {/* Freight Calculation Summary */}
          <div className="bg-[#003ec7] text-white p-3 rounded-xl space-y-3 shadow-xl">
            <h3 className="text-[9px] font-semibold tracking-wider uppercase tracking-widest border-b border-white/20 pb-2">Freight Summary</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-semibold tracking-wider"><span className="">Freight</span><span className="">{lr.freight_charge ? formatCurrency(lr.freight_charge) : 'Rs. —'}</span></div>
              <div className="flex justify-between text-[9px] font-semibold tracking-wider"><span className="">Loading Charges</span><span className="">{lr.loading_charge ? formatCurrency(lr.loading_charge) : 'Rs. —'}</span></div>
              <div className="flex justify-between text-[9px] font-semibold tracking-wider"><span className="">Unloading Charges</span><span className="">{lr.unloading_charge ? formatCurrency(lr.unloading_charge) : 'Rs. —'}</span></div>
              <div className="flex justify-between text-[9px] font-semibold tracking-wider"><span className="">Detention / Halting</span><span className="">{lr.detention_charge ? formatCurrency(lr.detention_charge) : 'Rs. —'}</span></div>
              <div className="flex justify-between text-[9px] font-semibold tracking-wider"><span className="">Other Charges</span><span className="">{lr.other_charges ? formatCurrency(lr.other_charges) : 'Rs. —'}</span></div>

              {lr.gst_rate ? (
                <>
                  <div className="flex justify-between text-[9px] font-semibold tracking-wider pt-1.5 border-t border-white/20 mt-1.5">
                    <span className="">Sub Total</span>
                    <span className="">{formatCurrency((lr.freight_charge || 0) + (lr.loading_charge || 0) + (lr.unloading_charge || 0) + (lr.detention_charge || 0) + (lr.other_charges || 0))}</span>
                  </div>
                  {(!lr.party_code || lr.party_code === 'cgst_sgst') ? (
                    <>
                      <div className="flex justify-between text-[9px] font-semibold tracking-wider opacity-90"><span className="">CGST ({lr.gst_rate / 2}%)</span><span className="">{formatCurrency((lr.gst_amount || 0) / 2)}</span></div>
                      <div className="flex justify-between text-[9px] font-semibold tracking-wider opacity-90"><span className="">SGST ({lr.gst_rate / 2}%)</span><span className="">{formatCurrency((lr.gst_amount || 0) / 2)}</span></div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[9px] font-semibold tracking-wider opacity-90"><span className="">IGST ({lr.gst_rate}%)</span><span className="">{formatCurrency(lr.gst_amount || 0)}</span></div>
                  )}
                </>
              ) : null}
            </div>
            <div className="pt-2 border-t border-white/40 flex justify-between items-center mt-2"><span className="text-[11px] font-semibold">TOTAL</span><span className="text-[11px] font-semibold">{formatCurrency(total)}</span></div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 border-t border-[#c3c5d9]">
          <div className="p-2 border-r border-[#c3c5d9] bg-[#f7f9fb] flex flex-col justify-end items-center min-h-[85px]">
            <div className="border-t border-[#737688] border-dashed w-full pt-2 text-center"><p className="text-[9px] uppercase text-[#434656]">Consignor's Signature & Seal</p></div>
          </div>
          <div className="p-2 border-r border-[#c3c5d9] bg-[#ffffff] flex flex-col justify-between items-center min-h-[85px]">
            <p className="text-[10px] font-bold tracking-widest text-[#003ec7] uppercase">For {company?.company_name || 'A & A LOGISTICS'}</p>
            <div className="border-t border-[#003ec7] w-full pt-2 text-center"><p className="text-[9px] font-semibold text-[#434656] uppercase">Authorized Signatory</p></div>
          </div>
          <div className="p-2 bg-[#f7f9fb] flex flex-col justify-between min-h-[85px]">
            <div className="w-full space-y-1.5">
              <div className="border-b border-[#c3c5d9] border-dashed pb-1.5"><p className="text-[9px] text-[#434656]">NAME:</p></div>
              <div className="border-b border-[#c3c5d9] border-dashed pb-1.5"><p className="text-[9px] text-[#434656]">DATE:</p></div>
              <div className="border-b border-[#c3c5d9] border-dashed pb-1.5"><p className="text-[9px] text-[#434656]">SIGNATURE:</p></div>
              <div className="border-t border-[#737688] border-dashed pt-2 text-center">
                <p className="text-[10px] uppercase font-bold text-[#191c1e]">Receiver's Acknowledgement</p>
                <p className="text-[8px] text-[#434656] mt-0.5">Goods Received in Good Condition (Subject to Verification)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#003ec7] p-3 text-white flex flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5cfd80] text-[16px]">local_shipping</span>
            <span className="text-[9px] font-semibold tracking-wider tracking-widest uppercase">{company?.footer_text || 'Thank you for your business!'}</span>
          </div>
          <div className="flex gap-4">
            {company?.phone && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[12px]">call</span>
                <span className="text-[12px]">{company.phone}</span>
              </div>
            )}
            {company?.email && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[12px]">mail</span>
                <span className="text-[12px]">{company.email}</span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
