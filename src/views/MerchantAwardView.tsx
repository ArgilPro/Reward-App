import React, { useState } from 'react';
import { CustomerSummary, Profile } from '../../types';
import { merchantService } from '../../services/merchant';
import { ArrowLeft, User, Award, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MerchantAwardViewProps {
  merchantProfile: Profile;
  customerSummary: CustomerSummary;
  onSuccess: (awardedPoints: number, newBalance: number) => void;
  onCancel: () => void;
}

export const MerchantAwardView: React.FC<MerchantAwardViewProps> = ({
  merchantProfile,
  customerSummary,
  onSuccess,
  onCancel,
}) => {
  const [pointsInput, setPointsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAwardPoints = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = Number(pointsInput.trim());

    if (!pointsInput.trim() || isNaN(parsed)) {
      setErrorMessage('Please enter a valid numeric points value.');
      return;
    }

    if (parsed <= 0 || !Number.isInteger(parsed)) {
      setErrorMessage('Points must be a positive whole integer greater than 0.');
      return;
    }

    if (parsed > 10000) {
      setErrorMessage('Points cannot exceed 10,000 in a single transaction.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await merchantService.awardPoints(
        merchantProfile.id,
        merchantProfile.full_name,
        customerSummary.profile.id,
        parsed
      );

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback gracefully
      }

      setSuccessMessage('Points awarded successfully.');

      setTimeout(() => {
        onSuccess(result.points_awarded, result.new_balance);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to award points.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-slate-50 text-slate-900 overflow-y-auto">
      <div>
        {/* Navigation */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40 py-1 px-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <span className="text-sm font-extrabold tracking-tight text-[#0B1E3B]">Customer Confirmation</span>
          <div className="w-12" />
        </div>

        {/* Customer Confirmation Card */}
        <div className="mt-5 p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E3B] font-bold">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer
              </span>
              <span className="text-lg font-black text-[#0B1E3B] block truncate">
                {customerSummary.profile.full_name}
              </span>
              <span className="text-xs text-slate-500 block truncate">
                {customerSummary.profile.email}
              </span>
            </div>
          </div>

          <div className="my-4 h-px bg-slate-100" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Current Points</span>
            <span className="text-2xl font-black text-[#0B1E3B] tabular-nums">
              {customerSummary.current_points}
            </span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-center gap-2 font-bold animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Points to Award Form */}
        <div className="mt-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Points to award
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="10000"
              placeholder="10"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              disabled={isSubmitting}
              className="w-full py-4 px-4 bg-white border-2 border-[#0B1E3B] rounded-2xl text-3xl font-black text-center text-[#0B1E3B] placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-[#0B1E3B]/10 tabular-nums shadow-xs"
              autoFocus
            />
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[5, 10, 25, 50].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPointsInput(String(preset))}
                disabled={isSubmitting}
                className="py-2.5 bg-white hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl transition-all shadow-2xs"
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Award Action: Dark Navy Blue */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={() => handleAwardPoints()}
          disabled={!pointsInput.trim() || isSubmitting}
          className="w-full py-4 px-5 bg-[#0B1E3B] hover:bg-[#071326] disabled:opacity-40 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#0B1E3B]/25 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Awarding points...</span>
            </>
          ) : (
            <>
              <Award className="w-5 h-5" />
              <span>Award Points</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
