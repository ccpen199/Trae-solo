import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Truck, CheckCircle, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import CategoryIcon from '@/components/CategoryIcon';
import { useOrderStore } from '@/stores/useOrderStore';
import { TIME_SLOT_TEMPLATES, CATEGORY_LABELS } from '@/utils/constants';

const MOCK_ADDRESSES = [
  { id: '1', name: '张三', phone: '138****1234', address: '北京市朝阳区建国路88号', detail: 'SOHO现代城A座1201', isDefault: true },
  { id: '2', name: '李四', phone: '139****5678', address: '北京市海淀区中关村大街1号', detail: '3号楼502', isDefault: false },
];

function OrderSummary({ estimate, category }: { estimate: Record<string, unknown> | null; category: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h3 className="text-sm font-semibold text-neutral-text mb-3">回收信息</h3>
      <div className="flex items-center gap-3">
        <CategoryIcon category={category} size="md" />
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-text">{CATEGORY_LABELS[category] || category}</p>
          {estimate && (
            <p className="text-xs text-neutral-muted">预估 ¥{String(estimate.minPrice || 50)} - ¥{String(estimate.maxPrice || 200)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressSection({ selected, onSelect }: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [detail, setDetail] = useState('');

  const handleAdd = () => {
    if (!name || !phone || !address) return;
    setShowForm(false);
    setName(''); setPhone(''); setAddress(''); setDetail('');
  };

  const inputCls = 'w-full rounded-xl border border-neutral-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mint-400';

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-text">取件地址</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-sm font-medium text-mint-500 hover:text-forest-700">
          {showForm ? '取消' : '+ 新增地址'}
        </button>
      </div>
      <div className="space-y-3">
        {MOCK_ADDRESSES.map((addr) => (
          <button key={addr.id} onClick={() => onSelect(addr.id)}
            className={`w-full rounded-xl p-4 text-left transition ${
              selected === addr.id ? 'bg-mint-50 ring-1 ring-mint-400' : 'bg-gray-50 hover:bg-gray-100'
            }`}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-mint-500" />
              <span className="text-sm font-medium text-neutral-text">{addr.name}</span>
              <span className="text-sm text-neutral-muted">{addr.phone}</span>
              {addr.isDefault && <span className="rounded bg-forest-50 px-1.5 py-0.5 text-xs text-forest-700">默认</span>}
            </div>
            <p className="mt-1 text-sm text-neutral-muted pl-6">{addr.address} {addr.detail}</p>
          </button>
        ))}
      </div>
      {showForm && (
        <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="收件人姓名" className={inputCls} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号码" className={inputCls} />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="详细地址" className={inputCls} />
          <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="门牌号/楼层（选填）" className={inputCls} />
          <button onClick={handleAdd} className="w-full rounded-xl bg-forest-700 py-2.5 text-sm font-medium text-white hover:bg-forest-800">保存地址</button>
        </div>
      )}
    </div>
  );
}

function TimeSlotSection({ selectedDate, selectedSlot, onDateChange, onSlotChange }: {
  selectedDate: string;
  selectedSlot: string;
  onDateChange: (d: string) => void;
  onSlotChange: (s: string) => void;
}) {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().add(i + 1, 'day');
    return { value: d.format('YYYY-MM-DD'), label: d.format('MM/DD'), weekday: i === 0 ? '明天' : d.format('ddd') };
  });

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h3 className="text-sm font-semibold text-neutral-text mb-3">预约时间</h3>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {dates.map((d) => (
          <button key={d.value} onClick={() => onDateChange(d.value)}
            className={`flex-shrink-0 rounded-xl px-4 py-3 text-center transition ${
              selectedDate === d.value ? 'bg-forest-700 text-white' : 'bg-gray-50 text-neutral-text hover:bg-gray-100'
            }`}>
            <div className="text-xs">{d.weekday}</div>
            <div className="text-sm font-medium">{d.label}</div>
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {TIME_SLOT_TEMPLATES.map((slot) => (
          <button key={slot.value} onClick={() => onSlotChange(slot.value)}
            className={`rounded-xl px-4 py-3 text-sm text-center transition ${
              selectedSlot === slot.value ? 'bg-mint-50 text-forest-700 ring-1 ring-mint-400' : 'bg-gray-50 text-neutral-text hover:bg-gray-100'
            }`}>
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Appointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { estimate?: Record<string, unknown>; category?: string } | null;
  const estimate = state?.estimate || null;
  const category = state?.category || '';
  const { createOrder, loading } = useOrderStore();

  const [addressId, setAddressId] = useState(MOCK_ADDRESSES[0]?.id || '');
  const [date, setDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [slot, setSlot] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async () => {
    if (!addressId || !date || !slot) {
      setToast('请完善预约信息');
      return;
    }
    try {
      await createOrder({ category, addressId, date, timeSlot: slot, estimate });
      setToast('预约成功！');
      setTimeout(() => navigate('/orders'), 1000);
    } catch {
      setToast('预约失败，请重试');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-2xl font-bold text-forest-700">预约取件</h1>
      {category && <OrderSummary estimate={estimate} category={category} />}
      <AddressSection selected={addressId} onSelect={setAddressId} />
      <TimeSlotSection selectedDate={date} selectedSlot={slot} onDateChange={setDate} onSlotChange={setSlot} />
      <div className="rounded-xl bg-mint-50 p-4 flex items-center gap-3">
        <Truck className="h-5 w-5 text-forest-600" />
        <div>
          <p className="text-sm font-medium text-forest-700">系统将自动就近派单</p>
          <div className="mt-1 flex gap-2">
            <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-neutral-text shadow-sm">顺丰</span>
            <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-neutral-text shadow-sm">京东</span>
          </div>
        </div>
      </div>
      <button onClick={handleSubmit} disabled={loading || !addressId || !date || !slot}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
        提交预约
      </button>
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg ${
          toast.includes('成功') ? 'bg-forest-700' : 'bg-red-500'
        }`}>{toast}</div>
      )}
    </div>
  );
}
