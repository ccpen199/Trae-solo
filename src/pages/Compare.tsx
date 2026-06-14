import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Building2,
  Award,
  Star,
  Briefcase,
  BookOpen,
  DollarSign,
  Check,
  X,
  GitCompare,
  Plus,
  TrendingUp,
  Search,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { university, major, admissionScore } from '@/api/client';
import type { University, Major } from '../../shared/types';

type CompareMode = 'university' | 'major';

interface ScoreTrendItem {
  year: string;
  [key: string]: string | number;
}

const lineColors = ['#3b82f6', '#8b5cf6', '#ec4899'];

export default function Compare() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<CompareMode>('university');
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<number[]>([]);
  const [selectedMajorIds, setSelectedMajorIds] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<University[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<Major[]>([]);
  const [scoreTrendData, setScoreTrendData] = useState<ScoreTrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { universityIds?: number[] } | null;
    if (state?.universityIds) {
      setSelectedUniversityIds(state.universityIds);
    }
  }, [location.state]);

  const fetchUniversities = useCallback(async (keyword?: string) => {
    setSearchLoading(true);
    setError(null);
    try {
      const response = await university.getList({
        keyword: keyword || undefined,
        page: 1,
        pageSize: 50,
      });
      if (response.success && response.data) {
        setUniversities(response.data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取院校列表失败');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const fetchMajors = useCallback(async (keyword?: string) => {
    setSearchLoading(true);
    setError(null);
    try {
      const response = await major.getList({
        keyword: keyword || undefined,
        page: 1,
        pageSize: 50,
      });
      if (response.success && response.data) {
        setMajors(response.data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取专业列表失败');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const fetchUniversityDetails = useCallback(async (ids: number[]) => {
    if (ids.length === 0) {
      setSelectedUniversities([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await university.compare(ids);
      if (response.success && response.data) {
        setSelectedUniversities(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取院校详情失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMajorDetails = useCallback(async (ids: number[]) => {
    if (ids.length === 0) {
      setSelectedMajors([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await major.compare(ids);
      if (response.success && response.data) {
        setSelectedMajors(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取专业详情失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScoreTrend = useCallback(async (uniIds: number[]) => {
    if (uniIds.length === 0) {
      setScoreTrendData([]);
      return;
    }

    setTrendLoading(true);
    try {
      const allTrends: ScoreTrendItem[] = [];
      const yearMap = new Map<string, ScoreTrendItem>();

      for (let i = 0; i < uniIds.length; i++) {
        const uniId = uniIds[i];
        const uni = selectedUniversities.find((u) => u.id === uniId);
        if (!uni) continue;

        try {
          const trendResponse = await admissionScore.getTrend(uniId);
          if (trendResponse.success && trendResponse.data) {
            trendResponse.data.forEach((item) => {
              const yearKey = String(item.year);
              if (!yearMap.has(yearKey)) {
                yearMap.set(yearKey, { year: yearKey });
              }
              const yearData = yearMap.get(yearKey)!;
              yearData[uni.name] = item.minScore;
            });
          }
        } catch (err) {
          console.error(`获取院校 ${uniId} 分数线趋势失败:`, err);
        }
      }

      const sortedYears = Array.from(yearMap.keys()).sort();
      sortedYears.forEach((year) => {
        allTrends.push(yearMap.get(year)!);
      });

      setScoreTrendData(allTrends);
    } catch (err) {
      console.error('获取分数线趋势失败:', err);
    } finally {
      setTrendLoading(false);
    }
  }, [selectedUniversities]);

  useEffect(() => {
    if (mode === 'university') {
      fetchUniversities();
    } else {
      fetchMajors();
    }
  }, [mode, fetchUniversities, fetchMajors]);

  useEffect(() => {
    if (mode === 'university') {
      fetchUniversityDetails(selectedUniversityIds);
    } else {
      fetchMajorDetails(selectedMajorIds);
    }
  }, [mode, selectedUniversityIds, selectedMajorIds, fetchUniversityDetails, fetchMajorDetails]);

  useEffect(() => {
    if (mode === 'university' && selectedUniversities.length > 0) {
      fetchScoreTrend(selectedUniversityIds);
    }
  }, [mode, selectedUniversities, selectedUniversityIds, fetchScoreTrend]);

  const handleSearch = () => {
    if (mode === 'university') {
      fetchUniversities(searchKeyword);
    } else {
      fetchMajors(searchKeyword);
    }
  };

  const handleToggleUniversity = (id: number) => {
    setSelectedUniversityIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const handleToggleMajor = (id: number) => {
    setSelectedMajorIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case '985':
        return 'bg-red-100 text-red-700';
      case '211':
        return 'bg-orange-100 text-orange-700';
      case '双一流':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderUniversityComparison = () => {
    if (selectedUniversities.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <GitCompare className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">请选择要对比的院校</h3>
          <p className="text-gray-600 mb-6">最多可以选择3所院校进行对比</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            添加院校
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">正在加载院校详情...</p>
        </div>
      );
    }

    const comparisonRows = [
      { label: '院校层次', icon: Award, key: 'level', format: (v: string) => v },
      { label: '院校类型', icon: Building2, key: 'type', format: (v: string) => v },
      { label: '所在省份', icon: MapPin, key: 'province', format: (v: string) => v },
      { label: '硕士点数', icon: Award, key: 'masterPoints', format: (v: number) => `${v} 个` },
      { label: '博士点数', icon: Star, key: 'doctorPoints', format: (v: number) => `${v} 个` },
      { label: '就业率', icon: Briefcase, key: 'employmentRate', format: (v: number) => `${v}%` },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-6 px-6 w-48">
                    <span className="text-gray-600 font-medium">对比项</span>
                  </th>
                  {selectedUniversities.map((uni) => (
                    <th key={uni.id} className="text-center py-6 px-6 min-w-48">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-lg font-bold text-gray-900 mb-1">{uni.name}</div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(
                          uni.level
                        )}`}
                      >
                        {uni.level}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonRows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-5 px-6">
                      <div className="flex items-center text-gray-700">
                        <row.icon className="w-5 h-5 mr-3 text-gray-400" />
                        <span className="font-medium">{row.label}</span>
                      </div>
                    </td>
                    {selectedUniversities.map((uni) => (
                      <td key={uni.id} className="text-center py-5 px-6">
                        <span className="text-gray-900 font-medium">
                          {row.format((uni as unknown as Record<string, unknown>)[row.key] as never)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            投档线趋势对比
          </h3>
          {trendLoading ? (
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : scoreTrendData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {selectedUniversities.map((uni, index) => (
                    <Line
                      key={uni.id}
                      type="monotone"
                      dataKey={uni.name}
                      stroke={lineColors[index]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p>暂无投档线趋势数据</p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            添加对比院校
          </button>
          <button
            onClick={() => setSelectedUniversityIds([])}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-red-500 hover:text-red-600 transition-colors"
          >
            清空对比
          </button>
        </div>
      </div>
    );
  };

  const renderMajorComparison = () => {
    if (selectedMajors.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <GitCompare className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">请选择要对比的专业</h3>
          <p className="text-gray-600 mb-6">最多可以选择3个专业进行对比</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            添加专业
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">正在加载专业详情...</p>
        </div>
      );
    }

    const comparisonRows = [
      { label: '专业代码', icon: BookOpen, key: 'code', format: (v: string) => v },
      { label: '学科门类', icon: BookOpen, key: 'category', format: (v: string) => v },
      { label: '就业率', icon: Briefcase, key: 'employmentRate', format: (v: number) => `${v}%` },
      { label: '平均薪资', icon: DollarSign, key: 'avgSalary', format: (v: number) => `¥${v}/月` },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-6 px-6 w-48">
                    <span className="text-gray-600 font-medium">对比项</span>
                  </th>
                  {selectedMajors.map((m) => (
                    <th key={m.id} className="text-center py-6 px-6 min-w-48">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-lg font-bold text-gray-900 mb-1">{m.name}</div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {m.category}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonRows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-5 px-6">
                      <div className="flex items-center text-gray-700">
                        <row.icon className="w-5 h-5 mr-3 text-gray-400" />
                        <span className="font-medium">{row.label}</span>
                      </div>
                    </td>
                    {selectedMajors.map((m) => (
                      <td key={m.id} className="text-center py-5 px-6">
                        <span className="text-gray-900 font-medium">
                          {row.format((m as unknown as Record<string, unknown>)[row.key] as never)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="hover:bg-gray-50">
                  <td className="py-5 px-6">
                    <div className="flex items-center text-gray-700">
                      <BookOpen className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="font-medium">选科要求</span>
                    </div>
                  </td>
                  {selectedMajors.map((m) => (
                    <td key={m.id} className="text-center py-5 px-6">
                      <div className="flex flex-wrap justify-center gap-1">
                        {m.subjectRequirements.map((sub, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-5 px-6 align-top">
                    <div className="flex items-center text-gray-700">
                      <BookOpen className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="font-medium">主要课程</span>
                    </div>
                  </td>
                  {selectedMajors.map((m) => (
                    <td key={m.id} className="text-center py-5 px-6">
                      <div className="flex flex-col gap-1">
                        {m.courses.map((course, idx) => (
                          <span key={idx} className="text-sm text-gray-600">
                            {course}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            添加对比专业
          </button>
          <button
            onClick={() => setSelectedMajorIds([])}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-red-500 hover:text-red-600 transition-colors"
          >
            清空对比
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-blue-600 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">对比矩阵</h1>
              <p className="text-gray-600">多维度对比分析，帮助您做出更明智的选择</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setMode('university')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  mode === 'university'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                院校对比
              </button>
              <button
                onClick={() => setMode('major')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  mode === 'major'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                专业对比
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {mode === 'university' ? renderUniversityComparison() : renderMajorComparison()}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              选择要对比的{mode === 'university' ? '院校' : '专业'}
            </h3>

            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={`搜索${mode === 'university' ? '院校' : '专业'}...`}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {searchLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              已选择 {mode === 'university' ? selectedUniversityIds.length : selectedMajorIds.length} / 3
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : mode === 'university' ? (
                universities.length > 0 ? (
                  universities.map((uni) => (
                    <div
                      key={uni.id}
                      onClick={() => handleToggleUniversity(uni.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedUniversityIds.includes(uni.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{uni.name}</div>
                            <div className="text-sm text-gray-500">
                              {uni.province} · {uni.level} · {uni.type}
                            </div>
                          </div>
                        </div>
                        {selectedUniversityIds.includes(uni.id) && (
                          <Check className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    暂无匹配的院校
                  </div>
                )
              ) : majors.length > 0 ? (
                majors.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMajor(m.id)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedMajorIds.includes(m.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{m.name}</div>
                          <div className="text-sm text-gray-500">
                            {m.category} · 就业率 {m.employmentRate}% · ¥{m.avgSalary}/月
                          </div>
                        </div>
                      </div>
                      {selectedMajorIds.includes(m.id) && (
                        <Check className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  暂无匹配的专业
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
