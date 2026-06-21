import { motion } from 'framer-motion';
import { BookOpen, Search, Clock, Eye, Tag as TagIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';

const articles = [
  {
    id: '1',
    title: '明清青花瓷的鉴别要点',
    category: '陶瓷',
    era: '明清',
    cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    author: '张明清',
    views: 12580,
    date: '2024-01-10',
    tags: ['青花瓷', '明清瓷器', '鉴别技巧'],
  },
  {
    id: '2',
    title: '和田玉的产地特征与辨识方法',
    category: '玉器',
    era: '历代',
    cover: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop',
    author: '李玉山',
    views: 9820,
    date: '2024-01-08',
    tags: ['和田玉', '玉器鉴别', '产地特征'],
  },
  {
    id: '3',
    title: '齐白石书画真伪鉴定指南',
    category: '书画',
    era: '近现代',
    cover: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=300&fit=crop',
    author: '王书远',
    views: 15320,
    date: '2024-01-05',
    tags: ['齐白石', '书画鉴定', '近现代'],
  },
  {
    id: '4',
    title: '宋代建窑兔毫盏的鉴赏',
    category: '陶瓷',
    era: '宋代',
    cover: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=400&h=300&fit=crop',
    author: '张明清',
    views: 8760,
    date: '2024-01-02',
    tags: ['建窑', '兔毫盏', '宋瓷'],
  },
  {
    id: '5',
    title: '古钱币的包浆与锈色鉴别',
    category: '钱币',
    era: '历代',
    cover: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop',
    author: '赵泉珍',
    views: 6540,
    date: '2023-12-28',
    tags: ['古钱币', '包浆', '锈色'],
  },
  {
    id: '6',
    title: '宣德炉的铸造工艺与鉴定',
    category: '铜器',
    era: '明代',
    cover: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop',
    author: '陈铜源',
    views: 7890,
    date: '2023-12-25',
    tags: ['宣德炉', '铜器', '铸造工艺'],
  },
];

const categories = ['全部', '陶瓷', '玉器', '书画', '铜器', '钱币', '杂项'];
const eras = ['全部年代', '先秦', '秦汉', '唐宋', '元明', '清代', '近现代'];

export default function Knowledge() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <Tag variant="gold" className="mb-4">行家知识库</Tag>
        <h1 className="section-title text-3xl md:text-4xl mb-3">行家知识库</h1>
        <p className="section-subtitle text-lg">权威专家撰写，专业系统的文玩收藏知识</p>
      </motion.div>

      <Card className="mb-8">
        <Card.Content className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
            <input
              type="text"
              placeholder="搜索知识库文章..."
              className="input-field pl-11"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                className="px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600"
              >
                {cat}
              </button>
            ))}
          </div>
        </Card.Content>
      </Card>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-1 scrollbar-thin">
        {eras.map((era) => (
          <Badge key={era} variant={era === '全部年代' ? 'default' : 'info'} className="cursor-pointer whitespace-nowrap">
            {era}
          </Badge>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Card hoverable className="h-full flex flex-col">
              <Card.Image src={article.cover} alt={article.title} aspectRatio="video" />
              <Card.Content className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="success">{article.category}</Badge>
                  <Badge variant="info">{article.era}</Badge>
                </div>
                <h3 className="font-serif text-lg font-semibold text-jade-700 mb-3 hover:text-gold-500 transition-colors cursor-pointer line-clamp-2">
                  {article.title}
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-rice-100 text-jade-600"
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between text-sm text-jade-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {article.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {article.date}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gold-600">作者：{article.author}</p>
              </Card.Content>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-rice-100 rounded-full text-jade-600">
          <BookOpen className="w-5 h-5" />
          <span>加载更多文章</span>
        </div>
      </div>
    </div>
  );
}
