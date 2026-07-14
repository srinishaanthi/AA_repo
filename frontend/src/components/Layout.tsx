import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { NavState } from '../types';
import { Bell } from 'lucide-react';

interface LayoutProps {
  nav: NavState;
  onNav: (state: NavState) => void;
  children: ReactNode;
  isSplitView?: boolean;
}

export default function Layout({ nav, onNav, children, isSplitView }: LayoutProps) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      <div className="no-print">
        <Sidebar nav={nav} onNav={onNav} isSplitView={isSplitView} />
      </div>
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isSplitView ? 'ml-16' : 'ml-60'} print:!ml-0 print:!overflow-visible`}>
        {/* Top bar */}
        <header className="no-print h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <span className="text-sm text-gray-400">{today}</span>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />
            </button>
            <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">AA</span>
            </div>
          </div>
        </header>
        <main className={`flex-1 ${isSplitView ? 'overflow-hidden' : 'overflow-y-auto'} print:!overflow-visible`}>
          <div className={isSplitView ? 'h-full' : 'animate-fade-in'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
