import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  ArrowRight,
  Zap,
  Shield,
  Smile,
  Search,
  User,
  BarChart3,
} from 'lucide-react';
import { applicationApi, serviceApi, licenseApi } from '../api';
import { Application, ServiceItem, License } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentServices, setRecentServices] = useState<ServiceItem[]>([]);
  const [myLicenses, setMyLicenses] = useState<License[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          statsRes,
          servicesRes,
          licensesRes,
          applicationsRes,
        ] = await Promise.all([
          applicationApi.getStats(),
          serviceApi.search({ page: 1, pageSize: 4 }),
          licenseApi.getMyLicenses(),
          applicationApi.getMyApplications({ page: 1, pageSize: 5 }),
        ]);

        if (statsRes.success) {
          const mineData = statsRes.data?.mine || statsRes.data?.all || [];
          const statsMap: any = { total: 0, processing: 0, completed: 0, draft: 0, submitted: 0, reviewing: 0, approved: 0, rejected: 0 };
          for (const item of mineData) {
            statsMap[item.status] = item.count;
            statsMap.total += item.count;
          }
          setStats(statsMap);
        }
        if (servicesRes.success) setRecentServices(servicesRes.data || []);
        if (licensesRes.success) setMyLicenses(licensesRes.data || []);
        if (applicationsRes.success) setMyApplications(applicationsRes.data || []);
      } catch (e) {
        console.error('Load dashboard data error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const statusConfig = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    submitted: { label: '已提交', color: 'bg-blue-100 text-blue-600' },
    reviewing: { label: '审核中', color: 'bg-yellow-100 text-yellow-600' },
    processing: { label: '审批中', color: 'bg-yellow-100 text-yellow-600' },
    approved: { label: '已批准', color: 'bg-green-100 text-green-600' },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-600' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
    pending: { label: '待处理', color: 'bg-gray-100 text-gray-600' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">欢迎使用安徽省一体化政务服务平台</h2>
            <p className="text-primary-100 mb-4">
              智能情形引导 · 电子材料免提交 · 极简表单 · 跨部门并联审批
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-300" />
                <span>秒级响应</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-300" />
                <span>安全可靠</span>
              </div>
              <div className="flex items-center">
                <Smile className="w-4 h-4 mr-2 text-pink-300" />
                <span>一网通办</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/services')}
            className="flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
          >
            立即办事 <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { title: '个人中心', desc: '查看我的办件、证照和账号资料', path: '/applications', icon: User },
          { title: '搜索筛选服务', desc: '按事项名称、编码和分类筛选服务', path: '/services', icon: Search },
          { title: '提交申请', desc: '进入热门事项详情并提交办理申请', path: recentServices[0] ? `/services/${recentServices[0].id}` : '/services', icon: FileText },
          { title: '后台管理', desc: '进入服务效能监测和运营看板', path: '/monitor', icon: BarChart3 },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl p-5 shadow-sm text-left hover:shadow-md hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="ml-3 font-semibold text-gray-900">{item.title}</span>
              </div>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: '我的办件',
            value: stats?.total || 0,
            icon: FileText,
            color: 'bg-blue-50 text-blue-600',
            bgIcon: 'bg-blue-100',
          },
          {
            label: '办理中',
            value: stats?.processing || 0,
            icon: Clock,
            color: 'bg-yellow-50 text-yellow-600',
            bgIcon: 'bg-yellow-100',
          },
          {
            label: '已完成',
            value: stats?.completed || 0,
            icon: CheckCircle,
            color: 'bg-green-50 text-green-600',
            bgIcon: 'bg-green-100',
          },
          {
            label: '我的证照',
            value: myLicenses.length,
            icon: CreditCard,
            color: 'bg-purple-50 text-purple-600',
            bgIcon: 'bg-purple-100',
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
                <div className={`w-12 h-12 ${item.bgIcon} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-current" style={{ color: item.color.split(' ')[1] }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">热门服务</h3>
            <button
              onClick={() => navigate('/services')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              查看全部 <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {recentServices.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/services/${service.id}`)}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{service.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{service.department}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {service.handlingTimeLimit || service.handlingLimit}个工作日
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded">
                    {service.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">我的证照</h3>
            <button
              onClick={() => navigate('/licenses')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              全部 <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            {myLicenses.slice(0, 4).map((license) => (
              <div
                key={license.id}
                onClick={() => navigate(`/licenses/${license.id}`)}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {license.licenseType}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{license.licenseNumber}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    license.status === 'valid'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {license.status === 'valid' ? '有效' : '过期'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">最近办件</h3>
          <button
            onClick={() => navigate('/applications')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          >
            全部办件 <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">办件编号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">事项名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">当前状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">申请时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {myApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    暂无办件记录
                  </td>
                </tr>
              ) : (
                myApplications.map((app) => {
                  const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.submitted;
                  return (
                    <tr
                      key={app.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">{app.applicationNo}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{app.serviceItemName}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(app.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
