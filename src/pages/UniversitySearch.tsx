import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Building2,
  GitCompare,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  Briefcase,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { university, major, admissionScore } from '@/api/client';
import type { University, Major } from '../../shared/types';

const levels = ['全部', '985', '211', '双一流', '普通本科'];
const provinces = [
  '全部', '北京', '天津', '河北', '山西', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '陕西', '甘肃', '新疆',
];
const types = ['全部', '综合', '理工', '师范', '医药', '财经', '政法', '农林', '艺术'];

interface ScoreTrendItem {
  year: number;
  major: Major;
  minScore: number;
  minRank?: number;
}

export default function UniversitySearch() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [universityMajors, setUniversityMajors] = useState<Major[]>([]);
  const [scoreTrend, setScoreTrend] = useState<ScoreTrendItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('全部');
  const [selectedProvince, setSelectedProvince] = useState('全部');
  const [selectedType, setSelectedType] = useState('全部');
  const [showFilters, setShowFilters] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUniversities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        pageSize: 50,
      };
      if (searchKeyword) params.keyword = searchKeyword;
      if (selectedLevel !== '全部') params.level = selectedLevel;
      if (selectedProvince !== '全部') params.province = selectedProvince;
      if (selectedType !== '全部') params.type = selectedType;

      const response = await university.search(params);
      if (response.success && response.data) {
        setUniversities(response.data.items);
      } else {
        setUniversities([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取院校列表失败');
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, selectedLevel, selectedProvince, selectedType]);

  const fetchUniversityDetail = useCallback(async (universityId: number) => {
    setDetailLoading(true);
    setError(null);
    try {
      const [uniResponse, majorsResponse, scoresResponse] = await Promise.all([
        university.getById(universityId),
        major.getByUniversity(universityId),
        admissionScore.getTrend(universityId),
      ]);

      if (uniResponse.success && uniResponse.data) {
        setSelectedUniversity(uniResponse.data);
      } else {
        setError('获取院校详情失败');
      }

      if (majorsResponse.success && majorsResponse.data) {
        setUniversityMajors(majorsResponse.data);
      } else {
        setUniversityMajors([]);
      }

      if (scoresResponse.success && scoresResponse.data) {
        setScoreTrend(scoresResponse.data);
      } else {
        setScoreTrend([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取院校详情失败');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  useEffect(() => {
    if (id) {
      fetchUniversityDetail(parseInt(id));
    }
  }, [id, fetchUniversityDetail]);

  const handleCompareToggle = (uniId: number) => {
    setCompareIds((prev) =>
      prev.includes(uniId)
        ? prev.filter((id) => id !== uniId)
        : prev.length < 3
        ? [...prev, uniId]
        : prev
    );
  };

  const handleCompare = () => {
    if (compareIds.length >= 2) {
      navigate('/compare', { state: { universityIds: compareIds } });
    }
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

  if (id && (selectedUniversity || detailLoading)) {
    if (detailLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">加载院校详情...</p>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedUniversity) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => {
                setSelectedUniversity(null);
                navigate('/universities');
              }}
              className="flex items-center text-gray-600 hover:text-blue-600 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回列表
            </button>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <GraduationCap className="w-20 h-20 mx-auto text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">未找到该院校</h3>
              <p className="text-gray-600 mb-4">{error || '请返回列表重新选择'}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => {
                setSelectedUniversity(null);
                navigate('/universities');
              }}
              className="flex items-center text-gray-600 hover:text-blue-600 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回列表
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {selectedUniversity.name}
                      </h1>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeColor(
                          selectedUniversity.level
                        )}`}
                      >
                        {selectedUniversity.level}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {selectedUniversity.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-gray-600">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedUniversity.province} {selectedUniversity.city}
                      </span>
                      <span className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        {selectedUniversity.masterPoints} 个硕士点
                      </span>
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {selectedUniversity.doctorPoints} 个博士点
                      </span>
                      <span className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {selectedUniversity.employmentRate}% 就业率
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCompareToggle(selectedUniversity.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    compareIds.includes(selectedUniversity.id)
                      ? 'bg-blue-600 text-white'
                      : 'border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  <GitCompare className="w-5 h-5 mr-2 inline" />
                  {compareIds.includes(selectedUniversity.id) ? '已加入对比' : '加入对比'}
                </button>
              </div>
              <p className="mt-6 text-gray-600 leading-relaxed">
                {selectedUniversity.description}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {selectedUniversity.masterPoints}
                    </div>
                    <div className="text-gray-500">硕士学位授权点</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {selectedUniversity.doctorPoints}
                    </div>
                    <div className="text-gray-500">博士学位授权点</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {selectedUniversity.employmentRate}%
                    </div>
                    <div className="text-gray-500">毕业生就业率</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">历年投档线</h2>
              </div>
              <div className="p-6">
                {scoreTrend.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">年份</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">专业</th>
                          <th className="text-center py-3 px-4 text-gray-600 font-medium">最低分</th>
                          <th className="text-center py-3 px-4 text-gray-600 font-medium">最低位次</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scoreTrend.map((score, index) => (
                          <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-4 px-4 text-gray-900">{score.year}</td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900">
                                {score.major.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {score.major.category}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-xl font-bold text-blue-600">
                                {score.minScore}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center text-gray-900">
                              {score.minRank || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">暂无投档线数据</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">开设专业</h2>
              </div>
              <div className="p-6">
                {universityMajors.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {universityMajors.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{m.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {m.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>{m.category}</span>
                          <span>就业率 {m.employmentRate}%</span>
                          <span>¥{m.avgSalary}/月</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {m.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">暂无专业数据</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {compareIds.length >= 2 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 flex items-center gap-4 z-40">
            <span className="text-gray-600">
              已选择 {compareIds.length} 所院校进行对比
            </span>
            <button
              onClick={handleCompare}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              开始对比
            </button>
            <button
              onClick={() => setCompareIds([])}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              清空
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">院校查询</h1>
          <p className="text-gray-600">搜索和了解全国各高校的详细信息</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索院校名称..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              筛选
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </button>
            {compareIds.length >= 2 && (
              <button
                onClick={handleCompare}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <GitCompare className="w-5 h-5 mr-2" />
                对比 ({compareIds.length})
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  院校层次
                </label>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedLevel === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所在省份
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  院校类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchUniversities}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {universities.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {universities.map((uni) => (
                  <div
                    key={uni.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompareToggle(uni.id);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          compareIds.includes(uni.id)
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                      >
                        <GitCompare className="w-5 h-5" />
                      </button>
                    </div>
                    <div
                      onClick={() => navigate(`/universities/${uni.id}`)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {uni.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(
                            uni.level
                          )}`}
                        >
                          {uni.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {uni.province}
                        </span>
                        <span className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1" />
                          {uni.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center text-gray-600">
                            <Award className="w-4 h-4 mr-1 text-purple-500" />
                            {uni.masterPoints} 硕
                          </span>
                          <span className="flex items-center text-gray-600">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            {uni.doctorPoints} 博
                          </span>
                        </div>
                        <div className="flex items-center text-green-600 font-medium">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {uni.employmentRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                <GraduationCap className="w-20 h-20 mx-auto text-gray-300 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">未找到匹配的院校</h3>
                <p className="text-gray-600">请尝试调整搜索条件或筛选条件</p>
              </div>
            )}
          </>
        )}
      </div>

      {compareIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 flex items-center gap-4 z-40">
          <span className="text-gray-600">
            已选择 {compareIds.length} 所院校进行对比
          </span>
          <button
            onClick={handleCompare}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            开始对比
          </button>
          <button
            onClick={() => setCompareIds([])}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            清空
          </button>
        </div>
      )}
    </div>
  );
}
