import React, { useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { ChurchEvent, VisibilityScope } from '../types/lccn';

type ScopeFilter = 'all' | VisibilityScope;

interface EventsViewProps {
  selectedEvent: ChurchEvent | null;
  onSelectEvent: (event: ChurchEvent | null) => void;
}

function formatEventDateLong(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatEventBadge(dateStr: string): { day: string; month: string; weekday: string } {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { day: '--', month: '', weekday: '' };
  }
  return {
    day: String(parsed.getDate()).padStart(2, '0'),
    month: parsed.toLocaleDateString('en-NG', { month: 'short' }),
    weekday: parsed.toLocaleDateString('en-NG', { weekday: 'short' }),
  };
}

function scopeDisplayName(scope: VisibilityScope): string {
  if (scope === 'diocese') return 'Diocese Event';
  if (scope === 'division') return 'Division Event';
  return 'Church Event';
}

export const EventsView: React.FC<EventsViewProps> = ({
  selectedEvent,
  onSelectEvent,
}) => {
  const { memberEvents, dataLoading } = useChurch();
  const [filter, setFilter] = useState<ScopeFilter>('all');

  const filtered = useMemo(() => {
    return memberEvents.filter((evt) => {
      if (filter !== 'all' && evt.visibilityScope !== filter) return false;
      return true;
    });
  }, [memberEvents, filter]);

  const filterTabs: Array<{ id: ScopeFilter; label: string }> = [
    { id: 'all', label: 'All Events' },
    { id: 'diocese', label: 'Diocese' },
    { id: 'division', label: 'Division' },
    { id: 'church', label: 'Church' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
          Upcoming Events
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          Services, fellowships, and diocesan gatherings for your congregation.
        </p>
      </div>

      {/* Scope Filter Controls */}
      <div
        role="tablist"
        aria-label="Filter events by level"
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

      {dataLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl bg-surface-50 border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-50 border border-slate-200 rounded-2xl p-10 text-center">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h2 className="font-display text-base font-semibold text-navy-900">
            No upcoming events
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
            There are no scheduled events in this category right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((evt) => {
            const { day, month, weekday } = formatEventBadge(evt.date);
            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => onSelectEvent(evt)}
                className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy-700/40 hover:bg-surface-50/40 transition-colors flex items-start gap-4 cursor-pointer"
              >
                <div className="w-16 h-18 rounded-xl bg-navy-900 text-white flex flex-col items-center justify-center shrink-0 tabular-nums py-2">
                  <span className="text-[11px] font-medium text-gold-400 uppercase leading-none">
                    {month}
                  </span>
                  <span className="font-display text-2xl font-bold leading-tight mt-0.5">
                    {day}
                  </span>
                  <span className="text-[10px] text-slate-300 leading-none">
                    {weekday}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-gold-600">
                      {scopeDisplayName(evt.visibilityScope)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{evt.organizerLabel}</span>
                  </div>

                  <h2 className="font-display text-lg font-bold text-navy-900 leading-snug">
                    {evt.title}
                  </h2>

                  <div className="mt-2.5 space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2 tabular-nums">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-xs sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
        >
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gold-600 mb-1">
                  {scopeDisplayName(selectedEvent.visibilityScope)}
                </p>
                <h2
                  id="event-modal-title"
                  className="font-display text-xl font-bold text-navy-900 leading-snug"
                >
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectEvent(null)}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-surface-50 hover:text-navy-900 transition-colors shrink-0"
                aria-label="Close event details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-surface-50 border border-slate-200/70 rounded-xl p-4 space-y-3 text-sm sm:text-base">
                <div className="flex items-center gap-3 text-slate-800 tabular-nums">
                  <Calendar className="w-4 h-4 text-navy-900 shrink-0" />
                  <span>{formatEventDateLong(selectedEvent.date)}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-800 tabular-nums">
                  <Clock className="w-4 h-4 text-navy-900 shrink-0" />
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-800">
                  <MapPin className="w-4 h-4 text-navy-900 shrink-0 mt-1" />
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-800">
                  <Users className="w-4 h-4 text-navy-900 shrink-0" />
                  <span>Organised by {selectedEvent.organizerLabel}</span>
                </div>
              </div>

              {selectedEvent.description && (
                <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-surface-50 flex justify-end">
              <button
                type="button"
                onClick={() => onSelectEvent(null)}
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
