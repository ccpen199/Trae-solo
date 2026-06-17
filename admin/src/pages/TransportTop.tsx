import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import type { DashboardData } from '@/types';
import { TrendingUp, MapPin, DollarSign, CreditCard, Trophy, Medal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#1E4D8C', '#2D6BC4', '#2D9D72', '#34D399', '#E8A838', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA', '#FB7185'];

export default function TransportTop() {
  const [data, setData] = useState<DashboardData | null>(null);
  const loadDashboardData = useAppStore((state) => state.loadDashboardData);

  useEffect(() => {
    const fetchData = async () => {
      await loadDashboardData();
      setData(useAppStore.getState().dashboardData);
    };
    fetchData();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy size={18} className="text-amber-500" />;
    if (rank === 1) return <Medal size={18} className="text-gray-400" />;
    if (rank === 2) return <Medal size={18} className="text-amber-700" />;
    return <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{rank + 1}</span>;
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const topCities = data.transportTopCities;
  const totalTransactions = topCities.reduce((sum, c) => sum + c.transactionCount, 0);
  const totalAmount = topCities.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">交通卡异地使用TOP10城市</h1>
          <p className="text-gray-500 text-sm mt-1">苏州交通卡在全国各城市的使用情况统计</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-300">
            <option>近7天</option>
            <option>近30天</option>
            <option>近90天</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <MapPin size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-gray-500">覆盖城市</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">{topCities.length}+</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center">
              <TrendingUp size={12} className="mr-1" />
              较上月 +5 城
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CreditCard size={24} className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-gray-500">异地交易笔数</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">{(totalTransactions / 10000).toFixed(1)}万</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center">
              <TrendingUp size={12} className="mr-1" />
              同比 +18.5%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-gray-500">异地交易额</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">¥{(totalAmount / 1000000).toFixed(1)}千万</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center">
              <TrendingUp size={12} className="mr-1" />
              同比 +22.3%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-rose-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-gray-500">苏锡常同城化占比</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">68.5%</p>
            <p className="text-xs text-gray-500 mt-1">无锡+常州占异地交易近七成</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">交易笔数排行榜</h3>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-primary-500 mr-2"></span>
                交易笔数
              </span>
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="cityName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#374151', fontSize: 13 }}
                  width={70}
                />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  }}
                />
                <Bar dataKey="transactionCount" name="交易笔数" radius={[0, 8, 8, 0]}>
                  {topCities.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">详细榜单</h3>
          <div className="space-y-3">
            {topCities.map((city, index) => (
              <div
                key={city.cityCode}
                className={`flex items-center p-3 rounded-xl transition-all hover:bg-gray-50 ${
                  index < 3 ? 'bg-gradient-to-r from-primary-50 to-transparent' : ''
                }`}
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-800">{city.cityName}</span>
                    {city.cityCode === '3202' && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">苏锡常</span>
                    )}
                    {city.cityCode === '3204' && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">苏锡常</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5">
                    <span>{city.transactionCount.toLocaleString()} 笔</span>
                    <span className="mx-2">·</span>
                    <span>¥{(city.totalAmount / 10000).toFixed(0)}万</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary-600">
                    {((city.transactionCount / totalTransactions) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">苏锡常同城化专区</h3>
        <div className="grid grid-cols-3 gap-6">
          {topCities.filter((c) => ['3205', '3202', '3204'].includes(c.cityCode)).map((city, index) => (
            <div key={city.cityCode} className="border-2 border-primary-100 rounded-2xl p-6 bg-gradient-to-br from-primary-50/50 to-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-bold text-gray-800">{city.cityName}</h4>
                    <p className="text-xs text-primary-600">同城化城市</p>
                  </div>
                </div>
                {index === 0 ? (
                  <Trophy size={28} className="text-amber-500" />
                ) : (
                  <div className="text-xs font-bold text-gray-400">NO.{index + 1}</div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">同城折扣</span>
                  <span className="text-sm font-semibold text-emerald-600">9折优惠</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">交易笔数</span>
                  <span className="text-sm font-semibold text-gray-800">{city.transactionCount.toLocaleString()} 笔</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">优惠金额</span>
                  <span className="text-sm font-semibold text-amber-600">¥{((city.totalAmount * 0.1) / 10000).toFixed(0)}万</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                    style={{ width: `${(city.transactionCount / totalTransactions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
