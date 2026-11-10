import { getSupabase, isSupabaseConfigured, isTableMissingError, setSchemaMissingStatus } from '../lib/supabase';
import { Profile, UserRole } from '../types';

// Persistent local storage keys for standalone demo mode
const LOCAL_USERS_KEY = 'loyalty_demo_users';
const LOCAL_SESSION_KEY = 'loyalty_demo_session';

interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

// Initial seed profiles matching the user request
const INITIAL_USERS: DemoUser[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    email: 'john@example.com',
    passwordHash: 'password123',
    full_name: 'John Doe',
    role: 'customer',
    created_at: '2026-11-01T08:00:00Z',
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    email: 'merchant@example.com',
    passwordHash: 'password123',
    full_name: 'ABC Restaurant',
    role: 'merchant',
    created_at: '2026-11-01T08:00:00Z',
  },
];

const getStoredUsers = (): DemoUser[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
};

const saveStoredUsers = (users: DemoUser[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }
};

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ profile: Profile; token?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Please enter both email and password.');
    }

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!error && data.user) {
          // Fetch profile from Supabase
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileErr) {
            if (isTableMissingError(profileErr)) {
              setSchemaMissingStatus(true);
            }
            const meta = data.user.user_metadata || {};
            const fallbackProfile: Profile = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              full_name: meta.full_name || cleanEmail.split('@')[0],
              role: (meta.role as UserRole) || 'customer',
              created_at: data.user.created_at || new Date().toISOString(),
            };
            return { profile: fallbackProfile, token: data.session?.access_token };
          }

          if (profile) {
            setSchemaMissingStatus(false);
            return { profile: profile as Profile, token: data.session?.access_token };
          }
        }
      } catch (err) {
        console.warn('Supabase remote signin error, checking local store:', err);
      }
    }

    // Local Persistent Supabase-compatible engine fallback
    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user || user.passwordHash !== cleanPassword) {
      throw new Error('Invalid email or password. Please try again.');
    }

    const profile: Profile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
    }

    return { profile };
  },

  /**
   * Sign up a new customer or merchant
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<{ profile: Profile }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanPassword || !cleanName) {
      throw new Error('All fields are required.');
    }

    if (cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: cleanName,
              role: role,
            },
          },
        });

        if (!error && data.user) {
          const { data: profile, error: profErr } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: cleanEmail,
              full_name: cleanName,
              role: role,
            })
            .select()
            .single();

          if (profErr && isTableMissingError(profErr)) {
            setSchemaMissingStatus(true);
          }

          return {
            profile: (profile || {
              id: data.user.id,
              email: cleanEmail,
              full_name: cleanName,
              role: role,
              created_at: new Date().toISOString(),
            }) as Profile,
          };
        }
      } catch (err) {
        console.warn('Supabase signUp error, falling back:', err);
      }
    }

    // Local Persistent Storage fallback
    const users = getStoredUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    const newUser: DemoUser = {
      id: newId,
      email: cleanEmail,
      passwordHash: cleanPassword,
      full_name: cleanName,
      role: role,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);

    const profile: Profile = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      created_at: newUser.created_at,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
    }

    return { profile };
  },

  /**
   * Retrieve active session profile
   */
  async getSessionProfile(): Promise<Profile | null> {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (!error && profile) {
            return profile as Profile;
          }
          if (error && isTableMissingError(error)) {
            setSchemaMissingStatus(true);
          }
        }
      } catch (err) {
        console.warn('Supabase getSessionProfile exception:', err);
      }
    }

    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LOCAL_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Continue
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  },
};
