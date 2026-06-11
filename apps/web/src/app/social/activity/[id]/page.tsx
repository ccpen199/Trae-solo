'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Gift, Clock, ChevronRight, Share2 } from 'lucide-react';
import type { ActivityEvent, ActivityParticipationStatus } from '@pet/shared/types';

const mockActivity: ActivityEvent = {
  id: '1', title: '春季宠物摄影大赛', description: '晒出你家萌宠的最美瞬间，赢取丰厚奖品！\n\n拍摄你家宠物的精彩瞬间，上传至社区参与评选。我们将从所有参赛作品中评选出一、二、三等奖，还有幸运抽奖环节！', coverImage: undefined, type: ['post', 'lottery'], startTime: new Date(), endTime: new Date(Date.now() + 7 * 86400000), participationCount: 234, maxParticipants: 1000, prizes: [
    { id: '1', activityId: '1', name: '宠物相机 📷', type: 'product', value: 299, quantity: 1, wonCount: 0, probability: 0.01, sortOrder: 1 },
    { id: '2', activityId: '1', name: '100积分', type: 'point', value: 100, quantity: 50, wonCount: 12, probability: 0.2, sortOrder: 2 },
    { id: '3', activityId: '1', name: '20元优惠券', type: 'coupon', value: 20, quantity: 100, wonCount: 34, probability: 0.4, sortOrder: 3 },
  ], rules: ['每人限参与一次', '作品需为原创', '禁止盗图或使用网络图片', '获奖后需在7天内提供收货地址'], isHot: true, status: 'active', createdAt: new Date(), updatedAt: new Date(),
};

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const activity = mockActivity;
  const [participationStatus, setParticipationStatus] = useState<ActivityParticipationStatus>('not_participated');
  const [showPrizeAnimation, setShowPrizeAnimation] = useState(false);

  const handleParticipate = () => {
    setShowPrizeAnimation(true);
    setTimeout(() => {
      setParticipationStatus('participated');
      setShowPrizeAnimation(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <Link href="/social/activity" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          返回活动列表
        </Link>

        {activity.coverImage && (
          <div className="relative aspect-[2/1] rounded-xl overflow-hidden bg-muted mb-4">
            <img src={activity.coverImage} alt={activity.title} className="h-full w-full object-cover" />
            {activity.isHot && (
              <span className="absolute top-3 left-3 rounded bg-pet-orange px-2.5 py-1 text-xs text-white font-medium">
                🔥 热门活动
              </span>
            )}
          </div>
        )}

        <div className="rounded-xl border bg-card p-6 mb-4">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-2xl font-bold text-foreground">{activity.title}</h1>
            <button className="p-2 rounded-md hover:bg-muted">
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap">
            {activity.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {activity.status === 'active' ? '进行中' : activity.status === 'ended' ? '已结束' : '未开始'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {activity.participationCount}/{activity.maxParticipants || '∞'}人
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {activity.type.map((t) => (
              <span key={t} className="rounded bg-pet-cream px-2 py-0.5 text-xs text-pet-orange">
                {t === 'lottery' ? '🎰 抽奖' : t === 'sign_in' ? '✋ 签到' : t === 'post' ? '📝 发帖' : t === 'share' ? '🔗 分享' : t}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 mb-4">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-pet-orange" />
            奖品设置
          </h2>
          <div className="space-y-3">
            {activity.prizes.map((prize, i) => (
              <div key={prize.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pet-cream text-sm font-bold text-pet-orange">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{prize.name}</p>
                  <p className="text-xs text-muted-foreground">
                    共{prize.quantity}份 · 已中{prize.wonCount}份
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 mb-4">
          <h2 className="text-base font-semibold text-foreground mb-3">活动规则</h2>
          <ol className="space-y-2">
            {activity.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        {activity.status === 'active' && (
          <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
            <div className="container max-w-4xl">
              {participationStatus === 'not_participated' ? (
                <button
                  onClick={handleParticipate}
                  className="w-full rounded-full bg-pet-orange py-3 text-sm font-medium text-white hover:bg-pet-coral transition-colors"
                >
                  立即参与
                </button>
              ) : (
                <button
                  disabled
                  className="w-full rounded-full bg-muted py-3 text-sm font-medium text-muted-foreground"
                >
                  已参与
                </button>
              )}
            </div>
          </div>
        )}

        {showPrizeAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="animate-bounce rounded-2xl bg-card p-8 text-center shadow-xl">
              <p className="text-4xl mb-3">🎰</p>
              <p className="text-lg font-semibold text-foreground">抽奖中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
