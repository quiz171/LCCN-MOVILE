import React, { useMemo, useState } from 'react';
import { Megaphone, Search, X } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { Announcement, VisibilityScope } from '../types/lccn';

type ScopeFilter = 'all' | VisibilityScope;

interface AnnouncementsViewProps {
  selectedAnnouncement: Announcement | null;
  onSelectAnnouncement: (announcement: Announcement | null) => void;
}

function formatFullDate(ts?: { toDate?: () => Date }): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Recently published';
  return ts.toDate().toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function scopeText(scope: VisibilityScope): string {
  if (scope === 'diocese') return 'Diocese-wide';
  if (scope === 'division') return 'Division';
  return 'Your Church';
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  selectedAnnouncement,
  onSelectAnnouncement,
}) => {
  const { memberAnnouncements, dataLoading } = useChurch();
  const [filter, setFilter] = useState<ScopeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return memberAnnouncements.filter((item) => {
      if (filter !== 'all' && item.visibilityScope !== filter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.authorityLabel.toLowerCase().includes(q)
      );
    });
  }, [memberAnnouncements, filter, searchTerm]);

  const filterTabs: Array<{ id: ScopeFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'diocese', label: 'Diocese' },
    { id: 'division', label: 'Division' },
    { id: 'church', label: 'Church' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
            Announcements
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Official notices from Abuja Diocese, your division, and your local church.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notices..."
            aria-label="Search announcements"
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>
      </div>

      {/* Scope Filter Controls */}
      <div
        role="tablist"
        aria-label="Filter announcements by scope"
        className="inline-flex items-center gap-1 p-1 bg-surface-100 rounded-xl overflow-x-auto max-w-full"
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === tab.id
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading / Empty / List */}
      {dataLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-36 rounded-2xl bg-surface-50 border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-50 border border-slate-200 rounded-2xl p-10 text-center">
          <Megaphone className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h2 className="font-display text-base font-semibold text-navy-900">
            No announcements found
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Try clearing your search or switching to All announcements.'
              : 'When your church, division, or diocese publishes a notice, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectAnnouncement(item)}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-navy-700/40 hover:bg-surface-50/40 transition-colors flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-2 tabular-nums">
                  <span className="font-semibold text-gold-600">
                    {scopeText(item.visibilityScope)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{formatFullDate(item.publishedAt)}</span>
                </div>
                <h2 className="font-display text-lg font-bold text-navy-900 leading-snug">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="text-slate-500 truncate">{item.authorityLabel}</span>
                <span className="font-medium text-navy-900 whitespace-nowrap shrink-0">
                  Read message
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Full Announcement Reader Modal */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-xs sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-modal-title"
        >
          <div className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-1.5 tabular-nums">
                  <span className="font-semibold text-gold-600">
                    {scopeText(selectedAnnouncement.visibilityScope)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{formatFullDate(selectedAnnouncement.publishedAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedAnnouncement.authorityLabel}</span>
                </div>
                <h2
                  id="announcement-modal-title"
                  className="font-display text-xl sm:text-2xl font-bold text-navy-900 leading-tight"
                >
                  {selectedAnnouncement.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onSelectAnnouncement(null)}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-surface-50 hover:text-navy-900 transition-colors shrink-0"
                aria-label="Close announcement"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-base text-slate-800 leading-relaxed whitespace-pre-line max-w-[68ch]">
                {selectedAnnouncement.body}
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-surface-50 flex justify-end">
              <button
                type="button"
                onClick={() => onSelectAnnouncement(null)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
