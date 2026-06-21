import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SupplyCard } from '@/components/supplies/SupplyCard';
import { SupplyFilter } from '@/components/supplies/SupplyFilter';
import { SupplyForm } from '@/components/supplies/SupplyForm';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/Empty';
import { Plus, Grid3X3, List, RefreshCw, TrendingUp } from 'lucide-react';
import { suppliesAPI } from '@/services/api';
import type { Supply, SupplyFilter as SupplyFilterType } from '../../../shared/types';

const SupplyList: React.FC = () => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<SupplyFilterType>({});

  const fetchSupplies = async (filterParams?: SupplyFilterType) => {
    setLoading(true);
    try {
      const response = await suppliesAPI.getList(filterParams);
      if (response.success && response.data) {
        setSupplies(response.data);
      }
    } catch (error) {
      console.error('获取货源列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  const handleFilter = (newFilter: SupplyFilterType) => {
    setFilter(newFilter);
    fetchSupplies(newFilter);
  };

  const handleReset = () => {
    setFilter({});
    fetchSupplies();
  };

  const handleRefresh = () => {
    fetchSupplies(filter);
  };

  const activeSupplies = supplies.filter(s => s.status === 'active');
  const totalValue = activeSupplies.reduce((sum, s) => sum + s.price, 0);
  const totalTonnage = activeSupplies.reduce((sum, s) => sum + s.tonnage, 0);

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">货源交易</h1>
            <p className="text-slate-500 mt-1">查找并采购优质再生资源货源</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              发布货源
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">在售货源</p>
            <p className="text-2xl font-bold text-slate-800">{activeSupplies.length}</p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              较昨日 +12%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">总吨位</p>
            <p className="text-2xl font-bold text-slate-800">{totalTonnage.toFixed(1)} <span className="text-sm font-normal text-slate-500">吨</span></p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              较昨日 +8.5%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">总货值</p>
            <p className="text-2xl font-bold text-green-600">¥{(totalValue / 10000).toFixed(1)}<span className="text-sm font-normal text-slate-500">万</span></p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              较昨日 +15.3%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">今日新增</p>
            <p className="text-2xl font-bold text-orange-500">{Math.floor(Math.random() * 20) + 5}</p>
            <p className="text-xs text-slate-400 mt-1">认证货源占比 68%</p>
          </div>
        </div>

        <SupplyFilter onFilter={handleFilter} onReset={handleReset} />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            共找到 <span className="font-semibold text-slate-800">{supplies.length}</span> 条货源
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
        </div>
      ) : supplies.length === 0 ? (
        <Empty
          title="暂无货源数据"
          description="还没有符合条件的货源信息，试试调整筛选条件或发布新货源"
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              立即发布
            </Button>
          }
        />
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
          : 'space-y-4'
        }>
          {supplies.map((supply) => (
            <SupplyCard key={supply.id} supply={supply} />
          ))}
        </div>
      )}

      {showForm && (
        <SupplyForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchSupplies(filter);
          }}
        />
      )}
    </Layout>
  );
};

export default SupplyList;
