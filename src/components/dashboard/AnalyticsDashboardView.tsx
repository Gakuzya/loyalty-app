'use client';

import React, { useState, useMemo } from 'react';
import { HourlyChart } from './HourlyChart';
import {
  Coffee,
  Gift,
  Users,
  Award,
  Clock,
  TrendingUp,
  Calendar,
  Sparkles,
  Zap,
  ArrowUpRight,
  Filter,
  UserCheck,
  Building2,
  CalendarDays,
} from 'lucide-react';

export interface TransactionItem {
  id: string;
  type: 'EARN_STAMP' | 'REDEEM_REWARD';
  createdAt: string;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    tier: string;
  };
  barista?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  branch?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface AnalyticsDashboardViewProps {
  networkName: string;
  branchesCount: number;
  targetStamps: number;
  rewardTitle: string;
  transactions: TransactionItem[];
}

type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'all' | 'custom';

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  networkName,
  branchesCount,
  targetStamps,
  rewardTitle,
  transactions,
}) => {
  const [period, setPeriod] = useState<PeriodType>('all');
  const [customDate, setCustomDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EARN_STAMP' | 'REDEEM_REWARD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрация транзакций по выбранному периоду
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);

      if (period === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return txDate >= startOfToday;
      }

      if (period === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= sevenDaysAgo;
      }

      if (period === 'month') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return txDate >= thirtyDaysAgo;
      }

      if (period === 'quarter') {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return txDate >= ninetyDaysAgo;
      }

      if (period === 'custom') {
        const txDateStr = txDate.toISOString().split('T')[0];
        return txDateStr === customDate;
      }

      // 'all'
      return true;
    });
  }, [transactions, period, customDate]);

  // Расчет KPI показателей за выбранный период
  const stats = useMemo(() => {
    let stamps = 0;
    let rewards = 0;
    const customerVisits = new Map<string, number>();
    const customerStamps = new Map<string, number>();

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'EARN_STAMP') {
        stamps++;
        customerStamps.set(
          tx.customer.id,
          (customerStamps.get(tx.customer.id) || 0) + 1
        );
      } else if (tx.type === 'REDEEM_REWARD') {
        rewards++;
      }

      customerVisits.set(
        tx.customer.id,
        (customerVisits.get(tx.customer.id) || 0) + 1
      );
    });

    const uniqueGuests = customerVisits.size;
    const repeatGuests = Array.from(customerVisits.values()).filter(
      (c) => c >= 2
    ).length;
    const retention =
      uniqueGuests > 0 ? Math.round((repeatGuests / uniqueGuests) * 100) : 0;

    return {
      stamps,
      rewards,
      uniqueGuests,
      repeatGuests,
      retention,
    };
  }, [filteredTransactions]);

  // Почасовые данные для графика
  const hourlyData = useMemo(() => {
    const hourlyMap: { [hour: number]: number } = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = 0;
    }

    filteredTransactions
      .filter((tx) => tx.type === 'EARN_STAMP')
      .forEach((tx) => {
        const hour = new Date(tx.createdAt).getHours();
        hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
      });

    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      stamps: hourlyMap[h],
    }));
  }, [filteredTransactions]);

  // Прогноз притока посетителей (AI Traffic Forecast) на основе исторической статистики
  const trafficForecast = useMemo(() => {
    // Считаем активность по 3 ключевым интервалам:
    // Утро: 08:00 - 11:00
    // Обед: 12:00 - 15:00
    // Вечер: 17:00 - 20:00
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;

    transactions
      .filter((tx) => tx.type === 'EARN_STAMP')
      .forEach((tx) => {
        const h = new Date(tx.createdAt).getHours();
        if (h >= 8 && h < 11) morningCount++;
        else if (h >= 12 && h < 15) afternoonCount++;
        else if (h >= 17 && h < 20) eveningCount++;
      });

    const total = Math.max(1, morningCount + afternoonCount + eveningCount);
    const morningPercent = Math.min(95, Math.max(30, Math.round((morningCount / total) * 100) + 35));
    const afternoonPercent = Math.min(90, Math.max(25, Math.round((afternoonCount / total) * 100) + 25));
    const eveningPercent = Math.min(85, Math.max(20, Math.round((eveningCount / total) * 100) + 20));

    // Находим пиковый час
    const hourCounts: { [h: number]: number } = {};
    for (let h = 0; h < 24; h++) hourCounts[h] = 0;
    transactions.forEach((tx) => {
      const h = new Date(tx.createdAt).getHours();
      hourCounts[h]++;
    });

    let peakHour = 9;
    let maxHourCount = 0;
    for (let h = 8; h <= 21; h++) {
      if (hourCounts[h] > maxHourCount) {
        maxHourCount = hourCounts[h];
        peakHour = h;
      }
    }

    // Гости, которые близки к бесплатному напитку (5 из 6 штампов)
    const guestStampsMap = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.type === 'EARN_STAMP') {
        guestStampsMap.set(
          tx.customer.id,
          (guestStampsMap.get(tx.customer.id) || 0) + 1
        );
      }
    });

    const closeToRewardCount = Array.from(guestStampsMap.values()).filter(
      (s) => s % targetStamps === targetStamps - 1
    ).length;

    return {
      peakHourTime: `${String(peakHour).padStart(2, '0')}:00 - ${String(peakHour + 1).padStart(2, '0')}:00`,
      morningPercent,
      afternoonPercent,
      eveningPercent,
      closeToRewardCount,
    };
  }, [transactions, targetStamps]);

  // Фильтрация детального журнала операций
  const displayedTransactions = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const customerName = tx.customer.name?.toLowerCase() || '';
        const customerEmail = tx.customer.email?.toLowerCase() || '';
        const baristaName = tx.barista?.name?.toLowerCase() || '';
        const branchName = tx.branch?.name.toLowerCase() || '';
        return (
          customerName.includes(query) ||
          customerEmail.includes(query) ||
          baristaName.includes(query) ||
          branchName.includes(query)
        );
      }

      return true;
    });
  }, [filteredTransactions, typeFilter, searchQuery]);

  return (
    <div className="space-y-6 select-none">
      {/* Шапка и переключатель периодов */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Управление и аналитика
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {networkName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
            Филиалов: {branchesCount} • Цель: {targetStamps} штампов ({rewardTitle})
          </p>
        </div>

        {/* ПЕРЕКЛЮЧАТЕЛЬ ПЕРИОДОВ: Дни, Недели, Месяцы, Кварталы, Календарь */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
          <button
            type="button"
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              period === 'today'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Сегодня
          </button>
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              period === 'week'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            7 дней
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              period === 'month'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            30 дней
          </button>
          <button
            type="button"
            onClick={() => setPeriod('quarter')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              period === 'quarter'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Квартал
          </button>
          <button
            type="button"
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              period === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Все время
          </button>

          {/* ВЫБОР КОНКРЕТНОЙ ДАТЫ */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-800">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setPeriod('custom');
              }}
              className={`px-2 py-1 rounded-xl text-xs font-mono outline-none border transition-all cursor-pointer ${
                period === 'custom'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
              }`}
            />
          </div>
        </div>
      </div>

      {/* KPI КАРТОЧКИ ЗА ВЫБРАННЫЙ ПЕРИОД */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Карточка 1: Выдано штампов */}
        <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Выдано штампов
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Coffee className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white tracking-tight">
              {stats.stamps}
            </span>
            <span className="text-xs text-stone-500 ml-1.5 font-medium">
              за выбранный период
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Активность гостей</span>
          </div>
        </div>

        {/* Карточка 2: Выдано подарков */}
        <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Выдано призов
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Gift className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-400 tracking-tight">
              {stats.rewards}
            </span>
            <span className="text-xs text-stone-500 ml-1.5 font-medium">
              бесплатных напитков
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-stone-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Награжденные постоянные гости</span>
          </div>
        </div>

        {/* Карточка 3: Уникальные гости */}
        <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Активные гости
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white tracking-tight">
              {stats.uniqueGuests}
            </span>
            <span className="text-xs text-stone-500 ml-1.5 font-medium">
              уникальных посетителей
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Охват за период</span>
          </div>
        </div>

        {/* Карточка 4: Retention */}
        <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Удержание (Retention)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-400 tracking-tight">
              {stats.retention}%
            </span>
            <span className="text-xs text-stone-500 ml-1.5 font-medium">
              повторных визитов
            </span>
          </div>
          <div className="mt-2.5 text-xs text-stone-400">
            {stats.repeatGuests} из {stats.uniqueGuests || 0} вернулись повторно
          </div>
        </div>
      </div>

      {/* БЛОК: ИНТЕЛЛЕКТУАЛЬНЫЙ ПРОГНОЗ ПРИТОКА ПОСЕТИТЕЛЕЙ (AI TRAFFIC FORECAST) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-stone-900/90 via-[#181412] to-stone-900/90 border border-amber-500/25 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>Умный прогноз притока посетителей</span>
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Пиковые часы и планирование загрузки персонала
            </h2>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Главный пик сети: <strong>{trafficForecast.peakHourTime}</strong></span>
          </div>
        </div>

        {/* Карточки 3 ключевых интервалов дня */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Утренний кофе-пик */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>Утренний раш (08:00–11:00)</span>
              </span>
              <span className="text-xs font-bold text-amber-400">
                {trafficForecast.morningPercent}% загрузка
              </span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${trafficForecast.morningPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-400">
              Высокая проходимость: спешащие на работу. Рекомендуется 2 бариста на эспрессо-баре.
            </p>
          </div>

          {/* Обеденный поток */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                <span>Бизнес-ланч (12:00–15:00)</span>
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {trafficForecast.afternoonPercent}% загрузка
              </span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${trafficForecast.afternoonPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-400">
              Стабильный приток с выпечкой и десертами. 1-2 бариста справляются оптимально.
            </p>
          </div>

          {/* Вечерний релакс */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Вечерний отдых (17:00–20:00)</span>
              </span>
              <span className="text-xs font-bold text-sky-400">
                {trafficForecast.eveningPercent}% загрузка
              </span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${trafficForecast.eveningPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-400">
              Гости в зале, авторские напитки и чай. Достаточно 1 бариста.
            </p>
          </div>
        </div>

        {/* Уведомление о скорых выдачах бесплатных напитков */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-xs text-stone-300">
              <strong>{trafficForecast.closeToRewardCount} гостей</strong> сейчас имеют {targetStamps - 1} из {targetStamps} штампов и придут за подарком в ближайшие дни.
            </span>
          </div>
          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider shrink-0">
            Готовность складов
          </span>
        </div>
      </div>

      {/* Почасовой график активности за выбранный период */}
      <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Почасовая активность выдачи штампов ({period === 'custom' ? customDate : period})</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Аналитика визитов по 24 часовым интервалам (00:00 - 23:00)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span>Штампы за час</span>
            </div>
          </div>
        </div>

        <HourlyChart data={hourlyData} />
      </div>

      {/* ДЕТАЛЬНЫЙ ЖУРНАЛ ОПЕРАЦИЙ ЗА ВЫБРАННЫЙ ПЕРИОД */}
      <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Журнал операций за выбранный период</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Всего записей: {displayedTransactions.length}
            </p>
          </div>

          {/* Фильтры и поиск */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Поиск */}
            <input
              type="text"
              placeholder="Поиск по гостю, баристе или филиалу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-500"
            />

            {/* Фильтр типа операции */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-950 border border-stone-800">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('EARN_STAMP')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'EARN_STAMP'
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Штампы
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('REDEEM_REWARD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'REDEEM_REWARD'
                    ? 'bg-emerald-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Призы
              </button>
            </div>
          </div>
        </div>

        {/* Таблица транзакций */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Дата и время</th>
                <th className="py-3 px-3">Операция</th>
                <th className="py-3 px-3">Гость</th>
                <th className="py-3 px-3">Бариста</th>
                <th className="py-3 px-3">Филиал</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-200">
              {displayedTransactions.length > 0 ? (
                displayedTransactions.slice(0, 50).map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-850/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-stone-400">
                      {new Date(tx.createdAt).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}{' '}
                      {new Date(tx.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          tx.type === 'EARN_STAMP'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {tx.type === 'EARN_STAMP' ? (
                          <>
                            <Coffee className="w-3 h-3" />
                            <span>+1 Штамп</span>
                          </>
                        ) : (
                          <>
                            <Gift className="w-3 h-3" />
                            <span>Бесплатный напиток</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">
                        {tx.customer.name || 'Гость кофейни'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {tx.customer.email || 'ID: ' + tx.customer.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-300">
                      {tx.barista?.name ? (
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>{tx.barista.name}</span>
                        </span>
                      ) : (
                        <span className="text-stone-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-stone-400">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-stone-500" />
                        <span>{tx.branch?.name || 'Главный'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-500 text-xs">
                    За выбранный период операций не найдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
