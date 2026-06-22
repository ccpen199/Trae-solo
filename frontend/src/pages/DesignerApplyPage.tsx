import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { designerApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function DesignerApplyPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    serviceAreas: [] as string[],
    newArea: '',
    licenseNumber: user?.qualifications?.licenseNumber || '',
    bio: user?.bio || '',
    portfolioTitle: '',
    portfolioDesc: '',
    portfolioStyle: '',
    budgetMin: 100000,
    budgetMax: 500000,
  });
  const [certImages, setCertImages] = useState<File[]>([]);
  const [certPreviews, setCertPreviews] = useState<string[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);

  const addArea = () => {
    if (form.newArea.trim() && !form.serviceAreas.includes(form.newArea.trim())) {
      setForm(p => ({ ...p, serviceAreas: [...p.serviceAreas, p.newArea.trim()], newArea: '' }));
    }
  };
  const removeArea = (area: string) => setForm(p => ({ ...p, serviceAreas: p.serviceAreas.filter(a => a !== area) }));

  const handleCertSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setCertImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setCertPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handlePortfolioSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setPortfolioImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPortfolioPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const submit = async () => {
    if (form.serviceAreas.length === 0) { alert('请至少添加一个服务区域'); return; }
    if (!form.bio.trim()) { alert('请填写个人简介'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('serviceAreas', JSON.stringify(form.serviceAreas));
      formData.append('licenseNumber', form.licenseNumber);
      formData.append('bio', form.bio);
      formData.append('portfolio', JSON.stringify([{
        title: form.portfolioTitle || '作品集',
        description: form.portfolioDesc || form.bio,
        style: form.portfolioStyle || undefined,
        budgetRange: { min: form.budgetMin, max: form.budgetMax }
      }]));
      certImages.forEach(f => formData.append('certificationImages', f));
      portfolioImages.forEach(f => formData.append('portfolioImages', f));

      const res: any = await designerApi.apply(formData);
      if (res?.success) {
        alert('设计师入驻申请已提交！平台将在3个工作日内完成审核');
        navigate('/profile');
      }
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎨 设计师入驻申请</h1>
        <p className="text-gray-500 text-sm mt-1">提交您的资质信息，通过审核后即可接单</p>
      </div>

      {user?.role === 'designer' && (
        <div className={`p-4 rounded-xl border ${user.designerStatus === 'approved' ? 'bg-accent-50 border-accent-200' : user.designerStatus === 'pending' ? 'bg-amber-50 border-amber-200' : user.designerStatus === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          {user.designerStatus === 'approved' && <p className="text-accent-700 font-medium">✓ 您已通过设计师认证，可以接单了！</p>}
          {user.designerStatus === 'pending' && <p className="text-amber-700">⏳ 您的入驻申请正在审核中...</p>}
          {user.designerStatus === 'rejected' && <p className="text-red-700">❌ 申请未通过，请重新提交更完整的资料</p>}
          {user.designerStatus === 'suspended' && <p className="text-red-700">⚠️ 您的设计师账号已被暂停</p>}
        </div>
      )}

      <div className="card p-6 space-y-6">
        <section>
          <h2 className="text-lg font-bold mb-4">📍 服务区域</h2>
          <div className="flex gap-2 mb-3">
            <input value={form.newArea} onChange={e => setForm(p => ({ ...p, newArea: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())} className="input flex-1" placeholder="如：北京市" />
            <button onClick={addArea} type="button" className="btn-outline">添加</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.serviceAreas.map(area => (
              <span key={area} className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm">
                📍 {area}
                <button onClick={() => removeArea(area)} className="ml-2 text-primary-400 hover:text-primary-700">×</button>
              </span>
            ))}
            {form.serviceAreas.length === 0 && <p className="text-sm text-gray-400">请添加您可以服务的城市/区域</p>}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">📜 资质信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">执业资格证编号</label>
              <input value={form.licenseNumber} onChange={e => setForm(p => ({ ...p, licenseNumber: e.target.value }))} className="input" placeholder="如：ZHC2024001234" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">资质证书/获奖证明照片</label>
              <div className="grid grid-cols-4 gap-2">
                {certPreviews.map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden relative border border-gray-200">
                    <img src={src} className="w-full h-full object-cover" />
                    <button onClick={() => { setCertImages(p => p.filter((_, j) => j !== i)); setCertPreviews(p => p.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs">×</button>
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-all">
                  <span className="text-2xl text-gray-400">+</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleCertSelect(e.target.files)} />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">👤 个人信息</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="input min-h-[120px]" placeholder="介绍您的设计理念、擅长领域、从业经历等..." />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">🎨 代表作品</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作品名称</label>
                <input value={form.portfolioTitle} onChange={e => setForm(p => ({ ...p, portfolioTitle: e.target.value }))} className="input" placeholder="如：北欧极简三居室" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">擅长风格</label>
                <input value={form.portfolioStyle} onChange={e => setForm(p => ({ ...p, portfolioStyle: e.target.value }))} className="input" placeholder="如：现代简约" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
              <textarea value={form.portfolioDesc} onChange={e => setForm(p => ({ ...p, portfolioDesc: e.target.value }))} className="input min-h-[80px]" placeholder="项目背景、设计思路、亮点等..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预算区间(元)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.budgetMin} onChange={e => setForm(p => ({ ...p, budgetMin: Number(e.target.value) }))} className="input" />
                  <span className="text-gray-500">-</span>
                  <input type="number" value={form.budgetMax} onChange={e => setForm(p => ({ ...p, budgetMax: Number(e.target.value) }))} className="input" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作品图片</label>
              <div className="grid grid-cols-5 gap-2">
                {portfolioPreviews.map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden relative border border-gray-200">
                    <img src={src} className="w-full h-full object-cover" />
                    <button onClick={() => { setPortfolioImages(p => p.filter((_, j) => j !== i)); setPortfolioPreviews(p => p.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs">×</button>
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-all">
                  <span className="text-2xl text-gray-400">+</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePortfolioSelect(e.target.files)} />
                </label>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
          <button onClick={() => navigate(-1)} className="btn-outline">取消</button>
          <button onClick={submit} disabled={submitting} className="btn-primary px-8">
            {submitting ? '提交中...' : '提交入驻申请'}
          </button>
        </div>
      </div>
    </div>
  );
}
