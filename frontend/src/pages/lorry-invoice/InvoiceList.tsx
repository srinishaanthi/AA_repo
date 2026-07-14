import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LorryInvoice, NavState } from '../../types';
import { Plus, Search, Filter, Eye, Pencil, Printer, Trash2, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  issued: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
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
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Receipt size={36} className="mx-auto text-gray-200 mb-3" />
                  <div className="text-gray-400 text-sm">No invoices found</div>
                  <button onClick={() => onNav({ page: 'invoice-create' })} className="btn-primary mt-4 mx-auto"><Plus size={14} /> Create First Invoice</button>
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="table-td font-semibold text-brand">{inv.invoice_number}</td>
                  <td className="table-td text-gray-500">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</td>
                  <td className="table-td font-medium">{inv.customer_name || '—'}</td>
                  <td className="table-td text-gray-500">{inv.lr_number || '—'}</td>
                  <td className="table-td"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{inv.vehicle_number || '—'}</span></td>
                  <td className="table-td font-semibold">{inv.total_amount ? `₹${Number(inv.total_amount).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="table-td"><span className={`status-pill ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>{inv.status}</span></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onNav({ page: 'invoice-edit', id: inv.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand transition-colors"><Eye size={15} /></button>
                      <button onClick={() => onNav({ page: 'invoice-edit', id: inv.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => onNav({ page: 'invoice-edit', id: inv.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand transition-colors"><Printer size={15} /></button>
                      <button onClick={() => del(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
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
    </div>
  );
}
