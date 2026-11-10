import { getSupabase, isSupabaseConfigured, isTableMissingError, setSchemaMissingStatus } from '../lib/supabase';
import { LoyaltyTransaction, Profile } from '../types';

export const LOCAL_TRANSACTIONS_KEY = 'loyalty_demo_transactions';

export const getStoredTransactions = (): LoyaltyTransaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredTransactions = (transactions: LoyaltyTransaction[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(transactions));
  }
};

export const loyaltyService = {
  /**
   * Calculate customer's real point balance directly from transactions:
   * SUM(points) WHERE customer_id = authenticated customer
   */
  async getCustomerPoints(customerId: string): Promise<number> {
    if (!customerId) return 0;

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('loyalty_transactions')
          .select('points')
          .eq('customer_id', customerId);

        if (error) {
          if (isTableMissingError(error)) {
            setSchemaMissingStatus(true);
            console.warn('Remote loyalty_transactions table not found in schema cache. Using local store fallback.');
          } else {
            console.warn('Error fetching customer points from Supabase:', error);
          }
        } else {
          setSchemaMissingStatus(false);
          const total = (data || []).reduce((acc, row) => acc + (Number(row.points) || 0), 0);
          return total;
        }
      } catch (err) {
        console.warn('Supabase getCustomerPoints exception, falling back:', err);
      }
    }

    // Local persistent database fallback
    const transactions = getStoredTransactions();
    const customerTxs = transactions.filter(t => t.customer_id === customerId);
    const sum = customerTxs.reduce((acc, t) => acc + Number(t.points), 0);
    return sum;
  },

  /**
   * Get transaction history for customer, sorted newest first
   */
  async getCustomerTransactions(customerId: string): Promise<LoyaltyTransaction[]> {
    if (!customerId) return [];

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('loyalty_transactions')
          .select(`
            id,
            customer_id,
            merchant_id,
            points,
            created_at,
            merchant:profiles!loyalty_transactions_merchant_id_fkey(full_name)
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        if (error) {
          if (isTableMissingError(error)) {
            setSchemaMissingStatus(true);
            console.warn('Remote loyalty_transactions table not found in schema cache. Using local store fallback.');
          } else {
            console.warn('Error fetching transaction history from Supabase:', error);
          }
        } else {
          setSchemaMissingStatus(false);
          return (data || []).map((row: any) => ({
            id: row.id,
            customer_id: row.customer_id,
            merchant_id: row.merchant_id,
            points: row.points,
            created_at: row.created_at,
            merchant_name: row.merchant?.full_name || 'Merchant',
          }));
        }
      } catch (err) {
        console.warn('Supabase getCustomerTransactions exception, falling back:', err);
      }
    }

    // Local persistent database fallback
    const transactions = getStoredTransactions();
    return transactions
      .filter(t => t.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Fetch customer profile by ID (used for QR code validation)
   */
  async getCustomerProfile(customerId: string): Promise<Profile | null> {
    if (!customerId) return null;

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customerId)
          .eq('role', 'customer')
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            setSchemaMissingStatus(true);
          }
        } else if (data) {
          return data as Profile;
        }
      } catch (err) {
        console.warn('Supabase getCustomerProfile exception, falling back:', err);
      }
    }

    // Local engine fallback
    const rawUsers = typeof window !== 'undefined' ? localStorage.getItem('loyalty_demo_users') : null;
    if (!rawUsers) {
      // Default customer test account
      if (customerId === 'a1111111-1111-4111-8111-111111111111') {
        return {
          id: 'a1111111-1111-4111-8111-111111111111',
          email: 'john@example.com',
          full_name: 'John Doe',
          role: 'customer',
          created_at: '2026-11-01T08:00:00Z',
        };
      }
      return null;
    }

    try {
      const users: Profile[] = JSON.parse(rawUsers);
      const customer = users.find(u => u.id === customerId && u.role === 'customer');
      return customer || null;
    } catch {
      return null;
    }
  },
};
