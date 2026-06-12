import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hash,
  Eye,
  MessageCircle,
  ThumbsUp,
  Send,
  Clock,
  ShieldCheck,
  ChevronRight,
  Check,
  Star,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag,
  User,
  Search,
  Home,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';

const questionData = {
  id: 1,
  title: '大三零基础如何准备互联网暑期实习？求大佬指点！',
  content: `本人某985大三在读，EE专业，之前完全没有任何互联网相关的实习和项目经验。
最近一个月海投了产品和运营岗大概十几家，除了两个测评以外毫无音讯...真的很焦虑。

想问问各位前辈：
1. 零基础三个月内有可能上岸吗？还是应该放弃准备实习等秋招？
2. 产品和运营哪个对零基础更友好？
3. 简历上没有相关经历该怎么写？可以编吗？
4. 如果要做项目积累，有什么速成的办法？

现在每天都在刷各种笔经面经，但感觉越看越乱，不知道从哪里开始系统准备。
真心求各位已经上岸的学长学姐指点迷津，感激不尽！🙏`,
  tags: ['求职经验', '零基础', '暑期实习', '985高校', '产品岗', '运营岗'],
  views: 12500,
  answers: 128,
  likes: 856,
  followers: 2341,
  time: '2小时前',
  editTime: '编辑于1小时前',
  isAnonymous: true,
  schoolGroup: '按院校',
  category: '985高校圈',
  groupType: '院校圈',
  authorName: '张同学',
  authorSchool: '浙江大学',
  relatedQuestions: [
    { id: 101, title: '双非本科进大厂的真实路径分享' },
    { id: 102, title: '零基础转码可行性分析？' },
    { id: 103, title: '大三才开始准备实习来得及吗？' },
    { id: 104, title: '产品岗简历怎么写才能通过筛选？' },
    { id: 105, title: '运营岗面试高频问题及回答技巧' },
  ],
};

