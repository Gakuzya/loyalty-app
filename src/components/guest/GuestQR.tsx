'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, ShieldCheck } from 'lucide-react';

interface GuestQRProps {
  qrToken: string;
  shopName: string;
}

export const GuestQR: React.FC<GuestQRProps> = ({ qrToken, shopName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center p-5 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl relative overflow-hidden text-center">
      {/* Мягкий градиент на фоне */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700/60 text-stone-300 text-[11px] font-medium mb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        Личный QR-код гостя
      </div>

      {/* Белая плашка с QR кодом для максимального контраста и мгновенного считывания камерой */}
      <div className="p-4 bg-white rounded-2xl shadow-xl shadow-black/40 ring-4 ring-amber-500/20 mb-4 transition-transform hover:scale-105">
        <QRCodeSVG
          value={qrToken}
          size={180}
          level="H"
          includeMargin={false}
        />
      </div>

      <p className="text-xs text-stone-300 font-medium max-w-xs">
        Покажите этот код бариста в <span className="text-amber-400 font-semibold">{shopName}</span> для начисления штампа
      </p>

      {/* Код буквами/цифрами на случай, если камера бариста повреждена */}
      <div className="mt-4 pt-3 border-t border-stone-800/80 w-full flex items-center justify-between text-xs text-stone-400">
        <span className="font-mono text-[11px] truncate max-w-[170px] select-all">
          {qrToken}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors text-[11px] font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Скопировано</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-stone-400" />
              <span>Код</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
