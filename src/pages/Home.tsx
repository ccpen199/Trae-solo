import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Shield,
  Check,
  AlertCircle,
  UserCheck,
  Building2,
  MapPin,
  LayoutDashboard,
  Baby,
  GraduationCap,
  Heart,
  Car,
  GitBranch,
  FileCheck2,
  Clock,
  Bell,
  Sparkles,
  ChevronRight,
  TrendingUp,
  KeyRound,
  CreditCard,
  Users,
  FileText,
  ChevronDown,
  Store,
  Building,
  Bus,
  Gauge,
  Award,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useGet, useGetPaginated } from '../hooks/useApi';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { cn } from '../lib/utils';
import {
  providerToLabel,
  providerToColor,
  idTypeToRole,
  formatDateTime,
  categoryToChinese,
  statusTextMap,
  statusColorMap,
  formatDate,
} from '../lib/data-mapping';
import type {
  OneStopService,
  ProgressItem,
  Policy,
  DataConsent,
  Certificate,
  OrchestrationInstance,
} from '../../shared/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const serviceIconMap: Record<string, any> = {
  baby: Baby,
  education: GraduationCap,
  retirement: Heart,
  vehicle: Car,
  housing: Building,
  employment: Users,
  medical: Heart,
  default: FileText,
};

