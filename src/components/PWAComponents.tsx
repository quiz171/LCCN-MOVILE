import React, { useState } from 'react';
import { Download, Share, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC<{ variant?: 'primary' | 'subtle' }> = ({
  variant = 'subtle',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'primary'
            ? 'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors whitespace-nowrap shrink-0'
            : 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-navy-900 text-sm font-medium hover:bg-surface-50 transition-colors whitespace-nowrap shrink-0'
        }
      >
        <Download className="w-4 h-4 text-gold-600" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-navy-900 text-sm font-medium hover:bg-surface-50 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4 text-gold-600" />
          <span>Install on iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-bold text-navy-900">
                  Add LCCN Abuja to Home Screen
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-navy-900 rounded-xl"
                  aria-label="Close installation guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-3 text-sm text-slate-700 leading-relaxed mb-5">
                <li className="flex items-start gap-2.5">
                  <span className="font-semibold text-navy-900 tabular-nums">1.</span>
                  <span>
                    Tap the <strong className="text-navy-900 inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 inline" /></strong> button in your Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-semibold text-navy-900 tabular-nums">2.</span>
                  <span>
                    Scroll down and select <strong className="text-navy-900">Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-semibold text-navy-900 tabular-nums">3.</span>
                  <span>
                    Tap <strong className="text-navy-900">Add</strong> to install the LCCN Abuja app.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-medium text-amber-900 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      <span>You are offline. Showing saved church records.</span>
    </div>
  );
};
