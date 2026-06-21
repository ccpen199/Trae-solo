import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { studentApi, deviceApi } from '@/lib/api.ts';
import { formatMoney, formatDateTime } from '@/utils/format.ts';
import { Wallet, Droplets, MapPin, Receipt, QrCode, Bluetooth, Nfc, ChevronRight, Zap } from 'lucide-react';
import type { StudentAccount, DeviceWithDistance, WaterTransaction } from '../../../shared/types.js';

export default function StudentHome() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentAccount | null>(null);
  const [nearbyDevices, setNearbyDevices] = useState<DeviceWithDistance[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<WaterTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, txRes] = await Promise.all([
        studentApi.profile(),
        studentApi.transactions(5),
      ]);
      setProfile(profileRes);
      setRecentTransactions(txRes.transactions);

      try {
        const devices = await deviceApi.nearby(39.9087, 116.3975, 1000);
        setNearbyDevices(devices.slice(0, 4));
      } catch {
        setNearbyDevices([]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-deep-blue-700">加载中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="student">
      <div className="space-y-6">
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-aqua-400/30 to-transparent rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-graphite-500 text-sm mb-1">账户余额</p>
              <h2 className="text-4xl font-display font-bold text-gradient-aqua">
                {formatMoney(profile?.balance || 0)}
              </h2>
              <p className="text-graphite-400 text-xs mt-2">
                学号：{profile?.studentNo} · 一卡通已绑定
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-aqua-500 to-deep-blue-600 flex items-center justify-center shadow-glow-aqua">
              <Wallet size={28} className="text-white" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => navigate('/student/recharge')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-vibrant-orange-500 to-vibrant-orange-600 text-white font-medium shadow-lg hover:shadow-glow-orange hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              立即充值
            </button>
            <button
              onClick={() => navigate('/student/devices')}
              className="flex-1 py-3 rounded-xl bg-graphite-100 text-deep-blue-800 font-medium hover:bg-graphite-200 transition-all flex items-center justify-center gap-2"
            >
              <MapPin size={18} />
              附近设备
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-graphite-800">快速用水</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Nfc size={32} />, label: 'NFC感应', desc: '贴近感应区', color: 'from-deep-blue-500 to-deep-blue-700' },
              { icon: <Bluetooth size={32} />, label: '蓝牙连接', desc: '自动配对连接', color: 'from-aqua-500 to-aqua-700' },
              { icon: <QrCode size={32} />, label: '二维码', desc: '扫一扫使用', color: 'from-vibrant-orange-500 to-vibrant-orange-600' },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate('/student/devices')}
                className="group glass-card p-5 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                  {item.icon}
                </div>
                <div className="font-semibold text-graphite-800">{item.label}</div>
                <div className="text-xs text-graphite-500 mt-1">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-graphite-800">附近热水点</h3>
            <button
              onClick={() => navigate('/student/devices')}
              className="text-sm text-aqua-600 hover:text-aqua-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {nearbyDevices.length === 0 ? (
              <div className="glass-card p-6 text-center text-graphite-500 col-span-2">
                <MapPin size={32} className="mx-auto mb-2 text-graphite-300" />
                暂无附近设备，请开启定位
              </div>
            ) : (
              nearbyDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => navigate(`/student/watering/${device.id}`)}
                  className="glass-card p-4 text-left hover:shadow-lg hover:border-aqua-300 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-graphite-800 group-hover:text-deep-blue-800">{device.name}</div>
                      <div className="text-sm text-graphite-500 mt-0.5">{device.location}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                        device.status === 'online' ? 'bg-green-100 text-green-700'
                          : device.status === 'fault' ? 'bg-vibrant-orange-100 text-vibrant-orange-700'
                          : 'bg-graphite-200 text-graphite-500'
                      }`}>
                        {device.status === 'online' ? '在线' : device.status === 'fault' ? '故障' : '离线'}
                      </div>
                      <div className="text-xs text-graphite-400 mt-1">{device.distance}m</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex gap-1.5">
                      {device.connectionTypes.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-deep-blue-50 text-deep-blue-700 rounded">
                          {t === 'nfc' ? 'NFC' : t === 'bluetooth' ? '蓝牙' : '二维码'}
                        </span>
                      ))}
                    </div>
                    {device.queueCount > 0 && (
                      <div className="flex items-center gap-1 text-vibrant-orange-600">
                        <Droplets size={12} />
                        排队 {device.queueCount} 人
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-graphite-800">最近账单</h3>
            <button
              onClick={() => navigate('/student/bills')}
              className="text-sm text-aqua-600 hover:text-aqua-700 flex items-center gap-1"
            >
              全部记录 <ChevronRight size={16} />
            </button>
          </div>
          <div className="glass-card overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-graphite-500">
                <Receipt size={32} className="mx-auto mb-2 text-graphite-300" />
                暂无用水记录
              </div>
            ) : (
              <div className="divide-y divide-graphite-100">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-graphite-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-aqua-100 text-aqua-600 flex items-center justify-center">
                        <Droplets size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-graphite-800">{tx.deviceName || '热水设备'}</div>
                        <div className="text-xs text-graphite-400">{formatDateTime(tx.startTime)} · {tx.volume.toFixed(2)}L</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-vibrant-orange-600">-{formatMoney(tx.amount)}</div>
                      <div className="text-xs text-aqua-600 flex items-center gap-1">
                        {tx.syncedToCampus ? '已同步' : '同步中'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
