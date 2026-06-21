import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { deviceApi, transactionApi, studentApi } from '@/lib/api.ts';
import { formatMoney, formatDuration, formatDateTime } from '@/utils/format.ts';
import { ArrowLeft, Droplets, Clock, MapPin, Nfc, Bluetooth, QrCode, StopCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import type { Device, WaterTransaction, StudentAccount, ConnectionType } from '../../../shared/types.js';

export default function StudentWatering() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<Device | null>(null);
  const [profile, setProfile] = useState<StudentAccount | null>(null);
  const [transaction, setTransaction] = useState<WaterTransaction | null>(null);
  const [phase, setPhase] = useState<'connecting' | 'ready' | 'watering' | 'finished'>('connecting');
  const [volume, setVolume] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const volumeRef = useRef<number | null>(null);

  const WATER_PRICE = 0.08;
  const amount = Number((volume * WATER_PRICE).toFixed(2));

  useEffect(() => {
    if (!deviceId) return;
    (async () => {
      try {
        const [d, p] = await Promise.all([deviceApi.getById(deviceId), studentApi.profile()]);
        setDevice(d);
        setProfile(p);
        setTimeout(() => setPhase('ready'), 1200);
      } catch {
        navigate('/student/devices');
      }
    })();
  }, [deviceId, navigate]);

  const startWatering = async () => {
    if (!deviceId) return;
    try {
      const tx = await transactionApi.start(deviceId);
      setTransaction(tx);
      setPhase('watering');
      setVolume(0);
      setElapsed(0);

      const startTime = Date.now();
      intervalRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 100);

      volumeRef.current = window.setInterval(() => {
        setVolume((prev) => {
          const next = Number((prev + Math.random() * 0.3 + 0.1).toFixed(2));
          if (transaction) {
            transactionApi.update(transaction.id, next).catch(() => {});
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      alert(err.message || '启动失败');
    }
  };

  const stopWatering = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (volumeRef.current) clearInterval(volumeRef.current);
    if (transaction) {
      const finalTx = await transactionApi.end(transaction.id, volume, deviceId);
      setTransaction(finalTx);
    }
    setPhase('finished');
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (volumeRef.current) clearInterval(volumeRef.current);
    };
  }, []);

  if (!device || !profile) {
    return (
      <AppLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-deep-blue-700">连接设备中...</div>
        </div>
      </AppLayout>
    );
  }

  const renderConnectionLabel = (t: ConnectionType) => {
    const icon = t === 'nfc' ? <Nfc size={14} /> : t === 'bluetooth' ? <Bluetooth size={14} /> : <QrCode size={14} />;
    const label = t === 'nfc' ? 'NFC' : t === 'bluetooth' ? '蓝牙' : '二维码';
    return (
      <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-deep-blue-50 text-deep-blue-700 text-xs font-medium">
        {icon}{label}
      </span>
    );
  };

  return (
    <AppLayout role="student">
      <div className="space-y-6 max-w-2xl mx-auto">
        <button onClick={() => navigate('/student/devices')} className="flex items-center gap-2 text-graphite-600 hover:text-deep-blue-700 transition-colors">
          <ArrowLeft size={20} />返回设备列表
        </button>

        <div className="glass-card p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-display font-bold text-graphite-800">{device.name}</h2>
              <p className="text-sm text-graphite-500 flex items-center gap-1 mt-1"><MapPin size={14} />{device.location}</p>
            </div>
            <div className="flex gap-1.5">{device.connectionTypes.map(renderConnectionLabel)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-aqua-50 to-deep-blue-50">
              <p className="text-sm text-graphite-500">账户余额</p>
              <p className="text-2xl font-bold text-deep-blue-800">{formatMoney(profile.balance)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-vibrant-orange-50 to-vibrant-orange-100">
              <p className="text-sm text-graphite-500">水价</p>
              <p className="text-2xl font-bold text-vibrant-orange-600">{formatMoney(WATER_PRICE)}<span className="text-sm font-normal">/L</span></p>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 bg-gradient-to-br from-deep-blue-800 via-deep-blue-900 to-aqua-700 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-aqua-400/30 animate-float" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-aqua-400/30 animate-float" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative text-center">
            {phase === 'connecting' && (
              <div className="py-8">
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-aqua-400/30 animate-pulse" />
                  <div className="absolute inset-2 rounded-full border-4 border-aqua-400/50 animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute inset-4 rounded-full border-4 border-aqua-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Droplets size={48} className="text-aqua-300" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">正在连接设备...</h3>
                <p className="text-aqua-200/80 text-sm mt-2">请保持手机靠近设备感应区</p>
              </div>
            )}
            {phase === 'ready' && (
              <div className="py-4">
                <div className="w-32 h-32 mx-auto mb-6 relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-aqua-400/20 animate-ripple" />
                  <div className="absolute inset-0 rounded-full bg-aqua-400/10 animate-ripple" style={{ animationDelay: '0.5s' }} />
                  <div className="relative w-28 h-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Droplets size={56} className="text-aqua-300 animate-float" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">设备已就绪</h3>
                <p className="text-aqua-200/80 mb-6">点击下方按钮开始用水</p>
                <button onClick={startWatering} className="px-10 py-4 rounded-full bg-gradient-to-r from-aqua-400 to-aqua-500 text-deep-blue-900 font-bold text-lg shadow-2xl shadow-aqua-500/50 hover:shadow-aqua-400/70 hover:scale-105 active:scale-100 transition-all duration-300">
                  开始用水
                </button>
              </div>
            )}
            {phase === 'watering' && (
              <div className="py-4">
                <div className="mb-6">
                  <div className="text-6xl font-display font-bold mb-2 bg-gradient-to-r from-aqua-200 to-white bg-clip-text text-transparent">
                    {volume.toFixed(2)}<span className="text-2xl"> L</span>
                  </div>
                  <p className="text-aqua-200/80 text-sm">当前用水量</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <Clock size={18} className="mx-auto mb-1 text-aqua-300" />
                    <div className="text-2xl font-bold">{formatDuration(elapsed)}</div>
                    <div className="text-xs text-aqua-200/70">已用时长</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <Droplets size={18} className="mx-auto mb-1 text-vibrant-orange-300" />
                    <div className="text-2xl font-bold">{formatMoney(amount)}</div>
                    <div className="text-xs text-aqua-200/70">预计费用</div>
                  </div>
                </div>
                <button onClick={stopWatering} className="px-10 py-4 rounded-full bg-gradient-to-r from-vibrant-orange-500 to-vibrant-orange-600 text-white font-bold text-lg shadow-2xl shadow-vibrant-orange-500/50 hover:scale-105 active:scale-100 transition-all flex items-center justify-center gap-2 mx-auto">
                  <StopCircle size={22} />结束用水
                </button>
              </div>
            )}
            {phase === 'finished' && transaction && (
              <div className="py-4">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={56} className="text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-6">用水已完成</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-xs text-aqua-200/70 mb-1">用水量</p>
                    <p className="text-xl font-bold">{volume.toFixed(2)}L</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-xs text-aqua-200/70 mb-1">费用</p>
                    <p className="text-xl font-bold text-vibrant-orange-300">{formatMoney(amount)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-xs text-aqua-200/70 mb-1">用时</p>
                    <p className="text-xl font-bold">{formatDuration(elapsed)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-xs text-aqua-200/70 mb-1">结束时间</p>
                    <p className="text-sm font-bold">{formatDateTime(Date.now()).slice(11)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-aqua-200/80 text-xs mb-6">
                  <ShieldCheck size={16} />账单已生成 · 已同步至校园一卡通
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate('/student/bills')} className="flex-1 py-3 rounded-full bg-white/15 backdrop-blur-sm text-white font-medium hover:bg-white/25 transition-all">查看账单</button>
                  <button onClick={() => navigate('/student')} className="flex-1 py-3 rounded-full bg-gradient-to-r from-aqua-400 to-aqua-500 text-deep-blue-900 font-bold hover:scale-105 transition-transform">返回首页</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {transaction && phase === 'finished' && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between text-xs text-graphite-500 mb-2">
              <span>交易哈希 (SHA-256)</span>
              <ShieldCheck size={14} className="text-green-600" />
            </div>
            <code className="text-xs text-graphite-600 break-all bg-graphite-50 p-2 rounded-lg font-mono block">
              {transaction.hash.slice(0, 32)}...
            </code>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
