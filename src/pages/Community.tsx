import { motion } from 'framer-motion';
import { MessageCircle, Eye, Clock, User, Search, ThumbsUp, MessageSquare, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

const questions = [
  {
    id: '1',
    title: '这件青花碗是清代的吗？求行家指点',
    content: '家里祖传的青花碗，碗底有款识，求各位行家帮忙看看年代和大概价值...',
    category: '陶瓷',
    author: '藏友小张',
    avatar: '',
    views: 1520,
    answers: 12,
    likes: 45,
    date: '2小时前',
    hasExpertAnswer: true,
    isHot: true,
  },
  {
    id: '2',
    title: '和田玉籽料和山料怎么区分？',
    content: '新手入门，想请教一下各位老师，和田玉籽料和山料在外观上有什么区别？...',
    category: '玉器',
    author: '玉石爱好者',
    avatar: '',
    views: 3280,
    answers: 28,
    likes: 89,
    date: '5小时前',
    hasExpertAnswer: true,
    isHot: false,
  },
  {
    id: '3',
    title: '这幅字画是齐白石真迹吗？',
    content: '朋友转让的一幅齐白石的虾，感觉笔触有些犹豫，请各位老师帮忙鉴定一下...',
    category: '书画',
    author: '书画收藏者',
    avatar: '',
    views: 5680,
    answers: 35,
    likes: 156,
    date: '昨天',
    hasExpertAnswer: true,
    isHot: true,
  },
  {
    id: '4',
    title: '古钱币清洗有什么讲究？',
    content: '家里有一些出土的古钱币，锈迹比较重，想清洗一下，请问有什么需要注意的？...',
    category: '钱币',
    author: '泉友老李',
    avatar: '',
    views: 890,
    answers: 8,
    likes: 23,
    date: '2天前',
    hasExpertAnswer: false,
    isHot: false,
  },
];

const categories = ['全部问题', '陶瓷', '玉器', '书画', '铜器', '钱币', '杂项'];

export default function Community() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <Tag variant="gold" className="mb-4">社区问答</Tag>
        <h1 className="section-title text-3xl md:text-4xl mb-3">藏友社区</h1>
        <p className="section-subtitle text-lg">百万藏友在线交流，专家实时答疑</p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <Card.Content className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
                <input
                  type="text"
                  placeholder="搜索问题..."
                  className="input-field pl-11"
                />
              </div>
              <Button variant="primary" leftIcon={<MessageCircle className="w-4 h-4" />}>我要提问</Button>
            </Card.Content>
          </Card>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={cat === '全部问题' ? 'default' : 'info'}
                className="cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                {cat === '全部问题' && <Filter className="w-3 h-3" />}
                {cat}
              </Badge>
            ))}
          </div>

          {questions.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="w-12 h-12 text-gold-500" />}
              title="暂无相关问题"
              description="成为第一个提问的人吧"
            />
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card hoverable>
                    <Card.Content>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-ink-gradient flex items-center justify-center flex-shrink-0">
                          {q.avatar ? (
                            <img src={q.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-gold-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="success">{q.category}</Badge>
                            {q.isHot && <Badge variant="error" dot>热门</Badge>}
                            {q.hasExpertAnswer && <Tag variant="jade">专家已答</Tag>}
                          </div>
                          <h3 className="font-serif text-lg font-semibold text-jade-700 mb-2 hover:text-gold-500 transition-colors cursor-pointer line-clamp-1">
                            {q.title}
                          </h3>
                          <p className="text-jade-500 text-sm mb-3 line-clamp-2">{q.content}</p>
                          <div className="flex items-center gap-4 text-sm text-jade-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {q.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {q.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {q.views.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {q.answers} 回答
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              {q.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <Card.Content>
              <h3 className="font-serif text-lg font-semibold text-jade-700 mb-4">热门话题</h3>
              <div className="space-y-3">
                {['#明清瓷器鉴定', '#和田玉籽料', '#齐白石书画', '#宣德炉鉴别', '#古钱币收藏', '#紫砂壶鉴赏'].map((topic, i) => (
                  <div key={topic} className="flex items-center gap-2 text-sm cursor-pointer group">
                    <span className={cn(
                      'w-5 h-5 rounded flex items-center justify-center text-xs font-bold',
                      i < 3 ? 'bg-cinnabar-400 text-white' : 'bg-rice-200 text-jade-500',
                    )}>
                      {i + 1}
                    </span>
                    <span className="text-jade-600 group-hover:text-gold-500 transition-colors">{topic}</span>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <h3 className="font-serif text-lg font-semibold text-jade-700 mb-4">活跃专家</h3>
              <div className="space-y-3">
                {[
                  { name: '张明清', title: '国家级陶瓷专家', answers: 1280 },
                  { name: '李玉山', title: '玉器鉴定专家', answers: 960 },
                  { name: '王书远', title: '书画鉴定专家', answers: 850 },
                ].map((expert) => (
                  <div key={expert.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-ink-gradient flex items-center justify-center border border-gold-400">
                      <User className="w-4 h-4 text-gold-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-jade-700 text-sm truncate">{expert.name}</p>
                      <p className="text-xs text-jade-500 truncate">{expert.title}</p>
                    </div>
                    <span className="text-xs text-gold-600 whitespace-nowrap">{expert.answers}答</span>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-ink-gradient border-gold-400">
            <Card.Content className="text-center">
              <MessageCircle className="w-10 h-10 text-gold-300 mx-auto mb-3" />
              <h4 className="font-serif text-lg font-semibold text-gold-300 mb-2">成为认证专家</h4>
              <p className="text-jade-200 text-sm mb-4">分享您的专业知识，帮助更多藏友</p>
              <Button variant="secondary" size="sm">申请认证</Button>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: unknown[]) {
  return inputs.filter(Boolean).join(' ');
}
