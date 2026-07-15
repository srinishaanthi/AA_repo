import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LorryInvoice, NavState } from '../../types';
import { Plus, Search, Filter, Eye, Pencil, Printer, Trash2, Receipt, ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react';

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  issued: 'bg-blue-50 text-blue-700',
  partial: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
};

export default function InvoiceList({ onNav }: { onNav: (s: NavState) => void }) {
  const [invoices, setInvoices] = useState<LorryInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<{ id: string, invoiceNo: string, total: number, received: number, pending: number } | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => { load(); }, [search, statusFilter, dateFilter, page]);

  async function load() {
    setLoading(true);
    let q = api.from('lorry_invoices').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (search) q = q.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%,lr_number.ilike.%${search}%`);
    if (statusFilter) q = q.eq('status', statusFilter);
    if (dateFilter) q = q.eq('date', dateFilter);
    const { data, count } = await q;
    setInvoices(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  async function del(id: string) {
    if (!confirm('Delete this invoice?')) return;
    await api.from('lorry_invoices').delete().eq('id', id);
    load();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await api.from('lorry_invoices').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  async function handleSavePayment() {
    if (!paymentModal) return;
    setSavingPayment(true);
    const newPending = paymentModal.total - paymentModal.received;
    const newStatus = newPending <= 0 ? 'paid' : paymentModal.received > 0 ? 'partial' : 'issued';
    await api.from('lorry_invoices').update({
      amount_received: paymentModal.received,
      amount_pending: newPending,
      status: newStatus,
      updated_at: new Date().toISOString()
    }).eq('id', paymentModal.id);
    setSavingPayment(false);
    setPaymentModal(null);
    load();
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lorry Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total records</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Receipt size={15} /> Export</button>
          <button onClick={() => onNav({ page: 'invoice-create' })} className="btn-primary"><Plus size={16} /> New Invoice</button>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search invoice, customer, LR…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <input type="date" className="form-input w-36" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(0); }} />
          <select className="form-input w-32" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          {(search || statusFilter || dateFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); setPage(0); }} className="text-xs text-brand font-medium hover:underline">Clear</button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Invoice No</th>
                <th className="table-th">Date</th>
                <th className="table-th">Customer</th>
                <th className="table-th">LR No</th>
                <th className="table-th">Vehicle</th>
                <th className="table-th">Total (₹)</th>
                <th className="table-th">Received (₹)</th>
                <th className="table-th">Pending (₹)</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(10)].map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : invoices.length === 0 ? (
                <tr><td colSpan={10} className="py-16 text-center">
                  <Receipt size={36} className="mx-auto text-gray-200 mb-3" />
                  <div className="text-gray-400 text-sm">No invoices found</div>
                  <button onClick={() => onNav({ page: 'invoice-create' })} className="btn-primary mt-4 mx-auto"><Plus size={14} /> Create First Invoice</button>
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="table-td font-semibold text-brand">{inv.invoice_number}</td>
                  <td className="table-td text-gray-500">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}</td>
                  <td className="table-td font-medium">{inv.customer_name || ''}</td>
                  <td className="table-td text-gray-500">{inv.lr_number || ''}</td>
                  <td className="table-td">{inv.vehicle_number ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{inv.vehicle_number}</span> : ''}</td>
                  <td className="table-td font-semibold text-gray-900">{inv.total_amount ? Number(inv.total_amount).toLocaleString('en-IN') : ''}</td>
                  <td className="table-td text-emerald-600 font-medium">{inv.amount_received ? Number(inv.amount_received).toLocaleString('en-IN') : ''}</td>
                  <td className="table-td text-amber-600 font-medium">{inv.amount_pending ? Number(inv.amount_pending).toLocaleString('en-IN') : ''}</td>
                  <td className="table-td">
                    <select 
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                      className={`status-pill cursor-pointer appearance-none outline-none border-none focus:ring-2 focus:ring-brand ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      <option value="draft">draft</option>
                      <option value="issued">issued</option>
                      <option value="partial">partial</option>
                      <option value="paid">paid</option>
                      <option value="overdue">overdue</option>
                    </select>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onNav({ page: 'invoice-edit', id: inv.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand transition-colors" title="View"><Eye size={15} /></button>
                      <button onClick={() => setPaymentModal({ id: inv.id, invoiceNo: inv.invoice_number, total: inv.total_amount || 0, received: inv.amount_received || 0, pending: inv.amount_pending || (inv.total_amount || 0) })} className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Record Payment"><IndianRupee size={15} /></button>
                      <button onClick={() => onNav({ page: 'invoice-edit', id: inv.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand transition-colors" title="Print"><Printer size={15} /></button>
                      <button onClick={() => del(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button key={i} onClick={() => setPage(i)} className={`w-7 h-7 rounded-lg text-xs font-medium ${page === i ? 'bg-brand text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900">Record Payment</h3>
              <p className="text-xs text-gray-500 mt-1">Invoice: <span className="font-semibold">{paymentModal.invoiceNo}</span></p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Grand Total</span>
                <span className="font-semibold text-gray-900">₹{paymentModal.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Received</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    className="w-full form-input pl-7 py-1 text-right font-semibold"
                    value={paymentModal.received || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPaymentModal(p => p ? { ...p, received: val, pending: p.total - val } : null);
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                <span className="text-gray-900 font-medium">Pending Amount</span>
                <span className={`font-bold ${paymentModal.pending > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  ₹{paymentModal.pending.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setPaymentModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
              <button onClick={handleSavePayment} disabled={savingPayment} className="btn-primary py-2">
                {savingPayment ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
