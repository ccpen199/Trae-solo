import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  TrendingUp,
  Shield,
  Target,
  Plus,
  Download,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { plan, university, major } from '@/api/client';
import type { RecommendItem } from '../../shared/types';

type TabType = 'reach' | 'stable' | 'safe';

interface LocationState {
  reach: RecommendItem[];
  stable: RecommendItem[];
  safe: RecommendItem[];
  conflictWarnings: string[];
}

interface NameCache {
  universities: Map<number, string>;
  majors: Map<number, string>;
}

const tierConfig = {
  reach: { label: '冲', color: 'orange', icon: TrendingUp, bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  stable: { label: '稳', color: 'blue', icon: Shield, bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  safe: { label: '保', color: 'green', icon: Target, bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
};

export default function RecommendResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('stable');
  const [addingToPlan, setAddingToPlan] = useState<number | null>(null);
  const [planName, setPlanName] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameCache, setNameCache] = useState<NameCache>({
    universities: new Map(),
    majors: new Map(),
  });
  const [loadingNames, setLoadingNames] = useState<Set<number>>(new Set());

  const state = location.state as LocationState;

  const reachItems = state?.reach || [];
  const stableItems = state?.stable || [];
  const safeItems = state?.safe || [];
  const conflictWarnings = state?.conflictWarnings || [];

  const allItems = [...reachItems, ...stableItems, ...safeItems];

  const fetchUniversityName = useCallback(async (id: number) => {
    if (nameCache.universities.has(id)) return;
    if (loadingNames.has(id)) return;

    setLoadingNames((prev) => new Set(prev).add(id));
    try {
      const response = await university.getById(id);
      if (response.success && response.data) {
        setNameCache((prev) => ({
          ...prev,
          universities: new Map(prev.universities).set(id, response.data!.name),
        }));
      }
    } catch (err) {
      console.error('获取院校名称失败:', err);
    } finally {
      setLoadingNames((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [nameCache.universities, loadingNames]);

  const fetchMajorName = useCallback(async (id: number) => {
    if (nameCache.majors.has(id)) return;
    if (loadingNames.has(id)) return;

    setLoadingNames((prev) => new Set(prev).add(id));
    try {
      const response = await major.getById(id);
      if (response.success && response.data) {
        setNameCache((prev) => ({
          ...prev,
          majors: new Map(prev.majors).set(id, response.data!.name),
        }));
      }
    } catch (err) {
      console.error('获取专业名称失败:', err);
    } finally {
      setLoadingNames((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [nameCache.majors, loadingNames]);

  useEffect(() => {
    allItems.forEach((item) => {
      fetchUniversityName(item.universityId);
      fetchMajorName(item.majorId);
    });
  }, [allItems, fetchUniversityName, fetchMajorName]);

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'reach':
        return reachItems;
      case 'stable':
        return stableItems;
      case 'safe':
        return safeItems;
      default:
        return [];
    }
  };

  const getUniversityName = (id: number) => {
    return nameCache.universities.get(id) || `大学 ${id}`;
  };

  const getMajorName = (id: number) => {
    return nameCache.majors.get(id) || `专业 ${id}`;
  };

  const chartData = [
    { name: '冲', count: reachItems.length, color: '#f97316' },
    { name: '稳', count: stableItems.length, color: '#3b82f6' },
    { name: '保', count: safeItems.length, color: '#22c55e' },
  ];

  const probabilityChartData = getCurrentItems().map((item, index) => ({
    name: `${getUniversityName(item.universityId).slice(0, 4)}`,
    probability: item.probability,
  }));

  const handleToggleSelect = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleAddToPlan = async () => {
    if (selectedItems.length === 0) {
      alert('请先选择要添加的志愿项');
      return;
    }
    setShowPlanModal(true);
  };

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      alert('请输入方案名称');
      return;
    }

    setLoading(true);
    setError(null);

    const selectedPlanItems = allItems
      .filter((item) => selectedItems.includes(item.id))
      .map((item, index) => ({
        universityId: item.universityId,
        majorId: item.majorId,
        order: index + 1,
        tier: item.tier,
      }));

    try {
      const response = await plan.create({
        name: planName,
        items: selectedPlanItems,
      });
      if (response.success) {
        navigate('/plans');
      } else {
        setError(response.message || '创建方案失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建方案失败');
    } finally {
      setLoading(false);
      setShowPlanModal(false);
    }
  };

  const handleExport = useCallback(async () => {
    if (allItems.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const title = '高考志愿智能推荐报告';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      const dateStr = `生成日期: ${new Date().toLocaleDateString('zh-CN')}`;
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, (pageWidth - dateWidth) / 2, yPosition);
      yPosition += 15;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('推荐统计', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`冲: ${reachItems.length} 所`, margin, yPosition);
      doc.text(`稳: ${stableItems.length} 所`, margin + 50, yPosition);
      doc.text(`保: ${safeItems.length} 所`, margin + 100, yPosition);
      doc.text(`总计: ${allItems.length} 所`, margin + 150, yPosition);
      yPosition += 10;

      if (conflictWarnings.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 179, 8);
        doc.text('注意事项', margin, yPosition);
        yPosition += 7;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        conflictWarnings.forEach((warning) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(`- ${warning}`, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      }

      const tiers: Array<{ key: TabType; label: string; items: RecommendItem[] }> = [
        { key: 'reach', label: '冲', items: reachItems },
        { key: 'stable', label: '稳', items: stableItems },
        { key: 'safe', label: '保', items: safeItems },
      ];

      tiers.forEach(({ key, label, items }) => {
        if (items.length === 0) return;

        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }

        yPosition += 5;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const tierColor = key === 'reach' ? [249, 115, 22] : key === 'stable' ? [59, 130, 246] : [34, 197, 94];
        doc.setTextColor(tierColor[0], tierColor[1], tierColor[2]);
        doc.text(`${label} (${items.length} 所)`, margin, yPosition);
        yPosition += 10;

        items.forEach((item, index) => {
          if (yPosition > pageHeight - margin - 40) {
            doc.addPage();
            yPosition = margin;
          }

          const uniName = getUniversityName(item.universityId);
          const majorName = getMajorName(item.majorId);
          const prob = Math.round(item.probability * 100);

          doc.setFillColor(249, 250, 251);
          doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 3, 3, 'F');

          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(`${index + 1}. ${uniName}`, margin + 5, yPosition + 10);

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text(`专业: ${majorName}`, margin + 5, yPosition + 20);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const probColor = prob >= 80 ? [34, 197, 94] : prob >= 50 ? [59, 130, 246] : [249, 115, 22];
          doc.setTextColor(probColor[0], probColor[1], probColor[2]);
          doc.text(`录取概率: ${prob}%`, pageWidth - margin - 40, yPosition + 10);

          if (item.matchReasons && item.matchReasons.length > 0) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            const reasonsText = `匹配: ${item.matchReasons.slice(0, 3).join(', ')}`;
            const maxWidth = pageWidth - 2 * margin - 10;
            const truncatedText = doc.splitTextToSize(reasonsText, maxWidth)[0];
            doc.text(truncatedText, margin + 5, yPosition + 28);
          }

          yPosition += 40;
        });
      });

      doc.save(`志愿推荐报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setExporting(false);
    }
  }, [allItems, reachItems, stableItems, safeItems, conflictWarnings, getUniversityName, getMajorName]);

  const renderItem = (item: RecommendItem) => {
    const config = tierConfig[item.tier];
    const isSelected = selectedItems.includes(item.id);
    const isLoadingUni = loadingNames.has(item.universityId);
    const isLoadingMajor = loadingNames.has(item.majorId);

    return (
      <div
        key={item.id}
        onClick={() => handleToggleSelect(item.id)}
        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : `${config.borderColor} ${config.bgColor} hover:shadow-lg`
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSelected ? 'bg-blue-500' : 'bg-white'
              }`}
            >
              {isSelected ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <config.icon className={`w-6 h-6 ${config.textColor}`} />
              )}
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isLoadingUni ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      加载中...
                    </span>
                  ) : (
                    getUniversityName(item.universityId)
                  )}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isSelected ? 'bg-blue-500 text-white' : `bg-white ${config.textColor}`
                  }`}
                >
                  {config.label}
                </span>
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <BookOpen className="w-4 h-4 mr-1" />
                {isLoadingMajor ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    加载中...
                  </span>
                ) : (
                  getMajorName(item.majorId)
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end">
              <Percent className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-2xl font-bold text-green-600">
                {Math.round(item.probability * 100)}%
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">录取概率</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">匹配原因</div>
          <div className="flex flex-wrap gap-2">
            {item.matchReasons.map((reason, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-200"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full bg-white rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${item.probability * 100}%` }}
          />
        </div>
      </div>
    );
  };

  if (allItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/recommend')}
              className="flex items-center text-gray-600 hover:text-blue-600 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回重新填写
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <GraduationCap className="w-20 h-20 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">暂无推荐结果</h2>
            <p className="text-gray-600 mb-6">请先完成智能推荐表单，获取个性化推荐结果</p>
            <button
              onClick={() => navigate('/recommend')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              去填写推荐表单
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/recommend')}
            className="flex items-center text-gray-600 hover:text-blue-600 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回重新填写
          </button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">智能推荐结果</h1>
              <p className="text-gray-600">
                共为您找到 {reachItems.length + stableItems.length + safeItems.length} 个推荐志愿
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddToPlan}
                disabled={selectedItems.length === 0 || loading}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                添加到志愿方案 ({selectedItems.length})
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                导出报告
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {conflictWarnings.length > 0 && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
              <div>
                <div className="font-medium text-amber-800 mb-2">请注意以下问题</div>
                <ul className="space-y-1">
                  {conflictWarnings.map((warning, index) => (
                    <li key={index} className="text-amber-700 text-sm">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">录取梯度分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(['reach', 'stable', 'safe'] as TabType[]).map((tier) => {
              const config = tierConfig[tier];
              const items = tier === 'reach' ? reachItems : tier === 'stable' ? stableItems : safeItems;
              return (
                <div
                  key={tier}
                  className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-6`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <config.icon className={`w-6 h-6 ${config.textColor} mr-2`} />
                      <span className={`font-semibold ${config.textColor}`}>{config.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{items.length}</span>
                  </div>
                  <p className="text-sm text-gray-600">个推荐志愿</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['reach', 'stable', 'safe'] as TabType[]).map((tier) => {
              const config = tierConfig[tier];
              const items = tier === 'reach' ? reachItems : tier === 'stable' ? stableItems : safeItems;
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTab(tier)}
                  className={`flex-1 py-4 px-6 font-semibold transition-all ${
                    activeTab === tier
                      ? `${config.bgColor} ${config.textColor} border-b-2 border-current`
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <config.icon className="w-5 h-5 mr-2" />
                    {config.label}
                    <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs">
                      {items.length}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {getCurrentItems().length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {getCurrentItems().map(renderItem)}
              </div>
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">暂无该类别的推荐志愿</p>
              </div>
            )}
          </div>
        </div>

        {getCurrentItems().length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">录取概率趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={probabilityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} />
                  <Tooltip
                    formatter={(value: number) => [`${Math.round(value * 100)}%`, '录取概率']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="probability" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">创建志愿方案</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                方案名称
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="请输入方案名称"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-xl mb-6">
              <p className="text-sm text-gray-600">
                已选择 <span className="font-semibold text-blue-600">{selectedItems.length}</span> 个志愿项
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    创建中...
                  </span>
                ) : (
                  '创建方案'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
