import { useState } from 'react';
import { Search, Filter, Package, Building2, TrendingUp, ChevronRight, Star, MapPin } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { mockSuppliers, mockCategories, getSupplyRelationsBySupplier } from '../data/supplyChain';
import { formatNumber, formatMoney } from '../utils/format';
import type { Supplier } from '../types/supply';

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(mockSuppliers[0]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', '装饰装修', '建材供应', '设备供应', '物业服务'];
  const mainCategories = mockCategories.filter(c => c.level === 1);

  const filteredSuppliers = mockSuppliers.filter(s => {
    if (searchKeyword && !s.name.includes(searchKeyword)) {
      return false;
    }
    if (categoryFilter !== 'all' && s.category !== categoryFilter) {
      return false;
    }
    return true;
  }).sort((a, b) => b.marketShare - a.marketShare);

  const supplierRelations = selectedSupplier 
    ? getSupplyRelationsBySupplier(selectedSupplier.id) 
    : [];

  const categoryMarketData = {
    xAxis: mainCategories.map(c => c.name),
    series: [
      {
        name: '市场规模(亿元)',
        data: mainCategories.map(c => c.totalMarketSize / 100000000),
        color: '#8B5CF6',
      },
    ],
  };

  const marketShareData = [
    { name: '金螳螂', value: 12.5, color: '#3B82F6' },
    { name: '广田集团', value: 8.5, color: '#10B981' },
    { name: '亚厦股份', value: 6.8, color: '#F59E0B' },
    { name: '其他', value: 72.2, color: '#475569' },
  ];

  const supplyTrendData = {
    xAxis: ['2019', '2020', '2021', '2022', '2023'],
    series: [
      { name: '精装供应链', data: [3200, 3800, 4500, 4200, 3800], color: '#3B82F6' },
      { name: '建材供应链', data: [5800, 6500, 7200, 6800, 6200], color: '#8B5CF6' },
      { name: '设备供应链', data: [2200, 2600, 3100, 2900, 2700], color: '#10B981' },
    ],
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">物业与家居供应链</h1>
            <p className="text-sm text-dark-400 mt-1">供应商图谱、合作关系、采购规模全景分析</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" icon={<Filter className="w-4 h-4" />}>
              高级筛选
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="grid grid-cols-4 gap-5">
          {mainCategories.map((cat, index) => {
            const colors = ['text-brand-400', 'text-purple-400', 'text-success-400', 'text-warning-400'];
            const bgColors = ['bg-brand-500/10', 'bg-purple-500/10', 'bg-success-500/10', 'bg-warning-500/10'];
            const borderColors = ['border-brand-500/20', 'border-purple-500/20', 'border-success-500/20', 'border-warning-500/20'];
            
            return (
              <div
                key={cat.id}
                onClick={() => setCategoryFilter(cat.name)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  categoryFilter === cat.name
                    ? 'bg-brand-500/10 border border-brand-500/30'
                    : `${bgColors[index]} border ${borderColors[index]} hover:border-dark-600/50`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{cat.name}</p>
                    <p className="text-2xl font-bold text-white font-mono mt-1">
                      {cat.supplierCount}家
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${bgColors[index]} flex items-center justify-center`}>
                    <Package className={`w-5 h-5 ${colors[index]}`} />
                  </div>
                </div>
                <p className="text-xs text-dark-500 mt-2">
                  市场规模: <span className={`font-mono ${colors[index]}`}>{formatMoney(cat.totalMarketSize)}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex px-6 pb-6 gap-5 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <Card className="flex-shrink-0">
            <Card.Header>
              <Tabs
                tabs={[
                  { key: 'suppliers', label: '供应商库' },
                  { key: 'relations', label: '合作关系' },
                  { key: 'analysis', label: '行业分析' },
                ]}
                activeKey={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
              <div className="flex items-center gap-3">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    placeholder="搜索供应商..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full h-8 pl-10 pr-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 placeholder:text-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
              </div>
            </Card.Header>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <Card.Body className="flex-1 overflow-y-auto">
              {activeTab === 'suppliers' && (
                <div className="grid grid-cols-2 gap-3">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      onClick={() => setSelectedSupplier(supplier)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedSupplier?.id === supplier.id
                          ? 'bg-brand-500/10 border border-brand-500/30'
                          : 'bg-dark-800/30 border border-dark-700/30 hover:border-dark-600/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-2xl border border-dark-600/50 flex-shrink-0">
                          {supplier.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white truncate">{supplier.name}</h3>
                            {supplier.stockCode && (
                              <Tag variant="outline" size="sm">{supplier.stockCode}</Tag>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Tag variant="purple" size="sm">{supplier.subCategory}</Tag>
                            <span className="text-xs text-dark-500">{supplier.region}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(supplier.rating)
                                    ? 'text-warning-500 fill-warning-500'
                                    : 'text-dark-600'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-dark-500 ml-1">{supplier.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700/30">
                        <div>
                          <p className="text-[10px] text-dark-500">市场份额</p>
                          <p className="text-sm font-mono font-semibold text-brand-400">
                            {(supplier.marketShare * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-dark-500">合同金额</p>
                          <p className="text-sm font-mono text-white">{formatMoney(supplier.totalContractAmount)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-dark-500">服务项目</p>
                          <p className="text-sm font-mono text-white">{supplier.projectCount}个</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'relations' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <Card.Header>
                        <Card.Title className="text-sm">房企合作TOP10</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <BarChart
                          data={{
                            xAxis: ['万科', '保利', '中海', '华润', '龙湖', '招商', '金地', '新城'],
                            series: [{
                              name: '合作项目数',
                              data: [128, 115, 96, 89, 78, 72, 65, 58],
                              color: '#3B82F6',
                            }]
                          }}
                          horizontal
                          height={280}
                          showLegend={false}
                        />
                      </Card.Body>
                    </Card>
                    <Card>
                      <Card.Header>
                        <Card.Title className="text-sm">品类集中度</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <PieChart
                          data={marketShareData}
                          type="doughnut"
                          height={280}
                          showLegend={true}
                        />
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-4">
                  <Card>
                    <Card.Header>
                      <Card.Title className="text-sm">供应链市场规模趋势</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <BarChart
                        data={supplyTrendData}
                        height={300}
                        showLegend
                      />
                    </Card.Body>
                  </Card>

                  <div className="grid grid-cols-3 gap-4">
                    {mainCategories.map((cat, index) => (
                      <Card key={cat.id}>
                        <Card.Header>
                          <Card.Title className="text-sm">{cat.name}</Card.Title>
                        </Card.Header>
                        <Card.Body>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-white font-mono">
                              {formatMoney(cat.totalMarketSize)}
                            </p>
                            <p className="text-xs text-dark-500 mt-1">市场规模</p>
                          </div>
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-dark-400">供应商数量</span>
                              <span className="text-white font-mono">{cat.supplierCount}家</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-dark-400">CR5集中度</span>
                              <span className="text-brand-400 font-mono">{25 + index * 5}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-dark-400">同比增速</span>
                              <span className="text-success-500 font-mono">+5.2%</span>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="w-80 flex flex-col gap-4">
          {selectedSupplier ? (
            <>
              <Card>
                <Card.Header>
                  <Card.Title className="text-sm">供应商详情</Card.Title>
                </Card.Header>
                <Card.Body className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-3xl border border-dark-600/50">
                      {selectedSupplier.logo}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{selectedSupplier.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag variant="purple" size="sm">{selectedSupplier.category}</Tag>
                        {selectedSupplier.stockCode && (
                          <span className="text-xs text-dark-500">{selectedSupplier.stockCode}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-dark-500 text-xs">成立年份</p>
                      <p className="text-dark-200">{selectedSupplier.establishedYear}年</p>
                    </div>
                    <div>
                      <p className="text-dark-500 text-xs">企业规模</p>
                      <p className="text-dark-200">{selectedSupplier.scale}</p>
                    </div>
                    <div>
                      <p className="text-dark-500 text-xs">总部区域</p>
                      <p className="text-dark-200">{selectedSupplier.region}</p>
                    </div>
                    <div>
                      <p className="text-dark-500 text-xs">细分品类</p>
                      <p className="text-dark-200">{selectedSupplier.subCategory}</p>
                    </div>
                  </div>

                  <div className="divider -mx-5" />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-lg bg-dark-800/30">
                      <p className="text-lg font-bold text-white font-mono">{selectedSupplier.projectCount}</p>
                      <p className="text-[10px] text-dark-500">合作项目</p>
                    </div>
                    <div className="p-3 rounded-lg bg-dark-800/30">
                      <p className="text-lg font-bold text-brand-400 font-mono">
                        {(selectedSupplier.marketShare * 100).toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-dark-500">市场份额</p>
                    </div>
                    <div className="p-3 rounded-lg bg-dark-800/30">
                      <p className="text-lg font-bold text-warning-400 font-mono">
                        {selectedSupplier.rating}
                      </p>
                      <p className="text-[10px] text-dark-500">综合评分</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card className="flex-1 min-h-0 flex flex-col">
                <Card.Header>
                  <Card.Title className="text-sm">合作房企</Card.Title>
                  <Tag variant="outline">{supplierRelations.length}家</Tag>
                </Card.Header>
                <Card.Body className="flex-1 overflow-y-auto py-3">
                  <div className="space-y-2">
                    {supplierRelations.map((rel) => (
                      <div key={rel.id} className="p-3 rounded-lg bg-dark-800/30 hover:bg-dark-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{rel.developerName}</span>
                          <Tag variant="outline" size="sm">{rel.cooperationType}</Tag>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-dark-500">合同金额</span>
                          <span className="text-xs font-mono text-brand-400">{formatMoney(rel.contractAmount)}</span>
                        </div>
                        {rel.projectName && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3 text-dark-500" />
                            <span className="text-xs text-dark-500 truncate">{rel.projectName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">选择供应商查看详情</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
