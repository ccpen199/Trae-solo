'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, UserPlus, Flame, Calendar } from 'lucide-react';
import { MomentCard } from '@/components/social/moment-card';
import { ActivityCard } from '@/components/social/activity-card';
import type { Post, ActivityEvent, User } from '@pet/shared/types';

const mockMoments: Post[] = [
  { id: '1', userId: '1', type: 'moment', content: '今天带小橘去公园晒太阳了，它可开心了！🐱☀️', images: [], topicIds: [], tags: ['猫咪', '公园'], status: 'published', auditStatus: 'approved', viewCount: 123, likeCount: 45, commentCount: 12, shareCount: 3, isTop: false, isHot: true, isEssence: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', userId: '2', type: 'moment', content: '旺财学会握手了！训练了一个月终于成功🎉', images: [], topicIds: [], tags: ['狗狗', '训练'], status: 'published', auditStatus: 'approved', viewCount: 89, likeCount: 34, commentCount: 8, shareCount: 2, isTop: false, isHot: false, isEssence: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', userId: '3', type: 'moment', content: '新买的猫爬架到了，主子表示很满意～', images: [], topicIds: [], tags: ['猫咪', '购物'], status: 'published', auditStatus: 'approved', viewCount: 56, likeCount: 23, commentCount: 5, shareCount: 1, isTop: false, isHot: false, isEssence: false, createdAt: new Date(), updatedAt: new Date() },
];

const mockActivities: ActivityEvent[] = [
  { id: '1', title: '春季宠物摄影大赛', description: '晒出你家萌宠的最美瞬间，赢取丰厚奖品！', type: ['post', 'lottery'], startTime: new Date(), endTime: new Date(Date.now() + 7 * 86400000), participationCount: 234, prizes: [{ id: '1', activityId: '1', name: '宠物相机', type: 'product', value: 299, quantity: 1, wonCount: 0, probability: 0.01, sortOrder: 1 }], rules: ['每人限参与一次', '作品需为原创'], isHot: true, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: '每日签到领积分', description: '每天签到即可获得积分奖励', type: ['sign_in'], startTime: new Date(), endTime: new Date(Date.now() + 30 * 86400000), participationCount: 1234, maxParticipants: 10000, prizes: [], rules: ['每日签到得1积分'], isHot: false, status: 'active', createdAt: new Date(), updatedAt: new Date() },
];

const mockRecommendUsers: { id: string; nickname: string; avatar?: string; bio: string; petCount: number }[] = [
  { id: 'u1', nickname: '猫猫妈妈', bio: '三只猫的铲屎官', petCount: 3 },
  { id: 'u2', nickname: '遛狗达人', bio: '每天遛狗两小时', petCount: 2 },
  { id: 'u3', nickname: '水族爱好者', bio: '家里有个大鱼缸', petCount: 5 },
];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<'following' | 'recommend' | 'hot'>('following');

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">动态</h1>
          <Link
            href="/social/moment/create"
            className="flex items-center gap-1.5 rounded-full bg-pet-orange px-4 py-2 text-sm font-medium text-white hover:bg-pet-coral transition-colors"
          >
            <Plus className="h-4 w-4" />
            发布动态
          </Link>
        </div>

        <div className="flex border-b mb-4">
          {([
            { key: 'following' as const, label: '关注' },
            { key: 'recommend' as const, label: '推荐' },
            { key: 'hot' as const, label: '热门', icon: Flame },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-pet-orange text-pet-orange'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            {mockMoments.map((moment) => (
              <MomentCard key={moment.id} moment={moment} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-pet-teal" />
                  推荐关注
                </h3>
                <button className="text-xs text-muted-foreground hover:text-foreground">换一批</button>
              </div>
              <div className="space-y-3">
                {mockRecommendUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {user.nickname.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{user.nickname}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                    </div>
                    <button className="shrink-0 rounded-full border px-2.5 py-0.5 text-xs text-pet-teal hover:bg-pet-teal hover:text-white transition-colors">
                      关注
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-pet-orange" />
                  热门活动
                </h3>
                <Link href="/social/activity" className="text-xs text-pet-teal hover:underline">更多</Link>
              </div>
              <div className="space-y-2">
                {mockActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} compact />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
