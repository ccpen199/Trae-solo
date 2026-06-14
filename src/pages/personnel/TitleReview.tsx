import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, BookOpen, ClipboardList, Search, Plus, Minus,
  GraduationCap, Briefcase, Award, FileText, Upload, Clock, Calendar,
  CheckCircle2, AlertCircle, User, Trophy, X, ArrowRight,
  Loader2, Circle, StepForward, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FormLabel = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-medium text-gray-700 mb-2">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const el = document.createElement('div');
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-gov-500' };
  el.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-lg shadow-gov-lg font-medium animate-fade-in-up`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
};

const tabs = [
  { k: 'notice', label: '评审通知', icon: BookOpen, desc: '官方发布的评审政策和通知公告' },
  { k: 'apply', label: '在线申报', icon: ClipboardList, desc: '职称申报材料结构化填写' },
  { k: 'progress', label: '进度查询', icon: Search, desc: '申报进度跟踪与结果公示' },
];

const titleLevels = [
  { k: 'junior', label: '初级职称', color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700', badgeBd: 'border-emerald-200' },
  { k: 'mid', label: '中级职称', color: 'from-gov-500 to-blue-600', badge: 'bg-gov-100 text-gov-700', badgeBd: 'border-gov-200' },
  { k: 'senior', label: '高级职称', color: 'from-gold-500 to-amber-600', badge: 'bg-gold-100 text-gold-700', badgeBd: 'border-gold-200' },
];

const titleSeries = [
  { k: 'engineer', label: '工程系列', subs: ['工程师', '高级工程师', '教授级高工'] },
  { k: 'teacher', label: '教育系列', subs: ['讲师', '副教授', '教授'] },
  { k: 'medical', label: '卫生系列', subs: ['主治医师', '副主任医师', '主任医师'] },
  { k: 'economic', label: '经济系列', subs: ['经济师', '高级经济师'] },
  { k: 'accounting', label: '会计系列', subs: ['会计师', '高级会计师'] },
  { k: 'arts', label: '艺术系列', subs: ['馆员', '副研究馆员', '研究馆员'] },
];

const notices = [
  { id: 1, title: '关于开展2026年度全省高级工程师职称评审工作的通知', date: '2026-06-15', deadline: '2026-08-31', level: '高级', tag: '工程系列', hot: true },
  { id: 2, title: '2026年度中小学教师中级职称评审申报指南', date: '2026-06-10', deadline: '2026-08-15', level: '中级', tag: '教育系列', hot: false },
  { id: 3, title: '关于卫生系列副主任医师评审补充材料通知', date: '2026-06-05', deadline: '2026-07-20', level: '高级', tag: '卫生系列', hot: true },
  { id: 4, title: '2026年度经济师职称评价标准修订说明', date: '2026-05-28', deadline: '2026-09-30', level: '中级', tag: '经济系列', hot: false },
  { id: 5, title: '会计系列高级职称评审工作安排', date: '2026-05-20', deadline: '2026-08-10', level: '高级', tag: '会计系列', hot: false },
];

const progressSteps = [
  { k: 'submitted', label: '已提交', icon: FileText, color: 'bg-gov-500', desc: '申报材料已提交' },
  { k: 'first', label: '初审', icon: ClipboardList, color: 'bg-blue-500', desc: '单位/主管部门初审' },
  { k: 'second', label: '复审', icon: Search, color: 'bg-purple-500', desc: '评审委员会复审' },
  { k: 'review', label: '专家评审', icon: Award, color: 'bg-gold-500', desc: '评审专家评审评议' },
  { k: 'public', label: '结果公示', icon: BookOpen, color: 'bg-emerald-500', desc: '评审结果公示期' },
  { k: 'issued', label: '证书发放', icon: Trophy, color: 'bg-teal-600', desc: '职称证书已发放' },
];

interface Notice { id: number; title: string; date: string; deadline: string; level: string; tag: string; hot: boolean; }
interface Achievement { id: number; title: string; date: string; desc: string; }
interface Paper { id: number; title: string; journal: string; date: string; }

export default function TitleReviewPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notice');
  const [detailNotice, setDetailNotice] = useState<Notice | null>(null);
  const [selectedSeries, setSelectedSeries] = useState('engineer');
  const [selectedLevel, setSelectedLevel] = useState('mid');
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([{ id: 1, title: '', date: '', desc: '' }]);
  const [papers, setPapers] = useState<Paper[]>([{ id: 1, title: '', journal: '', date: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '张晓明', idCard: '110101199001011234', phone: '138****1234',
    education: '硕士研究生', major: '计算机科学与技术',
    eduSchool: 'XX大学', eduDate: '2015-06',
    workCompany: 'XX科技有限公司', workYears: 10, workPosition: '技术总监',
  });

  const addAchievement = () => setAchievements((p) => [...p, { id: Date.now(), title: '', date: '', desc: '' }]);
  const removeAchievement = (id: number) => setAchievements((p) => p.length > 1 ? p.filter((x) => x.id !== id) : p);
  const addPaper = () => setPapers((p) => [...p, { id: Date.now(), title: '', journal: '', date: '' }]);
  const removePaper = (id: number) => setPapers((p) => p.length > 1 ? p.filter((x) => x.id !== id) : p);
  const updateAchievement = (id: number, field: keyof Achievement, v: string) =>
    setAchievements((p) => p.map((x) => x.id === id ? { ...x, [field]: v } : x));
  const updatePaper = (id: number, field: keyof Paper, v: string) =>
    setPapers((p) => p.map((x) => x.id === id ? { ...x, [field]: v } : x));

  const submitApply = () => {
    if (!form.name || !form.idCard) { toast('请填写完整基本信息', 'error'); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast('职称申报材料已提交，等待初审', 'success');
      setActiveTab('progress');
    }, 1500);
  };

  const levelCfg = titleLevels.find((l) => l.k === selectedLevel)!;
  const seriesCfg = titleSeries.find((s) => s.k === selectedSeries)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/personnel/title-review')}>人事人才</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">职称评审</span>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="flex items-start gap-3 px-6 md:px-8 pt-6 pb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center shrink-0 shadow-gov">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gov-700 font-serif">职称评审服务</h1>
            <p className="text-sm text-gray-500 mt-0.5">全流程在线申报 · 材料结构化填报 · 进度透明可追踪</p>
          </div>
        </div>

        <div className="border-b border-gray-100 px-4 md:px-8">
          <div className="flex gap-1 md:gap-4 overflow-x-auto -mb-px">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setActiveTab(t.k)}
                  className={cn(
                    'px-4 md:px-6 py-4 transition-all relative whitespace-nowrap border-b-2 inline-flex items-center gap-2 font-medium text-sm',
                    active ? 'text-gov-600 border-gov-500 bg-gov-50/50' : 'text-gray-500 border-transparent hover:text-gray-700'
                  )}
                >
                  <Icon className={cn('w-4 h-4', active && 'text-gov-600')} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-6 md:px-8 py-3 bg-gradient-to-r from-gov-50/60 via-blue-50/30 to-gold-50/30 border-b border-gray-100">
          <p className="text-xs text-gov-600 font-medium">{tabs.find((t) => t.k === activeTab)?.desc}</p>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'notice' && (
            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setDetailNotice(n)}
                  className="group p-5 rounded-xl border border-gray-100 hover:border-gov-200 hover:bg-gov-50/30 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform',
                      n.level === '高级' ? 'bg-gradient-to-br from-gold-50 to-amber-50 border border-gold-100' :
                      n.level === '中级' ? 'bg-gradient-to-br from-gov-50 to-blue-50 border border-gov-100' :
                      'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100'
                    )}>
                      <BookOpen className={cn(
                        'w-6 h-6',
                        n.level === '高级' ? 'text-gold-600' : n.level === '中级' ? 'text-gov-600' : 'text-emerald-600'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-gray-800 group-hover:text-gov-700 transition-colors line-clamp-1">{n.title}</h3>
                        {n.hot && <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 animate-pulse">HOT</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        <span className={cn(
                          'px-2 py-0.5 rounded-md font-medium border',
                          n.level === '高级' ? 'bg-gold-50 text-gold-700 border-gold-200' :
                          n.level === '中级' ? 'bg-gov-50 text-gov-700 border-gov-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        )}>{n.level}</span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">{n.tag}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-400 inline-flex items-center gap-1"><Calendar className="w-3 h-3" />发布日期：{n.date}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-red-500 font-medium inline-flex items-center gap-1"><Clock className="w-3 h-3" />申报截止：{n.deadline}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gov-500 group-hover:translate-x-1 shrink-0 mt-2 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'apply' && (
            <div className="space-y-7">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-gold-500" />职称系列与级别</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {titleLevels.map((l) => {
                    const Icon = l.k === selectedLevel ? CheckCircle2 : Circle;
                    const active = l.k === selectedLevel;
                    return (
                      <button
                        key={l.k}
                        type="button"
                        onClick={() => setSelectedLevel(l.k)}
                        className={cn(
                          'p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden',
                          active ? [l.badgeBd, 'bg-gradient-to-br from-white to-gray-50/80 shadow-gov/40'] : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50'
                        )}
                      >
                        {active && (
                          <div className={cn('absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center', l.color)}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform', l.color)}>
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <h4 className={cn('font-bold text-lg mb-1', active ? 'text-gray-800' : 'text-gray-600')}>{l.label}</h4>
                        <p className="text-xs text-gray-400">助理/中级/高级对应级别申报</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {titleSeries.map((s) => {
                      const active = selectedSeries === s.k;
                      const exp = expandedSeries === s.k;
                      return (
                        <div key={s.k}>
                          <button
                            type="button"
                            onClick={() => { setSelectedSeries(s.k); setExpandedSeries(exp ? null : s.k); }}
                            className={cn(
                              'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group',
                              active ? 'border-gov-300 bg-gov-50 text-gov-700' : 'border-gray-100 hover:border-gray-200 bg-white'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <GraduationCap className={cn('w-4 h-4', active ? 'text-gov-600' : 'text-gray-400')} />
                              <span className="font-medium text-sm">{s.label}</span>
                            </div>
                            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', exp && 'rotate-180')} />
                          </button>
                          {exp && (
                            <div className="mt-2 ml-2 space-y-1 pl-3 border-l-2 border-gov-100">
                              {s.subs.map((sub, idx) => (
                                <button key={idx} className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gov-50 hover:text-gov-700 rounded-lg transition-colors">{sub}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><User className="w-5 h-5 text-gov-500" />基本信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><FormLabel required>真实姓名</FormLabel><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="gov-input" /></div>
                  <div><FormLabel required>身份证号</FormLabel><input value={form.idCard} onChange={(e) => setForm({ ...form, idCard: e.target.value })} className="gov-input font-mono" /></div>
                  <div><FormLabel required>手机号码</FormLabel><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="gov-input" /></div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><GraduationCap className="w-5 h-5 text-emerald-500" />学历信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <FormLabel required>最高学历</FormLabel>
                    <select value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className="gov-input">
                      <option>博士研究生</option>
                      <option>硕士研究生</option>
                      <option>大学本科</option>
                      <option>大学专科</option>
                    </select>
                  </div>
                  <div><FormLabel required>所学专业</FormLabel><input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className="gov-input" /></div>
                  <div><FormLabel required>毕业院校</FormLabel><input value={form.eduSchool} onChange={(e) => setForm({ ...form, eduSchool: e.target.value })} className="gov-input" /></div>
                  <div>
                    <FormLabel required>毕业时间</FormLabel>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="month" value={form.eduDate} onChange={(e) => setForm({ ...form, eduDate: e.target.value })} className="gov-input pl-10" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Briefcase className="w-5 h-5 text-blue-500" />工作经历</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><FormLabel required>现工作单位</FormLabel><input value={form.workCompany} onChange={(e) => setForm({ ...form, workCompany: e.target.value })} className="gov-input" /></div>
                  <div>
                    <FormLabel required>累计工作年限</FormLabel>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="number" value={form.workYears} onChange={(e) => setForm({ ...form, workYears: Number(e.target.value) })} className="gov-input pl-10" />
                    </div>
                  </div>
                  <div><FormLabel required>现任职务</FormLabel><input value={form.workPosition} onChange={(e) => setForm({ ...form, workPosition: e.target.value })} className="gov-input" /></div>
                  <div><FormLabel>从事专业</FormLabel><input defaultValue="软件工程" className="gov-input" /></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Trophy className="w-5 h-5 text-gold-500" />业绩成果</h3>
                  <button type="button" onClick={addAchievement} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gov-600 bg-gov-50 hover:bg-gov-100 transition-colors inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />添加成果
                  </button>
                </div>
                <div className="space-y-3">
                  {achievements.map((a, idx) => (
                    <div key={a.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gov-600 flex items-center gap-1.5 bg-gov-100 px-2.5 py-1 rounded-md">
                          <Trophy className="w-3 h-3" />成果 {idx + 1}
                        </span>
                        {achievements.length > 1 && (
                          <button type="button" onClick={() => removeAchievement(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <FormLabel>成果名称</FormLabel>
                          <input value={a.title} onChange={(e) => updateAchievement(a.id, 'title', e.target.value)} placeholder="例如：参与XX重点项目研发" className="gov-input !py-2" />
                        </div>
                        <div>
                          <FormLabel>取得时间</FormLabel>
                          <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="month" value={a.date} onChange={(e) => updateAchievement(a.id, 'date', e.target.value)} className="gov-input pl-10 !py-2" />
                          </div>
                        </div>
                        <div className="md:col-span-3">
                          <FormLabel>成果描述</FormLabel>
                          <textarea value={a.desc} onChange={(e) => updateAchievement(a.id, 'desc', e.target.value)} rows={2} placeholder="简要描述成果内容、个人贡献等" className="gov-input !py-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-500" />论文著作</h3>
                  <button type="button" onClick={addPaper} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gov-600 bg-gov-50 hover:bg-gov-100 transition-colors inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />添加论文
                  </button>
                </div>
                <div className="space-y-3">
                  {papers.map((p, idx) => (
                    <div key={p.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-purple-600 flex items-center gap-1.5 bg-purple-100 px-2.5 py-1 rounded-md">
                          <BookOpen className="w-3 h-3" />论文 {idx + 1}
                        </span>
                        {papers.length > 1 && (
                          <button type="button" onClick={() => removePaper(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <FormLabel>论文题目</FormLabel>
                          <input value={p.title} onChange={(e) => updatePaper(p.id, 'title', e.target.value)} placeholder="例如：基于深度学习在XX领域的应用研究" className="gov-input !py-2" />
                        </div>
                        <div>
                          <FormLabel>发表时间</FormLabel>
                          <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="month" value={p.date} onChange={(e) => updatePaper(p.id, 'date', e.target.value)} className="gov-input pl-10 !py-2" />
                          </div>
                        </div>
                        <div className="md:col-span-3">
                          <FormLabel>发表刊物</FormLabel>
                          <input value={p.journal} onChange={(e) => updatePaper(p.id, 'journal', e.target.value)} placeholder="期刊/会议名称，如：计算机学报" className="gov-input !py-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Upload className="w-5 h-5 text-teal-500" />附件材料</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { t: '学历证书', i: GraduationCap, c: 'text-emerald-600', b: 'bg-emerald-50' },
                    { t: '学位证书', i: Award, c: 'text-gov-600', b: 'bg-gov-50' },
                    { t: '工作证明', i: Briefcase, c: 'text-gold-600', b: 'bg-gold-50' },
                    { t: '业绩证明', i: Trophy, c: 'text-purple-600', b: 'bg-purple-50' },
                    { t: '论文原文', i: BookOpen, c: 'text-blue-600', b: 'bg-blue-50' },
                    { t: '专利证书', i: FileText, c: 'text-red-600', b: 'bg-red-50' },
                    { t: '获奖证书', i: Trophy, c: 'text-amber-600', b: 'bg-amber-50' },
                    { t: '其他材料', i: Upload, c: 'text-gray-600', b: 'bg-gray-50' },
                  ].map((f, i) => {
                    const Ic = f.i;
                    return (
                      <button key={i} type="button" onClick={() => toast(`请上传${f.t}（模拟）`, 'info')} className={cn(
                        'p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-gov-300 bg-white hover:bg-gov-50/30 text-center transition-all group'
                      )}>
                        <div className={cn('w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center', f.b)}>
                          <Ic className={cn('w-5 h-5', f.c)} />
                        </div>
                        <p className="text-xs font-medium text-gray-600">{f.t}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">点击上传</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => toast('已保存为草稿', 'success')} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2">
                  保存草稿
                </button>
                <button type="button" onClick={submitApply} disabled={submitting} className="gov-btn sm:min-w-[180px] inline-flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <StepForward className="w-4 h-4" />}
                  {submitting ? '提交中...' : '提交申报'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gov-50 via-blue-50/60 to-gov-50/40 rounded-2xl p-6 border border-gov-100">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-gov-600 font-medium mb-1">申报编号</p>
                    <h3 className="text-xl font-serif font-bold text-gov-800">ZC2026{seriesCfg.label.replace('系列', '')}00128</h3>
                    <p className="text-sm text-gray-500 mt-1">{seriesCfg.label} · {levelCfg.label} · 2026年06月18日提交</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white border-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />专家评审中
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative pl-1 md:pl-4">
                <div className="relative">
                  <div className="absolute left-3 md:left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gov-200 via-gov-300 to-gray-100 rounded-full" />
                  {progressSteps.map((step, idx) => {
                    const done = idx <= 3;
                    const current = idx === 3;
                    const Icon = step.icon;
                    return (
                      <div key={step.k} className={cn('relative flex gap-4 md:gap-6 py-5', idx === progressSteps.length - 1 && 'pb-0')}>
                        <div className="relative z-10 shrink-0">
                          <div className={cn(
                            'w-7 h-7 md:w-14 md:h-14 rounded-full flex items-center justify-center border-[3px] shadow-sm',
                            done ? [step.color, 'border-white text-white'] : current ? 'bg-white border-gov-200 text-gov-400' : 'bg-gray-100 border-gray-200 text-gray-300'
                          )}>
                            <Icon className={cn('w-3.5 h-3.5 md:w-6 md:h-6')} />
                          </div>
                        </div>
                        <div className={cn('flex-1 pb-2', idx === progressSteps.length - 1 && 'pb-0')}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h4 className={cn('font-bold md:text-base', done || current ? 'text-gray-800' : 'text-gray-400')}>{step.label}</h4>
                              <p className={cn('text-xs md:text-sm mt-0.5', done || current ? 'text-gray-500' : 'text-gray-300')}>{step.desc}</p>
                            </div>
                            <div className="text-right shrink-0">
                              {done && (
                                <p className="text-xs md:text-sm text-emerald-600 font-medium inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />完成
                                </p>
                              )}
                              {current && (
                                <p className="text-xs md:text-sm text-gov-600 font-medium inline-flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />进行中
                                </p>
                              )}
                              {!done && !current && <p className="text-xs md:text-sm text-gray-300">待处理</p>}
                              <p className="text-[10px] md:text-xs text-gray-300 mt-0.5">
                                {idx === 0 && '2026-06-18 09:20'}
                                {idx === 1 && '2026-06-20 14:30'}
                                {idx === 2 && '2026-06-25 10:15'}
                                {idx === 3 && '预计 07-05'}
                                {idx === 4 && '预计 07-20'}
                                {idx === 5 && '预计 08-05'}
                              </p>
                            </div>
                          </div>
                          {(done || current) && (
                            <div className="mt-2 bg-white rounded-xl border border-gray-100 p-3 md:p-4 text-xs md:text-sm">
                              {idx === 0 && <p className="text-gray-600">申报材料已通过格式校验，材料完整度100% ✅</p>}
                              {idx === 1 && <p className="text-gray-600">单位审核意见：材料齐全，符合申报条件，同意推荐。审核人：李主任 · XX科技有限公司人事科</p>}
                              {idx === 2 && <p className="text-gray-600">主管部门复审通过，已提交评审委员会。材料补充：业绩成果突出，建议专家评审。</p>}
                              {idx === 3 && <p className="text-gov-600 font-medium">专家评审委员会正在进行，请耐心等待评审结果...</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up" onClick={() => setDetailNotice(null)}>
          <div className="bg-white rounded-2xl shadow-gov-lg max-w-3xl w-full max-h-[85vh] overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gov-50 via-blue-50/50 to-gov-50/30">
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className="w-5 h-5 text-gold-500 shrink-0" />
                <h3 className="font-bold text-gray-800 truncate">{detailNotice.title}</h3>
              </div>
              <button onClick={() => setDetailNotice(null)} className="p-2 rounded-lg hover:bg-white/80 transition-colors">
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="px-6 md:px-10 py-6 md:py-8 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
                <span className={cn('px-3 py-1 rounded-md font-medium border',
                  detailNotice.level === '高级' ? 'bg-gold-50 text-gold-700 border-gold-200' :
                  detailNotice.level === '中级' ? 'bg-gov-50 text-gov-700 border-gov-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}>{detailNotice.level} · {detailNotice.tag}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 inline-flex items-center gap-1"><Calendar className="w-3 h-3" />发布：{detailNotice.date}</span>
                <span className="text-gray-400">·</span>
                <span className="text-red-500 font-medium inline-flex items-center gap-1"><Clock className="w-3 h-3" />截止：{detailNotice.deadline}</span>
              </div>
              <div className="prose prose-sm text-gray-700 space-y-4 leading-relaxed max-w-none">
                <h4 className="font-bold text-gray-800 font-serif">一、申报范围</h4>
                <p>凡在我省各类企事业单位、社会组织、个体工商户等从事专业技术工作的在职专业技术人员，符合相应系列（专业）资格条件的，可按规定程序申报评审相应职称。</p>
                <h4 className="font-bold text-gray-800 font-serif">二、申报条件</h4>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>遵守宪法和法律，具有良好的职业道德和敬业精神；</li>
                  <li>符合相应系列职称评审条件中规定的学历、资历条件；</li>
                  <li>近三年年度考核均为合格及以上等次；</li>
                  <li>按规定完成继续教育学习任务；</li>
                  <li>身体健康，能全面履行岗位职责。</li>
                </ul>
                <h4 className="font-bold text-gray-800 font-serif">三、申报材料</h4>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>《专业技术资格评审表》一式三份；</li>
                  <li>身份证、学历学位证书复印件；</li>
                  <li>现任专业技术职务任职资格证书、聘书复印件；</li>
                  <li>业绩成果、论文著作等证明材料；</li>
                  <li>继续教育合格证明；</li>
                  <li>其他相关证明材料。</li>
                </ul>
                <h4 className="font-bold text-gray-800 font-serif">四、申报程序</h4>
                <p>个人申报 → 单位审核推荐 → 主管部门复审 → 评审委员会评审 → 结果公示 → 发文发证。</p>
                <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-gold-50 to-amber-50/60 border border-gold-100">
                  <p className="text-xs text-gold-800 font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />重要提醒
                  </p>
                  <p className="text-sm text-gold-700">
                    申报截止日期为 <span className="font-bold">{detailNotice.deadline}</span>，逾期系统将自动关闭申报通道，请合理安排时间。
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button onClick={() => setDetailNotice(null)} className="px-5 py-2.5 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 transition-colors">
                关闭
              </button>
              <button onClick={() => { setDetailNotice(null); setActiveTab('apply'); }} className="gov-btn !py-2.5 !px-6 inline-flex items-center justify-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4" />立即申报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
