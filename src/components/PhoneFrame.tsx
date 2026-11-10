import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
  platform?: 'ios' | 'android';
  title?: string;
  badge?: string;
  badgeColor?: string;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  platform = 'ios',
  title,
  badge,
  badgeColor = 'bg-[#0B1E3B]/10 text-[#0B1E3B] border-[#0B1E3B]/20',
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col items-center">
      {/* Phone Header Label */}
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 tracking-wide">{title}</span>
          {badge && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Outer Phone Shell */}
      <div className="relative w-[380px] h-[780px] bg-slate-900 rounded-[48px] p-2.5 shadow-2xl border-4 border-slate-300 ring-1 ring-slate-400/30 flex flex-col overflow-hidden">
        {/* Dynamic Island / Camera Notch */}
        {platform === 'ios' ? (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
            <div className="w-2 h-2 rounded-full bg-emerald-950 ring-1 ring-emerald-500/40" />
          </div>
        ) : (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 ring-1 ring-slate-800" />
        )}

        {/* Status Bar */}
        <div className="h-9 px-6 bg-white flex items-center justify-between text-[12px] font-semibold text-slate-800 z-40 select-none border-b border-slate-100">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5">
            {/* Cellular */}
            <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 24 24">
              <path d="M2 17h2v4H2v-4zm5-4h2v8H7v-8zm5-4h2v12h-2V9zm5-5h2v17h-2V4z" />
            </svg>
            {/* Wifi */}
            <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 24 24">
              <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.5 0 6.69 1.41 9.02 3.69L12 19.33 2.98 11.19C5.31 8.91 8.5 7.5 12 7.5z" />
            </svg>
            {/* Battery */}
            <div className="w-5 h-2.5 border border-slate-600 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-800 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 w-full bg-white rounded-b-[36px] overflow-hidden flex flex-col relative">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="h-4 bg-white flex items-center justify-center pt-0.5 z-40">
          <div className="w-32 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};
