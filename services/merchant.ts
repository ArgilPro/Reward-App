import { getSupabase, isSupabaseConfigured, isTableMissingError, setSchemaMissingStatus } from '../lib/supabase';
import { AwardPointsResult, CustomerSummary, LoyaltyTransaction, MerchantStats } from '../types';
import { getStoredTransactions, loyaltyService, saveStoredTransactions } from './loyalty';

// Helper to get start of current day in ISO format
const getStartOfTodayISO = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
};

export const merchantService = {
  /**
   * Calculate merchant statistics for today:
   * - Points Awarded Today (SUM of points created today)
   * - Transactions Today (COUNT of transactions created today)
   */
  async getMerchantStats(merchantId: string): Promise<MerchantStats> {
    if (!merchantId) {
      return { points_awarded_today: 0, transactions_today: 0 };
    }

    const startOfToday = getStartOfTodayISO();
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('loyalty_transactions')
          .select('points, created_at')
          .eq('merchant_id', merchantId)
          .gte('created_at', startOfToday);

        if (error) {
          if (isTableMissingError(error)) {
            setSchemaMissingStatus(true);
            console.warn('Remote loyalty_transactions table not found in schema cache. Using local store for merchant stats.');
          } else {
            console.warn('Error fetching merchant stats from Supabase:', error);
          }
        } else {
          setSchemaMissingStatus(false);
          const pointsToday = (data || []).reduce((acc, row) => acc + (Number(row.points) || 0), 0);
          const countToday = (data || []).length;

          return {
            points_awarded_today: pointsToday,
            transactions_today: countToday,
          };
        }
      } catch (err) {
        console.warn('Supabase getMerchantStats exception, falling back:', err);
      }
    }

    // Local persistent database fallback
    const transactions = getStoredTransactions();
    const todayMillis = new Date(startOfToday).getTime();
    const merchantTodayTxs = transactions.filter(t => {
      return t.merchant_id === merchantId && new Date(t.created_at).getTime() >= todayMillis;
    });

    const pointsToday = merchantTodayTxs.reduce((acc, t) => acc + Number(t.points), 0);

    return {
      points_awarded_today: pointsToday,
      transactions_today: merchantTodayTxs.length,
    };
  },

  /**
   * Get recent transactions for the authenticated merchant
   */
  async getRecentTransactions(merchantId: string, limit = 20): Promise<LoyaltyTransaction[]> {
    if (!merchantId) return [];

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
            customer:profiles!loyalty_transactions_customer_id_fkey(full_name)
          `)
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          if (isTableMissingError(error)) {
            setSchemaMissingStatus(true);
            console.warn('Remote loyalty_transactions table not found in schema cache. Using local store for recent transactions.');
          } else {
            console.warn('Error loading recent merchant transactions from Supabase:', error);
          }
        } else {
          setSchemaMissingStatus(false);
          return (data || []).map((row: any) => ({
            id: row.id,
            customer_id: row.customer_id,
            merchant_id: row.merchant_id,
            points: row.points,
            created_at: row.created_at,
            customer_name: row.customer?.full_name || 'Customer',
          }));
        }
      } catch (err) {
        console.warn('Supabase getRecentTransactions exception, falling back:', err);
      }
    }

    // Local persistent database fallback
    const transactions = getStoredTransactions();
    return transactions
      .filter(t => t.merchant_id === merchantId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  /**
   * Verify customer QR code payload and retrieve profile + real point balance
   */
  async verifyCustomer(rawPayload: string): Promise<CustomerSummary> {
    if (!rawPayload || typeof rawPayload !== 'string') {
      throw new Error('Invalid customer QR code.');
    }

    let customerId = rawPayload.trim();
    if (customerId.startsWith('{')) {
      try {
        const parsed = JSON.parse(customerId);
        customerId = parsed.customerId || parsed.id || customerId;
      } catch {
        // Continue with raw string
      }
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(customerId)) {
      throw new Error('Invalid customer QR code.');
    }

    const profile = await loyaltyService.getCustomerProfile(customerId);
    if (!profile) {
      throw new Error('Customer not found.');
    }

    if (profile.role !== 'customer') {
      throw new Error('Scanned QR code does not belong to a valid customer.');
    }

    const currentPoints = await loyaltyService.getCustomerPoints(customerId);

    return {
      profile,
      current_points: currentPoints,
    };
  },

  /**
   * Award points to customer via secure transaction / RPC with resilient fallback
   */
  async awardPoints(
    merchantId: string,
    merchantName: string,
    customerId: string,
    points: number
  ): Promise<AwardPointsResult> {
    if (!merchantId) {
      throw new Error('Unauthorized: Merchant must be logged in.');
    }

    if (!customerId) {
      throw new Error('Missing customer identifier.');
    }

    if (isNaN(points) || points <= 0 || !Number.isInteger(points)) {
      throw new Error('Points must be a positive integer greater than 0.');
    }

    if (points > 10000) {
      throw new Error('Points cannot exceed 10,000 in a single transaction.');
    }

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('award_points', {
          p_customer_id: customerId,
          p_points: points,
        });

        if (error) {
          if (isTableMissingError(error)) {
            setSchemaMissingStatus(true);
            console.warn('award_points RPC not found on remote Supabase. Recording transaction locally.');
          } else {
            console.warn('RPC award_points warning:', error);
          }
        } else if (data) {
          setSchemaMissingStatus(false);
          return {
            success: true,
            transaction_id: data.transaction_id,
            customer_id: customerId,
            customer_name: data.customer_name,
            points_awarded: points,
            new_balance: data.new_balance,
            created_at: data.created_at || new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Supabase awardPoints RPC exception, using local store:', err);
      }
    }

    // Local persistent database fallback
    const customer = await loyaltyService.getCustomerProfile(customerId);
    if (!customer) {
      throw new Error('Customer not found.');
    }

    const newTxId = 'tx-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
    const newTransaction: LoyaltyTransaction = {
      id: newTxId,
      customer_id: customerId,
      merchant_id: merchantId,
      points,
      created_at: new Date().toISOString(),
      customer_name: customer.full_name,
      merchant_name: merchantName,
    };

    const transactions = getStoredTransactions();
    transactions.unshift(newTransaction);
    saveStoredTransactions(transactions);

    const newBalance = await loyaltyService.getCustomerPoints(customerId);

    return {
      success: true,
      transaction_id: newTxId,
      customer_id: customerId,
      customer_name: customer.full_name,
      points_awarded: points,
      new_balance: newBalance,
      created_at: newTransaction.created_at,
    };
  },
};
