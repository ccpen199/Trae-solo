import { useState } from 'react';
import { Search, Filter, Download, TrendingUp, TrendingDown, Building2, ChevronRight, BarChart2, PieChart as PieChartIcon, MapPin } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { LineChart } from '../components/charts/LineChart';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { mockCompanies, getCompanyById } from '../data/companies';
import { mockAnnualReports, mockBonds, mockLandReserves, getAnnualReportsByCompany, getLatestReport } from '../data/finance';
import { formatNumber, formatMoney, formatPercent, formatRate } from '../utils/format';
import type { Company } from '../types/company';
import type { AnnualReport } from '../types/finance';

export default function Finance() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(mockCompanies[0]);
  const [activeTab, setActiveTab] = useState('annual');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredCompanies = mockCompanies.filter(c => {
    if (searchKeyword && !c.name.includes(searchKeyword) && !c.shortName.includes(searchKeyword)) {
      return false;
    }
    if (filterType !== 'all' && c.type !== filterType) {
      return false;
    }
    return true;
  });

  const companyReports = selectedCompany ? getAnnualReportsByCompany(selectedCompany.id) : [];
  const latestReport = selectedCompany ? getLatestReport(selectedCompany.id) : null;
  const companyBonds = selectedCompany ? mockBonds.filter(b => b.companyId === selectedCompany.id) : [];
  const companyLandReserves = selectedCompany ? mockLandReserves.filter(l => l.companyId === selectedCompany.id) : [];

  const revenueTrendData = {
    xAxis: companyReports.map(r => `${r.year}年`),
    series: [
      {
        name: '营业收入',
        data: companyReports.map(r => r.revenue / 100000000),
        color: '#3B82F6',
        areaStyle: true,
      },
    ],
  };

  const profitTrendData = {
    xAxis: companyReports.map(r => `${r.year}年`),
    series: [
      {
        name: '净利润',
        data: companyReports.map(r => r.netProfit / 100000000),
        color: '#10B981',
        areaStyle: true,
      },
    ],
  };

  const debtStructureData = [
    { name: '短期负债', value: 35, color: '#EF4444' },
    { name: '长期负债', value: 45, color: '#F59E0B' },
    { name: '应付账款', value: 20, color: '#3B82F6' },
  ];

  const landByRegionData = {
    xAxis: ['华东', '华南', '华北', '西南', '华中', '西北', '东北'],
    series: [
      {
        name: '土储面积(万㎡)',
        data: [1250, 890, 680, 520, 450, 280, 180],
        color: '#8B5CF6',
      },
    ],
  };

  const getTypeTag = (type: string) => {
    switch (type) {
      case 'state-owned':
        return <Tag variant="primary">国企</Tag>;
      case 'private':
        return <Tag variant="success">民企</Tag>;
      case 'mixed':
        return <Tag variant="warning">混合</Tag>;
      default:
        return null;
    }
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-success-500' : 'text-danger-500';
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">企业财务数据库</h1>
            <p className="text-sm text-dark-400 mt-1">年报数据、债券发行、土储动态全景分析</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
              导出数据
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex px-6 pb-6 gap-5 min-h-0">
        <div className="w-72 flex flex-col gap-4 flex-shrink-0">
          <Card className="flex-shrink-0">
            <Card.Header>
              <Card.Title>企业筛选</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="搜索企业名称..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full h-9 pl-10 pr-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 placeholder:text-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'state-owned', 'private', 'mixed'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      filterType === type
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                        : 'bg-dark-800/50 text-dark-400 border border-dark-700/50 hover:text-dark-300'
                    }`}
                  >
                    {type === 'all' ? '全部' : type === 'state-owned' ? '国企' : type === 'private' ? '民企' : '混合'}
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <Card.Header>
              <Card.Title>企业列表</Card.Title>
              <Tag variant="outline">{filteredCompanies.length}家</Tag>
            </Card.Header>
            <Card.Body className="flex-1 overflow-y-auto py-3">
              <div className="space-y-2">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedCompany?.id === company.id
                        ? 'bg-brand-500/10 border border-brand-500/30'
                        : 'bg-dark-800/30 border border-dark-700/30 hover:border-dark-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-xl border border-dark-600/50">
                        {company.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">{company.shortName}</p>
                          {getTypeTag(company.type)}
                        </div>
                        <p className="text-xs text-dark-500 mt-0.5 truncate">{company.name}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        selectedCompany?.id === company.id ? 'text-brand-400' : 'text-dark-600'
                      }`} />
                    </div>
                    {selectedCompany?.id === company.id && latestReport && (
                      <div className="mt-2.5 pt-2.5 border-t border-dark-700/30 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-dark-500">最新营收</p>
                          <p className="text-sm font-mono font-semibold text-white">
                            {formatMoney(latestReport.revenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-dark-500">同比</p>
                          <p className={`text-sm font-mono font-semibold ${getGrowthColor(latestReport.revenueGrowth)}`}>
                            {latestReport.revenueGrowth >= 0 ? '+' : ''}
                            {(latestReport.revenueGrowth * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-5">
          {selectedCompany && latestReport && (
            <>
              <Card>
                <Card.Body>
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-3xl border border-dark-600/50">
                      {selectedCompany.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">{selectedCompany.name}</h2>
                        {getTypeTag(selectedCompany.type)}
                        <Tag variant="outline">{selectedCompany.stockCode}</Tag>
                      </div>
                      <div className="flex items-center gap-6 mt-2">
                        <div>
                          <span className="text-xs text-dark-500">信用评级:</span>
                          <span className="ml-1 text-sm font-medium text-brand-400">{selectedCompany.creditRating}</span>
                        </div>
                        <div>
                          <span className="text-xs text-dark-500">成立时间:</span>
                          <span className="ml-1 text-sm text-dark-300">{selectedCompany.establishDate}</span>
                        </div>
                        <div>
                          <span className="text-xs text-dark-500">注册资本:</span>
                          <span className="ml-1 text-sm text-dark-300">{formatMoney(selectedCompany.registeredCapital)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-dark-500">法人代表:</span>
                          <span className="ml-1 text-sm text-dark-300">{selectedCompany.legalPerson}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divider my-5" />

                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <p className="text-xs text-dark-500">营业收入</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">
                        {formatMoney(latestReport.revenue)}
                      </p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${getGrowthColor(latestReport.revenueGrowth)}`}>
                        {getGrowthIcon(latestReport.revenueGrowth)}
                        <span>
                          {latestReport.revenueGrowth >= 0 ? '+' : ''}
                          {(latestReport.revenueGrowth * 100).toFixed(1)}%
                        </span>
                        <span className="text-dark-500 ml-1">同比</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <p className="text-xs text-dark-500">净利润</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">
                        {formatMoney(latestReport.netProfit)}
                      </p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${getGrowthColor(latestReport.netProfitGrowth)}`}>
                        {getGrowthIcon(latestReport.netProfitGrowth)}
                        <span>
                          {latestReport.netProfitGrowth >= 0 ? '+' : ''}
                          {(latestReport.netProfitGrowth * 100).toFixed(1)}%
                        </span>
                        <span className="text-dark-500 ml-1">同比</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <p className="text-xs text-dark-500">总资产</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">
                        {formatMoney(latestReport.totalAssets)}
                      </p>
                      <p className="text-xs text-dark-500 mt-1">
                        资产负债率: <span className="text-dark-300">{formatRate(latestReport.debtRatio * 100)}</span>
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800/30">
                      <p className="text-xs text-dark-500">销售回款率</p>
                      <p className="text-xl font-bold text-white font-mono mt-1">
                        {formatRate(latestReport.salesCollectionRate * 100)}
                      </p>
                      <p className="text-xs text-dark-500 mt-1">
                        ROE: <span className="text-dark-300">{formatRate(latestReport.roe * 100)}</span>
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card className="flex-1 min-h-0 flex flex-col">
                <Card.Header>
                  <Card.Title>财务分析</Card.Title>
                  <Tabs
                    tabs={[
                      { key: 'annual', label: '年报数据', icon: <BarChart2 className="w-3.5 h-3.5" /> },
                      { key: 'bonds', label: '债券发行', icon: <PieChartIcon className="w-3.5 h-3.5" /> },
                      { key: 'land', label: '土储动态', icon: <MapPin className="w-3.5 h-3.5" /> },
                    ]}
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    variant="pills"
                  />
                </Card.Header>
                <Card.Body className="flex-1 overflow-y-auto">
                  {activeTab === 'annual' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <Card>
                          <Card.Header>
                            <Card.Title className="text-sm">营收趋势</Card.Title>
                            <Tag variant="outline">亿元</Tag>
                          </Card.Header>
                          <Card.Body>
                            <LineChart data={revenueTrendData} height={200} showLegend={false} />
                          </Card.Body>
                        </Card>
                        <Card>
                          <Card.Header>
                            <Card.Title className="text-sm">净利润趋势</Card.Title>
                            <Tag variant="outline">亿元</Tag>
                          </Card.Header>
                          <Card.Body>
                            <LineChart data={profitTrendData} height={200} showLegend={false} />
                          </Card.Body>
                        </Card>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>年份</th>
                              <th>营业收入</th>
                              <th>同比增长</th>
                              <th>净利润</th>
                              <th>同比增长</th>
                              <th>毛利率</th>
                              <th>净利率</th>
                              <th>资产负债率</th>
                              <th>ROE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {companyReports.sort((a, b) => b.year - a.year).map((report) => (
                              <tr key={report.id}>
                                <td className="font-medium text-white">{report.year}年</td>
                                <td className="font-mono">{formatMoney(report.revenue)}</td>
                                <td className={getGrowthColor(report.revenueGrowth)}>
                                  {report.revenueGrowth >= 0 ? '+' : ''}
                                  {(report.revenueGrowth * 100).toFixed(2)}%
                                </td>
                                <td className="font-mono">{formatMoney(report.netProfit)}</td>
                                <td className={getGrowthColor(report.netProfitGrowth)}>
                                  {report.netProfitGrowth >= 0 ? '+' : ''}
                                  {(report.netProfitGrowth * 100).toFixed(2)}%
                                </td>
                                <td>{formatRate(report.grossMargin * 100)}</td>
                                <td>{formatRate(report.netMargin * 100)}</td>
                                <td>{formatRate(report.debtRatio * 100)}</td>
                                <td>{formatRate(report.roe * 100)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'bonds' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-3 gap-5">
                        <div className="p-4 rounded-xl bg-dark-800/30">
                          <p className="text-xs text-dark-500">存续债券</p>
                          <p className="text-xl font-bold text-white font-mono mt-1">
                            {companyBonds.filter(b => b.status === 'normal').length} 只
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-dark-800/30">
                          <p className="text-xs text-dark-500">存续规模</p>
                          <p className="text-xl font-bold text-white font-mono mt-1">
                            {formatMoney(companyBonds.filter(b => b.status === 'normal').reduce((sum, b) => sum + b.issueAmount, 0))}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-dark-800/30">
                          <p className="text-xs text-dark-500">平均票面利率</p>
                          <p className="text-xl font-bold text-white font-mono mt-1">
                            {(companyBonds.filter(b => b.status === 'normal').reduce((sum, b) => sum + b.couponRate, 0) / companyBonds.filter(b => b.status === 'normal').length * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>债券名称</th>
                              <th>代码</th>
                              <th>发行规模</th>
                              <th>票面利率</th>
                              <th>发行日期</th>
                              <th>到期日期</th>
                              <th>期限</th>
                              <th>评级</th>
                              <th>状态</th>
                            </tr>
                          </thead>
                          <tbody>
                            {companyBonds.map((bond) => (
                              <tr key={bond.id}>
                                <td className="font-medium text-white">{bond.bondName}</td>
                                <td className="font-mono text-sm text-dark-400">{bond.bondCode}</td>
                                <td className="font-mono">{formatMoney(bond.issueAmount)}</td>
                                <td className="font-mono text-brand-400">{(bond.couponRate * 100).toFixed(2)}%</td>
                                <td>{bond.issueDate}</td>
                                <td>{bond.maturityDate}</td>
                                <td>{bond.term}年</td>
                                <td>
                                  <Tag variant="primary">{bond.rating}</Tag>
                                </td>
                                <td>
                                  <Tag variant={
                                    bond.status === 'normal' ? 'success' :
                                    bond.status === 'default' ? 'danger' : 'default'
                                  }>
                                    {bond.status === 'normal' ? '正常' : bond.status === 'default' ? '违约' : '已到期'}
                                  </Tag>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'land' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-dark-800/30">
                          <p className="text-xs text-dark-500">土地储备</p>
                          <p className="text-xl font-bold text-white font-mono mt-1">
                            {formatNumber(companyLandReserves.reduce((sum, l) => sum + l.area, 0))}㎡
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-dark-800/30">
                          <p className="text-xs text-dark-500">总地价</p>
                          <p className="text-xl font-bold text-white font-mono mt-1">
                            {formatMoney(companyLandReserves.reduce((sum, l) => sum + l.landPrice, 0))}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-dark-800/30">
                          <p className="text-xs text-dark-500">平均楼面价</p>
                          <p className="text-xl font-bold text-white font-mono mt-1">
                            ¥{Math.round(companyLandReserves.reduce((sum, l) => sum + l.floorPrice, 0) / companyLandReserves.length).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-dark-800/30">
                          <p className="text-xs text-dark-500">覆盖城市</p>
                          <p className="text-xl font-bold text-white font-mono mt-1">
                            {new Set(companyLandReserves.map(l => l.city)).size} 个
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-5">
                        <Card className="col-span-2">
                          <Card.Header>
                            <Card.Title className="text-sm">区域土储分布</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <BarChart data={landByRegionData} horizontal height={250} showLegend={false} />
                          </Card.Body>
                        </Card>
                        <Card>
                          <Card.Header>
                            <Card.Title className="text-sm">土地用途</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <PieChart
                              data={[
                                { name: '住宅用地', value: 65, color: '#3B82F6' },
                                { name: '商住混合', value: 25, color: '#8B5CF6' },
                                { name: '商业用地', value: 10, color: '#F59E0B' },
                              ]}
                              type="doughnut"
                              height={250}
                              showLegend={false}
                              centerLabel="地块数量"
                              centerValue={companyLandReserves.length}
                            />
                          </Card.Body>
                        </Card>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>所在城市</th>
                              <th>区域</th>
                              <th>土地面积</th>
                              <th>总价</th>
                              <th>楼面价</th>
                              <th>拿地日期</th>
                              <th>土地用途</th>
                              <th>容积率</th>
                            </tr>
                          </thead>
                          <tbody>
                            {companyLandReserves.map((land) => (
                              <tr key={land.id}>
                                <td className="font-medium text-white">{land.city}</td>
                                <td>{land.region}</td>
                                <td className="font-mono">{formatNumber(land.area)}㎡</td>
                                <td className="font-mono">{formatMoney(land.landPrice)}</td>
                                <td className="font-mono">¥{land.floorPrice.toLocaleString()}</td>
                                <td>{land.acquireDate}</td>
                                <td>
                                  <Tag variant="outline">{land.landUse}</Tag>
                                </td>
                                <td>{land.plotRatio}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </>
          )}

          {!selectedCompany && (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Building2 className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">请从左侧选择企业查看财务数据</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
