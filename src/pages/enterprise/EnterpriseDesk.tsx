import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, GitBranch, Wallet, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useGet } from '../../hooks/useApi';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import type { EnterpriseInfo } from '../../../shared/types';

const tabs = [
  { path: 'lifecycle', icon: GitBranch, label: '生命周期图谱' },
  { path: 'subsidies', icon: Wallet, label: '补贴申领' },
];

export default function EnterpriseDesk() {
  const location = useLocation();
  const { user } = useAuthStore();

  const isRoot = location.pathname === '/enterprise';

  const { data: enterpriseInfo } = useGet<EnterpriseInfo>(
    ['enterpriseInfo'],
    '/enterprise/info'
  );

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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {enterpriseInfo?.name || user?.realName}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>统一社会信用代码：{enterpriseInfo?.creditCode || '91350200**********'}</span>
                <StatusBadge
                  status={enterpriseInfo?.status === 'active' ? 'success' : enterpriseInfo?.status === 'abnormal' ? 'warning' : 'error'}
                  text={enterpriseInfo?.status === 'active' ? '正常存续' : enterpriseInfo?.status === 'abnormal' ? '经营异常' : '已注销'}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                <span>法定代表人：{enterpriseInfo?.legalPerson || '张三'}</span>
                <span>成立日期：{enterpriseInfo?.establishDate || '2018-06-15'}</span>
                <span>所属行业：{enterpriseInfo?.industry || '软件和信息技术服务业'}</span>
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
            <p className="text-2xl font-bold text-gray-900">¥1.2亿</p>
            <p className="text-sm text-gray-500">年营业额</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="text-sm text-gray-500">已申领补贴</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 flex items-center justify-center mb-3">
              <GitBranch className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">成长期</p>
            <p className="text-sm text-gray-500">生命周期阶段</p>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tabs.map((tab) => (
          <Link key={tab.path} to={tab.path}>
            <Card hover>
              <Card.Body className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <tab.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tab.label}</h3>
                      <p className="text-sm text-gray-500">
                        {tab.path === 'lifecycle' ? '可视化查看企业全生命周期服务节点' :
                         '查看和申请各类企业扶持补贴政策'}
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

      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900">最近办件</h3>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-gray-100">
            {[
              { name: '高新技术企业认定', status: 'processing', time: '2024-01-15', progress: 60 },
              { name: '稳岗返还补贴申领', status: 'completed', time: '2024-01-10', progress: 100 },
              { name: '社保公积金开户', status: 'completed', time: '2024-01-05', progress: 100 },
            ].map((item, idx) => (
              <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <StatusBadge
                    status={item.status === 'completed' ? 'success' : 'processing'}
                    text={item.status === 'completed' ? '已完成' : '办理中'}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>申请时间：{item.time}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${item.progress}%` }}
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
