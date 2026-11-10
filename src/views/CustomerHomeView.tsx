import React, { useEffect, useState, useCallback } from 'react';
import { Profile } from '../../types';
import { loyaltyService } from '../../services/loyalty';
import { QrCode, RefreshCw, Sparkles, Shield, ChevronRight } from 'lucide-react';

interface CustomerHomeViewProps {
  profile: Profile;
  onShowQR: () => void;
  onNavigatePoints: () => void;
}

export const CustomerHomeView: React.FC<CustomerHomeViewProps> = ({
  profile,
  onShowQR,
  onNavigatePoints,
}) => {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'there';
    if (hour < 12) return `Good morning, ${firstName}`;
    if (hour < 18) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  };

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      const balance = await loyaltyService.getCustomerPoints(profile.id);
      setPoints(balance);
    } catch (err) {
      console.error('Error fetching customer points:', err);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-slate-50 text-slate-900 overflow-y-auto">
      <div>
        {/* Dynamic Greeting */}
        <div className="mt-2 mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0B1E3B]">{getGreeting()}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Your loyalty membership is active</p>
          </div>
          <button
            onClick={fetchBalance}
            title="Refresh balance"
            className="p-2 rounded-xl bg-white text-slate-600 hover:text-[#0B1E3B] border border-slate-200 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loyalty Card: Luxury Dark Navy Blue */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#071326] via-[#0B1E3B] to-[#143B73] border border-[#0B1E3B]/40 shadow-xl shadow-[#0B1E3B]/20 text-white mb-5">
          {/* Subtle light mesh */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10 mb-6">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-300" />
              <span className="text-[11px] font-black tracking-widest text-blue-100">LOYALTYPASS</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              VIP MEMBER
            </span>
          </div>

          <div className="relative z-10 mb-6">
            <span className="text-[11px] uppercase tracking-wider text-blue-200/90 font-semibold block">
              Current Points
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black tracking-tight tabular-nums text-white">
                {loading ? '...' : points ?? 0}
              </span>
              <span className="text-xs font-semibold text-blue-200">Points</span>
            </div>
          </div>

          <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/15">
            <div>
              <span className="text-[9px] font-bold tracking-wider text-blue-200 uppercase block">
                CARDHOLDER
              </span>
              <span className="text-sm font-bold text-white tracking-wide">
                {profile.full_name || 'Member'}
              </span>
            </div>
            {/* Chip graphic */}
            <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-amber-300 to-amber-500 border border-amber-200/80 shadow-xs flex items-center justify-center">
              <div className="w-4 h-3 border border-amber-700/40 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Primary Action Button: Show My QR (Dark Navy) */}
        <button
          onClick={onShowQR}
          className="w-full py-4 px-5 bg-[#0B1E3B] hover:bg-[#071326] rounded-2xl font-bold text-white shadow-lg shadow-[#0B1E3B]/25 flex items-center justify-center gap-3 transition-all active:scale-98 group mb-4"
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <div className="text-base font-extrabold leading-tight">Show My QR</div>
            <div className="text-[11px] text-blue-200 font-normal">Present to merchant at checkout</div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Quick Points History Card */}
        <div
          onClick={onNavigatePoints}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E3B]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Rewards & History</span>
              <span className="text-[11px] text-slate-500">View recent point transactions</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Security Footer Note */}
      <div className="pt-3 border-t border-slate-200 text-center">
        <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-medium">
          🔒 Secure points balance synced with Supabase
        </span>
      </div>
    </div>
  );
};
