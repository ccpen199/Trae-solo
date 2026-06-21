import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Building2, Tag, User, Play, RotateCcw, Move,
  Utensils, Sofa, Bath, BedDouble, BedSingle, ChefHat, Flower2,
  Heart, Share2, Star, Users, ChevronRight, X, ShoppingBag,
} from 'lucide-react';
import { mockVirtualResources, mockProviders } from '@/data/mockData';
import { StarRating } from '@/components/ui/StarRating';
import type { DishItem } from '@/types';

type ViewType = 'ar' | 'vr' | 'shop';
type ClothingCat = 'top' | 'bottom' | 'dress' | 'coat';

const VR_ICON_MAP: Record<string, typeof Sofa> = { Sofa, BedDouble, BedSingle, ChefHat, Bath, Flower2 };
const CLOTH_CATS: { key: ClothingCat; label: string }[] = [
  { key: 'top', label: '上装' }, { key: 'bottom', label: '下装' },
  { key: 'dress', label: '连衣裙' }, { key: 'coat', label: '外套' },
];
const PLAYER_BG: Record<ViewType, { grad: string; glow: string }> = {
  ar: { grad: 'from-brand-700 via-brand to-brand-800', glow: '20% 30%, rgba(255,107,53,0.3), transparent 40%' },
  vr: { grad: 'from-amber-900/60 via-brand-800 to-brand-900', glow: '50% 60%, rgba(255,180,120,0.2), transparent 60%' },
  shop: { grad: 'from-orange-900/50 via-brand-800 to-brand-900', glow: '30% 40%, rgba(255,150,80,0.3), transparent 50%' },
};
const MODE_LABEL: Record<ViewType, string> = { ar: 'AR 试衣', vr: 'VR 看房', shop: '360° 探店' };

