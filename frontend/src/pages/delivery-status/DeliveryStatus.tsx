import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LorryReceipt, NavState } from '../../types';
import { MapPin, Truck, User, CheckCircle, Clock, ArrowRight, Search } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  created: { label: 'Booked', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Clock size={14} /> },
  'in-transit': { label: 'In Transit', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Truck size={14} /> },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', icon: <Clock size={14} /> },
};

export default function DeliveryStatus({ onNav }: { onNav: (s: NavState) => void }) {
  const [lrs, setLRs] = useState<LorryReceipt[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [search, statusFilter]);

  async function load() {
    setLoading(true);
    let q = api.from('lorry_receipts').select('*').order('date', { ascending: false }).limit(50);
    if (search) q = q.or(`lr_number.ilike.%${search}%,consignee_name.ilike.%${search}%,vehicle_number.ilike.%${search}%`);
    if (statusFilter) q = q.eq('status', statusFilter);
    const { data } = await q;
    setLRs(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await api.from('lorry_receipts').update({ status }).eq('id', id);
    load();
  }

  const stats = {
    booked: lrs.filter(l => l.status === 'created').length,
    transit: lrs.filter(l => l.status === 'in-transit').length,
    delivered: lrs.filter(l => l.status === 'delivered').length,
    cancelled: lrs.filter(l => l.status === 'cancelled').length,
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Status</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track shipments in real time</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Booked', count: stats.booked, color: 'from-blue-500 to-blue-600', icon: <Clock size={20} />, filter: 'created' },
          { label: 'In Transit', count: stats.transit, color: 'from-amber-500 to-orange-500', icon: <Truck size={20} />, filter: 'in-transit' },
          { label: 'Delivered', count: stats.delivered, color: 'from-green-500 to-emerald-500', icon: <CheckCircle size={20} />, filter: 'delivered' },
          { label: 'Cancelled', count: stats.cancelled, color: 'from-red-500 to-rose-500', icon: <Clock size={20} />, filter: 'cancelled' },
        ].map(s => (
          <button key={s.filter} onClick={() => setStatusFilter(statusFilter === s.filter ? '' : s.filter)} className={`card p-4 text-left hover:shadow-card-lg transition-all ${statusFilter === s.filter ? 'ring-2 ring-brand' : ''}`}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.count}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search LR, customer, vehicle…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {statusFilter && <button onClick={() => setStatusFilter('')} className="text-xs text-brand font-medium hover:underline">Clear filter</button>}
      </div>

      {/* Shipments */}
      <div className="space-y-3">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />) :
          lrs.length === 0 ? (
            <div className="card py-16 text-center">
              <Truck size={36} className="mx-auto text-gray-200 mb-3" />
              <div className="text-gray-400 text-sm">No shipments found</div>
            </div>
          ) : lrs.map(lr => {
            const cfg = statusConfig[lr.status] || statusConfig.created;
            return (
              <div key={lr.id} className="card p-5 hover:shadow-card-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-brand">{lr.lr_number}</span>
                        <span className={`status-pill ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        {lr.vehicle_number && <div className="flex items-center gap-1"><Truck size={11} className="text-gray-400" />{lr.vehicle_number}</div>}
                        {lr.driver_name && <div className="flex items-center gap-1"><User size={11} className="text-gray-400" />{lr.driver_name}</div>}
                        {lr.from_location && lr.to_location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={11} className="text-gray-400" />
                            {lr.from_location} <ArrowRight size={10} /> {lr.to_location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div className="font-medium text-gray-700">{lr.consignee_name || '—'}</div>
                      <div>{lr.date ? new Date(lr.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {lr.status !== 'delivered' && lr.status !== 'cancelled' && (
                      <div className="flex gap-1">
                        {lr.status === 'created' && (
                          <button onClick={() => updateStatus(lr.id, 'in-transit')} className="btn-secondary text-xs py-1.5 px-3 text-amber-600 border-amber-200 hover:bg-amber-50">
                            Mark In Transit
                          </button>
                        )}
                        {lr.status === 'in-transit' && (
                          <button onClick={() => updateStatus(lr.id, 'delivered')} className="btn-secondary text-xs py-1.5 px-3 text-green-600 border-green-200 hover:bg-green-50">
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    )}
                    <button onClick={() => onNav({ page: 'lr-edit', id: lr.id })} className="btn-ghost text-xs py-1.5 px-3">View LR</button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
