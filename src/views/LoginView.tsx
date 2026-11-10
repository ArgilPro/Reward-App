import React, { useState } from 'react';
import { authService } from '../../services/auth';
import { Profile, UserRole } from '../../types';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onSuccess: (profile: Profile) => void;
  presetRole?: UserRole;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, presetRole }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(presetRole || 'customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { profile } = await authService.signIn(email, password);
        onSuccess(profile);
      } else {
        if (!fullName.trim()) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }
        const { profile } = await authService.signUp(email, password, fullName, role);
        onSuccess(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const { profile } = await authService.signIn(userEmail, pass);
      onSuccess(profile);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-white text-slate-900 overflow-y-auto">
      <div className="w-full max-w-sm mx-auto">
        {/* Brand Header */}
        <div className="text-center mt-3 mb-6">
          <div className="w-14 h-14 bg-[#0B1E3B] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#0B1E3B]/20 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#0B1E3B]">LoyaltyPass</h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'signin' ? 'Sign in to access your rewards' : 'Create your mobile loyalty account'}
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="mb-5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 text-center">
            Demo Test Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('john@example.com', 'password123')}
              className="py-2 px-2.5 bg-white hover:bg-slate-100 rounded-xl text-[11px] font-bold text-[#0B1E3B] border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span>👤 Customer</span>
              <span className="text-[10px] text-slate-400 font-normal">(John)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('merchant@example.com', 'password123')}
              className="py-2 px-2.5 bg-white hover:bg-slate-100 rounded-xl text-[11px] font-bold text-[#0B1E3B] border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span>🏪 Merchant</span>
              <span className="text-[10px] text-slate-400 font-normal">(ABC)</span>
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-semibold">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B1E3B] focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B1E3B] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B1E3B] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    role === 'customer'
                      ? 'bg-[#0B1E3B] text-white border-[#0B1E3B] shadow-xs'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('merchant')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    role === 'merchant'
                      ? 'bg-[#0B1E3B] text-white border-[#0B1E3B] shadow-xs'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  Merchant
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0B1E3B] hover:bg-[#071326] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#0B1E3B]/20 flex items-center justify-center gap-2 mt-4 transition-all active:scale-98"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Login' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="text-xs text-[#0B1E3B] hover:underline font-bold"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
