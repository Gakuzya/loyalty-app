'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef<boolean>(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Ошибка остановки камеры:', err);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    setIsInitializing(true);
    setScannerError(null);
    hasScannedRef.current = false;

    try {
      // Инициализируем Html5Qrcode на контейнере 'qr-reader'
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await scannerRef.current.start(
        { facingMode: 'environment' }, // Задняя камера смартфона
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
            return {
              width: Math.floor(edge),
              height: Math.floor(edge),
            };
          },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Защита от повторного вызова
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          // Останавливаем камеру и вызываем callback
          await stopScanner();
          setIsScanning(false);
          onScan(decodedText);
        },
        () => {
          // Кадр без QR-кода — пропускаем
        }
      );

      setIsScanning(true);
      setIsInitializing(false);
    } catch (err: unknown) {
      console.error('Ошибка запуска камеры:', err);
      setIsInitializing(false);
      setIsScanning(false);

      const errorMessage =
        err instanceof Error ? err.message : String(err);

      if (
        errorMessage.includes('NotAllowedError') ||
        errorMessage.includes('Permission')
      ) {
        setScannerError(
          'Доступ к камере заблокирован в настройках браузера. Разрешите доступ, чтобы сканировать QR-коды.'
        );
      } else if (
        errorMessage.includes('NotFoundError') ||
        errorMessage.includes('device')
      ) {
        setScannerError(
          'Камера не обнаружена на данном устройстве. Вы можете ввести код вручную.'
        );
      } else {
        setScannerError(
          'Не удалось запустить камеру. Проверьте разрешения в браузере.'
        );
      }
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center select-none">
      {/* Контейнер видеокамеры со скруглением и рамкой */}
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-stone-950 border-2 border-stone-800 shadow-2xl flex items-center justify-center">
        {/* Контейнер для html5-qrcode video */}
        <div id="qr-reader" className="w-full h-full object-cover" />

        {/* Стилистический оверлей видоискателя с прицелом */}
        {isScanning && !scannerError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Затемнение по краям */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

            {/* Прозрачное окно видоискателя */}
            <div className="relative w-64 h-64 rounded-3xl border-2 border-amber-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden">
              {/* Угловые маркеры прицела */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

              {/* Бегущий лазерный луч сканирования */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-[bounce_2.5s_infinite]" />
            </div>

            <span className="absolute bottom-5 text-xs font-semibold text-amber-300/90 tracking-wide bg-stone-950/80 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-md">
              Наведите камеру на QR-код гостя
            </span>
          </div>
        )}

        {/* Состояние загрузки / инициализации */}
        {isInitializing && !scannerError && (
          <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center gap-3 text-stone-400 z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Запуск камеры...</span>
          </div>
        )}

        {/* Состояние ошибки (нет камеры / заблокирован доступ) */}
        {scannerError && (
          <div className="absolute inset-0 bg-stone-950/95 p-6 flex flex-col items-center justify-center text-center gap-3 z-20">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <CameraOff className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Камера недоступна</h3>
            <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
              {scannerError}
            </p>
            <button
              onClick={startScanner}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Попробовать снова</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
