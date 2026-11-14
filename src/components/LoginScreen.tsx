import React, { useState } from 'react';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import sanctuaryImg from '../assets/images/lccn_church_sanctuary_1794601576925.jpg';
import { useChurch } from '../context/ChurchContext';
import { LccnLogo } from './LccnLogo';
import { PWAInstallButton } from './PWAComponents';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, error, clearError } = useChurch();
  const [signingIn, setSigningIn] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const handleLogin = async (selectAccount = false) => {
    clearError();
    setSigningIn(true);
    try {
      await signInWithGoogle({ selectAccount });
    } catch {
      // Error surfaced through ChurchContext
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:grid lg:grid-cols-2 lg:items-stretch">
      {/* Visual Sanctuary Column */}
      <div className="relative bg-navy-900 min-h-[240px] sm:min-h-[300px] lg:min-h-screen flex flex-col justify-end overflow-hidden">
        {!imgFailed ? (
          <img
            src={sanctuaryImg}
            alt="LCCN Abuja Diocese sanctuary"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-navy-900 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gold-400/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-900/45 to-navy-950/25" />

        <div className="relative z-10 p-6 sm:p-10 lg:p-14 text-white max-w-xl">
          <p className="text-xs sm:text-sm font-medium text-gold-400 tracking-wide mb-2">
            Lutheran Church of Christ in Nigeria
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-balance">
            Abuja Diocese Digital Church
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-200 leading-relaxed max-w-md">
            Stay connected with your local parish, diocesan announcements, upcoming gatherings, and church information in one simple place.
          </p>
        </div>
      </div>

      {/* Sign-In Column */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <LccnLogo className="w-12 h-12" />
              <div>
                <div className="font-display text-base font-bold text-navy-900">
                  LCCN Abuja
                </div>
                <div className="text-xs text-slate-500">Member &amp; Parish Portal</div>
              </div>
            </div>
            <PWAInstallButton />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
            Welcome to your church home
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Sign in with your Google account to select your church in Abuja Diocese. No special approval is needed for members.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => handleLogin(false)}
              disabled={signingIn}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-navy-900 text-white font-medium text-base flex items-center justify-center gap-3 hover:bg-navy-800 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              <span>{signingIn ? 'Signing in...' : 'Continue with Google'}</span>
              <ArrowRight className="w-4 h-4 text-gold-400" />
            </button>

            <button
              type="button"
              onClick={() => handleLogin(true)}
              disabled={signingIn}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-navy-700 hover:text-navy-900 hover:bg-surface-50 transition-colors disabled:opacity-60 cursor-pointer"
            >
              Use a different Google account
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3 text-xs sm:text-sm text-slate-500">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-navy-700 mt-0.5 shrink-0" />
              <span>
                Your phone number and personal details are kept private and visible only to your authorized church administrators.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
