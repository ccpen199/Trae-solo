'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, PenSquare, Flame, Stethoscope, Heart } from 'lucide-react';
import { TopicTag } from '@/components/community/topic-tag';
import { PostCard } from '@/components/community/post-card';
import { DoctorCard } from '@/components/community/doctor-card';
import { AdoptionCard } from '@/components/community/adoption-card';
import type { Topic, Post, DoctorProfile, AdoptionPost } from '@pet/shared/types';

const mockTopics: Topic[] = [
  { id: '1', name: '猫咪日常', slug: 'cat-daily', category: 'life', postCount: 1234, followerCount: 5678, isHot: true, isOfficial: false, sortOrder: 1, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: '狗狗健康', slug: 'dog-health', category: 'health', postCount: 890, followerCount: 3456, isHot: true, isOfficial: false, sortOrder: 2, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: '新手养猫', slug: 'new-cat', category: 'discussion', postCount: 567, followerCount: 2345, isHot: false, isOfficial: true, sortOrder: 3, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: '营养搭配', slug: 'nutrition', category: 'nutrition', postCount: 345, followerCount: 1234, isHot: false, isOfficial: false, sortOrder: 4, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: '训练技巧', slug: 'training', category: 'training', postCount: 234, followerCount: 890, isHot: false, isOfficial: false, sortOrder: 5, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: '领养专区', slug: 'adoption', category: 'adoption', postCount: 456, followerCount: 2345, isHot: true, isOfficial: true, sortOrder: 6, status: 'active', createdAt: new Date(), updatedAt: new Date() },
];

const mockPosts: Post[] = [
  { id: '1', userId: '1', type: 'discussion', title: '我家猫咪最近总是打喷嚏怎么办？', content: '最近换季，我家猫咪开始频繁打喷嚏，精神状态还好，食欲也正常，需要去医院看看吗？', topicIds: ['2'], tags: ['猫咪', '健康'], status: 'published', auditStatus: 'approved', viewCount: 234, likeCount: 45, commentCount: 23, shareCount: 5, isTop: true, isHot: true, isEssence: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', userId: '2', type: 'review', title: '推荐一款超好的猫粮', content: '给主子换了这款猫粮后，毛发明显变好了，适口性也很好，推荐给大家！', topicIds: ['4'], tags: ['猫粮', '测评'], status: 'published', auditStatus: 'approved', viewCount: 567, likeCount: 89, commentCount: 34, shareCount: 12, isTop: false, isHot: true, isEssence: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockDoctors: DoctorProfile[] = [
  { id: '1', userId: 'd1', realName: '张医生', title: '主任医师', department: '内科', hospital: '北京宠物医院', yearsOfExperience: 15, specialties: ['猫科疾病', '内科'], education: [], certificates: [], licenseNumber: '', licenseImage: '', introduction: '擅长猫科常见病和内科疾病诊疗', consultationFee: 50, consultationCount: 1234, rating: 4.9, reviewCount: 567, status: 'verified', isOnline: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockAdoptions: AdoptionPost[] = [
  { id: '1', postId: 'p1', userId: 'u1', petType: 'cat', petName: '小橘', petAge: 1, petGender: 'male', breed: '橘猫', vaccinated: true, neutered: false, healthCondition: '健康活泼，已驱虫', location: '北京朝阳', adoptionType: 'free', requirements: ['有养猫经验', '稳定住所'], contactInfo: '微信: xxx', status: 'open', applicantCount: 12, createdAt: new Date(), updatedAt: new Date() },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'hot' | 'latest' | 'following'>('hot');

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">宠物社区</h1>
          <Link
            href="/community/post/create"
            className="flex items-center gap-1.5 rounded-full bg-pet-orange px-4 py-2 text-sm font-medium text-white hover:bg-pet-coral transition-colors"
          >
            <PenSquare className="h-4 w-4" />
            发帖
          </Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索话题、帖子、用户..."
            className="w-full rounded-full border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
          />
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">热门话题</h2>
          <div className="flex flex-wrap gap-2">
            {mockTopics.map((topic) => (
              <TopicTag key={topic.id} topic={topic} showCount />
            ))}
          </div>
        </div>

        <div className="flex border-b mb-4">
          {([
            { key: 'hot' as const, label: '热门', icon: Flame },
            { key: 'latest' as const, label: '最新', icon: null },
            { key: 'following' as const, label: '关注', icon: null },
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

        <div className="space-y-3 mb-8">
          {mockPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-pet-teal" />
              推荐医生
            </h2>
            <Link href="/community/doctor" className="text-sm text-pet-teal hover:underline">
              查看更多
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {mockDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} compact />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-pet-coral" />
              领养信息
            </h2>
            <Link href="/community/adoption" className="text-sm text-pet-teal hover:underline">
              查看更多
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {mockAdoptions.map((adoption) => (
              <AdoptionCard key={adoption.id} adoption={adoption} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
