'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { ActivityCard } from '@/components/social/activity-card';
import type { ActivityEvent } from '@pet/shared/types';

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'ended', label: '已结束' },
];

const mockActivities: ActivityEvent[] = [
  { id: '1', title: '春季宠物摄影大赛', description: '晒出你家萌宠的最美瞬间，赢取丰厚奖品！', coverImage: undefined, type: ['post', 'lottery'], startTime: new Date(), endTime: new Date(Date.now() + 7 * 86400000), participationCount: 234, maxParticipants: 1000, prizes: [{ id: '1', activityId: '1', name: '宠物相机', type: 'product', value: 299, quantity: 1, wonCount: 0, probability: 0.01, sortOrder: 1 }, { id: '2', activityId: '1', name: '100积分', type: 'point', value: 100, quantity: 50, wonCount: 12, probability: 0.2, sortOrder: 2 }], rules: ['每人限参与一次', '作品需为原创', '禁止盗图'], isHot: true, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: '每日签到领积分', description: '每天签到即可获得积分奖励，连续签到还有额外惊喜！', type: ['sign_in'], startTime: new Date(), endTime: new Date(Date.now() + 30 * 86400000), participationCount: 1234, maxParticipants: 10000, prizes: [{ id: '3', activityId: '2', name: '1积分', type: 'point', value: 1, quantity: 99999, wonCount: 5000, probability: 1, sortOrder: 1 }], rules: ['每日签到得1积分', '连续7天额外5积分'], isHot: false, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', title: '宠友分享有礼', description: '分享宠物社区内容到朋友圈，截图上传即可参与抽奖', type: ['share', 'lottery'], startTime: new Date(Date.now() - 3 * 86400000), endTime: new Date(Date.now() + 4 * 86400000), participationCount: 567, maxParticipants: 2000, prizes: [{ id: '4', activityId: '3', name: '50元优惠券', type: 'coupon', value: 50, quantity: 10, wonCount: 3, probability: 0.05, sortOrder: 1 }], rules: ['每人每日限参与一次', '分享截图需可见'], isHot: false, status: 'active', createdAt: new Date(), updatedAt: new Date() },
];

export default function ActivityListPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredActivities = mockActivities.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">活动中心</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索活动..."
            className="w-full rounded-full border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
          />
        </div>

        <div className="flex items-center gap-2 mb-6">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                statusFilter === filter.value
                  ? 'bg-pet-orange text-white'
                  : 'border text-muted-foreground hover:border-pet-orange hover:text-pet-orange'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
          {filteredActivities.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">
              暂无符合条件的活动
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
