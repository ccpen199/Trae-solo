import { useState } from 'react';
import {
  Store,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  Award,
  ChevronRight,
} from 'lucide-react';
import { PARTNER_LEVEL_MAP } from '@neighborhood/shared';
import type { PartnerLevel } from '@neighborhood/shared';
import * as partnerApi from '@/api/partner';

export default function PartnerPage() {
  const [isPartner] = useState(true);
  const [level] = useState<PartnerLevel>('bronze');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const currentLevel = PARTNER_LEVEL_MAP[level];

  if (!isPartner) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="card text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">成为社区合伙人</h2>
          <p className="text-sm text-gray-500 mb-6">
            开设自己的社区小店，分享商品赚取佣金
          </p>
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn-primary"
          >
            立即申请
          </button>
        </div>

        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">申请成为合伙人</h3>
              <div className="space-y-3">
                <input placeholder="店铺名称" className="input-field" />
                <textarea placeholder="店铺简介" className="input-field min-h-[80px]" />
                <div className="flex gap-3">
                  <button onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1">
                    取消
                  </button>
                  <button
                    onClick={() => {
                      partnerApi.applyPartner({});
                      setShowApplyModal(false);
                    }}
                    className="btn-primary flex-1"
                  >
                    提交申请
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            <span className="font-medium">我的店铺</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-sm">
            <Award className="w-4 h-4" />
            {currentLevel.label}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold">¥1,280</div>
            <div className="text-xs text-primary-200">总佣金</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">¥580</div>
            <div className="text-xs text-primary-200">可提现</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">¥200</div>
            <div className="text-xs text-primary-200">冻结中</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">¥500</div>
            <div className="text-xs text-primary-200">已结算</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">总销售额</p>
            <p className="text-lg font-bold text-gray-900">¥8,560</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">邀请人数</p>
            <p className="text-lg font-bold text-gray-900">12</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">佣金记录</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">商品佣金</p>
                <p className="text-xs text-gray-400">2024-01-{10 + i}</p>
              </div>
              <span className="text-sm font-bold text-green-500">+¥{(i * 3.5).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">邀请树</h3>
        <div className="flex items-center gap-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
            我
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
            A
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
            B
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">结算记录</h3>
          <button className="btn-primary text-sm">申请结算</button>
        </div>
        <div className="text-sm text-gray-500">
          暂无结算记录
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-2">升级路径</h3>
        <div className="flex gap-2">
          {(Object.entries(PARTNER_LEVEL_MAP) as [PartnerLevel, typeof currentLevel][]).map(
            ([key, val]) => (
              <div
                key={key}
                className={`flex-1 p-2 rounded-lg text-center text-xs ${
                  key === level
                    ? 'bg-primary-50 text-primary-600 font-bold'
                    : 'bg-gray-50 text-gray-500'
                }`}
              >
                <div>{val.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  ≥¥{val.minRequirement}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
