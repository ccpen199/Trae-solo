'use client';

import { use } from 'react';
import { ArrowLeft, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { TopicTag } from '@/components/community/topic-tag';
import { PostCard } from '@/components/community/post-card';
import type { Topic, Post } from '@pet/shared/types';

const mockTopic: Topic = {
  id: '1', name: '猫咪日常', slug: 'cat-daily', description: '分享你和猫咪的日常生活，记录每一个温馨瞬间', category: 'life', postCount: 1234, followerCount: 5678, isHot: true, isOfficial: false, sortOrder: 1, status: 'active', createdAt: new Date(), updatedAt: new Date(),
};

const mockPosts: Post[] = [
  { id: '1', userId: '1', type: 'discussion', title: '今天猫咪又拆家了', content: '回家发现沙发被挠了，但是我看到它的脸又舍不得骂...', topicIds: ['1'], tags: ['猫咪', '日常'], status: 'published', auditStatus: 'approved', viewCount: 234, likeCount: 45, commentCount: 23, shareCount: 5, isTop: false, isHot: true, isEssence: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', userId: '2', type: 'discussion', title: '分享猫咪的睡姿合集', content: '我家猫每天至少睡16个小时，各种奇葩睡姿都有', topicIds: ['1'], tags: ['猫咪', '睡觉'], status: 'published', auditStatus: 'approved', viewCount: 567, likeCount: 89, commentCount: 34, shareCount: 12, isTop: false, isHot: false, isEssence: true, createdAt: new Date(), updatedAt: new Date() },
];

export default function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const topic = mockTopic;
  const posts = mockPosts;
  const isFollowed = false;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <Link href="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          返回社区
        </Link>

        <div className="rounded-xl border bg-card p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TopicTag topic={topic} size="lg" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{topic.name}</h1>
              {topic.description && (
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              )}
            </div>
            <button className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isFollowed
                ? 'border text-muted-foreground hover:border-pet-orange hover:text-pet-orange'
                : 'bg-pet-orange text-white hover:bg-pet-coral'
            }`}>
              {isFollowed ? '已关注' : '+ 关注'}
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {topic.postCount} 帖子
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {topic.followerCount} 关注
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
