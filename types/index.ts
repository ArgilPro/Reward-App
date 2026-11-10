export type UserRole = 'customer' | 'merchant';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  merchant_id: string;
  points: number;
  created_at: string;
  customer_name?: string;
  merchant_name?: string;
}

export interface MerchantStats {
  points_awarded_today: number;
  transactions_today: number;
}

export interface CustomerSummary {
  profile: Profile;
  current_points: number;
}

export interface AwardPointsResult {
  success: boolean;
  transaction_id: string;
  customer_id: string;
  customer_name: string;
  points_awarded: number;
  new_balance: number;
  created_at: string;
}
