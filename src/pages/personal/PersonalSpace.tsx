import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Clock,
  FileText,
  ChevronRight,
  User,
  Shield,
  Smartphone,
  AlertTriangle,
  Award,
  CheckCircle2,
  Loader2,
  XCircle,
  FileCheck2,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useGet, useGetPaginated } from '../../hooks/useApi';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { cn } from '../../lib/utils';
import {
  providerToLabel,
  providerToColor,
  idTypeToRole,
  formatDateTime,
  categoryToChinese,
  statusTextMap,
  statusColorMap,
  formatDate,
} from '../../lib/data-mapping';
import type {
  Certificate,
  DataConsent,
  ProgressItem,
  Policy,
} from '../../../shared/types';

const tabs = [
  { path: 'certificates', icon: CreditCard, label: '证照库', desc: '管理您的电子证照' },
  { path: 'progress', icon: Clock, label: '办事进度', desc: '查看办件办理进度' },
  { path: 'policies', icon: FileText, label: '政策推送', desc: '查看为您匹配的政策' },
];

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

export default function PersonalSpace() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  const isRoot = location.pathname === '/personal';

  const { data: certificates } = useGet<Certificate[]>(
    ['certificates'],
    '/personal/certificates',
    { enabled: isAuthenticated && isRoot }
  );

  const { data: progressData } = useGetPaginated<ProgressItem>(
    ['progressOverview'],
    '/personal/progress?pageSize=1',
    { enabled: isAuthenticated && isRoot }
  );

  const { data: policiesData } = useGetPaginated<Policy>(
    ['policiesOverview'],
    '/personal/policies?pageSize=5',
    { enabled: isAuthenticated && isRoot }
  );

  const { data: consents } = useGet<DataConsent[]>(
    ['consents'],
    '/auth/consents',
    { enabled: isAuthenticated && isRoot }
  );

  if (!isRoot) {
    return <Outlet />;
  }

  const certCount = certificates?.length || 0;
  const progressTotal = progressData?.total || 0;
  const policyTotal = policiesData?.total || 0;

  const certCategories = certificates?.reduce((acc, cert) => {
    const cat = cert.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const processingCount = progressData?.items?.filter(p => p.status === 'processing').length || 0;
  const completedCount = progressData?.items?.filter(p => p.status === 'completed').length || 0;
  const otherProgressCount = progressTotal - processingCount - completedCount;

  const topPolicies = policiesData?.items?.slice(0, 5) || [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <Card>
          <Card.Body>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2 flex-wrap">
                  {user?.realName}
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                    providerToColor(user?.authProvider || user?.providerKey)
                  )}>
                    {providerToLabel(user?.authProvider || user?.providerKey)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {user?.roleLabel || idTypeToRole(user?.idType)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Award className="w-3 h-3" />
                    L{user?.authLevel}
                  </span>
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>手机号：{user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                  {user?.verified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      已实名认证
                    </span>
                  )}
                  {user?.loginTime && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      本次登录：{formatDateTime(user.loginTime)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tabs.map((tab) => {
            const count = tab.path === 'certificates' ? certCount :
                         tab.path === 'progress' ? progressTotal : policyTotal;
            return (
              <Link key={tab.path} to={tab.path}>
                <Card hover>
                  <Card.Body className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <tab.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h3 className="font-semibold text-gray-900">{tab.label}</h3>
                            <span className="text-2xl font-bold text-primary">{count}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{tab.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                我的证照分布（共{certCount}张）
              </h3>
            </Card.Header>
            <Card.Body>
              {Object.keys(certCategories).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(certCategories).map(([cat, count]) => {
                    const percentage = Math.round((count / certCount) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{categoryToChinese(cat)}</span>
                          <span className="font-medium text-gray-900">{count}张 ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无证照数据</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                办件进度分布（共{progressTotal}件）
              </h3>
            </Card.Header>
            <Card.Body>
              {progressTotal > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        <span className="text-xs text-primary font-medium">办理中</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{processingCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">已完成</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700">{completedCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-600 font-medium">其他</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-700">{otherProgressCount > 0 ? otherProgressCount : 0}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex w-full rounded-full overflow-hidden h-3 bg-gray-100">
                      {processingCount > 0 && (
                        <div
                          className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all"
                          style={{ width: `${(processingCount / progressTotal) * 100}%` }}
                        />
                      )}
                      {completedCount > 0 && (
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all"
                          style={{ width: `${(completedCount / progressTotal) * 100}%` }}
                        />
                      )}
                      {otherProgressCount > 0 && (
                        <div
                          className="bg-gradient-to-r from-gray-400 to-gray-500 h-full transition-all"
                          style={{ width: `${(otherProgressCount / progressTotal) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无办件记录</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="md:col-span-2">
            <Card.Header>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                政策匹配 Top 5
              </h3>
            </Card.Header>
            <Card.Body className="p-0">
              {topPolicies.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {topPolicies.map((policy, idx) => (
                    <div key={policy.id} className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold',
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-100 text-gray-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        )}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1 flex-1">{policy.title}</h4>
                            <span className="flex-shrink-0 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                              {policy.matchScore}%
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{categoryToChinese(policy.category)}</span>
                            <span>{policy.source}</span>
                            <span>发布于 {formatDate(policy.publishDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无政策匹配</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item} className="md:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  数据授权管理
                </h3>
              </div>
            </Card.Header>
            <Card.Body>
              {consents?.length ? (
                <div className="space-y-3">
                  {consents.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-medium text-gray-900 mb-1">{item.purpose}</p>
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {item.dataScope.slice(0, 4).map((scope, idx) => (
                            <span key={idx} className="text-xs px-1.5 py-0.5 rounded bg-primary/5 text-primary/80">
                              {categoryToChinese(scope)}
                            </span>
                          ))}
                          {item.dataScope.length > 4 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              +{item.dataScope.length - 4}项
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          授权起始：{formatDate(item.validFrom)}
                          {item.validTo ? ` · 有效期至：${formatDate(item.validTo)}` : ' · 长期有效'}
                        </p>
                      </div>
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                        statusColorMap[item.status]
                      )}>
                        {statusTextMap[item.status]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无授权记录</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-900">安全提示</h3>
            </Card.Header>
            <Card.Body className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">定期修改密码</p>
                  <p className="text-xs text-blue-600">建议每3个月修改一次登录密码</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">开启二次验证</p>
                  <p className="text-xs text-green-600">使用短信验证码提升账户安全</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-900">隐私保护提醒</p>
                  <p className="text-xs text-yellow-600">请勿向他人透露您的验证码</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <FileCheck2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">定期检查授权</p>
                  <p className="text-xs text-purple-600">及时撤销不再需要的数据授权</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
