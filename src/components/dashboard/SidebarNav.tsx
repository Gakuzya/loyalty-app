'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Store,
  UserCheck,
  Target,
  Users,
  Settings,
} from 'lucide-react';

export const SidebarNav: React.FC = () => {
  const pathname = usePathname();

  const links = [
    {
      href: '/dashboard',
      label: 'Аналитика',
      icon: BarChart3,
      exact: true,
    },
    {
      href: '/branches',
      label: 'Филиалы сети',
      icon: Store,
      exact: false,
    },
    {
      href: '/staff',
      label: 'Персонал (Бариста)',
      icon: UserCheck,
      exact: false,
    },
    {
      href: '/kpi',
      label: 'KPI и Мотивация',
      icon: Target,
      exact: false,
    },
    {
      href: '/guests',
      label: 'База гостей',
      icon: Users,
      exact: false,
    },
    {
      href: '/settings',
      label: 'Настройки сети',
      icon: Settings,
      exact: false,
    },
  ];

  return (
    <nav className="space-y-1.5 select-none">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm shadow-amber-950/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/60 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
