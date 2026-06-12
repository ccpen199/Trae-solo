import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Eye,
  MessageSquare,
  ThumbsUp,
  ChevronDown,
  Sparkles,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const aiTags = [
  { label: '水电改造', count: 328, hot: true },
  { label: '瓷砖空鼓', count: 256, hot: true },
  { label: '防水', count: 412, hot: true },
  { label: '甲醛', count: 567, hot: true },
  { label: '定制橱柜', count: 198 },
  { label: '乳胶漆', count: 234 },
  { label: '木地板', count: 189 },
  { label: '吊顶开裂', count: 145 },
  { label: '插座布局', count: 312, hot: true },
  { label: '卫生间异味', count: 167 },
  { label: '隔音', count: 123 },
  { label: '收纳设计', count: 289 },
  { label: '无主灯', count: 234, hot: true },
  { label: '新风系统', count: 89 },
  { label: '地暖', count: 156 },
  { label: '封阳台', count: 178 },
  { label: '智能家居', count: 201 },
  { label: '儿童房', count: 145 },
  { label: '老房改造', count: 345, hot: true },
  { label: '预算控制', count: 478, hot: true },
];

const sortOptions = [
  { key: 'hot', label: '最热' },
  { key: 'new', label: '最新' },
  { key: 'expert', label: '专家回答优先' },
];

interface Question {
  id: string;
  title: string;
  tags: string[];
  author: string;
  avatar: string;
  time: string;
  views: number;
  answers: number;
  votes: number;
  hasExpertAnswer: boolean;
  expertAnswer?: {
    expertName: string;
    expertTitle: string;
    summary: string;
  };
}

const questions: Question[] = [
  {
    id: 'q1',
    title: '卫生间防水层做几遍才保险？闭水试验要多久？',
    tags: ['防水', '卫生间', '水电改造'],
    author: '装修改小白',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    time: '2小时前',
    views: 3421,
    answers: 8,
    votes: 127,
    hasExpertAnswer: true,
    expertAnswer: {
      expertName: '李工程师',
      expertTitle: '15年防水施工专家',
      summary: '标准做法是三遍涂刷，淋浴区高度≥1.8米、干区≥30cm...',
    },
  },
  {
    id: 'q2',
    title: '预算20万装120平够吗？哪些钱该花哪些可以省？',
    tags: ['预算控制', '老房改造'],
    author: '攒钱买房的小李',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    time: '5小时前',
    views: 8762,
    answers: 23,
    votes: 342,
    hasExpertAnswer: true,
    expertAnswer: {
      expertName: '王预算师',
      expertTitle: '资深家装预算师',
      summary: '20万120平可以装得不错，但必须抓主次：水电防水不能省...',
    },
  },
  {
    id: 'q3',
    title: '瓷砖空鼓率多少算正常？已经贴好的砖能检测吗？',
    tags: ['瓷砖空鼓', '泥瓦工程'],
    author: '焦虑的业主',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    time: '1天前',
    views: 2341,
    answers: 5,
    votes: 89,
    hasExpertAnswer: false,
  },
  {
    id: 'q4',
    title: '客厅无主灯设计怎么做才不踩坑？射灯多少K合适？',
    tags: ['无主灯', '灯具', '软装'],
    author: '设计爱好者A',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    time: '1天前',
    views: 5678,
    answers: 15,
    votes: 234,
    hasExpertAnswer: true,
    expertAnswer: {
      expertName: '张照明师',
      expertTitle: '10年灯光设计师',
      summary: '无主灯核心是层次照明，建议3000K暖白光、光束角24°...',
    },
  },
  {
    id: 'q5',
    title: '定制衣柜用颗粒板、多层板还是实木？E0和ENF差距大吗？',
    tags: ['定制橱柜', '甲醛', '木工工程'],
    author: '环保焦虑患者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    time: '2天前',
    views: 12345,
    answers: 31,
    votes: 567,
    hasExpertAnswer: true,
    expertAnswer: {
      expertName: '刘材料学硕士',
      expertTitle: '家居材料检测专家',
      summary: 'ENF级甲醛释放量≤0.025mg/m³，是E0级的一半，强烈建议...',
    },
  },
  {
    id: 'q6',
    title: '厨房插座留多少个才够用？什么位置留最合理？',
    tags: ['插座布局', '水电改造'],
    author: '爱做饭的妈妈',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user6',
    time: '3天前',
    views: 4523,
    answers: 12,
    votes: 178,
    hasExpertAnswer: false,
  },
  {
    id: 'q7',
    title: '墙面乳胶漆选什么颜色不翻车？想要温馨耐脏的',
    tags: ['乳胶漆', '油漆工程', '软装'],
    author: '选择困难症',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user7',
    time: '4天前',
    views: 6789,
    answers: 19,
    votes: 289,
    hasExpertAnswer: true,
    expertAnswer: {
      expertName: '陈设计师',
      expertTitle: '国家高级室内设计师',
      summary: '推荐奶咖色系、莫兰迪灰、雾霾蓝这三大类，配图展示...',
    },
  },
  {
    id: 'q8',
    title: '老房改造水电必须全换吗？原有的线管还能用吗？',
    tags: ['老房改造', '水电改造'],
    author: '二手房买家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user8',
    time: '5天前',
    views: 9876,
    answers: 27,
    votes: 423,
    hasExpertAnswer: true,
    expertAnswer: {
      expertName: '赵工头',
      expertTitle: '20年施工经验工长',
      summary: '10年以上老房建议全换，尤其是铝线必须换铜线，老管...',
    },
  },
];

