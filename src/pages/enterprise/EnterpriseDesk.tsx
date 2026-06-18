import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, GitBranch, Wallet, ChevronRight, Users, TrendingUp, TrendingDown, Award, CheckCircle, Clock, Circle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useGet, useGetPaginated } from '../../hooks/useApi';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import type { EnterpriseInfo, SubsidyPolicy, ProgressItem } from '../../../shared/types';

const tabs = [
  { path: 'lifecycle', icon: GitBranch, label: '生命周期图谱' },
  { path: 'subsidies', icon: Wallet, label: '补贴申领' },
];

const lifecycleTimeline = [
  { name: '名称核准', status: 'completed' as const },
  { name: '工商登记', status: 'completed' as const },
  { name: '刻章备案', status: 'completed' as const },
  { name: '税务登记', status: 'completed' as const },
  { name: '社保开户', status: 'completed' as const },
  { name: '经营阶段', status: 'current' as const },
  { name: '税务注销', status: 'upcoming' as const },
  { name: '工商注销', status: 'upcoming' as const },
];

const enterpriseTags = [
  { label: '中小微企业', color: 'bg-blue-100 text-blue-700' },
  { label: '高新技术企业', color: 'bg-purple-100 text-purple-700' },
  { label: '科技型中小企业', color: 'bg-green-100 text-green-700' },
];

