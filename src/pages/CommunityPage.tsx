import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hash,
  Eye,
  MessageCircle,
  ThumbsUp,
  Send,
  Plus,
  Search,
  Flame,
  TrendingUp,
  Clock,
  User,
  ShieldCheck,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

const groupTabs = [
  { id: 'all', name: '全部动态', count: '12.8k' },
  { id: 'school', name: '按院校', count: '3,240' },
  { id: 'major', name: '按专业', count: '4,560' },
  { id: 'city', name: '按城市', count: '2,180' },
];

const hotTopics = [
  { rank: 1, title: '2026暑期实习投递进度贴', heat: 9820, tag: '求职' },
  { rank: 2, title: '字节跳动面试经验汇总', heat: 8450, tag: '面经' },
  { rank: 3, title: '双非逆袭大厂真实案例', heat: 7230, tag: '经验' },
  { rank: 4, title: '实习生要不要内卷？', heat: 6890, tag: '讨论' },
  { rank: 5, title: 'HR最讨厌的简历雷区', heat: 6120, tag: '避坑' },
  { rank: 6, title: '零基础转码可行性分析', heat: 5780, tag: '转行' },
  { rank: 7, title: '各厂薪资待遇大比拼', heat: 5340, tag: '薪资' },
  { rank: 8, title: '远程实习靠谱吗？', heat: 4890, tag: '讨论' },
  { rank: 9, title: '投行/咨询暑期体验', heat: 4520, tag: '行业' },
  { rank: 10, title: '实习证明怎么开？', heat: 4180, tag: '干货' },
];

const tagCloud = [
  { name: '暑期实习', hot: true },
  { name: '内推码', hot: true },
  { name: '前端开发', hot: false },
  { name: '产品经理', hot: true },
  { name: '算法岗', hot: false },
  { name: '运营实习', hot: false },
  { name: '群面技巧', hot: true },
  { name: '自我介绍', hot: false },
  { name: '简历模板', hot: true },
  { name: '远程实习', hot: false },
  { name: '国企上岸', hot: false },
  { name: '外资体验', hot: false },
  { name: '快消mkt', hot: true },
  { name: '数据分析', hot: false },
  { name: '游戏行业', hot: false },
  { name: '金融实习', hot: true },
];