export default function CommunityHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('hot');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  let filteredQuestions = questions;
  if (activeTag) {
    filteredQuestions = questions.filter(q => q.tags.includes(activeTag));
  }
  if (sortBy === 'hot') {
    filteredQuestions = [...filteredQuestions].sort((a, b) => b.votes - a.votes);
  } else if (sortBy === 'new') {
    filteredQuestions = [...filteredQuestions].reverse();
  } else if (sortBy === 'expert') {
    filteredQuestions = [...filteredQuestions].sort((a, b) =>
      (b.hasExpertAnswer ? 1 : 0) - (a.hasExpertAnswer ? 1 : 0)
    );
  }

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="section-title">装修问答社区</h1>
          <p className="section-subtitle">36位认证专家在线解答，28万业主一起帮你避坑</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-500" />
            <input
              type="text"
              placeholder="搜索装修问题、关键词..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            发布问题
          </button>
        </div>

        <div className="card-base p-5 mb-8 bg-gradient-to-br from-ivory-50/50 to-wood-50/30 border-wood-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-terracotta-500" />
            <h3 className="font-semibold text-carbon-800">AI智能聚类标签</h3>
            <span className="text-xs text-ivory-500">20个热门讨论话题</span>
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="ml-auto text-xs text-terracotta-600 hover:underline"
              >
                清除筛选
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {aiTags.map((tag, idx) => (
              <motion.button
                key={tag.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.015 }}
                onClick={() => setActiveTag(activeTag === tag.label ? null : tag.label)}
                className={cn(
                  'group relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  activeTag === tag.label
                    ? 'bg-terracotta-500 text-white shadow-sm shadow-terracotta-500/30'
                    : 'bg-white text-carbon-700 border border-ivory-200 hover:border-terracotta-300 hover:text-terracotta-700'
                )}
              >
                <span className={cn('absolute -top-0.5 -right-0.5', !tag.hot && 'hidden')}>
                  <span className="inline-flex w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                </span>
                {tag.label}
                <span className={cn(
                  'ml-1.5 text-xs',
                  activeTag === tag.label ? 'text-white/70' : 'text-ivory-500'
                )}>
                  {tag.count}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-ivory-600">
                共 <span className="font-semibold text-carbon-800">{filteredQuestions.length}</span> 个问题
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="btn-ghost text-sm py-1.5"
                >
                  {sortOptions.find(o => o.key === sortBy)?.label}
                  <ChevronDown className={cn('w-4 h-4 ml-1 transition-transform', showSortDropdown && 'rotate-180')} />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-card border border-ivory-200 shadow-card-hover py-1 z-20">
                    {sortOptions.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key);
                          setShowSortDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-ivory-100 transition-colors',
                          sortBy === opt.key && 'text-terracotta-600 font-medium bg-terracotta-50'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {filteredQuestions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.4 }}
                onClick={() => navigate(`/owner/question/${q.id}`)}
                className="card-hoverable p-5 cursor-pointer"
              >
                <div className="flex gap-2 mb-3 flex-wrap">
                  {q.tags.map(tag => (
                    <span
                      key={tag}
                      className={cn(
                        'badge text-[11px]',
                        tag === activeTag
                          ? 'bg-terracotta-100 text-terracotta-700 border-terracotta-200'
                          : 'bg-haze-50 text-haze-700 border-haze-200'
                      )}
                    >
                      <Sparkles className="w-3 h-3 mr-0.5" />
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="font-serif text-lg font-semibold text-carbon-900 mb-3 leading-snug group-hover:text-terracotta-700 transition-colors">
                  {q.title}
                </h3>

                {q.hasExpertAnswer && q.expertAnswer && (
                  <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-50/40 border border-amber-200/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/20 rounded-full -translate-y-8 translate-x-8" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md">
                        👨‍🏫
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-amber-900 text-sm">{q.expertAnswer.expertName}</span>
                          <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold">认证专家</span>
                        </div>
                        <p className="text-xs text-amber-800/70 mb-1">{q.expertAnswer.expertTitle}</p>
                        <p className="text-sm text-amber-900/90 leading-relaxed line-clamp-2">
                          {q.expertAnswer.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-ivory-100">
                  <div className="flex items-center gap-3">
                    <img src={q.avatar} alt="" className="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
                    <span className="text-sm text-carbon-600 font-medium">{q.author}</span>
                    <span className="text-xs text-ivory-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {q.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ivory-500">
                    <span className="flex items-center gap-1 hover:text-haze-600 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      {q.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 hover:text-terracotta-600 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {q.answers}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-wood-700 hover:text-terracotta-600 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {q.votes}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="col-span-4 space-y-5">
            <div className="card-base p-5 bg-gradient-to-br from-terracotta-50 to-amber-50 border-terracotta-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white shadow-md">
                  👨‍🏫
                </div>
                <div>
                  <h4 className="font-semibold text-carbon-800">认证专家团</h4>
                  <p className="text-xs text-ivory-600">36位资深人士在线答疑</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { name: '李工程师', title: '防水施工专家', years: 15 },
                  { name: '王预算师', title: '家装预算规划', years: 12 },
                  { name: '陈设计师', title: '高级室内设计', years: 10 },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-white/70 rounded-lg">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=expert${i}`}
                      alt=""
                      className="w-9 h-9 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-carbon-800 truncate">{e.name}</span>
                        <span className="text-[9px] px-1 py-0.5 bg-amber-500 text-white rounded font-bold flex-shrink-0">专家</span>
                      </div>
                      <p className="text-[11px] text-ivory-500 truncate">{e.title} · {e.years}年经验</p>
                    </div>
                    <button className="text-xs px-2.5 py-1 bg-terracotta-500 text-white rounded-full hover:bg-terracotta-600 transition-colors">
                      提问
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-base p-5">
              <h4 className="font-semibold text-carbon-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-haze-500" />
                活跃用户榜
              </h4>
              <div className="space-y-3">
                {[
                  { name: '装修改小白', score: 2890, rank: 1 },
                  { name: '省钱能手', score: 2340, rank: 2 },
                  { name: '避坑达人', score: 1980, rank: 3 },
                  { name: 'DIY爱好者', score: 1560, rank: 4 },
                  { name: '完美主义者', score: 1230, rank: 5 },
                ].map((u, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      i === 0 ? 'bg-amber-400 text-white' :
                      i === 1 ? 'bg-carbon-400 text-white' :
                      i === 2 ? 'bg-terracotta-400 text-white' :
                      'bg-ivory-100 text-ivory-600'
                    )}>
                      {u.rank}
                    </span>
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=top${i}`}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-carbon-700 flex-1">{u.name}</span>
                    <span className="text-xs text-wood-600 font-mono font-semibold">{u.score}分</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
