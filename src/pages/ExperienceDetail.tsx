import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, Building2, Tag, User, Play,
  RotateCcw, Move, Utensils, Sofa, Bath, BedDouble, ChevronRight,
} from 'lucide-react';
import { mockVirtualResources } from '@/data/mockData';

type ViewType = 'ar' | 'vr' | 'shop';
type HotspotT = { x: number; y: number; label: string; desc: string; price?: string; icon?: typeof Sofa };

const VR_HOTSPOTS: HotspotT[] = [
  { x: 30, y: 45, label: '客厅', icon: Sofa, desc: '45㎡ 南向采光 · 落地窗' },
  { x: 65, y: 35, label: '主卧', icon: BedDouble, desc: '18㎡ · 独立卫浴' },
  { x: 80, y: 60, label: '浴室', icon: Bath, desc: '8㎡ · 干湿分离' },
];
const SHOP_HOTSPOTS: HotspotT[] = [
  { x: 25, y: 50, label: '招牌水煮鱼', price: '¥88', desc: '店长推荐 · 麻辣鲜香' },
  { x: 55, y: 40, label: '夫妻肺片', price: '¥48', desc: '经典凉菜 · 开胃爽口' },
  { x: 75, y: 60, label: '麻婆豆腐', price: '¥38', desc: '川菜经典 · 下饭神器' },
];

const PLAYER_BG: Record<ViewType, { grad: string; glow: string }> = {
  ar: { grad: 'from-brand-700 via-brand to-brand-800', glow: '20% 30%, rgba(255,107,53,0.3), transparent 40%' },
  vr: { grad: 'from-amber-900/60 via-brand-800 to-brand-900', glow: '50% 60%, rgba(255,180,120,0.2), transparent 60%' },
  shop: { grad: 'from-orange-900/50 via-brand-800 to-brand-900', glow: '30% 40%, rgba(255,150,80,0.3), transparent 50%' },
};
const MODE_LABEL: Record<ViewType, string> = {
  ar: 'AR 试衣模式', vr: 'VR 全景看房', shop: '360° 探店模式',
};

