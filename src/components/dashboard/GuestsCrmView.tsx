'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Coffee,
  Gift,
  UserCheck,
  Crown,
  Activity,
  AlertTriangle,
  Sparkles,
  Clock,
  Zap,
  X,
  Search,
  ChevronRight,
} from 'lucide-react';
import { TIER_CONFIG } from '@/lib/loyalty';
import {
  RFM_SEGMENTS,
  CHURN_RISK_META,
  type GuestAnalyticsProfile,
  type RfmSegmentKey,
} from '@/lib/analytics';

export interface GuestCrmRow {
  customer: {
    id: string;
    name: string | null;
    email: string;
    tier: 'BRONZE' | 'SILVER' | 'GOLD';
  };
  lastBranchName: string;
  analytics: GuestAnalyticsProfile;
}

interface GuestsCrmViewProps {
  networkName: string;
  guests: GuestCrmRow[];
  summary: {
    totalGuests: number;
    segmentCounts: Record<RfmSegmentKey, number>;
    highChurnCount: number;
    activeX2OffersCount: number;
    avgNetworkIntervalDays: number | null;
  };
  totalStampsAllTime: number;
  totalRedeemedRewards: number;
}

export const GuestsCrmView: React.FC<GuestsCrmViewProps> = ({
  networkName,
  guests,
  summary,
  totalStampsAllTime,
  totalRedeemedRewards,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<'ALL' | RfmSegmentKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestCrmRow | null>(null);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (selectedSegment !== 'ALL' && g.analytics.segment !== selectedSegment) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = g.customer.name?.toLowerCase() || '';
        const email = g.customer.email.toLowerCase();
        const offer = g.analytics.personalOffer.title.toLowerCase();
        return name.includes(q) || email.includes(q) || offer.includes(q);
      }
      return true;
    });
  }, [guests, selectedSegment, searchQuery]);

  return (
    <div className="space-y-6 select-none">
      {/* Заголовок */}
      <div className="pb-4 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1.5">
            <Activity className="w-3.5 h-3.5" />
            RFM-сегментация и удержание (Churn Analytics)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            База постоянных клиентов
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
            RFM-анализ гостей сети «{networkName}», интервалы между визитами, риск оттока и персональные офферы
          </p>
        </div>
      </div>

      {/* Верхние агрегированные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider block">
              Всего гостей
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {summary.totalGuests}
            </span>
            <span className="text-[11px] text-stone-500">В базе лояльности</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider block">
              Средний интервал
            </span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {summary.avgNetworkIntervalDays !== null
                ? `${summary.avgNetworkIntervalDays} дн.`
                : '—'}
            </span>
            <span className="text-[11px] text-stone-500">Между визитами</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider block">
              Риск оттока
            </span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">
              {summary.highChurnCount}
            </span>
            <span className="text-[11px] text-stone-500">Требуют реактивации</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider block">
              Офферы «Штамп x2»
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {summary.activeX2OffersCount}
            </span>
            <span className="text-[11px] text-stone-500">Активны сейчас</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider block">
              Штампы / Подарки
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {totalStampsAllTime}{' '}
              <span className="text-sm font-bold text-emerald-400">
                / {totalRedeemedRewards} ☕
              </span>
            </span>
            <span className="text-[11px] text-stone-500">За всё время</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Матрица RFM-сегментов (интерактивные карточки-фильтры) */}
      <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Распределение базы по RFM-сегментам (Recency • Frequency • Monetary)</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Нажмите на сегмент для фильтрации гостей и просмотра назначенных персональных предложений
            </p>
          </div>
          {selectedSegment !== 'ALL' && (
            <button
              onClick={() => setSelectedSegment('ALL')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold self-start sm:self-auto cursor-pointer"
            >
              Сбросить фильтр ({summary.totalGuests})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(Object.keys(RFM_SEGMENTS) as RfmSegmentKey[]).map((segKey) => {
            const seg = RFM_SEGMENTS[segKey];
            const count = summary.segmentCounts[segKey] || 0;
            const percent =
              summary.totalGuests > 0
                ? Math.round((count / summary.totalGuests) * 100)
                : 0;
            const isSelected = selectedSegment === segKey;

            return (
              <button
                key={segKey}
                type="button"
                onClick={() =>
                  setSelectedSegment(isSelected ? 'ALL' : segKey)
                }
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-800 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-stone-950/70 border-stone-800/90 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${seg.badgeColor}`}
                  >
                    {seg.label}
                  </span>
                  <span className="text-xs font-mono text-stone-400">
                    {percent}%
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white">{count}</span>
                  <span className="text-[11px] text-stone-500">гостей</span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                  {seg.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Таблица клиентов с RFM, интервалом, риском оттока и персональным предложением */}
      <div className="rounded-3xl bg-stone-900/80 border border-stone-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-white">
              Реестр гостей и персональные предложения ({filteredGuests.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, email или акции..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {filteredGuests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/60 text-stone-400 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3.5 px-4">Гость и Уровень</th>
                  <th className="py-3.5 px-4">RFM-сегмент</th>
                  <th className="py-3.5 px-4 text-center">Интервал визитов</th>
                  <th className="py-3.5 px-4 text-center">Риск оттока</th>
                  <th className="py-3.5 px-4">Персональное предложение</th>
                  <th className="py-3.5 px-4 text-center">Штампы</th>
                  <th className="py-3.5 px-4 text-right">Карточка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 font-medium">
                {filteredGuests.map((g) => {
                  const tierData =
                    TIER_CONFIG[g.customer.tier] || TIER_CONFIG.BRONZE;
                  const { analytics } = g;
                  const churnMeta = CHURN_RISK_META[analytics.churnRisk];

                  return (
                    <tr
                      key={g.customer.id}
                      onClick={() => setSelectedGuest(g)}
                      className="hover:bg-stone-800/40 transition-colors cursor-pointer"
                    >
                      {/* Гость и Уровень */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700/60 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                            {g.customer.name?.charAt(0) ||
                              g.customer.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">
                              {g.customer.name || 'Гость без имени'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierData.badgeColor}`}
                              >
                                <Crown className="w-2.5 h-2.5" />
                                <span>{tierData.title}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* RFM-сегмент */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${analytics.segmentMeta.badgeColor}`}
                        >
                          {analytics.segmentMeta.label}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono block mt-1">
                          RFM: <strong className="text-stone-200">{analytics.rfm.code}</strong> ({analytics.rfm.totalScore}/15)
                        </span>
                      </td>

                      {/* Средний интервал и давность */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-white font-bold block">
                          {analytics.avgIntervalDays !== null
                            ? `${analytics.avgIntervalDays} дн.`
                            : '1-й визит'}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          Был: {analytics.recencyDays === 0 ? 'сегодня' : `${analytics.recencyDays} дн. назад`}
                        </span>
                      </td>

                      {/* Риск оттока */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${churnMeta.badgeColor}`}
                          >
                            {churnMeta.label} ({analytics.churnProbability}%)
                          </span>
                          <div className="w-20 h-1.5 rounded-full bg-stone-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${churnMeta.barColor}`}
                              style={{ width: `${analytics.churnProbability}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Персональное предложение */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 mt-0.5 ${
                              analytics.personalOffer.stampsToAward > 1
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-stone-800 text-amber-400 border border-stone-700'
                            }`}
                          >
                            {analytics.personalOffer.badge}
                          </span>
                          <div className="min-w-0">
                            <span className="text-white font-semibold block leading-snug">
                              {analytics.personalOffer.title}
                            </span>
                            <span className="text-[10px] text-stone-400 block mt-0.5">
                              {analytics.personalOffer.reason}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Штампы и подарки */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-white text-sm">
                          {analytics.totalEarned} ☕
                        </span>
                        <span className="text-[10px] text-emerald-400 block">
                          {analytics.totalRedeemed} подарков
                        </span>
                      </td>

                      {/* Кнопка открытия карточки гостя */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGuest(g);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          <span>Профиль</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">
              Гости по заданному фильтру не найдены
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Попробуйте выбрать другой RFM-сегмент или очистить строку поиска.
            </p>
          </div>
        )}
      </div>

      {/* МОДАЛЬНАЯ КАРТОЧКА ГОСТЯ (ДЕТАЛЬНАЯ RFM-ДИАГНОСТИКА И ПРИВИЛЕГИИ УРОВНЯ) */}
      {selectedGuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedGuest(null)}
        >
          <div
            className="relative w-full max-w-lg p-6 rounded-3xl bg-stone-900 border border-stone-700 shadow-2xl space-y-5 text-stone-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black text-lg flex items-center justify-center">
                  {selectedGuest.customer.name?.charAt(0) ||
                    selectedGuest.customer.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-extrabold text-white">
                      {selectedGuest.customer.name || 'Гость кофейни'}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedGuest.analytics.segmentMeta.badgeColor
                      }`}
                    >
                      {selectedGuest.analytics.segmentMeta.label}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    {selectedGuest.customer.email} • Последний филиал: {selectedGuest.lastBranchName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Детализация RFM (R, F, M) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                  Recency (Давность)
                </span>
                <span className="text-lg font-black text-white mt-1 block">
                  R = {selectedGuest.analytics.rfm.r}/5
                </span>
                <span className="text-[11px] text-stone-400">
                  {selectedGuest.analytics.recencyDays === 0
                    ? 'Визит сегодня'
                    : `${selectedGuest.analytics.recencyDays} дн. назад`}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                  Frequency (Частота)
                </span>
                <span className="text-lg font-black text-amber-400 mt-1 block">
                  F = {selectedGuest.analytics.rfm.f}/5
                </span>
                <span className="text-[11px] text-stone-400">
                  Визитов: {selectedGuest.analytics.visitsCount} ({selectedGuest.analytics.visitsLast30Days} за 30 дн.)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                  Monetary (Штампы)
                </span>
                <span className="text-lg font-black text-emerald-400 mt-1 block">
                  M = {selectedGuest.analytics.rfm.m}/5
                </span>
                <span className="text-[11px] text-stone-400">
                  {selectedGuest.analytics.totalEarned} штампов / {selectedGuest.analytics.totalRedeemed} призов
                </span>
              </div>
            </div>

            {/* Интервал визитов и риск оттока */}
            <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Ритм визитов и диагностика оттока</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    CHURN_RISK_META[selectedGuest.analytics.churnRisk].badgeColor
                  }`}
                >
                  Риск оттока: {selectedGuest.analytics.churnProbability}% ({CHURN_RISK_META[selectedGuest.analytics.churnRisk].label})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-stone-400 block text-[11px]">
                    Средний интервал между визитами:
                  </span>
                  <strong className="text-white text-sm font-mono">
                    {selectedGuest.analytics.avgIntervalDays !== null
                      ? `каждые ${selectedGuest.analytics.avgIntervalDays} дн.`
                      : 'Недостаточно данных (1 визит)'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-stone-400 block text-[11px]">
                    Текущая пауза с последнего визита:
                  </span>
                  <strong className="text-amber-400 text-sm font-mono">
                    {selectedGuest.analytics.recencyDays} дн. (норма до {selectedGuest.analytics.expectedIntervalDays} дн.)
                  </strong>
                </div>
              </div>
            </div>

            {/* Привилегия уровня лояльности */}
            <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>
                    Привилегия уровня: {selectedGuest.analytics.tierPrivilege.tierLabel} ({selectedGuest.analytics.tierPrivilege.tierTitle})
                  </span>
                </span>
                <span className="text-[11px] font-bold text-amber-400">
                  Множитель уровня: x{selectedGuest.analytics.tierPrivilege.stampsMultiplier}
                </span>
              </div>
              <p className="text-xs text-stone-300">
                {selectedGuest.analytics.tierPrivilege.perkDescription}
              </p>
              <p className="text-[11px] text-amber-400 font-medium">
                {selectedGuest.analytics.tierPrivilege.nextBonusHint}
              </p>
            </div>

            {/* Активное персональное предложение */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-stone-900 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Персональное предложение в карточке гостя</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-stone-950 font-black text-[10px]">
                  {selectedGuest.analytics.personalOffer.badge} (начислит +{selectedGuest.analytics.personalOffer.stampsToAward} шт.)
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {selectedGuest.analytics.personalOffer.title}
              </h4>
              <p className="text-xs text-stone-300">
                {selectedGuest.analytics.personalOffer.description}
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-stone-400 border-t border-amber-500/20">
                <span>Основание: {selectedGuest.analytics.personalOffer.reason}</span>
                <span className="text-amber-300 font-semibold">
                  Срок: {selectedGuest.analytics.personalOffer.expiresLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

