import { useState, useMemo } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, Ban, UserCheck, Eye, Clock, X, User, Building2, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { mockRiskScores, mockCompanies, mockTalents, mockJobs, mockBlacklist, mockWhitelist, mockRiskScoreHistories } from '@shared/mock/data';
import type { RiskScore, RiskLevel, EntityType } from '@shared/types';
import type { BlacklistEntry, WhitelistEntry } from '@shared/mock/data';

const COLORS = {
  high: '#FF5252',
  medium: '#FFB3B3',
  low: '#4ECDC4',
};

const AdminRiskControlContent = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'blacklist' | 'whitelist'>('alerts');
  const [selectedRisk, setSelectedRisk] = useState<RiskScore | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getEntityName = (entityId: string, entityType: EntityType): string => {
    switch (entityType) {
      case 'company':
        return mockCompanies.find(c => c.id === entityId)?.name || '未知企业';
      case 'talent':
        return mockTalents.find(t => t.id === entityId)?.name || '未知人才';
      case 'job':
        return mockJobs.find(j => j.id === entityId)?.title || '未知职位';
      default:
        return '未知';
    }
  };

  const getEntityIcon = (entityType: EntityType) => {
    switch (entityType) {
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'talent':
        return <User className="w-4 h-4" />;
      case 'job':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'high':
        return <Badge variant="danger" size="sm"><AlertTriangle className="w-3 h-3 mr-1" />高风险</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm"><AlertTriangle className="w-3 h-3 mr-1" />中风险</Badge>;
      case 'low':
        return <Badge variant="success" size="sm"><CheckCircle className="w-3 h-3 mr-1" />低风险</Badge>;
    }
  };

  const getRowBgColor = (level: RiskLevel) => {
    switch (level) {
      case 'high':
        return 'hover:bg-red-50/50';
      case 'medium':
        return 'hover:bg-accent-50/50';
      case 'low':
        return 'hover:bg-mint-50/50';
    }
  };

  const stats = useMemo(() => {
    const todayAlerts = mockRiskScores.filter(r => {
      const evalDate = new Date(r.evaluatedAt);
      const today = new Date();
      return evalDate.toDateString() === today.toDateString();
    }).length;

    const highRiskCount = mockRiskScores.filter(r => r.riskLevel === 'high').length;
    const processedThisMonth = mockRiskScores.filter(r => {
      const evalDate = new Date(r.evaluatedAt);
      const now = new Date();
      return evalDate.getMonth() === now.getMonth() && evalDate.getFullYear() === now.getFullYear();
    }).length;

    const avgScore = mockRiskScores.length > 0
      ? Math.round(mockRiskScores.reduce((acc, r) => acc + r.overallScore, 0) / mockRiskScores.length)
      : 0;

    return { todayAlerts, highRiskCount, processedThisMonth, avgScore };
  }, []);

  const riskLevelData = useMemo(() => {
    return [
      { name: '高风险', value: mockRiskScores.filter(r => r.riskLevel === 'high').length, color: COLORS.high },
      { name: '中风险', value: mockRiskScores.filter(r => r.riskLevel === 'medium').length, color: COLORS.medium },
      { name: '低风险', value: mockRiskScores.filter(r => r.riskLevel === 'low').length, color: COLORS.low },
    ];
  }, []);

  const entityTypeData = useMemo(() => {
    return [
      { name: '企业', high: mockRiskScores.filter(r => r.entityType === 'company' && r.riskLevel === 'high').length, medium: mockRiskScores.filter(r => r.entityType === 'company' && r.riskLevel === 'medium').length, low: mockRiskScores.filter(r => r.entityType === 'company' && r.riskLevel === 'low').length },
      { name: '人才', high: mockRiskScores.filter(r => r.entityType === 'talent' && r.riskLevel === 'high').length, medium: mockRiskScores.filter(r => r.entityType === 'talent' && r.riskLevel === 'medium').length, low: mockRiskScores.filter(r => r.entityType === 'talent' && r.riskLevel === 'low').length },
      { name: '职位', high: mockRiskScores.filter(r => r.entityType === 'job' && r.riskLevel === 'high').length, medium: mockRiskScores.filter(r => r.entityType === 'job' && r.riskLevel === 'medium').length, low: mockRiskScores.filter(r => r.entityType === 'job' && r.riskLevel === 'low').length },
    ];
  }, []);

  const handleViewDetail = (risk: RiskScore) => {
    setSelectedRisk(risk);
    setSidebarOpen(true);
  };

  const handleAddToBlacklist = () => {
    if (!selectedRisk) return;
    alert(`已将 ${getEntityName(selectedRisk.entityId, selectedRisk.entityType)} 加入黑名单`);
    setSidebarOpen(false);
  };

  const handleAddToWhitelist = () => {
    if (!selectedRisk) return;
    alert(`已将 ${getEntityName(selectedRisk.entityId, selectedRisk.entityType)} 加入白名单`);
    setSidebarOpen(false);
  };

  const handleMarkProcessed = () => {
    if (!selectedRisk) return;
    alert(`已将 ${getEntityName(selectedRisk.entityId, selectedRisk.entityType)} 标记为已处理`);
    setSidebarOpen(false);
  };

  const handleIgnore = () => {
    if (!selectedRisk) return;
    alert(`已忽略 ${getEntityName(selectedRisk.entityId, selectedRisk.entityType)} 的风险预警`);
    setSidebarOpen(false);
  };

  const handleRemoveFromList = (entry: BlacklistEntry | WhitelistEntry, type: 'black' | 'white') => {
    alert(`已将 ${entry.entityName} 从${type === 'black' ? '黑' : '白'}名单中移除`);
  };

  const gaugeValue = stats.avgScore;
  const gaugeColor = gaugeValue >= 80 ? COLORS.low : gaugeValue >= 60 ? COLORS.medium : COLORS.high;

  return (
    <PageLayout title="风控中心" subtitle="智能风控引擎，保障平台安全">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ background: `conic-gradient(from 180deg, ${gaugeColor}, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${gaugeColor}20` }}>
                  <ShieldAlert className="w-6 h-6" style={{ color: gaugeColor }} />
                </div>
                <Badge variant="primary" size="sm">综合评分</Badge>
              </div>
              <div className="mt-4 relative">
                <svg className="w-full h-24" viewBox="0 0 100 60">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#E9ECEF"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(gaugeValue / 100) * 126} 126`}
                    className="transition-all duration-1000"
                  />
                  <text x="50" y="42" textAnchor="middle" className="fill-neutral-800 font-serif" fontSize="18" fontWeight="bold">
                    {gaugeValue}
                  </text>
                  <text x="50" y="55" textAnchor="middle" className="fill-neutral-500" fontSize="8">
                    风险指数
                  </text>
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-accent-500" />
                </div>
                <Badge variant="danger" size="sm">今日</Badge>
              </div>
              <p className="mt-4 text-3xl font-serif font-bold text-neutral-800">{stats.todayAlerts}</p>
              <p className="mt-1 text-sm text-neutral-500">今日风险预警</p>
            </div>
          </Card>

          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Ban className="w-6 h-6 text-accent-500" />
                </div>
                <Badge variant="danger" size="sm">高风险</Badge>
              </div>
              <p className="mt-4 text-3xl font-serif font-bold text-neutral-800">{stats.highRiskCount}</p>
              <p className="mt-1 text-sm text-neutral-500">高风险实体</p>
            </div>
          </Card>

          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-mint-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-mint-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-mint-500" />
                </div>
                <Badge variant="success" size="sm">本月</Badge>
              </div>
              <p className="mt-4 text-3xl font-serif font-bold text-neutral-800">{stats.processedThisMonth}</p>
              <p className="mt-1 text-sm text-neutral-500">本月已处理风险</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="md">
            <h3 className="font-serif text-lg font-semibold text-primary-800 mb-4">风险等级分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskLevelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="font-serif text-lg font-semibold text-primary-800 mb-4">风险类型分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entityTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                  <XAxis dataKey="name" tick={{ fill: '#6C757D', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6C757D', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="high" name="高风险" fill={COLORS.high} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="medium" name="中风险" fill={COLORS.medium} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="low" name="低风险" fill={COLORS.low} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card padding="none">
          <div className="px-5 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('alerts')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'alerts'
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <ShieldAlert className="w-4 h-4 inline mr-2" />
                风险预警
              </button>
              <button
                onClick={() => setActiveTab('blacklist')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'blacklist'
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <XCircle className="w-4 h-4 inline mr-2" />
                黑名单
              </button>
              <button
                onClick={() => setActiveTab('whitelist')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'whitelist'
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <UserCheck className="w-4 h-4 inline mr-2" />
                白名单
              </button>
            </div>
          </div>

          {activeTab === 'alerts' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">实体名称</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">类型</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">风险等级</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">风险因素</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">风险评分</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">检测时间</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRiskScores.map((risk, index) => (
                    <tr
                      key={risk.id}
                      className={cn(
                        'border-b border-neutral-100 transition-colors cursor-pointer',
                        getRowBgColor(risk.riskLevel),
                        index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'
                      )}
                      onClick={() => handleViewDetail(risk)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                            risk.riskLevel === 'high' ? 'bg-red-100 text-accent-500' :
                            risk.riskLevel === 'medium' ? 'bg-accent-100 text-accent-400' :
                            'bg-mint-100 text-mint-500'
                          )}>
                            {getEntityIcon(risk.entityType)}
                          </div>
                          <p className="font-medium text-neutral-800">
                            {getEntityName(risk.entityId, risk.entityType)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="info" size="sm">
                          {risk.entityType === 'company' ? '企业' : risk.entityType === 'talent' ? '人才' : '职位'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">{getRiskBadge(risk.riskLevel)}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-neutral-600 max-w-xs truncate">
                          {risk.riskFactors.join('、')}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          'text-lg font-serif font-bold',
                          risk.overallScore < 60 ? 'text-accent-500' :
                          risk.overallScore < 80 ? 'text-accent-400' :
                          'text-mint-500'
                        )}>
                          {risk.overallScore}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-sm text-neutral-500">
                          <Clock className="w-4 h-4" />
                          {new Date(risk.evaluatedAt).toLocaleString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetail(risk); }}>
                            <Eye className="w-4 h-4" />
                            查看详情
                          </Button>
                          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleAddToBlacklist(); }}>
                            <Ban className="w-4 h-4" />
                            加入黑名单
                          </Button>
                          <Button variant="success" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkProcessed(); }}>
                            <CheckCircle className="w-4 h-4" />
                            标记已处理
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'blacklist' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">实体名称</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">类型</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">加入原因</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">加入时间</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mockBlacklist.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={cn(
                        'border-b border-neutral-100 hover:bg-neutral-50 transition-colors',
                        index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                            {getEntityIcon(entry.entityType)}
                          </div>
                          <p className="font-medium text-neutral-800">{entry.entityName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="info" size="sm">
                          {entry.entityType === 'company' ? '企业' : entry.entityType === 'talent' ? '人才' : '职位'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-neutral-600 max-w-md">{entry.reason}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-sm text-neutral-500">
                          <Clock className="w-4 h-4" />
                          {new Date(entry.addedAt).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFromList(entry, 'black')}>
                          <X className="w-4 h-4" />
                          移除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mockBlacklist.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">黑名单为空</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'whitelist' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">实体名称</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">类型</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">加入原因</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">加入时间</th>
                    <th className="px-5 py-4 text-left text-sm font-medium text-neutral-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mockWhitelist.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={cn(
                        'border-b border-neutral-100 hover:bg-neutral-50 transition-colors',
                        index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-mint-100 flex items-center justify-center flex-shrink-0">
                            {getEntityIcon(entry.entityType)}
                          </div>
                          <p className="font-medium text-neutral-800">{entry.entityName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="info" size="sm">
                          {entry.entityType === 'company' ? '企业' : entry.entityType === 'talent' ? '人才' : '职位'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-neutral-600 max-w-md">{entry.reason}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-sm text-neutral-500">
                          <Clock className="w-4 h-4" />
                          {new Date(entry.addedAt).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFromList(entry, 'white')}>
                          <X className="w-4 h-4" />
                          移除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mockWhitelist.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
                    <UserCheck className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">白名单为空</p>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="font-serif text-lg font-semibold text-primary-800">风险详情</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-neutral-500 hover:text-primary-900 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedRisk && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl" style={{ backgroundColor: `${COLORS[selectedRisk.riskLevel]}15` }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium" style={{ color: COLORS[selectedRisk.riskLevel] }}>
                        风险实体信息
                      </span>
                      {getRiskBadge(selectedRisk.riskLevel)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS[selectedRisk.riskLevel]}30` }}>
                        {getEntityIcon(selectedRisk.entityType)}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-800">
                          {getEntityName(selectedRisk.entityId, selectedRisk.entityType)}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {selectedRisk.entityType === 'company' ? '企业' : selectedRisk.entityType === 'talent' ? '人才' : '职位'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">风险因素</h4>
                    <div className="space-y-2">
                      {selectedRisk.riskFactors.map((factor, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                          <AlertTriangle className={cn(
                            'w-5 h-5 flex-shrink-0 mt-0.5',
                            selectedRisk.riskLevel === 'high' ? 'text-accent-500' :
                            selectedRisk.riskLevel === 'medium' ? 'text-accent-400' :
                            'text-mint-500'
                          )} />
                          <div>
                            <p className="text-sm text-neutral-700">{factor}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={cn(
                                'w-2 h-2 rounded-full',
                                index < 2 ? 'bg-accent-500' : 'bg-accent-400'
                              )} />
                              <span className="text-xs text-neutral-500">
                                {index < 2 ? '严重' : '一般'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">风险评分趋势</h4>
                    <div className="h-40 bg-neutral-50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockRiskScoreHistories[selectedRisk.id] || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                          <XAxis dataKey="date" tick={{ fill: '#6C757D', fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#6C757D', fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="score" fill={COLORS[selectedRisk.riskLevel]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">关联实体</h4>
                    <div className="space-y-2">
                      {mockRiskScores
                        .filter(r => r.entityType === selectedRisk.entityType && r.id !== selectedRisk.id)
                        .slice(0, 3)
                        .map(risk => (
                          <div key={risk.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              {getEntityIcon(risk.entityType)}
                              <span className="text-sm text-neutral-700">
                                {getEntityName(risk.entityId, risk.entityType)}
                              </span>
                            </div>
                            {getRiskBadge(risk.riskLevel)}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">操作记录</h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-700">系统自动检测到风险</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {new Date(selectedRisk.evaluatedAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="danger" onClick={handleAddToBlacklist}>
                  <Ban className="w-4 h-4" />
                  加入黑名单
                </Button>
                <Button variant="success" onClick={handleAddToWhitelist}>
                  <UserCheck className="w-4 h-4" />
                  加入白名单
                </Button>
                <Button variant="ghost" onClick={handleIgnore}>
                  <X className="w-4 h-4" />
                  忽略
                </Button>
                <Button variant="primary" onClick={handleMarkProcessed}>
                  <CheckCircle className="w-4 h-4" />
                  标记已处理
                </Button>
              </div>
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-primary-900/60 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </PageLayout>
  );
};

const AdminRiskControl = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminRiskControlContent />
    </ProtectedRoute>
  );
};

export default AdminRiskControl;