const answers = [
  {
    id: 1,
    isAdopted: true,
    isSenior: true,
    authorName: '李学长',
    authorTitle: '字节跳动·高级产品经理',
    authorCompany: '字节·产品·2年经验',
    authorDesc: '2年带教经验·辅导过40+同学上岸',
    authorBg: 'from-teal-400 to-brand-400',
    time: '1小时前',
    likes: 568,
    comments: 42,
    rating: 5,
    content: `我来认真回答一下这个问题！三年前我和你的情况几乎一模一样，EE转产品，最后拿到了字节/腾讯/美团的offer。分享一下我的方法论：

### 🎯 第一个问题：三个月能不能上岸？
**完全可以，但前提是你要有策略地发力，而不是盲目海投。**

三个月的时间分配建议：
- 第1个月：确定方向 + 做2-3个项目作品
- 第2个月：改简历 + 找内推 + 练笔试
- 第3个月：疯狂面试 + 复盘迭代

不要觉得时间短，我当初就是用两个半月从零准备，最后成功了。关键是专注，不要一会儿想产品一会儿想运营。

### 🔍 第二个问题：产品 vs 运营选哪个？
**对零基础来说，运营门槛更低，但产品上限更高。**

建议你先做一个简单的自我测试：
- 如果你逻辑思维强、喜欢拆解问题、有强迫症般的细节追求 → 产品
- 如果你脑洞大、对数据敏感、擅长沟通和搞事情 → 运营

但说实话，对于第一份实习，我的建议是：**哪个能先上就先上哪个。** 先入行比纠结方向重要一万倍。

### 📝 第三个问题：简历没经历怎么办？
**绝对不要编！但是可以「包装」和「创造」。**

没有实习经历，你可以写：
1. **课程项目包装**：把课设往互联网方向靠，比如写个课程管理系统 → 你是「产品经理+项目经理」角色
2. **自己做项目**：花两周做一个完整的竞品分析报告+原型图，这就是你的作品集
3. **校园经历包装**：学生会/社团组织的活动，用数据量化成果（拉新xx人、转化率xx%）

面试官要看的不是你做过多少大厂实习，而是**你有没有产品思维和学习能力**。

### ⚡ 第四个问题：速成项目怎么做？
推荐几个零基础友好的项目：
1. **竞品分析报告**：选一个你熟悉的APP（比如小红书/抖音），写一份5000字深度分析
2. **产品需求文档（PRD）**：给你常用的APP加一个功能，从用户画像到原型图画完整
3. **运营活动策划**：策划一个拉新活动，包含预算、渠道、数据预期

这些东西网上模板很多，照着做两个下来你就入门了。

---

最后说一句真心话：**焦虑是最没用的东西。** 不如从今天开始，关掉所有焦虑帖，打开Figma画第一个原型图。三个月后你会感谢现在开始行动的自己。

有具体问题可以随时私信我，加油！💪`,
  },
  {
    id: 2,
    isAdopted: false,
    isSenior: true,
    authorName: '王学姐',
    authorTitle: '腾讯·运营主管',
    authorCompany: '腾讯·运营·3年经验',
    authorDesc: '前校招HR·阅简历5000+',
    authorBg: 'from-amber-400 to-orange-500',
    time: '45分钟前',
    likes: 312,
    comments: 28,
    rating: 5,
    content: `从HR视角补充几点，可能会让你少走很多弯路：

**关于简历：**
- 一页纸！一页纸！一页纸！（重要的事情说三遍）
- 经历描述用「动词 + 内容 + 数据结果」结构
- 自我评价不要写「性格开朗、学习能力强」这种废话，写具体的
- PDF格式！！！Word简历直接淘汰

**关于海投：**
- 不要海投！不要海投！不要海投！
- 精准投递：每天最多投5家，每家都做针对性修改
- 内推 > 官网投递 > 招聘平台
- 优先投小厂练手，再投大厂（别上来就把dream company投了）

**关于零基础：**
EE背景其实有优势的，技术理解力比纯文科强。面试的时候可以强调这点：「虽然我是EE，但我对技术的理解让我能更好地和工程师沟通」—— 这是你的差异化竞争力。

加油，你可以的！`,
  },
  {
    id: 3,
    isAdopted: false,
    isSenior: false,
    authorName: '匿名用户',
    authorTitle: '去年上岸的学长',
    authorCompany: '某大厂运营实习中',
    authorDesc: '',
    authorBg: 'from-ink-300 to-ink-400',
    isAnonymousAuthor: true,
    time: '30分钟前',
    likes: 156,
    comments: 12,
    rating: 4,
    content: `同是EE转运营来答一下，去年和你一模一样的处境，最后上岸某大厂。

说一个没有人提到的点：**信息差比努力更重要。**

很多同学失败不是因为不努力，而是不知道正确的信息。比如：
- 很多大厂的实习岗位其实不会公开发布，只在内部群/校友群里转
- 有些部门有紧急补招的hc，投了当天就会约面试
- 有的岗位看似招满了但一直挂着，你投了就有机会

**解决信息差的办法：**
1. 加尽可能多的实习群（但是要筛选质量）
2. 找学长学姐1v1聊天（请人喝杯咖啡，真的能收获很多）
3. 关注一些靠谱的公众号，不是那种卖课的，是真的发信息的

最后，不要因为是EE就给自己设限。我们专业出来做什么的都有，你的背景不是劣势，是独特性。`,
  },
  {
    id: 4,
    isAdopted: false,
    isSenior: false,
    authorName: '陈同学',
    authorTitle: '27届·同是求职者',
    authorCompany: '已收到3个面试',
    authorDesc: '',
    authorBg: 'from-sky-400 to-indigo-500',
    time: '15分钟前',
    likes: 87,
    comments: 5,
    rating: 4,
    content: `和楼主同届！我也是零基础找产品实习，投了快一个月了，已经收到3个面试邀约。

分享一下我做的事情，可能对你有参考：
1. 报了一个产品入门的免费课（B站上很多，不用花钱）
2. 跟着课程做了一个完整的竞品分析，附在简历后面
3. 找了两个学长做了模拟面试

目前的感悟是：确实得先有作品，不然简历真的没东西写。面试的时候面试官一直在问我做的那个竞品分析的细节，其他都没怎么问。

共勉！`,
  },
];

const mentorsList = [
  {
    id: 1,
    name: '李学长',
    title: '字节跳动·产品经理',
    tag: '字节·产品·2年',
    bg: 'from-teal-400 to-brand-400',
    online: true,
  },
  {
    id: 2,
    name: '王学姐',
    title: '腾讯·运营主管',
    tag: '腾讯·运营·3年',
    bg: 'from-amber-400 to-orange-500',
    online: true,
  },
  {
    id: 3,
    name: '赵学长',
    title: '美团·算法工程师',
    tag: '美团·算法·2年',
    bg: 'from-violet-400 to-purple-500',
    online: false,
  },
  {
    id: 4,
    name: '刘学姐',
    title: '阿里·HRBP',
    tag: '阿里·HR·4年',
    bg: 'from-rose-400 to-pink-500',
    online: true,
  },
];

