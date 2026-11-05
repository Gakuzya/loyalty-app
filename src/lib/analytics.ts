import { calculateCustomerStamps, calculateTier, TIER_CONFIG } from './loyalty';

export type RfmSegmentKey =
  | 'CHAMPIONS'
  | 'LOYAL'
  | 'PROMISING'
  | 'AT_RISK'
  | 'SLEEPING';

export type ChurnRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RfmScores {
  r: 1 | 2 | 3 | 4 | 5;
  f: 1 | 2 | 3 | 4 | 5;
  m: 1 | 2 | 3 | 4 | 5;
  code: string; // например "5-4-5"
  totalScore: number; // сумма 3..15
}

export interface PersonalOffer {
  id:
    | 'WINBACK_X2'
    | 'WELCOME_X2'
    | 'GOLD_VIP_X2'
    | 'SILVER_BOOST_X2'
    | 'ALMOST_REWARD'
    | 'CHAMPION_PERK'
    | 'STANDARD';
  title: string;
  description: string;
  badge: string;
  stampsToAward: 1 | 2;
  expiresLabel: string;
  reason: string;
  isPromoActive: boolean;
}

export interface TierPrivilegeStatus {
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  tierTitle: string;
  tierLabel: string;
  perkDescription: string;
  isTierBonusActiveNow: boolean;
  activeBonusReason: string | null;
  stampsMultiplier: 1 | 2;
  nextBonusHint: string;
}

export interface GuestAnalyticsProfile {
  customerId: string;
  totalEarned: number;
  totalRedeemed: number;
  currentStamps: number;
  rewardsAvailable: number;
  visitsCount: number;
  visitsLast30Days: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  recencyDays: number;
  avgIntervalDays: number | null;
  expectedIntervalDays: number;
  churnRisk: ChurnRiskLevel;
  churnProbability: number; // 0..99%
  rfm: RfmScores;
  segment: RfmSegmentKey;
  segmentMeta: (typeof RFM_SEGMENTS)[RfmSegmentKey];
  tierPrivilege: TierPrivilegeStatus;
  personalOffer: PersonalOffer;
}

export const RFM_SEGMENTS: Record<
  RfmSegmentKey,
  {
    key: RfmSegmentKey;
    label: string;
    shortLabel: string;
    description: string;
    badgeColor: string;
    textColor: string;
    strategy: string;
  }
> = {
  CHAMPIONS: {
    key: 'CHAMPIONS',
    label: 'Чемпионы',
    shortLabel: 'Чемпион',
    description: 'Ходят часто, были недавно, накопили много штампов',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    textColor: 'text-emerald-400',
    strategy: 'Поддерживать VIP-привилегии и предлагать новинки меню',
  },
  LOYAL: {
    key: 'LOYAL',
    label: 'Постоянные гости',
    shortLabel: 'Лояльный',
    description: 'Стабильный ритм визитов и регулярное накопление штампов',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    textColor: 'text-amber-400',
    strategy: 'Мотивировать к переходу на следующий уровень Tier',
  },
  PROMISING: {
    key: 'PROMISING',
    label: 'Перспективные новички',
    shortLabel: 'Новичок',
    description: 'Недавно совершили первые визиты, формируют привычку',
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    textColor: 'text-sky-400',
    strategy: 'Стимулировать 2-й и 3-й визит бонусным штампом x2',
  },
  AT_RISK: {
    key: 'AT_RISK',
    label: 'В зоне риска',
    shortLabel: 'Риск оттока',
    description: 'Превысили свой обычный интервал между визитами',
    badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    textColor: 'text-orange-400',
    strategy: 'Персональное предложение «Штамп x2 до воскресенья»',
  },
  SLEEPING: {
    key: 'SLEEPING',
    label: 'Спящие / Отток',
    shortLabel: 'Спящий',
    description: 'Давно не посещали кофейню, высокий риск потери гостя',
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    textColor: 'text-rose-400',
    strategy: 'Реактивационная акция: двойные штампы при возвращении',
  },
};

