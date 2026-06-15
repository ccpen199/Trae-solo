import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, MapPin, Camera, Bus, Navigation, Clock, TrendingUp, Star } from 'lucide-react';
import { api } from '@/api/client';
import type { ParkingLot, TrafficViolation } from '../../../shared/types';
import { cn } from '@/lib/utils';

const services = [
  { name: 'BRT乘车码', icon: QrCode, path: '/transportation/brt', color: 'from-warm-400 to-warm-600', desc: '扫码乘车，便捷出行' },
  { name: '智慧停车', icon: MapPin, path: '/transportation/parking', color: 'from-primary-400 to-primary-600', desc: '附近停车场空位查询' },
  { name: '违章查询', icon: Camera, path: '/transportation/violation', color: 'from-red-400 to-red-600', desc: '违章记录查询处理' },
  { name: '公交实时', icon: Bus, path: '#', color: 'from-eco-400 to-eco-600', desc: '公交实时位置查询' },
];

export default function Transportation() {
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [violations, setViolations] = useState<TrafficViolation[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [parking, violation] = await Promise.all([
        api.transportation.getNearbyParking(22.8170, 108.3669, 3000),
        api.transportation.getViolations(),
      ]);
      setParkingLots(Array.isArray(parking) ? parking.slice(0, 3) : []);
      setViolations(Array.isArray(violation) ? violation.filter(v => v.status === 'unpaid').slice(0, 3) : []);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">交通出行服务</h1>
          <p className="text-gray-500 mt-1">BRT、停车、违章，一站式交通服务</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-warm-50 text-warm-600 rounded-xl">
          <Navigation className="w-4 h-4" />
          <span className="text-sm font-medium">南宁市 · 青秀区</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service, index) => (
          <button
            key={service.name}
            onClick={() => navigate(service.path)}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-left group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg', service.color)}>
              <service.icon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-500" />
              附近停车场
            </h3>
            <button
              onClick={() => navigate('/transportation/parking')}
              className="text-sm text-primary-600 font-medium hover:text-primary-700"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-4">
            {parkingLots.length > 0 ? parkingLots.map((lot) => (
              <div
                key={lot.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate('/transportation/parking')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{lot.name}</h4>
                    <p className="text-sm text-gray-500">{lot.address}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lot.distance ? `${lot.distance.toFixed(1)}km` : '1.2km'}
                      </span>
                      <span className="text-xs text-gray-500">
                        ¥{lot.pricePerHour}/小时
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-2xl font-bold text-eco-600">{lot.availableSpaces}</span>
                    <span className="text-gray-500 text-sm">/ {lot.totalSpaces}</span>
                  </div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-eco-400 to-eco-600 rounded-full transition-all duration-500"
                      style={{ width: `${((lot.totalSpaces - lot.availableSpaces) / lot.totalSpaces) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">空位</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">暂无停车场数据</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-red-500" />
              待处理违章
            </h3>
            <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
              {violations.length} 条
            </span>
          </div>
          <div className="space-y-4">
            {violations.length > 0 ? violations.map((v) => (
              <div
                key={v.id}
                className="p-4 bg-red-50 rounded-xl border border-red-100"
                onClick={() => navigate('/transportation/violation')}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{v.violationType}</p>
                    <p className="text-sm text-gray-500 mt-1">{v.location}</p>
                    <p className="text-xs text-gray-400 mt-1">{v.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-semibold">¥{v.fine}</p>
                    <p className="text-xs text-gray-500 mt-1">扣{v.points}分</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-eco-500" />
                </div>
                <p className="text-gray-500">暂无违章记录</p>
                <p className="text-sm text-gray-400 mt-1">继续保持良好驾驶习惯</p>
              </div>
            )}
          </div>
          {violations.length > 0 && (
            <button
              onClick={() => navigate('/transportation/violation')}
              className="w-full mt-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              处理全部违章
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center text-warm-600">
              <Bus className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-warm-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">92.5%</p>
          <p className="text-sm text-gray-500 mt-1">公交准点率</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <MapPin className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">78.3%</p>
          <p className="text-sm text-gray-500 mt-1">停车周转率</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-eco-100 flex items-center justify-center text-eco-600">
              <Navigation className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-eco-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">12.8万</p>
          <p className="text-sm text-gray-500 mt-1">今日出行人次</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <QrCode className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">3.2万</p>
          <p className="text-sm text-gray-500 mt-1">今日扫码乘车</p>
        </div>
      </div>
    </div>
  );
}
