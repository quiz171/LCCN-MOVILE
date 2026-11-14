import React from 'react';
import { Clock, MapPin, Phone, User, X } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

interface ChurchInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeChurch?: () => void;
}

export const ChurchInfoModal: React.FC<ChurchInfoModalProps> = ({
  isOpen,
  onClose,
  onChangeChurch,
}) => {
  const { currentChurch, currentDivision, currentDistrict, currentDiocese } = useChurch();

  if (!isOpen || !currentChurch) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="church-info-title"
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-gold-600 mb-1">
              {currentDiocese?.name || 'Abuja Diocese'}
              {currentDivision ? ` · ${currentDivision.name}` : ''}
              {currentDistrict ? ` · ${currentDistrict.name}` : ''}
            </p>
            <h2
              id="church-info-title"
              className="font-display text-xl font-bold text-navy-900"
            >
              {currentChurch.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-surface-50 hover:text-navy-900 transition-colors"
            aria-label="Close church information"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Pastor in Charge</div>
                <div className="text-base font-medium text-navy-900 mt-0.5">
                  {currentChurch.pastorName}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Address</div>
                <div className="text-base text-slate-800 mt-0.5 leading-relaxed">
                  {currentChurch.address}
                </div>
              </div>
            </div>

            {currentChurch.phone && (
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Church Contact</div>
                  <a
                    href={`tel:${currentChurch.phone}`}
                    className="text-base font-medium text-navy-900 hover:underline mt-0.5 inline-block tabular-nums"
                  >
                    {currentChurch.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-900 mb-3">
              <Clock className="w-4 h-4 text-gold-600" />
              <span>Service Days &amp; Times</span>
            </div>
            <ul className="space-y-2.5">
              {currentChurch.serviceSchedule.map((slot, index) => (
                <li
                  key={index}
                  className="px-4 py-3 rounded-xl bg-surface-50 border border-slate-200/70 text-sm sm:text-base text-slate-800 tabular-nums"
                >
                  {slot}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-surface-50 flex flex-col sm:flex-row gap-3">
          {onChangeChurch && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onChangeChurch();
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Change Church
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