export default function ExperienceDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const viewType = type as ViewType;
  const resource = mockVirtualResources.find((r) => r.id === id);
  const provider = mockProviders.find((p) => p.id === resource?.providerId);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [activeDish, setActiveDish] = useState<DishItem | null>(null);
  const [selectedCloth, setSelectedCloth] = useState<string | null>(null);
  const [clothCat, setClothCat] = useState<ClothingCat>('dress');
  const [isFavorited, setIsFavorited] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => { setDragOffset({ x: 0, y: 0 }); setActiveHotspot(null); setActiveDish(null); }, [id]);

  const hotspots = useMemo(() => {
    if (viewType === 'vr' && resource?.vrHotspots) return resource.vrHotspots;
    if (viewType === 'shop' && resource?.dishes) {
      return resource.dishes.map((d, i) => ({
        x: 15 + (i % 3) * 30, y: 35 + Math.floor(i / 3) * 25,
        label: d.name, price: d.price, desc: d.taste, dishId: d.id,
      }));
    }
    return [];
  }, [viewType, resource]);

  const relatedResources = useMemo(() => mockVirtualResources
    .filter((r) => r.providerId === resource?.providerId && r.id !== id).slice(0, 3),
    [resource?.providerId, id]);

  const filteredClothes = useMemo(() =>
    resource?.clothes?.filter((c) => c.category === clothCat) || [],
    [resource?.clothes, clothCat]);

  const onMouseDown = (e: React.MouseEvent) => { setIsDragging(true); dragStart.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }; };
  const onMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; setDragOffset({ x: (e.clientX - dragStart.current.x) * 0.3, y: (e.clientY - dragStart.current.y) * 0.2 }); };
  const handleReset = () => { setDragOffset({ x: 0, y: 0 }); setActiveHotspot(null); };
  const handleBookService = () => {
    const map: Record<string, string> = { ar_clothing: '美容', vr_house: '家政', shop_360: '餐饮' };
    navigate(`/demand?category=${encodeURIComponent(map[resource?.type || ''] || '')}`);
  };

  const bg = PLAYER_BG[viewType];
  if (!resource) return <div className="min-h-screen bg-brand flex items-center justify-center text-white">未找到该资源</div>;

  const btnGlass = 'w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 border border-white/10';
  const statCard = 'glass rounded-lg p-2.5 text-center';
  const miniStat = 'glass rounded-md p-1.5 text-center';

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand via-brand-600 to-brand-800 relative overflow-hidden pb-12">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/15 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-mint/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/experience')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />返回体验中心
        </motion.button>

        <div className="flex gap-6 flex-col lg:flex-row">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1">
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-[16/10] select-none"
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${bg.grad}`} />
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `radial-gradient(circle at ${bg.glow})` }} />
              {viewType !== 'ar' && <div className="absolute inset-0" style={{
                backgroundImage: `url(${resource.thumbnail})`, backgroundSize: 'cover',
                backgroundPosition: 'center', opacity: 0.35, filter: 'blur(2px)'
              }} />}

              <motion.div className="absolute inset-0" style={{ x: dragOffset.x, y: dragOffset.y }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}>
                {viewType === 'ar' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-48 h-80 rounded-t-full border-2 border-dashed border-white/30"
                        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }} />
                      <div className="absolute inset-4 rounded-t-full"
                        style={{
                          background: selectedCloth
                            ? 'linear-gradient(180deg, rgba(255,107,53,0.5) 0%, rgba(255,107,53,0.15) 100%)'
                            : 'linear-gradient(180deg, rgba(255,107,53,0.25) 0%, rgba(255,107,53,0.08) 100%)',
                          boxShadow: '0 0 40px rgba(255,107,53,0.3), inset 0 0 20px rgba(255,107,53,0.2)'
                        }} />
                      <div className="absolute top-4 -right-16 glass rounded-xl px-3 py-2 text-xs text-white/80">
                        <User size={14} className="inline mr-1 text-mint" />模特轮廓
                      </div>
                    </div>
                    {resource.clothes && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 glass rounded-2xl p-3 w-44 border border-white/10">
                        <div className="text-xs text-white/60 mb-2 font-medium">选择服装</div>
                        <div className="flex gap-1 mb-3">
                          {CLOTH_CATS.map((cat) => (
                            <button key={cat.key} onClick={() => setClothCat(cat.key)}
                              className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                clothCat === cat.key ? 'bg-accent/20 text-accent' : 'text-white/50 hover:text-white/80'
                              }`}>{cat.label}</button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                          {filteredClothes.map((c) => (
                            <button key={c.id} onClick={() => setSelectedCloth(c.id)}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                selectedCloth === c.id ? 'border-accent' : 'border-transparent hover:border-white/20'
                              }`}>
                              <img src={c.image} alt={c.name} className="w-full h-14 object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white px-1 py-0.5 truncate">{c.price}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(viewType === 'vr' || viewType === 'shop') && hotspots.map((h: any, idx: number) => {
                  const Icon = viewType === 'vr' ? (VR_ICON_MAP[h.icon] || Sofa) : Utensils;
                  const isActive = activeHotspot === idx;
                  const isMint = viewType === 'vr';
                  return (
                    <div key={idx} className="absolute" style={{ left: `${h.x}%`, top: `${h.y}%` }}
                      onMouseEnter={() => setActiveHotspot(idx)} onMouseLeave={() => setActiveHotspot(null)}
                      onClick={() => viewType === 'shop' && h.dishId && setActiveDish(resource.dishes!.find((d) => d.id === h.dishId)!)}>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center ${isMint ? 'bg-mint/90 text-brand' : 'bg-accent/90 text-white'}`}
                        style={{ boxShadow: isMint ? '0 0 0 4px rgba(45,212,168,0.3), 0 4px 20px rgba(45,212,168,0.4)' : '0 0 0 4px rgba(255,107,53,0.3), 0 4px 20px rgba(255,107,53,0.4)' }}>
                        <motion.div className="absolute inset-0 rounded-full opacity-50"
                          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{ background: isMint ? 'rgba(45,212,168,0.4)' : 'rgba(255,107,53,0.4)' }} />
                        <Icon size={16} />
                      </motion.button>
                      {isActive && (
                        <motion.div initial={{ opacity: 0, y: 5, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="absolute left-12 top-1/2 -translate-y-1/2 glass-dark rounded-xl px-3 py-2 min-w-[160px] border border-white/10 z-10">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-white text-xs">{h.label}</span>
                            {h.price && <span className="text-accent font-bold text-xs">{h.price}</span>}
                          </div>
                          <div className="text-white/60 text-[11px]">{h.desc}</div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </motion.div>

              <div className="absolute top-4 left-4 flex items-center gap-2 glass-dark rounded-full px-3 py-1.5 text-[11px] text-white/80 border border-white/10">
                <Move size={12} />拖拽探索
              </div>
              <div className="absolute top-4 right-4 glass-dark rounded-lg px-2.5 py-1 text-[11px] text-white/70 border border-white/10">{MODE_LABEL[viewType]}</div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button className={btnGlass}><Play size={16} className="ml-0.5" /></button>
                <button onClick={handleReset} className={btnGlass}><RotateCcw size={14} /></button>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="mt-5 glass rounded-3xl border border-white/15 p-5">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <Star className="text-accent" size={18} />用户评价
                <span className="text-xs text-white/50 font-normal">({resource.reviews.length})</span>
              </h3>
              <div className="space-y-3">
                {resource.reviews.slice(0, 4).map((review) => (
                  <div key={review.id} className="flex gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/30 to-mint/30 flex items-center justify-center text-white font-bold text-sm shrink-0">{review.userName[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{review.userName}</span>
                        <span className="text-xs text-white/40">{review.date}</span>
                      </div>
                      <StarRating rating={review.rating} size={11} className="mt-0.5" />
                      <p className="text-xs text-white/60 mt-1">{review.content}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        {review.tags.map((t) => <span key={t} className="px-1.5 py-0.5 rounded-full text-[10px] bg-mint/10 text-mint/80">{t}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <div className="w-full lg:w-72 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass rounded-3xl border border-white/15 p-5 shadow-2xl">
              <h2 className="text-xl font-bold text-white leading-tight">{resource.title}</h2>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {resource.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/20 text-accent-100 border border-accent/30">#{tag}</span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className={statCard}><div className="flex items-center justify-center gap-1 text-accent font-bold text-base"><Star size={14} className="fill-accent" />{resource.rating}</div><div className="text-[10px] text-white/50">评分</div></div>
                <div className={statCard}><div className="text-mint font-bold text-base">{resource.experienceCount.toLocaleString()}</div><div className="text-[10px] text-white/50">已体验</div></div>
              </div>
              {provider && (
                <div className="mt-4 space-y-2">
                  <div className="glass rounded-lg p-2.5 flex items-center gap-2.5">
                    <img src={provider.avatar} alt={provider.name} className="w-9 h-9 rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{provider.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRating rating={provider.starLevel} size={11} />
                        <span className="text-[10px] text-white/50">{(provider.goodRate * 100).toFixed(0)}%好评</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className={miniStat}><div className="text-mint text-xs font-bold">{provider.responseSpeed}分</div><div className="text-[9px] text-white/40">响应</div></div>
                    <div className={miniStat}><div className="text-accent text-xs font-bold">{provider.orderCount}</div><div className="text-[9px] text-white/40">接单</div></div>
                    <div className={miniStat}><div className="text-brand-200 text-[10px] font-bold truncate">{provider.priceRange}</div><div className="text-[9px] text-white/40">价格</div></div>
                  </div>
                </div>
              )}
              {resource.address && <div className="flex items-start gap-2.5 mt-4"><div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent shrink-0"><MapPin size={14} /></div><div><div className="text-[10px] text-white/40">地址</div><div className="text-xs text-white/90 font-medium mt-0.5">{resource.address}</div></div></div>}
              {resource.price && <div className="flex items-start gap-2.5 mt-3"><div className="w-8 h-8 rounded-lg bg-brand-400/30 flex items-center justify-center text-white/80 shrink-0"><Tag size={14} /></div><div><div className="text-[10px] text-white/40">价格</div><div className="text-xl text-accent font-bold mt-0.5">{resource.price}</div></div></div>}
              <div className="flex gap-2 mt-5">
                <button onClick={() => setIsFavorited(!isFavorited)} className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isFavorited ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                  <Heart size={18} className={isFavorited ? 'fill-accent' : ''} />
                </button>
                <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors"><Share2 size={18} /></button>
                <button onClick={handleBookService} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-400 text-white font-bold text-sm shadow-lg shadow-accent/30">预约上门服务</button>
              </div>
            </motion.div>

            {relatedResources.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-3xl border border-white/15 p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2"><Building2 size={14} className="text-mint" />同店推荐</h3>
                <div className="space-y-2">
                  {relatedResources.map((r) => (
                    <button key={r.id} onClick={() => navigate(`/experience/${type}/${r.id}`)} className="w-full flex gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors text-left">
                      <img src={r.thumbnail} alt={r.title} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white font-medium truncate">{r.title}</div>
                        <StarRating rating={r.rating} size={11} className="mt-0.5" />
                        {r.price && <div className="text-accent text-[11px] font-bold mt-0.5">{r.price}</div>}
                      </div>
                      <ChevronRight size={14} className="text-white/30 self-center" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeDish && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setActiveDish(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass rounded-3xl overflow-hidden max-w-sm w-full border border-white/20" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <img src={activeDish.image} alt={activeDish.name} className="w-full h-44 object-cover" />
                <button onClick={() => setActiveDish(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white"><X size={16} /></button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between"><h3 className="text-lg font-bold text-white">{activeDish.name}</h3><span className="text-accent text-lg font-bold">{activeDish.price}</span></div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-white/60">
                  <span className="flex items-center gap-1"><Star size={12} className="text-mint" />{activeDish.taste}</span>
                  <span className="flex items-center gap-1"><Users size={12} className="text-accent" />月售 {activeDish.sales}+</span>
                </div>
                <p className="text-xs text-white/60 mt-2.5">{activeDish.desc}</p>
                <button className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-400 text-white font-bold text-sm flex items-center justify-center gap-2"><ShoppingBag size={15} />立即下单</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
