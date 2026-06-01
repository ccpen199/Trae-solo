import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Upload, Clock, CheckCircle2, Circle,
  FileText, Phone, Loader2, Info, ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const APPEAL_REASONS = [
  { value: 'fake', label: '虚假房源' },
  { value: 'price_anomaly', label: '价格异常' },
  { value: 'info_expired', label: '信息过期' },
  { value: 'image_fake', label: '图片不实' },
  { value: 'property_dispute', label: '产权纠纷' },
  { value: 'other', label: '其他' },
];

const Appeal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    property_id: '',
    reason: '',
    description: '',
    contact: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.properties.appeal(form.property_id, {
      reason: form.reason,
      description: form.description,
      contact: form.contact,
    });
    setLoading(false);
    if (res.success) {
      setSubmitted(true);
    }
  };

  if (!user) return null;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">申诉提交成功！</h2>
        <p className="text-gray-500 mb-8">我们将在3个工作日内审核您的申诉，请耐心等待</p>
        <button
          onClick={() => navigate('/properties')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回房源列表
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <AlertCircle className="text-orange-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">下架申诉</h1>
          <p className="text-gray-500">对房源下架决定提出申诉</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">申诉提交</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">房源ID</label>
              <input
                required
                value={form.property_id}
                onChange={(e) => updateForm('property_id', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入房源ID或URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申诉原因</label>
              <select
                required
                value={form.reason}
                onChange={(e) => updateForm('reason', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择申诉原因</option>
                {APPEAL_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请详细描述您的申诉理由"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">证据上传</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-2" size={28} />
                <p className="text-sm text-gray-500">点击或拖拽上传证据材料</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、PDF 格式</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  value={form.contact}
                  onChange={(e) => updateForm('contact', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="手机号或邮箱"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> 提交中...
                </>
              ) : (
                <>
                  <FileText size={18} /> 提交申诉
                </>
              )}
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" /> 申诉进度追踪
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <Circle size={12} className="fill-green-500 text-green-500 mt-1" />
                  <div className="w-0.5 h-10 bg-gray-200" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">已提交</p>
                  <p className="text-xs text-gray-400">申诉已成功提交，等待审核</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <Circle size={12} className="fill-gray-300 text-gray-300 mt-1" />
                  <div className="w-0.5 h-10 bg-gray-200" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">审核中</p>
                  <p className="text-xs text-gray-400">平台工作人员正在审核您的申诉</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <CheckCircle2 size={14} className="text-gray-300 mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">已处理</p>
                  <p className="text-xs text-gray-400">申诉已处理完毕，结果将通过联系方式通知</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-500" /> 申诉须知
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">处理时效</h4>
                <p>申诉提交后，我们将在 <span className="text-blue-600 font-medium">3个工作日</span> 内完成审核并反馈结果。复杂情况可能延长至7个工作日。</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">申诉条件</h4>
                <ul className="space-y-1.5 list-none">
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>房源信息真实有效，可提供相应证明</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>价格合理，符合市场行情</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>图片为真实拍摄，非网络盗图</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>产权清晰，无纠纷争议</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">注意事项</h4>
                <ul className="space-y-1.5 list-none">
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>请确保申诉内容真实准确</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>恶意申诉可能影响账号信用</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>同一房源仅可申诉一次</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appeal;
