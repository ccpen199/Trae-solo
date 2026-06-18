import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Truck,
  Users,
  Shield,
  User,
} from 'lucide-react';
import { SECONDHAND_CONDITION_MAP } from '@neighborhood/shared';

export default function SecondhandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [favorited, setFavorited] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'meetup'>('meetup');

  return (
    <div className="space-y-4">
      <Link
        to="/secondhand"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        返回二手市场
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-16 h-16 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-green">{SECONDHAND_CONDITION_MAP['like_new']}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-gray-900">
              九成新iPad Air 5 64G WiFi版
            </h1>
          </div>

          <div className="text-3xl font-bold text-red-500">¥2,800</div>

          <p className="text-sm text-gray-600 leading-relaxed">
            购买半年，使用频率很低，无划痕无磕碰，配件齐全，有购买凭证。
            因为换了新设备所以转让，支持验货。
          </p>

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4 text-community-orange" />
            <span>幸福花园 · 3号楼 · 可面交</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">交易方式</label>
            <div className="flex gap-3">
              <button
                onClick={() => setDeliveryType('meetup')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  deliveryType === 'meetup'
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                面交
              </button>
              <button
                onClick={() => setDeliveryType('delivery')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  deliveryType === 'delivery'
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Truck className="w-4 h-4" />
                快递
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900">卖家昵称</p>
                <p className="text-xs text-gray-500">在售 3 件 · 成交 5 笔</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setFavorited(!favorited)}
              className={`btn-secondary flex items-center gap-2 ${
                favorited ? 'text-red-500 border-red-200' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
              {favorited ? '已收藏' : '收藏'}
            </button>
            <button className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              立即购买（担保交易）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
