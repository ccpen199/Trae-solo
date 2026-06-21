import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { StationCard } from '@/components/stations/StationCard';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Empty } from '@/components/Empty';
import { Search, MapPin, RefreshCw, Plus, TrendingUp, Award, Navigation } from 'lucide-react';
import { stationsAPI } from '@/services/api';
import { PROVINCES, CATEGORIES, type Station } from '../../../shared/types';

const StationList: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    region: '',
    category: '',
    keyword: '',
  });

  const fetchStations = async () => {
    setLoading(true);
    try {
      const response = await stationsAPI.getList(filters.region, filters.category);
      if (response.success && response.data) {
        let filtered = response.data;
        if (filters.keyword) {
          const keyword = filters.keyword.toLowerCase();
          filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(keyword) ||
            s.description.toLowerCase().includes(keyword) ||
            s.address.toLowerCase().includes(keyword)
          );
        }
        setStations(filtered);
      }
    } catch (error) {
      console.error('获取回收站列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStations();
  };

  const handleReset = () => {
    setFilters({ region: '', category: '', keyword: '' });
  };

  const certifiedCount = stations.filter(s => 
    s.certifications.some(c => c.status === 'valid')
  ).length;
  const avgRating = stations.length > 0 
    ? (stations.reduce((sum, s) => sum + s.rating, 0) / stations.length).toFixed(1)
    : '0.0';
  const totalDeals = stations.reduce((sum, s) => sum + s.dealCount, 0);

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">回收站名片</h1>
            <p className="text-slate-500 mt-1">查找优质回收站，建立长期合作关系</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchStations} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              入驻回收站
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stations.length}</p>
                <p className="text-sm text-slate-500">入驻回收站</p>
              </div>
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              本月新增 +{Math.floor(Math.random() * 20) + 10} 家
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{certifiedCount}</p>
                <p className="text-sm text-slate-500">认证回收站</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              认证率 {stations.length > 0 ? Math.round(certifiedCount / stations.length * 100) : 0}%
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{avgRating}</p>
                <p className="text-sm text-slate-500">平均评分</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              满分 5.0 分
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{totalDeals.toLocaleString()}</p>
                <p className="text-sm text-slate-500">累计交易</p>
              </div>
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              较上月 +23.5%
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="搜索回收站名称、地址..."
              icon={<Search className="w-4 h-4" />}
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
            <Select
              options={[
                { value: '', label: '全部地区' },
                ...PROVINCES.map(p => ({ value: p.code, label: p.name })),
              ]}
              value={filters.region}
              onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
            />
            <Select
              options={[
                { value: '', label: '主营品类' },
                ...CATEGORIES.map(c => ({ value: c.id, label: c.name })),
              ]}
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                搜索
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                重置
              </Button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            共找到 <span className="font-semibold text-slate-800">{stations.length}</span> 家回收站
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">排序:</span>
            <select className="border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
              <option>综合排序</option>
              <option>评分最高</option>
              <option>交易量最多</option>
              <option>最新入驻</option>
              <option>距离最近</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
        </div>
      ) : stations.length === 0 ? (
        <Empty
          title="暂无回收站数据"
          description="还没有符合条件的回收站，试试调整筛选条件"
          action={
            <Button onClick={handleReset}>
              重置筛选
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default StationList;