const getServiceIcon = (iconName: string) => {
  return serviceIconMap[iconName] || serviceIconMap.default;
};

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const { data: consents } = useGet<DataConsent[]>(
    ['consents'],
    '/auth/consents',
    { enabled: isAuthenticated }
  );

  const { data: certificates } = useGet<Certificate[]>(
    ['certificates'],
    '/personal/certificates',
    { enabled: isAuthenticated }
  );

  const { data: services } = useGet<OneStopService[]>(
    ['oneStopServices'],
    '/orchestration/services?active=true',
    { enabled: isAuthenticated }
  );

  const { data: progressData } = useGetPaginated<ProgressItem>(
    ['recentProgress'],
    '/personal/progress?pageSize=5',
    { enabled: isAuthenticated }
  );

  const { data: policiesData } = useGetPaginated<Policy>(
    ['recommendedPolicies'],
    '/personal/policies?pageSize=4',
    { enabled: isAuthenticated }
  );

  const { data: instancesData } = useGetPaginated<OrchestrationInstance>(
    ['orchestrationInstances'],
    '/orchestration/instances?pageSize=3',
    { enabled: isAuthenticated }
  );

  const activeConsents = consents?.filter(c => c.status === 'active') || [];
  const processingCount = progressData?.items?.filter(p => p.status === 'processing').length || 0;
  const certCount = certificates?.length || 0;
  const policyMatchCount = policiesData?.total || 0;
  const consentCount = activeConsents.length;

  const quickEntries = [
    {
      icon: UserCheck,
      label: '个人数字空间',
      path: '/personal',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      roles: ['personal'],
      summary: `证照${certCount}张、办件${progressData?.total || 0}件（待办${processingCount}）`,
    },
    {
      icon: Building2,
      label: '企业服务台',
      path: '/enterprise',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      roles: ['enterprise'],
      summary: '待办事项3、可申领补贴5',
    },
    {
      icon: MapPin,
      label: '城市生活圈',
      path: '/city',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      roles: ['personal', 'enterprise', 'government'],
      summary: '今日号源128、场馆空位45、地铁运行中',
    },
    {
      icon: LayoutDashboard,
      label: '基层治理驾驶舱',
      path: '/governance',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      roles: ['government'],
      summary: '今日事件27、待分派8、人口36.2万',
    },
  ];

  const filteredEntries = quickEntries.filter(
    (entry) => !user?.idType || entry.roles.includes(user.idType)
  );

  const statsCards = [
    {
      label: '证照数量',
      value: certCount,
      icon: CreditCard,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: '进行中办件',
      value: processingCount,
      icon: Clock,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: '匹配政策',
      value: policyMatchCount,
      icon: Bell,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: '授权委办局',
      value: consentCount,
      icon: Shield,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium text-white/90">欢迎回来</span>
              </div>
              <h1 className="text-2xl font-bold mb-3 flex items-center gap-3 flex-wrap">
                {user?.realName}，您好！
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  providerToColor(user?.authProvider || user?.providerKey)
                )}>
                  {providerToLabel(user?.authProvider || user?.providerKey)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                  {user?.roleLabel || idTypeToRole(user?.idType)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/90 text-yellow-900 border border-yellow-300">
                  <Award className="w-3 h-3" />
                  L{user?.authLevel}认证
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  本次登录：{formatDateTime(user?.loginTime)}
                </span>
                <span>
                  今天是{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <p className="text-2xl font-bold">{consentCount}</p>
              <p className="text-xs text-white/80">授权委办局</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <p className="text-2xl font-bold">{progressData?.total || 0}</p>
              <p className="text-xs text-white/80">办件总数</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <p className="text-2xl font-bold">{policyMatchCount}</p>
              <p className="text-xs text-white/80">匹配政策</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-xs text-white/80">系统可用率</p>
            </div>
          </div>

          {consentCount === 0 && (
            <div className="mt-4 flex items-center justify-between bg-yellow-500/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-yellow-300/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-200" />
                <span className="text-sm text-yellow-50">您尚未授权任何委办局，部分服务可能受限</span>
              </div>
              <Link to="/personal">
                <Button size="sm" variant="outline" className="border-white/50 text-white hover:bg-white/20">
                  前往授权
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, idx) => (
            <Card key={idx} hover>
              <Card.Body className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', stat.bgColor)}>
                    <stat.icon className={cn('w-5 h-5', stat.iconColor)} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            快捷入口
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredEntries.map((entry, idx) => (
            <Link key={idx} to={entry.path}>
              <Card hover className="h-full">
                <Card.Body className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', entry.color)}>
                      <entry.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{entry.label}</h3>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.summary}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            一件事服务
          </h2>
          <Link to="/orchestration" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services?.length ? services.map((service) => {
            const Icon = getServiceIcon(service.icon);
            const isExpanded = expandedService === service.id;
            return (
              <div key={service.id}>
                <Card hover>
                  <Card.Body className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{service.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                            <Building2 className="w-3 h-3" />
                            涉及{service.involvedDepartments?.length || 0}部门
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
                            <Clock className="w-3 h-3" />
                            预计{service.estimatedDays}天
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
                            <FileCheck2 className="w-3 h-3" />
                            {service.requiredMaterials?.length || 0}份材料
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            立即办理
                          </Button>
                          <button
                            onClick={() => setExpandedService(isExpanded ? null : service.id)}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
                          >
                            {isExpanded ? '收起清单' : '跨部门材料清单'}
                            <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <Card className="mt-2 border-t-0 rounded-t-none">
                        <Card.Body className="p-5 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileCheck2 className="w-4 h-4 text-primary" />
                                所需材料清单
                              </h4>
                              <ul className="space-y-2">
                                {service.requiredMaterials?.map((material, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{material}</span>
                                  </li>
                                ))}
                                {(!service.requiredMaterials || service.requiredMaterials.length === 0) && (
                                  <li className="text-sm text-gray-400">暂无材料要求</li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                涉及部门
                              </h4>
                              <ul className="space-y-2">
                                {service.involvedDepartments?.map((dept, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span>{dept}</span>
                                  </li>
                                ))}
                                {(!service.involvedDepartments || service.involvedDepartments.length === 0) && (
                                  <li className="text-sm text-gray-400">暂无部门信息</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }) : (
            <div className="md:col-span-2">
              <Card>
                <Card.Body className="py-12 text-center text-gray-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无一件事服务</p>
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">我的联办进度</h3>
              </div>
              <Link to="/personal/progress" className="text-sm text-primary hover:text-primary/80">
                查看全部
              </Link>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {instancesData?.items?.length ? (
              <div className="divide-y divide-gray-100">
                {instancesData.items.map((instance) => (
                  <div key={instance.instanceId} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{instance.serviceName}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>启动时间：{formatDateTime(instance.startTime)}</span>
                          {instance.status === 'completed' && instance.endTime && (
                            <span>完成时间：{formatDateTime(instance.endTime)}</span>
                          )}
                        </div>
                      </div>
                      <StatusBadge
                        status={
                          instance.status === 'completed' ? 'success' :
                          instance.status === 'running' ? 'processing' : 'error'
                        }
                        text={
                          instance.status === 'completed' ? '已完成' :
                          instance.status === 'running' ? '办理中' : '失败'
                        }
                      />
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>整体进度</span>
                        <span className="font-medium text-primary">{instance.overallProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${instance.overallProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200" />
                      <div className="space-y-3">
                        {instance.steps?.map((step, idx) => (
                          <div key={step.stepId} className="relative pl-10">
                            <div className={cn(
                              'absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2',
                              step.status === 'completed' ? 'bg-green-500 text-white border-green-500' :
                              step.status === 'running' ? 'bg-primary text-white border-primary animate-pulse' :
                              step.status === 'failed' ? 'bg-red-500 text-white border-red-500' :
                              'bg-white text-gray-400 border-gray-300'
                            )}>
                              {step.status === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{step.name}</p>
                                {step.department && (
                                  <span className="text-xs text-gray-500">{step.department}</span>
                                )}
                              </div>
                              {(step.startTime || step.endTime) && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {step.endTime ? `${formatDateTime(step.endTime)} 完成` :
                                   step.startTime ? `${formatDateTime(step.startTime)} 开始处理` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {instance.status === 'completed' && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                            <FileCheck2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-900">办理结果回执</p>
                            <p className="text-xs text-green-700 mt-1">
                              相关部门已审批通过 · 电子证照已入库 · 可在「个人数字空间-证照库」查看
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <Gauge className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无联办进度记录</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">最近办件</h3>
                </div>
                <Link to="/personal/progress" className="text-sm text-primary hover:text-primary/80">
                  查看全部
                </Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {progressData?.items?.length ? (
                <div className="divide-y divide-gray-100">
                  {progressData.items.map((item) => (
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
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {item.currentStep}/{item.totalSteps} 步
                        </span>
                        <span>提交于 {formatDate(item.submitTime)}</span>
                        {item.estimatedTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            预计 {formatDate(item.estimatedTime)}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/70 h-1.5 rounded-full transition-all"
                          style={{ width: `${(item.currentStep / item.totalSteps) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无办件记录</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-gray-900">政策推荐</h3>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {policiesData?.items?.length ? (
                <div className="divide-y divide-gray-100">
                  {policiesData.items.map((policy) => (
                    <div key={policy.id} className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">{policy.title}</h4>
                        <span className="flex-shrink-0 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {policy.matchScore}% 匹配
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{policy.summary}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{categoryToChinese(policy.category)}</span>
                        <TrendingUp className="w-3 h-3" />
                        <span>{policy.viewCount} 次浏览</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无政策推荐</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900">前置校验 & 授权网关</h3>
            </div>
          </Card.Header>
          <Card.Body>
            {consents?.length ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">已授权委办局</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{activeConsents.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">已过期</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-700">
                      {consents.filter(c => c.status === 'expired').length}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">已撤销</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      {consents.filter(c => c.status === 'revoked').length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {consents.slice(0, 6).map((consent) => (
                    <div
                      key={consent.id}
                      className={cn(
                        'p-4 rounded-xl border transition-colors',
                        consent.status === 'active' ? 'bg-white border-gray-200 hover:border-primary/30' :
                        consent.status === 'expired' ? 'bg-gray-50 border-gray-200 opacity-75' :
                        'bg-red-50/50 border-red-200 opacity-75'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{consent.purpose}</h4>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {consent.dataScope.slice(0, 3).map((scope, idx) => (
                              <span key={idx} className="text-xs px-1.5 py-0.5 rounded bg-primary/5 text-primary/80">
                                {categoryToChinese(scope)}
                              </span>
                            ))}
                            {consent.dataScope.length > 3 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                +{consent.dataScope.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={cn(
                          'flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          statusColorMap[consent.status]
                        )}>
                          {statusTextMap[consent.status]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>授权起始：{formatDate(consent.validFrom)}</span>
                        <span>
                          {consent.validTo ? `有效期至：${formatDate(consent.validTo)}` : '长期有效'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {activeConsents.length < 5 && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900">授权提示</p>
                        <p className="text-xs text-amber-700 mt-1">
                          您当前授权的委办局数量较少，办理如「新生儿出生五证联办」等跨部门服务时，
                          可能需要额外授权卫健、公安、人社等部门的数据访问。建议提前完成相关授权以提高办事效率。
                        </p>
                      </div>
                      <Link to="/personal">
                        <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                          管理授权
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="mb-4">暂无授权记录</p>
                <Link to="/personal">
                  <Button size="sm">前往授权管理</Button>
                </Link>
              </div>
            )}
          </Card.Body>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">安全保障</h3>
                  <p className="text-sm text-gray-500">本系统通过等保三级认证，所有政务数据不出市云，采用AES-256加密存储</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  等保三级
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  TLS 1.3
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  AES-256
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </motion.div>
    </motion.div>
  );
}
