export type Role = 'CUSTOMER' | 'BARISTA' | 'OWNER' | 'ADMIN';

export type TransactionType =
  | 'STAMP_ADDED'
  | 'REWARD_EARNED'
  | 'REWARD_REDEEMED'
  | 'MANUAL_ADJUST';

export interface UserProfile {
  id: string;
  phone?: string | null;
  email?: string | null;
  fullName?: string | null;
  role: Role;
  telegramId?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface ShopInfo {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  logoUrl?: string | null;
  targetStamps: number;
  rewardTitle: string;
  cooldownMinutes: number;
}

export interface LoyaltyCardData {
  id: string;
  customerId: string;
  shopId: string;
  currentStamps: number;
  totalStampsEarned: number;
  rewardsAvailable: number;
  rewardsRedeemed: number;
  qrToken: string;
  lastStampedAt?: string | null;
  shop?: ShopInfo;
}

export interface StampTransaction {
  id: string;
  cardId: string;
  shopId: string;
  baristaId?: string | null;
  type: TransactionType;
  stampsDelta: number;
  comment?: string | null;
  createdAt: string;
}
