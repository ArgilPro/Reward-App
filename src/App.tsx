import React, { useState, useEffect } from 'react';
import { CustomerSummary, Profile } from '../types';
import { authService } from '../services/auth';
import { PhoneFrame } from './components/PhoneFrame';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { CustomerHomeView } from './views/CustomerHomeView';
import { CustomerQRView } from './views/CustomerQRView';
import { CustomerPointsView } from './views/CustomerPointsView';
import { CustomerAccountView } from './views/CustomerAccountView';
import { MerchantHomeView } from './views/MerchantHomeView';
import { MerchantScanView } from './views/MerchantScanView';
import { MerchantAwardView } from './views/MerchantAwardView';
import { LoginView } from './views/LoginView';
import { isSupabaseConfigured, subscribeSchemaStatus } from '../lib/supabase';
import {
  Smartphone,
  Layers,
  Database,
  Home,
  Award,
  User,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'dual' | 'single'>('dual');
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [schemaMissing, setSchemaMissing] = useState(false);

  // Single Device State
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [customerTab, setCustomerTab] = useState<'home' | 'points' | 'account'>('home');
  const [showingCustomerQR, setShowingCustomerQR] = useState(false);
  const [merchantFlow, setMerchantFlow] = useState<'dashboard' | 'scan' | 'award'>('dashboard');
  const [identifiedCustomer, setIdentifiedCustomer] = useState<CustomerSummary | null>(null);

  // Dual Device State: Customer Side
  const [dualCustomerProfile, setDualCustomerProfile] = useState<Profile | null>({
    id: 'a1111111-1111-4111-8111-111111111111',
    email: 'john@example.com',
    full_name: 'John Doe',
    role: 'customer',
    created_at: '2026-11-01T08:00:00Z',
  });
  const [dualCustomerTab, setDualCustomerTab] = useState<'home' | 'points' | 'account'>('home');
  const [dualCustomerShowQR, setDualCustomerShowQR] = useState(false);

  // Dual Device State: Merchant Side
  const [dualMerchantProfile, setDualMerchantProfile] = useState<Profile | null>({
    id: 'b2222222-2222-4222-8222-222222222222',
    email: 'merchant@example.com',
    full_name: 'ABC Restaurant',
    role: 'merchant',
    created_at: '2026-11-01T08:00:00Z',
  });
  const [dualMerchantFlow, setDualMerchantFlow] = useState<'dashboard' | 'scan' | 'award'>('dashboard');
  const [dualIdentifiedCustomer, setDualIdentifiedCustomer] = useState<CustomerSummary | null>(null);

  // Sync session on mount & subscribe to schema status
  useEffect(() => {
    const initSession = async () => {
      const session = await authService.getSessionProfile();
      if (session) {
        setActiveProfile(session);
      }
    };
    initSession();

    const unsubscribe = subscribeSchemaStatus((missing) => {
      setSchemaMissing(missing);
    });
    return () => unsubscribe();
  }, []);

  const handleCredentialsUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-[#0B1E3B] selection:text-white">
      {/* Top Navigation Bar: Clean White */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0B1E3B] flex items-center justify-center font-black text-white text-base shadow-md shadow-[#0B1E3B]/20">
            LP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-[#0B1E3B]">LoyaltyPass Mobile</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0B1E3B]/10 text-[#0B1E3B] border border-[#0B1E3B]/20">
                White & Navy
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:block">
              iOS & Android Universal Mobile Applet
            </span>
          </div>
        </div>

        {/* Viewport & Demo Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('dual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'dual'
                  ? 'bg-[#0B1E3B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dual Device Demo</span>
              <span className="sm:hidden">Dual</span>
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'single'
                  ? 'bg-[#0B1E3B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Single Device</span>
              <span className="sm:hidden">Single</span>
            </button>
          </div>

          {/* Platform OS Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setPlatform('ios')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                platform === 'ios' ? 'bg-white text-[#0B1E3B] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              iOS
            </button>
            <button
              onClick={() => setPlatform('android')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                platform === 'android' ? 'bg-white text-[#0B1E3B] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Android
            </button>
          </div>

          {/* Supabase Status & Config Trigger */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-[#0B1E3B]" />
            <span className="hidden md:inline">Supabase DB</span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? (schemaMissing ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-blue-600'}`} />
          </button>
        </div>
      </header>

      {/* Database Schema Warning Banner if needed */}
      {schemaMissing && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-bold">⚠️ Supabase Schema Notice:</span>
            <span>Remote table <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">loyalty_transactions</code> is not created yet in your project (PGRST205). Local fallback is active so the app works seamlessly.</span>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-300 rounded-lg font-bold shrink-0 transition-colors"
          >
            Run SQL Migration
          </button>
        </div>
      )}

      {/* Main Interactive Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-x-auto">
        {viewMode === 'dual' ? (
          /* ======================================================== */
          /* DUAL DEVICE DEMO MODE (Customer on Left, Merchant on Right) */
          /* ======================================================== */
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Demo Stepper Banner */}
            <div className="w-full mb-6 p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0B1E3B] flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0B1E3B]">Interactive 8-Step Loyalty Demonstration</h3>
                  <p className="text-xs text-slate-500">
                    Left: Customer Phone (John Doe) · Right: Merchant Terminal (ABC Restaurant)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDualCustomerShowQR(true);
                    setDualMerchantFlow('scan');
                  }}
                  className="px-3.5 py-2 bg-[#0B1E3B] hover:bg-[#071326] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0B1E3B]/20 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Start Scan Flow</span>
                </button>
                <button
                  onClick={() => setRefreshTrigger((p) => p + 1)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Side-by-Side Dual Phones */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 w-full">
              {/* PHONE 1: CUSTOMER APPLICATION */}
              <div className="flex flex-col items-center">
                <PhoneFrame
                  platform={platform}
                  title="Customer Phone"
                  badge="John Doe"
                  badgeColor="bg-[#0B1E3B]/10 text-[#0B1E3B] border-[#0B1E3B]/20"
                >
                  {!dualCustomerProfile ? (
                    <LoginView
                      presetRole="customer"
                      onSuccess={(prof) => setDualCustomerProfile(prof)}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col h-full justify-between bg-white">
                      {/* Customer Screen View */}
                      <div className="flex-1 overflow-hidden flex flex-col">
                        {dualCustomerShowQR ? (
                          <CustomerQRView
                            profile={dualCustomerProfile}
                            onBack={() => setDualCustomerShowQR(false)}
                          />
                        ) : dualCustomerTab === 'home' ? (
                          <CustomerHomeView
                            key={`cust-home-${refreshTrigger}`}
                            profile={dualCustomerProfile}
                            onShowQR={() => setDualCustomerShowQR(true)}
                            onNavigatePoints={() => setDualCustomerTab('points')}
                          />
                        ) : dualCustomerTab === 'points' ? (
                          <CustomerPointsView
                            key={`cust-pts-${refreshTrigger}`}
                            profile={dualCustomerProfile}
                          />
                        ) : (
                          <CustomerAccountView
                            profile={dualCustomerProfile}
                            onLogout={() => setDualCustomerProfile(null)}
                          />
                        )}
                      </div>

                      {/* 3-Item Customer Bottom Navigation: Clean White */}
                      {!dualCustomerShowQR && (
                        <nav className="h-16 bg-white border-t border-slate-200 grid grid-cols-3 items-center px-4 shrink-0 shadow-2xs">
                          <button
                            onClick={() => setDualCustomerTab('home')}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                              dualCustomerTab === 'home'
                                ? 'text-[#0B1E3B] font-bold'
                                : 'text-slate-400 hover:text-slate-600 font-medium'
                            }`}
                          >
                            <Home className="w-5 h-5" />
                            <span className="text-[10px] tracking-tight">Home</span>
                          </button>

                          <button
                            onClick={() => setDualCustomerTab('points')}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                              dualCustomerTab === 'points'
                                ? 'text-[#0B1E3B] font-bold'
                                : 'text-slate-400 hover:text-slate-600 font-medium'
                            }`}
                          >
                            <Award className="w-5 h-5" />
                            <span className="text-[10px] tracking-tight">Points</span>
                          </button>

                          <button
                            onClick={() => setDualCustomerTab('account')}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                              dualCustomerTab === 'account'
                                ? 'text-[#0B1E3B] font-bold'
                                : 'text-slate-400 hover:text-slate-600 font-medium'
                            }`}
                          >
                            <User className="w-5 h-5" />
                            <span className="text-[10px] tracking-tight">Account</span>
                          </button>
                        </nav>
                      )}
                    </div>
                  )}
                </PhoneFrame>
              </div>

              {/* PHONE 2: MERCHANT APPLICATION */}
              <div className="flex flex-col items-center">
                <PhoneFrame
                  platform={platform}
                  title="Merchant Terminal"
                  badge="ABC Restaurant"
                  badgeColor="bg-[#0B1E3B]/10 text-[#0B1E3B] border-[#0B1E3B]/20"
                >
                  {!dualMerchantProfile ? (
                    <LoginView
                      presetRole="merchant"
                      onSuccess={(prof) => setDualMerchantProfile(prof)}
                    />
                  ) : dualMerchantFlow === 'dashboard' ? (
                    <MerchantHomeView
                      key={`merch-home-${refreshTrigger}`}
                      profile={dualMerchantProfile}
                      onOpenScanner={() => setDualMerchantFlow('scan')}
                      onLogout={() => setDualMerchantProfile(null)}
                    />
                  ) : dualMerchantFlow === 'scan' ? (
                    <MerchantScanView
                      onCustomerIdentified={(cust) => {
                        setDualIdentifiedCustomer(cust);
                        setDualMerchantFlow('award');
                      }}
                      onCancel={() => setDualMerchantFlow('dashboard')}
                      targetCustomerUuid={dualCustomerProfile?.id}
                      targetCustomerName={dualCustomerProfile?.full_name}
                    />
                  ) : (
                    <MerchantAwardView
                      merchantProfile={dualMerchantProfile}
                      customerSummary={dualIdentifiedCustomer!}
                      onSuccess={() => {
                        setDualMerchantFlow('dashboard');
                        setRefreshTrigger((prev) => prev + 1);
                      }}
                      onCancel={() => setDualMerchantFlow('dashboard')}
                    />
                  )}
                </PhoneFrame>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* SINGLE DEVICE FOCUSED SIMULATOR                          */
          /* ======================================================== */
          <div className="flex flex-col items-center">
            {/* Role Switcher tabs when testing single device */}
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveProfile({
                    id: 'a1111111-1111-4111-8111-111111111111',
                    email: 'john@example.com',
                    full_name: 'John Doe',
                    role: 'customer',
                    created_at: '2026-11-01T08:00:00Z',
                  });
                  setShowingCustomerQR(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeProfile?.role === 'customer'
                    ? 'bg-[#0B1E3B] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Switch to Customer (John Doe)
              </button>
              <button
                onClick={() => {
                  setActiveProfile({
                    id: 'b2222222-2222-4222-8222-222222222222',
                    email: 'merchant@example.com',
                    full_name: 'ABC Restaurant',
                    role: 'merchant',
                    created_at: '2026-11-01T08:00:00Z',
                  });
                  setMerchantFlow('dashboard');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeProfile?.role === 'merchant'
                    ? 'bg-[#0B1E3B] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Switch to Merchant (ABC Restaurant)
              </button>
            </div>

            <PhoneFrame
              platform={platform}
              title={activeProfile ? `${activeProfile.role === 'customer' ? 'Customer' : 'Merchant'} App` : 'LoyaltyPass Mobile'}
              badge={activeProfile?.full_name}
            >
              {!activeProfile ? (
                <LoginView onSuccess={(prof) => setActiveProfile(prof)} />
              ) : activeProfile.role === 'customer' ? (
                <div className="flex-1 flex flex-col h-full justify-between bg-white">
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {showingCustomerQR ? (
                      <CustomerQRView
                        profile={activeProfile}
                        onBack={() => setShowingCustomerQR(false)}
                      />
                    ) : customerTab === 'home' ? (
                      <CustomerHomeView
                        key={`single-cust-${refreshTrigger}`}
                        profile={activeProfile}
                        onShowQR={() => setShowingCustomerQR(true)}
                        onNavigatePoints={() => setCustomerTab('points')}
                      />
                    ) : customerTab === 'points' ? (
                      <CustomerPointsView
                        key={`single-pts-${refreshTrigger}`}
                        profile={activeProfile}
                      />
                    ) : (
                      <CustomerAccountView
                        profile={activeProfile}
                        onLogout={() => setActiveProfile(null)}
                      />
                    )}
                  </div>

                  {!showingCustomerQR && (
                    <nav className="h-16 bg-white border-t border-slate-200 grid grid-cols-3 items-center px-4 shrink-0 shadow-2xs">
                      <button
                        onClick={() => setCustomerTab('home')}
                        className={`flex flex-col items-center justify-center gap-1 ${
                          customerTab === 'home' ? 'text-[#0B1E3B] font-bold' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        <span className="text-[10px]">Home</span>
                      </button>
                      <button
                        onClick={() => setCustomerTab('points')}
                        className={`flex flex-col items-center justify-center gap-1 ${
                          customerTab === 'points' ? 'text-[#0B1E3B] font-bold' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                        <span className="text-[10px]">Points</span>
                      </button>
                      <button
                        onClick={() => setCustomerTab('account')}
                        className={`flex flex-col items-center justify-center gap-1 ${
                          customerTab === 'account' ? 'text-[#0B1E3B] font-bold' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <User className="w-5 h-5" />
                        <span className="text-[10px]">Account</span>
                      </button>
                    </nav>
                  )}
                </div>
              ) : (
                /* Single Device Merchant View */
                merchantFlow === 'dashboard' ? (
                  <MerchantHomeView
                    key={`single-merch-${refreshTrigger}`}
                    profile={activeProfile}
                    onOpenScanner={() => setMerchantFlow('scan')}
                    onLogout={() => setActiveProfile(null)}
                  />
                ) : merchantFlow === 'scan' ? (
                  <MerchantScanView
                    onCustomerIdentified={(cust) => {
                      setIdentifiedCustomer(cust);
                      setMerchantFlow('award');
                    }}
                    onCancel={() => setMerchantFlow('dashboard')}
                  />
                ) : (
                  <MerchantAwardView
                    merchantProfile={activeProfile}
                    customerSummary={identifiedCustomer!}
                    onSuccess={() => {
                      setMerchantFlow('dashboard');
                      setRefreshTrigger((prev) => prev + 1);
                    }}
                    onCancel={() => setMerchantFlow('dashboard')}
                  />
                )
              )}
            </PhoneFrame>
          </div>
        )}
      </main>

      {/* Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onCredentialsUpdated={handleCredentialsUpdated}
      />
    </div>
  );
}
