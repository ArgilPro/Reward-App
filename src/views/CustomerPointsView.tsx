import React, { useEffect, useState, useCallback } from 'react';
import { LoyaltyTransaction, Profile } from '../../types';
import { loyaltyService } from '../../services/loyalty';
import { Sparkles, RefreshCw, Clock, Store } from 'lucide-react';

interface CustomerPointsViewProps {
  profile: Profile;
}

export const CustomerPointsView: React.FC<CustomerPointsViewProps> = ({ profile }) => {
  const [points, setPoints] = useState<number>(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [currentPoints, history] = await Promise.all([
        loyaltyService.getCustomerPoints(profile.id),
        loyaltyService.getCustomerTransactions(profile.id),
      ]);
      setPoints(currentPoints);
      setTransactions(history);
    } catch (err) {
      console.error('Failed to load points data:', err);
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

  return (
    <div className="flex-1 flex flex-col p-5 bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 shrink-0">
        <h2 className="text-xl font-black tracking-tight text-[#0B1E3B]">Points & Rewards</h2>
        <button
          onClick={loadData}
          title="Refresh"
          className="p-1.5 rounded-lg bg-white text-slate-600 hover:text-[#0B1E3B] border border-slate-200 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current Points Display: Dark Navy Card */}
      <div className="my-4 p-5 bg-gradient-to-r from-[#071326] to-[#0B1E3B] rounded-2xl border border-[#0B1E3B] text-white flex items-center justify-between shadow-lg shadow-[#0B1E3B]/20 shrink-0">
        <div>
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
            Current Points
          </span>
          <span className="text-4xl font-black text-white tabular-nums tracking-tight">
            {loading ? '...' : points}
          </span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>
      </div>

      {/* Points History Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Points History
        </span>
        <span className="text-[11px] text-slate-500 font-medium">Newest first</span>
      </div>

      {/* Points History List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#0B1E3B]" />
            <span className="text-xs font-medium">Loading points history...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 px-4 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center shadow-2xs">
            <Clock className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm font-bold text-slate-800">No points transactions yet.</span>
            <span className="text-xs text-slate-500 mt-1 max-w-[200px]">
              When a merchant scans your QR code and awards points, they will show up here.
            </span>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between hover:border-slate-300 shadow-2xs transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E3B]">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {tx.merchant_name || 'Merchant'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {formatDate(tx.created_at)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-600 tabular-nums">
                  +{tx.points}
                </span>
                <span className="text-[10px] text-slate-500 block">points</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
