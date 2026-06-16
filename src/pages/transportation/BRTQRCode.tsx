import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  RefreshCw,
  Sun,
  Moon,
  Clock,
  Info,
  Bus,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import type { BRTTravelRecord } from '../../../shared/types';

export default function BRTQRCode() {
  const { user } = useAuthStore();
  const [qrData, setQrData] = useState<{ qrCode: string; expiresAt: number } | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [brightness, setBrightness] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelRecords, setTravelRecords] = useState<BRTTravelRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [showRecords, setShowRecords] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    generateQR();
    loadTravelRecords();
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
    setError(null);
    try {
      const data = await api.transportation.generateBRTQR();
      setQrData(data);
      setCountdown(60);
    } catch (e: any) {
      console.error('Failed to generate QR:', e);
      setError(e.message || '二维码生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const loadTravelRecords = async (page: number = 1) => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const data = await api.transportation.getBRTTravelRecords(page, 10);
      if (data && Array.isArray(data.records)) {
        setTravelRecords(data.records);
        setTotalRecords(data.total || 0);
        setCurrentPage(data.page || 1);
      } else {
        setTravelRecords([]);
        setTotalRecords(0);
      }
    } catch (e: any) {
      console.error('Failed to load travel records:', e);
      setRecordsError(e.message || '加载乘车记录失败');
    } finally {
      setRecordsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: '已完成', icon: CheckCircle, color: 'text-eco-600 bg-eco-100' };
      case 'in_progress':
        return { text: '进行中', icon: Clock, color: 'text-warm-600 bg-warm-100' };
      case 'refunded':
        return { text: '已退款', icon: XCircle, color: 'text-gray-600 bg-gray-100' };
      default:
        return { text: status, icon: Info, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = Math.floor((endTime - startTime) / 60000);
    return `${diff}分钟`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">BRT乘车码</h1>
          <p className="text-gray-500 mt-1">扫码进出站，便捷乘坐快速公交</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">二维码生成失败</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={generateQR}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      )}

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
                  <Bus className="w-6 h-6 text-white" />
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
                  <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-12 h-12 text-warm-400 animate-spin" />
                    <p className="text-sm text-gray-500">生成中...</p>
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
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>暗</span>
            <span>{brightness}%</span>
            <span>亮</span>
          </div>
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

        <div className="mt-6 bg-white rounded-2xl shadow-card overflow-hidden">
          <button
            onClick={() => setShowRecords(!showRecords)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Bus className="w-5 h-5 text-primary-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">乘车记录</h3>
                <p className="text-sm text-gray-500">共 {totalRecords} 条记录</p>
              </div>
            </div>
            <ChevronRight className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-200',
              showRecords && 'rotate-90'
            )} />
          </button>

          {showRecords && (
            <div className="border-t border-gray-100">
              {recordsLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">加载乘车记录中...</p>
                </div>
              ) : recordsError ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-3">{recordsError}</p>
                  <button
                    onClick={() => loadTravelRecords(1)}
                    className="text-primary-600 text-sm font-medium hover:text-primary-700"
                  >
                    点击重试
                  </button>
                </div>
              ) : travelRecords.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {travelRecords.map((record) => {
                    const statusInfo = getStatusText(record.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0">
                              <Bus className="w-5 h-5 text-warm-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-800">{record.routeName}</h4>
                                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', statusInfo.color)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{record.startStation} → {record.endStation}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(record.startTime)}
                                </span>
                                <span>
                                  时长：{calculateDuration(record.startTime, record.endTime)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">¥{record.fare.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                              <CreditCard className="w-3 h-3" />
                              {record.paymentMethod}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">暂无乘车记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
