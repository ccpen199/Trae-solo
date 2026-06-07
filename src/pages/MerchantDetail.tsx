import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Phone, MessageCircle, Heart } from 'lucide-react';
import type { Merchant } from '@/types';

const mockMerchant: Merchant = {
  id: 1,
  name: '阳光超市',
  category: '便民超市',
  rating: 4.8,
  address: '社区东门1号商铺',
  phone: '010-12345678',
  description: '阳光超市成立于2018年，是社区内最大的便民超市。提供日常生活用品、新鲜蔬菜水果、零食饮料、米面粮油等商品。我们承诺：品质保证、价格实惠、服务周到。支持微信、支付宝、刷卡等多种支付方式，支持线上下单送货上门。',
  image: 'https://picsum.photos/seed/shop1/800/400',
  businessHours: '07:00-22:00',
  isOpen: true,
};

const services = [
  { icon: '📦', name: '送货上门', desc: '满39元免费配送' },
  { icon: '💳', name: '多种支付', desc: '微信/支付宝/刷卡' },
  { icon: '🎫', name: '会员折扣', desc: '会员享95折优惠' },
  { icon: '📞', name: '电话预订', desc: '提前电话预订商品' },
];

const MerchantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/merchants')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">商家详情</h1>
          <p className="text-gray-500 mt-1">商家编号 #{id}</p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="relative h-64">
          <img
            src={mockMerchant.image}
            alt={mockMerchant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4">
              <h2 className="text-2xl font-bold text-gray-900 font-serif">{mockMerchant.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge bg-secondary-100 text-secondary-700">{mockMerchant.category}</span>
                <span className={`text-sm font-medium ${mockMerchant.isOpen ? 'text-accent-green-600' : 'text-gray-400'}`}>
                  {mockMerchant.isOpen ? '营业中' : '已打烊'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2">
              <Star className="w-5 h-5 text-accent-yellow-500 fill-current" />
              <span className="text-xl font-bold text-gray-900">{mockMerchant.rating}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">基本信息</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">地址</p>
                <p className="text-gray-900">{mockMerchant.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">联系电话</p>
                <p className="text-gray-900">{mockMerchant.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">营业时间</p>
                <p className="text-gray-900">{mockMerchant.businessHours}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">服务特色</h3>
          <div className="grid grid-cols-2 gap-3">
            {services.map((service, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-xl text-center">
                <div className="text-2xl mb-1">{service.icon}</div>
                <p className="font-medium text-gray-900 text-sm">{service.name}</p>
                <p className="text-xs text-gray-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 font-serif">商家介绍</h3>
        <p className="text-gray-600 leading-relaxed">{mockMerchant.description}</p>
      </div>

      <div className="flex gap-4">
        <button className="flex-1 btn-outline flex items-center justify-center gap-2">
          <Heart className="w-5 h-5" />
          收藏商家
        </button>
        <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5" />
          联系商家
        </button>
        <a
          href={`tel:${mockMerchant.phone}`}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <Phone className="w-5 h-5" />
          拨打电话
        </a>
      </div>
    </div>
  );
};

export default MerchantDetail;
