import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { NavState } from '../types';
import {
  FileText, Receipt, Truck, CheckCircle, Clock, Quote,
  TrendingUp, ArrowUpRight, Calendar, User, MapPin, Plus,
} from 'lucide-react';

interface DashboardStats {
  todayLR: number;
  todayInvoice: number;
  activeTrips: number;
  delivered: number;
  pendingInvoice: number;
  quotations: number;
}

interface RecentActivity {
  type: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

interface PendingDelivery {
  lr_number: string;
  vehicle_number?: string;
  driver_name?: string;
  consignee_name?: string;
  to_location?: string;
  status: string;
  date: string;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  const h = 120;
  const w = 100 / data.length;

  return (
    <div className="relative h-40 flex items-end gap-1">
      {data.map((d, i) => {
        const barH = (d.amount / max) * h;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full">
              <div
                className="w-full bg-brand/10 rounded-t-md transition-all duration-500 group-hover:bg-brand/20 relative overflow-hidden"
                style={{ height: `${Math.max(barH, 4)}px` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-brand rounded-t-md transition-all duration-700"
                  style={{ height: `${Math.max(barH * 0.6, 2)}px` }}
                />
              </div>
              {d.amount > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  ₹{(d.amount / 1000).toFixed(0)}K
                </div>
              )}
            </div>
            <span className="text-[9px] text-gray-400 font-medium">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ onNav }: { onNav: (s: NavState) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    todayLR: 0, todayInvoice: 0, activeTrips: 0, delivered: 0, pendingInvoice: 0, quotations: 0,
  });
  const [revenueData, setRevenueData] = useState<{ month: string; amount: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const today = new Date().toISOString().split('T')[0];

    const [lrRes, invoiceRes, quotRes] = await Promise.all([
      api.from('lorry_receipts').select('id, date, status, total_amount, consignee_name, vehicle_number, driver_name, to_location, lr_number, created_at').order('created_at', { ascending: false }),
      api.from('lorry_invoices').select('id, date, total_amount, status, invoice_number, customer_name, created_at').order('created_at', { ascending: false }),
      api.from('quotations').select('id, status, created_at, quotation_number, customer_name').order('created_at', { ascending: false }),
    ]);

    const lrs = lrRes.data || [];
    const invoices = invoiceRes.data || [];
    const quotes = quotRes.data || [];

    const todayLR = lrs.filter(l => l.date === today).length;
    const todayInvoice = invoices.filter(i => i.date === today).length;
    const activeTrips = lrs.filter(l => l.status === 'in-transit').length;
    const delivered = lrs.filter(l => l.status === 'delivered').length;
    const pendingInvoice = invoices.filter(i => i.status === 'draft').length;

    setStats({ todayLR, todayInvoice, activeTrips, delivered, pendingInvoice, quotations: quotes.length });

    // Revenue by month (last 6 months)
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: monthNames[d.getMonth()], year: d.getFullYear(), m: d.getMonth() };
    });

    const revData = months.map(({ month, year, m }) => {
      const amount = invoices
        .filter(inv => {
          const d = new Date(inv.date);
          return d.getFullYear() === year && d.getMonth() === m;
        })
        .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      return { month, amount };
    });
    setRevenueData(revData);

    // Recent activities
    const activities: RecentActivity[] = [];
    lrs.slice(0, 3).forEach(lr => {
      activities.push({
        type: 'LR Created',
        description: `${lr.lr_number} — ${lr.consignee_name || 'N/A'}`,
        time: formatTime(lr.created_at),
        icon: <FileText size={14} />,
        color: 'bg-blue-50 text-blue-600',
      });
    });
    invoices.slice(0, 2).forEach(inv => {
      activities.push({
        type: 'Invoice Generated',
        description: `${inv.invoice_number} — ${inv.customer_name || 'N/A'}`,
        time: formatTime(inv.created_at),
        icon: <Receipt size={14} />,
        color: 'bg-green-50 text-green-600',
      });
    });
    quotes.slice(0, 2).forEach(q => {
      activities.push({
        type: 'Quotation',
        description: `${q.quotation_number} — ${q.customer_name || 'N/A'}`,
        time: formatTime(q.created_at),
        icon: <Quote size={14} />,
        color: 'bg-amber-50 text-amber-600',
      });
    });
    activities.sort((a, b) => a.time.localeCompare(b.time));
    setRecentActivities(activities.slice(0, 6));

    // Pending deliveries
    const pending = lrs
      .filter(l => l.status !== 'delivered' && l.status !== 'cancelled')
      .slice(0, 5)
      .map(l => ({
        lr_number: l.lr_number,
        vehicle_number: l.vehicle_number,
        driver_name: l.driver_name,
        consignee_name: l.consignee_name,
        to_location: l.to_location,
        status: l.status,
        date: l.date,
      }));
    setPendingDeliveries(pending);

    setLoading(false);
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  const kpis = [
    {
      label: "Today's LR",
      value: stats.todayLR,
      icon: <FileText size={20} />,
      color: 'from-blue-500 to-brand',
      action: () => onNav({ page: 'lr-list' }),
    },
    {
      label: "Today's Invoice",
      value: `₹${((stats.todayInvoice || 0) * 15000 / 1000).toFixed(1)}K`,
      icon: <Receipt size={20} />,
      color: 'from-emerald-500 to-emerald-600',
      action: () => onNav({ page: 'invoice-list' }),
    },
    {
      label: 'Active Trips',
      value: stats.activeTrips,
      icon: <Truck size={20} />,
      color: 'from-amber-500 to-orange-500',
      action: () => onNav({ page: 'delivery-status' }),
    },
    {
      label: 'Delivered',
      value: stats.delivered,
      icon: <CheckCircle size={20} />,
      color: 'from-green-500 to-green-600',
      action: () => onNav({ page: 'report-lr' }),
    },
    {
      label: 'Pending Invoice',
      value: stats.pendingInvoice,
      icon: <Clock size={20} />,
      color: 'from-rose-500 to-red-500',
      action: () => onNav({ page: 'invoice-list' }),
    },
    {
      label: 'Quotations',
      value: stats.quotations,
      icon: <Quote size={20} />,
      color: 'from-purple-500 to-indigo-500',
      action: () => onNav({ page: 'quotation-list' }),
    },
  ];

  const statusColors: Record<string, string> = {
    created: 'bg-blue-50 text-blue-700',
    'in-transit': 'bg-amber-50 text-amber-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-xl w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting} 👋</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Here's what's happening with your fleet today.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNav({ page: 'lr-create' })} className="btn-primary">
            <Plus size={15} />
            New LR
          </button>
          <button onClick={() => onNav({ page: 'invoice-create' })} className="btn-secondary">
            <Plus size={15} />
            New Invoice
          </button>
        </div>
      </div>

      {/* Today's Overview */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Today's Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi, i) => (
            <button
              key={i}
              onClick={kpi.action}
              className="card p-4 text-left hover:shadow-card-lg transition-all duration-200 group"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white mb-3`}>
                {kpi.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">{kpi.value}</div>
              <div className="text-xs text-gray-500 font-medium">{kpi.label}</div>
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-brand transition-colors mt-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Revenue + Activities row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Revenue Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months invoice revenue</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <TrendingUp size={12} />
              +12.5%
            </div>
          </div>
          {revenueData.length > 0 ? (
            <RevenueChart data={revenueData} />
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No recent activity</div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg ${a.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-700">{a.type}</div>
                    <div className="text-xs text-gray-400 truncate">{a.description}</div>
                  </div>
                  <div className="text-[10px] text-gray-400 flex-shrink-0">{a.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Deliveries */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pending Deliveries</h2>
          <button onClick={() => onNav({ page: 'delivery-status' })} className="text-xs text-brand font-medium hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </button>
        </div>
        {pendingDeliveries.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <CheckCircle size={32} className="mx-auto mb-2 text-gray-200" />
            All deliveries completed!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">LR No</th>
                  <th className="table-th">Vehicle</th>
                  <th className="table-th">Driver</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Destination</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingDeliveries.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="table-td font-semibold text-brand">{d.lr_number}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <Truck size={13} className="text-gray-400" />
                        {d.vehicle_number || '—'}
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-gray-400" />
                        {d.driver_name || '—'}
                      </div>
                    </td>
                    <td className="table-td">{d.consignee_name || '—'}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-gray-400" />
                        {d.to_location || '—'}
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        {d.date ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`status-pill ${statusColors[d.status] || 'bg-gray-100 text-gray-600'}`}>
                        {d.status || 'created'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