const questions = [
  {
    id: 1,
    title: '大三零基础如何准备互联网暑期实习？求大佬指点！',
    summary: '本人某985大三，EE专业，之前没有任何互联网相关的实习和项目经验。最近想找暑期产品/运营岗实习，但是投了十几家都没有回音...请问现在应该怎么准备？有没有速成的方法？',
    tags: ['求职经验', '零基础', '暑期实习'],
    views: 12500,
    answers: 128,
    likes: 856,
    time: '2小时前',
    isAnonymous: true,
    school: '按院校',
    category: '985高校圈',
    hasSeniorAnswer: true,
    seniorAnswer: {
      name: '李学长',
      title: '字节·产品经理',
      content: '先明确方向再发力！产品岗重点准备3个项目作品（竞品分析+需求文档+原型图），运营岗需要用数据证明你的sense...',
      avatarBg: 'bg-gradient-to-br from-teal-400 to-brand-400',
      verified: true,
    },
  },
  {
    id: 2,
    title: '字节跳动HR面经分享，已OC！（内含完整问题list）',
    summary: '热腾腾的面经来啦！三轮技术面+一轮HR面已过，今天收到OC电话！总结了所有被问到的问题和我的回答思路，希望帮到还在努力的同学们~',
    tags: ['面经分享', '字节跳动', '已offer'],
    views: 8900,
    answers: 89,
    likes: 1245,
    time: '5小时前',
    isAnonymous: false,
    authorName: '李学长',
    authorTitle: '已入职·抖音电商',
    school: '按院校',
    category: '留学生圈',
    hasSeniorAnswer: true,
    seniorAnswer: {
      name: '李学长',
      title: '字节·高级产品',
      content: '感谢分享！补充一点：终面的行为面试其实考察的是你的自我认知和故事讲述能力，建议用STAR法则准备3-5个...',
      avatarBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
      verified: true,
    },
  },
  {
    id: 3,
    title: '实习三个月要不要跑路？感觉每天都是打杂学不到东西',
    summary: '某大厂运营岗实习两个半月了，每天的工作就是拉数据、做表格、复制粘贴写文案。leader很忙基本不管我，也没有什么正经的项目分配。很焦虑这样下去简历没东西写，要不要提前跑路？',
    tags: ['职场困惑', '实习体验', '求助'],
    views: 23400,
    answers: 256,
    likes: 2100,
    time: '8小时前',
    isAnonymous: true,
    school: '按专业',
    category: '经管类圈',
    hasSeniorAnswer: true,
    seniorAnswer: {
      name: '王学姐',
      title: '腾讯·运营主管',
      content: '先别急着跑！建议你主动找leader做一次1on1沟通，把你想做更有挑战的工作的诉求说清楚...',
      avatarBg: 'bg-gradient-to-br from-sky-400 to-teal-500',
      verified: true,
    },
  },
  {
    id: 4,
    title: '双非本科进大厂的真实路径分享（非鸡汤，纯干货）',
    summary: '楼主本人广东某双非本科，去年拿到字节SP offer。看到很多学历背景一般的同学很焦虑，决定把自己从大一开始的规划、踩过的坑、逆袭的关键节点都写出来，希望能给大家参考。',
    tags: ['逆袭经验', '双非', '求职规划'],
    views: 18700,
    answers: 167,
    likes: 3280,
    time: '1天前',
    isAnonymous: false,
    authorName: '陈学长',
    authorTitle: '字节·前端工程师',
    school: '按院校',
    category: '双非交流圈',
    hasSeniorAnswer: false,
  },
  {
    id: 5,
    title: '刚入职第一周就想离职，正常吗？',
    summary: '某大厂数据岗，入职刚一周。组里氛围很冷漠，大家各做各的，吃饭也都是一个人。导师分配了一个我完全不会的任务，问问题感觉对方也很不耐烦。每天都很emo，是我太脆弱了吗？',
    tags: ['新人困惑', '职场适应', '求助'],
    views: 15600,
    answers: 198,
    likes: 890,
    time: '1天前',
    isAnonymous: true,
    school: '按城市',
    category: '上海实习圈',
    hasSeniorAnswer: true,
    seniorAnswer: {
      name: '赵学姐',
      title: '美团·HRBP',
      content: '太正常了！入职前两周的culture shock几乎每个人都会经历。我给你的建议是：先撑过第一个月...',
      avatarBg: 'bg-gradient-to-br from-rose-400 to-pink-500',
      verified: true,
    },
  },
  {
    id: 6,
    title: '如何写出让HR眼前一亮的简历？附模板和案例对比',
    summary: '帮20+同学改过简历后总结的经验。很多同学的简历最大问题不是没经历，而是不会用STAR法则和数据量化描述。分享我总结的5个核心技巧+实际修改案例。',
    tags: ['简历技巧', '干货', '模板'],
    views: 32100,
    answers: 87,
    likes: 5680,
    time: '2天前',
    isAnonymous: false,
    authorName: '林学姐',
    authorTitle: '猎头·资深顾问',
    school: '按专业',
    category: 'CS技术圈',
    hasSeniorAnswer: false,
  },
  {
    id: 7,
    title: '女生在互联网技术岗的真实体验？性别歧视真的存在吗',
    summary: '计算机女生，最近在考虑要不要走技术路线。听说互联网女生面试容易被问婚育问题，而且技术团队女生很少容易被边缘化...有没有正在做技术的学姐分享一下真实体验？',
    tags: ['女生求职', '互联网', '真实体验'],
    views: 21300,
    answers: 312,
    likes: 1890,
    time: '2天前',
    isAnonymous: true,
    school: '按专业',
    category: '女生互助圈',
    hasSeniorAnswer: true,
    seniorAnswer: {
      name: '刘学姐',
      title: '蚂蚁·技术专家',
      content: '从业8年，客观说一下：性别确实在某些场景会被讨论，但大厂总体环境在变好。最重要的是你自己的能力...',
      avatarBg: 'bg-gradient-to-br from-purple-400 to-brand-400',
      verified: true,
    },
  },
  {
    id: 8,
    title: '金融行业实习鄙视链？投行>行研>资管>银行？',
    summary: '经管学院大三，最近在纠结summer方向。想问问学长学姐金融各细分方向的真实体验、薪资、wlb、留用情况到底怎么样？真的有所谓的鄙视链吗？',
    tags: ['金融实习', '行业选择', '职业规划'],
    views: 14200,
    answers: 143,
    likes: 760,
    time: '3天前',
    isAnonymous: true,
    school: '按院校',
    category: '财经类圈',
    hasSeniorAnswer: true,
    seniorAnswer: {
      name: '周学长',
      title: '高盛·VP',
      content: '所谓鄙视链更多是学生群体的刻板印象。我建议你选方向的优先级：1.你真正感兴趣的领域 2.能接触核心业务 3.团队氛围...',
      avatarBg: 'bg-gradient-to-br from-amber-500 to-yellow-400',
      verified: true,
    },
  },
  {
    id: 9,
    title: '已拿到4个offer，求帮选！腾讯/字节/美团/小红书',
    summary: 'bg：华五硕，暑期拿到了4个产品岗offer，各有优劣纠结死了。薪资是字节>腾讯>小红书>美团，业务方向腾讯最核心但听说加班很严重，小红书WLB据说最好但担心平台不够大...',
    tags: ['offer选择', '求助', '产品岗'],
    views: 27800,
    answers: 234,
    likes: 1450,
    time: '3天前',
    isAnonymous: true,
    school: '按城市',
    category: '北京实习圈',
    hasSeniorAnswer: false,
  },
  {
    id: 10,
    title: 'Gap year做什么比较有价值？',
    summary: '因为一些原因要gap一年，不想浪费这宝贵的时间。目前有几个选择：1.做一段长期实习 2.参与开源项目 3.参加比赛 4.自学一门新技能。大家觉得gap year最有价值的事情是什么？',
    tags: ['Gap Year', '规划', '成长'],
    views: 11200,
    answers: 98,
    likes: 620,
    time: '4天前',
    isAnonymous: true,
    school: '按院校',
    category: '研究生圈',
    hasSeniorAnswer: true,
    seniorAnswer: {
      name: '孙学长',
      title: '创业中·前PM',
      content: 'gap过半年来回答。如果是我再选一次，我会花至少1-2个月去旅行或者做完全和专业无关的事...',
      avatarBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      verified: true,
    },
  },
];

