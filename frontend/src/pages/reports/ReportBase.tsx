import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LorryReceipt, LorryInvoice, Quotation, NavState } from '../../types';
import { Search, Filter, Download, FileText, Receipt, Quote, ArrowUpRight } from 'lucide-react';

interface Props {
  type: 'lr' | 'invoice' | 'quotation';
  onNav: (s: NavState) => void;
}

const cfgMap = {
  lr: { title: 'LR Report', icon: <FileText size={20} />, table: 'lorry_receipts', navPage: 'lr-edit' as NavState['page'], navCreate: 'lr-create' as NavState['page'] },
  invoice: { title: 'Invoice Report', icon: <Receipt size={20} />, table: 'lorry_invoices', navPage: 'invoice-edit' as NavState['page'], navCreate: 'invoice-create' as NavState['page'] },
  quotation: { title: 'Quotation Report', icon: <Quote size={20} />, table: 'quotations', navPage: 'quotation-edit' as NavState['page'], navCreate: 'quotation-create' as NavState['page'] },
};

export default function ReportBase({ type, onNav }: Props) {
  const cfg = cfgMap[type];
  const [data, setData] = useState<(LorryReceipt | LorryInvoice | Quotation)[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [search, fromDate, toDate]);

  async function load() {
    setLoading(true);
    let q = (api.from(cfg.table) as ReturnType<typeof api.from>).select('*').order('date', { ascending: false }).limit(100);
    if (fromDate) q = q.gte('date', fromDate);
    if (toDate) q = q.lte('date', toDate);
    const { data: rows } = await q;
    const filtered = (rows || []).filter((r: Record<string, unknown>) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return Object.values(r).some(v => String(v).toLowerCase().includes(s));
    });
    setData(filtered);
    setLoading(false);
  }

  function exportCSV() {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]).filter(k => !['id', 'goods'].includes(k));
    const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${String((r as Record<string, unknown>)[k] || '').replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalAmount = data.reduce((sum, r) => sum + (Number((r as LorryReceipt).total_amount) || 0), 0);

  const columns: Record<string, string[]> = {
    lr: ['lr_number', 'date', 'consignor_name', 'consignee_name', 'vehicle_number', 'from_location', 'to_location', 'total_amount', 'status'],
    invoice: ['invoice_number', 'date', 'customer_name', 'lr_number', 'vehicle_number', 'total_amount', 'status'],
    quotation: ['quotation_number', 'date', 'customer_name', 'from_location', 'to_location', 'vehicle_type', 'total_amount', 'valid_till', 'status'],
  };

  const cols = columns[type];

  const statusColors: Record<string, string> = {
    created: 'bg-blue-50 text-blue-700',
    'in-transit': 'bg-amber-50 text-amber-700',
    delivered: 'bg-green-50 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    issued: 'bg-blue-50 text-blue-700',
    paid: 'bg-green-50 text-green-700',
    sent: 'bg-blue-50 text-blue-700',
    approved: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  };

  const formatHeader = (h: string) => h.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const formatCell = (col: string, val: unknown) => {
    if (col === 'status') return val as string;
    if (col.includes('date') || col === 'valid_till') return val ? new Date(val as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
    if (col === 'total_amount') return val ? `₹${Number(val).toLocaleString('en-IN')}` : '—';
    return String(val || '—');
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cfg.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{data.length} records found</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary"><Download size={15} /> Export CSV</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">{data.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Records</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">₹{(totalAmount / 100000).toFixed(2)}L</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Revenue</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">
            {totalAmount > 0 && data.length > 0 ? `₹${Math.round(totalAmount / data.length).toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Average per Record</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search any field…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">From</span>
          <input type="date" className="form-input w-36" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <span className="text-xs text-gray-400">To</span>
          <input type="date" className="form-input w-36" value={toDate} onChange={e => setToDate(e.target.value)} />
          {(fromDate || toDate || search) && (
            <button onClick={() => { setFromDate(''); setToDate(''); setSearch(''); }} className="text-xs text-brand font-medium hover:underline">Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {cols.map(c => <th key={c} className="table-th">{formatHeader(c)}</th>)}
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{cols.map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}<td className="table-td" /></tr>
              )) : data.length === 0 ? (
                <tr><td colSpan={cols.length + 1} className="py-16 text-center text-gray-400 text-sm">No records found for the selected filters</td></tr>
              ) : data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  {cols.map(col => (
                    <td key={col} className="table-td">
                      {col === 'status' ? (
                        <span className={`status-pill ${statusColors[(row as Record<string, unknown>)[col] as string] || 'bg-gray-100 text-gray-600'}`}>
                          {(row as Record<string, unknown>)[col] as string}
                        </span>
                      ) : (
                        <span className={col.endsWith('_number') ? 'font-semibold text-brand' : col === 'total_amount' ? 'font-semibold' : ''}>
                          {formatCell(col, (row as Record<string, unknown>)[col])}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="table-td">
                    <button onClick={() => onNav({ page: cfg.navPage, id: (row as LorryReceipt).id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand">
                      <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
