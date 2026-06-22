import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { diaryApi, moderationApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { ConstructionStage, HouseType } from '../types';
import { CONSTRUCTION_STAGE_LABELS, HOUSE_TYPE_LABELS, STAGE_ORDER, DECORATION_STYLES, COMMON_MATERIALS, BUDGET_CATEGORIES } from '../utils/constants';

export default function CreateDiaryPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    houseType: 'apartment' as HouseType,
    houseArea: 90,
    constructionStage: 'planning' as ConstructionStage,
    address: { city: '', district: '' },
    totalBudget: 200000,
    styleTags: [] as string[],
    materialTags: [] as string[]
  });
  const [budgetItems, setBudgetItems] = useState([
    { category: '设计费', description: '全屋设计方案', estimatedAmount: 15000 },
    { category: '水电工程', description: '水电材料及人工', estimatedAmount: 25000 },
  ]);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [floorPlanImage, setFloorPlanImage] = useState<File | null>(null);
  const [floorPlanPreview, setFloorPlanPreview] = useState<string>('');
  const [sketchupFile, setSketchupFile] = useState<File | null>(null);
  const [floorPlanMeta, setFloorPlanMeta] = useState({ area: 90, rooms: 2, bathrooms: 1, floors: 1 });

  if (!token) {
    return (
      <div className="card p-12 text-center">
        <p className="text-5xl mb-3">🔒</p>
        <p className="text-gray-500 mb-4">请先登录后发布装修日记</p>
        <button onClick={() => navigate('/auth/login')} className="btn-primary">去登录</button>
      </div>
    );
  }

  const updateForm = <K extends keyof typeof form>(key: K, val: typeof form[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  const handleImagesSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFloorPlanSelect = (file: File | null) => {
    setFloorPlanImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFloorPlanPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addBudgetItem = () => {
    setBudgetItems(prev => [...prev, { category: '其他', description: '', estimatedAmount: 0 }]);
  };

  const updateBudgetItem = (idx: number, key: string, val: any) => {
    setBudgetItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };

  const removeBudgetItem = (idx: number) => {
    setBudgetItems(prev => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const titleRes: any = await moderationApi.checkContent(form.title, 'diary');
      if (titleRes?.data?.action === 'blocked') {
        alert('标题包含违规内容，请修改');
        setSubmitting(false);
        return;
      }
      const descRes: any = await moderationApi.checkContent(form.description, 'diary');
      if (descRes?.data?.action === 'blocked') {
        alert('描述包含违规内容，请修改');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('houseType', form.houseType);
      formData.append('houseArea', String(form.houseArea));
      formData.append('constructionStage', form.constructionStage);
      formData.append('address', JSON.stringify(form.address));
      formData.append('styleTags', JSON.stringify(form.styleTags));
      formData.append('materialTags', JSON.stringify(form.materialTags));
      formData.append('budget', JSON.stringify({
        totalEstimated: form.totalBudget,
        totalActual: 0,
        items: budgetItems
      }));
      formData.append('floorPlanMetadata', JSON.stringify(floorPlanMeta));

      images.forEach(f => formData.append('images', f));
      if (floorPlanImage) formData.append('floorPlanImage', floorPlanImage);
      if (sketchupFile) formData.append('sketchupFile', sketchupFile);

      const res: any = await diaryApi.create(formData);
      if (res?.success) {
        alert('发布成功！');
        navigate(`/diaries/${res.data._id}`);
      }
    } catch (e: any) {
      alert(e.message || '发布失败');
    } finally { setSubmitting(false); }
  };

  const steps = [
    { num: 1, label: '基本信息' },
    { num: 2, label: '上传图片' },
    { num: 3, label: '户型图' },
    { num: 4, label: '预算设置' },
    { num: 5, label: '风格标签' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">发布装修日记</h1>
        <p className="text-gray-500 text-sm mt-1">记录您的装修过程，帮助更多业主</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm ${step >= s.num ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {s.num}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= s.num ? 'text-primary-700' : 'text-gray-400'} hidden sm:block`}>{s.label}</span>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${step > s.num ? 'bg-primary-400' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日记标题 *</label>
              <input value={form.title} onChange={e => updateForm('title', e.target.value)} className="input" placeholder="给您的装修日记起一个标题" maxLength={100} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">装修描述 *</label>
              <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} className="input min-h-[150px]" placeholder="介绍一下您的项目背景、需求、设计理念等..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">房屋类型 *</label>
                <select value={form.houseType} onChange={e => updateForm('houseType', e.target.value as HouseType)} className="input">
                  {Object.entries(HOUSE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">建筑面积 (㎡) *</label>
                <input type="number" value={form.houseArea} onChange={e => updateForm('houseArea', Number(e.target.value))} className="input" min={1} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前施工阶段 *</label>
              <div className="grid grid-cols-4 gap-2">
                {STAGE_ORDER.map(stage => {
                  const info = CONSTRUCTION_STAGE_LABELS[stage];
                  return (
                    <button key={stage} type="button" onClick={() => updateForm('constructionStage', stage)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${form.constructionStage === stage ? `border-primary-600 ${info.bg}` : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className={`text-sm font-semibold ${form.constructionStage === stage ? info.color : 'text-gray-700'}`}>{info.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                <input value={form.address.city} onChange={e => setForm(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))} className="input" placeholder="如：北京市" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行政区</label>
                <input value={form.address.district} onChange={e => setForm(prev => ({ ...prev, address: { ...prev.address, district: e.target.value } }))} className="input" placeholder="如：朝阳区" />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setStep(2)} disabled={!form.title || !form.description} className="btn-primary">下一步</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">装修图片 * <span className="text-gray-400 font-normal">(至少1张，最多30张)</span></label>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden relative group border border-gray-200">
                    <img src={src} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">×</button>
                  </div>
                ))}
                <label className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${imagePreviews.length >= 30 ? 'opacity-50 cursor-not-allowed border-gray-200' : 'hover:border-primary-500 hover:bg-primary-50/30 border-gray-300'}`}>
                  <div className="text-center text-gray-500">
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <p className="text-xs">添加图片</p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" disabled={imagePreviews.length >= 30} onChange={e => handleImagesSelect(e.target.files)} />
                </label>
              </div>
              {imagePreviews.length === 0 && <p className="text-xs text-red-500 mt-2">请至少上传1张图片</p>}
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="btn-outline">上一步</button>
              <button onClick={() => setStep(3)} disabled={imagePreviews.length === 0} className="btn-primary">下一步</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">户型图</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">户型图图片</p>
                  {floorPlanPreview ? (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 relative">
                      <img src={floorPlanPreview} className="w-full h-full object-cover" />
                      <button onClick={() => handleFloorPlanSelect(null)} className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-red-500 text-white text-xs">移除</button>
                    </div>
                  ) : (
                    <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/30 transition-all">
                      <span className="text-4xl mb-2">🗺️</span>
                      <p className="text-sm text-gray-600">点击上传户型图</p>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleFloorPlanSelect(e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">SketchUp 源文件 (.skp)</p>
                    <label className="block p-4 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-50/30 transition-all text-center">
                      <span className="text-2xl">📐</span>
                      <p className="text-sm font-medium text-gray-700 mt-1">{sketchupFile ? sketchupFile.name : '上传 SketchUp 模型'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">支持 .skp 格式</p>
                      <input type="file" accept=".skp" className="hidden" onChange={e => setSketchupFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">户型信息（用于AI匹配）</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-gray-500">面积㎡</label><input type="number" value={floorPlanMeta.area} onChange={e => setFloorPlanMeta(p => ({ ...p, area: Number(e.target.value) }))} className="input" /></div>
                      <div><label className="text-xs text-gray-500">卧室</label><input type="number" value={floorPlanMeta.rooms} onChange={e => setFloorPlanMeta(p => ({ ...p, rooms: Number(e.target.value) }))} className="input" /></div>
                      <div><label className="text-xs text-gray-500">卫生间</label><input type="number" value={floorPlanMeta.bathrooms} onChange={e => setFloorPlanMeta(p => ({ ...p, bathrooms: Number(e.target.value) }))} className="input" /></div>
                      <div><label className="text-xs text-gray-500">楼层</label><input type="number" value={floorPlanMeta.floors} onChange={e => setFloorPlanMeta(p => ({ ...p, floors: Number(e.target.value) }))} className="input" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="btn-outline">上一步</button>
              <button onClick={() => setStep(4)} className="btn-primary">下一步</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总预算 (元)</label>
              <input type="number" value={form.totalBudget} onChange={e => updateForm('totalBudget', Number(e.target.value))} className="input" min={0} step={1000} />
              <p className="text-xs text-gray-400 mt-1">已填写分项合计：¥ {budgetItems.reduce((s, i) => s + i.estimatedAmount, 0).toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">预算分项</label>
                <button onClick={addBudgetItem} className="btn-ghost !py-1 text-sm text-primary-700">+ 添加项</button>
              </div>
              <div className="space-y-2">
                {budgetItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <select value={item.category} onChange={e => updateBudgetItem(idx, 'category', e.target.value)} className="input !w-28 shrink-0">
                      {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input value={item.description} onChange={e => updateBudgetItem(idx, 'description', e.target.value)} className="input flex-1" placeholder="项目说明" />
                    <input type="number" value={item.estimatedAmount} onChange={e => updateBudgetItem(idx, 'estimatedAmount', Number(e.target.value))} className="input !w-32" placeholder="金额" />
                    <button onClick={() => removeBudgetItem(idx)} className="w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 shrink-0">×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(3)} className="btn-outline">上一步</button>
              <button onClick={() => setStep(5)} className="btn-primary">下一步</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">装修风格</label>
              <div className="flex flex-wrap gap-2">
                {DECORATION_STYLES.map(s => (
                  <button key={s} type="button" onClick={() => updateForm('styleTags', toggleArrayItem(form.styleTags, s))} className={`tag ${form.styleTags.includes(s) ? 'tag-active' : ''}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">使用材质</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_MATERIALS.map(m => (
                  <button key={m} type="button" onClick={() => updateForm('materialTags', toggleArrayItem(form.materialTags, m))} className={`tag ${form.materialTags.includes(m) ? 'tag-active' : ''}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm font-medium text-amber-800 mb-2">📝 发布前请注意</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc pl-5">
                <li>禁止发布非标准报价话术（如"一口价XX元全包"等）</li>
                <li>禁止包含联系方式、外链等广告信息</li>
                <li>内容将经过智能审核，违规内容会被拦截或屏蔽</li>
              </ul>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(4)} className="btn-outline">上一步</button>
              <button onClick={submit} disabled={submitting} className="btn-accent px-8">
                {submitting ? '发布中...' : '🚀 发布日记'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
