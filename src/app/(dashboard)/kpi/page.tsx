import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KpiForm } from '@/components/dashboard/KpiForm';
import {
  Target,
  Award,
  TrendingUp,
  Users,
  Coffee,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default async function KpiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Находим сеть текущего владельца
  const network = await prisma.network.findUnique({
    where: { ownerId: user.id },
    include: {
      branches: {
        include: {
          staff: true,
        },
      },
      kpiTargets: {
        orderBy: {
          activeMonth: 'desc',
        },
      },
    },
  });

  if (!network) {
    redirect('/branches');
  }

  // Начало текущего месяца
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Активная цель на этот месяц
  const currentKpi = network.kpiTargets[0] || null;

  // Собираем всех бариста сети
  const allStaff = network.branches.flatMap((b) =>
    b.staff.map((s) => ({ ...s, branchName: b.name }))
  );

  // Для каждого сотрудника считаем количество штампов, выданных в этом месяце
  const staffWithProgress = await Promise.all(
    allStaff.map(async (barista) => {
      const monthStamps = await prisma.transaction.count({
        where: {
          baristaId: barista.id,
          type: 'EARN_STAMP',
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      const target = currentKpi ? currentKpi.targetCount : 500;
      const percent = Math.min(100, Math.round((monthStamps / target) * 100));

      return {
        ...barista,
        monthStamps,
        percent,
        target,
        completed: monthStamps >= target,
      };
    })
  );

  staffWithProgress.sort((a, b) => b.monthStamps - a.monthStamps);

  return (
    <div className="space-y-6 select-none">
      {/* Заголовок */}
      <div className="pb-4 border-b border-stone-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1.5">
          <Target className="w-3.5 h-3.5" />
          Мотивация команды
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          KPI и Премии персонала
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
          Устанавливайте ежемесячные цели по выдаче штампов и мотивируйте бариста премиями за привлечение гостей
        </p>
      </div>

      {/* Форма добавления цели */}
      <KpiForm />

      {/* Текущая активная цель месяца */}
      {currentKpi ? (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-600/10 to-stone-900 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  Цель текущего месяца
                </span>
                <span className="text-xs text-stone-400">
                  {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">{currentKpi.title}</h2>
              <p className="text-xs text-stone-300">
                Целевой показатель: <strong className="text-amber-400 font-mono">{currentKpi.targetCount} штампов</strong> на сотрудника
              </p>
            </div>

            <div className="px-5 py-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center gap-3 shrink-0">
              <Award className="w-6 h-6 text-amber-400" />
              <div>
                <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider block">
                  Премия бариста
                </span>
                <span className="text-base font-black text-white">
                  {currentKpi.reward}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 text-center text-xs text-stone-400">
          Активная цель на этот месяц еще не установлена. Задайте цель в форме выше!
        </div>
      )}

      {/* Рейтинг бариста по выполнению KPI */}
      <div className="rounded-3xl bg-stone-900/80 border border-stone-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Рейтинг выполнения KPI бариста в этом месяце</span>
          </h2>
          <span className="text-xs text-stone-400">Живой прогресс</span>
        </div>

        {staffWithProgress.length > 0 ? (
          <div className="divide-y divide-stone-800/80 p-2">
            {staffWithProgress.map((staff, idx) => (
              <div
                key={staff.id}
                className="p-4 rounded-2xl hover:bg-stone-850/50 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {staff.name || 'Бариста'}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {staff.branchName} • {staff.email}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-white block">
                      {staff.monthStamps} / {staff.target} штампов
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        staff.completed ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {staff.completed ? '🎉 KPI ВЫПОЛНЕН!' : `${staff.percent}% выполнено`}
                    </span>
                  </div>
                </div>

                {/* Прогресс-бар выполнения */}
                <div className="w-full h-2 rounded-full bg-stone-950 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      staff.completed
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    }`}
                    style={{ width: `${staff.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-stone-500">
            В сети пока нет сотрудников. Добавьте бариста в разделе «Персонал»!
          </div>
        )}
      </div>
    </div>
  );
}
