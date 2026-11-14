import React from 'react';
import {
  Building2,
  ChevronRight,
  LogOut,
  Pencil,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { UI_STRINGS } from '../i18n/strings';
import { PWAInstallButton } from './PWAComponents';

interface ProfileViewProps {
  onEditProfile: () => void;
  onOpenChurchInfo: () => void;
  onOpenAdmin: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onEditProfile,
  onOpenChurchInfo,
  onOpenAdmin,
}) => {
  const {
    member,
    currentDiocese,
    currentDivision,
    currentDistrict,
    currentChurch,
    isAdmin,
    effectiveAdminRole,
    logout,
  } = useChurch();

  if (!member) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
          Member Profile
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          Your personal membership details and selected LCCN congregation.
        </p>
      </div>

      {/* Member Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy-900 text-gold-400 font-display text-xl font-bold flex items-center justify-center shrink-0">
              {member.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-navy-900">
                {member.fullName}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{member.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEditProfile}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-navy-900 hover:bg-surface-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-gold-600" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Phone Number</div>
              <div className="text-sm sm:text-base font-medium text-slate-900 tabular-nums">
                {member.phoneNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Fellowship / Subgroup</div>
              <div className="text-sm sm:text-base font-medium text-slate-900">
                {member.subgroup || 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Church Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Selected Church</div>
              <h2 className="font-display text-lg font-bold text-navy-900 mt-0.5">
                {currentChurch?.name || 'Not selected'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {currentDiocese?.name || 'Abuja Diocese'}
                {currentDivision ? ` · ${currentDivision.name}` : ''}
                {currentDistrict ? ` · ${currentDistrict.name}` : ''}
              </p>
              {currentChurch && (
                <p className="text-sm text-slate-500 mt-1">
                  Pastor: {currentChurch.pastorName}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenChurchInfo}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-50 border border-slate-200 text-sm font-medium text-navy-900 hover:bg-surface-100 transition-colors cursor-pointer"
          >
            View Church Information
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-navy-900 hover:bg-surface-50 transition-colors cursor-pointer"
          >
            Change Church
          </button>
        </div>
      </section>

      {/* PWA Install & Discreet Admin Entry */}
      <section className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-surface-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-sm sm:text-base font-semibold text-navy-900">
                  Administration Portal
                </div>
                <div className="text-xs sm:text-sm text-slate-500">
                  Signed in as{' '}
                  {effectiveAdminRole ? UI_STRINGS.en.roles[effectiveAdminRole] : 'Administrator'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>
        )}

        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <PWAInstallButton />
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] px-5 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition-colors inline-flex items-center gap-2 cursor-pointer ml-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>
    </div>
  );
};
