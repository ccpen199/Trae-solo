'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, Share2, MessageCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post, Comment } from '@pet/shared/types';

const mockMoment: Post = {
  id: '1', userId: '1', type: 'moment', content: '今天带小橘去公园晒太阳了，它可开心了！🐱☀️\n\n好久没带它出门了，一到草地上就开始打滚，还追着蝴蝶跑，太可爱了！', images: [], topicIds: [], tags: ['猫咪', '公园', '户外'], status: 'published', auditStatus: 'approved', viewCount: 123, likeCount: 45, commentCount: 12, shareCount: 3, isTop: false, isHot: true, isEssence: false, createdAt: new Date(), updatedAt: new Date(),
};

const mockComments: (Comment & { author?: { id: string; nickname: string; avatar?: string } })[] = [
  { id: 'c1', postId: '1', userId: '2', content: '好可爱！我家猫只敢在家里横，出门就怂了 😂', likeCount: 5, isAudited: true, status: 'normal', createdAt: new Date(), updatedAt: new Date(), author: { id: '2', nickname: '猫猫妈妈' } },
  { id: 'c2', postId: '1', userId: '3', content: '公园遛猫好勇敢，我家的根本不敢带出去', likeCount: 3, isAudited: true, status: 'normal', createdAt: new Date(), updatedAt: new Date(), author: { id: '3', nickname: '铲屎官小王' } },
];

export default function MomentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const moment = mockMoment;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-4">
        <Link href="/social" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          返回动态
        </Link>

        <div className="rounded-xl border bg-card p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              猫
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">猫咪爱好者</p>
              <p className="text-xs text-muted-foreground">{new Date(moment.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <p className="text-foreground leading-relaxed mb-3 whitespace-pre-wrap">
            {moment.content}
          </p>

          {moment.images && moment.images.length > 0 && (
            <div className="grid gap-2 mb-3 grid-cols-3">
              {moment.images.map((img, i) => (
                <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {moment.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {moment.tags.map((tag) => (
                <span key={tag} className="text-xs text-pet-teal">#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-5 pt-3 border-t text-sm text-muted-foreground">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={cn('flex items-center gap-1.5 transition-colors', isLiked ? 'text-pet-orange' : 'hover:text-pet-orange')}
            >
              <ThumbsUp className={cn('h-4 w-4', isLiked && 'fill-pet-orange')} />
              {moment.likeCount + (isLiked ? 1 : 0)}
            </button>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              {moment.commentCount}
            </span>
            <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Share2 className="h-4 w-4" />
              {moment.shareCount}
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">评论 ({mockComments.length})</h2>
          <div className="divide-y">
            {mockComments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5 py-3 first:pt-0 last:pb-0">
                <div className="h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs">
                  {comment.author?.nickname?.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-medium text-foreground">{comment.author?.nickname}</span>
                  <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="h-3 w-3" />
                      {comment.likeCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
