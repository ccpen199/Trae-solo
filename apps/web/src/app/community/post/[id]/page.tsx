'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, Share2, Bookmark, MoreHorizontal, Send } from 'lucide-react';
import { CommentList } from '@/components/community/comment-list';
import { TopicTag } from '@/components/community/topic-tag';
import type { Post, Topic, Comment } from '@pet/shared/types';

const mockPost: Post = {
  id: '1', userId: '1', type: 'discussion', title: '我家猫咪最近总是打喷嚏怎么办？', content: '最近换季，我家猫咪开始频繁打喷嚏，精神状态还好，食欲也正常，需要去医院看看吗？\n\n有没有有经验的铲屎官分享一下，这种情况需要带去医院检查吗？还是先观察几天？', images: [], topicIds: ['2'], tags: ['猫咪', '健康'], status: 'published', auditStatus: 'approved', viewCount: 234, likeCount: 45, commentCount: 23, shareCount: 5, isTop: true, isHot: true, isEssence: false, createdAt: new Date(), updatedAt: new Date(),
};

const mockTopics: Topic[] = [
  { id: '2', name: '狗狗健康', slug: 'dog-health', category: 'health', postCount: 890, followerCount: 3456, isHot: true, isOfficial: false, sortOrder: 2, status: 'active', createdAt: new Date(), updatedAt: new Date() },
];

const mockComments: (Comment & { author?: { id: string; nickname: string; avatar?: string }; replies?: Comment[] })[] = [
  { id: 'c1', postId: '1', userId: '2', content: '建议先观察一下，如果只是偶尔打喷嚏可能只是灰尘引起的，如果频繁的话还是建议去医院看看', likeCount: 12, isAudited: true, status: 'normal', createdAt: new Date(), updatedAt: new Date(), author: { id: '2', nickname: '猫猫妈妈' } },
  { id: 'c2', postId: '1', userId: '3', content: '我家猫之前也是这样，后来检查是过敏，换了猫砂就好了', likeCount: 8, isAudited: true, status: 'normal', createdAt: new Date(), updatedAt: new Date(), author: { id: '3', nickname: '铲屎官小王' } },
];

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const post = mockPost;
  const topics = mockTopics;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回社区
          </Link>
          <button className="p-1.5 rounded-md hover:bg-muted">
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <article className="rounded-xl border bg-card p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              铲
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">铲屎官小李</p>
              <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-foreground mb-3">{post.title}</h1>

          <div className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
            {post.content}
          </div>

          {post.images && post.images.length > 0 && (
            <div className="grid gap-2 mb-4 grid-cols-3">
              {post.images.map((img, i) => (
                <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {topics.map((topic) => (
              <TopicTag key={topic.id} topic={topic} size="sm" />
            ))}
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-pet-teal">#{tag}</span>
            ))}
          </div>

          <div className="flex items-center gap-5 pt-4 border-t text-sm text-muted-foreground">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center gap-1.5 transition-colors ${
                isLiked ? 'text-pet-orange' : 'hover:text-pet-orange'
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-pet-orange' : ''}`} />
              {post.likeCount + (isLiked ? 1 : 0)}
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`flex items-center gap-1.5 transition-colors ${
                isBookmarked ? 'text-pet-teal' : 'hover:text-pet-teal'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-pet-teal' : ''}`} />
              收藏
            </button>
            <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Share2 className="h-4 w-4" />
              {post.shareCount}
            </button>
          </div>
        </article>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            评论 ({post.commentCount})
          </h2>
          <CommentList
            comments={mockComments}
            onLike={(commentId) => {}}
            onReply={(commentId) => {}}
          />

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的评论..."
              className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
            />
            <button className="rounded-full bg-pet-orange p-2.5 text-white hover:bg-pet-coral transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
