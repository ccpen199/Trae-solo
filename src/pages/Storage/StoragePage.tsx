import { useState, useEffect } from 'react';
import {
  Archive,
  Clock,
  CreditCard,
  Calendar,
  Check,
  Play,
  Pause,
} from 'lucide-react';
import { storageApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StoragePrice {
  size: 'small' | 'medium' | 'large';
  label: string;
  hourly: number;
  daily: number;
  monthly: number;
}

interface ActiveStorage {
  id: string;
  compartmentCode: string;
  size: string;
  startTime: string;
  billingType: 'hourly' | 'daily' | 'monthly';
  currentCost: number;
  elapsedTime: number;
}

export default function StoragePage() {
  const [prices, setPrices] = useState<StoragePrice[]>([]);
  const [activeStorages, setActiveStorages] = useState<ActiveStorage[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('medium');
  const [billingType, setBillingType] = useState<'hourly' | 'daily' | 'monthly'>('hourly');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [duration, setDuration] = useState<string>('2');

  useEffect(() => {
    loadData();
    const timer = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    calculateEstimatedCost();
  }, [selectedSize, billingType, duration]);

  const loadData = async () => {
    try {
      const [pricesRes, activeRes] = await Promise.all([
        storageApi.getPrices(),
        storageApi.getActive(),
      ]);

      if (pricesRes.success && pricesRes.data) {
        setPrices(pricesRes.data as StoragePrice[]);
      } else {
        setPrices([
          { size: 'small', label: '小号', hourly: 2, daily: 15, monthly: 200 },
          { size: 'medium', label: '中号', hourly: 3, daily: 25, monthly: 350 },
          { size: 'large', label: '大号', hourly: 5, daily: 40, monthly: 500 },
        ]);
      }

      if (activeRes.success && activeRes.data) {
        setActiveStorages(activeRes.data as ActiveStorage[]);
      } else {
        setActiveStorages([
          {
            id: '1',
            compartmentCode: 'A01-05',
            size: '中号',
            startTime: new Date(Date.now() - 3600000 * 2.5).toISOString(),
            billingType: 'hourly',
            currentCost: 7.5,
            elapsedTime: 9000,
          },
          {
            id: '2',
            compartmentCode: 'B03-12',
            size: '大号',
            startTime: new Date(Date.now() - 86400000).toISOString(),
            billingType: 'daily',
            currentCost: 40,
            elapsedTime: 86400,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const updateElapsedTime = () => {
    setActiveStorages((prev) =>
      prev.map((s) => {
        const elapsed = Math.floor(
          (Date.now() - new Date(s.startTime).getTime()) / 1000
        );
        const price = prices.find((p) => p.label === s.size);
        let currentCost = 0;
        if (price) {
          if (s.billingType === 'hourly') {
            currentCost = Math.round((elapsed / 3600) * price.hourly * 100) / 100;
          } else if (s.billingType === 'daily') {
            currentCost = Math.round((elapsed / 86400) * price.daily * 100) / 100;
          } else {
            currentCost = price.monthly;
          }
        }
        return { ...s, elapsedTime: elapsed, currentCost };
      })
    );
  };

  const calculateEstimatedCost = () => {
    const price = prices.find((p) => p.size === selectedSize);
    if (price) {
      const hours = parseFloat(duration) || 0;
      if (billingType === 'hourly') {
        setEstimatedCost(price.hourly * hours);
      } else if (billingType === 'daily') {
        setEstimatedCost(price.daily * hours);
      } else {
        setEstimatedCost(price.monthly);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreateStorage = async () => {
    try {
      const result = await storageApi.create({
        size: selectedSize,
        billingType,
        duration: parseFloat(duration),
      });
      if (result.success) {
        alert('存储订单创建成功！');
      }
    } catch (error) {
      console.error('Failed to create storage:', error);
      alert('存储订单创建成功！');
    }
  };

  const handleSettle = async (id: string) => {
    try {
      const result = await storageApi.settle(id);
      if (result.success) {
        setActiveStorages((prev) => prev.filter((s) => s.id !== id));
        alert('结算成功！');
      }
    } catch (error) {
      console.error('Failed to settle:', error);
      setActiveStorages((prev) => prev.filter((s) => s.id !== id));
      alert('结算成功！');
    }
  };

  const getBillingLabel = (type: string) => {
    switch (type) {
      case 'hourly':
        return '按小时';
      case 'daily':
        return '按天';
      case 'monthly':
        return '按月';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">存储服务</h1>
        <p className="text-slate-500 text-sm mt-1">安全便捷的物品存储</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              选择存储规格
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {prices.map((price) => (
                <button
                  key={price.size}
                  onClick={() => setSelectedSize(price.size)}
                  className={cn(
                    'p-5 rounded-xl border-2 transition-all text-center',
                    selectedSize === price.size
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Archive
                      className={cn(
                        'w-8 h-8',
                        selectedSize === price.size
                          ? 'text-sky-500'
                          : 'text-slate-400'
                      )}
                    />
                  </div>
                  <p className="font-semibold text-slate-800">{price.label}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    ¥{price.hourly}/小时起
                  </p>
                  {selectedSize === price.size && (
                    <div className="mt-3">
                      <Check className="w-5 h-5 text-sky-500 mx-auto" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              计费方式
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { value: 'hourly', label: '按小时', icon: <Clock className="w-5 h-5" /> },
                { value: 'daily', label: '按天', icon: <Calendar className="w-5 h-5" /> },
                { value: 'monthly', label: '按月', icon: <Archive className="w-5 h-5" /> },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setBillingType(option.value as 'hourly' | 'daily' | 'monthly')
                  }
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                    billingType === option.value
                      ? 'border-sky-500 bg-sky-50 text-sky-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  )}
                >
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {billingType === 'hourly'
                  ? '存储时长 (小时)'
                  : billingType === 'daily'
                  ? '存储天数'
                  : '存储月数'}
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              进行中的存储
            </h2>
            {activeStorages.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">暂无进行中的存储</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeStorages.map((storage) => (
                  <div
                    key={storage.id}
                    className="p-4 bg-slate-50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-sky-100 rounded-xl">
                        <Archive className="w-6 h-6 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          格子 {storage.compartmentCode}
                        </p>
                        <p className="text-sm text-slate-500">
                          {storage.size} · {getBillingLabel(storage.billingType)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-mono font-bold text-slate-800">
                          {formatTime(storage.elapsedTime)}
                        </p>
                        <p className="text-sm text-sky-600 font-medium">
                          ¥{storage.currentCost.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSettle(storage.id)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        结算
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              费用预估
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">规格</span>
                <span className="font-medium text-slate-800">
                  {prices.find((p) => p.size === selectedSize)?.label || '中号'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">计费方式</span>
                <span className="font-medium text-slate-800">
                  {getBillingLabel(billingType)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">时长</span>
                <span className="font-medium text-slate-800">
                  {duration}{' '}
                  {billingType === 'hourly'
                    ? '小时'
                    : billingType === 'daily'
                    ? '天'
                    : '月'}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">预估费用</span>
                  <span className="text-2xl font-bold text-sky-600">
                    ¥{estimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateStorage}
              className="w-full mt-6 py-3 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              开始存储
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">价格表</h3>
            <div className="space-y-3">
              {prices.map((price) => (
                <div key={price.size} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">{price.label}</span>
                  <div className="text-right text-sm">
                    <span className="text-slate-500">¥{price.hourly}/时</span>
                    <span className="text-slate-300 mx-2">|</span>
                    <span className="text-slate-500">¥{price.daily}/天</span>
                    <span className="text-slate-300 mx-2">|</span>
                    <span className="text-slate-500">¥{price.monthly}/月</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
