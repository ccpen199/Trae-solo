import { useState, useEffect } from 'react';
import { Card, Button, message, Spin } from 'antd';
import { CrownOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useUserStore } from '../store/userStore';

interface VipInfo {
  price: number;
  original_price: number;
  benefits: string[];
}

export default function Vip() {
  const [vipInfo, setVipInfo] = useState<VipInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn, user, fetchUser } = useUserStore();

  useEffect(() => {
    fetchVipInfo();
    if (isLoggedIn) {
      fetchUser();
    }
  }, [isLoggedIn, fetchUser]);

  const fetchVipInfo = async () => {
    try {
      const res = await api.get<VipInfo>('/home/vip-info');
      if (res.success) setVipInfo(res.data || null);
    } catch (error) {
      console.error('Failed to fetch VIP info:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      message.info('请先登录');
      navigate('/login');
      return;
    }

    if (user?.is_vip) {
      message.info('您已经是VIP会员了');
      return;
    }

    setPaying(true);
    try {
      const orderRes = await api.post<{ order_no: string }>('/order/create', {
        type: 'vip',
        item_id: 1,
      });

      if (orderRes.success && orderRes.data?.order_no) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const payRes = await api.post('/order/pay', {
          order_no: orderRes.data.order_no,
        });

        if (payRes.success) {
          message.success('恭喜您，VIP开通成功！');
          await fetchUser();
          setTimeout(() => {
            navigate('/');
          }, 1000);
        } else {
          message.error('支付失败，请重试');
        }
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      message.error('开通失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  if (!vipInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-yellow-400 via-orange-400 to-orange-500 px-4 pt-12 pb-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CrownOutlined className="text-5xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">樊登读书VIP会员</h1>
          <p className="text-white/90">让阅读成为一种生活方式</p>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <div className="text-center py-6">
            <div className="mb-4">
              <span className="text-gray-400 line-through text-lg">¥{vipInfo.original_price}</span>
              <span className="text-4xl font-bold text-orange-500 ml-2">¥{vipInfo.price}</span>
              <span className="text-gray-500 ml-1">/年</span>
            </div>

            {user?.is_vip ? (
              <div className="space-y-3">
                <Button type="primary" size="large" disabled className="w-full h-12 text-lg bg-green-500 border-green-500">
                  <CheckCircleOutlined /> 您已是VIP会员
                </Button>
                <Button size="large" className="w-full h-12 text-lg" onClick={() => navigate('/')}>
                  前往首页听书
                </Button>
              </div>
            ) : (
              <Button 
                type="primary" 
                size="large" 
                className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-orange-600 border-none"
                onClick={handleSubscribe}
                loading={paying}
                icon={paying ? <LoadingOutlined /> : undefined}
              >
                {paying ? '开通中...' : '立即开通VIP会员'}
              </Button>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">VIP会员权益</h3>
            <div className="space-y-2">
              {vipInfo.benefits.map((item, index) => (
                <div key={index} className="py-2 flex items-center">
                  <CheckCircleOutlined className="text-green-500 mr-3 text-lg" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
          <h3 className="font-bold text-gray-800 mb-3">会员须知</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• VIP会员有效期为365天，自开通之日起计算</li>
            <li>• 会员权益仅限本人使用，不得转借他人</li>
            <li>• 会员期间可畅听全场VIP书籍内容</li>
            <li>• 如有疑问请联系客服</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
