import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Quotation, NavState } from '../../types';
import { Plus, Search, Filter, Eye, Pencil, Trash2, Quote, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const PAGE_SIZE = 10;
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  converted: 'bg-purple-50 text-purple-700',
};

export default function QuotationList({ onNav }: { onNav: (s: NavState) => void }) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [search, statusFilter, page]);

  async function load() {
    setLoading(true);
    let q = api.from('quotations').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (search) q = q.or(`quotation_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
    if (statusFilter) q = q.eq('status', statusFilter);
    const { data, count } = await q;
    setQuotations(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  async function del(id: string) {
    if (!confirm('Delete this quotation?')) return;
    await api.from('quotations').delete().eq('id', id);
    load();
  }

  async function convertToLR(q: Quotation) {
    await api.from('quotations').update({ status: 'converted' }).eq('id', q.id);
    onNav({ page: 'lr-create', fromQuotationId: q.id });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total records</p>
        </div>
        <button onClick={() => onNav({ page: 'quotation-create' })} className="btn-primary"><Plus size={16} /> New Quotation</button>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search quotation, customer…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select className="form-input w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Quotation No</th>
                <th className="table-th">Date</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Route</th>
                <th className="table-th">Vehicle Type</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Valid Till</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(9)].map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : quotations.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <Quote size={36} className="mx-auto text-gray-200 mb-3" />
                  <div className="text-gray-400 text-sm">No quotations found</div>
                  <button onClick={() => onNav({ page: 'quotation-create' })} className="btn-primary mt-4 mx-auto"><Plus size={14} /> Create First Quotation</button>
                </td></tr>
              ) : quotations.map(q => (
                <tr key={q.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="table-td font-semibold text-brand">{q.quotation_number}</td>
                  <td className="table-td text-gray-500">{q.date ? new Date(q.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</td>
                  <td className="table-td font-medium">{q.customer_name || '—'}</td>
                  <td className="table-td text-gray-500 text-xs">{q.from_location && q.to_location ? `${q.from_location} → ${q.to_location}` : '—'}</td>
                  <td className="table-td">{q.vehicle_type || '—'}</td>
                  <td className="table-td font-semibold">{q.total_amount ? `₹${Number(q.total_amount).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="table-td text-gray-500">{q.valid_till ? new Date(q.valid_till).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td className="table-td"><span className={`status-pill ${statusColors[q.status] || 'bg-gray-100 text-gray-600'}`}>{q.status}</span></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onNav({ page: 'quotation-edit', id: q.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand"><Eye size={15} /></button>
                      <button onClick={() => onNav({ page: 'quotation-edit', id: q.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand"><Pencil size={15} /></button>
                      <button onClick={() => convertToLR(q)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="Convert to LR"><ArrowRight size={15} /></button>
                      <button onClick={() => del(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
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
              {[...Array(Math.min(totalPages, 5))].map((_, i) => <button key={i} onClick={() => setPage(i)} className={`w-7 h-7 rounded-lg text-xs font-medium ${page === i ? 'bg-brand text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{i + 1}</button>)}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
