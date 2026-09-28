import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StaffForm } from '@/components/dashboard/StaffForm';
import {
  Users,
  Store,
  Coffee,
  Mail,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export default async function StaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Находим сеть текущего владельца с филиалами и сотрудниками
  let network = await prisma.network.findUnique({
    where: { ownerId: user.id },
    include: {
      branches: {
        include: {
          staff: {
            include: {
              _count: {
                select: {
                  stampsGiven: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!network) {
    redirect('/branches');
  }

  // Собираем всех сотрудников из всех филиалов сети
  const allStaff = network.branches.flatMap((branch) =>
    branch.staff.map((s) => ({
      ...s,
      branchName: branch.name,
      branchSlug: branch.slug,
    }))
  );

  return (
    <div className="space-y-6 select-none">
      {/* Заголовок */}
      <div className="pb-4 border-b border-stone-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1.5">
          <Users className="w-3.5 h-3.5" />
          Персонал сети
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Управление бариста
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
          Приглашайте сотрудников, привязывайте их к кассовым терминалам филиалов и отслеживайте их эффективность
        </p>
      </div>

      {/* Форма добавления сотрудника */}
      <StaffForm
        branches={network.branches.map((b) => ({
          id: b.id,
          name: b.name,
        }))}
      />

      {/* Таблица сотрудников */}
      <div className="rounded-3xl bg-stone-900/80 border border-stone-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Штат сотрудников ({allStaff.length})</span>
          </h2>
          <span className="text-xs text-stone-400">Роль: BARISTA</span>
        </div>

        {allStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/60 text-stone-400 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-5">Сотрудник</th>
                  <th className="py-3 px-5">Филиал работы</th>
                  <th className="py-3 px-5 text-center">Выдано штампов</th>
                  <th className="py-3 px-5 text-right">Дата добавления</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 font-medium">
                {allStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-stone-850/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-xs">
                          {staff.name?.charAt(0) || 'B'}
                        </div>
                        <div>
                          <span className="font-bold text-white block">
                            {staff.name || 'Бариста'}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {staff.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-stone-200">
                        <Store className="w-3.5 h-3.5 text-amber-500" />
                        <span>{staff.branchName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                        <Coffee className="w-3.5 h-3.5" />
                        <span>{staff._count.stampsGiven}</span>
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right text-stone-400 font-mono text-[11px]">
                      {new Date(staff.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">В сети пока нет сотрудников</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Укажите email вашего бариста в форме выше, чтобы дать ему доступ к кассовому терминалу.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