export default function QuestionDetailPage() {
  const navigate = useNavigate();
  const [likedAnswers, setLikedAnswers] = useState<number[]>([]);
  const [answerText, setAnswerText] = useState('');
  const [questionLiked, setQuestionLiked] = useState(false);
  const [questionFollowed, setQuestionFollowed] = useState(false);
  const [isAnonymousAnswer, setIsAnonymousAnswer] = useState(false);

  const isQuestionOwner = true;

  const toggleLikeAnswer = (id: number) => {
    setLikedAnswers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const adoptedAnswer = answers.find((a) => a.isAdopted);

  return (
    <div className="min-h-screen bg-cream-50 py-6">
      <div className="container grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 mb-2">
          <nav className="flex items-center gap-2 text-sm text-ink-500 animate-fade-in-up">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 hover:text-brand-600 transition-colors"
            >
              <Home size={14} />
              首页
            </button>
            <ChevronRight size={14} className="text-ink-300" />
            <button
              onClick={() => navigate('/community')}
              className="hover:text-brand-600 transition-colors"
            >
              社区广场
            </button>
            <ChevronRight size={14} className="text-ink-300" />
            <span className="text-ink-700 font-medium">问题详情</span>
          </nav>
        </div>

        <main className="lg:col-span-8 space-y-6">
          <Card className="animate-fade-in-up overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-brand-500 via-amber-400 to-teal-500" />
            <CardContent className="space-y-5 pt-8">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="info" size="sm" className="flex items-center gap-1">
                  <Hash size={12} /> {questionData.category}
                </Badge>
                <Badge variant="brand" size="sm" className="flex items-center gap-1">
                  <Users size={12} /> {questionData.groupType}
                </Badge>
                {questionData.isAnonymous && (
                  <Badge variant="anonymous" size="sm">匿名提问</Badge>
                )}
                <span className="text-xs text-ink-400 flex items-center gap-1 ml-auto">
                  <Clock size={12} /> {questionData.time} · {questionData.editTime}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-ink-900 font-display tracking-tight leading-tight">
                {questionData.title}
              </h1>

              <div className="flex items-center gap-3">
                {questionData.isAnonymous ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ink-300 to-ink-400 flex items-center justify-center text-white shadow-md">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-ink-800">匿名同学</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-amber-400 flex items-center justify-center text-white font-bold shadow-md`}>
                      {questionData.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink-800">{questionData.authorName}</div>
                      <div className="text-xs text-ink-500">{questionData.authorSchool}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {questionData.tags.map((t, i) => (
                  <Tag
                    key={t}
                    variant={(['brand', 'teal', 'amber', 'sky', 'rose', 'ink'] as const)[i % 6]}
                    size="sm"
                  >
                    #{t}
                  </Tag>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Badge variant="senior" size="sm" className="flex items-center gap-1">
                  <Users size={11} /> 双非交流圈
                </Badge>
                <Badge variant="info" size="sm" className="flex items-center gap-1">
                  <Hash size={11} /> 计算机专业圈
                </Badge>
                <Badge variant="brand" size="sm" className="flex items-center gap-1">
                  <MapPinIcon size={11} /> 上海实习圈
                </Badge>
              </div>

              <div className="p-5 rounded-2xl bg-cream-100/70 border border-cream-200">
                <div className="prose prose-sm max-w-none text-ink-700 leading-relaxed whitespace-pre-line">
                  {questionData.content}
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-ink-100">
                <div className="flex items-center gap-5 text-sm text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <Eye size={16} /> <span className="font-num">{questionData.views.toLocaleString()}</span> 浏览
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle size={16} /> <span className="font-num">{questionData.answers}</span> 回答
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp size={16} /> <span className="font-num">{questionData.likes.toLocaleString()}</span> 点赞
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuestionLiked(!questionLiked)}
                    className={`flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-sm font-medium transition-all ${
                      questionLiked
                        ? 'bg-brand-50 text-brand-600 border border-brand-200'
                        : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700'
                    }`}
                  >
                    <ThumbsUp size={15} fill={questionLiked ? 'currentColor' : 'none'} />
                    <span className="font-num">{questionLiked ? questionData.likes + 1 : questionData.likes}</span>
                  </button>
                  <button
                    onClick={() => setQuestionFollowed(!questionFollowed)}
                    className={`flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-sm font-medium transition-all ${
                      questionFollowed
                        ? 'bg-teal-50 text-teal-600 border border-teal-200'
                        : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700'
                    }`}
                  >
                    <Bookmark size={15} fill={questionFollowed ? 'currentColor' : 'none'} />
                    {questionFollowed ? '已收藏' : '收藏'}
                  </button>
                  <button className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-400 hover:bg-ink-50 hover:text-danger-500 transition-all">
                    <Flag size={16} />
                  </button>
                  <button className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-400 hover:bg-ink-50 hover:text-ink-600 transition-all">
                    <Share2 size={16} />
                  </button>
                  <button className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-400 hover:bg-ink-50 hover:text-ink-600 transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-bold text-ink-900 font-display flex items-center gap-3">
                {questionData.answers} 个回答
                {adoptedAnswer && (
                  <Badge variant="success" size="sm" className="flex items-center gap-1">
                    <Check size={12} /> 已采纳最佳答案
                  </Badge>
                )}
              </h2>
              <div className="flex items-center p-1 bg-ink-50 rounded-xl">
                {['按推荐', '按时间', '按点赞'].map((s, i) => (
                  <button
                    key={s}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      i === 0 ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {answers.map((a, i) => (
              <Card
                key={a.id}
                className={`animate-fade-in-up overflow-hidden ${
                  a.isAdopted
                    ? 'border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white'
                    : a.isSenior
                    ? 'border-2 border-teal-200/80 bg-gradient-to-br from-white via-teal-50/30 to-white'
                    : ''
                }`}
                style={{ animationDelay: `${60 + i * 80}ms` }}
              >
                {a.isAdopted && (
                  <div className="h-10 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-between px-5 text-white text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Check size={16} className="text-white" strokeWidth={3} />
                      </div>
                      提问者已采纳此回答为最佳答案
                    </span>
                    <Badge variant="success" size="xs" className="bg-white/20 border-white/30 text-white">
                      <Star size={10} className="mr-0.5" /> 优质回答
                    </Badge>
                  </div>
                )}
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`relative shrink-0`}>
                      {a.isAnonymousAuthor ? (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ink-300 to-ink-400 flex items-center justify-center text-white shadow-md">
                          <User size={20} />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.authorBg} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                          {a.authorName.charAt(0)}
                        </div>
                      )}
                      {a.isSenior && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow-lg">
                          <Check size={13} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-ink-900 text-base">{a.authorName}</span>
                        {a.isSenior && (
                          <>
                            <Badge variant="senior" size="xs" className="flex items-center gap-0.5">
                              <ShieldCheck size={10} /> 已认证学长
                            </Badge>
                            <Badge variant="info" size="xs">
                              {a.authorCompany}
                            </Badge>
                          </>
                        )}
                        {a.rating === 5 && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-ink-600 font-medium">{a.authorTitle}</div>
                      <div className="flex items-center gap-3 text-xs text-ink-400 mt-0.5 flex-wrap">
                        {a.isSenior && a.authorDesc && <span>{a.authorDesc}</span>}
                        {a.isSenior && a.authorDesc && <span>·</span>}
                        <span className="flex items-center gap-1"><Clock size={11} /> {a.time}</span>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-300 hover:bg-ink-50 hover:text-ink-500 transition-all shrink-0">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <div className={`p-4 rounded-2xl ${
                    a.isAdopted
                      ? 'bg-white/80 border border-emerald-200/60'
                      : a.isSenior
                      ? 'bg-white/70 border border-teal-100/60'
                      : 'bg-cream-50/60 border border-cream-200'
                  }`}>
                    <div className="prose prose-sm max-w-none text-ink-700 leading-relaxed whitespace-pre-line">
                      {a.content}
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLikeAnswer(a.id)}
                        className={`flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-medium transition-all ${
                          likedAnswers.includes(a.id)
                            ? 'bg-brand-50 text-brand-600 border border-brand-200'
                            : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700 border border-transparent'
                        }`}
                      >
                        <ThumbsUp size={15} fill={likedAnswers.includes(a.id) ? 'currentColor' : 'none'} />
                        <span className="font-num">{likedAnswers.includes(a.id) ? a.likes + 1 : a.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-700 transition-all">
                        <MessageCircle size={15} />
                        <span className="font-num">{a.comments}</span> 评论
                      </button>
                      <button className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-400 hover:bg-ink-50 hover:text-teal-500 transition-all">
                        <Share2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {isQuestionOwner && !a.isAdopted && (
                        <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                          <Check size={13} /> 采纳
                        </Button>
                      )}
                      <button className="flex items-center gap-1 text-xs text-ink-400 hover:text-danger-500 transition-colors px-2 h-8 rounded-lg hover:bg-danger-50">
                        <Flag size={13} /> 举报
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send size={20} className="text-brand-500" />
                写下你的回答
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-cream-100/60 border border-cream-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ink-300 to-ink-400 flex items-center justify-center text-white font-semibold shrink-0">
                    我
                  </div>
                  <div>
                    <div className="font-medium text-ink-800 text-sm">
                      {isAnonymousAnswer ? '匿名回答' : '以我的身份回答'}
                    </div>
                    <div className="text-xs text-ink-500">
                      {isAnonymousAnswer ? '回答将匿名展示，保护隐私' : '回答将展示你的公开信息'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-600">匿名回答</span>
                  <button
                    onClick={() => setIsAnonymousAnswer(!isAnonymousAnswer)}
                    className={`relative w-11 h-6 rounded-full transition-all ${
                      isAnonymousAnswer ? 'bg-brand-500' : 'bg-ink-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                        isAnonymousAnswer ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="分享你的经验和见解，帮助更多同学..."
                  className="w-full h-48 px-4 py-3 rounded-xl border border-ink-200 bg-white text-sm text-ink-800 placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all outline-none resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-ink-400 font-num">
                  {answerText.length}/2000
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-ink-500 flex items-center gap-1">
                  <LightbulbIcon size={14} className="text-amber-500" />
                  回答字数建议<b className="text-brand-600">≥50字</b>，优质回答有机会获得<b className="text-brand-600">平台学长认证</b>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    草稿箱
                  </Button>
                  <Button size="md" leftIcon={<Send size={16} />}>
                    发布回答
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <aside className="lg:col-span-4 space-y-5">
          <Card className="animate-fade-in-up" style={{ animationDelay: '40ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search size={18} className="text-brand-500" />
                同类问题推荐
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {questionData.relatedQuestions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => navigate(`/questions/${q.id}`)}
                  className="w-full text-left p-3 rounded-xl hover:bg-ink-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink-700 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                      {q.title}
                    </span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up sticky top-8" style={{ animationDelay: '80ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-500" />
                可咨询的学长学姐
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {mentorsList.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 transition-all cursor-pointer border border-transparent hover:border-teal-200"
                >
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.bg} flex items-center justify-center text-white font-bold shadow`}>
                      {m.name.charAt(0)}
                    </div>
                    {m.online ? (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse-dot" />
                    ) : (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink-300 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-ink-800 text-sm">{m.name}</span>
                      <ShieldCheck size={12} className="text-teal-500" />
                    </div>
                    <div className="text-xs text-ink-500 truncate">{m.title}</div>
                  </div>
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => alert('即将跳转到私信页面~')}
                    className="shrink-0"
                  >
                    <MessageCircle size={12} className="mr-1" /> 咨询TA
                  </Button>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-2" size="sm">
                查看全部 248 位认证学长
                <ChevronRight size={14} />
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up border-gradient-to-r from-brand-100 to-teal-100 bg-gradient-to-br from-cream-50 via-white to-teal-50/40" style={{ animationDelay: '120ms' }}>
            <CardContent>
              <div className="text-center mb-4">
                <h3 className="font-bold text-ink-900 text-lg">萌新互助社区</h3>
                <p className="text-xs text-ink-500 mt-1">学长学姐帮你少走弯路</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-3 rounded-xl bg-white text-center shadow-sm">
                  <div className="text-xl font-bold text-brand-600 font-num">58k+</div>
                  <div className="text-[10px] text-ink-500 mt-0.5">认证学长</div>
                </div>
                <div className="p-3 rounded-xl bg-white text-center shadow-sm">
                  <div className="text-xl font-bold text-teal-600 font-num">320k+</div>
                  <div className="text-[10px] text-ink-500 mt-0.5">问题回答</div>
                </div>
                <div className="p-3 rounded-xl bg-white text-center shadow-sm">
                  <div className="text-xl font-bold text-amber-600 font-num">98%</div>
                  <div className="text-[10px] text-ink-500 mt-0.5">解答率</div>
                </div>
              </div>
              <Button className="w-full" variant="secondary">
                <Hash size={16} className="mr-2" /> 加入我的分群
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LightbulbIcon(props: any) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}
