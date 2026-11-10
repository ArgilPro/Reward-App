import React from 'react';
import { Profile } from '../../types';
import { authService } from '../../services/auth';
import { LogOut, User, Mail, Shield, CheckCircle2 } from 'lucide-react';

interface CustomerAccountViewProps {
  profile: Profile;
  onLogout: () => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({ profile, onLogout }) => {
  const handleSignOut = async () => {
    try {
      await authService.signOut();
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-slate-50 text-slate-900 overflow-y-auto">
      <div>
        <div className="pb-3.5 border-b border-slate-200">
          <h2 className="text-xl font-black tracking-tight text-[#0B1E3B]">Account</h2>
        </div>

        {/* Profile Details Card */}
        <div className="mt-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E3B] font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Full Name
              </span>
              <span className="text-sm font-bold text-slate-900">{profile.full_name}</span>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E3B] font-bold text-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div className="truncate">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Email
              </span>
              <span className="text-sm font-medium text-slate-800 truncate block">{profile.email}</span>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E3B] font-bold text-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Account Role
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#0B1E3B]/10 text-[#0B1E3B] border border-[#0B1E3B]/20 uppercase tracking-wider inline-block mt-0.5">
                {profile.role}
              </span>
            </div>
          </div>
        </div>

        {/* Security / Verification Badge */}
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs text-emerald-800 font-semibold">
            Profile authenticated via Supabase
          </span>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={handleSignOut}
          className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
