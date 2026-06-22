import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  ShoppingBag,
  Package,
  ClipboardList,
  Map as MapIcon,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { CITY_CENTER, haversineDistance } from '../../utils';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import SurgeFeePicker from '../../components/order/SurgeFeePicker';
import type { OrderType, GeoPoint } from '../../types';

const quickTags: Record<OrderType, string[]> = {
  buy: ['星巴克', '奶茶', '药品', '文件', '钥匙', '礼品'],
  deliver: ['星巴克', '奶茶', '药品', '文件', '钥匙', '礼品'],
  errand: ['星巴克', '奶茶', '药品', '文件', '钥匙', '礼品'],
};

const tabIcons: Record<OrderType, React.ReactNode> = {
  buy: <ShoppingBag size={18} />,
  deliver: <Package size={18} />,
  errand: <ClipboardList size={18} />,
};

export default function PublishOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const typeParam = (searchParams.get('type') as OrderType) || 'deliver';
  const [activeTab, setActiveTab] = useState<OrderType>(typeParam);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [pickup, setPickup] = useState<GeoPoint>({
    ...CITY_CENTER,
    address: '',
  });
  const [deliver, setDeliver] = useState<GeoPoint>({
    lat: CITY_CENTER.lat + 0.01,
    lng: CITY_CENTER.lng + 0.01,
    address: '',
  });

  const [expectedDate, setExpectedDate] = useState<string>('');
  const [timeSlotIndex, setTimeSlotIndex] = useState<number>(0);
  const [surgeFee, setSurgeFee] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const timeSlots = useMemo(() => {
    const slots: { label: string; time: Date }[] = [];
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    now.setSeconds(0, 0);
    for (let i = 0; i < 24; i++) {
      const t = new Date(now.getTime() + i * 30 * 60000);
      slots.push({
        label: `${t.getHours().toString().padStart(2, '0')}:${t
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        time: t,
      });
    }
    return slots;
  }, []);

  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate());
    setExpectedDate(defaultDate.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const typePlaceholders: Record<OrderType, string> = {
      buy: '请输入需要代买的商品名称',
      deliver: '请输入需要配送的物品描述',
      errand: '请输入需要代办的事项',
    };
    if (!title) setTitle(typePlaceholders[activeTab]);
  }, [activeTab, title]);

  const distanceKm = useMemo(() => haversineDistance(pickup, deliver) / 1000, [pickup, deliver]);
  const baseFee = 8;
  const mileageFee = Math.round(distanceKm * 2 * 100) / 100;
  const platformFee = 2;
  const totalAmount = Math.round((baseFee + mileageFee + surgeFee + platformFee) * 100) / 100;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePickMap = (_setter: (p: GeoPoint) => void) => {
    addToast({ type: 'info', message: '地图选点功能即将开放', duration: 2000 });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      addToast({ type: 'error', message: '请输入订单标题' });
      return;
    }
    if (!pickup.address?.trim()) {
      addToast({ type: 'error', message: '请输入取货地址' });
      return;
    }
    if (!deliver.address?.trim()) {
      addToast({ type: 'error', message: '请输入送货地址' });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    addToast({ type: 'success', message: '订单发布成功！正在为您寻找骑手...', duration: 3000 });
    setSubmitting(false);
    navigate('/user/orders');
  };

  const etaMin = Math.max(10, Math.round(distanceKm * 5 + 15));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-b from-dark via-dark to-dark/95 pb-48"
    >
      <div className="sticky top-0 z-30 bg-dark/85 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">发布跑腿需求</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderType)}>
            <div className="bg-dark/60 rounded-2xl p-1.5 border border-white/10">
              <TabList className="!bg-transparent !p-0 w-full">
                {(['buy', 'deliver', 'errand'] as OrderType[]).map((t) => (
                  <Tab
                    key={t}
                    value={t}
                    className="!flex-1 !px-3 !text-sm !rounded-xl"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      {tabIcons[t]}
                      {t === 'buy' ? '代买' : t === 'deliver' ? '代送' : '代办'}
                    </span>
                  </Tab>
                ))}
              </TabList>
            </div>
            <TabPanel value="buy"><div className="h-0" /></TabPanel>
            <TabPanel value="deliver"><div className="h-0" /></TabPanel>
            <TabPanel value="errand"><div className="h-0" /></TabPanel>
          </Tabs>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Package size={16} className="text-primary" />
            </div>
            <h3 className="font-bold text-white">订单信息</h3>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">订单标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请简要描述您的需求"
              className="w-full h-11 px-4 rounded-xl bg-dark/50 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-dark/70 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">详细描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述物品大小、取货注意事项、特殊要求等..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-dark/50 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-dark/70 transition-all text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-2 font-medium">快捷标签</label>
            <div className="flex flex-wrap gap-2">
              {quickTags[activeTab].map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/80'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
              <MapPin size={16} className="text-success" />
            </div>
            <h3 className="font-bold text-white">地址信息</h3>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <div className="absolute left-4 top-4 w-3 h-3 rounded-full bg-success shadow-lg shadow-success/40" />
              <div className="pl-10 pr-3 py-3 rounded-xl bg-dark/50 border border-white/10">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-success/80 mb-0.5 font-medium">取货点</div>
                    <input
                      type="text"
                      value={pickup.address || ''}
                      onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                      placeholder="请输入取货地址或在地图选点"
                      className="w-full bg-transparent outline-none text-white text-sm placeholder:text-white/30"
                    />
                  </div>
                  <button
                    onClick={() => handlePickMap(setPickup)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors"
                  >
                    <MapIcon size={14} />
                    选点
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center py-1">
              <div className="w-px h-5 bg-gradient-to-b from-success/50 to-accent/50" />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-4 w-3 h-3 rounded-full bg-accent shadow-lg shadow-accent/40" />
              <div className="pl-10 pr-3 py-3 rounded-xl bg-dark/50 border border-white/10">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-accent/80 mb-0.5 font-medium">送货点</div>
                    <input
                      type="text"
                      value={deliver.address || ''}
                      onChange={(e) => setDeliver({ ...deliver, address: e.target.value })}
                      placeholder="请输入送货地址或在地图选点"
                      className="w-full bg-transparent outline-none text-white text-sm placeholder:text-white/30"
                    />
                  </div>
                  <button
                    onClick={() => handlePickMap(setDeliver)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-xs font-medium hover:bg-accent/25 transition-colors"
                  >
                    <MapIcon size={14} />
                    选点
                  </button>
                </div>
              </div>
            </div>
          </div>

          {distanceKm > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Navigation size={14} className="text-primary" />
                <span>配送距离</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)}m`
                    : `${distanceKm.toFixed(1)}km`}
                </span>
                <span className="text-xs text-white/40">· 约 {etaMin} 分钟</span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Clock size={16} className="text-accent" />
            </div>
            <h3 className="font-bold text-white">期望送达时间</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  送达日期
                </span>
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-11 px-4 rounded-xl bg-dark/50 border border-white/10 text-white outline-none focus:border-accent/50 focus:bg-dark/70 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  送达时段
                </span>
              </label>
              <select
                value={timeSlotIndex}
                onChange={(e) => setTimeSlotIndex(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl bg-dark/50 border border-white/10 text-white outline-none focus:border-accent/50 focus:bg-dark/70 transition-all text-sm appearance-none"
              >
                {timeSlots.map((slot, idx) => (
                  <option key={idx} value={idx} className="bg-dark">
                    {slot.label}
                    {idx === 0 && ' (尽快)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">时间粒度：30分钟</span>
              <span className="text-accent font-medium">
                最早：{timeSlots[0]?.label || '--:--'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={timeSlots.length - 1}
              step={1}
              value={timeSlotIndex}
              onChange={(e) => setTimeSlotIndex(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-white/10 accent-accent cursor-pointer"
              style={{
                background: `linear-gradient(to right, #FF6B1A 0%, #FF6B1A ${
                  (timeSlotIndex / Math.max(1, timeSlots.length - 1)) * 100
                }%, rgba(255,255,255,0.1) ${
                  (timeSlotIndex / Math.max(1, timeSlots.length - 1)) * 100
                }%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between text-[11px] text-white/30 font-mono">
              <span>{timeSlots[0]?.label}</span>
              <span>
                {timeSlots[Math.floor(timeSlots.length / 2)]?.label}
              </span>
              <span>{timeSlots[timeSlots.length - 1]?.label}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-3xl bg-white/5 border border-white/10 p-5"
        >
          <SurgeFeePicker value={surgeFee} onChange={setSurgeFee} />
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-dark via-dark/95 to-transparent pointer-events-none" />
        <div className="bg-dark/95 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>基础服务费</span>
                <span>¥{baseFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>里程费 ({distanceKm.toFixed(1)}km × ¥2/km)</span>
                <span>¥{mileageFee.toFixed(2)}</span>
              </div>
              {surgeFee > 0 && (
                <div className="flex items-center justify-between text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    加急加价
                    <AlertCircle size={12} className="text-accent" />
                  </span>
                  <span className="text-accent">+¥{surgeFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>平台服务费</span>
                <span>¥{platformFee.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <Info size={12} />
                  <span>预计 {etaMin} 分钟送达</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40 mb-0.5">合计</div>
                  <div className="text-3xl font-black bg-gradient-to-r from-accent to-orange-300 bg-clip-text text-transparent leading-none">
                    ¥{totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="accent"
              size="lg"
              fullWidth
              loading={submitting}
              onClick={handleSubmit}
              className="!h-14 !text-base !rounded-2xl shadow-xl shadow-accent/30"
            >
              确认发布订单
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
