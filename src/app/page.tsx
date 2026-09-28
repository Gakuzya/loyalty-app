import Link from 'next/link';
import { Coffee, QrCode, BarChart3, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a120e] via-[#0f0d0c] to-[#0a0807] flex flex-col items-center justify-center p-6 text-stone-200">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Система лояльности нового поколения
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Цифровые штампы <br />
          <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            для вашей кофейни
          </span>
        </h1>

        <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
          Замените бумажные карточки на современную веб-систему: гости получают штампы по QR-коду, бариста сканирует в один клик, а владелец видит всю аналитику.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Link
            href="/card/demo"
            className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-stone-900/80 border border-stone-800/80 hover:border-amber-500/50 hover:bg-stone-900 transition-all duration-300 shadow-lg hover:shadow-amber-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coffee className="w-6 h-6" />
            </div>
            <span className="mt-3 text-sm font-semibold text-white">Карточка гостя</span>
            <span className="text-xs text-stone-400 mt-1 text-center">Виджет 6 штампов и QR</span>
          </Link>

          <Link
            href="/scan"
            className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-stone-900/80 border border-stone-800/80 hover:border-amber-500/50 hover:bg-stone-900 transition-all duration-300 shadow-lg hover:shadow-amber-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="mt-3 text-sm font-semibold text-white">Экран бариста</span>
            <span className="text-xs text-stone-400 mt-1 text-center">Сканер и начисление</span>
          </Link>

          <Link
            href="/dashboard"
            className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-stone-900/80 border border-stone-800/80 hover:border-amber-500/50 hover:bg-stone-900 transition-all duration-300 shadow-lg hover:shadow-amber-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="mt-3 text-sm font-semibold text-white">Дашборд</span>
            <span className="text-xs text-stone-400 mt-1 text-center">Аналитика и гости</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
