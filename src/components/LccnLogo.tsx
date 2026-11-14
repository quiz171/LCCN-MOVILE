import React, { useState } from 'react';

interface LccnLogoProps {
  className?: string;
}

export const LccnLogo: React.FC<LccnLogoProps> = ({ className = 'w-10 h-10' }) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`${className} rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0`}
    >
      {!failed ? (
        <img
          src="/assets/lccn-logo.jpg"
          alt="Lutheran Church of Christ in Nigeria (LCCN) logo"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-display text-xs font-bold text-navy-900">LCCN</span>
      )}
    </div>
  );
};
