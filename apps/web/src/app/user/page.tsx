'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, Pet, Calendar, Heart, ShoppingBag, Award } from 'lucide-react';
import { MembershipCard } from '@/components/user/membership-card';
import { PetCard } from '@/components/user/pet-card';
import { MomentCard } from '@/components/social/moment-card';
import { MembershipLevel } from '@pet/shared/enums';
import type { User, PetProfile, Post } from '@pet/shared/types';

const mockUser: User = {
  id: 'u1', phone: '138****8888', nickname: '宠物爱好者', avatar: undefined, gender: 'unknown', role: 'customer', membershipLevel: MembershipLevel.GOLD, growthPoints: 25000, balance: 128.5, point: 3200, isVerified: true, status: 'active', createdAt: new Date(), updatedAt: new Date(),
};

const mockPets: PetProfile[] = [
  { id: 'p1', userId: 'u1', name: '小橘', type: 'cat', breed: '橘猫', gender: 'male', avatar: undefined, bio: '贪吃的小橘猫', isNeutered: true, weight: 5.2, birthday: new Date('2022-03-15'), tags: ['贪吃', '亲人', '橘座'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', userId: 'u1', name: '旺财', type: 'dog', breed: '柯基', gender: 'male', avatar: undefined, bio: '短腿小柯基', isNeutered: false, weight: 12, birthday: new Date('2021-08-20'), tags: ['活泼', '短腿', '电动小马达'], createdAt: new Date(), updatedAt: new Date() },
];

const mockMoments: Post[] = [
  { id: 'm1', userId: 'u1', type: 'moment', content: '今天带小橘去公园晒太阳了 ☀️', images: [], topicIds: [], tags: ['猫咪', '户外'], status: 'published', auditStatus: 'approved', viewCount: 123, likeCount: 45, commentCount: 12, shareCount: 3, isTop: false, isHot: false, isEssence: false, createdAt: new Date(), updatedAt: new Date() },
];

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState<'moments' | 'pets'>('moments');
  const user = mockUser;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">个人主页</h1>
          <Link href="/user/settings" className="p-2 rounded-md hover:bg-muted">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-pet-cream flex items-center justify-center text-2xl font-bold text-pet-orange">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nickname} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                user.nickname.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{user.nickname}</h2>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <Link href="/user/pets" className="group">
              <p className="text-lg font-bold text-foreground group-hover:text-pet-orange transition-colors">{mockPets.length}</p>
              <p className="text-xs text-muted-foreground">宠物</p>
            </Link>
            <div>
              <p className="text-lg font-bold text-foreground">128</p>
              <p className="text-xs text-muted-foreground">关注</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">256</p>
              <p className="text-xs text-muted-foreground">粉丝</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">56</p>
              <p className="text-xs text-muted-foreground">获赞</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <MembershipCard
            level={user.membershipLevel}
            growthPoints={user.growthPoints}
            nickname={user.nickname}
          />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: ShoppingBag, label: '我的订单', href: '#' },
            { icon: Pet, label: '我的宠物', href: '/user/pets' },
            { icon: Heart, label: '我的收藏', href: '#' },
            { icon: Award, label: '会员中心', href: '/user/membership' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1.5 rounded-lg border bg-card p-3 hover:border-pet-orange/50 transition-colors"
            >
              <item.icon className="h-5 w-5 text-pet-orange" />
              <span className="text-xs text-foreground">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('moments')}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'moments' ? 'border-pet-orange text-pet-orange' : 'border-transparent text-muted-foreground'
            }`}
          >
            我的动态
          </button>
          <button
            onClick={() => setActiveTab('pets')}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pets' ? 'border-pet-orange text-pet-orange' : 'border-transparent text-muted-foreground'
            }`}
          >
            我的宠物
          </button>
        </div>

        {activeTab === 'moments' && (
          <div className="space-y-3">
            {mockMoments.map((moment) => (
              <MomentCard key={moment.id} moment={moment} author={{ id: user.id, nickname: user.nickname, avatar: user.avatar }} />
            ))}
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="space-y-3">
            {mockPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} showActions />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
