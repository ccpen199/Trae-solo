import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shirt,
  Home,
  Store,
  MapPin,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { mockVirtualResources } from '@/data/mockData';
import type { VirtualResourceType } from '@/types';

type TabType = 'ar' | 'vr' | 'shop';

const TABS: { key: TabType; label: string; icon: typeof Shirt; type: VirtualResourceType }[] = [
  { key: 'ar', label: 'AR试衣', icon: Shirt, type: 'ar_clothing' },
  { key: 'vr', label: 'VR看房', icon: Home, type: 'vr_house' },
  { key: 'shop', label: '360°探店', icon: Store, type: 'shop_360' },
];

export default function ExperienceIndex() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('ar');

  const currentType = TABS.find((t) => t.key === activeTab)?.type;
  const filtered = mockVirtualResources.filter((r) => r.type === currentType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand via-brand-600 to-brand-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-mint/15 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brand-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-5">
            <Sparkles size={16} className="text-accent" />
            <span className="text-sm text-white/80 font-medium">沉浸式虚拟体验</span>
          </div>
          <h1 className="text-5xl font-bold text-white font-display tracking-wide">
            虚拟体验中心
          </h1>
          <p className="text-white/60 mt-3 text-lg">
            足不出户，身临其境地探索服装、房产与店铺
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <div className="glass rounded-2xl p-1.5 flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/90'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent to-accent-400 shadow-lg shadow-accent/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon size={18} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid md:grid-cols-3 gap-6"
        >
          {filtered.map((resource) => (
            <motion.div
              key={resource.id}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              whileHover={{ scale: 1.03, y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() =>
                navigate(`/experience/${activeTab}/${resource.id}`)
              }
              className="group cursor-pointer"
            >
              <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-card hover:shadow-2xl hover:shadow-accent/20 transition-all duration-500">
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand/80 via-brand/20 to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                    {resource.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium glass text-white/90"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {resource.price && (
                    <div className="absolute bottom-4 right-4 px-4 py-1.5 rounded-full bg-accent text-white text-sm font-bold shadow-lg shadow-accent/40">
                      {resource.price}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors duration-300 flex items-center gap-2">
                    {resource.title}
                    <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-white/50 text-sm">
                    <MapPin size={14} className="text-mint" />
                    <span>{resource.providerName}</span>
                  </div>
                  {resource.address && (
                    <div className="mt-1 text-white/40 text-xs ml-4">
                      {resource.address}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
