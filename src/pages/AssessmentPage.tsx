import { useState } from 'react';
import {
  BrainCircuit,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileDown,
  Target,
  TrendingUp,
  Briefcase,
  Lightbulb,
  Award,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

type Stage = 'intro' | 'quiz' | 'result';

const questions = [
  { id: 1, q: '在团队项目中，你通常担任什么角色？', category: 'EI', options: [
    { v: 'A', text: '主动组织协调，带领大家前进' },
    { v: 'B', text: '提出创意想法，推动创新' },
    { v: 'C', text: '默默执行分配的任务，确保完成' },
    { v: 'D', text: '分析数据，提供决策支持' },
  ]},
  { id: 2, q: '周末你更倾向于：', category: 'SN', options: [
    { v: 'A', text: '参加聚会，和朋友一起出去玩' },
    { v: 'B', text: '独自在家看书、追剧或学习新技能' },
    { v: 'C', text: '约1-2个好朋友聊天散步' },
    { v: 'D', text: '去人少的咖啡馆写东西' },
  ]},
  { id: 3, q: '做决定时，你更依赖：', category: 'TF', options: [
    { v: 'A', text: '逻辑分析，权衡利弊' },
    { v: 'B', text: '直觉和内心感受' },
    { v: 'C', text: '过去的经验和数据' },
    { v: 'D', text: '团队成员的意见' },
  ]},
  { id: 4, q: '面对计划变化，你的反应是：', category: 'JP', options: [
    { v: 'A', text: '有点焦虑，需要重新整理计划' },
    { v: 'B', text: '灵活调整，随机应变' },
    { v: 'C', text: '先分析变化原因再决定' },
    { v: 'D', text: '期待变化带来的新鲜感' },
  ]},
  { id: 5, q: '你认为工作中最重要的是：', category: 'RIASEC', options: [
    { v: 'A', text: '稳定的收入和明确的晋升路径' },
    { v: 'B', text: '能够发挥创造力，做有意义的事' },
    { v: 'C', text: '帮助他人，团队氛围融洽' },
    { v: 'D', text: '不断学习新东西，有挑战性' },
  ]},
  { id: 6, q: '面对复杂问题时，你习惯：', category: 'SN', options: [
    { v: 'A', text: '拆解成小步骤，逐一解决' },
    { v: 'B', text: '先看全局，找到关键突破口' },
    { v: 'C', text: '请教有经验的人' },
    { v: 'D', text: '尝试各种方法直到解决' },
  ]},
  { id: 7, q: '你理想的工作环境是：', category: 'RIASEC', options: [
    { v: 'A', text: '秩序井然，流程清晰' },
    { v: 'B', text: '自由开放，灵感迸发' },
    { v: 'C', text: '温暖和谐，互相支持' },
    { v: 'D', text: '竞争激烈，快节奏高回报' },
  ]},
];

const hollandData = [
  { subject: 'R 现实型', A: 62, fullMark: 100 },
  { subject: 'I 研究型', A: 85, fullMark: 100 },
  { subject: 'A 艺术型', A: 58, fullMark: 100 },
  { subject: 'S 社会型', A: 72, fullMark: 100 },
  { subject: 'E 企业型', A: 78, fullMark: 100 },
  { subject: 'C 常规型', A: 54, fullMark: 100 },
];

const recommendedJobs = [
  { id: 1, name: '产品经理', match: 96, industry: '互联网', tags: ['沟通', '分析', '创新'], icon: Target, color: 'from-brand-400 to-amber-400' },
  { id: 2, name: '数据分析师', match: 92, industry: '大数据', tags: ['逻辑', '洞察', 'SQL'], icon: TrendingUp, color: 'from-teal-400 to-sky-400' },
  { id: 3, name: '全栈开发工程师', match: 88, industry: '互联网', tags: ['编程', '学习力', '解决问题'], icon: Briefcase, color: 'from-violet-400 to-purple-400' },
  { id: 4, name: '用户研究员', match: 85, industry: '设计', tags: ['共情', '分析', '洞察'], icon: BrainCircuit, color: 'from-rose-400 to-pink-400' },
  { id: 5, name: '运营经理', match: 82, industry: '运营', tags: ['沟通', '协调', '数据'], icon: Award, color: 'from-amber-400 to-orange-400' },
  { id: 6, name: '咨询顾问', match: 78, industry: '咨询', tags: ['逻辑', '表达', '抗压'], icon: Lightbulb, color: 'from-sky-400 to-blue-400' },
];

const careerAdvice = [
  '你的ENFJ人格天生具备领导力与同理心，适合需要带领团队、激励他人的岗位，如产品、运营、咨询等方向。',
  '霍兰德代码IES（研究型-企业型-社会型）显示你兼具深度思考能力与商业敏感度，技术+商业的复合路径会很适合你。',
  '建议在校期间多积累商业分析、项目管理相关经验，可以尝试参加创业大赛、咨询案例大赛等活动。',
  '求职时优先选择重视人才培养、有完善导师制度的公司，你的成长速度会在好的平台上被显著放大。',
];

export default function AssessmentPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleStart = () => {
    setStage('quiz');
    setCurrentQ(0);
    setAnswers({});
  };

  const handleSelect = (v: string) => {
    setAnswers({ ...answers, [questions[currentQ].id]: v });
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStage('result');
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const answered = Object.keys(answers).length;
  const progress = stage === 'quiz' ? ((currentQ + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <div className="animate-fade-in-up flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-400 text-white flex items-center justify-center shadow-float">
            <BrainCircuit size={26} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ink-900">职业性格综合测评</h1>
            <p className="text-sm text-ink-500">MBTI + 霍兰德职业兴趣 · 科学定位你的职业方向</p>
          </div>
          {stage === 'result' && (
            <Button variant="outline" size="md" onClick={() => setStage('intro')}>
              <RefreshCw size={15} />
              重新测试
            </Button>
          )}
        </div>

        {stage === 'intro' && (
          <Card className="animate-fade-in-up overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400" />
            <CardContent className="pt-8 pb-8">
              <div className="max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-50 to-violet-50 border border-sky-100 text-sm text-sky-700 font-medium mb-6">
                  <Sparkles size={14} />
                  累计 247,389 位同学做过，好评率 98%
                </div>
                <h2 className="text-3xl font-bold text-ink-900 mb-4">
                  发现你的<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-violet-500"> 职业潜能 </span>
                </h2>
                <p className="text-ink-600 leading-relaxed mb-8">
                  结合国际权威的 MBTI 16型人格与霍兰德职业兴趣理论，
                  共28道精选题目，8分钟即可获得一份完整的职业性格分析报告，
                  帮你精准匹配最适合的岗位方向。
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <InfoCard icon={<Target size={22} />} title="MBTI 人格" desc="16型人格深度解析" color="text-brand-500" bg="bg-brand-50" />
                  <InfoCard icon={<BrainCircuit size={22} />} title="霍兰德代码" desc="6维度职业兴趣" color="text-teal-500" bg="bg-teal-50" />
                  <InfoCard icon={<Briefcase size={22} />} title="岗位匹配" desc="6个精准推荐" color="text-sky-500" bg="bg-sky-50" />
                </div>

                <div className="flex items-center justify-center gap-4 mb-6 text-sm text-ink-500">
                  <span className="flex items-center gap-1.5"><Clock size={15} /> 约 8 分钟</span>
                  <span className="w-1 h-1 rounded-full bg-ink-300" />
                  <span>28 道精选题目</span>
                  <span className="w-1 h-1 rounded-full bg-ink-300" />
                  <span>完全免费</span>
                </div>

                <Button variant="primary" size="lg" onClick={handleStart} className="min-w-[200px] h-14 text-base">
                  <Sparkles size={18} />
                  开始测评
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'quiz' && (
          <Card className="animate-fade-in-up">
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-ink-600">
                    第 <b className="text-brand-600 font-num text-lg">{currentQ + 1}</b> / {questions.length} 题
                  </span>
                  <span className="text-ink-500 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-teal-500" />
                    已答 {answered} 题
                  </span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-ink-900 mb-6 leading-relaxed">
                  {questions[currentQ].q}
                </h3>
                <div className="space-y-3">
                  {questions[currentQ].options.map((opt) => {
                    const selected = answers[questions[currentQ].id] === opt.v;
                    return (
                      <button
                        key={opt.v}
                        onClick={() => handleSelect(opt.v)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 group ${
                          selected
                            ? 'border-brand-400 bg-brand-50/60 shadow-soft scale-[1.01]'
                            : 'border-ink-100 bg-white hover:border-ink-200 hover:bg-cream-50'
                        }`}
                      >
                        <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                          selected
                            ? 'bg-brand-gradient text-white shadow-float'
                            : 'bg-ink-100 text-ink-600 group-hover:bg-ink-200'
                        }`}>
                          {opt.v}
                        </span>
                        <span className={`text-base pt-1 ${selected ? 'text-ink-900 font-medium' : 'text-ink-700'}`}>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between pt-4 border-t border-ink-100">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handlePrev}
                  disabled={currentQ === 0}
                >
                  <ChevronLeft size={16} />
                  上一题
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  disabled={!answers[questions[currentQ].id]}
                >
                  {currentQ === questions.length - 1 ? '查看报告' : '下一题'}
                  <ChevronRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'result' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="overflow-hidden bg-gradient-to-br from-sky-500/5 via-indigo-500/5 to-violet-500/5 border-sky-100">
                <div className="h-1.5 bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400" />
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <Badge variant="info" size="sm" className="mb-4">
                      <Sparkles size={12} />
                      你的 MBTI 人格类型
                    </Badge>
                    <h2 className="text-6xl font-extrabold font-num mb-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                      ENFJ
                    </h2>
                    <h3 className="text-xl font-bold text-ink-900 mb-1">教育家 / 主人公</h3>
                    <p className="text-sm text-ink-500">
                      富有魅力和鼓舞力的领导者，能够激励他人成长
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {[
                      { k: 'E', n: '外向', v: 68 },
                      { k: 'N', n: '直觉', v: 72 },
                      { k: 'F', n: '情感', v: 64 },
                      { k: 'J', n: '判断', v: 58 },
                    ].map((d, i) => (
                      <div key={i} className="text-center p-2 rounded-lg bg-white border border-ink-100">
                        <p className="text-2xl font-bold text-sky-600 font-num">{d.k}</p>
                        <p className="text-[10px] text-ink-500 mt-0.5">{d.n} {d.v}%</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 text-sm text-ink-700 leading-relaxed p-4 rounded-xl bg-white border border-ink-100">
                    <p>
                      <b className="text-sky-700">✨ 核心特质：</b>热情、有责任感、善于沟通、富同理心、具备领袖气质
                    </p>
                    <p>
                      <b className="text-sky-700">💡 典型特征：</b>你天生善于察觉他人的潜能，乐于帮助他人成长。在团队中通常是凝聚人心的角色，能够以热情和远见激励大家共同前进。
                    </p>
                    <p>
                      <b className="text-sky-700">⚡ 成长建议：</b>注意不要过度承担他人的责任，学会适当授权与说"不"，保护好自己的精力边界。
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="text-violet-500" size={22} />
                    霍兰德职业兴趣六边形
                  </CardTitle>
                  <p className="text-sm text-ink-500">你的核心代码：<b className="text-violet-600">I · E · S</b>（研究型·企业型·社会型）</p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={hollandData} outerRadius="80%">
                        <PolarGrid stroke="#e0e7ff" strokeWidth={1} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: '#524E6B', fontSize: 12, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fill: '#a8a2c1', fontSize: 10 }}
                          axisLine={false}
                        />
                        <defs>
                          <linearGradient id="hollandGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} />
                            <stop offset="50%" stopColor="#818cf8" stopOpacity={0.7} />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <Radar
                          name="得分"
                          dataKey="A"
                          stroke="#818cf8"
                          strokeWidth={2.5}
                          fill="url(#hollandGrad)"
                          fillOpacity={0.7}
                          dot={{ stroke: '#6366f1', strokeWidth: 2, fill: '#fff', r: 4 }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {hollandData.slice().sort((a, b) => b.A - a.A).map((d, i) => (
                      <div key={i} className="text-center p-2 rounded-lg bg-gradient-to-br from-sky-50 to-violet-50 border border-sky-100">
                        <p className="text-xs font-bold text-ink-700">{d.subject.split(' ')[0]}</p>
                        <p className="text-lg font-bold font-num text-violet-600">{d.A}<span className="text-xs font-normal">分</span></p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="text-brand-500" size={22} />
                  匹配岗位推荐 <Badge variant="brand" size="sm">共 6 个</Badge>
                </CardTitle>
                <p className="text-sm text-ink-500">基于你的人格特质，这些岗位与你的契合度最高</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedJobs.map((job, idx) => {
                    const Icon = job.icon;
                    return (
                      <Card
                        key={job.id}
                        hoverable
                        className="animate-fade-in-up overflow-hidden"
                        style={{ animationDelay: `${0.05 * idx}s` }}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${job.color} text-white flex items-center justify-center shadow`}>
                              <Icon size={22} />
                            </div>
                            <Badge variant="verified" size="sm">
                              <TrendingUp size={10} />
                              匹配 {job.match}%
                            </Badge>
                          </div>
                          <h4 className="text-lg font-bold text-ink-900 mb-0.5">{job.name}</h4>
                          <p className="text-xs text-ink-500 mb-3">{job.industry}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {job.tags.map((t) => (
                              <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-cream-100 text-ink-600">
                                {t}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-ink-100">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-ink-500">匹配度</span>
                              <span className="font-bold text-teal-600 font-num">{job.match}%</span>
                            </div>
                            <div className="h-1.5 mt-1.5 bg-ink-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${job.color}`}
                                style={{ width: `${job.match}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="text-amber-500" size={22} />
                  职业发展建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {careerAdvice.map((text, i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-white border border-amber-100 animate-fade-in-up"
                      style={{ animationDelay: `${0.05 * i}s` }}
                    >
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center font-bold shadow-lg">
                        {i + 1}
                      </div>
                      <p className="text-sm text-ink-700 leading-relaxed pt-1">{text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-6">
              <Button variant="outline" size="lg" onClick={() => setStage('intro')}>
                <RefreshCw size={16} />
                重新测评
              </Button>
              <Button variant="primary" size="lg" className="min-w-[200px] h-14 text-base">
                <FileDown size={18} />
                导出完整报告 PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc, color, bg }: { icon: any; title: string; desc: string; color: string; bg: string }) {
  return (
    <div className={`p-5 rounded-2xl ${bg}`}>
      <div className={`w-12 h-12 mx-auto rounded-xl bg-white text-white flex items-center justify-center shadow mb-3 ${color}`}>
        {icon}
      </div>
      <h4 className="font-bold text-ink-900 mb-1">{title}</h4>
      <p className="text-xs text-ink-500">{desc}</p>
    </div>
  );
}
