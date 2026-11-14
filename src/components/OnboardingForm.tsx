import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { CHURCH_SUBGROUPS, FIELD_LIMITS } from '../types/lccn';
import { LccnLogo } from './LccnLogo';

interface OnboardingFormProps {
  mode?: 'register' | 'edit';
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  mode = 'register',
  onCancel,
  onSuccess,
}) => {
  const { user, member, divisions, districts, churches, saveMemberProfile, logout } =
    useChurch();

  // Phase 1 automatically scopes registration to Abuja Diocese
  const dioceseId = member?.dioceseId || 'abuja';

  const [fullName, setFullName] = useState(
    member?.fullName || user?.displayName || ''
  );
  const [phoneNumber, setPhoneNumber] = useState(member?.phoneNumber || '');
  const [divisionId, setDivisionId] = useState(member?.divisionId || '');
  const [districtId, setDistrictId] = useState(member?.districtId || '');
  const [churchId, setChurchId] = useState(member?.churchId || '');
  const [subgroup, setSubgroup] = useState(member?.subgroup || '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeDivisions = useMemo(
    () => divisions.filter((d) => d.dioceseId === dioceseId),
    [divisions, dioceseId]
  );

  const availableDistricts = useMemo(
    () => districts.filter((dist) => dist.divisionId === divisionId),
    [districts, divisionId]
  );

  const availableChurches = useMemo(() => {
    if (!divisionId) return [];
    return churches.filter((c) => {
      if (c.dioceseId !== dioceseId) return false;
      if (c.divisionId !== divisionId) return false;
      if (districtId && availableDistricts.length > 0 && c.districtId !== districtId) {
        return false;
      }
      return true;
    });
  }, [churches, dioceseId, divisionId, districtId, availableDistricts.length]);

  // Keep church selection valid whenever division/district filters change
  useEffect(() => {
    if (!divisionId) {
      setChurchId('');
      return;
    }
    if (availableChurches.length > 0) {
      const stillValid = availableChurches.some((c) => c.id === churchId);
      if (!stillValid) {
        setChurchId(availableChurches.length === 1 ? availableChurches[0].id : '');
      }
    } else {
      setChurchId('');
    }
  }, [divisionId, availableChurches, churchId]);

  const handleDivisionChange = (newDivId: string) => {
    setDivisionId(newDivId);
    setDistrictId('');
    setChurchId('');
  };

  const handleDistrictChange = (newDistId: string) => {
    setDistrictId(newDistId);
    setChurchId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (fullName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (phoneNumber.trim().length < 6) {
      setFormError('Please enter a valid phone number.');
      return;
    }
    if (!divisionId) {
      setFormError('Please select your division.');
      return;
    }
    if (!churchId) {
      setFormError('Please select your church.');
      return;
    }

    const selectedChurch = churches.find((c) => c.id === churchId);
    const resolvedDistrictId = districtId || selectedChurch?.districtId || '';

    setSaving(true);
    try {
      await saveMemberProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        dioceseId,
        divisionId,
        districtId: resolvedDistrictId,
        churchId,
        subgroup,
      });
      onSuccess?.();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 py-6 px-4 sm:py-10 sm:px-6 flex flex-col justify-center">
      <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Clean LCCN Abuja Diocese Banner */}
        <div className="bg-navy-900 px-6 py-6 sm:px-8 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {mode === 'edit' && onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <LccnLogo className="w-12 h-12" />
              )}
              <div>
                <div className="font-display text-sm font-bold tracking-wider text-gold-400">
                  LCCN · ABUJA DIOCESE
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                  {mode === 'edit' ? 'Update Your Profile' : 'Create Your Account'}
                </h1>
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-200">
            {mode === 'edit'
              ? 'Update your personal details, church parish, or fellowship subgroup.'
              : 'Join your church community in one simple step.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {formError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="member-fullname"
                className="block text-sm font-medium text-navy-900 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="member-fullname"
                type="text"
                required
                maxLength={FIELD_LIMITS.fullNameMax}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900"
              />
            </div>

            <div>
              <label
                htmlFor="member-phone"
                className="block text-sm font-medium text-navy-900 mb-1.5"
              >
                Phone Number
              </label>
              <input
                id="member-phone"
                type="tel"
                required
                maxLength={FIELD_LIMITS.phoneMax}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900"
              />
            </div>

            <div>
              <label
                htmlFor="member-division"
                className="block text-sm font-medium text-navy-900 mb-1.5"
              >
                Division
              </label>
              <div className="relative">
                <select
                  id="member-division"
                  required
                  value={divisionId}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full min-h-[48px] pl-4 pr-10 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-navy-900"
                >
                  <option value="">
                    {activeDivisions.length === 0 ? 'Loading divisions...' : 'Select your division'}
                  </option>
                  {activeDivisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="member-district"
                className="block text-sm font-medium text-navy-900 mb-1.5"
              >
                District <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  id="member-district"
                  value={districtId}
                  disabled={!divisionId || availableDistricts.length === 0}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full min-h-[48px] pl-4 pr-10 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-navy-900 disabled:bg-surface-50 disabled:text-slate-500"
                >
                  <option value="">
                    {!divisionId
                      ? 'Select your district'
                      : availableDistricts.length === 0
                      ? 'No districts under this division'
                      : 'Select your district'}
                  </option>
                  {availableDistricts.map((dist) => (
                    <option key={dist.id} value={dist.id}>
                      {dist.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="member-church"
                className="block text-sm font-medium text-navy-900 mb-1.5"
              >
                Church
              </label>
              <div className="relative">
                <select
                  id="member-church"
                  required
                  value={churchId}
                  disabled={!divisionId}
                  onChange={(e) => setChurchId(e.target.value)}
                  className="w-full min-h-[48px] pl-4 pr-10 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-navy-900 disabled:bg-surface-50 disabled:text-slate-500"
                >
                  <option value="">
                    {!divisionId
                      ? 'Select a division first'
                      : availableChurches.length === 0
                      ? 'No churches found in selection'
                      : 'Select your church'}
                  </option>
                  {availableChurches.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="member-subgroup"
                className="block text-sm font-medium text-navy-900 mb-1.5"
              >
                Subgroup <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  id="member-subgroup"
                  value={subgroup}
                  onChange={(e) => setSubgroup(e.target.value)}
                  className="w-full min-h-[48px] pl-4 pr-10 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-navy-900"
                >
                  <option value="">Select your fellowship/group</option>
                  {CHURCH_SUBGROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="pt-3 flex flex-col-reverse sm:flex-row gap-3">
              {mode === 'edit' && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="sm:w-1/3 min-h-[48px] px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-base font-medium hover:bg-surface-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 min-h-[50px] px-6 py-3 rounded-xl bg-navy-900 text-white text-base font-semibold flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-4 h-4 text-gold-400" />
                <span>
                  {saving
                    ? 'Saving...'
                    : mode === 'edit'
                    ? 'Save Changes'
                    : 'Create Account'}
                </span>
              </button>
            </div>
          </form>

          {mode === 'register' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-navy-700 hover:text-navy-900 min-h-[44px] px-3 cursor-pointer"
              >
                Already registered? <span className="underline">Log in</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
