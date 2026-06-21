import { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Building2, Calendar, TrendingUp, Home, Hammer, ShoppingBag, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { mockProjects, getProjectStats } from '../data/projects';
import { mockCompanies } from '../data/companies';
import { formatNumber, formatMoney } from '../utils/format';
import type { Project, ProjectStage, StageType, StageStatus } from '../types/project';
import type { Company } from '../types/company';
import { useAppStore } from '../stores/useAppStore';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  
  const { selectedCompany: storeSelectedCompany, setSelectedCompany } = useAppStore();
  const navigate = useNavigate();

  const contextCompany = useMemo(() => {
    if (storeSelectedCompany) return storeSelectedCompany;
    return null;
  }, [storeSelectedCompany]);

  const stats = getProjectStats(contextCompany?.id);

  const filteredProjects = mockProjects.filter(p => {
    if (contextCompany && p.companyId !== contextCompany.id) return false;
    if (searchKeyword && !p.name.includes(searchKeyword) && !p.companyName.includes(searchKeyword)) {
      return false;
    }
    if (regionFilter !== 'all' && p.region !== regionFilter) {
      return false;
    }
    if (activeTab !== 'all') {
      const stage = p.stages.find(s => s.type === activeTab);
      if (!stage || stage.status === 'not-started') return false;
    }
    return true;
  });

  const regions = ['all', '华东', '华南', '华北', '西南', '华中'];

  const stageConfig = [
    { type: 'land-acquisition' as StageType, label: '拿地', icon: MapPin, color: 'text-brand-500', bg: 'bg-brand-500' },
    { type: 'construction' as StageType, label: '开工', icon: Hammer, color: 'text-warning-500', bg: 'bg-warning-500' },
    { type: 'sales' as StageType, label: '销售', icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500' },
    { type: 'delivery' as StageType, label: '交付', icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-500' },
  ];

  const getStageStatusColor = (status: StageStatus) => {
    switch (status) {
      case 'completed': return 'bg-success-500';
      case 'in-progress': return 'bg-warning-500';
      default: return 'bg-dark-600';
    }
  };

  const getStageStatusText = (status: StageStatus) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in-progress': return '进行中';
      default: return '未开始';
    }
  };

  const projectTypeData = [
    { name: '住宅', value: 58, color: '#3B82F6' },
    { name: '商业', value: 22, color: '#8B5CF6' },
    { name: '综合体', value: 15, color: '#F59E0B' },
    { name: '工业', value: 5, color: '#10B981' },
  ];

  const regionDistributionData = {
    xAxis: ['华东', '华南', '华北', '西南', '华中', '西北', '东北'],
    series: [
      {
        name: '项目数量',
        data: [32, 28, 18, 15, 12, 8, 5],
        color: '#3B82F6',
      },
    ],
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">项目开发全周期</h1>
            <p className="text-sm text-dark-400 mt-1">拿地-开工-销售-交付，全流程进度追踪</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" icon={<Filter className="w-4 h-4" />}>
              筛选
            </Button>
          </div>
        </div>
      </div>

      {contextCompany && (
        <div className="px-6 pb-4">
          <Card className="bg-gradient-to-r from-success-500/10 via-brand-500/5 to-transparent border-success-500/20">
            <Card.Body className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-xl border border-dark-600/50">
                    {contextCompany.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{contextCompany.shortName} · 项目全周期</p>
                      <Tag variant="success" size="sm">
                        <Building2 className="w-2.5 h-2.5 mr-1" />从首页下钻
                      </Tag>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-dark-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {stats.total} 个项目
                      </span>
                      <span className="flex items-center gap-1">
                        <Hammer className="w-3 h-3" /> 在建 {stats.inProgress} 个
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 已交付 {stats.completed} 个
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> 总投资 {formatMoney(stats.totalInvestment)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { navigate('/finance'); }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
                  >
                    ↔ 切换财务库
                  </button>
                  <button
                    onClick={() => { navigate('/relationship'); }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                  >
                    👥 关系图谱
                  </button>
                  <button
                    onClick={() => { setSelectedCompany(null); }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-dark-700/50 text-dark-300 hover:bg-dark-700 transition-colors"
                  >
                    清除上下文
                  </button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      <div className="px-6 pb-4">
        <div className="grid grid-cols-4 gap-5">
          <div className="p-4 rounded-xl bg-gradient-to-br from-brand-500/10 to-brand-900/10 border border-brand-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">项目总数</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-brand-400" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-warning-500/10 to-warning-900/10 border border-warning-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">在建项目</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-500/20 flex items-center justify-center">
                <Hammer className="w-6 h-6 text-warning-400" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">在售项目</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">15,680</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-success-500/10 to-success-900/10 border border-success-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">已交付项目</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex px-6 pb-6 gap-5 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <Card className="flex-shrink-0">
            <Card.Header>
              <Card.Title>项目筛选</Card.Title>
              <div className="flex items-center gap-3">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    placeholder="搜索项目名称..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full h-8 pl-10 pr-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 placeholder:text-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="h-8 px-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50 transition-all"
                >
                  <option value="all">全部区域</option>
                  {regions.slice(1).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </Card.Header>
          </Card>

          <Card className="flex-shrink-0">
            <Card.Header>
              <Tabs
                tabs={[
                  { key: 'all', label: '全部项目' },
                  { key: 'land-acquisition', label: '拿地阶段' },
                  { key: 'construction', label: '开工阶段' },
                  { key: 'sales', label: '销售阶段' },
                  { key: 'delivery', label: '交付阶段' },
                ]}
                activeKey={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
              <Tag variant="outline">{filteredProjects.length} 个</Tag>
            </Card.Header>
            <Card.Body className="flex-1 overflow-y-auto max-h-[calc(100vh-420px)]">
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? 'bg-brand-500/10 border border-brand-500/30'
                        : 'bg-dark-800/30 border border-dark-700/30 hover:border-dark-600/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                          <Tag variant={
                            project.type === 'residential' ? 'primary' :
                            project.type === 'commercial' ? 'purple' :
                            project.type === 'mixed' ? 'warning' : 'default'
                          } size="sm">
                            {project.type === 'residential' ? '住宅' :
                             project.type === 'commercial' ? '商业' :
                             project.type === 'mixed' ? '综合体' : '工业'}
                          </Tag>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-xs text-dark-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {project.companyName}
                          </span>
                          <span className="text-xs text-dark-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {project.city} · {project.district}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                        selectedProject?.id === project.id ? 'text-brand-400' : 'text-dark-600'
                      }`} />
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-dark-500">项目进度</span>
                        <span className="text-xs text-dark-400">
                          {Math.round(project.stages.filter(s => s.status === 'completed').length / project.stages.length * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {stageConfig.map((stage, index) => {
                          const projectStage = project.stages.find(s => s.type === stage.type);
                          const isCompleted = projectStage?.status === 'completed';
                          const isInProgress = projectStage?.status === 'in-progress';
                          
                          return (
                            <div key={stage.type} className="flex items-center flex-1">
                              <div className="relative flex-shrink-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  isCompleted ? stage.bg : isInProgress ? `${stage.bg}/30` : 'bg-dark-700'
                                }`}>
                                  <stage.icon className={`w-3 h-3 ${
                                    isCompleted || isInProgress ? 'text-white' : 'text-dark-500'
                                  }`} />
                                </div>
                                {isInProgress && (
                                  <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: stage.bg.replace('bg-', '') }} />
                                )}
                              </div>
                              {index < stageConfig.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 ${
                                  isCompleted ? stage.bg : 'bg-dark-700'
                                }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {stageConfig.map(stage => (
                          <span key={stage.type} className={`text-[10px] ${
                            project.stages.find(s => s.type === stage.type)?.status !== 'not-started' 
                              ? stage.color 
                              : 'text-dark-600'
                          }`}>
                            {stage.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-dark-700/30">
                      <div>
                        <p className="text-[10px] text-dark-500">总建面</p>
                        <p className="text-sm font-mono text-white">{formatNumber(project.buildingArea)}㎡</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-dark-500">土地成本</p>
                        <p className="text-sm font-mono text-white">{formatMoney(project.landCost)}</p>
                      </div>
                      {project.avgPrice && (
                        <div>
                          <p className="text-[10px] text-dark-500">销售均价</p>
                          <p className="text-sm font-mono text-white">¥{project.avgPrice.toLocaleString()}/㎡</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="w-80 flex flex-col gap-4">
          <Card>
            <Card.Header>
              <Card.Title className="text-sm">区域分布</Card.Title>
            </Card.Header>
            <Card.Body>
              <BarChart data={regionDistributionData} horizontal height={200} showLegend={false} />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="text-sm">物业类型</Card.Title>
            </Card.Header>
            <Card.Body>
              <PieChart
                data={projectTypeData}
                type="doughnut"
                height={180}
                showLegend={true}
              />
            </Card.Body>
          </Card>

          {selectedProject && (
            <Card>
              <Card.Header>
                <Card.Title className="text-sm">项目详情</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{selectedProject.name}</h3>
                  <p className="text-xs text-dark-400 mt-1">{selectedProject.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-dark-500 text-xs">开发商</p>
                    <p className="text-dark-200">{selectedProject.companyName}</p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-xs">物业类型</p>
                    <p className="text-dark-200">
                      {selectedProject.type === 'residential' ? '住宅' :
                       selectedProject.type === 'commercial' ? '商业' :
                       selectedProject.type === 'mixed' ? '综合体' : '工业'}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-xs">总用地面积</p>
                    <p className="text-dark-200 font-mono">{formatNumber(selectedProject.totalArea)}㎡</p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-xs">总建筑面积</p>
                    <p className="text-dark-200 font-mono">{formatNumber(selectedProject.buildingArea)}㎡</p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-xs">总投资</p>
                    <p className="text-dark-200 font-mono">
                      {selectedProject.totalInvestment ? formatMoney(selectedProject.totalInvestment) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-xs">楼栋数</p>
                    <p className="text-dark-200 font-mono">{selectedProject.buildingCount || '-'}栋</p>
                  </div>
                </div>

                <div className="divider -mx-5" />

                <div>
                  <p className="text-xs font-medium text-dark-300 mb-3">各阶段进度</p>
                  <div className="space-y-3">
                    {selectedProject.stages.map((stage) => {
                      const config = stageConfig.find(c => c.type === stage.type);
                      return (
                        <div key={stage.type} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            stage.status === 'completed' ? `${config?.bg}/20` : 'bg-dark-700/50'
                          }`}>
                            {config && <config.icon className={`w-4 h-4 ${
                              stage.status === 'completed' ? config?.color : 'text-dark-500'
                            }`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white">{config?.label}</span>
                              <Tag variant={
                                stage.status === 'completed' ? 'success' :
                                stage.status === 'in-progress' ? 'warning' : 'default'
                              } size="sm">
                                {getStageStatusText(stage.status)}
                              </Tag>
                            </div>
                            {stage.status !== 'not-started' && (
                              <p className="text-xs text-dark-500 mt-0.5">
                                {stage.startDate} - {stage.endDate || '进行中'}
                              </p>
                            )}
                            {stage.progress !== undefined && (
                              <div className="mt-1.5 h-1.5 rounded-full bg-dark-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getStageStatusColor(stage.status)}`}
                                  style={{ width: `${stage.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
