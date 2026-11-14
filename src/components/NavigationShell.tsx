import React from 'react';
import {
  Calendar,
  Home,
  Megaphone,
  MessageSquare,
  User,
} from 'lucide-react';
import { MainTab } from '../types/lccn';
import { LccnLogo } from './LccnLogo';

interface NavigationShellProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  churchName?: string;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'announcements', label: 'Notices', icon: Megaphone },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'assistant', label: 'Assistant', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
];

export const NavigationShell: React.FC<NavigationShellProps> = ({
  activeTab,
  onTabChange,
  churchName,
  children,
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Desktop Navigation Rail (lg+) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white z-30">
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <LccnLogo className="w-11 h-11" />
            <div className="min-w-0">
              <div className="font-display text-base font-bold text-navy-900 truncate">
                LCCN Abuja
              </div>
              <div className="text-xs text-slate-500 truncate">
                {churchName || 'Abuja Diocese'}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full min-h-[48px] px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-700 hover:bg-surface-50 hover:text-navy-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    active ? 'text-gold-400' : 'text-slate-400'
                  }`}
                />
                <span>
                  {item.id === 'announcements' ? 'Announcements' : item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-100 text-xs text-slate-500">
          Lutheran Church of Christ in Nigeria
        </div>
      </aside>

      {/* Mobile Compact Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between pt-safe">
        <div className="flex items-center gap-2.5 min-w-0">
          <LccnLogo className="w-9 h-9 rounded-lg p-0.5" />
          <span className="font-display text-base font-bold text-navy-900 truncate">
            LCCN Abuja
          </span>
        </div>
        {churchName && (
          <span className="text-xs font-medium text-slate-500 truncate max-w-[160px]">
            {churchName}
          </span>
        )}
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Fixed 5-Item Bottom Navigation Bar */}
      <nav
        aria-label="Bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className="min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 cursor-pointer"
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-navy-900' : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-[11px] leading-none tracking-tight whitespace-nowrap ${
                    active ? 'font-semibold text-navy-900' : 'font-medium text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="w-4 h-0.5 rounded-full bg-gold-500" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
