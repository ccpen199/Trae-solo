import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Phone, Lock, User, Building2, Briefcase, ChevronRight } from 'lucide-react';

export default function Register() {
  const [role, setRole] = useState<'employer' | 'provider'>('employer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactName, setContactName] = useState('');
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [skills, setSkills] = useState('');
  const [categories, setCategories] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = role === 'employer' ? '/auth/register/employer' : '/auth/register/provider';
      const body: any = { phone, password, name };
      if (role === 'employer') {
        body.company_name = companyName;
        body.industry = industry || undefined;
        body.contact_name = contactName || undefined;
      } else {
        body.real_name = realName;
        body.id_card = idCard;
        body.skills = skills || undefined;
        body.service_categories = categories || undefined;
      }
      await api.post(endpoint, body);
      await login(phone, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">创建账号</h1>
          <p className="text-gray-500 mt-2">选择您的角色开始注册</p>
        </div>

        <div className="card">
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                role === 'employer'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Building2 size={18} />
              企业雇主
            </button>
            <button
              type="button"
              onClick={() => setRole('provider')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                role === 'provider'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Briefcase size={18} />
              服务商
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-xl">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" className="input-field pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请设置密码" className="input-field pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入用户名" className="input-field pl-10" required />
              </div>
            </div>

            {role === 'employer' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">公司名称 *</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="请输入公司名称" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">行业</label>
                  <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="如：互联网、制造业" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">联系人</label>
                  <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="请输入联系人姓名" className="input-field" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">真实姓名 *</label>
                  <input type="text" value={realName} onChange={(e) => setRealName(e.target.value)} placeholder="请输入真实姓名" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">身份证号 *</label>
                  <input type="text" value={idCard} onChange={(e) => setIdCard(e.target.value)} placeholder="请输入身份证号" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">技能</label>
                  <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="如：Photoshop, Illustrator" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">服务类别</label>
                  <input type="text" value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="如：ui_design, industrial_design" className="input-field" />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? '注册中...' : '注册'}
              <ChevronRight size={18} />
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            已有账号？
            <Link to="/login" className="text-primary hover:underline ml-1">立即登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
