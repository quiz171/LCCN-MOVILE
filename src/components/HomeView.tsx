import React from 'react';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  MapPin,
  Megaphone,
  MessageSquare,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { Announcement, ChurchEvent, MainTab } from '../types/lccn';

interface HomeViewProps {
  onNavigate: (tab: MainTab) => void;
  onOpenChurchInfo: () => void;
  onOpenAnnouncement: (announcement: Announcement) => void;
  onOpenEvent: (event: ChurchEvent) => void;
}

function formatPublishedDate(ts?: { toDate?: () => Date }): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Recent';
  return ts.toDate().toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatEventDate(dateStr: string): { day: string; month: string } {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { day: '--', month: '' };
  }
  return {
    day: String(parsed.getDate()).padStart(2, '0'),
    month: parsed.toLocaleDateString('en-NG', { month: 'short' }),
  };
}

function scopeLabel(scope: 'diocese' | 'division' | 'church'): string {
  if (scope === 'diocese') return 'Diocese';
  if (scope === 'division') return 'Division';
  return 'Church';
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenChurchInfo,
  onOpenAnnouncement,
  onOpenEvent,
}) => {
  const {
    member,
    currentChurch,
    currentDivision,
    currentDiocese,
    memberAnnouncements,
    memberEvents,
  } = useChurch();

  const firstName = member?.fullName?.split(' ')[0] || 'Member';
  const latestAnnouncements = memberAnnouncements.slice(0, 3);
  const upcomingEvents = memberEvents.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* 1. Simple Welcome & Selected Church */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 bg-navy-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gold-400">
              {currentDiocese?.name || 'Abuja Diocese'}
              {currentDivision ? ` · ${currentDivision.name}` : ''}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-2 text-balance">
              Welcome, {firstName}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-200 leading-relaxed max-w-lg">
              {currentChurch
                ? `You are connected to ${currentChurch.name}.`
                : 'Your LCCN church community is ready.'}
            </p>
          </div>

          {currentChurch && (
            <div className="mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-300">Pastor &amp; Service</div>
                <div className="text-sm sm:text-base font-medium text-white mt-0.5">
                  {currentChurch.pastorName}
                </div>
                <div className="text-xs sm:text-sm text-gold-400 mt-0.5 tabular-nums">
                  {currentChurch.serviceSchedule[0] || 'See church schedule'}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenChurchInfo}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-navy-900 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-surface-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Church Information</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 2. Prominent Smart Assistant Entry */}
        <div className="lg:col-span-5 bg-surface-50 border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-gold-100 text-gold-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-navy-900">
              LCCN Smart Assistant
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Ask about Sunday service times, your pastor, church address, or the latest announcements and events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('assistant')}
            className="mt-6 w-full min-h-[48px] px-5 py-3 rounded-xl bg-navy-900 text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <span>Ask a Question</span>
            <ArrowRight className="w-4 h-4 text-gold-400" />
          </button>
        </div>
      </section>

      {/* 3. Latest Announcements & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Announcements */}
        <section aria-labelledby="home-announcements-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="home-announcements-heading"
              className="font-display text-lg sm:text-xl font-bold text-navy-900"
            >
              Latest Announcements
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('announcements')}
              className="min-h-[44px] px-2 text-sm font-medium text-navy-700 hover:text-navy-900 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>See all</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {latestAnnouncements.length === 0 ? (
            <div className="bg-surface-50 border border-slate-200 rounded-2xl p-6 text-center">
              <Megaphone className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                No announcements have been posted for your church yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestAnnouncements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenAnnouncement(item)}
                  className="w-full text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy-700/40 hover:bg-surface-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 tabular-nums">
                    <span className="font-semibold text-gold-600">
                      {scopeLabel(item.visibilityScope)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatPublishedDate(item.publishedAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{item.authorityLabel}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-navy-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section aria-labelledby="home-events-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="home-events-heading"
              className="font-display text-lg sm:text-xl font-bold text-navy-900"
            >
              Upcoming Events
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="min-h-[44px] px-2 text-sm font-medium text-navy-700 hover:text-navy-900 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>See all</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-surface-50 border border-slate-200 rounded-2xl p-6 text-center">
              <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                No upcoming events are scheduled right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((evt) => {
                const { day, month } = formatEventDate(evt.date);
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => onOpenEvent(evt)}
                    className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-navy-700/40 hover:bg-surface-50/50 transition-colors flex items-start gap-4 cursor-pointer"
                  >
                    <div className="w-13 h-14 rounded-xl bg-navy-50 text-navy-900 flex flex-col items-center justify-center shrink-0 tabular-nums">
                      <span className="text-[11px] font-semibold uppercase text-gold-600 leading-none">
                        {month}
                      </span>
                      <span className="font-display text-xl font-bold leading-tight mt-0.5">
                        {day}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 tabular-nums">
                        <span className="font-semibold text-gold-600">
                          {scopeLabel(evt.visibilityScope)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{evt.time}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-navy-900 leading-snug">
                        {evt.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