export default function ExperienceDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const viewType = type as ViewType;
  const resource = mockVirtualResources.find((r) => r.id === id);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDragOffset({ x: 0, y: 0 }); setActiveHotspot(null); }, [id]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset({ x: (e.clientX - dragStart.current.x) * 0.3, y: (e.clientY - dragStart.current.y) * 0.2 });
  };
  const handleReset = () => { setDragOffset({ x: 0, y: 0 }); setActiveHotspot(null); };

  const hotspots = viewType === 'vr' ? VR_HOTSPOTS : viewType === 'shop' ? SHOP_HOTSPOTS : [];
  const bg = PLAYER_BG[viewType];

  if (!resource) return <div className="min-h-screen bg-brand flex items-center justify-center text-white">未找到该资源</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand via-brand-600 to-brand-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/15 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-mint/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/experience')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          返回体验中心
        </motion.button>

        <div className="flex gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex-1" style={{ flexBasis: '70%' }}
          >
            <div
              ref={containerRef}
              className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-[16/10] select-none"
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${bg.grad}`} />
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `radial-gradient(circle at ${bg.glow})` }} />
              {viewType !== 'ar' && <div className="absolute inset-0" style={{ backgroundImage: `url(${resource.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35, filter: 'blur(2px)' }} />}

              <motion.div
                className="absolute inset-0" style={{ x: dragOffset.x, y: dragOffset.y }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              >
                {viewType === 'ar' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-48 h-80 rounded-t-full border-2 border-dashed border-white/30" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }} />
                      <div className="absolute inset-4 rounded-t-full" style={{ background: 'linear-gradient(180deg, rgba(255,107,53,0.4) 0%, rgba(255,107,53,0.1) 100%)', boxShadow: '0 0 40px rgba(255,107,53,0.3), inset 0 0 20px rgba(255,107,53,0.2)' }} />
                      <div className="absolute top-4 -right-16 glass rounded-xl px-3 py-2 text-xs text-white/80"><User size={14} className="inline mr-1 text-mint" />模特轮廓</div>
                      <div className="absolute bottom-6 -left-16 glass rounded-xl px-3 py-2 text-xs text-white/80"><Tag size={14} className="inline mr-1 text-accent" />虚拟试穿</div>
                    </div>
                  </div>
                )}

                {(viewType === 'vr' || viewType === 'shop') && hotspots.map((h, idx) => {
                  const Icon = viewType === 'vr' ? h.icon! : Utensils;
                  const isActive = activeHotspot === idx;
                  const color = viewType === 'vr' ? 'mint' : 'accent';
                  return (
                    <div key={idx} className="absolute" style={{ left: `${h.x}%`, top: `${h.y}%` }} onMouseEnter={() => setActiveHotspot(idx)} onMouseLeave={() => setActiveHotspot(null)}>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                        className={`relative w-11 h-11 rounded-full flex items-center justify-center ${color === 'mint' ? 'bg-mint/90 text-brand' : 'bg-accent/90 text-white'}`}
                        style={{ boxShadow: color === 'mint' ? '0 0 0 4px rgba(45,212,168,0.3), 0 4px 20px rgba(45,212,168,0.4)' : '0 0 0 4px rgba(255,107,53,0.3), 0 4px 20px rgba(255,107,53,0.4)' }}>
                        <motion.div className="absolute inset-0 rounded-full opacity-50" animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                          style={{ background: color === 'mint' ? 'rgba(45,212,168,0.4)' : 'rgba(255,107,53,0.4)' }} />
                        <Icon size={18} />
                      </motion.button>
                      {isActive && (
                        <motion.div initial={{ opacity: 0, y: 5, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="absolute left-14 top-1/2 -translate-y-1/2 glass-dark rounded-2xl px-4 py-3 min-w-[180px] border border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white text-sm">{h.label}</span>
                            {h.price && <span className="text-accent font-bold text-sm">{h.price}</span>}
                          </div>
                          <div className="text-white/60 text-xs">{h.desc}</div>
                          <ChevronRight size={12} className="absolute left-[-6px] top-1/2 -translate-y-1/2 text-white/40 rotate-180" />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </motion.div>

              <div className="absolute top-5 left-5 flex items-center gap-2 glass-dark rounded-full px-4 py-2 text-xs text-white/80 border border-white/10">
                <Move size={14} />拖拽鼠标探索全景
              </div>
              <div className="absolute top-5 right-5 glass-dark rounded-xl px-3 py-1.5 text-xs text-white/70 border border-white/10">{MODE_LABEL[viewType]}</div>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 border border-white/10"><Play size={18} className="ml-0.5" /></button>
                <button onClick={handleReset} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 border border-white/10"><RotateCcw size={16} /></button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ flexBasis: '30%' }}>
            <div className="glass rounded-3xl border border-white/15 p-6 shadow-2xl sticky top-8">
              <h2 className="text-2xl font-bold text-white leading-tight">{resource.title}</h2>
              <div className="flex flex-wrap gap-2 mt-4">
                {resource.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent-100 border border-accent/30">#{tag}</span>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-mint/20 flex items-center justify-center text-mint shrink-0"><Building2 size={16} /></div>
                  <div><div className="text-xs text-white/40">服务商</div><div className="text-sm text-white/90 font-medium mt-0.5">{resource.providerName}</div></div>
                </div>
                {resource.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0"><MapPin size={16} /></div>
                    <div><div className="text-xs text-white/40">地址</div><div className="text-sm text-white/90 font-medium mt-0.5">{resource.address}</div></div>
                  </div>
                )}
                {resource.price && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-400/30 flex items-center justify-center text-white/80 shrink-0"><Tag size={16} /></div>
                    <div><div className="text-xs text-white/40">价格</div><div className="text-2xl text-accent font-bold mt-0.5">{resource.price}</div></div>
                  </div>
                )}
              </div>
              <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                className="w-full mt-7 py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-400 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/30">
                <Calendar size={18} />立即预约体验
              </motion.button>
              <button className="w-full mt-3 py-3.5 rounded-2xl border border-white/15 text-white/80 font-medium text-sm hover:bg-white/5 transition-colors">收藏此体验</button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
