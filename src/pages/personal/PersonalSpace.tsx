import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Clock, FileText, ChevronRight, User, Shield, Smartphone, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/Card';
import { cn } from '../../lib/utils';

const tabs = [
  { path: 'certificates', icon: CreditCard, label: '证照库' },
  { path: 'progress', icon: Clock, label: '办事进度' },
  { path: 'policies', icon: FileText, label: '政策推送' },
];

export default function PersonalSpace() {
  const location = useLocation();
  const { user } = useAuthStore();

  const isRoot = location.pathname === '/personal';

  if (!isRoot) {
    return <Outlet />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Card.Body>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.realName}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>手机号：{user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                {user?.verified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    已实名认证
                  </span>
                )}
                <span>认证等级：L{user?.authLevel}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                个人用户
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <Link key={tab.path} to={tab.path}>
            <Card hover>
              <Card.Body className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <tab.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tab.label}</h3>
                      <p className="text-sm text-gray-500">
                        {tab.path === 'certificates' ? '管理您的电子证照' :
                         tab.path === 'progress' ? '查看办件办理进度' :
                         '查看为您匹配的政策'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card.Body>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <Card.Header>
            <h3 className="font-semibold text-gray-900">数据授权管理</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {[
                { name: '厦门市人社局', scope: '社保信息查询', expires: '2025-12-31', status: 'active' },
                { name: '厦门市公积金中心', scope: '公积金信息查询', expires: '2025-12-31', status: 'active' },
                { name: '厦门市卫健委', scope: '健康档案查询', expires: '已过期', status: 'expired' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">授权范围：{item.scope}</p>
                    <p className="text-xs text-gray-400">有效期至：{item.expires}</p>
                  </div>
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-medium',
                    item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    {item.status === 'active' ? '已授权' : '已过期'}
                  </span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

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
          </Card.Body>
        </Card>
      </div>
    </motion.div>
  );
}


