'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Crown, Gift, Zap, Truck, Star, Headphones } from 'lucide-react';
import { MembershipCard } from '@/components/user/membership-card';
import { MembershipLevel } from '@pet/shared/enums';
import { MEMBERSHIP_BENEFITS } from '@pet/shared/constants';
import type { MembershipCardPackage } from '@pet/shared/types';

const mockPackages: MembershipCardPackage[] = [
  { id: '1', type: 'monthly', name: '月卡', price: 29.9, originalPrice: 49.9, durationDays: 30, benefits: ['9.8折优惠', '1.2倍积分', '每月3张优惠券'], gifts: [{ type: 'point', value: 200, description: '200积分' }], isHot: false, sortOrder: 1, status: 'active' },
  { id: '2', type: 'quarterly', name: '季卡', price: 79.9, originalPrice: 149.7, durationDays: 90, benefits: ['9.5折优惠', '1.5倍积分', '每月5张优惠券', '专属客服'], gifts: [{ type: 'point', value: 500, description: '500积分' }, { type: 'coupon', value: 20, description: '20元优惠券' }], isHot: true, sortOrder: 2, status: 'active' },
  { id: '3', type: 'yearly', name: '年卡', price: 269, originalPrice: 598.8, durationDays: 365, benefits: ['9.2折优惠', '2倍积分', '每月8张优惠券', 'VIP客服', '专属活动'], gifts: [{ type: 'point', value: 2000, description: '2000积分' }, { type: 'coupon', value: 50, description: '50元优惠券' }, { type: 'balance', value: 10, description: '10元余额' }], isHot: false, sortOrder: 3, status: 'active' },
  { id: '4', type: 'lifetime', name: '黑卡', price: 999, originalPrice: 1999, durationDays: 36500, benefits: ['8.5折优惠', '3倍积分', '无限包邮', '钻石客服', '专属活动', '新品优先'], gifts: [{ type: 'point', value: 10000, description: '10000积分' }, { type: 'coupon', value: 200, description: '200元优惠券' }, { type: 'balance', value: 50, description: '50元余额' }], isHot: false, sortOrder: 4, status: 'active' },
];

const benefitIcons: Record<string, typeof Zap> = {
  '折扣优惠': Zap,
  '积分加速': Star,
  '免费包邮': Truck,
  '专属客服': Headphones,
  '专属活动': Gift,
};

export default function MembershipPage() {
  const currentLevel = MembershipLevel.GOLD;
  const growthPoints = 25000;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <Link href="/user" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          返回个人主页
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">会员中心</h1>

        <div className="mb-6">
          <MembershipCard
            level={currentLevel}
            growthPoints={growthPoints}
            nickname="宠物爱好者"
          />
        </div>

        <div className="rounded-xl border bg-card p-6 mb-6">
          <h2 className="text-base font-semibold text-foreground mb-4">会员等级权益</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(MEMBERSHIP_BENEFITS).map(([level, benefits]) => {
              const levelLabels: Record<string, string> = {
                normal: '普通', bronze: '青铜', silver: '白银', gold: '黄金', platinum: '铂金', diamond: '钻石',
              };
              const isCurrentLevel = level === currentLevel;
              return (
                <div
                  key={level}
                  className={`rounded-lg border p-4 ${isCurrentLevel ? 'border-pet-orange ring-1 ring-pet-orange/30' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">{levelLabels[level]}</span>
                    {isCurrentLevel && (
                      <span className="rounded-full bg-pet-orange/10 px-2 py-0.5 text-xs text-pet-orange">当前</span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>{(benefits.discountRate * 10).toFixed(1)}折优惠</p>
                    <p>{benefits.pointMultiplier}x积分</p>
                    <p>满{benefits.freeShippingThreshold}包邮</p>
                    <p>{benefits.minGrowthPoints}+成长值</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-pet-gold" />
            <h2 className="text-base font-semibold text-foreground">黑卡购买</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-xl border bg-card p-5 relative ${
                  pkg.isHot ? 'border-pet-orange ring-1 ring-pet-orange/30' : ''
                }`}
              >
                {pkg.isHot && (
                  <span className="absolute -top-2 right-4 rounded-full bg-pet-orange px-2.5 py-0.5 text-xs text-white font-medium">
                    最受欢迎
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                  <span className="text-xs text-muted-foreground">{pkg.durationDays}天</span>
                </div>

                <div className="mb-3">
                  <span className="text-2xl font-bold text-pet-orange">¥{pkg.price}</span>
                  <span className="ml-2 text-sm text-muted-foreground line-through">¥{pkg.originalPrice}</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  {pkg.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-pet-teal shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>

                {pkg.gifts.length > 0 && (
                  <div className="mb-4 rounded-lg bg-pet-cream/50 p-2.5">
                    <p className="text-xs font-medium text-pet-orange mb-1">开卡赠送</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.gifts.map((gift, i) => (
                        <span key={i} className="rounded bg-white px-1.5 py-0.5 text-xs text-foreground">
                          {gift.description}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button className={`w-full rounded-full py-2 text-sm font-medium transition-colors ${
                  pkg.isHot
                    ? 'bg-pet-orange text-white hover:bg-pet-coral'
                    : 'border border-pet-orange text-pet-orange hover:bg-pet-orange hover:text-white'
                }`}>
                  立即开通
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
