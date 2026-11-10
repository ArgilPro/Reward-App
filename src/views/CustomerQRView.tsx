import React from 'react';
import { Profile } from '../../types';
import { QRGenerator } from '../components/QRGenerator';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface CustomerQRViewProps {
  profile: Profile;
  onBack: () => void;
}

export const CustomerQRView: React.FC<CustomerQRViewProps> = ({ profile, onBack }) => {
  const safeIdentifier = profile.id;

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-slate-50 text-slate-900 overflow-y-auto select-none">
      <div>
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0B1E3B] hover:text-[#071326] py-1 px-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-sm font-extrabold tracking-tight text-[#0B1E3B]">Customer QR Code</span>
          <div className="w-12" />
        </div>

        {/* QR Code Presentation Box */}
        <div className="mt-5 flex flex-col items-center">
          <div className="w-full max-w-[300px] bg-white rounded-3xl p-6 shadow-xl flex flex-col items-center border border-slate-200">
            <span className="text-base font-extrabold text-[#0B1E3B] tracking-tight text-center">
              {profile.full_name}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
              Loyalty Member
            </span>

            {/* Crisp High-Res QR Code */}
            <QRGenerator
              value={safeIdentifier}
              size={210}
              customerName={profile.full_name}
            />

            <p className="mt-4 text-xs text-slate-600 font-medium text-center leading-relaxed px-2">
              Show this QR code to the merchant after your purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mt-4 p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#0B1E3B] font-bold mb-0.5">
          <ShieldCheck className="w-4 h-4 text-[#0B1E3B]" />
          <span>Safe Customer Identifier</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-normal">
          Contains only your member UUID. No passwords, tokens, or payment details are exposed.
        </p>
      </div>
    </div>
  );
};
