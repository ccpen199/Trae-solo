import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Clock, User, ThumbsUp, MessageSquare, Share2, Bookmark, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CommunityDetail() {
  const { id } = useParams();

  return (
    <div className="container py-12">
      <Link to="/community" className="inline-flex items-center gap-2 text-jade-600 hover:text-gold-500 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        返回社区
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid lg:grid-cols-4 gap-6"
      >
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <Card.Content className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="success">陶瓷</Badge>
                <Badge variant="error" dot>热门</Badge>
                <Tag variant="jade">专家已答</Tag>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-4">
                这件青花碗是清代的吗？求行家指点
              </h1>
              <div className="flex items-center gap-4 text-sm text-jade-500 flex-wrap pb-4 border-b border-gold-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-ink-gradient flex items-center justify-center">
                    <User className="w-4 h-4 text-gold-300" />
                  </div>
                  <span className="font-medium text-jade-700">藏友小张</span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  2小时前
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  1,520 浏览
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  12 回答
                </span>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<ThumbsUp className="w-3.5 h-3.5" />}>45</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Bookmark className="w-3.5 h-3.5" />}>收藏</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5" />}>分享</Button>
                </div>
              </div>
              <div className="mt-4">
                <EmptyState
                  title="问题详情页面开发中"
                  description={`问题ID: ${id}`}
                />
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <h2 className="font-serif text-xl font-semibold text-jade-700 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gold-500" />
                12 条回答
              </h2>
              <EmptyState
                icon={<Award className="w-10 h-10 text-gold-500" />}
                title="回答区域"
                description="专家和藏友的精彩回答将在这里展示"
              />
            </Card.Content>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Card.Content>
              <h3 className="font-serif text-lg font-semibold text-jade-700 mb-4">相关问题</h3>
              <div className="space-y-3">
                {[
                  '青花瓷的各个时期特点',
                  '如何通过款识判断瓷器年代',
                  '清代民窑青花瓷价值如何',
                ].map((title) => (
                  <p key={title} className="text-sm text-jade-600 hover:text-gold-500 cursor-pointer transition-colors line-clamp-2">
                    {title}
                  </p>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
