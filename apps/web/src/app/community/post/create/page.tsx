'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, X, Hash } from 'lucide-react';
import { TopicTag } from '@/components/community/topic-tag';
import type { Topic, PostType } from '@pet/shared/types';

const mockTopics: Topic[] = [
  { id: '1', name: '猫咪日常', slug: 'cat-daily', category: 'life', postCount: 1234, followerCount: 5678, isHot: true, isOfficial: false, sortOrder: 1, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: '狗狗健康', slug: 'dog-health', category: 'health', postCount: 890, followerCount: 3456, isHot: true, isOfficial: false, sortOrder: 2, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: '新手养猫', slug: 'new-cat', category: 'discussion', postCount: 567, followerCount: 2345, isHot: false, isOfficial: true, sortOrder: 3, status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: '营养搭配', slug: 'nutrition', category: 'nutrition', postCount: 345, followerCount: 1234, isHot: false, isOfficial: false, sortOrder: 4, status: 'active', createdAt: new Date(), updatedAt: new Date() },
];

const postTypes: { value: PostType; label: string }[] = [
  { value: 'discussion', label: '讨论' },
  { value: 'question', label: '提问' },
  { value: 'review', label: '测评' },
  { value: 'adoption', label: '领养' },
  { value: 'rescue', label: '救助' },
];

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<PostType>('discussion');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            取消
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="rounded-full bg-pet-orange px-5 py-2 text-sm font-medium text-white hover:bg-pet-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发布
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {postTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedType === type.value
                    ? 'bg-pet-orange text-white'
                    : 'border text-muted-foreground hover:border-pet-orange hover:text-pet-orange'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {selectedType !== 'moment' && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入标题（选填）"
              className="w-full rounded-lg border bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-pet-orange/50 placeholder:text-muted-foreground"
            />
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你和宠物的故事..."
            rows={8}
            className="w-full rounded-lg border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50 placeholder:text-muted-foreground resize-none"
          />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">添加图片</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative h-20 w-20 rounded-md bg-muted">
                  <img src={img} alt="" className="h-full w-full object-cover rounded-md" />
                  <button
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground hover:border-pet-orange hover:text-pet-orange transition-colors">
                <ImagePlus className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">选择话题</h3>
            <div className="flex flex-wrap gap-2">
              {mockTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className="transition-transform"
                >
                  <TopicTag
                    topic={topic}
                    size={selectedTopics.includes(topic.id) ? 'md' : 'sm'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">添加标签</h3>
            <div className="flex gap-2 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-pet-cream px-2.5 py-1 text-xs text-pet-orange">
                  #{tag}
                  <button onClick={() => handleRemoveTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="输入标签后回车"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
              />
              <button
                onClick={handleAddTag}
                className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground hover:bg-secondary/80"
              >
                <Hash className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