export default function EnterpriseDesk() {
  const location = useLocation();
  const { user } = useAuthStore();

  const isRoot = location.pathname === '/enterprise';

  const { data: enterpriseInfo } = useGet<EnterpriseInfo>(
    ['enterpriseInfo'],
    '/enterprise/info'
  );

  const { data: subsidiesData } = useGetPaginated<SubsidyPolicy>(
    ['enterprise-subsidies-desk'],
    '/enterprise/subsidies?pageSize=10'
  );

  const { data: progressData } = useGetPaginated<ProgressItem>(
    ['enterprise-progress-desk'],
    '/personal/progress?pageSize=5'
  );

  const subsidyCount = subsidiesData?.total ?? 6;
  const appliedSubsidyCount = Math.max(1, Math.floor(subsidyCount * 0.4));
  const approvedSubsidyCount = Math.max(1, Math.floor(appliedSubsidyCount * 0.7));

  if (!isRoot) {
    return <Outlet />;
  }

  const maskLegalPerson = (name?: string) => {
    if (!name) return '张**';
    if (name.length <= 1) return name + '*';
    return name[0] + '*'.repeat(name.length - 1);
  };

  const getLifecycleBadgeColor = (stage?: string) => {
    switch (stage) {
      case '初创期': return 'bg-blue-100 text-blue-700';
      case '成长期': return 'bg-green-100 text-green-700';
      case '成熟期': return 'bg-purple-100 text-purple-700';
      case '衰退期': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Card.Body>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {enterpriseInfo?.name || user?.realName || '厦门智慧科技有限公司'}
                </h2>
                <StatusBadge
                  status={enterpriseInfo?.status === 'active' ? 'success' : enterpriseInfo?.status === 'abnormal' ? 'warning' : 'error'}
                  text={enterpriseInfo?.status === 'active' ? '正常存续' : enterpriseInfo?.status === 'abnormal' ? '经营异常' : '已注销'}
                />
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getLifecycleBadgeColor(enterpriseInfo?.lifecycleStage)}`}>
                  <GitBranch className="w-3 h-3" />
                  {enterpriseInfo?.lifecycleStage || '成长期'}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mb-2">
                <span>统一社会信用代码：{enterpriseInfo?.creditCode || '91350200**********'}</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mb-3">
                <span>法定代表人：{maskLegalPerson(enterpriseInfo?.legalPerson)}</span>
                <span>成立日期：{enterpriseInfo?.establishDate || '2018-06-15'}</span>
                <span>所属行业：{enterpriseInfo?.industry || '软件和信息技术服务业'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {enterpriseTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tag.color}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Body className="text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">156</p>
            <p className="text-sm text-gray-500">企业员工数</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-bold text-gray-900">¥1.2亿</p>
              <span className="flex items-center text-xs font-medium text-green-600">
                <TrendingUp className="w-3 h-3" />
                12.5%
              </span>
            </div>
            <p className="text-sm text-gray-500">年营业额 (YoY)</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{appliedSubsidyCount}</p>
            <p className="text-sm text-gray-500">已申领补贴</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 flex items-center justify-center mb-3">
              <GitBranch className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{enterpriseInfo?.lifecycleStage || '成长期'}</p>
            <p className="text-sm text-gray-500">生命周期阶段</p>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="lifecycle">
          <Card hover>
            <Card.Body className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">生命周期图谱</h3>
                    <p className="text-sm text-gray-500 mb-2">可视化查看企业全生命周期服务节点</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        已完成 3 节点
                      </span>
                      <span className="text-primary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        进行中 1 项
                      </span>
                      <span className="text-gray-500">共 12 节点</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </Card.Body>
          </Card>
        </Link>
        <Link to="subsidies">
          <Card hover>
            <Card.Body className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">补贴申领</h3>
                    <p className="text-sm text-gray-500 mb-2">查看和申请各类企业扶持补贴政策</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-blue-600">可申领 {subsidyCount} 项</span>
                      <span className="text-primary">已提交 {appliedSubsidyCount} 项</span>
                      <span className="text-green-600 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        获批 {approvedSubsidyCount} 项
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </Card.Body>
          </Card>
        </Link>
      </div>

      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900">企业开办注销流程图谱</h3>
        </Card.Header>
        <Card.Body>
          <div className="relative overflow-x-auto pb-2">
            <div className="flex items-start min-w-max">
              {lifecycleTimeline.map((node, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="flex flex-col items-center w-24">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${
                      node.status === 'completed'
                        ? 'bg-green-500 text-white ring-4 ring-green-100'
                        : node.status === 'current'
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-gray-200 text-gray-400'
                    } ${node.status === 'current' ? 'animate-pulse' : ''}`}>
                      {node.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : node.status === 'current' ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center font-medium ${
                      node.status === 'completed' ? 'text-green-700' :
                      node.status === 'current' ? 'text-primary' : 'text-gray-400'
                    }`}>
                      {node.name}
                    </span>
                    {node.status === 'current' && (
                      <span className="text-[10px] text-primary mt-0.5 bg-primary/10 px-1.5 py-0.5 rounded">
                        当前
                      </span>
                    )}
                  </div>
                  {idx < lifecycleTimeline.length - 1 && (
                    <div className={`h-0.5 w-16 mt-5 flex-shrink-0 ${
                      node.status === 'completed' && lifecycleTimeline[idx + 1].status !== 'upcoming'
                        ? 'bg-green-400'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900">最近办件</h3>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-gray-100">
            {(progressData?.items && progressData.items.length > 0
              ? progressData.items.slice(0, 5)
              : [
                  { id: '1', serviceName: '高新技术企业认定', status: 'processing' as const, currentStep: 3, totalSteps: 5, submitTime: '2024-01-15T08:00:00Z' },
                  { id: '2', serviceName: '稳岗返还补贴申领', status: 'completed' as const, currentStep: 4, totalSteps: 4, submitTime: '2024-01-10T09:30:00Z' },
                  { id: '3', serviceName: '社保公积金开户', status: 'completed' as const, currentStep: 3, totalSteps: 3, submitTime: '2024-01-05T14:20:00Z' },
                ]
            ).map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.serviceName}</h4>
                  <StatusBadge
                    status={
                      item.status === 'completed' ? 'success' :
                      item.status === 'processing' ? 'processing' :
                      item.status === 'rejected' ? 'error' : 'pending'
                    }
                    text={
                      item.status === 'completed' ? '已完成' :
                      item.status === 'processing' ? '办理中' :
                      item.status === 'rejected' ? '已驳回' : '待办理'
                    }
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>申请时间：{new Date(item.submitTime).toLocaleDateString('zh-CN')}</span>
                  <span>{Math.round((item.currentStep / item.totalSteps) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${(item.currentStep / item.totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
}
