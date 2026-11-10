import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable lookup (supports both Expo and Vite)
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key] as string;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(key);
    if (saved) return saved;
  }
  return '';
};

export const SUPABASE_URL =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('EXPO_PUBLIC_SUPABASE_URL') ||
  '';

export const SUPABASE_ANON_KEY =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
  '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_URL.startsWith('http') &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY.length > 20
);

let supabaseClient: SupabaseClient | null = null;
let schemaMissing = false;
const schemaListeners = new Set<(missing: boolean) => void>();

export const isTableMissingError = (error: any): boolean => {
  if (!error) return false;
  const code = String(error.code || '');
  const message = String(error.message || '');
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('relation')
  );
};

export const setSchemaMissingStatus = (missing: boolean) => {
  if (schemaMissing !== missing) {
    schemaMissing = missing;
    schemaListeners.forEach((listener) => listener(missing));
  }
};

export const isRemoteSchemaMissing = () => schemaMissing;

export const subscribeSchemaStatus = (callback: (missing: boolean) => void) => {
  schemaListeners.add(callback);
  callback(schemaMissing);
  return () => {
    schemaListeners.delete(callback);
  };
};

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

export const getSupabase = (): SupabaseClient | null => supabaseClient;

export const setSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('VITE_SUPABASE_URL', url.trim());
    window.localStorage.setItem('VITE_SUPABASE_ANON_KEY', key.trim());
    window.localStorage.setItem('EXPO_PUBLIC_SUPABASE_URL', url.trim());
    window.localStorage.setItem('EXPO_PUBLIC_SUPABASE_ANON_KEY', key.trim());
  }
  if (url && key) {
    supabaseClient = createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    setSchemaMissingStatus(false);
    return true;
  }
  return false;
};