export const CHURN_RISK_META: Record<
  ChurnRiskLevel,
  {
    label: string;
    badgeColor: string;
    barColor: string;
  }
> = {
  LOW: {
    label: 'Низкий',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    barColor: 'bg-emerald-500',
  },
  MEDIUM: {
    label: 'Средний',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    barColor: 'bg-amber-500',
  },
  HIGH: {
    label: 'Высокий',
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    barColor: 'bg-rose-500',
  },
};

export interface RawAnalyticsTx {
  type: 'EARN_STAMP' | 'REDEEM_REWARD';
  createdAt: Date | string;
}

/**
 * Группирует транзакции в уникальные визиты гостя.
 * Если за один визит начислено 2 штампа (например, по акции x2 или привилегии уровня),
 * транзакции в пределах 30 минут объединяются в 1 физический визит.
 */
export function extractGuestVisits(transactions: RawAnalyticsTx[]): Date[] {
  if (!transactions.length) return [];

  const sortedDates = transactions
    .map((t) => new Date(t.createdAt))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!sortedDates.length) return [];

  const visits: Date[] = [sortedDates[0]];
  const MERGE_WINDOW_MS = 30 * 60 * 1000; // 30 минут

  for (let i = 1; i < sortedDates.length; i++) {
    const prevVisit = visits[visits.length - 1];
    const current = sortedDates[i];
    if (current.getTime() - prevVisit.getTime() > MERGE_WINDOW_MS) {
      visits.push(current);
    } else {
      // Обновляем метку времени визита на последнюю операцию в сессии
      visits[visits.length - 1] = current;
    }
  }

  return visits;
}

/**
 * Вычисляет дату ближайшего воскресенья в человекочитаемом виде для оффера «до воскресенья»
 */
export function getUpcomingSundayLabel(now: Date = new Date()): string {
  const day = now.getDay(); // 0 - воскресенье
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const sunday = new Date(now.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000);
  const formatted = sunday.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
  return `до воскресенья (${formatted})`;
}

/**
 * Расчет реальных привилегий уровня лояльности (Bronze / Silver / Gold)
 */
export function evaluateTierPrivilege(
  tier: 'BRONZE' | 'SILVER' | 'GOLD',
  visitsCount: number,
  now: Date = new Date()
): TierPrivilegeStatus {
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.BRONZE;
  const dayOfWeek = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  // Следующий по счету визит, который сейчас произойдет на кассе
  const nextVisitNumber = visitsCount + 1;

  if (tier === 'GOLD') {
    const isEveryThirdVisit = nextVisitNumber % 3 === 0;
    const isActive = isWeekend || isEveryThirdVisit;
    return {
      tier: 'GOLD',
      tierTitle: tierConfig.title,
      tierLabel: tierConfig.label,
      perkDescription: tierConfig.perk,
      isTierBonusActiveNow: isActive,
      activeBonusReason: isWeekend
        ? 'Привилегия Gold VIP: двойные штампы (x2) в пятницу и выходные дни'
        : isEveryThirdVisit
        ? `Привилегия Gold VIP: двойной штамп (x2) на ${nextVisitNumber}-й визит`
        : null,
      stampsMultiplier: isActive ? 2 : 1,
      nextBonusHint: isActive
        ? 'Сейчас действует начисление x2 штампов за визит!'
        : `Двойной штамп (x2) в пятницу–воскресенье или через ${3 - (nextVisitNumber % 3)} виз.`,
    };
  }

  if (tier === 'SILVER') {
    // У Серебряного уровня каждый 4-й визит дает двойной штамп (+25% к скорости накопления)
    const isBonusVisit = nextVisitNumber % 4 === 0;
    const visitsLeft = 4 - (nextVisitNumber % 4);
    return {
      tier: 'SILVER',
      tierTitle: tierConfig.title,
      tierLabel: tierConfig.label,
      perkDescription: tierConfig.perk,
      isTierBonusActiveNow: isBonusVisit,
      activeBonusReason: isBonusVisit
        ? `Привилегия Silver: двойной штамп (x2) на ваш ${nextVisitNumber}-й визит`
        : null,
      stampsMultiplier: isBonusVisit ? 2 : 1,
      nextBonusHint: isBonusVisit
        ? 'На этот визит активен бонус Silver: штамп x2!'
        : `До бонусного удвоения штампов (x2) по статусу Silver: ${visitsLeft} виз.`,
    };
  }

  // BRONZE
  return {
    tier: 'BRONZE',
    tierTitle: tierConfig.title,
    tierLabel: tierConfig.label,
    perkDescription: tierConfig.perk,
    isTierBonusActiveNow: false,
    activeBonusReason: null,
    stampsMultiplier: 1,
    nextBonusHint: 'Накопите 10 штампов для перехода на Silver и бонусных штампов x2',
  };
}

