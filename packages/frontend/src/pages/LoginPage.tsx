import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Phone,
  Lock,
  MessageSquare,
  ArrowRight,
  Shield,
  Settings,
  Building2,
  Wrench,
  User,
  Home,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  MapPin,
  CreditCard,
  UserCheck,
  LogIn,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  testAccounts,
  getRoleRedirectPath,
} from '@/mock/auth';
import type { TestAccount } from '@/mock/auth';

type LoginTab = 'password' | 'sms';

const roleIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="w-5 h-5" />,
  settings: <Settings className="w-5 h-5" />,
  building: <Building2 className="w-5 h-5" />,
  wrench: <Wrench className="w-5 h-5" />,
  user: <User className="w-5 h-5" />,
};

const roleColors: Record<string, string> = {
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
};

const roleCardColors: Record<string, string> = {
  purple: 'hover:border-purple-400 hover:bg-purple-50 focus:ring-purple-300',
  blue: 'hover:border-blue-400 hover:bg-blue-50 focus:ring-blue-300',
  green: 'hover:border-green-400 hover:bg-green-50 focus:ring-green-300',
  orange: 'hover:border-orange-400 hover:bg-orange-50 focus:ring-orange-300',
  indigo: 'hover:border-indigo-400 hover:bg-indigo-50 focus:ring-indigo-300',
  teal: 'hover:border-teal-400 hover:bg-teal-50 focus:ring-teal-300',
};

const roleDotColors: Record<string, string> = {
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
};

const keywordHints: Record<string, string> = {
  admin: '💡 请使用11位手机号登录。平台管理员：13800000000 / admin123',
  platform: '💡 平台管理员测试账号：13800000000 / admin123，或点击下方"系统管理员"卡片一键登录',
  ops: '💡 社区运营测试账号：13800000001 / ops123，或点击下方"社区运营"卡片一键登录',
  运营: '💡 社区运营测试账号：13800000001 / ops123',
  管理员: '💡 平台管理员测试账号：13800000000 / admin123',
  物业: '💡 物业管理员：13800000002 / property123；物业员工：13800000003 / staff123，或点击下方快捷登录卡片',
  业主: '💡 实名住户：13900001001 / resident123，或点击"朝阳业主"卡片一键登录',
  住户: '💡 实名住户：13900001001 / resident123，海淀住户：13900002002 / resident123',
  designer: '⚠️ 邻里数字基座体系中无"设计师"角色，请选择实名住户、物业或管理员身份登录',
  设计师: '⚠️ 邻里数字基座体系中无"设计师"角色，请选择实名住户、物业或管理员身份登录',
  property: '💡 物业管理员：13800000002 / property123',
  staff: '💡 物业员工测试账号：13800000003 / staff123',
  家装: '⚠️ 本系统是"邻里数字基座"（社区子域为单元的住户/物业/运营平台），非家装协同系统',
  门店: '⚠️ 邻里数字基座不包含"门店"角色，请使用下方测试账号',
  监理: '⚠️ 邻里数字基座不包含"监理"角色，请选择物业员工身份登录',
  zhangsan: '💡 实名住户：陈明（13900001001/resident123）房主；李华（13900002002/resident123）租户',
  张三: '💡 实名住户：陈明（朝阳业主，房主）、李华（海淀住户，租户），请点击下方对应卡片',
};

const accountTagColors = [
  'bg-gray-100 text-gray-700',
  'bg-primary-50 text-primary-700',
  'bg-emerald-50 text-emerald-700',
  'bg-amber-50 text-amber-700',
];

