import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

const IDENTITY_OPTIONS = ['学生', '宝妈', '自由职业者', '其他'];
const EMPLOYER_TYPES = [
  { value: '校园社团', label: '校园社团' },
  { value: '连锁门店', label: '连锁门店' },
  { value: '活动公司', label: '活动公司' },
  { value: '其他', label: '其他' },
];

type RoleType = 'worker' | 'employer';

export default function Register() {
  const [role, setRole] = useState<RoleType>('worker');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [identityTags, setIdentityTags] = useState<string[]>([]);
  const [skillCerts, setSkillCerts] = useState('');
  const [employerType, setEmployerType] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const toggleTag = (tag: string) => {
    setIdentityTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await register({
        username: username || undefined,
        phone: phone || undefined,
        password,
        role,
        nickname: nickname || undefined,
        identity_tags: role === 'worker' ? identityTags : undefined,
        skill_certs: role === 'worker' && skillCerts ? skillCerts.split(',').map((s) => s.trim()) : undefined,
        employer_type: role === 'employer' ? employerType : undefined,
        employer_name: role === 'employer' ? employerName : undefined,
        business_license: role === 'employer' ? businessLicense : undefined,
      });
      navigate('/home');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || '注册失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-brand-800/10" />
        <div className="absolute top-20 right-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-8">
            兼
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">加入兼职通</h1>
          <p className="text-white/50 text-lg leading-relaxed">
            选择您的角色，开启灵活就业之旅
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-2">创建账号</h2>
          <p className="text-white/40 mb-6">填写信息完成注册</p>

          {errorMsg && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3 mb-6">
            {(['worker', 'employer'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                  role === r
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}
              >
                {r === 'worker' ? '我是求职者' : '我是雇主'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                placeholder="设置用户名（可选）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                placeholder="请输入手机号（可选）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                placeholder="至少6位密码"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                placeholder="您的昵称"
              />
            </div>

            {role === 'worker' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">身份标签</label>
                  <div className="flex flex-wrap gap-2">
                    {IDENTITY_OPTIONS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          identityTags.includes(tag)
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/5 text-white/50 border border-white/10'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">技能证书（逗号分隔）</label>
                  <input
                    type="text"
                    value={skillCerts}
                    onChange={(e) => setSkillCerts(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    placeholder="如: 驾驶证, 健康证"
                  />
                </div>
              </>
            )}

            {role === 'employer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">雇主类型</label>
                  <select
                    value={employerType}
                    onChange={(e) => setEmployerType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  >
                    <option value="" className="bg-slate-800">请选择</option>
                    {EMPLOYER_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-slate-800">{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">企业名称</label>
                  <input
                    type="text"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    placeholder="企业或团队名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">营业执照编号</label>
                  <input
                    type="text"
                    value={businessLicense}
                    onChange={(e) => setBusinessLicense(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    placeholder="统一社会信用代码"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 active:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '注册中...' : '注 册'}
            </button>
          </form>

          <p className="mt-6 text-center text-white/40 text-sm">
            已有账号？
            <Link to="/login" className="text-brand-400 hover:text-brand-300 ml-1 font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
