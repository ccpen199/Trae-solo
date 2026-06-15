import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Sun, Moon, Clock, Info } from 'lucide-react';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export default function BRTQRCode() {
  const { user } = useAuthStore();
  const [qrData, setQrData] = useState<{ qrCode: string; expiresAt: number } | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [brightness, setBrightness] = useState(100);
  const [loading, setLoading] = useState(false);
  const [travelRecords, setTravelRecords] = useState<any[]>([]);

  useEffect(() => {
    generateQR();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && qrData) {
      generateQR();
    }
  }, [countdown, qrData]);

  const generateQR = async () => {
    setLoading(true);
    try {
      const data = await api.transportation.generateBRTQR();
      setQrData(data);
      setCountdown(60);
    } catch (e) {
      console.error('Failed to generate QR:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">BRT乘车码</h1>
          <p className="text-gray-500 mt-1">扫码进出站，便捷乘坐快速公交</p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div
          className="bg-gradient-to-br from-warm-400 via-warm-500 to-warm-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          style={{ filter: `brightness(${brightness}%)` }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">南宁BRT</h2>
                  <p className="text-white/70 text-xs">快速公交系统</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{user?.name}</p>
                <p className="text-white/70 text-xs">{user?.phone?.slice(0, 3)}****{user?.phone?.slice(-4)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <div className="flex items-center justify-center">
                {loading || !qrData ? (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <RefreshCw className="w-12 h-12 text-warm-400 animate-spin" />
                  </div>
                ) : (
                  <QRCodeSVG
                    value={qrData.qrCode}
                    size={192}
                    level="H"
                    includeMargin={false}
                    fgColor="#333333"
                  />
                )}
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">请将二维码对准扫码设备</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="w-4 h-4" />
                <span className="text-sm">二维码有效期</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {formatTime(countdown)}
                </span>
                <button
                  onClick={generateQR}
                  disabled={loading}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-4 h-4 text-white', loading && 'animate-spin')} />
                </button>
              </div>
            </div>

            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-warm-500" />
              <span className="font-medium text-gray-800">屏幕亮度</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBrightness(50)}
                className={cn('p-2 rounded-lg transition-colors', brightness === 50 ? 'bg-warm-100 text-warm-600' : 'text-gray-400 hover:bg-gray-100')}
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBrightness(100)}
                className={cn('p-2 rounded-lg transition-colors', brightness === 100 ? 'bg-warm-100 text-warm-600' : 'text-gray-400 hover:bg-gray-100')}
              >
                <Sun className="w-4 h-4" />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="30"
            max="150"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-warm-500"
          />
        </div>

        <div className="mt-6 bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">使用说明</p>
              <ul className="text-xs text-blue-600 mt-2 space-y-1">
                <li>• 请将二维码对准进站闸机扫码区域</li>
                <li>• 二维码每60秒自动刷新，请勿截图使用</li>
                <li>• 出站时请再次扫码，系统自动计算费用</li>
                <li>• 使用电子钱包支付，享9折优惠</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
