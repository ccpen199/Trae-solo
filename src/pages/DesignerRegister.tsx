import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Award,
  FileText,
  Upload,
  Plus,
  X,
  Home,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { useAppStore } from '@/store';

const specialties = [
  '现代简约', '北欧风格', '新中式', '美式乡村',
  '轻奢风格', '日式风格', '工业风', '地中海',
  '法式', '极简主义', 'ins风', 'LOFT',
];

interface PortfolioItem {
  id: string;
  image: string;
  title: string;
  description: string;
}

export default function DesignerRegister() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    certificationNo: '',
    experience: '',
    company: '',
    portfolioDesc: '',
  });

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPortfolio((prev) => [
            ...prev,
            {
              id: `p-${Date.now()}-${index}`,
              image: reader.result as string,
              title: `作品 ${prev.length + index + 1}`,
              description: '',
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePortfolio = (id: string) => {
    setPortfolio(portfolio.filter((p) => p.id !== id));
  };

  const updatePortfolioItem = (id: string, field: 'title' | 'description', value: string) => {
    setPortfolio(portfolio.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: 'd1',
        phone: formData.phone,
        nickname: formData.name,
        role: 'designer',
        createdAt: new Date(),
      });
      setLoading(false);
      navigate('/designer/dashboard');
    }, 1500);
  };

  const steps = [
    { id: 1, label: '基本信息', icon: User },
    { id: 2, label: '专业资质', icon: Award },
    { id: 3, label: '作品集', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-8">
      <div className="container max-w-3xl">
        <Link
          to="/"
          className="flex items-center gap-2 text-primary-700 font-bold text-xl mb-6 font-heading"
        >
          <Home className="w-6 h-6" />
          筑家数据
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">设计师入驻申请</h1>
            <p className="text-gray-500">加入筑家数据平台，展示你的优秀作品</p>
          </div>

          <div className="flex items-center justify-center mb-10">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-primary text-white'
                          : isActive
                          ? 'bg-primary-100 text-primary-700 ring-4 ring-primary-50'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive || isDone ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`w-16 sm:w-24 h-1 mx-2 sm:mx-4 rounded ${
                        isDone ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="头像" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-md">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-3">点击上传头像照片</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4 inline mr-1 text-gray-400" />
                    真实姓名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入真实姓名"
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-4 h-4 inline mr-1 text-gray-400" />
                    手机号码 *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入手机号码"
                    className="input-base"
                    maxLength={11}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="w-4 h-4 inline mr-1 text-gray-400" />
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱地址"
                    className="input-base"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Award className="w-4 h-4 inline mr-1 text-gray-400" />
                    设计师证书编号
                  </label>
                  <input
                    type="text"
                    value={formData.certificationNo}
                    onChange={(e) => setFormData({ ...formData, certificationNo: e.target.value })}
                    placeholder="请输入证书编号（选填）"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Briefcase className="w-4 h-4 inline mr-1 text-gray-400" />
                    从业年限 (年) *
                  </label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="请输入从业年限"
                    className="input-base"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Building2 className="w-4 h-4 inline mr-1 text-gray-400" />
                    所在公司 / 工作室
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="请输入公司或工作室名称"
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  擅长风格（可多选，至少选择1项）*
                </label>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedSpecialties.includes(s)
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:border-gray-300 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一步
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  代表作品集（至少上传3个作品）*
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
                    >
                      <button
                        onClick={() => handleRemovePortfolio(item.id)}
                        className="absolute top-2 right-2 z-10 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="aspect-[4/3] bg-gray-100">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3 space-y-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updatePortfolioItem(item.id, 'title', e.target.value)}
                          placeholder="作品标题"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updatePortfolioItem(item.id, 'description', e.target.value)}
                          placeholder="作品简介"
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <label className="aspect-[4/3] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors cursor-pointer bg-gray-50">
                    <Upload className="w-10 h-10 mb-2" />
                    <span className="text-sm font-medium">上传作品</span>
                    <span className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePortfolioUpload}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  已上传 <span className="font-semibold text-primary">{portfolio.length}</span> / 至少 3 个作品
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  作品集整体简介
                </label>
                <textarea
                  value={formData.portfolioDesc}
                  onChange={(e) => setFormData({ ...formData, portfolioDesc: e.target.value })}
                  placeholder="介绍一下你的设计理念、擅长领域、代表作品特点等"
                  rows={4}
                  className="input-base resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">提交后将进入审核</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    平台将在1-3个工作日内完成审核，审核结果将通过短信通知您。
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:border-gray-300 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || portfolio.length < 3}
                  className="px-8 py-3 bg-gradient-to-r from-accent to-accent-600 text-white font-medium rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? '提交中...' : '提交申请'}
                  {!loading && <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