/**
 * Полный расчет RFM-сегментации, среднего интервала между визитами,
 * риска оттока и персонального предложения для конкретного гостя.
 */
export function analyzeGuest(
  customerId: string,
  transactions: RawAnalyticsTx[],
  targetStamps: number = 6,
  now: Date = new Date()
): GuestAnalyticsProfile {
  const stampStats = calculateCustomerStamps(transactions, targetStamps);
  const tier = calculateTier(stampStats.totalEarned);
  const visits = extractGuestVisits(transactions);
  const visitsCount = visits.length;

  const firstVisitDate = visitsCount > 0 ? visits[0] : null;
  const lastVisitDate = visitsCount > 0 ? visits[visitsCount - 1] : null;

  // Давность последнего визита в днях (Recency)
  const recencyDays = lastVisitDate
    ? Math.max(
        0,
        Math.round(
          ((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)) * 10
        ) / 10
      )
    : 999;

  // Частота за последние 30 дней (Frequency)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const visitsLast30Days = visits.filter((v) => v >= thirtyDaysAgo).length;

  // Средний интервал между визитами (в днях)
  let avgIntervalDays: number | null = null;
  if (visitsCount >= 2) {
    let totalDiffDays = 0;
    for (let i = 1; i < visitsCount; i++) {
      const diffMs = visits[i].getTime() - visits[i - 1].getTime();
      totalDiffDays += diffMs / (1000 * 60 * 60 * 24);
    }
    avgIntervalDays = Math.max(
      0.5,
      Math.round((totalDiffDays / (visitsCount - 1)) * 10) / 10
    );
  }

  // Ожидаемый интервал гостя (персональная норма или 7 дней для новых гостей)
  const expectedIntervalDays = avgIntervalDays !== null ? Math.max(2, avgIntervalDays) : 7;

  // Расчет риска оттока (Churn Risk & Probability)
  let churnProbability = 10;
  let churnRisk: ChurnRiskLevel = 'LOW';

  if (visitsCount === 0) {
    churnProbability = 50;
    churnRisk = 'MEDIUM';
  } else {
    const ratio = recencyDays / expectedIntervalDays;

    if (recencyDays <= 2 && ratio <= 1.2) {
      churnProbability = Math.min(20, Math.max(5, Math.round(ratio * 15)));
      churnRisk = 'LOW';
    } else if (ratio <= 1.3 && recencyDays <= 10) {
      churnProbability = Math.min(34, Math.max(12, Math.round(ratio * 24)));
      churnRisk = 'LOW';
    } else if (ratio <= 2.3 && recencyDays <= 21) {
      churnProbability = Math.min(68, Math.max(38, Math.round(25 + ratio * 18)));
      churnRisk = 'MEDIUM';
    } else {
      churnProbability = Math.min(
        96,
        Math.max(72, Math.round(55 + Math.min(40, ratio * 12 + recencyDays * 0.5)))
      );
      churnRisk = 'HIGH';
    }
  }

  // Оценка R (Recency: 1..5)
  const rScore: 1 | 2 | 3 | 4 | 5 =
    recencyDays <= 3
      ? 5
      : recencyDays <= 7
      ? 4
      : recencyDays <= 14
      ? 3
      : recencyDays <= 30
      ? 2
      : 1;

  // Оценка F (Frequency: 1..5)
  const effectiveFreq = Math.max(visitsLast30Days, Math.ceil(visitsCount * 0.6));
  const fScore: 1 | 2 | 3 | 4 | 5 =
    effectiveFreq >= 10
      ? 5
      : effectiveFreq >= 6
      ? 4
      : effectiveFreq >= 3
      ? 3
      : effectiveFreq >= 2
      ? 2
      : 1;

  // Оценка M (Monetary / Количество штампов: 1..5)
  const mScore: 1 | 2 | 3 | 4 | 5 =
    stampStats.totalEarned >= 25
      ? 5
      : stampStats.totalEarned >= 15
      ? 4
      : stampStats.totalEarned >= 10
      ? 3
      : stampStats.totalEarned >= 5
      ? 2
      : 1;

  const rfm: RfmScores = {
    r: rScore,
    f: fScore,
    m: mScore,
    code: `${rScore}-${fScore}-${mScore}`,
    totalScore: rScore + fScore + mScore,
  };

  // Определение RFM-сегмента
  let segment: RfmSegmentKey = 'LOYAL';
  if (rScore === 1 || (churnRisk === 'HIGH' && recencyDays > 14)) {
    segment = 'SLEEPING';
  } else if (rScore === 2 || churnRisk === 'HIGH' || (churnRisk === 'MEDIUM' && recencyDays >= 7)) {
    segment = 'AT_RISK';
  } else if (rScore >= 4 && fScore >= 4 && mScore >= 3) {
    segment = 'CHAMPIONS';
  } else if (visitsCount <= 2 && rScore >= 3) {
    segment = 'PROMISING';
  } else {
    segment = 'LOYAL';
  }

  const tierPrivilege = evaluateTierPrivilege(tier, visitsCount, now);
  const sundayLabel = getUpcomingSundayLabel(now);

  // Формирование персонального предложения (Next Best Offer)
  let personalOffer: PersonalOffer;

  if (segment === 'AT_RISK' || segment === 'SLEEPING' || churnRisk === 'HIGH') {
    personalOffer = {
      id: 'WINBACK_X2',
      title: `Вы давно не заходили — штамп x2 ${sundayLabel}`,
      description:
        'Вернитесь в кофейню на этой неделе и получите сразу 2 штампа вместо 1 за любую чашку кофе!',
      badge: 'Штамп x2',
      stampsToAward: 2,
      expiresLabel: sundayLabel,
      reason:
        avgIntervalDays !== null
          ? `Пауза ${recencyDays} дн. при среднем интервале ${avgIntervalDays} дн. (риск оттока ${churnProbability}%)`
          : `Давность визита ${recencyDays} дн. (риск оттока ${churnProbability}%)`,
      isPromoActive: true,
    };
  } else if (tierPrivilege.isTierBonusActiveNow) {
    personalOffer = {
      id: tier === 'GOLD' ? 'GOLD_VIP_X2' : 'SILVER_BOOST_X2',
      title:
        tierPrivilege.activeBonusReason ||
        `Привилегия ${tierPrivilege.tierTitle}: штамп x2 сегодня`,
      description:
        tier === 'GOLD'
          ? 'Для гостей со статусом Gold VIP действует автоматическое удвоение штампов (x2)!'
          : 'Сработала привилегия статуса Silver Connoisseur — на этот визит начисляется 2 штампа!',
      badge: `${tier} x2`,
      stampsToAward: 2,
      expiresLabel: 'Активно на текущий визит',
      reason: `Активная привилегия уровня ${tierPrivilege.tierLabel} (${stampStats.totalEarned} штампов)`,
      isPromoActive: true,
    };
  } else if (segment === 'PROMISING' && visitsCount === 1) {
    personalOffer = {
      id: 'WELCOME_X2',
      title: `Бонус за 2-й визит: штамп x2 ${sundayLabel}`,
      description:
        'Загляните к нам повторно до конца недели, и мы удвоим ваш штамп для быстрого старта!',
      badge: 'Старт x2',
      stampsToAward: 2,
      expiresLabel: sundayLabel,
      reason: 'Стимулирование 2-го визита у нового гостя (сегмент «Перспективные»)',
      isPromoActive: true,
    };
  } else if (stampStats.currentStamps === targetStamps - 1) {
    personalOffer = {
      id: 'ALMOST_REWARD',
      title: 'Остался 1 штамп до бесплатного кофе!',
      description:
        'Следующая чашка закроет карточку лояльности и откроет подарочный напиток.',
      badge: '1 ☕ до приза',
      stampsToAward: 1,
      expiresLabel: 'Бессрочно',
      reason: `Прогресс карты ${stampStats.currentStamps}/${targetStamps} — высокая мотивация завершения цикла`,
      isPromoActive: true,
    };
  } else if (segment === 'CHAMPIONS') {
    personalOffer = {
      id: 'CHAMPION_PERK',
      title: 'Клуб Чемпионов: дегустация зерна и приоритет',
      description: `${tierPrivilege.nextBonusHint}. Спасибо, что выбираете нашу кофейню каждые ${avgIntervalDays ?? 2} дн.!`,
      badge: 'VIP Гость',
      stampsToAward: 1,
      expiresLabel: 'Постоянная привилегия',
      reason: `RFM ${rfm.code} (Чемпион сети, риск оттока всего ${churnProbability}%)`,
      isPromoActive: false,
    };
  } else {
    personalOffer = {
      id: 'STANDARD',
      title: tierPrivilege.nextBonusHint,
      description: `Статус ${tierPrivilege.tierLabel}: до бесплатного напитка осталось ${
        targetStamps - stampStats.currentStamps
      } шт.`,
      badge: tierPrivilege.tierTitle,
      stampsToAward: 1,
      expiresLabel: 'Активно',
      reason: `Стабильный гость (RFM ${rfm.code}, интервал ${avgIntervalDays ?? '—'} дн.)`,
      isPromoActive: false,
    };
  }

  return {
    customerId,
    totalEarned: stampStats.totalEarned,
    totalRedeemed: stampStats.totalRedeemed,
    currentStamps: stampStats.currentStamps,
    rewardsAvailable: stampStats.rewardsAvailable,
    visitsCount,
    visitsLast30Days,
    firstVisitAt: firstVisitDate ? firstVisitDate.toISOString() : null,
    lastVisitAt: lastVisitDate ? lastVisitDate.toISOString() : null,
    recencyDays,
    avgIntervalDays,
    expectedIntervalDays,
    churnRisk,
    churnProbability,
    rfm,
    segment,
    segmentMeta: RFM_SEGMENTS[segment],
    tierPrivilege,
    personalOffer,
  };
}

