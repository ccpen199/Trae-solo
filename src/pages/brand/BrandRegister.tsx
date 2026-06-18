import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Upload, CheckCircle2, FileText, Phone, User, Mail, MapPin } from 'lucide-react';

const categories = [
  { code: 'consumer', name: '消费品牌' },
  { code: 'education', name: '教育服务' },
  { code: 'medical', name: '医疗健康' },
  { code: 'travel', name: '旅游出行' },
];

export function BrandRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    brandName: '',
    category: '',
    businessLicense: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.brandName.trim()) newErrors.brandName = '请输入品牌名称';
    if (!formData.category) newErrors.category = '请选择所属领域';
    if (!formData.businessLicense) newErrors.businessLicense = '请上传营业执照';
    if (!formData.contactName.trim()) newErrors.contactName = '请输入联系人姓名';
    if (!formData.contactPhone.trim()) newErrors.contactPhone = '请输入联系电话';
    if (!formData.contactEmail.trim()) newErrors.contactEmail = '请输入联系邮箱';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="card p-12 max-w-lg w-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">申请提交成功</h2>
            <p className="text-slate-400 mb-6">
              您的品牌入驻申请已提交，我们将在3-5个工作日内完成审核。
              审核结果将通过邮件和短信通知您。
            </p>
            <div className="bg-surface-light rounded-md p-4 mb-6 text-left">
              <div className="text-sm text-slate-400 mb-2">申请信息</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">品牌名称</span>
                  <span className="text-white">{formData.brandName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">所属领域</span>
                  <span className="text-white">{categories.find(c => c.code === formData.category)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">联系人</span>
                  <span className="text-white">{formData.contactName}</span>
                </div>
              </div>
            </div>
            <button onClick={() => navigate('/brand')} className="btn btn-primary w-full">
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-serif font-bold text-white mb-2 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              品牌入驻申请
            </h1>
            <p className="text-slate-400 text-sm">填写以下信息完成品牌入驻申请，审核通过后即可使用品牌管理功能</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-5">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4 pb-2 border-b border-slate-700/50">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">
                    <FileText className="w-4 h-4 mr-1 inline" />
                    品牌名称
                  </label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    placeholder="请输入品牌名称"
                    className={`input ${errors.brandName ? 'border-danger' : ''}`}
                  />
                  {errors.brandName && <p className="text-xs text-danger mt-1">{errors.brandName}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">所属领域</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`input ${errors.category ? 'border-danger' : ''}`}
                  >
                    <option value="">请选择所属领域</option>
                    {categories.map((cat) => (
                      <option key={cat.code} value={cat.code}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-danger mt-1">{errors.category}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">品牌简介</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="请简要介绍您的品牌（选填）"
                    rows={3}
                    className="input resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Business License */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4 pb-2 border-b border-slate-700/50">资质文件</h3>
              <div>
                <label className="label">营业执照</label>
                <div className={`border-2 border-dashed rounded-md p-6 text-center transition-all cursor-pointer hover:border-primary/50 ${
                  errors.businessLicense ? 'border-danger' : 'border-border'
                }`}>
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">点击或拖拽上传营业执照</p>
                  <p className="text-xs text-slate-600 mt-1">支持 JPG、PNG 格式，大小不超过 5MB</p>
                  {formData.businessLicense && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 text-primary text-sm border border-primary/30">
                      <FileText className="w-4 h-4" />
                      已上传：营业执照.pdf
                    </div>
                  )}
                  <input
                    type="hidden"
                    name="businessLicense"
                    value={formData.businessLicense}
                    onChange={(e) => handleChange(e as any)}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, businessLicense: 'uploaded' }))}
                    className="mt-3 btn btn-outline text-sm"
                  >
                    模拟上传
                  </button>
                </div>
                {errors.businessLicense && <p className="text-xs text-danger mt-1">{errors.businessLicense}</p>}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4 pb-2 border-b border-slate-700/50">联系方式</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <User className="w-4 h-4 mr-1 inline" />
                    联系人姓名
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="请输入联系人姓名"
                    className={`input ${errors.contactName ? 'border-danger' : ''}`}
                  />
                  {errors.contactName && <p className="text-xs text-danger mt-1">{errors.contactName}</p>}
                </div>

                <div>
                  <label className="label">
                    <Phone className="w-4 h-4 mr-1 inline" />
                    联系电话
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="请输入联系电话"
                    className={`input ${errors.contactPhone ? 'border-danger' : ''}`}
                  />
                  {errors.contactPhone && <p className="text-xs text-danger mt-1">{errors.contactPhone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    <Mail className="w-4 h-4 mr-1 inline" />
                    联系邮箱
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="请输入联系邮箱"
                    className={`input ${errors.contactEmail ? 'border-danger' : ''}`}
                  />
                  {errors.contactEmail && <p className="text-xs text-danger mt-1">{errors.contactEmail}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    <MapPin className="w-4 h-4 mr-1 inline" />
                    公司地址
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="请输入公司详细地址（选填）"
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="btn btn-outline flex-1">
                取消
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                提交申请
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BrandRegister;
