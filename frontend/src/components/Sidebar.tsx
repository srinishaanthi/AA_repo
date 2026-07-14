import { Truck, LayoutDashboard, FileText, Receipt, Quote, MapPin, Users, Package, Car, User, BarChart2, FileBarChart, TrendingUp, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { NavState, Page } from '../types';
import { useState } from 'react';

interface SidebarProps {
  nav: NavState;
  onNav: (state: NavState) => void;
  isSplitView?: boolean;
}

interface NavGroup {
  label: string;
  items: { icon: React.ReactNode; label: string; page: Page }[];
}

const groups: NavGroup[] = [
  {
    label: 'OPERATIONS',
    items: [
      { icon: <FileText size={16} />, label: 'Lorry Receipt', page: 'lr-list' },
      { icon: <Receipt size={16} />, label: 'Lorry Invoice', page: 'invoice-list' },
      { icon: <Quote size={16} />, label: 'Quotations', page: 'quotation-list' },
      { icon: <MapPin size={16} />, label: 'Delivery Status', page: 'delivery-status' },
    ],
  },
  {
    label: 'MASTERS',
    items: [
      { icon: <Users size={16} />, label: 'Customers', page: 'customers' },
      { icon: <Package size={16} />, label: 'Items', page: 'items' },
      { icon: <Car size={16} />, label: 'Vehicles', page: 'vehicles' },
      { icon: <User size={16} />, label: 'Drivers', page: 'drivers' },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { icon: <BarChart2 size={16} />, label: 'LR Report', page: 'report-lr' },
      { icon: <FileBarChart size={16} />, label: 'Invoice Report', page: 'report-invoice' },
      { icon: <TrendingUp size={16} />, label: 'Quotation Report', page: 'report-quotation' },
    ],
  },
];

export default function Sidebar({ nav, onNav, isSplitView }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsed(c => ({ ...c, [label]: !c[label] }));
  };

  const isActive = (page: Page) => {
    if (page === 'lr-list') return ['lr-list', 'lr-create', 'lr-edit'].includes(nav.page);
    if (page === 'invoice-list') return ['invoice-list', 'invoice-create', 'invoice-edit'].includes(nav.page);
    if (page === 'quotation-list') return ['quotation-list', 'quotation-create', 'quotation-edit'].includes(nav.page);
    if (page === 'customers') return ['customers', 'customer-create', 'customer-edit'].includes(nav.page);
    return nav.page === page;
  };

  return (
    <aside className={`${isSplitView ? 'w-16' : 'w-60'} h-screen bg-white border-r border-gray-100 flex flex-col flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-200`}>
      {/* Logo */}
      <div className={`p-4 border-b border-gray-100 ${isSplitView ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck size={18} className="text-white" />
          </div>
          {!isSplitView && (
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">A & A Logistics</div>
              <div className="text-[10px] text-gray-400 font-medium">Transport Management</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {/* Dashboard */}
        <button
          onClick={() => onNav({ page: 'dashboard' })}
          title={isSplitView ? 'Dashboard' : ''}
          className={`sidebar-item w-full ${isSplitView ? 'justify-center px-0' : ''} ${nav.page === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={16} />
          {!isSplitView && 'Dashboard'}
        </button>

        {groups.map(group => (
          <div key={group.label} className="pt-2">
            {!isSplitView ? (
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-3 py-1 mb-1"
              >
                <span className="text-[10px] font-semibold text-gray-400 tracking-widest">{group.label}</span>
                {collapsed[group.label] ? <ChevronRight size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
              </button>
            ) : (
              <div className="border-t border-gray-100 my-2" />
            )}
            {(!isSplitView && collapsed[group.label]) ? null : (
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <button
                    key={item.page}
                    onClick={() => onNav({ page: item.page })}
                    title={isSplitView ? item.label : ''}
                    className={`sidebar-item w-full ${isSplitView ? 'justify-center px-0' : ''} ${isActive(item.page) ? 'active' : ''}`}
                  >
                    {item.icon}
                    {!isSplitView && item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="pt-2">
          {isSplitView ? (
            <div className="border-t border-gray-100 my-2" />
          ) : (
            <div className="px-3 py-1 mb-1">
              <span className="text-[10px] font-semibold text-gray-400 tracking-widest">SETTINGS</span>
            </div>
          )}
          <button
            onClick={() => onNav({ page: 'settings' })}
            title={isSplitView ? 'Settings' : ''}
            className={`sidebar-item w-full ${isSplitView ? 'justify-center px-0' : ''} ${nav.page === 'settings' ? 'active' : ''}`}
          >
            <Settings size={16} />
            {!isSplitView && 'Settings'}
          </button>
        </div>
      </nav>

      {/* Version */}
      {!isSplitView && (
        <div className="px-5 py-3 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">TMS v1.0 &bull; 2025-26</span>
        </div>
      )}
    </aside>
  );
}
