import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, GraduationCap, FileUp, Award, Search, Download,
  QrCode, X, CheckCircle, AlertCircle, Calendar, Users, Clock, Star,
  FileCheck, MapPin, User, IdCard, Phone, Loader2, ZoomIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { httpPost, httpGet } from '@/api/client';
import { useAuthStore } from '@/store/auth';

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

interface ExamPlan {
  id: number;
  name: string;
  profession: string;
  level: string;
  deadline: string;
  examDate: string;
  total: number;
  remaining: number;
  location: string;
  fee: number;
}

const mockExams: ExamPlan[] = [
  { id: 1, name: '2026年第三季度职业技能等级认定', profession: '企业人力资源管理师', level: '中级（四级）', deadline: '2026-07-15', examDate: '2026-07-30', total: 200, remaining: 86, location: '市职业技能鉴定中心', fee: 380 },
  { id: 2, name: '2026年电子商务师统一考试', profession: '电子商务师', level: '高级（三级）', deadline: '2026-07-20', examDate: '2026-08-10', total: 150, remaining: 32, location: '市技师学院', fee: 480 },
  { id: 3, name: '电工职业技能等级专项考试', profession: '电工', level: '中级（四级）', deadline: '2026-07-10', examDate: '2026-07-25', total: 100, remaining: 12, location: '市电力培训中心', fee: 520 },
  { id: 4, name: '中式烹调师职业技能认定', profession: '中式烹调师', level: '初级（五级）', deadline: '2026-08-05', examDate: '2026-08-20', total: 80, remaining: 65, location: '市商业学校', fee: 320 },
  { id: 5, name: '2026年度计算机程序设计师考试', profession: '计算机程序设计员', level: '高级（三级）', deadline: '2026-08-15', examDate: '2026-09-05', total: 180, remaining: 108, location: '市软件工程学院', fee: 580 },
];

interface MyCert {
  id: string;
  certName: string;
  level: string;
  issueDate: string;
  certNo: string;
  holder: string;
  verifyCode: string;
  score?: number;
}

const mockMyCerts: MyCert[] = [
  { id: '1', certName: '企业人力资源管理师', level: '中级（四级）', issueDate: '2025-11-20', certNo: 'SK-20251120-A1B2C3', holder: '张晓明', verifyCode: 'SKA1B2C3D4', score: 82 },
  { id: '2', certName: '计算机程序设计员', level: '高级（三级）', issueDate: '2026-03-15', certNo: 'SK-20260315-X9Y8Z7', holder: '张晓明', verifyCode: 'SKX9Y8Z7W6', score: 88 },
  { id: '3', certName: '电工', level: '初级（五级）', issueDate: '2025-08-10', certNo: 'SK-20250810-M3N4P5', holder: '张晓明', verifyCode: 'SKM3N4P5Q6' },
];

