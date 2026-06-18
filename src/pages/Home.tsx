import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Building2,
  MapPin,
  LayoutDashboard,
  FileText,
  Clock,
  Bell,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Baby,
  GraduationCap,
  Heart,
  Car,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useGet } from '../hooks/useApi';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import type { OneStopService, ProgressItem, Policy } from '../../shared/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { user } = useAuthStore();

  const { data: services } = useGet<OneStopService[]>(
    ['oneStopServices'],
    '/orchestration/services?active=true'
  );

  const { data: recentProgress } = useGet<{ items: ProgressItem[] }>(
    ['recentProgress'],
    '/personal/progress?pageSize=5'
  );

  const { data: recommendedPolicies } = useGet<{ items: Policy[] }>(
    ['recommendedPolicies'],
    '/personal/policies?pageSize=4'
  );

  const quickEntries = [
    { icon: User, label: '个人数字空间', path: '/personal', color: 'from-blue-500 to-blue-600', roles: ['personal'] },
    { icon: Building2, label: '企业服务台', path: '/enterprise', color: 'from-purple-500 to-purple-600', roles: ['enterprise'] },
    { icon: MapPin, label: '城市生活圈', path: '/city', color: 'from-green-500 to-green-600', roles: ['personal', 'enterprise', 'government'] },
    { icon: LayoutDashboard, label: '基层治理驾驶舱', path: '/governance', color: 'from-orange-500 to-orange-600', roles: ['government'] },
  ];

  const oneStopServices = [
    { icon: Baby, name: '新生儿出生五证联办', desc: '出生证明、户口登记、社保参保等一站式办理', color: 'bg-pink-100 text-pink-600' },
    { icon: GraduationCap, name: '入学一件事', desc: '报名、审核、缴费一站式完成', color: 'bg-blue-100 text-blue-600' },
    { icon: Heart, name: '退休一件事', desc: '养老保险、医疗保险、公积金提取联办', color: 'bg-green-100 text-green-600' },
    { icon: Car, name: '车辆过户一件事', desc: '交易、过户、保险变更一站式办理', color: 'bg-yellow-100 text-yellow-600' },
  ];

  const filteredEntries = quickEntries.filter(
    (entry) => !user?.idType || entry.roles.includes(user.idType)
  );

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
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium text-white/90">欢迎回来</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {user?.realName}，您好！
          </h1>
          <p className="text-white/80 text-sm">
            今天是{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}，祝您办事顺利
          </p>
          <div className="flex gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-2xl font-bold">{recentProgress?.items?.length || 0}</p>
              <p className="text-xs text-white/80">进行中的办件</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-2xl font-bold">{recommendedPolicies?.items?.length || 0}</p>
              <p className="text-xs text-white/80">为您推荐的政策</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-xs text-white/80">系统可用率</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">快捷入口</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredEntries.map((entry, idx) => (
            <Link key={idx} to={entry.path}>
              <Card hover className="h-full">
                <Card.Body className="flex flex-col items-center text-center p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${entry.color} flex items-center justify-center mb-3`}>
                    <entry.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-medium text-gray-900">{entry.label}</p>
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-2" />
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">一件事服务</h2>
          <Link to="/orchestration" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {oneStopServices.map((service, idx) => (
            <Card key={idx} hover>
              <Card.Body className="p-5">
                <div className={`w-10 h-10 rounded-lg ${service.color} flex items-center justify-center mb-3`}>
                  <service.icon className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{service.desc}</p>
                <Button size="sm" variant="outline" className="w-full mt-4">
                  立即办理
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>
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
              {recentProgress?.items?.length ? (
                <div className="divide-y divide-gray-100">
                  {recentProgress.items.map((item) => (
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
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {item.currentStep}/{item.totalSteps} 步
                        </span>
                        <span>提交于 {new Date(item.submitTime).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
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
              {recommendedPolicies?.items?.length ? (
                <div className="divide-y divide-gray-100">
                  {recommendedPolicies.items.map((policy) => (
                    <div key={policy.id} className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">{policy.title}</h4>
                        <span className="flex-shrink-0 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {policy.matchScore}% 匹配
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{policy.summary}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{policy.category}</span>
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
          <Card.Body>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">安全保障</h3>
                  <p className="text-sm text-gray-500">本系统通过等保三级认证，所有政务数据不出市云，采用AES-256加密存储</p>
                </div>
              </div>
              <div className="flex gap-3">
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


