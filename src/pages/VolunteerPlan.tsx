import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  Plus,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  ShieldAlert,
  FileWarning,
  BarChart3,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  MapPin,
  Calendar,
  Download,
  Share2,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { plan, university, major } from '@/api/client';
import type { VolunteerPlan as VolunteerPlanType, PlanItem, AnalyzePlanResponse } from '../../shared/types';

interface NameCache {
  universities: Map<number, { name: string; province: string }>;
  majors: Map<number, string>;
}

const tierConfig = {
  reach: { label: '冲', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  stable: { label: '稳', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  safe: { label: '保', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
};

const riskLevelConfig = {
  low: { label: '低风险', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  medium: { label: '中风险', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  high: { label: '高风险', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

export default function VolunteerPlan() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plans, setPlans] = useState<VolunteerPlanType[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<VolunteerPlanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePlanResponse['data'] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [nameCache, setNameCache] = useState<NameCache>({
    universities: new Map(),
    majors: new Map(),
  });
  const [loadingNames, setLoadingNames] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (id && plans.length > 0) {
      const plan = plans.find((p) => p.id === parseInt(id));
      if (plan) {
        setSelectedPlan(plan);
      }
    }
  }, [id, plans]);

  useEffect(() => {
    if (selectedPlan && selectedPlan.items.length > 0) {
      selectedPlan.items.forEach((item) => {
        fetchUniversityInfo(item.universityId);
        fetchMajorName(item.majorId);
      });
    }
  }, [selectedPlan]);

  const fetchUniversityInfo = useCallback(async (id: number) => {
    if (nameCache.universities.has(id)) return;
    if (loadingNames.has(id)) return;

    setLoadingNames((prev) => new Set(prev).add(id));
    try {
      const response = await university.getById(id);
      if (response.success && response.data) {
        setNameCache((prev) => ({
          ...prev,
          universities: new Map(prev.universities).set(id, {
            name: response.data!.name,
            province: response.data!.province,
          }),
        }));
      }
    } catch (err) {
      console.error('获取院校信息失败:', err);
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

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await plan.getList();
      if (response.success && response.data) {
        setPlans(response.data);
      }
    } catch (error) {
      setError('加载方案列表失败');
      console.error('加载方案失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) {
      alert('请输入方案名称');
      return;
    }
    setLoading(true);
    try {
      const response = await plan.create({
        name: newPlanName,
        items: [],
      });
      if (response.success && response.data) {
        setPlans((prev) => [...prev, response.data!]);
        setShowCreateModal(false);
        setNewPlanName('');
        navigate(`/plans/${response.data.id}`);
      }
    } catch (error) {
      console.error('创建方案失败:', error);
      alert('创建方案失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPlan) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await plan.analyze(selectedPlan.id);
      if (response.success && response.data) {
        setAnalysisResult(response.data);
      }
    } catch (error) {
      setError('分析失败，请稍后重试');
      console.error('分析失败:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('确定要删除这个方案吗？')) return;
    try {
      await plan.delete(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
        navigate('/plans');
      }
    } catch (error) {
      console.error('删除方案失败:', error);
      alert('删除方案失败');
    }
  };

  const handleExport = useCallback(async () => {
    if (!selectedPlan) return;
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
      const title = selectedPlan.name;
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      const dateStr = `创建日期: ${new Date(selectedPlan.createdAt).toLocaleDateString('zh-CN')} | 导出日期: ${new Date().toLocaleDateString('zh-CN')}`;
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, (pageWidth - dateWidth) / 2, yPosition);
      yPosition += 15;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('方案概览', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const reachCount = selectedPlan.items.filter((i) => i.tier === 'reach').length;
      const stableCount = selectedPlan.items.filter((i) => i.tier === 'stable').length;
      const safeCount = selectedPlan.items.filter((i) => i.tier === 'safe').length;
      doc.text(`志愿总数: ${selectedPlan.items.length} 所`, margin, yPosition);
      doc.text(`冲: ${reachCount} 所`, margin + 50, yPosition);
      doc.text(`稳: ${stableCount} 所`, margin + 100, yPosition);
      doc.text(`保: ${safeCount} 所`, margin + 150, yPosition);
      yPosition += 7;

      if (selectedPlan.riskLevel) {
        const riskLabel = riskLevelConfig[selectedPlan.riskLevel].label;
        doc.text(`风险等级: ${riskLabel}`, margin, yPosition);
      }
      yPosition += 10;

      if (analysisResult) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('风险分析报告', margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`总体录取概率: ${Math.round(analysisResult.overallProbability * 100)}%`, margin, yPosition);
        yPosition += 6;
        doc.text(`滑档风险: ${Math.round(analysisResult.slipRisk * 100)}%`, margin, yPosition);
        yPosition += 6;
        doc.text(`调剂风险: ${Math.round(analysisResult.adjustmentRisk * 100)}%`, margin, yPosition);
        yPosition += 8;

        if (analysisResult.conflicts.length > 0) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(239, 68, 68);
          doc.text('冲突警告', margin, yPosition);
          yPosition += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          analysisResult.conflicts.forEach((conflict) => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(`- ${conflict}`, margin + 5, yPosition);
            yPosition += 5;
          });
          yPosition += 4;
        }

        if (analysisResult.suggestions.length > 0) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 197, 94);
          doc.text('优化建议', margin, yPosition);
          yPosition += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          analysisResult.suggestions.forEach((suggestion) => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(`- ${suggestion}`, margin + 5, yPosition);
            yPosition += 5;
          });
          yPosition += 4;
        }
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('志愿清单', margin, yPosition);
      yPosition += 12;

      selectedPlan.items.forEach((item: PlanItem, index: number) => {
        if (yPosition > pageHeight - margin - 45) {
          doc.addPage();
          yPosition = margin;
        }

        const uniName = getUniversityName(item.universityId);
        const majorName = getMajorName(item.majorId);
        const province = getUniversityProvince(item.universityId);
        const prob = Math.round(item.probability * 100);
        const config = tierConfig[item.tier];

        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 40, 3, 3, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${item.order}. ${uniName}`, margin + 5, yPosition + 10);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const tierColor = item.tier === 'reach' ? [249, 115, 22] : item.tier === 'stable' ? [59, 130, 246] : [34, 197, 94];
        doc.setTextColor(tierColor[0], tierColor[1], tierColor[2]);
        doc.text(config.label, margin + 5, yPosition + 20);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(`专业: ${majorName}`, margin + 20, yPosition + 20);

        if (province) {
          doc.text(`地区: ${province}`, margin + 20, yPosition + 28);
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const probColor = prob >= 80 ? [34, 197, 94] : prob >= 50 ? [59, 130, 246] : [249, 115, 22];
        doc.setTextColor(probColor[0], probColor[1], probColor[2]);
        doc.text(`${prob}%`, pageWidth - margin - 20, yPosition + 15);

        yPosition += 45;
      });

      doc.save(`${selectedPlan.name}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
      console.error('导出失败:', err);
    } finally {
      setExporting(false);
    }
  }, [selectedPlan, analysisResult, getUniversityName, getMajorName, getUniversityProvince]);

  const handleMoveItem = (itemId: number, direction: 'up' | 'down') => {
    if (!selectedPlan) return;
    const items = [...selectedPlan.items];
    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    items.forEach((item, i) => (item.order = i + 1));

    setSelectedPlan((prev) => (prev ? { ...prev, items } : null));
  };

  const getUniversityName = (universityId: number) => {
    return nameCache.universities.get(universityId)?.name || `大学 ${universityId}`;
  };

  const getMajorName = (majorId: number) => {
    return nameCache.majors.get(majorId) || `专业 ${majorId}`;
  };

  const getUniversityProvince = (universityId: number) => {
    return nameCache.universities.get(universityId)?.province || '';
  };

  const renderLoadingName = (id: number) => {
    if (loadingNames.has(id)) {
      return (
        <span className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          加载中...
        </span>
      );
    }
    return null;
  };

  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/plans')}
              className="flex items-center text-gray-600 hover:text-blue-600 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回方案列表
            </button>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedPlan.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    创建于 {new Date(selectedPlan.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {selectedPlan.items.length} 个志愿
                  </span>
                  {selectedPlan.riskLevel && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        riskLevelConfig[selectedPlan.riskLevel].bgColor
                      } ${riskLevelConfig[selectedPlan.riskLevel].textColor}`}
                    >
                      {riskLevelConfig[selectedPlan.riskLevel].label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || selectedPlan.items.length === 0}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {analyzing ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-5 h-5 mr-2" />
                  )}
                  {analyzing ? '分析中...' : '风险分析'}
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
                  导出方案
                </button>
                <button className="flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-all duration-200">
                  <Share2 className="w-5 h-5 mr-2" />
                  分享
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

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">志愿清单</h2>
                </div>
                {selectedPlan.items.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {selectedPlan.items.map((item: PlanItem) => {
                      const config = tierConfig[item.tier];
                      const isLoadingUni = loadingNames.has(item.universityId);
                      const isLoadingMajor = loadingNames.has(item.majorId);
                      return (
                        <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="text-2xl font-bold text-gray-300">{item.order}</div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {isLoadingUni ? renderLoadingName(item.universityId) : getUniversityName(item.universityId)}
                                  </h3>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
                                  >
                                    {config.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-600 text-sm">
                                  <span className="flex items-center">
                                    <BookOpen className="w-4 h-4 mr-1" />
                                    {isLoadingMajor ? renderLoadingName(item.majorId) : getMajorName(item.majorId)}
                                  </span>
                                  <span className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {getUniversityProvince(item.universityId)}
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    {Math.round(item.probability * 100)}% 录取概率
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleMoveItem(item.id, 'up')}
                                disabled={item.order === 1}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <ChevronUp className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleMoveItem(item.id, 'down')}
                                disabled={item.order === selectedPlan.items.length}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <ChevronDown className="w-5 h-5" />
                              </button>
                              <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <GraduationCap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">暂无志愿项</p>
                    <button
                      onClick={() => navigate('/recommend')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      去添加志愿
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {analysisResult && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">风险分析报告</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">总体录取概率</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {Math.round(analysisResult.overallProbability * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${analysisResult.overallProbability * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-xl">
                      <div className="flex items-center mb-3">
                        <ShieldAlert className="w-5 h-5 text-orange-600 mr-2" />
                        <span className="font-medium text-orange-800">滑档风险</span>
                        <span className="ml-auto text-xl font-bold text-orange-600">
                          {Math.round(analysisResult.slipRisk * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${analysisResult.slipRisk * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-xl">
                      <div className="flex items-center mb-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="font-medium text-yellow-800">调剂风险</span>
                        <span className="ml-auto text-xl font-bold text-yellow-600">
                          {Math.round(analysisResult.adjustmentRisk * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${analysisResult.adjustmentRisk * 100}%` }}
                        />
                      </div>
                    </div>

                    {analysisResult.conflicts.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-xl">
                        <div className="flex items-start">
                          <FileWarning className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                          <div>
                            <span className="font-medium text-red-800 block mb-2">冲突警告</span>
                            <ul className="space-y-1">
                              {analysisResult.conflicts.map((conflict, index) => (
                                <li key={index} className="text-sm text-red-700">
                                  • {conflict}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {analysisResult.suggestions.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-xl">
                        <div className="flex items-start">
                          <ArrowUpDown className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                          <div>
                            <span className="font-medium text-green-800 block mb-2">优化建议</span>
                            <ul className="space-y-1">
                              {analysisResult.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm text-green-700">
                                  • {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">梯度统计</h3>
                <div className="space-y-3">
                  {(['reach', 'stable', 'safe'] as const).map((tier) => {
                    const config = tierConfig[tier];
                    const count = selectedPlan.items.filter((item) => item.tier === tier).length;
                    return (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span
                            className={`w-3 h-3 rounded-full mr-2 ${
                              tier === 'reach' ? 'bg-orange-500' : tier === 'stable' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                          />
                          <span className="text-gray-700">{config.label}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{count} 所</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">我的志愿方案</h1>
            <p className="text-gray-600">管理和查看您的所有志愿方案</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            创建新方案
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">正在加载方案列表...</p>
          </div>
        ) : plans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/plans/${p.id}`)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlan(p.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {p.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {p.items.length} 个志愿
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {p.riskLevel && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        riskLevelConfig[p.riskLevel].bgColor
                      } ${riskLevelConfig[p.riskLevel].textColor}`}
                    >
                      {riskLevelConfig[p.riskLevel].label}
                    </span>
                  )}
                  <div className="flex gap-1">
                    {p.items.slice(0, 3).map((item, index) => (
                      <span
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          item.tier === 'reach'
                            ? 'bg-orange-500'
                            : item.tier === 'stable'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <GraduationCap className="w-20 h-20 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无志愿方案</h3>
            <p className="text-gray-600 mb-6">创建您的第一个志愿方案，开始规划未来</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                创建新方案
              </button>
              <button
                onClick={() => navigate('/recommend')}
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all"
              >
                智能推荐
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">创建新方案</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                方案名称
              </label>
              <input
                type="text"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="例如：2024年本科志愿方案"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
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
                  '创建'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