const credentialAliases: Record<string, { phone: string; mappedPassword: string; matchAnyPassword?: boolean }> = {
  admin: { phone: '13800000000', mappedPassword: 'admin123', matchAnyPassword: true },
  platform: { phone: '13800000000', mappedPassword: 'admin123', matchAnyPassword: true },
  platform_admin: { phone: '13800000000', mappedPassword: 'admin123', matchAnyPassword: true },
  '平台管理员': { phone: '13800000000', mappedPassword: 'admin123', matchAnyPassword: true },
  '系统管理员': { phone: '13800000000', mappedPassword: 'admin123', matchAnyPassword: true },
  ops: { phone: '13800000001', mappedPassword: 'ops123', matchAnyPassword: true },
  tenant_admin: { phone: '13800000001', mappedPassword: 'ops123', matchAnyPassword: true },
  '社区运营': { phone: '13800000001', mappedPassword: 'ops123', matchAnyPassword: true },
  '运营': { phone: '13800000001', mappedPassword: 'ops123', matchAnyPassword: true },
  '物业主管': { phone: '13800000002', mappedPassword: 'property123', matchAnyPassword: true },
  '物业管理员': { phone: '13800000002', mappedPassword: 'property123', matchAnyPassword: true },
  property_admin: { phone: '13800000002', mappedPassword: 'property123', matchAnyPassword: true },
  '物业员工': { phone: '13800000003', mappedPassword: 'staff123', matchAnyPassword: true },
  property_staff: { phone: '13800000003', mappedPassword: 'staff123', matchAnyPassword: true },
  '张师傅': { phone: '13800000003', mappedPassword: 'staff123', matchAnyPassword: true },
  '朝阳业主': { phone: '13900001001', mappedPassword: 'resident123', matchAnyPassword: true },
  '陈明': { phone: '13900001001', mappedPassword: 'resident123', matchAnyPassword: true },
  resident: { phone: '13900001001', mappedPassword: 'resident123', matchAnyPassword: true },
  '海淀住户': { phone: '13900002002', mappedPassword: 'resident123', matchAnyPassword: true },
  '李华': { phone: '13900002002', mappedPassword: 'resident123', matchAnyPassword: true },
  '业主': { phone: '13900001001', mappedPassword: 'resident123', matchAnyPassword: true },
  '住户': { phone: '13900001001', mappedPassword: 'resident123', matchAnyPassword: true },
  '张三': { phone: '13900001001', mappedPassword: 'resident123', matchAnyPassword: true },
  zhangsan: { phone: '13900001001', mappedPassword: 'resident123', matchAnyPassword: true },
};

