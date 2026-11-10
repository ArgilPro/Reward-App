import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, setSupabaseCredentials, SUPABASE_URL, isRemoteSchemaMissing, setSchemaMissingStatus } from '../../lib/supabase';
import { Database, Check, Copy, AlertCircle, X, RefreshCw, Terminal, ExternalLink } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
}

const FULL_SQL_MIGRATION = `-- ====================================================================
-- LOYALTYPASS MOBILE APP - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase PostgreSQL (Run in Supabase Dashboard -> SQL Editor)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'merchant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. LOYALTY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON public.loyalty_transactions(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.loyalty_transactions(created_at);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- 3A. PROFILES POLICIES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Merchants can view customer profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles m WHERE m.id = auth.uid() AND m.role = 'merchant')
    AND role = 'customer'
  );

CREATE POLICY "Customers can view merchant profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles c WHERE c.id = auth.uid() AND c.role = 'customer')
    AND role = 'merchant'
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3B. LOYALTY TRANSACTIONS POLICIES
CREATE POLICY "Customers can view their own transactions"
  ON public.loyalty_transactions FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Merchants can view transactions awarded by them"
  ON public.loyalty_transactions FOR SELECT TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can insert transactions"
  ON public.loyalty_transactions FOR INSERT TO authenticated
  WITH CHECK (
    merchant_id = auth.uid() AND points > 0
    AND EXISTS (SELECT 1 FROM public.profiles m WHERE m.id = auth.uid() AND m.role = 'merchant')
    AND EXISTS (SELECT 1 FROM public.profiles c WHERE c.id = customer_id AND c.role = 'customer')
  );

-- 4. SECURE RPC: award_points
CREATE OR REPLACE FUNCTION public.award_points(p_customer_id UUID, p_points INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_merchant_id UUID;
  v_customer_name TEXT;
  v_tx_id UUID;
  v_new_balance BIGINT;
BEGIN
  v_merchant_id := auth.uid();
  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_merchant_id AND role = 'merchant') THEN
    RAISE EXCEPTION 'Forbidden: Only merchants can award points';
  END IF;

  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be greater than 0';
  END IF;

  SELECT full_name INTO v_customer_name FROM public.profiles WHERE id = p_customer_id AND role = 'customer';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  INSERT INTO public.loyalty_transactions (customer_id, merchant_id, points)
  VALUES (p_customer_id, v_merchant_id, p_points)
  RETURNING id INTO v_tx_id;

  SELECT COALESCE(SUM(points), 0) INTO v_new_balance
  FROM public.loyalty_transactions WHERE customer_id = p_customer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'customer_id', p_customer_id,
    'customer_name', v_customer_name,
    'points_awarded', p_points,
    'new_balance', v_new_balance,
    'created_at', now()
  );
END;
$$;`;

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
}) => {
  const [url, setUrl] = useState(SUPABASE_URL || '');
  const [anonKey, setAnonKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const schemaMissing = isRemoteSchemaMissing();

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && anonKey.trim()) {
      setSupabaseCredentials(url.trim(), anonKey.trim());
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onCredentialsUpdated();
        onClose();
      }, 800);
    }
  };

  const handleCopyMigration = () => {
    navigator.clipboard.writeText(FULL_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleUseBuiltInEngine = () => {
    setSupabaseCredentials('', '');
    setSchemaMissingStatus(false);
    onCredentialsUpdated();
    onClose();
  };

  const handleResetDemoData = () => {
    if (confirm('Reset all demo transactions and restore default test accounts?')) {
      localStorage.removeItem('loyalty_demo_transactions');
      localStorage.removeItem('loyalty_demo_session');
      localStorage.removeItem('loyalty_demo_users');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E3B]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-[#0B1E3B]">Supabase Configuration</h3>
            <span className="text-xs text-slate-500">PostgreSQL Database, Auth & RLS</span>
          </div>
        </div>

        {/* Missing Schema Warning Banner */}
        {schemaMissing && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-900 block mb-1">
                Schema Not Initialized on Remote Supabase Project
              </span>
              <p className="text-amber-800 leading-relaxed mb-2">
                Supabase reported error <code className="text-amber-950 bg-amber-100 px-1 py-0.5 rounded font-mono">PGRST205</code> (table <code className="text-amber-950 font-mono">loyalty_transactions</code> does not exist in schema cache).
                The app has automatically activated local fallback so you can continue testing without errors!
              </p>
              <button
                type="button"
                onClick={handleCopyMigration}
                className="px-3 py-1.5 bg-[#0B1E3B] hover:bg-[#071326] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Copied to Clipboard!' : 'Copy SQL Schema to Clipboard'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Current Connection Status */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Connection Mode
            </span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? (schemaMissing ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-blue-600'}`} />
              {isSupabaseConfigured
                ? (schemaMissing ? 'Remote Supabase (Local Fallback Active)' : 'Remote Supabase Cloud')
                : 'Built-in High-Fidelity PostgreSQL Engine'}
            </span>
          </div>
          {isSupabaseConfigured && (
            <button
              onClick={handleUseBuiltInEngine}
              className="text-xs text-[#0B1E3B] hover:underline font-bold"
            >
              Use Built-in Engine
            </button>
          )}
        </div>

        {/* SQL Schema Copy Section */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 text-xs text-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#0B1E3B]" />
              <span>Supabase SQL Migration Script</span>
            </span>
            <button
              type="button"
              onClick={handleCopyMigration}
              className="text-xs bg-[#0B1E3B] hover:bg-[#071326] text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied!' : 'Copy SQL Script'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            To initialize your remote Supabase database:
            <br />1. Open your <strong>Supabase Dashboard</strong> &rarr; <strong>SQL Editor</strong>
            <br />2. Click <strong>New Query</strong>, paste the copied SQL script, and click <strong>Run</strong>
            <br />3. Your <code className="text-[#0B1E3B] font-mono">profiles</code> and <code className="text-[#0B1E3B] font-mono">loyalty_transactions</code> tables, RLS policies, and RPC functions will be created instantly.
          </p>
        </div>

        {/* Supabase URL & Key Form */}
        <form onSubmit={handleSave} className="space-y-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B1E3B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Supabase Anon / Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B1E3B] font-mono"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              ⚠️ Use only the Anon Public Key. NEVER use the secret service role key.
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!url.trim() || !anonKey.trim()}
              className="flex-1 py-2.5 bg-[#0B1E3B] hover:bg-[#071326] disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#0B1E3B]/20"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Credentials Saved!</span>
                </>
              ) : (
                <span>Update Credentials</span>
              )}
            </button>
          </div>
        </form>

        {/* Reset Demo Database */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <span className="text-[11px] text-slate-500">Need a fresh start?</span>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Transactions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
