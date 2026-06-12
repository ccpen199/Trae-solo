import {
  Sparkles,
  ClipboardEdit,
  BrainCircuit,
  Camera,
  Library,
  CircleDollarSign,
  FileSignature,
  ArrowLeftRight,
  GraduationCap,
  History,
  ArrowRight,
  TrendingUp,
  Calendar,
  Award,
  FileCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const bigTools = [
  {
    key: 'resume',
    title: 'AI简历优化',
    desc: '基于目标岗位JD，智能提炼亮点、重构语言、匹配关键词',
    icon: Sparkles,
    gradient: 'from-brand-400 via-brand-500 to-amber-400',
    stats: [
      { label: '已优化', value: '17份', sub: '本月' },
      { label: '满意度', value: '96%', sub: '平均' },
    ],
    cta: '立即优化',
    color: 'text-brand-600',
    bg: 'bg-brand-50',
  },
  {
    key: 'journal',
    title: '实习日志打卡',
    desc: '每日三问记录成长，自动生成周报月报，导师一键批阅',
    icon: ClipboardEdit,
    gradient: 'from-teal-400 via-teal-500 to-sky-400',
    stats: [
      { label: '连续打卡', value: '42天', sub: '🔥坚持' },
      { label: '日志数', value: '126篇', sub: '累计' },
    ],
    cta: '今日打卡',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    key: 'assessment',
    title: '职业性格测评',
    desc: 'MBTI+霍兰德科学结合，匹配最适合你的岗位方向',
    icon: BrainCircuit,
    gradient: 'from-sky-400 via-indigo-400 to-violet-400',
    stats: [
      { label: '已完成', value: '3次', sub: '测评' },
      { label: '匹配岗位', value: '28个', sub: '推荐' },
    ],
    cta: '查看报告',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
];

const smallTools = [
  { key: 'id-photo', icon: Camera, name: '证件照生成', desc: '一键抠图换底色', color: 'from-rose-400 to-pink-400', used: 5 },
  { key: 'interview', icon: Library, name: '面试题库', desc: '大厂真题+解析', color: 'from-amber-400 to-orange-400', used: 32 },
  { key: 'salary', icon: CircleDollarSign, name: '薪资查询', desc: '真实薪资数据', color: 'from-emerald-400 to-teal-400', used: 18 },
  { key: 'contract', icon: FileSignature, name: '协议模板', desc: '实习/三方协议', color: 'from-violet-400 to-purple-400', used: 3 },
  { key: 'offer', icon: ArrowLeftRight, name: 'Offer对比', desc: '多维度评分分析', color: 'from-sky-400 to-blue-400', used: 7 },
  { key: 'learn', icon: GraduationCap, name: '学习资源', desc: '精选课程资料', color: 'from-fuchsia-400 to-pink-400', used: 15 },
];

const historyRecords = [
  { id: 1, tool: 'AI简历优化', target: '字节跳动-前端开发', time: '今天 14:32', icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-50', result: '优化完成，匹配度提升至92%' },
  { id: 2, tool: '实习日志打卡', target: '第42天打卡', time: '今天 09:15', icon: ClipboardEdit, color: 'text-teal-500', bg: 'bg-teal-50', result: '心情：愉快，完成3项任务' },
  { id: 3, tool: '面试题库', target: 'React高频20题', time: '昨天 21:08', icon: Library, color: 'text-amber-500', bg: 'bg-amber-50', result: '正确率：17/20' },
  { id: 4, tool: 'Offer对比', target: '阿里 vs 腾讯', time: '06-09 16:40', icon: ArrowLeftRight, color: 'text-sky-500', bg: 'bg-sky-50', result: '综合评分：阿里8.7 > 腾讯8.2' },
  { id: 5, tool: '职业性格测评', target: '完整版报告', time: '06-05 19:22', icon: BrainCircuit, color: 'text-violet-500', bg: 'bg-violet-50', result: 'ENFJ-A · 社会型企业型' },
];

export default function ToolsHomePage() {
  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-warm-gradient flex items-center justify-center text-white shadow-float">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">求职工具箱</h1>
              <p className="text-sm text-ink-500">让实习求职高效少走弯路</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {bigTools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.key}
                hoverable
                className="animate-fade-in-up overflow-hidden relative group"
                style={{ animationDelay: `${0.08 + idx * 0.08}s` }}
              >
                <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${tool.gradient}`} />
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon size={28} />
                    </div>
                    <Badge variant="brand" size="xs">
                      <TrendingUp size={10} />
                      热门
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-ink-900 mb-1.5">{tool.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed mb-4 h-10">{tool.desc}</p>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {tool.stats.map((s, i) => (
                      <div key={i} className={`${tool.bg} rounded-xl p-3`}>
                        <p className={`text-2xl font-bold font-num ${tool.color}`}>{s.value}</p>
                        <p className="text-[11px] text-ink-500 mt-0.5">
                          {s.label} <span className="opacity-70">· {s.sub}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  <Button variant="primary" size="md" className="w-full">
                    {tool.cta}
                    <ArrowRight size={15} />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-brand-gradient rounded-full" />
            更多小工具
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {smallTools.map((t, idx) => {
              const Icon = t.icon;
              return (
                <Card
                  key={t.key}
                  hoverable
                  className="animate-fade-in-up cursor-pointer"
                  style={{ animationDelay: `${0.32 + idx * 0.04}s` }}
                >
                  <CardContent className="flex flex-col items-center text-center p-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-3 shadow`}>
                      <Icon size={22} />
                    </div>
                    <h4 className="font-semibold text-ink-800 text-sm mb-0.5">{t.name}</h4>
                    <p className="text-[11px] text-ink-500 mb-2">{t.desc}</p>
                    <span className="text-[10px] text-ink-400 flex items-center gap-0.5">
                      <History size={10} />
                      使用 {t.used} 次
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="text-brand-500" size={22} />
              我的使用记录
            </CardTitle>
            <p className="text-sm text-ink-500">最近使用工具的历史报告，随时继续</p>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-brand-200 via-teal-200 to-sky-200" />
              <div className="space-y-1">
                {historyRecords.map((rec, idx) => {
                  const Icon = rec.icon;
                  return (
                    <div
                      key={rec.id}
                      className="relative flex items-start gap-4 p-3 -mx-3 rounded-xl hover:bg-cream-50 transition-colors animate-fade-in-up cursor-pointer"
                      style={{ animationDelay: `${0.62 + idx * 0.05}s` }}
                    >
                      <div className={`relative z-10 w-11 h-11 rounded-full ${rec.bg} ${rec.color} flex items-center justify-center border-4 border-white shadow-soft shrink-0`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between gap-3 mb-0.5">
                          <h4 className="font-semibold text-ink-800 text-sm flex items-center gap-2">
                            {rec.tool}
                            <span className="text-ink-400">·</span>
                            <span className="text-ink-600 font-normal">{rec.target}</span>
                          </h4>
                          <span className="text-xs text-ink-400 shrink-0 flex items-center gap-1">
                            <Calendar size={12} />
                            {rec.time}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500 flex items-center gap-1.5">
                          <FileCheck size={12} className="text-teal-500" />
                          {rec.result}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-ink-300 shrink-0 mt-2.5 group-hover:text-brand-500 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-ink-100 text-center">
              <Button variant="ghost" size="sm">
                查看全部记录
                <ArrowRight size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up overflow-hidden bg-gradient-to-br from-brand-500 via-brand-400 to-teal-400 border-0" style={{ animationDelay: '0.9s' }}>
          <CardContent className="text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} />
                  <span className="text-sm font-medium opacity-90">高级会员专属</span>
                </div>
                <h3 className="text-xl font-bold mb-1">无限次AI优化 + 1v1导师咨询</h3>
                <p className="text-sm opacity-90">已有 12,847 位同学通过VIP成功拿到心仪Offer</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs opacity-80 line-through">¥199/月</p>
                  <p className="text-3xl font-bold font-num">¥29<span className="text-base font-normal">/月</span></p>
                </div>
                <Button variant="secondary" size="lg" className="bg-white text-brand-600 hover:bg-cream-50 shadow-lg">
                  立即升级
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
