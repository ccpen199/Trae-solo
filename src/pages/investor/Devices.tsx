import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { investorApi } from '@/lib/api.ts';
import { formatMoney, formatVolume, formatDateTime } from '@/utils/format.ts';
import { Cpu, Wifi, WifiOff, AlertTriangle, MapPin, Nfc, Bluetooth, QrCode, BarChart3, FileText, ChevronRight } from 'lucide-react';
import type { Device, DeviceStatus, ConnectionType } from '../../../shared/types.js';

export default function InvestorDevices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filter, setFilter] = useState<DeviceStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await investorApi.devices();
        setDevices(result);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredDevices = devices.filter((d) => filter === 'all' || d.status === filter);

  const getStatusStyle = (status: DeviceStatus) => {
    switch (status) {
      case 'online': return { bg: 'bg-green-100', text: 'text-green-700', label: '在线', dot: 'bg-green-500' };
      case 'fault': return { bg: 'bg-vibrant-orange-100', text: 'text-vibrant-orange-700', label: '故障', dot: 'bg-vibrant-orange-500' };
      case 'offline': return { bg: 'bg-graphite-200', text: 'text-graphite-500', label: '离线', dot: 'bg-graphite-400' };
    }
  };

  const renderConnIcon = (t: ConnectionType) => {
    if (t === 'nfc') return <Nfc size={14} />;
    if (t === 'bluetooth') return <Bluetooth size={14} />;
    return <QrCode size={14} />;
  };
  const renderConnLabel = (t: ConnectionType) => (t === 'nfc' ? 'NFC' : t === 'bluetooth' ? '蓝牙' : '二维码');

  return (
    <AppLayout role="investor">
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-graphite-800">设备管理</h2>
            <p className="text-sm text-graphite-500 mt-1">管理所有接入的智能用水终端设备</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '全部', key: 'all' as const, count: devices.length, color: 'from-deep-blue-600 to-deep-blue-800' },
            { label: '在线', key: 'online' as const, count: devices.filter((d) => d.status === 'online').length, color: 'from-green-500 to-green-700' },
            { label: '离线', key: 'offline' as const, count: devices.filter((d) => d.status === 'offline').length, color: 'from-graphite-400 to-graphite-600' },
            { label: '故障', key: 'fault' as const, count: devices.filter((d) => d.status === 'fault').length, color: 'from-vibrant-orange-500 to-vibrant-orange-600' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`glass-card p-4 text-left transition-all ${filter === s.key ? 'ring-2 ring-aqua-400 -translate-y-0.5' : 'hover:shadow-md'}`}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} text-white flex items-center justify-center mb-2`}>
                <Cpu size={18} />
              </div>
              <p className="text-2xl font-display font-bold text-graphite-800">{s.count}</p>
              <p className="text-sm text-graphite-500">{s.label}设备</p>
            </button>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-graphite-100 hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-graphite-500 uppercase tracking-wider">
            <div className="col-span-3">设备信息</div>
            <div className="col-span-2">位置</div>
            <div className="col-span-1 text-center">状态</div>
            <div className="col-span-2 text-center">连接方式</div>
            <div className="col-span-1 text-right">今日用量</div>
            <div className="col-span-1 text-right">今日收益</div>
            <div className="col-span-2 text-center">操作</div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-graphite-500">加载中...</div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-12 text-center text-graphite-500">暂无设备</div>
          ) : (
            <div className="divide-y divide-graphite-100">
              {filteredDevices.map((device) => {
                const style = getStatusStyle(device.status);
                return (
                  <div key={device.id} className="p-4 hover:bg-graphite-50/50 transition-colors md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    <div className="col-span-3 flex items-center gap-3 mb-2 md:mb-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        device.status === 'online' ? 'bg-green-100 text-green-600'
                          : device.status === 'fault' ? 'bg-vibrant-orange-100 text-vibrant-orange-600'
                          : 'bg-graphite-200 text-graphite-500'
                      }`}>
                        {device.status === 'online' ? <Wifi size={22} /> : device.status === 'fault' ? <AlertTriangle size={22} /> : <WifiOff size={22} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-graphite-800 truncate">{device.name}</p>
                        <p className="text-xs text-graphite-400 font-mono truncate">{device.id.slice(0, 20)}...</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-graphite-600 flex items-center gap-1 mb-2 md:mb-0 pl-14 md:pl-0">
                      <MapPin size={14} className="shrink-0 text-graphite-400" />
                      <span className="truncate">{device.location}</span>
                    </div>
                    <div className="col-span-1 text-center mb-2 md:mb-0 pl-14 md:pl-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${device.status === 'online' ? 'animate-pulse' : ''}`} />
                        {style.label}
                      </span>
                    </div>
                    <div className="col-span-2 flex gap-1.5 justify-center mb-2 md:mb-0 pl-14 md:pl-0">
                      {device.connectionTypes.map((t) => (
                        <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded bg-deep-blue-50 text-deep-blue-700 text-xs">
                          {renderConnIcon(t)}{renderConnLabel(t)}
                        </span>
                      ))}
                    </div>
                    <div className="col-span-1 text-right text-sm font-semibold text-deep-blue-700 mb-2 md:mb-0">{formatVolume(device.todayWaterUsage)}</div>
                    <div className="col-span-1 text-right text-sm font-bold text-vibrant-orange-600 mb-3 md:mb-0">{formatMoney(device.todayRevenue)}</div>
                    <div className="col-span-2 flex gap-2 pl-14 md:pl-0 md:justify-center">
                      <button
                        onClick={() => navigate('/investor/analytics')}
                        className="flex-1 md:flex-none px-3 py-1.5 text-xs rounded-lg bg-aqua-50 text-aqua-700 hover:bg-aqua-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <BarChart3 size={14} />数据分析
                      </button>
                      <button
                        onClick={() => navigate('/investor/analytics')}
                        className="flex-1 md:flex-none px-3 py-1.5 text-xs rounded-lg bg-deep-blue-50 text-deep-blue-700 hover:bg-deep-blue-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <FileText size={14} />诊断
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card p-6 bg-gradient-to-br from-deep-blue-50 to-transparent">
          <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2">
            <Wifi size={18} className="text-aqua-600" />终端接入方式
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Nfc size={28} />, title: 'NFC感应', desc: '支持ISO 14443A标准，兼容校园一卡通，感应距离≤5cm' },
              { icon: <Bluetooth size={28} />, title: '蓝牙连接', desc: 'BLE 5.0低功耗蓝牙，自动配对连接，传输距离≤10m' },
              { icon: <QrCode size={28} />, title: '二维码扫码', desc: '动态加密二维码，兼容微信/支付宝扫一扫，支持离线生成' },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-xl bg-white shadow-sm border border-graphite-100 hover:shadow-md hover:border-aqua-200 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-deep-blue-600 to-aqua-500 text-white flex items-center justify-center mb-3 shadow-md">
                  {item.icon}
                </div>
                <h4 className="font-semibold text-graphite-800 mb-1">{item.title}</h4>
                <p className="text-sm text-graphite-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-graphite-400 mt-4 flex items-center gap-1">
            <ChevronRight size={12} />兼容现有热水设备改造，无需更换阀体，即可实现智能化升级
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
