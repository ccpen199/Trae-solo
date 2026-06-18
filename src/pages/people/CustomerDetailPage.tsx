import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Calendar, ShoppingBag, MessageSquare, Star, Tag, UserPlus } from 'lucide-react';
import { getCustomer, getProductTrace } from '../../services/api';
import type { Customer } from '../../../shared/types';

const levelConfig: Record<string, { label: string; color: string; bg: string }> = {
  vip: { label: 'VIP客户', color: 'text-amber-600', bg: 'bg-amber-100' },
  regular: { label: '普通客户', color: 'text-brand-600', bg: 'bg-brand-100' },
  potential: { label: '潜在客户', color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'purchase' | 'service' | 'follow'>('info');

  useEffect(() => {
    if (id) {
      fetchCustomer(parseInt(id));
    }
  }, [id]);

  const fetchCustomer = async (customerId: number) => {
    try {
      setLoading(true);
      const res = await getCustomer(customerId);
      if (res.code === 0) {
        setCustomer(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const purchaseHistory = [
    { id: 1, date: '2024-06-10', product: '国珍松花粉', amount: 398, status: '已完成' },
    { id: 2, date: '2024-05-20', product: '松花伴侣片', amount: 298, status: '已完成' },
    { id: 3, date: '2024-04-15', product: '竹康宁片', amount: 498, status: '已完成' },
    { id: 4, date: '2024-03-28', product: '亚麻籽油', amount: 198, status: '已完成' },
  ];

  const serviceRecords = [
    { id: 1, date: '2024-06-15', type: '健康检测', store: '北京朝阳生活馆', result: '血脂略高，建议清淡饮食' },
    { id: 2, date: '2024-05-10', type: '产品体验', store: '北京朝阳生活馆', result: '体验松花粉，效果良好' },
  ];

  const followUpRecords = [
    { id: 1, date: '2024-06-12', type: '电话回访', content: '询问产品使用效果，客户反馈良好', operator: '陈明' },
    { id: 2, date: '2024-06-05', type: '微信沟通', content: '发送新品介绍，客户表示感兴趣', operator: '陈明' },
    { id: 3, date: '2024-05-28', type: '到店服务', content: '客户到店体验理疗服务', operator: '陈明' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">客户不存在</p>
        <button onClick={() => navigate('/people/customers')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  const totalSpent = purchaseHistory.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/people/customers')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回客户列表
      </button>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold">
            {customer.name[0]}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelConfig[customer.level].bg} ${levelConfig[customer.level].color}`}>
                {levelConfig[customer.level].label}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <UserPlus className="w-4 h-4" />
                <span>{customer.source}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <ShoppingBag className="w-4 h-4" />
                <span>累计消费 ¥{customer.totalPurchases.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>注册于 {customer.createdAt.slice(0, 10)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {customer.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn btn-primary">
              <MessageSquare className="w-4 h-4 mr-2" />
              发送消息
            </button>
            <button className="btn btn-secondary">
              <Phone className="w-4 h-4 mr-2" />
              拨打电话
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{purchaseHistory.length}</p>
          <p className="text-sm text-gray-500 mt-1">订单数</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-brand-600">¥{totalSpent.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">累计消费</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{serviceRecords.length}</p>
          <p className="text-sm text-gray-500 mt-1">服务次数</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-rose-600">
            {customer.lastPurchaseAt ? new Date(customer.lastPurchaseAt).toLocaleDateString() : '-'}
          </p>
          <p className="text-sm text-gray-500 mt-1">最近消费</p>
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'info', label: '基本信息' },
            { key: 'purchase', label: '购买记录' },
            { key: 'service', label: '服务记录' },
            { key: 'follow', label: '跟进记录' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">个人信息</h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">姓名</span>
                    <span className="font-medium">{customer.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">手机号</span>
                    <span className="font-medium">{customer.phone}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">客户等级</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelConfig[customer.level].bg} ${levelConfig[customer.level].color}`}>
                      {levelConfig[customer.level].label}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">客户来源</span>
                    <span className="font-medium">{customer.source}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">消费信息</h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">累计消费</span>
                    <span className="font-medium text-primary-600">¥{customer.totalPurchases.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">最近消费</span>
                    <span className="font-medium">{customer.lastPurchaseAt ? new Date(customer.lastPurchaseAt).toLocaleDateString() : '暂无消费'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">注册时间</span>
                    <span className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'purchase' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">日期</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">产品</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">金额</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchaseHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{record.date}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.product}</td>
                      <td className="px-4 py-3 text-sm font-medium text-primary-600">¥{record.amount}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-4">
              {serviceRecords.map((record) => (
                <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                        {record.type}
                      </span>
                      <span className="text-sm text-gray-500">{record.date}</span>
                    </div>
                    <span className="text-sm text-gray-500">{record.store}</span>
                  </div>
                  <p className="text-sm text-gray-700">{record.result}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'follow' && (
            <div className="space-y-4">
              {followUpRecords.map((record) => (
                <div key={record.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    <div className="w-px h-full bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900">{record.type}</span>
                      <span className="text-sm text-gray-500">{record.date}</span>
                      <span className="text-sm text-gray-400">跟进人：{record.operator}</span>
                    </div>
                    <p className="text-sm text-gray-600">{record.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
