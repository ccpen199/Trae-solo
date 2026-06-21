import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, Star, AlertCircle, Briefcase } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import RadarChart from '@/components/charts/RadarChart';
import CreditBadge from '@/components/ui/CreditBadge';
import { formatArea, formatCurrency } from '@/utils/formatters';
import type { Designer, RadarData } from '@/types';

const styleOptions = ['全部风格', '现代简约', '北欧风格', '新中式', '工业风', '日式禅意', '轻奢风'];
const creditOptions = ['全部等级', 'S', 'A', 'B', 'C', 'D'];

const mapRadarScores = (scores: Designer['radarScores']): RadarData[] => [
  { subject: '设计能力', score: scores.designAbility, fullMark: 100 },
  { subject: '沟通能力', score: scores.communication, fullMark: 100 },
  { subject: '成本控制', score: scores.costControl, fullMark: 100 },
  { subject: '进度把控', score: scores.scheduleAdherence, fullMark: 100 },
  { subject: '售后服务', score: scores.afterSales, fullMark: 100 },
];

export default function Designers() {
  const { designers, users } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('全部风格');
  const [selectedCredit, setSelectedCredit] = useState('全部等级');
  const [budgetRange, setBudgetRange] = useState([0, 500000]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDesigners = useMemo(() => {
    return designers.filter((designer) => {
      const user = users.find((u) => u.id === designer.userId);
      const matchesSearch = designer.name.includes(searchQuery) ||
        designer.specializations.some((s) => s.includes(searchQuery));
      const matchesStyle = selectedStyle === '全部风格' ||
        designer.specializations.includes(selectedStyle);
      const matchesCredit = selectedCredit === '全部等级' ||
        user?.creditLevel === selectedCredit;
      const avgBudget = designer.portfolio.reduce((sum, p) => sum + p.budget, 0) /
        Math.max(designer.portfolio.length, 1);
      const matchesBudget = avgBudget >= budgetRange[0] && avgBudget <= budgetRange[1];
      return matchesSearch && matchesStyle && matchesCredit && matchesBudget;
    });
  }, [designers, users, searchQuery, selectedStyle, selectedCredit, budgetRange]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-8 py-6"
      >
        <h1 className="text-3xl font-bold text-gray-900">设计师能力图谱</h1>
        <p className="text-gray-500 mt-1">按多维能力精准匹配</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-b border-gray-200 px-8 py-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {styleOptions.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">预算区间:</span>
            <input
              type="range"
              min="0"
              max="1000000"
              step="50000"
              value={budgetRange[1]}
              onChange={(e) => setBudgetRange([0, Number(e.target.value)])}
              className="w-40 accent-amber-500"
            />
            <span className="text-sm text-gray-600">{formatCurrency(budgetRange[1])}</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCredit}
              onChange={(e) => setSelectedCredit(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {creditOptions.map((credit) => (
                <option key={credit} value={credit}>
                  {credit === '全部等级' ? credit : `信用${credit}级`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索设计师名称或专长..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredDesigners.map((designer, index) => {
              const user = users.find((u) => u.id === designer.userId);
              const isExpanded = expandedId === designer.id;
              const radarData = mapRadarScores(designer.radarScores);

              return (
                <motion.div
                  key={designer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => toggleExpand(designer.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <img
                        src={designer.avatar}
                        alt={designer.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-100"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{designer.name}</h3>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          从业 {designer.yearsExperience} 年
                        </p>
                        {user && (
                          <div className="mt-2">
                            <CreditBadge
                              score={user.creditScore}
                              level={user.creditLevel}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <RadarChart data={radarData} height={200} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Briefcase className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-gray-900">{designer.completedProjects}</p>
                        <p className="text-xs text-gray-500">完成项目</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-gray-900">{designer.averageRating.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">平均评分</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-gray-900">{(designer.complaintRate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">投诉率</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {designer.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 overflow-hidden"
                      >
                        <div className="p-6 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-4">作品集案例</h4>
                          <div className="space-y-4">
                            {designer.portfolio.map((project) => (
                              <div
                                key={project.id}
                                className="bg-white rounded-xl p-4 flex gap-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <img
                                  src={project.images[0]}
                                  alt={project.title}
                                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-gray-900 truncate">{project.title}</h5>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {formatArea(project.area)} · {project.style}
                                  </p>
                                  <p className="text-sm font-semibold text-amber-600 mt-1">
                                    {formatCurrency(project.budget)}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="text-sm text-gray-600">{project.ownerRating}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
