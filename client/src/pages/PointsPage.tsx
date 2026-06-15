import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatDate } from '../utils/format';
import Card from '../components/Card';
import Button from '../components/Button';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import { useAuthStore } from '../stores/authStore';
import type { Coupon, DonationProject, PointRecord } from '@/types/shared';

const tabs = [
  { key: 'mall', label: '积分商城', icon: '🎁' },
  { key: 'donation', label: '公益捐赠', icon: '❤️' },
  { key: 'records', label: '积分明细', icon: '📋' },
];

export default function PointsPage() {
  const { user, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mall');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [donations, setDonations] = useState<DonationProject[]>([]);
  const [records, setRecords] = useState<PointRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [activeTab, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'mall') {
        const res = await api.get('/points/coupons');
        setCoupons(res.data.data);
      } else if (activeTab === 'donation') {
        const res = await api.get('/points/donations');
        setDonations(res.data.data);
      } else if (activeTab === 'records') {
        const res = await api.get('/points/records');
        setRecords(res.data.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (id: string, pointsRequired: number) => {
    if (!user || user.points < pointsRequired) {
      alert('积分不足');
      return;
    }
    try {
      const res = await api.post(`/points/coupons/${id}/redeem`);
      alert(res.data.message);
      fetchProfile();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || '兑换失败');
    }
  };

  const handleDonate = async (id: string, pointsRequired: number) => {
    if (!user || user.points < pointsRequired) {
      alert('积分不足');
      return;
    }
    try {
      const res = await api.post(`/points/donations/${id}/donate`);
      alert(res.data.message);
      fetchProfile();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || '捐赠失败');
    }
  };

  if (!user) return null;

  return (
    <div>
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌸</span>
              <span className="text-lg font-medium">我的小红花</span>
            </div>
            <div className="text-4xl font-bold mb-1">{user.points.toLocaleString()}</div>
            <p className="text-primary-100 text-sm">等级 Lv.{user.level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-100 mb-2">今日已获得</p>
            <p className="text-2xl font-bold">+5</p>
            <p className="text-xs text-primary-200 mt-1">每日登录奖励</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12">
          <Loading text="加载中..." />
        </div>
      ) : (
        <>
          {activeTab === 'mall' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className="overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-50 relative">
                    <img
                      src={coupon.image}
                      alt={coupon.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {coupon.pointsRequired} 🌸
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{coupon.merchantName}</p>
                    <h3 className="font-semibold text-gray-800 mb-1">{coupon.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{coupon.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        有效期至 {formatDate(coupon.validUntil)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleRedeem(coupon.id, coupon.pointsRequired)}
                        disabled={coupon.stock <= 0 || user.points < coupon.pointsRequired}
                      >
                        {coupon.stock <= 0 ? '已兑完' : '立即兑换'}
                      </Button>
                    </div>
                    {coupon.stock > 0 && (
                      <p className="text-xs text-gray-400 mt-2">剩余 {coupon.stock} 张</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'donation' && (
            <div className="space-y-4">
              {donations.map((donation) => (
                <Card key={donation.id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={donation.image}
                      alt={donation.title}
                      className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{donation.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{donation.description}</p>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>已筹 {donation.currentAmount.toLocaleString()} 🌸</span>
                          <span>目标 {donation.targetAmount.toLocaleString()} 🌸</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary-400 to-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((donation.currentAmount / donation.targetAmount) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          已有 {donation.donorCount} 人参与 · {donation.pointsRequired}🌸/次
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleDonate(donation.id, donation.pointsRequired)}
                          disabled={user.points < donation.pointsRequired}
                        >
                          我要捐赠
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'records' && (
            <Card>
              {records.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  暂无积分记录
                </div>
              ) : (
                <div className="divide-y">
                  {records.map((record) => (
                    <div key={record.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span>{record.type === 'earn' ? '📈' : '📉'}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{record.reason}</p>
                          <p className="text-xs text-gray-400">{formatDate(record.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-lg ${
                        record.type === 'earn' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.type === 'earn' ? '+' : '-'}{record.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      <Card className="mt-6 p-4">
        <h3 className="font-semibold text-gray-800 mb-3">💡 如何获取小红花？</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '📅', label: '每日登录', points: '+5' },
            { icon: '📝', label: '发布爆料', points: '+10' },
            { icon: '✅', label: '爆料通过审核', points: '+5' },
            { icon: '🎉', label: '参加活动', points: '+5' },
            { icon: '🏆', label: '发起活动', points: '+20' },
            { icon: '👥', label: '创建圈子', points: '+50' },
            { icon: '❤️', label: '公益捐赠', points: '+10' },
            { icon: '💬', label: '评论互动', points: '+2' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm text-gray-700">{item.label}</p>
                <p className="text-xs text-primary-600 font-medium">{item.points} 🌸</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
