export function calculateCustomerStamps(
  transactions: { type: 'EARN_STAMP' | 'REDEEM_REWARD' }[],
  targetStamps: number = 6
) {
  const earned = transactions.filter((t) => t.type === 'EARN_STAMP').length;
  const redeemed = transactions.filter((t) => t.type === 'REDEEM_REWARD').length;

  const netStamps = Math.max(0, earned - redeemed * targetStamps);
  const currentStamps = netStamps % targetStamps;
  const rewardsAvailable = Math.floor(netStamps / targetStamps);

  return {
    totalEarned: earned,
    totalRedeemed: redeemed,
    currentStamps,
    rewardsAvailable,
  };
}

export function calculateTier(totalStamps: number): 'BRONZE' | 'SILVER' | 'GOLD' {
  if (totalStamps >= 25) return 'GOLD';
  if (totalStamps >= 10) return 'SILVER';
  return 'BRONZE';
}

export const TIER_CONFIG = {
  BRONZE: {
    title: 'Bronze Guest',
    label: 'Бронзовый гость',
    minStamps: 0,
    nextTierStamps: 10,
    color: 'from-amber-700 to-amber-900',
    badgeColor: 'bg-amber-800/20 text-amber-500 border-amber-800/40',
    perk: 'Стандартное начисление штампов',
  },
  SILVER: {
    title: 'Silver Connoisseur',
    label: 'Серебряный ценитель',
    minStamps: 10,
    nextTierStamps: 25,
    color: 'from-slate-400 via-stone-300 to-zinc-500',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-400/40',
    perk: '+10% к шансу на секретные напитки и бонусы',
  },
  GOLD: {
    title: 'Gold VIP Coffee Lover',
    label: 'Золотой VIP',
    minStamps: 25,
    nextTierStamps: null,
    color: 'from-amber-400 via-yellow-300 to-amber-600',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
    perk: 'Двойные штампы по выходным и спец-приглашения',
  },
};