const onlineMentors = [
  { name: '李学长', title: '字节·产品', online: true, avatarBg: 'from-teal-400 to-brand-400' },
  { name: '王学姐', title: '腾讯·运营', online: true, avatarBg: 'from-amber-400 to-orange-500' },
  { name: '张学长', title: '阿里·算法', online: true, avatarBg: 'from-sky-400 to-indigo-500' },
  { name: '陈学姐', title: '宝洁·MKT', online: true, avatarBg: 'from-rose-400 to-pink-500' },
  { name: '刘学长', title: '高盛·IBD', online: false, avatarBg: 'from-amber-500 to-yellow-400' },
  { name: '赵学姐', title: '美团·HR', online: true, avatarBg: 'from-emerald-400 to-teal-500' },
];

const tagVariantMap = {
  brand: 'brand' as const,
  teal: 'teal' as const,
  amber: 'amber' as const,
  sky: 'sky' as const,
  rose: 'rose' as const,
  ink: 'ink' as const,
};

export default function CommunityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    groupType: 'school',
    groupValue: '',
    isAnonymous: false,
  });

  const filteredQuestions = activeGroup === 'all'
    ? questions
    : questions.filter((q) => q.school === groupTabs.find((t) => t.id === activeGroup)?.name);

  const handleTabClick = (tabId: string, idx: number) => {
    setActiveTab(idx);
    setActiveGroup(tabId);
  };

  const handleSubmitQuestion = () => {
    setIsModalOpen(false);
    setNewQuestion({ title: '', content: '', groupType: 'school', groupValue: '', isAnonymous: false });
  };

  return (
    <div className="min-h-screen bg-cream-50 py-8 relative">
      <div className="container grid lg:grid-cols-12 gap-6">
        {/* 左侧 - 热门话题 + 标签云 */}
        <aside className="lg:col-span-3 space-y-5">
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame size={20} className="text-brand-500" />
                热门话题榜
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {hotTopics.map((t) => (
                <button
                  key={t.rank}
                  onClick={() => navigate('/community/topic/' + t.rank)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-ink-50 transition-all group text-left cursor-pointer"
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    t.rank <= 3
                      ? 'bg-gradient-to-br from-brand-500 to-orange-500 text-white'
                      : 'bg-ink-100 text-ink-500'
                  }`}>
                    {t.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-800 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
                      {t.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Tag variant="ink" size="xs">{t.tag}</Tag>
                      <span className="text-xs text-brand-500 font-semibold flex items-center gap-0.5">
                        <TrendingUp size={10} /> {t.heat.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash size={20} className="text-teal-500" />
                热门标签
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {tagCloud.map((t) => (
                  <Tag
                    key={t.name}
                    variant={t.hot ? 'brand' : 'ink'}
                    size="sm"
                  >
                    {t.hot && <Flame size={12} className="mr-0.5" />}
                    {t.name}
                  </Tag>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* 中间 - 问答流 */}
        <main className="lg:col-span-6 space-y-5">
          {/* Tab + 搜索 */}
          <Card className="animate-fade-in-up">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-1 bg-ink-50 rounded-xl overflow-x-auto">
                {groupTabs.map((tab, i) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id, i)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                      activeTab === i
                        ? 'bg-brand-500 text-white shadow-soft'
                        : 'bg-ink-100 text-ink-500 hover:text-ink-800 hover:bg-ink-200'
                    }`}
                  >
                    {tab.name}
                    <span className={`text-xs font-num ${activeTab === i ? 'text-white/90' : 'text-ink-400'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              <Input
                placeholder="搜索问题、话题、标签..."
                leftIcon={<Search size={16} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* 问题列表 */}
          <div className="space-y-4">
            {filteredQuestions.map((q, i) => (
              <Card
                key={q.id}
                hoverable
                className="animate-fade-in-up cursor-pointer hover:shadow-card transition"
                onClick={() => navigate('/community/' + q.id)}
                style={{ animationDelay: `${80 + i * 50}ms` }}
              >
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info" size="xs"><Hash size={10} /> {q.category}</Badge>
                    {q.tags.slice(0, 2).map((t) => (
                      <Tag key={t} variant={(i % 2 === 0 ? 'brand' : 'teal') as 'brand' | 'teal'} size="xs">
                        {t}
                      </Tag>
                    ))}
                    <span className="text-xs text-ink-400 ml-auto flex items-center gap-1">
                      <Clock size={12} /> {q.time}
                    </span>
                  </div>

                  <h3 className="font-bold text-ink-900 text-lg leading-snug hover:text-brand-600 transition-colors cursor-pointer">
                    {q.title}
                  </h3>

                  <p className="text-sm text-ink-500 leading-relaxed line-clamp-2">
                    {q.summary}
                  </p>

                  {q.hasSeniorAnswer && q.seniorAnswer && (
                    <div className="relative pl-5 py-3 rounded-xl bg-gradient-to-r from-teal-50/80 to-brand-50/50 border-2 border-teal-100">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-teal-400 to-brand-400" />
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${q.seniorAnswer.avatarBg} flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white shadow-md`}>
                          {q.seniorAnswer.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-ink-800">{q.seniorAnswer.name}</span>
                            <Badge variant="senior" size="xs" className="flex items-center gap-0.5">
                              <ShieldCheck size={10} /> 学长认证
                            </Badge>
                            <span className="text-xs text-ink-500">{q.seniorAnswer.title}</span>
                          </div>
                          <p className="text-sm text-ink-700 leading-relaxed">
                            {q.seniorAnswer.content}
                            <button className="text-brand-600 font-medium hover:underline ml-1">阅读完整回答 →</button>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-ink-100 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        q.isAnonymous
                          ? 'bg-ink-200 text-ink-600'
                          : 'bg-gradient-to-br from-brand-400 to-teal-400 text-white'
                      }`}>
                        {q.isAnonymous ? '匿' : q.authorName?.charAt(0) || '用'}
                      </div>
                      <span className="text-sm text-ink-600 font-medium">
                        {q.isAnonymous ? '匿名用户' : q.authorName}
                      </span>
                      {!q.isAnonymous && q.authorTitle && (
                        <span className="text-xs text-ink-400">· {q.authorTitle}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-ink-400">
                      <span className="flex items-center gap-1"><Eye size={15} /> <span className="font-num">{(q.views / 1000).toFixed(1)}k</span></span>
                      <span className="flex items-center gap-1"><MessageCircle size={15} /> <span className="font-num">{q.answers}</span></span>
                      <span className="flex items-center gap-1 hover:text-brand-500 cursor-pointer transition-colors"><ThumbsUp size={15} /> <span className="font-num">{q.likes}</span></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-2 pb-8">
            <Button variant="outline" size="lg">
              加载更多问题
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </main>

        {/* 右侧 - 学长在线面板 */}
        <aside className="lg:col-span-3 space-y-5">
          <Card className="sticky top-8 animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User size={20} className="text-teal-500" />
                  学长学姐在线
                </CardTitle>
                <Badge variant="success" size="xs" dot>
                  {onlineMentors.filter((m) => m.online).length} 人在线
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {onlineMentors.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50 transition-all cursor-pointer group"
                >
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.avatarBg} flex items-center justify-center text-white font-bold shadow`}>
                      {m.name.charAt(0)}
                    </div>
                    {m.online ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse-dot" />
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-ink-300 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-ink-800 text-sm">{m.name}</span>
                      <ShieldCheck size={12} className="text-teal-500" />
                    </div>
                    <div className="text-xs text-ink-500 truncate">{m.title}</div>
                  </div>
                  <button
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      m.online
                        ? 'bg-brand-50 text-brand-500 opacity-0 group-hover:opacity-100'
                        : 'bg-ink-100 text-ink-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/community/' + 1);
                    }}
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-3" size="sm">
                查看更多学长
              </Button>
            </CardContent>
          </Card>

          <Card className="sticky top-[360px] animate-fade-in-up border-teal-200/60 bg-gradient-to-br from-teal-50/60 via-cream-50 to-brand-50/40" style={{ animationDelay: '80ms' }}>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900">有问题，发个帖</h3>
                  <p className="text-xs text-ink-500">3分钟内必有学长回答</p>
                </div>
              </div>
              <Button className="w-full" leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
                发起新提问
              </Button>
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-ink-100">
                <div>
                  <div className="font-bold text-brand-600 font-num">5.8k</div>
                  <div className="text-[10px] text-ink-500">今日提问</div>
                </div>
                <div>
                  <div className="font-bold text-teal-600 font-num">98%</div>
                  <div className="text-[10px] text-ink-500">解答率</div>
                </div>
                <div>
                  <div className="font-bold text-amber-600 font-num">{'<3min'}</div>
                  <div className="text-[10px] text-ink-500">平均响应</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* 悬浮提问按钮 (移动端) */}
      <button
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-brand-gradient text-white shadow-float flex items-center justify-center z-40 active:scale-95 transition-transform"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* 发布提问 Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="发布新提问"
        description="向学长学姐们请教你的困惑吧"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmitQuestion} leftIcon={<Send size={16} />}>发布提问</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">问题标题</label>
            <Input
              placeholder="一句话描述你的问题，例如：大三如何准备暑期实习？"
              value={newQuestion.title}
              onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">问题详情</label>
            <textarea
              className="w-full min-h-[140px] px-4 py-3 rounded-xl2 bg-white border border-ink-200 hover:border-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none transition-all text-sm text-ink-800 placeholder:text-ink-300 resize-none"
              placeholder="详细描述你的背景、具体问题和期望获得的帮助..."
              value={newQuestion.content}
              onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">分群类型</label>
              <div className="flex gap-2">
                {[
                  { id: 'school', label: '按院校' },
                  { id: 'major', label: '按专业' },
                  { id: 'city', label: '按城市' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setNewQuestion({ ...newQuestion, groupType: opt.id })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      newQuestion.groupType === opt.id
                        ? 'bg-brand-500 text-white shadow-soft'
                        : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">所属分群</label>
              <Input
                placeholder={
                  newQuestion.groupType === 'school'
                    ? '例如：清华大学'
                    : newQuestion.groupType === 'major'
                    ? '例如：计算机科学'
                    : '例如：北京'
                }
                value={newQuestion.groupValue}
                onChange={(e) => setNewQuestion({ ...newQuestion, groupValue: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-cream-100/60 border border-ink-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center text-brand-500 shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-800">匿名提问</p>
                <p className="text-xs text-ink-500 mt-0.5">隐藏你的个人信息，其他用户无法看到你的身份</p>
              </div>
            </div>
            <button
              onClick={() => setNewQuestion({ ...newQuestion, isAnonymous: !newQuestion.isAnonymous })}
              className={`relative w-12 h-7 rounded-full transition-all duration-200 ${
                newQuestion.isAnonymous ? 'bg-brand-500' : 'bg-ink-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200 ${
                  newQuestion.isAnonymous ? 'left-5.5 translate-x-0.5' : 'left-0.5'
                }`}
                style={{ left: newQuestion.isAnonymous ? '22px' : '2px' }}
              />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
