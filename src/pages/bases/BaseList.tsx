import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Star, Briefcase, Home, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockBases } from '@/mock/bases';
import { BaseStatus } from '@/constants/enums';
import type { PracticeBase } from '@/types';

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'enterprise', label: '企业' },
  { key: 'village', label: '乡村' },
  { key: 'community', label: '社区' },
] as const;

const typeConfig: Record<string, { label: string; color: string; icon: typeof Briefcase }> = {
  enterprise: { label: '企业', color: 'bg-blue-100 text-blue-700', icon: Briefcase },
  village: { label: '乡村', color: 'bg-green-100 text-green-700', icon: Home },
  community: { label: '社区', color: 'bg-purple-100 text-purple-700', icon: Users },
};

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(score) ? 'fill-amber-400 text-amber-400' : 'text-surface-300'}`}
        />
      ))}
      <span className="text-xs text-surface-500 ml-1">{score}</span>
    </div>
  );
}

function BaseCard({ base }: { base: PracticeBase }) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[base.type];

  return (
    <motion.div layout className="card card-hover overflow-hidden">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {base.logo ? (
              <img src={base.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center">
                <config.icon className="w-5 h-5 text-surface-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-surface-900">{base.name}</h3>
              <span className={`status-badge mt-1 ${config.color}`}>{config.label}</span>
            </div>
          </div>
          <span className={`status-badge ${BaseStatus[base.status as keyof typeof BaseStatus]?.color}`}>
            {BaseStatus[base.status as keyof typeof BaseStatus]?.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <MapPin className="w-3 h-3" />
          {base.address}
        </div>
        <div className="flex items-center justify-between">
          <StarRating score={base.satisfactionScore} />
          <span className="text-xs text-surface-500">{base.positions.length} 个岗位</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
        >
          {expanded ? '收起详情' : '查看详情'}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-surface-100 space-y-3">
              <p className="text-sm text-surface-600 leading-relaxed">{base.description}</p>
              {base.positions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-surface-700">招聘岗位</h4>
                  {base.positions.map((pos) => (
                    <div key={pos.id} className="bg-surface-50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-surface-800">{pos.title}</span>
                        <span className="status-badge bg-success-50 text-success-600">{pos.status === 'open' ? '招聘中' : '已关闭'}</span>
                      </div>
                      <p className="text-xs text-surface-500">{pos.requirements}</p>
                      <div className="flex items-center justify-between text-xs text-surface-400">
                        <span>名额: {pos.slots}</span>
                        {pos.subsidy && <span>补贴: {pos.subsidy}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BaseList() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = mockBases.filter((b) => activeFilter === 'all' || b.type === activeFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">实践基地</h1>
        <Link to="/bases/apply" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          基地入驻申请
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {typeFilters.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'bg-primary-800 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((base, i) => (
          <motion.div key={base.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <BaseCard base={base} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-surface-400">暂无符合条件的基地</div>
      )}
    </div>
  );
}
