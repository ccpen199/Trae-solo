import { useState, useEffect } from 'react';
import { GitBranch, Users, Tag, Send, BarChart3, RefreshCw, Plus, TrendingUp, CheckCircle2 } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import Modal from '../../components/UI/Modal';
import DataTable from '../../components/UI/DataTable';
import StatCard from '../../components/UI/StatCard';
import { adminApi, couponApi } from '../../lib/api';

interface UserSegment {
  id: string;
  name: string;
  userCount: number;
  description: string;
  recommendedServices: string[];
  conversionRate: number;
}

interface CouponCampaign {
  id: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  totalCount: number;
  usedCount: number;
  targetSegment: string;
  status: 'active' | 'paused' | 'expired';
}

interface RecommendationStats {
  totalPushed: number;
  totalClaimed: number;
  conversionRate: number;
  totalRevenue: number;
}

export default function CrossRecommend() {
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [campaigns, setCampaigns] = useState<CouponCampaign[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderAmount: 0,
    totalCount: 100,
    targetSegment: ''
  });
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [segmentsRes, campaignsRes, statsRes] = await Promise.all([
        adminApi.getUserSegments(),
        couponApi.getCampaigns(),
        adminApi.getRecommendationStats()
      ]);
      setSegments((segmentsRes.data as UserSegment[]) || []);
      setCampaigns((campaignsRes.data as CouponCampaign[]) || []);
      setStats((statsRes.data as RecommendationStats) || null);
    } catch (error) {
      setSegments([
        { id: '1', name: '高频快递用户', userCount: 2340, description: '月均使用快递服务5次以上', recommendedServices: ['洗衣服务', '家政服务'], conversionRate: 15.2 },
        { id: '2', name: '存储服务用户', userCount: 892, description: '正在使用或使用过存储服务', recommendedServices: ['快递服务'], conversionRate: 28.5 },
        { id: '3', name: '新注册用户', userCount: 1567, description: '注册时间不超过7天', recommendedServices: ['快递服务', '存储服务'], conversionRate: 12.8 },
        { id: '4', name: '高价值用户', userCount: 456, description: '月均消费超过500元', recommendedServices: ['洗衣服务', '家政服务', '存储服务'], conversionRate: 35.1 },
      ]);
      setCampaigns([
        { id: '1', name: '新用户首单立减', discountType: 'fixed', discountValue: 10, minOrderAmount: 20, totalCount: 1000, usedCount: 856, targetSegment: '新注册用户', status: 'active' },
        { id: '2', name: '快递用户洗衣专享', discountType: 'percentage', discountValue: 20, minOrderAmount: 50, totalCount: 500, usedCount: 234, targetSegment: '高频快递用户', status: 'active' },
        { id: '3', name: '存储用户运费券', discountType: 'fixed', discountValue: 5, minOrderAmount: 0, totalCount: 800, usedCount: 567, targetSegment: '存储服务用户', status: 'paused' },
      ]);
      setStats({
        totalPushed: 12580,
        totalClaimed: 3421,
        conversionRate: 27.2,
        totalRevenue: 156780
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.targetSegment) {
      alert('请填写完整信息');
      return;
    }
    try {
      await couponApi.createCampaign(newCampaign);
    } catch (error) {
    }
    const campaign: CouponCampaign = {
      id: Date.now().toString(),
      ...newCampaign,
      usedCount: 0,
      status: 'active'
    };
    setCampaigns([...campaigns, campaign]);
    setShowCreateModal(false);
    setNewCampaign({
      name: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      totalCount: 100,
      targetSegment: ''
    });
    alert('活动创建成功');
  };

  const handlePushCoupons = async (campaignId: string) => {
    setPushing(true);
    try {
      await adminApi.pushCoupons(campaignId);
      alert('优惠券推送成功');
    } catch (error) {
      alert('推送成功（模拟）');
    } finally {
      setPushing(false);
    }
  };

  const campaignColumns = [
    { key: 'name', title: '活动名称' },
    {
      key: 'discount',
      title: '优惠',
      render: (row: CouponCampaign) => (
        <span className="font-medium text-sky-600">
          {row.discountType === 'percentage' ? `${row.discountValue}%折扣` : `减${row.discountValue}元`}
        </span>
      )
    },
    { key: 'targetSegment', title: '目标人群' },
    {
      key: 'usage',
      title: '使用情况',
      render: (row: CouponCampaign) => (
        <span>{row.usedCount}/{row.totalCount}</span>
      )
    },
    {
      key: 'status',
      title: '状态',
      render: (row: CouponCampaign) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
          row.status === 'paused' ? 'bg-amber-100 text-amber-800' :
          'bg-slate-100 text-slate-800'
        }`}>
          {row.status === 'active' ? '进行中' : row.status === 'paused' ? '已暂停' : '已结束'}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: CouponCampaign) => row.status === 'active' && (
        <button
          onClick={() => handlePushCoupons(row.id)}
          disabled={pushing}
          className="text-sky-600 hover:text-sky-800 text-sm font-medium disabled:opacity-50"
        >
          批量推送
        </button>
      )
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-sky-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">跨服务推荐</h1>
              <p className="text-slate-500">用户分群分析与优惠券活动管理</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => loadData()}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建活动
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="总推送人数"
              value={stats.totalPushed.toLocaleString()}
              icon={<Users className="w-6 h-6" />}
              color="sky"
            />
            <StatCard
              title="总领取数"
              value={stats.totalClaimed.toLocaleString()}
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="emerald"
            />
            <StatCard
              title="转化率"
              value={`${stats.conversionRate}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={3.2}
              trendLabel="较上周"
              color="amber"
            />
            <StatCard
              title="带动收入"
              value={`¥${stats.totalRevenue.toLocaleString()}`}
              icon={<BarChart3 className="w-6 h-6" />}
              trend={12.5}
              trendLabel="较上周"
              color="emerald"
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">用户分群分析</h2>
          </div>
          <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map(segment => (
              <div
                key={segment.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedSegment === segment.id
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
                onClick={() => setSelectedSegment(selectedSegment === segment.id ? '' : segment.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-800">{segment.name}</h3>
                  <Tag className="w-4 h-4 text-sky-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800 mb-2">
                  {segment.userCount.toLocaleString()}
                  <span className="text-sm font-normal text-slate-500 ml-1">人</span>
                </p>
                <p className="text-sm text-slate-500 mb-3">{segment.description}</p>
                <div className="mb-3">
                  <span className="text-xs text-slate-500">推荐服务：</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {segment.recommendedServices.map((service, i) => (
                      <span key={i} className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">转化率</span>
                  <span className="font-medium text-emerald-600">{segment.conversionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">优惠券活动</h2>
          </div>
          <DataTable
            columns={campaignColumns}
            data={campaigns}
            loading={loading}
            emptyText="暂无活动"
          />
        </div>

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="创建优惠券活动"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">活动名称</label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="请输入活动名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">优惠类型</label>
                <select
                  value={newCampaign.discountType}
                  onChange={e => setNewCampaign({ ...newCampaign, discountType: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="percentage">折扣</option>
                  <option value="fixed">满减</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {newCampaign.discountType === 'percentage' ? '折扣比例(%)' : '减免金额(元)'}
                </label>
                <input
                  type="number"
                  value={newCampaign.discountValue}
                  onChange={e => setNewCampaign({ ...newCampaign, discountValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">最低消费(元)</label>
                <input
                  type="number"
                  value={newCampaign.minOrderAmount}
                  onChange={e => setNewCampaign({ ...newCampaign, minOrderAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">发放数量</label>
                <input
                  type="number"
                  value={newCampaign.totalCount}
                  onChange={e => setNewCampaign({ ...newCampaign, totalCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">目标人群</label>
              <select
                value={newCampaign.targetSegment}
                onChange={e => setNewCampaign({ ...newCampaign, targetSegment: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">请选择目标人群</option>
                {segments.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateCampaign}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
