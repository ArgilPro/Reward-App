import React, { useEffect, useState, useCallback } from 'react';
import { LoyaltyTransaction, MerchantStats, Profile } from '../../types';
import { merchantService } from '../../services/merchant';
import { authService } from '../../services/auth';
import { Camera, RefreshCw, LogOut, UserCheck, Clock } from 'lucide-react';

interface MerchantHomeViewProps {
  profile: Profile;
  onOpenScanner: () => void;
  onLogout: () => void;
}

export const MerchantHomeView: React.FC<MerchantHomeViewProps> = ({
  profile,
  onOpenScanner,
  onLogout,
}) => {
  const [stats, setStats] = useState<MerchantStats>({
    points_awarded_today: 0,
    transactions_today: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile.full_name || 'Merchant';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, txs] = await Promise.all([
        merchantService.getMerchantStats(profile.id),
        merchantService.getRecentTransactions(profile.id, 20),
      ]);
      setStats(statsData);
      setRecentTransactions(txs);
    } catch (err) {
      console.error('Error loading merchant dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-[#0B1E3B]">{getGreeting()}</h1>
          <span className="text-[11px] font-bold text-[#143B73] uppercase tracking-wider block">
            Merchant Dashboard
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={loadData}
            title="Refresh dashboard"
            className="p-1.5 rounded-lg bg-white text-slate-600 hover:text-[#0B1E3B] border border-slate-200 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSignOut}
            title="Logout"
            className="p-1.5 rounded-lg bg-white text-red-600 hover:bg-red-50 border border-slate-200 shadow-2xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
        {/* Today's Statistics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Points Awarded Today */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Points Awarded Today
            </span>
            <span className="text-3xl font-black text-[#0B1E3B] tabular-nums">
              {loading ? '...' : stats.points_awarded_today}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5">Points</span>
          </div>

          {/* Transactions Today */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Transactions Today
            </span>
            <span className="text-3xl font-black text-[#143B73] tabular-nums">
              {loading ? '...' : stats.transactions_today}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5">Transactions</span>
          </div>
        </div>

        {/* Scan Customer QR Primary Button (Dark Navy) */}
        <button
          onClick={onOpenScanner}
          className="w-full py-4 px-5 bg-[#0B1E3B] hover:bg-[#071326] rounded-2xl font-bold text-white shadow-lg shadow-[#0B1E3B]/25 flex items-center justify-center gap-3 transition-all active:scale-98 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <div className="text-base font-extrabold leading-tight">Scan Customer QR</div>
            <div className="text-[11px] text-blue-200 font-normal">Award points directly to customer</div>
          </div>
        </button>

        {/* Recent Transactions Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recent Transactions
            </span>
            <span className="text-[10px] text-slate-500">Awarded by you</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0B1E3B]" />
              Loading transactions...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center shadow-2xs">
              <Clock className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm font-bold text-slate-800">No transactions yet.</span>
              <span className="text-xs text-slate-500 mt-1 max-w-[220px]">
                Scan a customer&apos;s QR code to create your first transaction today.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E3B]">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {tx.customer_name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-600 tabular-nums">
                      +{tx.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
