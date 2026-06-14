import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserCircle2,
  Building2,
  ArrowRight,
  ChevronLeft,
  Check,
  ShieldCheck,
  Upload,
  FileText,
  Plus,
  X,
  GraduationCap,
  Briefcase,
  User,
} from 'lucide-react';
import { useAuthStore, UserRole } from '@/store/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import request from '@/lib/axios';

type RegisterRole = Exclude<UserRole, 'admin' | 'officer'>;
type Step = 1 | 2 | 3 | 4 | 5;

interface MentorInfo {
  id: string;
  name: string;
  position: string;
  phone: string;
}

const MAJOR_OPTIONS = ['计算机', '电子通信', '经管', '设计', '机械', '其他'];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as RegisterRole) || 'student';
  const { login } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<RegisterRole>(initialRole);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [creditCode, setCreditCode] = useState('');
  const [legalRep, setLegalRep] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [agreementFiles, setAgreementFiles] = useState<File[]>([]);
  const [mentorName, setMentorName] = useState('');
  const [mentorPosition, setMentorPosition] = useState('');
  const [mentorPhone, setMentorPhone] = useState('');
  const [mentors, setMentors] = useState<MentorInfo[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = role === 'enterprise' ? 5 : 4;

  const stepLabels =
    role === 'enterprise'
      ? ['身份选择', '手机验证', '设置密码', '企业资质', '协议与带教']
      : ['身份选择', '手机验证', '设置密码', '完善信息'];

  const displayIndex = step - 1;

  const sendCode = () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的11位手机号');
      return;
    }
    setError('');
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const goNext = (next: Step) => {
    setError('');
    setStep(next);
  };

  const goBack = (prev: Step) => {
    setError('');
    setStep(prev);
  };

  const validateStep1 = () => {
    goNext(2);
  };

  const validateStep2 = () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的11位手机号');
      return false;
    }
    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return false;
    }
    goNext(3);
    return true;
  };

  const validateStep3 = () => {
    if (!password || password.length < 8) {
      setError('密码至少8位，建议包含字母和数字');
      return false;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    goNext(4);
    return true;
  };

  const validateStep4 = () => {
    if (role === 'student') {
      if (!nickname.trim()) {
        setError('请输入昵称');
        return false;
      }
      if (!school.trim()) {
        setError('请输入学校名称');
        return false;
      }
      if (!major) {
        setError('请选择专业方向');
        return false;
      }
      return true;
    }
    if (!companyName.trim()) {
      setError('请输入企业全称');
      return false;
    }
    if (!creditCode.trim()) {
      setError('请输入统一社会信用代码');
      return false;
    }
    if (!legalRep.trim()) {
      setError('请输入法人代表姓名');
      return false;
    }
    if (!licenseFile) {
      setError('请上传营业执照');
      return false;
    }
    goNext(5);
    return true;
  };

  const addMentor = () => {
    if (!mentorName.trim()) {
      setError('请输入带教人姓名');
      return;
    }
    if (!mentorPosition.trim()) {
      setError('请输入带教人职位');
      return;
    }
    if (!mentorPhone.trim() || mentorPhone.length !== 11) {
      setError('请输入正确的带教人联系电话');
      return;
    }
    setError('');
    setMentors((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: mentorName.trim(),
        position: mentorPosition.trim(),
        phone: mentorPhone.trim(),
      },
    ]);
    setMentorName('');
    setMentorPosition('');
    setMentorPhone('');
  };

  const removeMentor = (id: string) => {
    setMentors((prev) => prev.filter((m) => m.id !== id));
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('仅支持 JPG/PNG/WebP 图片或 PDF 文件');
        return;
      }
      setError('');
      setLicenseFile(file);
    }
  };

  const handleAgreementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf'
    );
    if (pdfFiles.length === 0) {
      setError('仅支持上传 PDF 文件');
      return;
    }
    setError('');
    setAgreementFiles((prev) => [...prev, ...pdfFiles]);
  };

  const removeAgreementFile = (index: number) => {
    setAgreementFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const completeRegister = async () => {
    if (role === 'student') {
      if (!validateStep4()) return;
    } else {
      if (mentors.length === 0) {
        setError('请至少添加一位带教人');
        return;
      }
    }
    setError('');
    setLoading(true);
    try {
      const accountName = role === 'student' ? nickname.trim() : companyName.trim();
      const response = await request.post('/auth/register', {
        username: accountName || phone,
        email: `${phone}@zhanchi.local`,
        password,
        role,
        phone,
        nickname: nickname.trim() || accountName || phone,
        school: school.trim(),
        major,
        company_name: companyName.trim(),
        legal_rep: legalRep.trim(),
      }) as {
        success: boolean;
        data: {
          token: string;
          user: {
            id: number;
            role: UserRole;
            phone?: string;
            username?: string;
            avatar?: string;
            created_at?: string;
          };
        };
      };

      const { token, user } = response.data;
      login(token, {
        id: user.id,
        role: user.role,
        phone: user.phone || phone,
        nickname: user.username || accountName || phone,
        avatar: user.avatar,
        createdAt: user.created_at || new Date().toISOString(),
      });

      navigate(role === 'student' ? '/student/profile' : '/enterprise/qualification');
    } catch (err: any) {
      setError(err?.response?.data?.error || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-7">
      {Array.from({ length: totalSteps }, (_, i) => i).map((i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i < displayIndex + 1
                  ? 'bg-brand-gradient text-white shadow-float'
                  : 'bg-cream-100 text-ink-400'
              }`}
            >
              {i < displayIndex ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={`text-[10px] mt-1.5 whitespace-nowrap ${
                i < displayIndex + 1 ? 'text-brand-600 font-medium' : 'text-ink-400'
              }`}
            >
              {stepLabels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`h-0.5 flex-1 mx-1.5 mt-[-20px] transition-all ${
                i < displayIndex ? 'bg-brand-400' : 'bg-ink-100'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderError = (filter?: (e: string) => boolean) => {
    if (!error) return null;
    if (filter && !filter(error)) return null;
    return (
      <div className="text-xs text-danger-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {error}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-float transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-2xl font-num">Z</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">
          创建你的<span className="bg-text-gradient ml-1.5">展翅账号</span>
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          仅需 {totalSteps} 步，开启你的实习赋能之旅
        </p>
      </div>

      <div className="relative bg-white rounded-3xl shadow-card border border-white/80 p-7 md:p-8 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-56 h-56 rounded-full bg-brand-200/30 blur-3xl" />

        <div className="relative">
          {renderStepIndicator()}

          {step === 1 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                    role === 'student'
                      ? 'border-brand-400 bg-brand-50/60 shadow-soft'
                      : 'border-ink-100 hover:border-ink-200 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === 'student' ? 'bg-brand-gradient text-white' : 'bg-ink-50 text-ink-500'
                    }`}
                  >
                    <UserCircle2 size={26} />
                  </div>
                  <div className="text-sm font-semibold text-ink-800">我是学生</div>
                  <div className="text-[11px] text-ink-400 text-center leading-relaxed">
                    找岗位 · 建档案 · 用工具
                  </div>
                  {role === 'student' && (
                    <Badge variant="brand" size="xs" className="absolute top-2 right-2">
                      推荐
                    </Badge>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('enterprise')}
                  className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                    role === 'enterprise'
                      ? 'border-teal-400 bg-teal-50/60 shadow-soft'
                      : 'border-ink-100 hover:border-ink-200 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === 'enterprise'
                        ? 'bg-teal-gradient text-white'
                        : 'bg-ink-50 text-ink-500'
                    }`}
                  >
                    <Building2 size={26} />
                  </div>
                  <div className="text-sm font-semibold text-ink-800">我是企业</div>
                  <div className="text-[11px] text-ink-400 text-center leading-relaxed">
                    发岗位 · 收简历 · 招人才
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-cream-100/70 border border-ink-100 text-xs text-ink-500">
                <ShieldCheck size={15} className="text-teal-500 shrink-0" />
                <span>
                  平台已对接<span className="text-ink-700 font-medium mx-1">学信网学籍核验</span>
                  与<span className="text-ink-700 font-medium mx-1">企业工商信息</span>，保障数据真实
                </span>
              </div>

              <Button size="lg" onClick={validateStep1} className="w-full mt-1">
                下一步
                <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validateStep2();
              }}
              className="flex flex-col gap-4 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-sm text-ink-600 mb-1">
                <Badge variant={role === 'student' ? 'brand' : 'verified'} size="xs">
                  {role === 'student' ? '学生注册' : '企业注册'}
                </Badge>
                <span className="text-ink-400 text-xs">第 2 步：手机验证</span>
              </div>

              <Input
                label="手机号"
                type="tel"
                name="phone"
                placeholder="请输入11位手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                leftIcon={<Phone size={17} strokeWidth={1.8} />}
                maxLength={11}
                error={error.includes('手机号') ? error : undefined}
              />

              <div>
                <Input
                  label="验证码"
                  type="text"
                  name="code"
                  placeholder="请输入6位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  error={error.includes('验证码') ? error : undefined}
                  rightIcon={
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={countdown > 0}
                      className={`text-sm font-medium whitespace-nowrap pr-1 ${
                        countdown > 0
                          ? 'text-ink-300 cursor-not-allowed'
                          : 'text-brand-600 hover:text-brand-700'
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                    </button>
                  }
                />
              </div>

              {renderError((e) => !e.includes('手机号') && !e.includes('验证码'))}

              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goBack(1)}
                  className="flex-1"
                >
                  <ChevronLeft size={16} />
                  上一步
                </Button>
                <Button type="submit" size="lg" className="flex-1">
                  下一步
                  <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validateStep3();
              }}
              className="flex flex-col gap-4 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-sm text-ink-600 mb-1">
                <Badge variant={role === 'student' ? 'brand' : 'verified'} size="xs">
                  {role === 'student' ? '学生注册' : '企业注册'}
                </Badge>
                <span className="text-ink-400 text-xs">第 3 步：设置密码</span>
              </div>

              <Input
                label="设置密码"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="至少8位，建议字母+数字"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={17} strokeWidth={1.8} />}
                rightIcon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-ink-400 hover:text-ink-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} strokeWidth={1.8} /> : <Eye size={17} strokeWidth={1.8} />}
                  </button>
                }
                error={error.includes('密码') && !error.includes('一致') ? error : undefined}
              />

              <Input
                label="确认密码"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock size={17} strokeWidth={1.8} />}
                error={error.includes('一致') ? error : undefined}
              />

              {renderError((e) => !e.includes('密码') && !e.includes('一致'))}

              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goBack(2)}
                  className="flex-1"
                >
                  <ChevronLeft size={16} />
                  上一步
                </Button>
                <Button type="submit" size="lg" className="flex-1">
                  下一步
                  <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 4 && role === 'student' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (validateStep4()) {
                  completeRegister();
                }
              }}
              className="flex flex-col gap-4 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-sm text-ink-600 mb-1">
                <Badge variant="brand" size="xs">学生注册</Badge>
                <span className="text-ink-400 text-xs">第 4 步：完善信息</span>
              </div>

              <Input
                label="昵称"
                type="text"
                name="nickname"
                placeholder="给你自己起个昵称吧"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                leftIcon={<UserCircle2 size={17} strokeWidth={1.8} />}
                error={error.includes('昵称') ? error : undefined}
              />

              <Input
                label="学校名称"
                type="text"
                name="school"
                placeholder="请输入你的学校名称"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                leftIcon={<GraduationCap size={17} strokeWidth={1.8} />}
                error={error.includes('学校') ? error : undefined}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700 ml-0.5 select-none">
                  专业方向
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MAJOR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setMajor(opt);
                        setError('');
                      }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                        major === opt
                          ? 'border-brand-400 bg-brand-50/60 text-brand-700 shadow-soft'
                          : 'border-ink-100 text-ink-600 hover:border-ink-200 bg-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {error.includes('专业') && (
                  <p className="text-xs text-danger-500 ml-1">{error}</p>
                )}
              </div>

              <label className="flex items-start gap-2 text-xs text-ink-500 cursor-pointer select-none leading-relaxed">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 w-3.5 h-3.5 rounded border-ink-200 text-brand-500 focus:ring-brand-400 shrink-0"
                />
                <span>
                  我已阅读并同意
                  <Link to="/legal/terms" className="text-brand-600 mx-1 hover:underline">
                    《服务协议》
                  </Link>
                  和
                  <Link to="/legal/privacy" className="text-brand-600 mx-1 hover:underline">
                    《隐私政策》
                  </Link>
                </span>
              </label>

              {renderError((e) => !e.includes('昵称') && !e.includes('学校') && !e.includes('专业'))}

              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goBack(3)}
                  className="flex-1"
                >
                  <ChevronLeft size={16} />
                  上一步
                </Button>
                <Button type="submit" size="lg" loading={loading} className="flex-1">
                  创建学生账号
                  <Check size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 4 && role === 'enterprise' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validateStep4();
              }}
              className="flex flex-col gap-4 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-sm text-ink-600 mb-1">
                <Badge variant="verified" size="xs">企业注册</Badge>
                <span className="text-ink-400 text-xs">第 4 步：企业资质</span>
              </div>

              <Input
                label="企业全称"
                type="text"
                name="companyName"
                placeholder="请输入企业营业执照上的全称"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                leftIcon={<Building2 size={17} strokeWidth={1.8} />}
                error={error.includes('企业全称') ? error : undefined}
              />

              <Input
                label="统一社会信用代码"
                type="text"
                name="creditCode"
                placeholder="18位统一社会信用代码"
                value={creditCode}
                onChange={(e) => setCreditCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 18))}
                leftIcon={<ShieldCheck size={17} strokeWidth={1.8} />}
                maxLength={18}
                error={error.includes('信用代码') ? error : undefined}
              />

              <Input
                label="法人代表姓名"
                type="text"
                name="legalRep"
                placeholder="请输入法人代表姓名"
                value={legalRep}
                onChange={(e) => setLegalRep(e.target.value)}
                leftIcon={<User size={17} strokeWidth={1.8} />}
                error={error.includes('法人') ? error : undefined}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700 ml-0.5 select-none">
                  营业执照
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl2 p-6 text-center transition-all cursor-pointer ${
                    licenseFile
                      ? 'border-teal-300 bg-teal-50/40'
                      : 'border-ink-200 hover:border-teal-300 hover:bg-teal-50/20'
                  }`}
                  onClick={() => document.getElementById('license-upload')?.click()}
                >
                  <input
                    id="license-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleLicenseUpload}
                  />
                  {licenseFile ? (
                    <div className="flex items-center justify-center gap-2 text-teal-700">
                      <FileText size={18} />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {licenseFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLicenseFile(null);
                        }}
                        className="text-ink-400 hover:text-danger-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto text-ink-300 mb-2" />
                      <p className="text-sm text-ink-500">
                        点击或拖拽上传营业执照
                      </p>
                      <p className="text-xs text-ink-400 mt-1">
                        支持 JPG / PNG / WebP / PDF
                      </p>
                    </>
                  )}
                </div>
                {error.includes('营业执照') && (
                  <p className="text-xs text-danger-500 ml-1">{error}</p>
                )}
              </div>

              {renderError(
                (e) =>
                  !e.includes('企业全称') &&
                  !e.includes('信用代码') &&
                  !e.includes('法人') &&
                  !e.includes('营业执照')
              )}

              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goBack(3)}
                  className="flex-1"
                >
                  <ChevronLeft size={16} />
                  上一步
                </Button>
                <Button type="submit" size="lg" className="flex-1">
                  下一步
                  <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 5 && role === 'enterprise' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-ink-600 mb-1">
                <Badge variant="verified" size="xs">企业注册</Badge>
                <span className="text-ink-400 text-xs">第 5 步：协议与带教</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700 ml-0.5 select-none">
                  实习协议模板
                </label>
                <div
                  className="relative border-2 border-dashed border-ink-200 hover:border-teal-300 hover:bg-teal-50/20 rounded-xl2 p-5 text-center transition-all cursor-pointer"
                  onClick={() => document.getElementById('agreement-upload')?.click()}
                >
                  <input
                    id="agreement-upload"
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleAgreementUpload}
                  />
                  <Upload size={22} className="mx-auto text-ink-300 mb-1.5" />
                  <p className="text-sm text-ink-500">点击上传实习协议模板</p>
                  <p className="text-xs text-ink-400 mt-1">仅支持 PDF 格式，可上传多个</p>
                </div>
                {agreementFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {agreementFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50/50 border border-teal-100"
                      >
                        <FileText size={15} className="text-teal-600 shrink-0" />
                        <span className="text-sm text-ink-700 truncate flex-1">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAgreementFile(idx)}
                          className="text-ink-400 hover:text-danger-500 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-ink-700 ml-0.5 select-none">
                  岗位带教人
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  <Input
                    type="text"
                    name="mentorName"
                    placeholder="带教人姓名"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    leftIcon={<User size={15} strokeWidth={1.8} />}
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input
                      type="text"
                      name="mentorPosition"
                      placeholder="职位"
                      value={mentorPosition}
                      onChange={(e) => setMentorPosition(e.target.value)}
                      leftIcon={<Briefcase size={15} strokeWidth={1.8} />}
                    />
                    <Input
                      type="tel"
                      name="mentorPhone"
                      placeholder="联系电话"
                      value={mentorPhone}
                      onChange={(e) => setMentorPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      leftIcon={<Phone size={15} strokeWidth={1.8} />}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMentor}
                  className="w-full"
                >
                  <Plus size={14} />
                  添加带教人
                </Button>

                {mentors.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {mentors.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-teal-50/50 border border-teal-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-gradient flex items-center justify-center text-white shrink-0">
                          <User size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink-800">{m.name}</div>
                          <div className="text-xs text-ink-500">
                            {m.position} · {m.phone}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMentor(m.id)}
                          className="text-ink-400 hover:text-danger-500 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {renderError((e) => e.includes('带教'))}

              <label className="flex items-start gap-2 text-xs text-ink-500 cursor-pointer select-none leading-relaxed">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 w-3.5 h-3.5 rounded border-ink-200 text-brand-500 focus:ring-brand-400 shrink-0"
                />
                <span>
                  我已阅读并同意
                  <Link to="/legal/terms" className="text-brand-600 mx-1 hover:underline">
                    《服务协议》
                  </Link>
                  和
                  <Link to="/legal/privacy" className="text-brand-600 mx-1 hover:underline">
                    《隐私政策》
                  </Link>
                </span>
              </label>

              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => goBack(4)}
                  className="flex-1"
                >
                  <ChevronLeft size={16} />
                  上一步
                </Button>
                <Button
                  type="button"
                  size="lg"
                  loading={loading}
                  className="flex-1"
                  onClick={completeRegister}
                >
                  创建企业账号
                  <Check size={16} />
                </Button>
              </div>
            </div>
          )}

          <div className="mt-7 text-center text-sm text-ink-500">
            已有账号？
            <Link
              to={`/login${role === 'enterprise' ? '?role=enterprise' : ''}`}
              className="text-brand-600 font-semibold hover:text-brand-700 ml-1 link-underline"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
