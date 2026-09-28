import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BranchForm } from '@/components/dashboard/BranchForm';
import {
  Store,
  MapPin,
  Users,
  ExternalLink,
  QrCode,
  Coffee,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default async function BranchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Получаем сеть текущего владельца
  let network = await prisma.network.findUnique({
    where: { ownerId: user.id },
    include: {
      branches: {
        include: {
          staff: true,
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  });

  if (!network) {
    network = await prisma.network.create({
      data: {
        ownerId: user.id,
        name: 'Моя Сеть Кофеен',
        targetStamps: 6,
        rewardTitle: 'Бесплатный кофе',
        branches: {
          create: {
            name: 'Главный филиал',
            slug: `main-${user.id.slice(0, 6)}`,
            address: 'ул. Центральная, 1',
          },
        },
      },
      include: {
        branches: {
          include: {
            staff: true,
            _count: {
              select: {
                transactions: true,
              },
            },
          },
        },
      },
    });
  }

  return (
    <div className="space-y-6 select-none">
      {/* Заголовок */}
      <div className="pb-4 border-b border-stone-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1.5">
          <Store className="w-3.5 h-3.5" />
          Мульти-филиальность
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Филиалы сети «{network.name}»
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
          Управляйте точками вашей сети, настраивайте уникальные ссылки и привязывайте персонал
        </p>
      </div>

      {/* Форма добавления филиала */}
      <BranchForm />

      {/* Список существующих филиалов */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
          Действующие филиалы ({network.branches.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {network.branches.map((branch) => (
            <div
              key={branch.id}
              className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4 hover:border-amber-500/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Store className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {branch.name}
                    </h3>
                    {branch.address && (
                      <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-500" />
                        <span>{branch.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  /card/{branch.slug}
                </span>
              </div>

              {/* Метрики филиала */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800/60 text-xs">
                <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-stone-400" />
                  <div>
                    <span className="text-stone-400 text-[10px] block">Сотрудники</span>
                    <span className="font-bold text-white">{branch.staff.length} бариста</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-stone-400 text-[10px] block">Транзакции</span>
                    <span className="font-bold text-white">{branch._count.transactions} операций</span>
                  </div>
                </div>
              </div>

              {/* Быстрые действия */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <Link
                  href={`/card/${branch.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
                >
                  <span>Карта гостя</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <Link
                  href="/scan"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold transition-all"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Терминал кассы</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
