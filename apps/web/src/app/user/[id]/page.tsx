'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { MembershipCard } from '@/components/user/membership-card';
import { PetCard } from '@/components/user/pet-card';
import { MomentCard } from '@/components/social/moment-card';
import { MembershipLevel } from '@pet/shared/enums';
import type { User, PetProfile, Post } from '@pet/shared/types';

const mockUser: User = {
  id: 'u2', phone: '139****9999', nickname: '猫猫妈妈', avatar: undefined, gender: 'female', role: 'customer', membershipLevel: MembershipLevel.SILVER, growthPoints: 8000, balance: 50, point: 1500, isVerified: true, status: 'active', createdAt: new Date(), updatedAt: new Date(),
};

const mockPets: PetProfile[] = [
  { id: 'p3', userId: 'u2', name: '团子', type: 'cat', breed: '英短蓝猫', gender: 'female', bio: '高冷小公主', isNeutered: true, weight: 4.5, birthday: new Date('2023-01-10'), tags: ['高冷', '优雅'], createdAt: new Date(), updatedAt: new Date() },
];

const mockMoments: Post[] = [
  { id: 'm2', userId: 'u2', type: 'moment', content: '团子今天又把我的花瓶打碎了 😭', images: [], topicIds: [], tags: ['猫咪', '拆家'], status: 'published', auditStatus: 'approved', viewCount: 89, likeCount: 34, commentCount: 8, shareCount: 2, isTop: false, isHot: false, isEssence: false, createdAt: new Date(), updatedAt: new Date() },
];

export default function OtherUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = mockUser;
  const isFollowed = false;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <Link href="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>

        <div className="rounded-xl border bg-card p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-pet-cream flex items-center justify-center text-2xl font-bold text-pet-orange">
              {user.nickname.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{user.nickname}</h2>
              <p className="text-sm text-muted-foreground">三只猫的铲屎官</p>
            </div>
            <button className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isFollowed
                ? 'border text-muted-foreground hover:border-pet-orange hover:text-pet-orange'
                : 'bg-pet-orange text-white hover:bg-pet-coral'
            }`}>
              {isFollowed ? '已关注' : '+ 关注'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{mockPets.length}</p>
              <p className="text-xs text-muted-foreground">宠物</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">88</p>
              <p className="text-xs text-muted-foreground">关注</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">156</p>
              <p className="text-xs text-muted-foreground">粉丝</p>
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

        <h3 className="text-base font-semibold text-foreground mb-3">TA的宠物</h3>
        <div className="space-y-3 mb-6">
          {mockPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} compact />
          ))}
        </div>

        <h3 className="text-base font-semibold text-foreground mb-3">TA的动态</h3>
        <div className="space-y-3">
          {mockMoments.map((moment) => (
            <MomentCard key={moment.id} moment={moment} author={{ id: user.id, nickname: user.nickname, avatar: user.avatar }} />
          ))}
        </div>
      </div>
    </div>
  );
}
