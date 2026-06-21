import { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, SlidersHorizontal, Download, Building2, MapPin, TrendingUp, Package, Calendar, Users, BarChart3 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { BarChart } from '../components/charts/BarChart';
import { mockCompanies } from '../data/companies';
import { mockSuppliers } from '../data/supplyChain';
import { mockProjects } from '../data/projects';
import { formatNumber, formatMoney } from '../utils/format';

const searchTemplates = [
  {
    id: 1,
    title: '近3年在长三角拿地TOP10国企的精装合作方',
    icon: MapPin,
    tags: ['拿地', '长三角', '国企', '精装修'],
  },
  {
    id: 2,
    title: '近12个月违约债券规模排名前5的民企',
    icon: TrendingUp,
    tags: ['债券违约', '民企', 'TOP5'],
  },
  {
    id: 3,
    title: '涉诉金额超10亿的房企高管关联图谱',
    icon: Users,
    tags: ['司法风险', '高管', '关系图谱'],
  },
  {
    id: 4,
    title: '华南区域销售额增长率超30%的项目',
    icon: BarChart3,
    tags: ['华南', '销售增长率', '项目'],
  },
  {
    id: 5,
    title: 'TOP20房企的物业供应商集中度分析',
    icon: Package,
    tags: ['TOP20', '物业', '供应商'],
  },
];

export default function MultiSearch() {
  const [activeTab, setActiveTab] = useState('result');
  const [searchInput, setSearchInput] = useState('近3年在长三角拿地TOP10国企的精装合作方');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [resultType, setResultType] = useState('company');

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 800);
  };

  const resultCompanies = mockCompanies.slice(0, 6);
  const resultProjects = mockProjects.slice(0, 6);
  const resultSuppliers = mockSuppliers.slice(0, 6);

  const top10LandData = {
    xAxis: ['保利发展', '中海地产', '华润置地', '招商蛇口', '绿城中国', '建发房产', '越秀地产', '华发股份', '滨江集团', '首开股份'],
    series: [
      { name: '拿地金额(亿)', data: [385, 362, 328, 295, 278, 256, 242, 218, 195, 178], color: '#3B82F6' },
    ],
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">多维交叉检索</h1>
            <p className="text-sm text-dark-400 mt-1">企业·项目·人物·供应链，多维度智能交叉分析</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
              导出结果
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="relative">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50 focus-within:border-brand-500/50 transition-all">
            <Search className="w-5 h-5 text-dark-500 ml-2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入自然语言，例如：近3年在长三角拿地TOP10国企的精装合作方..."
              className="flex-1 bg-transparent text-white placeholder:text-dark-500 focus:outline-none text-sm"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              筛选
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <Button variant="primary" size="md" onClick={handleSearch} loading={isSearching}>
              智能检索
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">企业类型</label>
                <select className="w-full h-8 px-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50">
                  <option>全部</option>
                  <option>国企</option>
                  <option>民企</option>
                  <option>央企</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">区域范围</label>
                <select className="w-full h-8 px-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50">
                  <option>全部</option>
                  <option>长三角</option>
                  <option>珠三角</option>
                  <option>京津冀</option>
                  <option>西南地区</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">时间范围</label>
                <select className="w-full h-8 px-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50">
                  <option>近3年</option>
                  <option>近1年</option>
                  <option>近5年</option>
                  <option>自定义</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">数据维度</label>
                <select className="w-full h-8 px-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50">
                  <option>拿地金额</option>
                  <option>销售金额</option>
                  <option>营收规模</option>
                  <option>土地储备</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-4">
        <div className="space-y-2">
          <p className="text-xs text-dark-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            常用检索模板
          </p>
          <div className="flex flex-wrap gap-2">
            {searchTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSearchInput(template.title);
                  handleSearch();
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/50 border border-dark-700/50 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all group"
              >
                <template.icon className="w-3.5 h-3.5 text-dark-500 group-hover:text-brand-400 transition-colors" />
                <span className="text-xs text-dark-300 group-hover:text-white transition-colors">
                  {template.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex px-6 pb-6 gap-5 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <Card className="flex-shrink-0">
            <Card.Header>
              <Tabs
                tabs={[
                  { key: 'result', label: '检索结果' },
                  { key: 'analysis', label: '交叉分析' },
                  { key: 'chart', label: '可视化图表' },
                ]}
                activeKey={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-dark-800/50">
                  <button
                    onClick={() => setResultType('company')}
                    className={`px-3 py-1 rounded-md text-xs transition-colors ${
                      resultType === 'company'
                        ? 'bg-brand-500/20 text-brand-400'
                        : 'text-dark-400 hover:text-dark-200'
                    }`}
                  >
                    企业
                  </button>
                  <button
                    onClick={() => setResultType('project')}
                    className={`px-3 py-1 rounded-md text-xs transition-colors ${
                      resultType === 'project'
                        ? 'bg-brand-500/20 text-brand-400'
                        : 'text-dark-400 hover:text-dark-200'
                    }`}
                  >
                    项目
                  </button>
                  <button
                    onClick={() => setResultType('supplier')}
                    className={`px-3 py-1 rounded-md text-xs transition-colors ${
                      resultType === 'supplier'
                        ? 'bg-brand-500/20 text-brand-400'
                        : 'text-dark-400 hover:text-dark-200'
                    }`}
                  >
                    供应商
                  </button>
                </div>
                <Tag variant="outline">共 {resultCompanies.length + resultProjects.length + resultSuppliers.length} 条结果</Tag>
              </div>
            </Card.Header>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <Card.Body className="flex-1 overflow-y-auto">
              {activeTab === 'result' && (
                <div className="space-y-5">
                  {resultType === 'company' && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white">
                          符合条件的企业
                          <span className="text-dark-500 font-normal ml-2">({resultCompanies.length}家)</span>
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {resultCompanies.map((company) => (
                          <div
                            key={company.id}
                            className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 cursor-pointer transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-xl font-bold text-brand-400 border border-dark-600/50 flex-shrink-0">
                                {company.shortName.slice(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
                                    {company.name}
                                  </h3>
                                  <Tag variant={company.type === 'state-owned' ? 'primary' : 'warning'} size="sm">
                                    {company.type === 'state-owned' ? '国企' : '民企'}
                                  </Tag>
                                </div>
                                <p className="text-xs text-dark-500 mt-1">
                                  {company.headquarters} · {company.industry}
                                </p>
                                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                                  <div>
                                    <p className="text-dark-500">营收</p>
                                    <p className="text-white font-mono">{formatMoney(company.revenue)}</p>
                                  </div>
                                  <div>
                                    <p className="text-dark-500">员工</p>
                                    <p className="text-white font-mono">{formatNumber(company.employeeCount)}人</p>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-dark-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {resultType === 'project' && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white">
                          符合条件的项目
                          <span className="text-dark-500 font-normal ml-2">({resultProjects.length}个)</span>
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {resultProjects.map((project) => (
                          <div
                            key={project.id}
                            className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-brand-400" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">
                                    {project.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Tag variant="outline" size="sm">{project.companyName}</Tag>
                                    <span className="text-xs text-dark-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {project.city}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-mono text-brand-400">
                                  {project.avgPrice ? `¥${project.avgPrice.toLocaleString()}/㎡` : '-'}
                                </p>
                                <p className="text-xs text-dark-500">建面 {formatNumber(project.buildingArea)}㎡</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {resultType === 'supplier' && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white">
                          符合条件的供应商
                          <span className="text-dark-500 font-normal ml-2">({resultSuppliers.length}家)</span>
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {resultSuppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-purple-500/30 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-2xl border border-dark-600/50 flex-shrink-0">
                                {supplier.logo}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                                  {supplier.name}
                                </h3>
                                <Tag variant="purple" size="sm" className="mt-1">
                                  {supplier.subCategory}
                                </Tag>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700/30">
                              <div>
                                <p className="text-[10px] text-dark-500">市场份额</p>
                                <p className="text-sm font-mono text-purple-400">
                                  {(supplier.marketShare * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-dark-500">合同金额</p>
                                <p className="text-sm font-mono text-white">
                                  {formatMoney(supplier.totalContractAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-dark-500">服务项目</p>
                                <p className="text-sm font-mono text-white">
                                  {supplier.projectCount}个
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-5">
                  <Card>
                    <Card.Header>
                      <Card.Title className="text-sm">分析维度</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-center">
                          <p className="text-2xl font-bold text-brand-400 font-mono">{resultCompanies.length}</p>
                          <p className="text-xs text-dark-400 mt-1">企业数</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                          <p className="text-2xl font-bold text-purple-400 font-mono">{resultProjects.length}</p>
                          <p className="text-xs text-dark-400 mt-1">项目数</p>
                        </div>
                        <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/20 text-center">
                          <p className="text-2xl font-bold text-success-400 font-mono">{resultSuppliers.length}</p>
                          <p className="text-xs text-dark-400 mt-1">供应商</p>
                        </div>
                        <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/20 text-center">
                          <p className="text-2xl font-bold text-warning-400 font-mono">8</p>
                          <p className="text-xs text-dark-400 mt-1">关联维度</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
                    <p className="text-sm font-medium text-white mb-3">交叉关联路径</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 p-3 rounded-lg bg-brand-500/10 text-center">
                        <Building2 className="w-6 h-6 text-brand-400 mx-auto" />
                        <p className="text-xs text-white mt-2">房企</p>
                        <p className="text-xs text-dark-500">{resultCompanies.length}家</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-dark-600" />
                      <div className="flex-1 p-3 rounded-lg bg-purple-500/10 text-center">
                        <MapPin className="w-6 h-6 text-purple-400 mx-auto" />
                        <p className="text-xs text-white mt-2">区域项目</p>
                        <p className="text-xs text-dark-500">{resultProjects.length}个</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-dark-600" />
                      <div className="flex-1 p-3 rounded-lg bg-success-500/10 text-center">
                        <Package className="w-6 h-6 text-success-400 mx-auto" />
                        <p className="text-xs text-white mt-2">供应商</p>
                        <p className="text-xs text-dark-500">{resultSuppliers.length}家</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chart' && (
                <div className="space-y-5">
                  <Card>
                    <Card.Header>
                      <Card.Title className="text-sm">长三角拿地金额TOP10国企</Card.Title>
                      <Tag variant="primary">近3年</Tag>
                    </Card.Header>
                    <Card.Body>
                      <BarChart data={top10LandData} height={320} showLegend={false} />
                    </Card.Body>
                  </Card>

                  <div className="grid grid-cols-2 gap-5">
                    <Card>
                      <Card.Header>
                        <Card.Title className="text-sm">企业类型分布</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <div className="h-[200px] flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-white font-mono">6</p>
                            <p className="text-xs text-dark-500 mt-2">符合条件企业</p>
                            <div className="flex items-center gap-3 mt-4">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-brand-500" />
                                <span className="text-xs text-dark-400">国企 4家</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-warning-500" />
                                <span className="text-xs text-dark-400">民企 2家</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                    <Card>
                      <Card.Header>
                        <Card.Title className="text-sm">区域分布</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <div className="h-[200px] flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-white font-mono">6</p>
                            <p className="text-xs text-dark-500 mt-2">城市覆盖</p>
                            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                              <Tag size="sm" variant="outline">上海</Tag>
                              <Tag size="sm" variant="outline">杭州</Tag>
                              <Tag size="sm" variant="outline">南京</Tag>
                              <Tag size="sm" variant="outline">苏州</Tag>
                              <Tag size="sm" variant="outline">宁波</Tag>
                              <Tag size="sm" variant="outline">合肥</Tag>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="w-72 flex flex-col gap-4">
          <Card>
            <Card.Header>
              <Card.Title className="text-sm">检索说明</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3 text-xs text-dark-400">
                <p>支持自然语言多维度交叉检索，可组合查询：</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>企业属性：类型、规模、区域</li>
                  <li>财务指标：营收、利润、负债</li>
                  <li>项目维度：拿地、开工、销售</li>
                  <li>人物关系：高管、股权、司法</li>
                  <li>供应链：品类、份额、合作</li>
                </ul>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="text-sm">最近检索</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2">
                {searchTemplates.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSearchInput(item.title)}
                    className="p-2.5 rounded-lg bg-dark-800/30 hover:bg-dark-800/50 cursor-pointer transition-colors"
                  >
                    <p className="text-xs text-dark-300 truncate">{item.title}</p>
                    <p className="text-[10px] text-dark-600 mt-1">10分钟前</p>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
