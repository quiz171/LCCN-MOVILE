import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Megaphone,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { UI_STRINGS } from '../i18n/strings';
import { LccnLogo } from './LccnLogo';
import {
  AdminInvite,
  AdminRecord,
  AdminRole,
  Announcement,
  Church,
  ChurchEvent,
  FIELD_LIMITS,
  MemberProfile,
  VisibilityScope,
} from '../types/lccn';

type AdminTab = 'announcements' | 'events' | 'churches' | 'members' | 'admins';

interface AdminPortalProps {
  onExit: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExit }) => {
  const {
    user,
    isAdmin,
    effectiveAdminRole,
    adminRecord,
    divisions,
    districts,
    churches,
    allAnnouncements,
    allEvents,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    createEvent,
    updateEvent,
    deleteEvent,
    updateChurchInfo,
    createChurch,
    createDivision,
    fetchScopedMembers,
    fetchAdminDirectory,
    assignAdminInvite,
    revokeAdmin,
    revokeAdminInvite,
  } = useChurch();

  const [activeTab, setActiveTab] = useState<AdminTab>('announcements');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Scoped members state
  const [membersList, setMembersList] = useState<MemberProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Admin accounts directory (Diocese Secretary only)
  const [adminsList, setAdminsList] = useState<AdminRecord[]>([]);
  const [invitesList, setInvitesList] = useState<AdminInvite[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // Modals / forms state
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  const [editingChurch, setEditingChurch] = useState<Church | null>(null);
  const [showNewChurchForm, setShowNewChurchForm] = useState(false);
  const [showNewDivisionForm, setShowNewDivisionForm] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const assignedDioceseId = adminRecord?.dioceseId || 'abuja';
  const assignedDivisionId = adminRecord?.divisionId || '';
  const assignedChurchId = adminRecord?.churchId || '';

  const allowedScopes = useMemo<VisibilityScope[]>(() => {
    if (effectiveAdminRole === 'diocese_secretary') return ['diocese', 'division', 'church'];
    if (effectiveAdminRole === 'division_admin') return ['division', 'church'];
    if (effectiveAdminRole === 'church_admin') return ['church'];
    return [];
  }, [effectiveAdminRole]);

  const scopedDivisions = useMemo(() => {
    if (effectiveAdminRole === 'diocese_secretary') return divisions;
    return divisions.filter((d) => d.id === assignedDivisionId);
  }, [divisions, effectiveAdminRole, assignedDivisionId]);

  const scopedChurches = useMemo(() => {
    if (effectiveAdminRole === 'diocese_secretary') return churches;
    if (effectiveAdminRole === 'division_admin') {
      return churches.filter((c) => c.divisionId === assignedDivisionId);
    }
    if (effectiveAdminRole === 'church_admin') {
      return churches.filter((c) => c.id === assignedChurchId);
    }
    return [];
  }, [churches, effectiveAdminRole, assignedDivisionId, assignedChurchId]);

  const scopedAnnouncements = useMemo(() => {
    return allAnnouncements.filter((a) => {
      if (effectiveAdminRole === 'diocese_secretary') return a.dioceseId === assignedDioceseId;
      if (effectiveAdminRole === 'division_admin') {
        return (
          (a.visibilityScope === 'division' || a.visibilityScope === 'church') &&
          a.divisionId === assignedDivisionId
        );
      }
      if (effectiveAdminRole === 'church_admin') {
        return a.visibilityScope === 'church' && a.churchId === assignedChurchId;
      }
      return false;
    });
  }, [allAnnouncements, effectiveAdminRole, assignedDioceseId, assignedDivisionId, assignedChurchId]);

  const scopedEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (effectiveAdminRole === 'diocese_secretary') return e.dioceseId === assignedDioceseId;
      if (effectiveAdminRole === 'division_admin') {
        return (
          (e.visibilityScope === 'division' || e.visibilityScope === 'church') &&
          e.divisionId === assignedDivisionId
        );
      }
      if (effectiveAdminRole === 'church_admin') {
        return e.visibilityScope === 'church' && e.churchId === assignedChurchId;
      }
      return false;
    });
  }, [allEvents, effectiveAdminRole, assignedDioceseId, assignedDivisionId, assignedChurchId]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const list = await fetchScopedMembers();
      setMembersList(list);
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to load members.',
      });
    } finally {
      setMembersLoading(false);
    }
  }, [fetchScopedMembers]);

  const loadAdmins = useCallback(async () => {
    if (effectiveAdminRole !== 'diocese_secretary') return;
    setAdminsLoading(true);
    try {
      const res = await fetchAdminDirectory();
      setAdminsList(res.admins);
      setInvitesList(res.invites);
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to load administrator directory.',
      });
    } finally {
      setAdminsLoading(false);
    }
  }, [effectiveAdminRole, fetchAdminDirectory]);

  useEffect(() => {
    if (activeTab === 'members' && isAdmin) {
      loadMembers();
    }
    if (activeTab === 'admins' && effectiveAdminRole === 'diocese_secretary') {
      loadAdmins();
    }
  }, [activeTab, isAdmin, effectiveAdminRole, loadMembers, loadAdmins]);

  const scopeBadgeText = useMemo(() => {
    if (effectiveAdminRole === 'diocese_secretary') return 'Abuja Diocese (Full Scope)';
    if (effectiveAdminRole === 'division_admin') {
      const divName = divisions.find((d) => d.id === assignedDivisionId)?.name;
      return divName ? `${divName} Scope` : 'Division Scope';
    }
    if (effectiveAdminRole === 'church_admin') {
      const chName = churches.find((c) => c.id === assignedChurchId)?.name;
      return chName ? `${chName} Scope` : 'Church Scope';
    }
    return '';
  }, [effectiveAdminRole, divisions, churches, assignedDivisionId, assignedChurchId]);

  if (!isAdmin || !effectiveAdminRole) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy-900 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-navy-900">
            Administration Access Restricted
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            This portal is reserved for authorized LCCN Abuja Diocese, Division, and Church secretaries. Your account ({user?.email || 'current user'}) does not currently hold an administrative assignment.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-6 w-full min-h-[48px] px-5 py-3 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Return to Member App
          </button>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'churches', label: 'Churches', icon: Building2 },
    { id: 'members', label: 'Members', icon: Users },
  ];

  if (effectiveAdminRole === 'diocese_secretary') {
    tabs.push({ id: 'admins', label: 'Admins', icon: UserPlus });
  }

  const filteredMembers = membersList.filter((m) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.phoneNumber.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExit}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              aria-label="Back to member app"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <LccnLogo className="w-9 h-9 rounded-lg p-0.5 hidden sm:flex" />
            <div className="min-w-0">
              <div className="font-display text-base font-bold truncate">
                LCCN Administration Portal
              </div>
              <div className="text-xs text-gold-400 truncate">
                {UI_STRINGS.en.roles[effectiveAdminRole]} · {scopeBadgeText}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="hidden sm:inline-flex min-h-[40px] px-4 py-2 rounded-xl bg-white text-navy-900 text-xs font-semibold hover:bg-surface-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Member View
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {banner && (
          <div
            role="status"
            className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3 border ${
              banner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span>{banner.text}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Administration sections"
          className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl overflow-x-auto"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => {
                  setActiveTab(tab.id);
                  setConfirmDeleteId(null);
                }}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-surface-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-gold-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-navy-900">
                  Manage Announcements
                </h2>
                <p className="text-sm text-slate-600">
                  Create, edit, or remove announcements within your administrative scope.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAnnouncement(null);
                  setShowAnnouncementForm(true);
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>New Announcement</span>
              </button>
            </div>

            {scopedAnnouncements.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-600">
                No announcements published in your scope yet.
              </div>
            ) : (
              <div className="space-y-3">
                {scopedAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-semibold text-gold-600 uppercase">
                          {item.visibilityScope}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.authorityLabel}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-navy-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{item.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnnouncement(item);
                          setShowAnnouncementForm(true);
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-navy-900 hover:bg-surface-50 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>Edit</span>
                      </button>

                      {confirmDeleteId === item.id ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteAnnouncement(item.id);
                            setConfirmDeleteId(null);
                            setBanner({ type: 'success', text: 'Announcement deleted.' });
                          }}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          aria-label={`Delete ${item.title}`}
                          className="min-h-[44px] min-w-[44px] rounded-xl border border-red-200 text-red-700 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: EVENTS */}
        {activeTab === 'events' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-navy-900">
                  Manage Events
                </h2>
                <p className="text-sm text-slate-600">
                  Schedule and update church, division, or diocesan events.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventForm(true);
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>New Event</span>
              </button>
            </div>

            {scopedEvents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-600">
                No events scheduled in your scope yet.
              </div>
            ) : (
              <div className="space-y-3">
                {scopedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1 tabular-nums">
                        <span className="font-semibold text-gold-600 uppercase">
                          {evt.visibilityScope}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {evt.date} at {evt.time}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{evt.organizerLabel}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-navy-900">
                        {evt.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{evt.location}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(evt);
                          setShowEventForm(true);
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-navy-900 hover:bg-surface-50 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>Edit</span>
                      </button>

                      {confirmDeleteId === evt.id ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteEvent(evt.id);
                            setConfirmDeleteId(null);
                            setBanner({ type: 'success', text: 'Event deleted.' });
                          }}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(evt.id)}
                          aria-label={`Delete ${evt.title}`}
                          className="min-h-[44px] min-w-[44px] rounded-xl border border-red-200 text-red-700 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: CHURCHES */}
        {activeTab === 'churches' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-navy-900">
                  Churches &amp; Parish Details
                </h2>
                <p className="text-sm text-slate-600">
                  Update pastor names, addresses, and service schedules in your jurisdiction.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {effectiveAdminRole === 'diocese_secretary' && (
                  <button
                    type="button"
                    onClick={() => setShowNewDivisionForm(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-navy-900 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-surface-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-gold-600" />
                    <span>Add Division</span>
                  </button>
                )}
                {(effectiveAdminRole === 'diocese_secretary' ||
                  effectiveAdminRole === 'division_admin') && (
                  <button
                    type="button"
                    onClick={() => setShowNewChurchForm(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium inline-flex items-center gap-1.5 hover:bg-navy-800 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-gold-400" />
                    <span>Add Church</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopedChurches.map((ch) => {
                const divName = divisions.find((d) => d.id === ch.divisionId)?.name || '';
                return (
                  <div
                    key={ch.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-medium text-gold-600 mb-1">
                        {divName}
                      </div>
                      <h3 className="font-display text-lg font-bold text-navy-900">
                        {ch.name}
                      </h3>
                      <p className="text-sm text-slate-700 mt-1">
                        Pastor: {ch.pastorName}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{ch.address}</p>
                      <ul className="mt-3 space-y-1 text-xs text-slate-600 tabular-nums">
                        {ch.serviceSchedule.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingChurch(ch)}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-navy-900 hover:bg-surface-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-gold-600" />
                      <span>Update Church Information</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 4: MEMBERS */}
        {activeTab === 'members' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-navy-900">
                  Registered Members ({filteredMembers.length})
                </h2>
                <p className="text-sm text-slate-600">
                  Members registered within {scopeBadgeText}.
                </p>
              </div>
              <input
                type="search"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search name or phone..."
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            {membersLoading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
                Loading members in your scope...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600">
                No registered members found in this scope yet.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-surface-50 text-xs font-semibold text-slate-600">
                        <th className="py-3.5 px-4">Full Name</th>
                        <th className="py-3.5 px-4">Phone</th>
                        <th className="py-3.5 px-4">Church</th>
                        <th className="py-3.5 px-4">Subgroup</th>
                        <th className="py-3.5 px-4">Division</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredMembers.map((m) => {
                        const chName =
                          churches.find((c) => c.id === m.churchId)?.name || m.churchId;
                        const divName =
                          divisions.find((d) => d.id === m.divisionId)?.name || m.divisionId;
                        return (
                          <tr key={m.uid} className="hover:bg-surface-50/50">
                            <td className="py-3.5 px-4 font-medium text-navy-900">
                              <div>{m.fullName}</div>
                              <div className="text-xs text-slate-500">{m.email}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 tabular-nums whitespace-nowrap">
                              {m.phoneNumber}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">{chName}</td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {m.subgroup || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">{divName}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 5: ADMINS (Diocese Secretary Only) */}
        {activeTab === 'admins' && effectiveAdminRole === 'diocese_secretary' && (
          <AdminManagementSection
            admins={adminsList}
            invites={invitesList}
            loading={adminsLoading}
            divisions={divisions}
            churches={churches}
            dioceseId={assignedDioceseId}
            currentUserUid={user?.uid || ''}
            onAssign={async (payload) => {
              await assignAdminInvite(payload);
              setBanner({
                type: 'success',
                text: `Administrator invitation created for ${payload.email}. They will automatically receive access upon signing in with Google.`,
              });
              await loadAdmins();
            }}
            onRevokeAdmin={async (id) => {
              await revokeAdmin(id);
              setBanner({ type: 'success', text: 'Administrator access removed.' });
              await loadAdmins();
            }}
            onRevokeInvite={async (id) => {
              await revokeAdminInvite(id);
              setBanner({ type: 'success', text: 'Pending invitation cancelled.' });
              await loadAdmins();
            }}
          />
        )}
      </main>

      {/* Announcement Create/Edit Modal */}
      {showAnnouncementForm && (
        <AnnouncementFormModal
          initial={editingAnnouncement}
          allowedScopes={allowedScopes}
          divisions={scopedDivisions}
          churches={scopedChurches}
          defaultDioceseId={assignedDioceseId}
          defaultDivisionId={assignedDivisionId || scopedDivisions[0]?.id || ''}
          defaultChurchId={assignedChurchId || scopedChurches[0]?.id || ''}
          defaultAuthority={UI_STRINGS.en.roles[effectiveAdminRole]}
          onClose={() => setShowAnnouncementForm(false)}
          onSave={async (payload) => {
            if (editingAnnouncement) {
              await updateAnnouncement(editingAnnouncement.id, payload);
              setBanner({ type: 'success', text: 'Announcement updated.' });
            } else {
              await createAnnouncement({ ...payload, dioceseId: assignedDioceseId });
              setBanner({ type: 'success', text: 'Announcement published.' });
            }
            setShowAnnouncementForm(false);
          }}
        />
      )}

      {/* Event Create/Edit Modal */}
      {showEventForm && (
        <EventFormModal
          initial={editingEvent}
          allowedScopes={allowedScopes}
          divisions={scopedDivisions}
          churches={scopedChurches}
          defaultDivisionId={assignedDivisionId || scopedDivisions[0]?.id || ''}
          defaultChurchId={assignedChurchId || scopedChurches[0]?.id || ''}
          defaultOrganizer={
            effectiveAdminRole === 'church_admin'
              ? scopedChurches[0]?.name || 'Local Church'
              : effectiveAdminRole === 'division_admin'
              ? scopedDivisions[0]?.name || 'Division'
              : 'LCCN Abuja Diocese'
          }
          onClose={() => setShowEventForm(false)}
          onSave={async (payload) => {
            if (editingEvent) {
              await updateEvent(editingEvent.id, payload);
              setBanner({ type: 'success', text: 'Event updated.' });
            } else {
              await createEvent({ ...payload, dioceseId: assignedDioceseId });
              setBanner({ type: 'success', text: 'Event created.' });
            }
            setShowEventForm(false);
          }}
        />
      )}

      {/* Update Church Modal */}
      {editingChurch && (
        <ChurchFormModal
          initial={editingChurch}
          divisions={scopedDivisions}
          districts={districts}
          canChangeHierarchy={effectiveAdminRole !== 'church_admin'}
          onClose={() => setEditingChurch(null)}
          onSave={async (payload) => {
            await updateChurchInfo(editingChurch.id, payload);
            setBanner({ type: 'success', text: `${payload.name} updated.` });
            setEditingChurch(null);
          }}
        />
      )}

      {/* Add New Church Modal */}
      {showNewChurchForm && (
        <ChurchFormModal
          initial={null}
          divisions={scopedDivisions}
          districts={districts}
          canChangeHierarchy={effectiveAdminRole === 'diocese_secretary'}
          defaultDivisionId={assignedDivisionId || scopedDivisions[0]?.id || ''}
          onClose={() => setShowNewChurchForm(false)}
          onSave={async (payload) => {
            await createChurch({
              dioceseId: assignedDioceseId,
              divisionId: payload.divisionId || assignedDivisionId || scopedDivisions[0]?.id || '',
              districtId: payload.districtId || '',
              name: payload.name,
              pastorName: payload.pastorName,
              address: payload.address,
              phone: payload.phone,
              serviceSchedule: payload.serviceSchedule,
            });
            setBanner({ type: 'success', text: `${payload.name} added.` });
            setShowNewChurchForm(false);
          }}
        />
      )}

      {/* Add New Division Modal */}
      {showNewDivisionForm && (
        <DivisionFormModal
          onClose={() => setShowNewDivisionForm(false)}
          onSave={async (payload) => {
            await createDivision({
              dioceseId: assignedDioceseId,
              ...payload,
            });
            setBanner({ type: 'success', text: `${payload.name} added to Abuja Diocese.` });
            setShowNewDivisionForm(false);
          }}
        />
      )}
    </div>
  );
};

// ── Sub-Modals & Admin Management ───────────────────────────────────────

const AnnouncementFormModal: React.FC<{
  initial: Announcement | null;
  allowedScopes: VisibilityScope[];
  divisions: Array<{ id: string; name: string }>;
  churches: Church[];
  defaultDioceseId: string;
  defaultDivisionId: string;
  defaultChurchId: string;
  defaultAuthority: string;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    summary: string;
    body: string;
    visibilityScope: VisibilityScope;
    divisionId: string;
    churchId: string;
    authorityLabel: string;
  }) => Promise<void>;
}> = ({
  initial,
  allowedScopes,
  divisions,
  churches,
  defaultDivisionId,
  defaultChurchId,
  defaultAuthority,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [summary, setSummary] = useState(initial?.summary || '');
  const [body, setBody] = useState(initial?.body || '');
  const [scope, setScope] = useState<VisibilityScope>(
    initial?.visibilityScope || allowedScopes[0] || 'church'
  );
  const [divisionId, setDivisionId] = useState(initial?.divisionId || defaultDivisionId);
  const [churchId, setChurchId] = useState(initial?.churchId || defaultChurchId);
  const [authorityLabel, setAuthorityLabel] = useState(
    initial?.authorityLabel || defaultAuthority
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const churchesInDivision = churches.filter((c) => !divisionId || c.divisionId === divisionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (title.trim().length < 3 || summary.trim().length < 5 || body.trim().length < 5) {
      setErr('Please fill in title, short summary, and full message.');
      return;
    }
    const targetChurch = churches.find((c) => c.id === churchId);
    const resolvedDivisionId =
      scope === 'diocese'
        ? ''
        : scope === 'church'
        ? targetChurch?.divisionId || divisionId
        : divisionId;
    const resolvedChurchId = scope === 'church' ? churchId : '';

    setSaving(true);
    try {
      await onSave({
        title,
        summary,
        body,
        visibilityScope: scope,
        divisionId: resolvedDivisionId,
        churchId: resolvedChurchId,
        authorityLabel,
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-xs sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-900">
            {initial ? 'Edit Announcement' : 'Publish Announcement'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-surface-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {err && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-800">
              {err}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Visibility</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as VisibilityScope)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
            >
              {allowedScopes.map((s) => (
                <option key={s} value={s}>
                  {s === 'diocese'
                    ? 'Diocese-wide (All Abuja Diocese)'
                    : s === 'division'
                    ? 'Division-specific'
                    : 'Church-specific'}
                </option>
              ))}
            </select>
          </div>

          {scope === 'division' && (
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Division</label>
              <select
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'church' && (
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Church</label>
              <select
                value={churchId}
                onChange={(e) => setChurchId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {(churchesInDivision.length > 0 ? churchesInDivision : churches).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Title</label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.titleMax}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Short Summary
            </label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.summaryMax}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Full Message
            </label>
            <textarea
              rows={5}
              required
              maxLength={FIELD_LIMITS.bodyMax}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Publishing Authority
            </label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.authorityLabelMax}
              value={authorityLabel}
              onChange={(e) => setAuthorityLabel(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 text-gold-400" />
              <span>{saving ? 'Saving...' : initial ? 'Save Changes' : 'Publish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventFormModal: React.FC<{
  initial: ChurchEvent | null;
  allowedScopes: VisibilityScope[];
  divisions: Array<{ id: string; name: string }>;
  churches: Church[];
  defaultDivisionId: string;
  defaultChurchId: string;
  defaultOrganizer: string;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    visibilityScope: VisibilityScope;
    divisionId: string;
    churchId: string;
    organizerLabel: string;
  }) => Promise<void>;
}> = ({
  initial,
  allowedScopes,
  divisions,
  churches,
  defaultDivisionId,
  defaultChurchId,
  defaultOrganizer,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [date, setDate] = useState(initial?.date || '2026-11-22');
  const [time, setTime] = useState(initial?.time || '9:00 AM');
  const [location, setLocation] = useState(initial?.location || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [scope, setScope] = useState<VisibilityScope>(
    initial?.visibilityScope || allowedScopes[0] || 'church'
  );
  const [divisionId, setDivisionId] = useState(initial?.divisionId || defaultDivisionId);
  const [churchId, setChurchId] = useState(initial?.churchId || defaultChurchId);
  const [organizerLabel, setOrganizerLabel] = useState(
    initial?.organizerLabel || defaultOrganizer
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (title.trim().length < 3 || !date || !time.trim() || !location.trim()) {
      setErr('Please enter event title, date, time, and location.');
      return;
    }
    const targetChurch = churches.find((c) => c.id === churchId);
    const resolvedDivisionId =
      scope === 'diocese'
        ? ''
        : scope === 'church'
        ? targetChurch?.divisionId || divisionId
        : divisionId;
    const resolvedChurchId = scope === 'church' ? churchId : '';

    setSaving(true);
    try {
      await onSave({
        title,
        description,
        date,
        time,
        location,
        visibilityScope: scope,
        divisionId: resolvedDivisionId,
        churchId: resolvedChurchId,
        organizerLabel,
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to save event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-xs sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-900">
            {initial ? 'Edit Event' : 'Create Event'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-surface-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {err && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-800">
              {err}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Event Level</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as VisibilityScope)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
            >
              {allowedScopes.map((s) => (
                <option key={s} value={s}>
                  {s === 'diocese'
                    ? 'Diocese Event'
                    : s === 'division'
                    ? 'Division Event'
                    : 'Church Event'}
                </option>
              ))}
            </select>
          </div>

          {scope === 'division' && (
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Division</label>
              <select
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'church' && (
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Church</label>
              <select
                value={churchId}
                onChange={(e) => setChurchId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Event Name</label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.titleMax}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Time</label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.timeMax}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 9:00 AM"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Location</label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.locationMax}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Organising Church or Authority
            </label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.authorityLabelMax}
              value={organizerLabel}
              onChange={(e) => setOrganizerLabel(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={FIELD_LIMITS.descriptionMax}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 text-gold-400" />
              <span>{saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChurchFormModal: React.FC<{
  initial: Church | null;
  divisions: Array<{ id: string; name: string }>;
  districts: Array<{ id: string; divisionId: string; name: string }>;
  canChangeHierarchy: boolean;
  defaultDivisionId?: string;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    pastorName: string;
    address: string;
    phone: string;
    serviceSchedule: string[];
    divisionId?: string;
    districtId?: string;
  }) => Promise<void>;
}> = ({
  initial,
  divisions,
  districts,
  canChangeHierarchy,
  defaultDivisionId,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initial?.name || '');
  const [pastorName, setPastorName] = useState(initial?.pastorName || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [divisionId, setDivisionId] = useState(
    initial?.divisionId || defaultDivisionId || divisions[0]?.id || ''
  );
  const [districtId, setDistrictId] = useState(initial?.districtId || '');
  const [scheduleText, setScheduleText] = useState(
    initial?.serviceSchedule?.join('\n') || 'Sunday Worship Service: 8:00 AM – 10:30 AM'
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const availableDistricts = districts.filter((d) => d.divisionId === divisionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const serviceSchedule = scheduleText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!name.trim() || !pastorName.trim() || !address.trim() || serviceSchedule.length === 0) {
      setErr('Church name, pastor, address, and at least one service schedule line are required.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name,
        pastorName,
        address,
        phone,
        serviceSchedule,
        divisionId: canChangeHierarchy ? divisionId : undefined,
        districtId: canChangeHierarchy ? districtId : undefined,
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to save church information.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-xs sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-900">
            {initial ? 'Update Church Information' : 'Add New Church'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-surface-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {err && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-800">
              {err}
            </div>
          )}

          {canChangeHierarchy && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Division</label>
                <select
                  value={divisionId}
                  onChange={(e) => {
                    setDivisionId(e.target.value);
                    setDistrictId('');
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              {availableDistricts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    District (optional)
                  </label>
                  <select
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
                  >
                    <option value="">None</option>
                    {availableDistricts.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Church Name</label>
            <input
              type="text"
              required
              maxLength={140}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Pastor Name</label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.fullNameMax}
              value={pastorName}
              onChange={(e) => setPastorName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Address</label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.addressMax}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Church Phone <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              maxLength={40}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Service Days &amp; Times (one per line)
            </label>
            <textarea
              rows={4}
              required
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 text-gold-400" />
              <span>{saving ? 'Saving...' : 'Save Church'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DivisionFormModal: React.FC<{
  onClose: () => void;
  onSave: (payload: {
    name: string;
    headquarters: string;
    chairpersonName: string;
  }) => Promise<void>;
}> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [chairpersonName, setChairpersonName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name, headquarters, chairpersonName });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-xs sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-900">Add Division</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-surface-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Division Name</label>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lugbe Division"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Headquarters</label>
            <input
              type="text"
              maxLength={200}
              value={headquarters}
              onChange={(e) => setHeadquarters(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Division Chairperson
            </label>
            <input
              type="text"
              maxLength={120}
              value={chairpersonName}
              onChange={(e) => setChairpersonName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-navy-900 text-white text-sm font-medium cursor-pointer"
            >
              {saving ? 'Adding...' : 'Add Division'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminManagementSection: React.FC<{
  admins: AdminRecord[];
  invites: AdminInvite[];
  loading: boolean;
  divisions: Array<{ id: string; name: string }>;
  churches: Church[];
  dioceseId: string;
  currentUserUid: string;
  onAssign: (payload: {
    email: string;
    fullName: string;
    role: AdminRole;
    dioceseId: string;
    divisionId: string;
    churchId: string;
  }) => Promise<void>;
  onRevokeAdmin: (id: string) => Promise<void>;
  onRevokeInvite: (id: string) => Promise<void>;
}> = ({
  admins,
  invites,
  loading,
  divisions,
  churches,
  dioceseId,
  currentUserUid,
  onAssign,
  onRevokeAdmin,
  onRevokeInvite,
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AdminRole>('church_admin');
  const [divisionId, setDivisionId] = useState(divisions[0]?.id || '');
  const [churchId, setChurchId] = useState(churches[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;
    setSubmitting(true);
    try {
      const selectedChurch = churches.find((c) => c.id === churchId);
      await onAssign({
        email: email.trim(),
        fullName: fullName.trim(),
        role,
        dioceseId,
        divisionId:
          role === 'diocese_secretary'
            ? ''
            : role === 'church_admin'
            ? selectedChurch?.divisionId || divisionId
            : divisionId,
        churchId: role === 'church_admin' ? churchId : '',
      });
      setEmail('');
      setFullName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">
          Assign Administrator Role
        </h2>
        <p className="text-sm text-slate-600 mt-1 mb-5">
          Only the Abuja Diocese General Secretary can assign new administrative accounts.
        </p>

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Administrator Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rev. Jonah Bitrus"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Google Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
            >
              <option value="church_admin">Church Administrator / Secretary</option>
              <option value="division_admin">Division Administrator</option>
              <option value="diocese_secretary">Abuja Diocese General Secretary</option>
            </select>
          </div>

          {role === 'division_admin' && (
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Assigned Division
              </label>
              <select
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === 'church_admin' && (
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Assigned Church
              </label>
              <select
                value={churchId}
                onChange={(e) => setChurchId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Assigning...' : 'Assign Administrator'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-display text-base font-bold text-navy-900 mb-3">
            Active Administrators
          </h3>
          {loading ? (
            <p className="text-sm text-slate-500">Loading administrators...</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-slate-500">No active administrator records yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {admins.map((adm) => {
                const scopeName =
                  adm.role === 'diocese_secretary'
                    ? 'Abuja Diocese'
                    : adm.role === 'division_admin'
                    ? divisions.find((d) => d.id === adm.divisionId)?.name || adm.divisionId
                    : churches.find((c) => c.id === adm.churchId)?.name || adm.churchId;
                return (
                  <div
                    key={adm.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-medium text-sm text-navy-900">{adm.fullName}</div>
                      <div className="text-xs text-slate-500">
                        {adm.email} · {UI_STRINGS.en.roles[adm.role]} · {scopeName}
                      </div>
                    </div>
                    {adm.uid !== currentUserUid && (
                      <button
                        type="button"
                        onClick={() => onRevokeAdmin(adm.id)}
                        className="min-h-[40px] px-3 rounded-xl border border-red-200 text-red-700 text-xs font-medium hover:bg-red-50 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-display text-base font-bold text-navy-900 mb-3">
            Pending Administrator Invitations
          </h3>
          {invites.length === 0 ? (
            <p className="text-sm text-slate-500">No pending invitations.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-medium text-sm text-navy-900">{inv.fullName}</div>
                    <div className="text-xs text-slate-500">
                      {inv.email} · {UI_STRINGS.en.roles[inv.role]}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRevokeInvite(inv.id)}
                    className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-surface-50 cursor-pointer"
                  >
                    Cancel Invite
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
