import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CreditCard, ClipboardList, Search, TrendingUp, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { api } from '@/api/client';
import type { PolicyDocument } from '../../../shared/types';
import { cn } from '@/lib/utils';

const quickServices = [
  { name: '政策解读', icon: FileText, path: '/government/policy', color: 'from-primary-400 to-primary-600', desc: '最新政策AI智能解读' },
  { name: '证件办理', icon: CreditCard, path: '#', color: 'from-primary-400 to-primary-600', desc: '各类证件在线办理' },
  { name: '事项申报', icon: ClipboardList, path: '#', color: 'from-primary-400 to-primary-600', desc: '政务事项在线申报' },
  { name: '进度查询', icon: Search, path: '#', color: 'from-primary-400 to-primary-600', desc: '办件进度实时查询' },
];

const hotServices = [
  { id: '1', name: '身份证补办', desc: '居民身份证丢失补办', time: '3个工作日', icon: CreditCard },
  { id: '2', name: '社保查询', desc: '社会保险缴费记录查询', time: '即时办理', icon: Search },
  { id: '3', name: '公积金提取', desc: '住房公积金提取申请', time: '5个工作日', icon: ClipboardList },
  { id: '4', name: '营业执照办理', desc: '个体工商户营业执照', time: '7个工作日', icon: FileText },
  { id: '5', name: '不动产登记', desc: '房屋所有权登记', time: '10个工作日', icon: FileText },
];

const mockApplications = [
  { id: '1', name: '身份证补办', status: 'processing', time: '2024-06-13', estimated: '2024-06-16' },
  { id: '2', name: '公积金提取', status: 'completed', time: '2024-06-10', estimated: '2024-06-15' },
  { id: '3', name: '社保转移', status: 'pending', time: '2024-06-15', estimated: '2024-06-25' },
];

const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: 'text-warm-600', bgColor: 'bg-warm-100' },
  processing: { label: '处理中', color: 'text-primary-600', bgColor: 'bg-primary-100' },
  completed: { label: '已完成', color: 'text-eco-600', bgColor: 'bg-eco-100' },
};

export default function Government() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await api.government.getPolicies();
      setPolicies(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch (e) {
      console.error('Failed to load policies:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">政务服务</h1>
          <p className="text-gray-500 mt-1">政策解读、证件办理、事项申报一站式服务</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">今日办结 128 件</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickServices.map((service, index) => (
          <button
            key={service.name}
            onClick={() => navigate(service.path)}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-left group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn(
              'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg',
              service.color
            )}>
              <service.icon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              热门办事事项
            </h3>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {hotServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">{service.name}</h4>
                    <p className="text-sm text-gray-500">{service.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">{service.time}</p>
                    <p className="text-xs text-gray-500">办理时限</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              我的办件进度
            </h3>
            <span className="px-3 py-1 bg-primary-100 text-primary-600 text-sm font-medium rounded-full">
              {mockApplications.length} 件
            </span>
          </div>
          <div className="space-y-4">
            {mockApplications.map((app) => {
              const status = statusMap[app.status];
              return (
                <div key={app.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-800">{app.name}</p>
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-lg', status.bgColor, status.color)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      申请: {app.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      预计: {app.estimated}
                    </span>
                  </div>
                  {app.status === 'processing' && (
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: '60%' }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">已完成 60%</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button className="w-full mt-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-glow">
            查看全部办件
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            最新政策
          </h3>
          <button
            onClick={() => navigate('/government/policy')}
            className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : policies.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="p-5 border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate('/government/policy')}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-1 bg-primary-100 text-primary-600 text-xs font-medium rounded">
                    {policy.category}
                  </span>
                  <AlertCircle className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
                <h4 className="font-medium text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {policy.title}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{policy.publishDate}</span>
                  <div className="flex gap-1">
                    {policy.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">暂无政策数据</div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <FileText className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-3xl font-bold">1,286</p>
          <p className="text-sm opacity-80 mt-1">可办事项</p>
        </div>
        <div className="bg-gradient-to-br from-eco-500 to-eco-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-3xl font-bold">98.5%</p>
          <p className="text-sm opacity-80 mt-1">群众满意度</p>
        </div>
        <div className="bg-gradient-to-br from-warm-500 to-warm-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <Clock className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-3xl font-bold">2.3天</p>
          <p className="text-sm opacity-80 mt-1">平均办理时长</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <ClipboardList className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-3xl font-bold">12.5万</p>
          <p className="text-sm opacity-80 mt-1">本月办件量</p>
        </div>
      </div>
    </div>
  );
}