export default function SkillCertificationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'apply' | 'score' | 'cert'>('apply');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamPlan | null>(null);
  const [zoomCert, setZoomCert] = useState<MyCert | null>(null);
  const [loadingApply, setLoadingApply] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>(null);

  const [applyForm, setApplyForm] = useState({ realName: '', idCard: '', phone: '', photoUploaded: false });
  const [scoreForm, setScoreForm] = useState({ ticketNo: '', name: '', captcha: '' });
  const [captchaCode, setCaptchaCode] = useState('');

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setCaptchaCode(code);
  };

  const openApply = (exam: ExamPlan) => {
    setSelectedExam(exam);
    setApplyForm({ realName: user?.name || '', idCard: '', phone: user?.phone?.replace(/\*/g, '') || '', photoUploaded: false });
    setShowApplyModal(true);
  };

  const handleApplySubmit = async () => {
    if (!applyForm.realName.trim() || !/^\d{17}[\dXx]$/.test(applyForm.idCard) || !/^1[3-9]\d{9}$/.test(applyForm.phone)) {
      toast('请完善所有必填信息', 'error'); return;
    }
    if (!applyForm.photoUploaded) { toast('请上传一寸免冠照片', 'error'); return; }
    setLoadingApply(true);
    try {
      const resp = await httpPost('/employment/skill-certification', {
        userId: user?.id || 1,
        realName: applyForm.realName,
        idCard: applyForm.idCard,
        skillName: selectedExam?.profession,
        skillLevel: selectedExam?.level,
        examDate: selectedExam?.examDate,
        issuer: '省级职业技能鉴定中心',
      });
      if (resp.code === 0) {
        toast(`报名成功！报名号：${resp.data.applicationNo}`, 'success');
        setShowApplyModal(false);
      } else {
        toast(resp.message || '报名失败', 'error');
      }
    } catch (e: any) {
      toast(e?.response?.data?.message || '报名失败', 'error');
    } finally {
      setLoadingApply(false);
    }
  };

  const handleScoreQuery = async () => {
    if (!scoreForm.ticketNo.trim() || !scoreForm.name.trim() || !scoreForm.captcha.trim()) {
      toast('请填写完整查询条件', 'error'); return;
    }
    if (scoreForm.captcha.toUpperCase() !== captchaCode) {
      toast('验证码错误', 'error'); refreshCaptcha(); return;
    }
    setLoadingScore(true);
    try {
      const theory = 60 + Math.floor(Math.random() * 40);
      const practice = 60 + Math.floor(Math.random() * 40);
      const total = Math.floor(theory * 0.4 + practice * 0.6);
      const passed = total >= 60;
      setScoreResult({
        examName: '2026年第二季度职业技能等级认定',
        profession: '企业人力资源管理师',
        level: '中级（四级）',
        ticketNo: scoreForm.ticketNo,
        name: scoreForm.name,
        theory,
        practice,
        total,
        passed,
        certNo: passed ? 'SK-' + Date.now().toString().slice(-8) + '-001' : null,
      });
      toast('成绩查询成功', 'success');
    } catch {
      toast('查询失败', 'error');
    } finally {
      setLoadingScore(false);
    }
  };

  const tabClass = (tab: string) => cn(
    'px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap',
    activeTab === tab ? 'text-gov-600' : 'text-gray-500 hover:text-gray-700'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/employment/skill-certification')}>就业服务</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">职业技能等级认定</span>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="flex items-start gap-3 px-6 md:px-8 pt-6 pb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-gov">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gov-700 font-serif">职业技能等级认定</h1>
            <p className="text-sm text-gray-500 mt-1">在线报名 · 成绩核验 · 电子证书查询与下载</p>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6 md:px-8">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {[
              { k: 'apply', label: '我要报名', icon: FileUp },
              { k: 'score', label: '成绩核验', icon: Search },
              { k: 'cert', label: '我的证书', icon: Award },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.k}
                  onClick={() => setActiveTab(t.k as any)}
                  className={tabClass(t.k)}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" /> {t.label}
                  </span>
                  {activeTab === t.k && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-500 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'apply' && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div className="grid grid-cols-12 bg-gov-50 px-4 py-3 text-xs font-semibold text-gov-700">
                  <div className="col-span-3">考试名称/工种</div>
                  <div className="col-span-2 hidden sm:block">等级</div>
                  <div className="col-span-2 hidden sm:block">报名截止</div>
                  <div className="col-span-2 hidden sm:block">考试日期</div>
                  <div className="col-span-2 sm:col-span-1">名额</div>
                  <div className="col-span-3 sm:col-span-2">操作</div>
                </div>
                {mockExams.map((exam, i) => (
                  <div key={exam.id} className={cn('grid grid-cols-12 px-4 py-4 border-b border-gray-50 items-center hover:bg-gov-50/30 transition-colors', i === mockExams.length - 1 && 'border-b-0')}>
                    <div className="col-span-12 sm:col-span-3">
                      <div className="font-semibold text-gray-800 text-sm line-clamp-1">{exam.name}</div>
                      <div className="text-xs text-gov-600 mt-0.5"><Star className="w-3 h-3 inline" /> {exam.profession}</div>
                    </div>
                    <div className="col-span-4 sm:col-span-2 mt-2 sm:mt-0">
                      <span className="inline-block px-2 py-1 rounded bg-gold-50 text-gold-700 text-xs font-medium">{exam.level}</span>
                    </div>
                    <div className="hidden sm:block sm:col-span-2">
                      <div className="flex items-center gap-1 text-xs text-gray-600"><Calendar className="w-3 h-3" />{exam.deadline}</div>
                    </div>
                    <div className="hidden sm:block sm:col-span-2">
                      <div className="flex items-center gap-1 text-xs text-gray-600"><Clock className="w-3 h-3" />{exam.examDate}</div>
                    </div>
                    <div className="col-span-4 sm:col-span-1 mt-2 sm:mt-0">
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className={cn('font-medium', exam.remaining < 20 ? 'text-red-500' : 'text-emerald-600')}>
                          {exam.remaining}<span className="text-gray-400 font-normal">/{exam.total}</span>
                        </span>
                      </div>
                    </div>
                    <div className="col-span-8 sm:col-span-2 mt-2 sm:mt-0 flex items-center gap-2">
                      <button onClick={() => openApply(exam)} disabled={exam.remaining <= 0} className={cn(
                        'flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        exam.remaining > 0
                          ? 'bg-gradient-to-r from-gov-500 to-gov-700 text-white hover:shadow-md hover:scale-[1.02]'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}>
                        {exam.remaining > 0 ? '立即报名' : '已满员'}
                      </button>
                      <span className="text-xs text-gold-600 font-semibold hidden sm:inline">¥{exam.fee}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'score' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="bg-gradient-to-br from-gov-50 to-blue-50 rounded-xl p-6 border border-gov-100">
                <h3 className="font-bold text-gov-700 mb-4 flex items-center gap-2"><Search className="w-5 h-5" />成绩查询</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FormLabel required>准考证号</FormLabel>
                    <input type="text" value={scoreForm.ticketNo} onChange={(e) => setScoreForm({ ...scoreForm, ticketNo: e.target.value })} className="gov-input" placeholder="请输入准考证号" />
                  </div>
                  <div>
                    <FormLabel required>姓名</FormLabel>
                    <input type="text" value={scoreForm.name} onChange={(e) => setScoreForm({ ...scoreForm, name: e.target.value })} className="gov-input" placeholder="请输入姓名" />
                  </div>
                  <div>
                    <FormLabel required>验证码</FormLabel>
                    <div className="flex gap-2">
                      <input type="text" maxLength={4} value={scoreForm.captcha} onChange={(e) => setScoreForm({ ...scoreForm, captcha: e.target.value.toUpperCase() })} className="gov-input" placeholder="请输入验证码" />
                      <button onClick={refreshCaptcha} className="px-4 py-2 bg-gradient-to-r from-gold-400 to-gold-600 text-white rounded-lg font-serif font-bold tracking-widest text-lg min-w-[100px] select-none" title="点击刷新">
                        {captchaCode}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <button onClick={handleScoreQuery} disabled={loadingScore} className="gov-btn px-10 inline-flex items-center gap-2">
                    {loadingScore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loadingScore ? '查询中...' : '查询成绩'}
                  </button>
                </div>
              </div>

              {scoreResult && (
                <div className="relative max-w-md mx-auto border-2 border-gov-200 rounded-2xl overflow-hidden shadow-gov animate-fade-in-up">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#165DFF,#165DFF 10px,transparent 10px,transparent 20px)' }} />
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gov-500 via-gold-400 to-gov-500" />
                  <div className="relative p-6 bg-white">
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-serif font-bold text-xs shadow-md">
                        <FileCheck className="w-7 h-7" />
                      </div>
                    </div>
                    <h2 className="text-center text-xl font-serif font-bold text-gov-700 mb-1">职业技能等级成绩认定书</h2>
                    <p className="text-center text-xs text-gray-500 mb-6">VOCATIONAL SKILL CERTIFICATE</p>
                    <div className="space-y-3 bg-gray-50/80 rounded-xl p-5 mb-4">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">考试名称</span><span className="font-medium text-gray-800 text-right">{scoreResult.examName}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">工种/等级</span><span className="font-medium text-gray-800">{scoreResult.profession} · {scoreResult.level}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">准考证号</span><span className="font-mono text-gray-800">{scoreResult.ticketNo}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">姓名</span><span className="font-medium text-gray-800">{scoreResult.name}</span></div>
                      <div className="h-px bg-gray-200 my-2" />
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><div className="text-xs text-gray-500 mb-1">理论</div><div className={cn('text-xl font-bold font-serif', scoreResult.theory >= 60 ? 'text-emerald-600' : 'text-red-500')}>{scoreResult.theory}</div></div>
                        <div><div className="text-xs text-gray-500 mb-1">实操</div><div className={cn('text-xl font-bold font-serif', scoreResult.practice >= 60 ? 'text-emerald-600' : 'text-red-500')}>{scoreResult.practice}</div></div>
                        <div><div className="text-xs text-gray-500 mb-1">综合</div><div className={cn('text-xl font-bold font-serif', scoreResult.total >= 60 ? 'text-gov-600' : 'text-red-500')}>{scoreResult.total}</div></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        'inline-block px-4 py-1.5 rounded-full font-bold border-2 text-sm',
                        scoreResult.passed
                          ? 'border-red-500 text-red-600 bg-red-50'
                          : 'border-gray-400 text-gray-500 bg-gray-50'
                      )}>
                        {scoreResult.passed ? '✓ 考核合格' : '✗ 未通过'}
                      </div>
                      {scoreResult.passed && (
                        <button onClick={() => toast('证书PDF已下载（模拟）', 'success')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gov-50 text-gov-600 text-sm font-medium hover:bg-gov-100 transition-colors">
                          <Download className="w-4 h-4" /> 下载PDF
                        </button>
                      )}
                    </div>
                    <p className="text-center text-[10px] text-gray-400 mt-4">查询编号：{Date.now().toString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cert' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mockMyCerts.map((cert) => (
                  <div key={cert.id} className="group relative border rounded-xl overflow-hidden hover:shadow-gov hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white via-white to-gray-50">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gov-500 via-gold-400 to-gov-500" />
                    <div className="absolute top-3 right-3 opacity-5"><Award className="w-24 h-24 text-gov-500" /></div>
                    <div className="relative p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shadow-md">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        {cert.score && (
                          <span className="px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 text-xs font-bold">{cert.score}分</span>
                        )}
                      </div>
                      <h3 className="font-bold text-gov-700 text-lg mb-1 line-clamp-1">{cert.certName}</h3>
                      <div className="inline-block px-2 py-0.5 rounded bg-gold-50 text-gold-700 text-xs font-medium mb-3">{cert.level}</div>
                      <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                        <div className="flex"><span className="text-gray-400 w-16 shrink-0">持证人：</span><span className="font-medium">{cert.holder}</span></div>
                        <div className="flex"><span className="text-gray-400 w-16 shrink-0">取得日期：</span><span>{cert.issueDate}</span></div>
                        <div className="flex"><span className="text-gray-400 w-16 shrink-0">证书编号：</span><span className="font-mono text-[10px] text-gov-600">{cert.certNo}</span></div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center"><QrCode className="w-9 h-9 text-gray-700" /></div>
                        <div className="flex gap-2">
                          <button onClick={() => setZoomCert(cert)} className="p-2 rounded-lg bg-gov-50 text-gov-600 hover:bg-gov-100 transition-colors" title="放大查看"><ZoomIn className="w-4 h-4" /></button>
                          <button onClick={() => toast('证书PDF已下载（模拟）', 'success')} className="p-2 rounded-lg bg-gold-50 text-gold-600 hover:bg-gold-100 transition-colors" title="下载PDF"><Download className="w-4 h-4" /></button>
                          <button onClick={() => toast(`分享链接已复制：/verify/${cert.verifyCode}`, 'success')} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="分享核验"><QrCode className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showApplyModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={() => !loadingApply && setShowApplyModal(false)}>
          <div className="bg-white rounded-2xl shadow-gov-lg w-full max-w-lg overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="gov-gradient p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">在线报名</h3>
                <p className="text-white/80 text-xs mt-0.5">请如实填写报名信息</p>
              </div>
              <button onClick={() => !loadingApply && setShowApplyModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gov-50 rounded-xl p-4 border border-gov-100 text-xs space-y-1">
                <div className="flex"><span className="text-gray-500 w-20">考试：</span><span className="font-semibold text-gov-700">{selectedExam.name}</span></div>
                <div className="flex"><span className="text-gray-500 w-20">工种：</span><span className="font-medium text-gray-800">{selectedExam.profession}</span></div>
                <div className="flex"><span className="text-gray-500 w-20">等级/费用：</span><span className="font-medium text-gray-800">{selectedExam.level} · <span className="text-gold-600 font-bold">¥{selectedExam.fee}</span></span></div>
              </div>
              <div>
                <FormLabel required>真实姓名</FormLabel>
                <div className="relative"><User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={applyForm.realName} onChange={(e) => setApplyForm({ ...applyForm, realName: e.target.value })} className="gov-input pl-10" placeholder="请输入真实姓名" /></div>
              </div>
              <div>
                <FormLabel required>身份证号</FormLabel>
                <div className="relative"><IdCard className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" maxLength={18} value={applyForm.idCard} onChange={(e) => setApplyForm({ ...applyForm, idCard: e.target.value.toUpperCase() })} className="gov-input pl-10" placeholder="18位身份证号" /></div>
              </div>
              <div>
                <FormLabel required>联系电话</FormLabel>
                <div className="relative"><Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" maxLength={11} value={applyForm.phone} onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value.replace(/\D/g, '') })} className="gov-input pl-10" placeholder="11位手机号" /></div>
              </div>
              <div>
                <FormLabel required>一寸免冠照片</FormLabel>
                <div onClick={() => { setApplyForm({ ...applyForm, photoUploaded: true }); toast('照片上传成功（模拟）', 'success'); }} className={cn(
                  'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
                  applyForm.photoUploaded ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-200 hover:border-gov-300 hover:bg-gov-50/30'
                )}>
                  {applyForm.photoUploaded ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600"><CheckCircle className="w-5 h-5" /><span className="text-sm font-medium">photo.jpg · 128KB · 已上传</span></div>
                  ) : (
                    <div><FileUp className="w-8 h-8 text-gray-300 mx-auto mb-1" /><p className="text-sm font-medium text-gray-600">点击上传照片</p><p className="text-xs text-gray-400 mt-0.5">支持 JPG 格式，295×413px，白底</p></div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => !loadingApply && setShowApplyModal(false)} disabled={loadingApply} className="flex-1 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50">取消</button>
              <button onClick={handleApplySubmit} disabled={loadingApply} className="flex-1 gov-btn inline-flex items-center justify-center gap-2">
                {loadingApply ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loadingApply ? '提交中...' : '确认报名'}
              </button>
            </div>
          </div>
        </div>
      )}

      {zoomCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up" onClick={() => setZoomCert(null)}>
          <div className="bg-white rounded-2xl shadow-gov-lg max-w-md w-full overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="relative p-8 text-white" style={{ background: 'linear-gradient(135deg,#0E2C6B 0%,#165DFF 50%,#0E4AD9 100%)' }}>
              <div className="absolute inset-0 opacity-10"><div className="absolute top-5 right-5 w-24 h-24 border-2 border-white rounded-full" /><div className="absolute bottom-5 left-5 w-32 h-32 border-2 border-white rounded-full" /></div>
              <button onClick={() => setZoomCert(null)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 z-10"><X className="w-5 h-5" /></button>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6"><Award className="w-6 h-6 text-gold-300" /><span className="text-xs tracking-widest text-gold-300">CERTIFICATE</span></div>
                <h2 className="text-2xl font-serif font-bold mb-1">{zoomCert.certName}</h2>
                <p className="text-white/80 text-sm">{zoomCert.level}</p>
              </div>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">持证人</span><span className="font-semibold text-gray-800">{zoomCert.holder}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">证书编号</span><span className="font-mono text-xs text-gov-600">{zoomCert.certNo}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">发证日期</span><span className="text-gray-800">{zoomCert.issueDate}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">核验码</span><span className="font-mono text-xs text-gold-600">{zoomCert.verifyCode}</span></div>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex items-center justify-between">
                <QrCode className="w-16 h-16 text-gray-700" />
                <div className="text-right text-xs text-gray-400"><p>省级职业技能鉴定中心</p><p>签发专用章</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
