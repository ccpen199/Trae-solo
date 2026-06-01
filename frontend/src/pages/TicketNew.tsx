import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, User, Phone, MapPin, FileText, AlertCircle, Upload } from 'lucide-react';
import { api, serviceTypes, terminals, priorityMap } from '@/lib/api';

export default function TicketNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [form, setForm] = useState({
    flightId: '',
    passengerName: '',
    passengerPhone: '',
    passengerIdCard: '',
    terminal: '',
    area: '',
    seatNo: '',
    serviceType: '',
    serviceCategory: '',
    priority: 'normal',
    description: '',
  });
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    loadFlights();
  }, []);

  async function loadFlights() {
    try {
      const res = await api.flights();
      setFlights(res.data);
    } catch (e) {
      console.error('Load flights failed:', e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.passengerName || !form.passengerPhone || !form.terminal || !form.area || !form.serviceType || !form.description) {
      alert('请填写必填项');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createTicket(form);
      if (res.success && files && files.length > 0) {
        await api.uploadAttachment(res.data.ticketId, files, 'u-cs-1', '客服');
      }
      alert(res.success ? '工单创建成功' : '创建失败');
      if (res.success) {
        navigate(`/tickets/${res.data.ticketId}`);
      }
    } catch (e: any) {
      alert(e.message || '创建失败');
    } finally {
      setLoading(false);
    }
  }

  const selectedFlight = flights.find(f => f.id === form.flightId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">创建工单</h2>
          <p className="text-sm text-slate-500 mt-1">录入旅客服务请求信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-600" />
            航班信息
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">关联航班</label>
              <select
                value={form.flightId}
                onChange={e => {
                  setForm({ ...form, flightId: e.target.value });
                  const f = flights.find(x => x.id === e.target.value);
                  if (f) {
                    setForm(prev => ({ ...prev, terminal: f.terminal, area: f.gate }));
                  }
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">无航班</option>
                {flights.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.flightNo} - {f.airline} ({f.terminal}-{f.gate})
                  </option>
                ))}
              </select>
              {selectedFlight && (
                <p className="text-xs text-slate-500 mt-1">
                  {selectedFlight.airline} · {new Date(selectedFlight.departureTime).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">座位号</label>
              <input
                type="text"
                value={form.seatNo}
                onChange={e => setForm({ ...form, seatNo: e.target.value })}
                placeholder="例如：32A"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            旅客信息
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                旅客姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.passengerName}
                onChange={e => setForm({ ...form, passengerName: e.target.value })}
                placeholder="请输入姓名"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                联系电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.passengerPhone}
                onChange={e => setForm({ ...form, passengerPhone: e.target.value })}
                placeholder="请输入手机号"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">证件号</label>
              <input
                type="text"
                value={form.passengerIdCard}
                onChange={e => setForm({ ...form, passengerIdCard: e.target.value })}
                placeholder="身份证/护照号"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            位置信息
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                航站楼 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.terminal}
                onChange={e => setForm({ ...form, terminal: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">请选择</option>
                {terminals.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                具体区域 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.area}
                onChange={e => setForm({ ...form, area: e.target.value })}
                placeholder="例如：C12登机口、行李提取处等"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            服务信息
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                服务类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.serviceType}
                onChange={e => setForm({ ...form, serviceType: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">请选择</option>
                {serviceTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">服务分类</label>
              <input
                type="text"
                value={form.serviceCategory}
                onChange={e => setForm({ ...form, serviceCategory: e.target.value })}
                placeholder="例如：特殊旅客、行李服务等"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                紧急程度 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {Object.entries(priorityMap).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              问题描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="请详细描述旅客的问题或需求..."
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-slate-600" />
            附件上传
          </h3>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              multiple
              onChange={e => setFiles(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">点击或拖拽文件到此处上传</p>
              <p className="text-xs text-slate-400 mt-1">支持图片、PDF等，最多10个文件</p>
              {files && files.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">已选择 {files.length} 个文件</p>
              )}
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? '提交中...' : '创建工单'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Plane(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  );
}