function resolveCredentialAlias(phone: string, password: string) {
  const alias = credentialAliases[phone.trim().toLowerCase()];
  if (!alias) return null;
  if (alias.matchAnyPassword || password === alias.mappedPassword) {
    return alias;
  }
  return null;
}

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [useMock, setUseMock] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: storeLogin, setUseMock: setStoreUseMock } = useAuthStore();

  const from = (location.state as { from?: string })?.from || '';

  useEffect(() => {
    setStoreUseMock(useMock);
  }, [useMock, setStoreUseMock]);

  useEffect(() => {
    if (phone || password) {
      setError('');
    }
  }, [phone, password]);

  const validatePhone = (p: string): string | null => {
    if (!p) return '请输入手机号';
    const trimmed = p.trim().toLowerCase();
    for (const keyword of Object.keys(keywordHints)) {
      if (trimmed.includes(keyword.toLowerCase())) {
        return keywordHints[keyword];
      }
    }
    if (!/^1[3-9]\d{9}$/.test(p)) {
      return '请输入正确的11位手机号（如 13800000000），或点击下方测试账号卡片一键登录';
    }
    return null;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const alias = resolveCredentialAlias(phone, password);
    const loginPhone = alias?.phone || phone;
    const loginPassword = alias?.mappedPassword || password;

    if (alias) {
      setPhone(loginPhone);
      setPassword(loginPassword);
    }

    const phoneError = validatePhone(loginPhone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (!loginPassword) {
      setError('请输入密码');
      return;
    }
    if (loginPassword.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    setLoading(true);
    try {
      const user = await storeLogin(loginPhone, loginPassword);
      const redirectPath = from || getRoleRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || '登录失败，请检查账号密码');
      } else {
        setError('登录失败，请检查账号密码');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (!smsCode || smsCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      await storeLogin(phone, smsCode);
      navigate('/', { replace: true });
    } catch {
      setError('验证码错误或已过期');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account: TestAccount) => {
    setError('');
    setLoading(true);
    setPhone(account.phone);
    setPassword(account.password);

    try {
      await storeLogin(account.phone, account.password);
      const redirectPath = from || getRoleRedirectPath(account.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('登录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phone || countdown > 0) return;
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    try {
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('验证码发送失败，请稍后重试');
    }
  };

  const handleSamlLogin = () => {
    setError(
      '物业SAML单点登录需配置物业方 IdP 服务（子域级），演示环境请使用下方物业员工/物业主管快捷登录卡片'
    );
  };

  const renderAccountCard = (account: TestAccount) => {
    const redirect = getRoleRedirectPath(account.role);
    const redirectLabel =
      redirect === '/admin'
        ? '管理后台仪表盘'
        : redirect.startsWith('/property')
          ? '物业工作台'
          : '社区住户主页';

    return (
      <div
        key={account.phone}
        className={`group rounded-xl border-2 border-gray-100 bg-white transition-all ${roleCardColors[account.color]}`}
      >
        <div className="p-3">
          <div className="flex items-start gap-3 mb-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${roleColors[account.color]}`}
            >
              {roleIcons[account.icon]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${roleDotColors[account.color]}`}
                />
                <span className="text-sm font-bold text-gray-900">
                  {account.label}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
                {account.roleLabel}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">
                  {account.communityName}（{account.subdomain}.neighborhood.cn）
                </span>
              </div>
            </div>
          </div>

          {account.identityTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {account.identityTags.map((t, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${accountTagColors[i % accountTagColors.length]}`}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-1 text-[11px] text-gray-500 mb-3 border-t border-gray-50 pt-2">
            {account.role === 'resident' && (
              <>
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-primary-500" />
                  <span>实名认证：已通过</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-emerald-500" />
                  <span>门禁卡：已绑定（2张）</span>
                </div>
              </>
            )}
            {(account.role === 'property_admin' ||
              account.role === 'property_staff') && (
              <div className="flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-green-500" />
                <span>物业 SAML 单点登录账号</span>
              </div>
            )}
            {(account.role === 'platform_admin' ||
              account.role === 'tenant_admin') && (
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-purple-500" />
                <span>后台权限：{account.permissionHints.length} 个模块</span>
              </div>
            )}
          </div>

          {account.permissionHints.length > 0 && (
            <div className="border-t border-gray-50 pt-2">
              <div className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                可复核模块
              </div>
              <div className="flex flex-wrap gap-1">
                {account.permissionHints.slice(0, 4).map((p, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded"
                  >
                    {p}
                  </span>
                ))}
                {account.permissionHints.length > 4 && (
                  <span className="text-[10px] text-gray-400">
                    +{account.permissionHints.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => handleQuickLogin(account)}
          disabled={loading}
          className="w-full px-3 py-2.5 border-t border-gray-100 text-[12px] font-semibold flex items-center justify-center gap-1.5 text-gray-700 hover:text-white bg-gray-50 hover:bg-primary-600 rounded-b-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-primary-600 group-hover:text-white"
        >
          <LogIn className="w-3.5 h-3.5" />
          一键登录
          <span className="opacity-60 hidden group-hover:inline">
            → {redirectLabel}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 px-4 py-6">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <div className="flex-1 lg:pt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-primary-200/50">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  邻里数字基座
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Neighborhood Digital Platform · 多租户 · 子域为单元
                </p>
              </div>
              <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded bg-gradient-to-r from-primary-100 to-emerald-100 text-primary-700">
                DEMO · v1.0
              </span>
            </div>

            <h2 className="text-[32px] leading-tight font-black text-gray-900 mb-3 tracking-tight">
              连接每一栋楼，
              <br />
              共建<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-600">可信邻里社区</span>
            </h2>
            <p className="text-gray-600 mb-7 text-base leading-relaxed">
              以物理社区为独立子域单元，融合
              <span className="font-medium text-gray-800">实名住户+门禁绑定</span>、
              <span className="font-medium text-gray-800">物业 SAML 单点登录</span>、
              <span className="font-medium text-gray-800">社区运营后台</span>，
              提供邻里社交、半径优选、担保交易、小金库、分润结算的完整数字底座。
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
              {[
                {
                  icon: <MessageSquare className="w-5 h-5" />,
                  label: '邻里话题',
                  sub: '聚合推荐',
                  color: 'text-primary-600 bg-primary-50',
                  ring: 'ring-primary-100',
                },
                {
                  icon: <Sparkles className="w-5 h-5" />,
                  label: '半径优选',
                  sub: '仓配联动',
                  color: 'text-emerald-600 bg-emerald-50',
                  ring: 'ring-emerald-100',
                },
                {
                  icon: <Building2 className="w-5 h-5" />,
                  label: '物业服务',
                  sub: '门禁/报修',
                  color: 'text-amber-600 bg-amber-50',
                  ring: 'ring-amber-100',
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  label: '担保交易',
                  sub: '分润结算',
                  color: 'text-purple-600 bg-purple-50',
                  ring: 'ring-purple-100',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-start p-4 rounded-2xl ${item.color} ring-1 ${item.ring} hover:-translate-y-0.5 transition-transform`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {item.icon}
                    <span className="text-sm font-bold text-gray-800">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {item.sub}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">实名住户 + 门禁绑定</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">物业 SAML 单点登录</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">多租户独立子域</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">后台风控 & 溯源</span>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur border border-gray-200/60 rounded-2xl p-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-2 text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                业务角色边界说明
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-start gap-2 bg-purple-50/60 rounded-lg p-2.5">
                  <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      平台/社区管理员
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      社区健康度、溯源日志、红包风控、分润结算
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-green-50/60 rounded-lg p-2.5">
                  <Building2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800">物业主管/员工</div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      门禁、缴费、报修、投诉；SAML 单点登录
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-indigo-50/60 rounded-lg p-2.5 sm:col-span-2">
                  <User className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      实名住户（房主/租户/家属）
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      身份证+人脸实名 → 楼栋门牌绑定 → NFC/虚拟门禁卡 →
                      邻里话题、半径优选、二手担保、小金库、合伙人分润、物业报修缴费
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[470px] flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">账号登录</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    演示模式下直接使用下方快捷账号进入对应工作台
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">演示模式</span>
                  <button
                    onClick={() => setUseMock(!useMock)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      useMock ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        useMock ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex border-b border-gray-200 mb-5">
                <button
                  onClick={() => {
                    setTab('password');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                    tab === 'password'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  密码
                </button>
                <button
                  onClick={() => {
                    setTab('sms');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                    tab === 'sms'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  验证码
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-red-600 whitespace-pre-line">{error}</span>
                </div>
              )}

              {tab === 'password' ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      手机号
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="请输入11位手机号（如13800000000）"
                        className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                        maxLength={11}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="请输入密码（不少于6位）"
                        className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        登录中...
                      </>
                    ) : (
                      <>
                        登录
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSmsLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      手机号
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="请输入手机号"
                        className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                        maxLength={11}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      验证码
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value)}
                          placeholder="请输入6位验证码"
                          className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                          maxLength={6}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0}
                        className="rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[110px] transition"
                      >
                        {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                  >
                    {loading ? '登录中...' : '登录'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}

              <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                <button
                  onClick={handleSamlLogin}
                  className="w-full rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 py-2.5 text-sm font-bold text-emerald-700 transition"
                >
                  <span className="flex items-center justify-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    物业 SAML 单点登录（子域级）
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </span>
                </button>

                <p className="text-center text-xs text-gray-500">
                  还没有账号？{' '}
                  <Link
                    to="/register"
                    className="text-primary-600 font-semibold hover:underline"
                  >
                    前往社区线下实名认证 →
                  </Link>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-gray-700">
                    测试账号 · 一键登录
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  6 个身份 · 3 种角色工作台
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {testAccounts.map(renderAccountCard)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
