'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface HourlyDataPoint {
  hour: string; // "08:00"
  stamps: number; // 12
}

interface HourlyChartProps {
  data: HourlyDataPoint[];
}

export const HourlyChart: React.FC<HourlyChartProps> = ({ data }) => {
  // Находим максимальное значение для подсветки пиковых часов
  const maxStamps = Math.max(...data.map((d) => d.stamps), 1);

  return (
    <div className="w-full h-[320px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.5} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#292524"
            vertical={false}
          />

          <XAxis
            dataKey="hour"
            stroke="#78716c"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#292524' }}
            interval={2}
          />

          <YAxis
            stroke="#78716c"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />

          <Tooltip
            cursor={{ fill: 'rgba(245, 158, 11, 0.06)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as HourlyDataPoint;
                return (
                  <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl backdrop-blur-md">
                    <p className="text-[11px] font-semibold text-stone-400 mb-1">
                      Время: {item.hour}
                    </p>
                    <p className="text-sm font-extrabold text-amber-400 flex items-center gap-1.5">
                      <span>{item.stamps}</span>
                      <span className="text-xs text-stone-300 font-normal">
                        {item.stamps === 1
                          ? 'выданный штамп'
                          : item.stamps >= 2 && item.stamps <= 4
                          ? 'выданных штампа'
                          : 'выданных штампов'}
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar
            dataKey="stamps"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            animationDuration={800}
          >
            {data.map((entry, index) => {
              const isPeak = entry.stamps === maxStamps && entry.stamps > 0;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isPeak ? 'url(#peakGradient)' : 'url(#barGradient)'}
                  stroke={isPeak ? '#fbbf24' : 'transparent'}
                  strokeWidth={isPeak ? 1 : 0}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
