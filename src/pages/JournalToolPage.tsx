import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardEdit,
  CheckCircle2,
  Target,
  HelpCircle,
  Flame,
  ChevronLeft,
  CalendarDays,
  Send,
  FileText,
  Award,
  Sparkles,
  Home,
  Wrench,
  ChevronRight as ChevronRightIcon,
  BrainCircuit,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const moods = [
  { key: 'great', emoji: '😆', label: '超棒', color: 'from-teal-400 to-emerald-400', bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700' },
  { key: 'good', emoji: '😊', label: '不错', color: 'from-sky-400 to-blue-400', bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700' },
  { key: 'normal', emoji: '😐', label: '一般', color: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  { key: 'bad', emoji: '😫', label: '糟糕', color: 'from-rose-400 to-pink-400', bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700' },
];

const historyLogs = [
  { id: 1, date: '06-11', mood: 'great', weekday: '周三', done: '完成了购物车页面的重构，性能提升30%', plan: '对接订单接口', problem: '移动端适配问题需解决' },
  { id: 2, date: '06-10', mood: 'good', weekday: '周二', done: '参加了前端技术分享会，学习了微前端架构', plan: '开始购物车模块重构', problem: '新框架学习曲线较陡' },
  { id: 3, date: '06-09', mood: 'good', weekday: '周一', done: '完成商品详情页12个UI组件开发', plan: '学习qiankun微前端框架', problem: '组件状态管理复杂' },
  { id: 4, date: '06-08', mood: 'normal', weekday: '周六', done: '加班完成紧急bug修复2个', plan: '下周组件开发', problem: '文档不清晰，沟通成本高' },
  { id: 5, date: '06-07', mood: 'great', weekday: '周五', done: '周五review通过代码，mentor表扬', plan: '周末复盘本周内容', problem: '无' },
  { id: 6, date: '06-06', mood: 'good', weekday: '周四', done: '独立完成筛选组件，覆盖3种场景', plan: '商品详情页组件开发', problem: '无' },
  { id: 7, date: '06-05', mood: 'normal', weekday: '周三', done: '熟悉项目代码结构，跑通开发环境', plan: '筛选组件开发', problem: '项目大，理解慢' },
  { id: 8, date: '06-04', mood: 'great', weekday: '周二', done: '入职第一天，团队氛围超棒！', plan: '熟悉技术栈', problem: '无' },
];

export default function JournalToolPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 5, 1));
  const [selectedDate] = useState(new Date(2025, 5, 12));
  const [mood, setMood] = useState('great');

  const [doneText, setDoneText] = useState('1. 完成商品管理模块的分页与搜索功能开发，联调通过已提测\n2. 修复了2个线上P2级bug，均为边界条件遗漏问题\n3. 参与需求评审会议，输出2条有价值的技术建议');
  const [planText, setPlanText] = useState('1. 对接订单中心的消息推送服务，完成实时通知功能\n2. 优化用户中心首屏加载性能，目标FCP<1.5s\n3. 整理本周技术文档，同步团队wiki');
  const [problemText, setProblemText] = useState('WebSocket在移动端弱网下重连策略需要优化，目前偶发消息丢失。正在调研心跳包与断线重连的最佳实践方案。');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const markedDays = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  const today = 12;

  const monthName = `${year}年${month + 1}月`;

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="min-h-screen bg-cream-50 py-6">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <nav className="flex items-center gap-2 text-sm text-ink-500 animate-fade-in-up">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 hover:text-brand-600 transition-colors"
          >
            <Home size={14} />
            首页
          </button>
          <ChevronRightIcon size={14} className="text-ink-300" />
          <button
            onClick={() => navigate('/tools')}
            className="flex items-center gap-1 hover:text-brand-600 transition-colors"
          >
            <Wrench size={14} />
            工具箱
          </button>
          <ChevronRightIcon size={14} className="text-ink-300" />
          <span className="text-ink-700 font-medium">实习日志</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => navigate('/tools')}
          >
            <ChevronRightIcon size={14} className="rotate-180" />
            返回工具箱
          </Button>
        </nav>

        <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-400 text-white flex items-center justify-center shadow-[0_8px_24px_-10px_rgba(46,196,182,0.5)]">
              <ClipboardEdit size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">实习日志打卡</h1>
              <p className="text-sm text-ink-500">记录每日成长，坚持就是胜利 ✨</p>
            </div>
          </div>

          <div className="relative inline-flex items-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 via-brand-400 to-amber-500 blur opacity-50" />
            <div className="relative px-6 py-3 rounded-2xl bg-white border-2 border-transparent bg-clip-padding flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-brand-500 to-amber-400 text-white flex items-center justify-center shadow-lg">
                <Flame size={24} className="drop-shadow" />
              </div>
              <div>
                <p className="text-[11px] text-ink-500 font-medium">连续打卡</p>
                <p className="text-3xl font-extrabold font-num text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-brand-500 to-amber-500 leading-none">
                  42<span className="text-sm text-ink-500 ml-0.5">天</span>
                </p>
              </div>
              <div className="pl-3 border-l border-ink-100">
                <Badge variant="warn" size="sm">🏆 全勤第2名</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base">
                  <CalendarDays className="text-teal-500" size={20} />
                  {monthName}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                    className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-ink-500 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                    className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-ink-500 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map((w, i) => (
                  <div
                    key={w}
                    className={`text-center text-xs font-medium py-1.5 ${
                      i === 0 || i === 6 ? 'text-rose-400' : 'text-ink-400'
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const isToday = day === today;
                  const isMarked = markedDays.includes(day);
                  const isWeekend = (firstDay + idx) % 7 === 0 || (firstDay + idx) % 7 === 6;

                  return (
                    <div
                      key={day}
                      className={`relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium cursor-pointer transition-all group ${
                        isToday
                          ? 'bg-brand-gradient text-white shadow-float scale-105'
                          : isMarked
                          ? 'bg-gradient-to-br from-amber-50 to-brand-50 text-brand-700 border border-brand-200/50 hover:border-brand-400'
                          : isWeekend
                          ? 'text-rose-300 hover:bg-rose-50'
                          : 'text-ink-600 hover:bg-cream-100'
                      }`}
                    >
                      {day}
                      {isMarked && !isToday && (
                        <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-amber-500 shadow" />
                      )}
                      {isToday && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold border-2 border-white shadow">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-ink-100 flex flex-wrap gap-4 text-xs text-ink-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-brand-gradient" />
                  已打卡
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-lg bg-brand-gradient shadow" />
                  今日
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-ink-100" />
                  未打卡
                </div>
                <div className="ml-auto font-semibold text-brand-600">
                  本月打卡率 <span className="font-num">88%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-brand-500" size={20} />
                今日打卡 · {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
              </CardTitle>
              <p className="text-sm text-ink-500">认真记录每一天，实习结束时你会感谢现在的自己 💪</p>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <JournalTextarea
                icon={<CheckCircle2 size={16} className="text-teal-500" />}
                label="今日完成事项"
                badge={<Badge variant="verified" size="xs">重要</Badge>}
                value={doneText}
                onChange={setDoneText}
                placeholder="今天做了哪些具体的事情？越详细越好~"
                rows={4}
              />
              <JournalTextarea
                icon={<Target size={16} className="text-brand-500" />}
                label="明日计划"
                value={planText}
                onChange={setPlanText}
                placeholder="明天准备完成哪些任务？"
                rows={3}
              />
              <JournalTextarea
                icon={<HelpCircle size={16} className="text-amber-500" />}
                label="问题与反思"
                value={problemText}
                onChange={setProblemText}
                placeholder="遇到了什么问题？有什么可以改进的？"
                rows={2}
              />

              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 ml-0.5 block flex items-center gap-1.5">
                  <span>今日心情</span>
                  <span className="text-xs text-ink-400 font-normal">（选一个最符合的~）</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {moods.map((m) => {
                    const isActive = mood === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setMood(m.key)}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          isActive
                            ? `${m.border} ${m.bg} scale-105 shadow-card`
                            : 'border-ink-100 bg-white hover:border-ink-200 hover:bg-cream-50'
                        }`}
                      >
                        <div className="text-4xl mb-2 transition-transform group-hover:scale-110">{m.emoji}</div>
                        <p className={`text-sm font-semibold ${isActive ? m.text : 'text-ink-600'}`}>{m.label}</p>
                        {isActive && (
                          <span className={`absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow`}>
                            <CheckCircle2 size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                <p className="text-xs text-ink-400 flex items-center gap-1">
                  <Award size={13} className="text-amber-500" />
                  连续打卡42天，再坚持8天获得「月度坚持」勋章！
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="md">
                    <FileText size={15} />
                    生成本周周报
                  </Button>
                  <Button variant="primary" size="md">
                    <Send size={15} />
                    提交打卡
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="text-sky-500" size={22} />
                历史日志
              </span>
              <Button variant="ghost" size="sm">
                查看全部 <ChevronRight size={14} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {historyLogs.map((log, idx) => {
                const moodInfo = moods.find((m) => m.key === log.mood) || moods[0];
                return (
                  <Card
                    key={log.id}
                    hoverable
                    className="animate-fade-in-up cursor-pointer overflow-hidden group"
                    style={{ animationDelay: `${0.22 + idx * 0.05}s` }}
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${moodInfo.color}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs text-ink-400">{log.weekday}</p>
                          <p className="font-bold text-ink-900 font-num">{log.date}</p>
                        </div>
                        <div className="text-2xl">{moodInfo.emoji}</div>
                      </div>
                      <p className="text-xs text-ink-600 line-clamp-3 leading-relaxed mb-2">
                        <b className="text-ink-800">✓</b> {log.done}
                      </p>
                      <p className="text-[11px] text-ink-400 truncate">
                        📌 {log.plan}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-5 pt-5 border-t border-ink-100">
              <h4 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                更多工具推荐
              </h4>
              <div className="space-y-3">
                <Card
                  hoverable
                  className="cursor-pointer overflow-hidden group"
                  onClick={() => navigate('/tools/resume')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-amber-400 text-white flex items-center justify-center shadow shrink-0 group-hover:scale-105 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-ink-900">AI简历优化</h5>
                      <p className="text-xs text-ink-500">智能匹配JD关键词，提升通过率</p>
                    </div>
                    <ChevronRightIcon size={18} className="text-ink-300 group-hover:text-brand-500 shrink-0" />
                  </CardContent>
                </Card>

                <Card
                  hoverable
                  className="cursor-pointer overflow-hidden group"
                  onClick={() => navigate('/tools/assessment')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-400 text-white flex items-center justify-center shadow shrink-0 group-hover:scale-105 transition-transform">
                      <BrainCircuit size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-ink-900">职业测评</h5>
                      <p className="text-xs text-ink-500">MBTI+霍兰德，精准定位职业方向</p>
                    </div>
                    <ChevronRightIcon size={18} className="text-ink-300 group-hover:text-brand-500 shrink-0" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function JournalTextarea({
  icon, label, value, onChange, placeholder, rows, badge,
}: {
  icon: any; label: string; value: string; onChange: (v: string) => void;
  placeholder: string; rows: number; badge?: any;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700 mb-1.5 ml-0.5 flex items-center gap-2">
        {icon}
        {label}
        {badge}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full p-3.5 rounded-xl2 bg-cream-50/70 border border-ink-200 text-sm text-ink-800 placeholder:text-ink-300 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 focus:bg-white transition-all resize-none leading-relaxed"
      />
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