/**
 * Сводная аналитика по базе гостей для страницы /guests
 */
export function summarizeNetworkGuestsAnalytics(profiles: GuestAnalyticsProfile[]) {
  const totalGuests = profiles.length;
  const segmentCounts: Record<RfmSegmentKey, number> = {
    CHAMPIONS: 0,
    LOYAL: 0,
    PROMISING: 0,
    AT_RISK: 0,
    SLEEPING: 0,
  };

  let highChurnCount = 0;
  let activeX2OffersCount = 0;
  let sumIntervals = 0;
  let countWithIntervals = 0;

  for (const p of profiles) {
    segmentCounts[p.segment] += 1;
    if (p.churnRisk === 'HIGH' || p.segment === 'AT_RISK' || p.segment === 'SLEEPING') {
      highChurnCount += 1;
    }
    if (p.personalOffer.stampsToAward > 1) {
      activeX2OffersCount += 1;
    }
    if (p.avgIntervalDays !== null) {
      sumIntervals += p.avgIntervalDays;
      countWithIntervals += 1;
    }
  }

  const avgNetworkIntervalDays =
    countWithIntervals > 0
      ? Math.round((sumIntervals / countWithIntervals) * 10) / 10
      : null;

  return {
    totalGuests,
    segmentCounts,
    highChurnCount,
    activeX2OffersCount,
    avgNetworkIntervalDays,
  };
}

