import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  ChevronRight,
  Upload,
  MapPin,
  Phone,
  User,
  FileText,
  Send,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  '城市管理',
  '社会保障',
  '民政服务',
  '环境保护',
  '政务咨询',
  '交通出行',
  '教育服务',
  '医疗健康',
  '其他',
];

const priorities = [
  { key: 'low', label: '低', desc: '非紧急问题，可按常规流程处理' },
  { key: 'normal', label: '普通', desc: '一般诉求，按正常流程处理' },
  { key: 'high', label: '高', desc: '较紧急问题，需要尽快处理' },
  { key: 'urgent', label: '紧急', desc: '涉及安全或重大影响，需立即处理' },
];

export default function WorkOrderSubmit() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    category: '',
    priority: 'normal',
    description: '',
    name: '',
    phone: '',
    address: '',
    anonymous: false,
  });
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 6 - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((imgs) => [...imgs, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.description) return;
    setSubmitting(true);
    try {
      await fetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => navigate('/workorders'), 2500);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="card max-w-lg mx-auto p-10 text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-3">提交成功</h2>
          <p className="text-gray-500 mb-6">
            您的诉求已成功提交，我们将尽快受理并处理。<br />
            您可以在工单中心查看处理进度。
          </p>
          <p className="text-sm text-gov-600 font-medium">正在跳转到工单中心...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/workorders" className="hover:text-gov-600 transition-colors">工单中心</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">提交诉求</span>
      </nav>

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-gov-600" />
          提交诉求
        </h1>
        <p className="section-subtitle">请详细描述您遇到的问题，我们会尽快为您处理</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="card p-6 md:p-8 mb-6">
          <h2 className="font-serif text-lg font-bold text-gov-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gov-600" />
            诉求信息
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                诉求标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="请简要描述您遇到的问题"
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/50</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                诉求分类 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all border',
                      form.category === cat
                        ? 'bg-gov-50 border-gov-300 text-gov-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                紧急程度
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {priorities.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.key as typeof form.priority })}
                    className={cn(
                      'p-3 rounded-xl text-left transition-all border',
                      form.priority === p.key
                        ? 'bg-gov-50 border-gov-300'
                        : 'bg-white border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <p className={cn(
                      'font-semibold text-sm',
                      form.priority === p.key ? 'text-gov-700' : 'text-gray-700',
                      p.key === 'urgent' && 'text-red-600',
                      p.key === 'high' && 'text-warm-600',
                    )}>
                      {p.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                详细描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="请详细描述问题的发生时间、地点、具体情况等，方便我们更准确地处理"
                rows={6}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">上传图片（可选）</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-gov-400 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer bg-gray-50 hover:bg-gov-50/50">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400">上传图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">最多上传6张图片，支持jpg/png格式</p>
            </div>
          </div>
        </div>

        <div className="card p-6 md:p-8 mb-6">
          <h2 className="font-serif text-lg font-bold text-gov-800 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-gov-600" />
            联系方式
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">匿名提交</p>
                <p className="text-xs text-gray-400 mt-0.5">勾选后将不记录您的个人信息</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, anonymous: !form.anonymous })}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors',
                  form.anonymous ? 'bg-gov-500' : 'bg-gray-200',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all',
                    form.anonymous ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </button>
            </div>

            {!form.anonymous && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      姓名
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="请输入您的姓名"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      联系电话 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="请输入联系电话"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    所在地址
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="请输入详细地址（选填）"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Link to="/workorders" className="btn-secondary">
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting || !form.title || !form.category || !form.description}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Upload className="w-5 h-5 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                提交诉求
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
