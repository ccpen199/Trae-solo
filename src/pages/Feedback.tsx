import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, AlertCircle, Upload, MapPin, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { feedbackApi } from '@/services/api';
import { FeedbackRequest } from '../../../shared/types';

const steps = ['物品信息', '类别选择', '补充说明', '所在区域'];
const districts = ['浦东新区', '黄浦区', '徐汇区', '静安区', '长宁区'];
const streetsByDistrict: Record<string, string[]> = {
  '浦东新区': ['陆家嘴街道', '张江镇', '金桥开发区'],
  '黄浦区': ['南京东路街道', '豫园街道'],
  '徐汇区': ['徐家汇街道', '枫林路街道'],
  '静安区': ['南京西路街道', '静安寺街道'],
  '长宁区': ['新华路街道', '天山路街道'],
};

export default function Feedback() {
  const navigate = useNavigate();
  const { categories, currentCity } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [itemName, setItemName] = useState('');
  const [misjudgedCategoryId, setMisjudgedCategoryId] = useState('');
  const [correctCategoryId, setCorrectCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return itemName.trim().length > 0;
      case 1: return misjudgedCategoryId && correctCategoryId;
      case 2: return true;
      case 3: return district && street;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else handleSubmit();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else navigate(-1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImageUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data: FeedbackRequest = {
        itemName: itemName.trim(),
        misjudgedCategoryId,
        correctCategoryId,
        description: description.trim() || undefined,
        imageUrl: imageUrl || undefined,
        district,
        street,
        userAgent: navigator.userAgent,
      };
      if (currentCity) (data as any).cityId = currentCity.id;
      await feedbackApi.submit(data);
      setIsSuccess(true);
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CategoryTag = ({ categoryId, selected, onClick }: { categoryId: string; selected: boolean; onClick: () => void }) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
          selected ? 'ring-2 ring-offset-2 scale-105 shadow-lg' : 'bg-gray-100 hover:bg-gray-200'
        }`}
        style={{
          backgroundColor: selected ? category.color : undefined,
          color: selected ? 'white' : undefined,
          ringColor: selected ? category.color : undefined,
        }}
      >
        <span className="text-xl">{category.icon}</span>
        <span className="font-medium">{category.name}</span>
        {selected && <Check className="w-4 h-4 ml-auto" />}
      </button>
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">提交成功！</h2>
          <p className="text-gray-500 mb-8">感谢您的反馈，我们会尽快处理</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handlePrev} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">错误反馈</h1>
        </div>

        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`text-xs mt-2 ${index === currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mx-2 rounded transition-all ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">请输入识别错误的物品名称，帮助我们改进识别准确率</p>
              </div>
              <label className="block">
                <span className="text-gray-700 font-medium">物品名称</span>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="例如：矿泉水瓶、大骨头..."
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </label>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-3">误判类别（系统识别为）</label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <CategoryTag key={cat.id} categoryId={cat.id} selected={misjudgedCategoryId === cat.id} onClick={() => setMisjudgedCategoryId(cat.id)} />
                  ))}
                </div>
              </div>
              <div className="border-t pt-6">
                <label className="block text-gray-700 font-medium mb-3">正确类别</label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <CategoryTag key={cat.id} categoryId={cat.id} selected={correctCategoryId === cat.id} onClick={() => setCorrectCategoryId(cat.id)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <label className="block">
                <span className="text-gray-700 font-medium">补充说明（选填）</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请描述具体情况，帮助我们更好地理解问题..."
                  rows={4}
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </label>
              <div>
                <span className="text-gray-700 font-medium mb-3 block">上传图片（选填）</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="上传图片" className="w-full h-48 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all"
                  >
                    <Upload className="w-8 h-8" />
                    <span>点击上传图片</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-xl">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">选择您所在的区域，帮助我们统计各区域的误判情况</p>
              </div>
              <label className="block">
                <span className="text-gray-700 font-medium">所在区</span>
                <select
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setStreet(''); }}
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">请选择区</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-gray-700 font-medium">所在街道</span>
                <select
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={!district}
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">请选择街道</option>
                  {district && streetsByDistrict[district]?.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handlePrev}
            className="flex-1 py-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            {currentStep === 0 ? '取消' : '上一步'}
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">提交中...</span>
            ) : currentStep === steps.length - 1 ? (
              '提交反馈'
            ) : (
              <>下一步<ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
