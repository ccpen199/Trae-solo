import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Answer {
  id: string;
  author: string;
  avatar: string;
  isExpert: boolean;
  expertTitle?: string;
  content: string;
  votes: number;
  userVote: 1 | -1 | 0;
  time: string;
  comments: { author: string; content: string; time: string }[];
}

interface QuestionData {
  id: string;
  title: string;
  tags: string[];
  author: string;
  avatar: string;
  time: string;
  content: string;
  images: string[];
  views: number;
  votes: number;
  userVote: 1 | -1 | 0;
  answers: Answer[];
}

const questionData: Record<string, QuestionData> = {
  q1: {
    id: 'q1',
    title: '卫生间防水层做几遍才保险？闭水试验要多久？',
    tags: ['防水', '卫生间', '水电改造'],
    author: '装修改小白',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    time: '2小时前',
    content: `马上要做卫生间防水了，问了好几个师傅说法都不一样：
- 有的说做2遍就行，有的说必须3遍
- 有的说闭水24小时够了，有的说得48小时
- 淋浴区高度到底是1.5米还是1.8米？
各位有经验的业主或者专业人士帮忙解答一下，怕以后漏水麻烦！预算有限但该花的不能省。`,
    images: [
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('bathroom waterproof coating construction site blue membrane, renovation documentary photography')}&image_size=landscape_4_3&seed=701`,
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('bathroom water leak test flooded floor plumbing renovation, detail photography')}&image_size=landscape_4_3&seed=702`,
    ],
    views: 3421,
    votes: 127,
    userVote: 0,
    answers: [
      {
        id: 'a1',
        author: '李工程师',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert1',
        isExpert: true,
        expertTitle: '15年防水施工专家 · 3260个项目经验',
        content: `作为做了15年防水的老工程师，我给你说标准答案（依据GB 50327-2001）：

**1. 涂刷遍数：必须3遍**
- 第一遍：横向涂刷，重点管根、墙角、地漏周边加强处理
- 第二遍：纵向涂刷（与第一遍垂直方向），厚度均匀不遗漏
- 第三遍：淋浴区、浴缸周边等重点区域再加强一遍

注意：每遍必须干透(4-6h)才能刷下一遍，下雨天不建议施工。

**2. 闭水试验：48小时起步，建议72小时**
- 蓄水深度3-5cm（不淹没门槛）
- 24h后第一次检查楼下，48h再查一次
- 有条件的话，瓷砖贴完再做一次闭水更稳妥

**3. 防水高度标准**
- 淋浴区：≥1.8米（如果是浴缸旁要高出浴缸顶边30cm）
- 洗手台区域：≥1.2米
- 其他墙面干区：≥30cm
- 门口：向外延伸30cm防水翻边，防止水往外渗

额外提醒：阴阳角必须做圆弧倒角，管道根部用堵漏王加强处理，防水材料一定要用大品牌（雨虹/德高/科顺），不要用小厂产品省那几百块。`,
        votes: 389,
        userVote: 1,
        time: '1小时前',
        comments: [
          { author: '装修改小白', content: '感谢专家！太详细了，这下放心了', time: '30分钟前' },
          { author: '另一个业主', content: '请问防水做完之后直接贴砖吗？', time: '20分钟前' },
        ],
      },
      {
        id: 'a2',
        author: '过来人小王',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_a2',
        isExpert: false,
        content: `我就是前车之鉴！第一套房子装修时图省事只做了2遍防水，闭水24小时没漏就贴砖了，结果入住半年楼下就找过来了...

返工花了8000多不说，还欠了楼下人家人情，真的悔死。第二套房我直接盯着师傅做了3遍，闭水48小时亲自去楼下看了2次，目前3年了没任何问题。

听过来人一句劝：**防水是隐蔽工程中的重中之重**，多花一天时间、多刷一遍材料，绝对值得！`,
        votes: 187,
        userVote: 0,
        time: '45分钟前',
        comments: [
          { author: '焦虑业主', content: '返工是要把地砖都砸了吗？太可怕了', time: '15分钟前' },
        ],
      },
      {
        id: 'a3',
        author: '张工长',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert2',
        isExpert: true,
        expertTitle: '从业12年资深工长 · 认证专家',
        content: `补充几个容易忽略的细节：

1. **门口防水翻边**一定要做！很多人家水从门口往过道渗，墙面和木地板全泡坏，就是门口没做反水坝
2. **二次排水**很重要，沉箱底部做暗漏，就算砖面渗水也能排走
3. 卫生间**门套底部**要打玻璃胶密封，水汽从砖缝渗出去腐蚀门套的案例太多了
4. 做完防水贴砖时，**不要破坏防水层**，师傅切割瓷砖时要盯着点

做到这些基本可以杜绝99%的防水问题。`,
        votes: 256,
        userVote: 0,
        time: '30分钟前',
        comments: [],
      },
    ],
  },
};

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = questionData[id || 'q1'] || questionData['q1'];
  const [questionVote, setQuestionVote] = useState<1 | -1 | 0>(data.userVote);
  const [answers, setAnswers] = useState(data.answers);
  const [myAnswer, setMyAnswer] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const handleQuestionVote = (vote: 1 | -1) => {
    setQuestionVote(prev => prev === vote ? 0 : vote);
  };

  const handleAnswerVote = (answerId: string, vote: 1 | -1) => {
    setAnswers(prev => prev.map(a => {
      if (a.id !== answerId) return a;
      const oldVote = a.userVote;
      const newVote = oldVote === vote ? 0 : vote;
      return {
        ...a,
        userVote: newVote,
        votes: a.votes - oldVote + newVote,
      };
    }));
  };

  const toggleComments = (answerId: string) => {
    setExpandedComments(prev => ({ ...prev, [answerId]: !prev[answerId] }));
  };

  const questionVoteCount = data.votes + questionVote - data.userVote;

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8 max-w-5xl">
        <button
          onClick={() => navigate('/owner/community')}
          className="btn-ghost mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回问答社区
        </button>

        <div className="grid grid-cols-10 gap-8">
          <div className="col-span-7 space-y-6">
            <div className="card-base p-6 md:p-8">
              <div className="flex gap-2 mb-4 flex-wrap">
                {data.tags.map(tag => (
                  <span key={tag} className="badge bg-haze-50 text-haze-700 border-haze-200 text-[11px]">
                    <Sparkles className="w-3 h-3 mr-0.5" />
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="font-serif text-2xl md:text-3xl font-bold text-carbon-900 mb-5 leading-tight">
                {data.title}
              </h1>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-ivory-100">
                <img src={data.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <div className="flex-1">
                  <p className="font-medium text-carbon-800">{data.author}</p>
                  <p className="text-xs text-ivory-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {data.time}
                    <span className="mx-1">·</span>
                    <Eye className="w-3 h-3" />
                    {data.views.toLocaleString()} 浏览
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuestionVote(1)}
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                      questionVote === 1
                        ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/30'
                        : 'bg-ivory-100 text-carbon-500 hover:bg-terracotta-100 hover:text-terracotta-600'
                    )}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <span className={cn(
                    'w-10 text-center font-semibold text-sm',
                    questionVote === 1 ? 'text-terracotta-600' : questionVote === -1 ? 'text-haze-600' : 'text-carbon-700'
                  )}>
                    {questionVoteCount}
                  </span>
                  <button
                    onClick={() => handleQuestionVote(-1)}
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                      questionVote === -1
                        ? 'bg-haze-500 text-white shadow-md shadow-haze-500/30'
                        : 'bg-ivory-100 text-carbon-500 hover:bg-haze-100 hover:text-haze-600'
                    )}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="prose prose-carbon max-w-none">
                {data.content.split('\n').map((para, i) => (
                  <p key={i} className="text-carbon-700 leading-relaxed mb-3 whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>

              {data.images.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {data.images.map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden shadow-sm border border-ivory-200">
                      <img src={img} alt="" className="w-full h-44 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-serif text-xl font-bold text-carbon-800 mb-4 flex items-baseline gap-2">
                全部回答
                <span className="text-base font-normal text-ivory-500">({answers.length})</span>
              </h2>

              <AnimatePresence>
                {answers.map((answer, idx) => (
                  <motion.div
                    key={answer.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    className={cn(
                      'card-base p-6 mb-4 relative overflow-hidden',
                      answer.isExpert && 'bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-amber-200/60'
                    )}
                  >
                    {answer.isExpert && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-300/20 to-transparent rounded-bl-full" />
                    )}
                    <div className="relative">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative">
                          <img
                            src={answer.avatar}
                            alt=""
                            className={cn(
                              'w-11 h-11 rounded-full',
                              answer.isExpert && 'ring-2 ring-amber-300 ring-offset-2'
                            )}
                          />
                          {answer.isExpert && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[10px] shadow-md">
                              👨‍🏫
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-carbon-800">{answer.author}</span>
                            {answer.isExpert && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded text-[10px] font-bold">
                                认证专家
                              </span>
                            )}
                          </div>
                          {answer.expertTitle && (
                            <p className="text-[11px] text-amber-700/80 mt-0.5">{answer.expertTitle}</p>
                          )}
                          <p className="text-xs text-ivory-500 mt-0.5">{answer.time}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAnswerVote(answer.id, 1)}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm',
                              answer.userVote === 1
                                ? 'bg-terracotta-500 text-white shadow-sm'
                                : 'bg-ivory-100 text-carbon-500 hover:bg-terracotta-100 hover:text-terracotta-600'
                            )}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <span className={cn(
                            'w-8 text-center font-semibold text-xs',
                            answer.userVote === 1 ? 'text-terracotta-600' : answer.userVote === -1 ? 'text-haze-600' : 'text-carbon-700'
                          )}>
                            {answer.votes}
                          </span>
                          <button
                            onClick={() => handleAnswerVote(answer.id, -1)}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm',
                              answer.userVote === -1
                                ? 'bg-haze-500 text-white shadow-sm'
                                : 'bg-ivory-100 text-carbon-500 hover:bg-haze-100 hover:text-haze-600'
                            )}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="prose prose-carbon prose-sm max-w-none mb-4">
                        {answer.content.split('\n').map((para, i) => {
                          const isBold = para.startsWith('**') && para.endsWith('**');
                          const cleanPara = para.replace(/\*\*/g, '');
                          if (!para.trim()) return <br key={i} />;
                          return (
                            <p key={i} className={cn(
                              'text-carbon-700 leading-relaxed mb-2 whitespace-pre-line',
                              isBold && 'font-semibold text-carbon-900'
                            )}>
                              {cleanPara}
                            </p>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-4 pt-3 border-t border-ivory-100">
                        <button
                          onClick={() => toggleComments(answer.id)}
                          className="flex items-center gap-1.5 text-xs text-ivory-600 hover:text-terracotta-600 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {answer.comments.length} 条评论
                          {answer.comments.length > 0 && (
                            expandedComments[answer.id]
                              ? <ChevronUp className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-ivory-600 hover:text-terracotta-600 transition-colors">
                          感谢
                        </button>
                      </div>

                      <AnimatePresence>
                        {expandedComments[answer.id] && answer.comments.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 space-y-3 ml-2 pl-4 border-l-2 border-ivory-100">
                              {answer.comments.map((c, ci) => (
                                <div key={ci} className="flex gap-2">
                                  <div className="w-6 h-6 rounded-full bg-ivory-200 flex items-center justify-center text-[10px] font-bold text-carbon-600 flex-shrink-0">
                                    {c.author[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs font-medium text-carbon-700">{c.author}</span>
                                      <span className="text-[10px] text-ivory-400">{c.time}</span>
                                    </div>
                                    <p className="text-xs text-carbon-600 mt-0.5">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="card-base p-6">
              <h3 className="font-semibold text-carbon-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-wood-600" />
                我要回答
              </h3>
              <textarea
                value={myAnswer}
                onChange={e => setMyAnswer(e.target.value)}
                placeholder="分享你的经验和见解，帮助更多装修业主..."
                rows={5}
                className="input-base resize-none text-sm mb-3"
              />
              <div className="flex justify-end">
                <button
                  disabled={!myAnswer.trim()}
                  className={cn(
                    'btn-primary',
                    !myAnswer.trim() && 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <Send className="w-4 h-4" />
                  提交回答
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-3 space-y-5">
            <div className="sticky top-8 space-y-5">
              <div className="card-base p-5">
                <h4 className="font-semibold text-carbon-800 mb-4">📊 问题数据</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-ivory-50 rounded-lg">
                    <span className="text-sm text-ivory-600">浏览量</span>
                    <span className="font-mono font-semibold text-carbon-800">{data.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-terracotta-50/60 rounded-lg">
                    <span className="text-sm text-terracotta-700">投票数</span>
                    <span className="font-mono font-semibold text-terracotta-700">{questionVoteCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-haze-50/60 rounded-lg">
                    <span className="text-sm text-haze-700">回答数</span>
                    <span className="font-mono font-semibold text-haze-700">{answers.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-lg">
                    <span className="text-sm text-amber-800">专家回答</span>
                    <span className="font-mono font-semibold text-amber-700">{answers.filter(a => a.isExpert).length} 位</span>
                  </div>
                </div>
              </div>

              <div className="card-base p-5 bg-gradient-to-br from-terracotta-50 to-wood-50 border-terracotta-100">
                <h4 className="font-semibold text-carbon-800 mb-3">💡 相关推荐</h4>
                <div className="space-y-3">
                  {[
                    '闭水试验的正确方法图解',
                    '防水材料品牌十大排行榜',
                    '卫生间漏水了怎么补救？',
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="text-sm text-carbon-700 hover:text-terracotta-600 cursor-pointer transition-colors flex items-start gap-2"
                    >
                      <span className="text-terracotta-400 mt-0.5">•</span>
                      <span className="leading-snug">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
