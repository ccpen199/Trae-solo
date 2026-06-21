import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Eye, User, Tag as TagIcon, Share2, Bookmark, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function KnowledgeDetail() {
  const { id } = useParams();

  return (
    <div className="container py-12">
      <Link to="/knowledge" className="inline-flex items-center gap-2 text-jade-600 hover:text-gold-500 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        返回知识库
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <Card.Image
            src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop"
            alt="文章封面"
            aspectRatio="video"
          />
          <Card.Content className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="success">陶瓷</Badge>
              <Badge variant="info">明清</Badge>
              <Tag variant="seal">专家原创</Tag>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl font-bold text-jade-700 mb-6">
              明清青花瓷的鉴别要点
            </h1>

            <div className="flex flex-wrap items-center gap-6 pb-6 mb-6 border-b border-gold-200 text-jade-500">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-ink-gradient flex items-center justify-center">
                  <User className="w-5 h-5 text-gold-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-jade-700">张明清</p>
                  <p className="text-xs">国家级陶瓷鉴定专家</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span className="text-sm">2024年1月10日</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span className="text-sm">12,580 阅读</span>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" leftIcon={<Heart className="w-4 h-4" />}>收藏</Button>
                <Button variant="ghost" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>分享</Button>
              </div>
            </div>

            <div className="prose prose-jade max-w-none">
              <EmptyState
                title="文章内容正在编辑中"
                description="文章ID: {id}"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gold-200">
              {['青花瓷', '明清瓷器', '鉴别技巧', '纹饰特征', '款识鉴定'].map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-rice-100 text-jade-600">
                  <TagIcon className="w-3.5 h-3.5" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gold-200">
              <Button variant="secondary" leftIcon={<Heart className="w-4 h-4" />}>点赞 328</Button>
              <Button variant="secondary" leftIcon={<Bookmark className="w-4 h-4" />}>收藏 156</Button>
              <Button variant="secondary" leftIcon={<MessageSquare className="w-4 h-4" />}>评论 42</Button>
            </div>
          </Card.Content>
        </Card>
      </motion.article>
    </div>
  );
}
