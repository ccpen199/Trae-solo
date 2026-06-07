import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '@/stores/orderStore';
import { Stethoscope, Heart, Clock, MapPin, FileText, Check } from 'lucide-react';

const services = [
  { id: 1, name: '基础护理', price: 198, duration: '2小时', icon: Heart, desc: '生命体征监测、日常护理' },
  { id: 2, name: '专科护理', price: 298, duration: '2小时', icon: Stethoscope, desc: '伤口换药、导管护理等' },
  { id: 3, name: '康复护理', price: 268, duration: '1.5小时', icon: Clock, desc: '康复训练指导、功能锻炼' },
  { id: 4, name: '母婴护理', price: 358, duration: '3小时', icon: Heart, desc: '产后护理、新生儿护理' },
];

export default function BookService() {
  const navigate = useNavigate();
  const { createOrder } = useOrderStore();
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    scheduled_time: '',
    address: '',
    notes: '',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setLoading(true);
    try {
      await createOrder({
        service_id: selectedService,
        scheduled_time: form.scheduled_time,
        address: form.address,
        notes: form.notes,
      });
      navigate('/family/orders');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">预约服务</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-4">选择服务</h2>
          <div className="grid grid-cols-2 gap-3">
            {services.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => setSelectedService(svc.id)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedService === svc.id
                    ? 'border-[#0F6CBD] bg-[#E0F2FE]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <svc.icon className={`w-6 h-6 ${selectedService === svc.id ? 'text-[#0F6CBD]' : 'text-gray-400'}`} />
                  {selectedService === svc.id && <Check className="w-5 h-5 text-[#0F6CBD]" />}
                </div>
                <h3 className="font-semibold text-[#1E293B] mt-2">{svc.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{svc.desc}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[#0F6CBD] font-bold">¥{svc.price}</span>
                  <span className="text-xs text-gray-400">{svc.duration}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-4">预约信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
              <input
                type="datetime-local"
                value={form.scheduled_time}
                onChange={(e) => update('scheduled_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务地址</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                  placeholder="请输入服务地址"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] resize-none"
                  placeholder="请输入特殊需求或注意事项"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedService || loading}
          className="w-full bg-[#0F6CBD] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0D5DA8] disabled:opacity-50 transition-colors"
        >
          {loading ? '提交中...' : '确认预约'}
        </button>
      </form>
    </div>
  );
}
