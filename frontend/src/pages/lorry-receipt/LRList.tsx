import { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';
import { LorryReceipt, NavState } from '../../types';
import { Plus, Search, Filter, Eye, Pencil, Printer, Trash2, FileText, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  created: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'in-transit': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  delivered: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  draft: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
};

export default function LRList({ onNav }: { onNav: (s: NavState) => void }) {
  const [lrs, setLRs] = useState<LorryReceipt[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function updateStatus(id: string, newStatus: string) {
    const lrToUpdate = lrs.find(lr => lr.id === id);
    if (!lrToUpdate) return;
    setUpdating(id);
    const { error } = await api.from('lorry_receipts').update({ ...lrToUpdate, status: newStatus }).eq('id', id);
    if (!error) {
      setLRs(lrs.map(lr => lr.id === id ? { ...lr, status: newStatus } : lr));
    }
    setUpdating(null);
  }

  useEffect(() => {
    loadLRs();
  }, [search, statusFilter, dateFilter, page]);

  async function loadLRs() {
    setLoading(true);
    let q = api
      .from('lorry_receipts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) q = q.or(`lr_number.ilike.%${search}%,consignor_name.ilike.%${search}%,consignee_name.ilike.%${search}%,vehicle_number.ilike.%${search}%`);
    if (statusFilter) q = q.eq('status', statusFilter);
    if (dateFilter) q = q.eq('date', dateFilter);

    const { data, count } = await q;
    setLRs(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  async function deleteLR(id: string) {
    if (!confirm('Delete this LR?')) return;
    setDeleting(id);
    await api.from('lorry_receipts').delete().eq('id', id);
    setDeleting(null);
    loadLRs();
  }

  function handleExport() {
    const headers = ['LR NO', 'DATE', 'CONSIGNOR', 'CONSIGNEE', 'VEHICLE', 'FROM -> TO', 'TOTAL', 'STATUS'];
    const rows = lrs.map(lr => [
      lr.lr_number || '',
      lr.date ? new Date(lr.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
      lr.consignor_name ? `"${lr.consignor_name.replace(/"/g, '""')}"` : '',
      lr.consignee_name ? `"${lr.consignee_name.replace(/"/g, '""')}"` : '',
      lr.vehicle_number || '',
      `"${(lr.from_location || '')} -> ${(lr.to_location || '')}"`,
      lr.total_amount || 0,
      lr.status || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Lorry_Receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDownloadTemplate() {
    const headers = ['LR NO', 'DATE', 'CONSIGNOR', 'CONSIGNEE', 'VEHICLE', 'FROM -> TO', 'TOTAL', 'STATUS'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'LR_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (json.length < 2) return alert('No data found in file.');
      
      const headers = (json[0] as string[]).map(h => String(h).trim());
      const importedLRs = [];
      
      for (let i = 1; i < json.length; i++) {
        const row = json[i] as any[];
        if (!row || row.length === 0 || row.every(val => val === null || val === undefined || val === '')) continue;
        
        const lr: any = { id: crypto.randomUUID(), created_at: new Date().toISOString() };
        
        headers.forEach((h, index) => {
          let val = row[index];
          if (val === undefined || val === null || val === '') return;
          
          if (val instanceof Date) {
            val = val.toISOString();
          } else {
            val = String(val).trim();
          }

          if (h === 'LR NO') lr.lr_number = val;
          if (h === 'DATE') lr.date = new Date(val).toISOString();
          if (h === 'CONSIGNOR') lr.consignor_name = val;
          if (h === 'CONSIGNEE') lr.consignee_name = val;
          if (h === 'VEHICLE') lr.vehicle_number = val;
          if (h === 'FROM -> TO') {
            const parts = String(val).split('->').map(p => p.trim());
            if (parts.length >= 1) lr.from_location = parts[0];
            if (parts.length >= 2) lr.to_location = parts[1];
          }
          if (h === 'TOTAL') lr.total_amount = Number(val) || 0;
          if (h === 'STATUS') lr.status = String(val).toLowerCase();
        });
        
        if (lr.lr_number) importedLRs.push(lr);
      }
      
      if (importedLRs.length > 0) {
        const { data: existing } = await api.from('lorry_receipts').select('id,lr_number');
        const existingMap = new Map((existing || []).map((r: any) => [r.lr_number, r.id]));
        
        let successCount = 0;
        for (const lr of importedLRs) {
          try {
            if (existingMap.has(lr.lr_number)) {
              await api.from('lorry_receipts').update(lr).eq('id', existingMap.get(lr.lr_number));
            } else {
              await api.from('lorry_receipts').insert(lr);
            }
            successCount++;
          } catch (e) {
            console.error('Error importing LR:', lr.lr_number, e);
          }
        }
        alert(`Successfully imported ${successCount} Lorry Receipts!`);
        loadLRs();
      } else {
        alert('No valid Lorry Receipts found to import.');
      }
    } catch (err: any) {
      alert('Error importing file: ' + err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lorry Receipts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total records</p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".csv, .xls, .xlsx" className="hidden" ref={fileInputRef} onChange={handleImport} />
          <button onClick={handleDownloadTemplate} className="btn-secondary" title="Download Template"><Download size={15} /> Template</button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" title="Import Lorry Receipts"><Upload size={15} /> Import</button>
          <button onClick={handleExport} className="btn-secondary">
            <Download size={15} />
            Export
          </button>
          <button onClick={() => onNav({ page: 'lr-create' })} className="btn-primary">
            <Plus size={16} />
            New LR
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search LR no, customer, vehicle…"
            className="form-input pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <input
            type="date"
            className="form-input w-36"
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setPage(0); }}
          />
          <select
            className="form-input w-36"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Status</option>
            <option value="created">Created</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(search || statusFilter || dateFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); setPage(0); }}
              className="text-xs text-brand font-medium hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">LR No</th>
                <th className="table-th">Date</th>
                <th className="table-th">Consignor</th>
                <th className="table-th">Consignee</th>
                <th className="table-th">Vehicle</th>
                <th className="table-th">From → To</th>
                <th className="table-th">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : lrs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <FileText size={36} className="mx-auto text-gray-200 mb-3" />
                    <div className="text-gray-400 text-sm font-medium">No lorry receipts found</div>
                    <button onClick={() => onNav({ page: 'lr-create' })} className="btn-primary mt-4 mx-auto">
                      <Plus size={14} /> Create First LR
                    </button>
                  </td>
                </tr>
              ) : (
                lrs.map(lr => (
                  <tr key={lr.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="table-td whitespace-nowrap">
                      <span className="font-semibold text-brand">{lr.lr_number}</span>
                    </td>
                    <td className="table-td text-gray-500 whitespace-nowrap">
                      {lr.date ? new Date(lr.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td className="table-td font-medium">{lr.consignor_name || '—'}</td>
                    <td className="table-td">{lr.consignee_name || '—'}</td>
                    <td className="table-td whitespace-nowrap">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">{lr.vehicle_number || '—'}</span>
                    </td>
                    <td className="table-td text-gray-500 text-xs">
                      {lr.from_location && lr.to_location ? `${lr.from_location} → ${lr.to_location}` : '—'}
                    </td>
                    <td className="table-td font-semibold">
                      {lr.total_amount ? `₹${Number(lr.total_amount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="table-td">
                      <select
                        className={`text-xs font-semibold px-2 py-1 rounded-full outline-none cursor-pointer appearance-none ${statusColors[lr.status] || 'bg-gray-100 text-gray-600'}`}
                        value={lr.status}
                        onChange={(e) => updateStatus(lr.id, e.target.value)}
                        disabled={updating === lr.id}
                      >
                        <option value="created">created</option>
                        <option value="in-transit">in-transit</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onNav({ page: 'lr-edit', id: lr.id })}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand transition-colors"
                          title="View/Edit"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onNav({ page: 'lr-edit', id: lr.id })}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-brand transition-colors"
                          title="Print"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => deleteLR(lr.id)}
                          disabled={deleting === lr.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === i ? 'bg-brand text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
