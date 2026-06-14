import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  User,
  BookOpen,
  Brain,
  Sliders,
  Sparkles,
  ArrowRight,
  Check,
  MapPin,
} from 'lucide-react';
import { recommend } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { GenerateRecommendRequest, StudentProfile, AssessmentResult } from '../../shared/types';

const steps = [
  { id: 1, name: '基本信息', icon: User },
  { id: 2, name: '选科组合', icon: BookOpen },
  { id: 3, name: '兴趣测评', icon: Brain },
  { id: 4, name: '偏好设置', icon: Sliders },
  { id: 5, name: '推荐结果', icon: Sparkles },
];

const provinces = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆',
];

const subjects = ['物理', '化学', '生物', '历史', '地理', '政治'];

const hollandQuestions = [
  { question: '我喜欢动手操作和使用工具', trait: 'R' },
  { question: '我喜欢探索和研究未知的事物', trait: 'I' },
  { question: '我喜欢艺术创作和表达', trait: 'A' },
  { question: '我喜欢帮助他人和服务社会', trait: 'S' },
  { question: '我喜欢领导和影响他人', trait: 'E' },
  { question: '我喜欢有条理地处理事务', trait: 'C' },
];

const mbtiQuestions = [
  { question: '在社交场合中，我通常', options: ['E: 主动与他人交流', 'I: 等待他人来找我'] },
  { question: '获取信息时，我更关注', options: ['S: 具体的事实和细节', 'N: 整体的模式和意义'] },
  { question: '做决策时，我更依赖', options: ['T: 逻辑分析和客观标准', 'F: 价值观和对他人的影响'] },
  { question: '对待生活，我更倾向于', options: ['J: 有计划、有条理', 'P: 灵活应变、保持开放'] },
];

const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '重庆', '天津', '苏州'];

export default function Recommend() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<Partial<StudentProfile>>({
    score: undefined,
    rank: undefined,
    province: '',
    subjects: [],
    batch: '本科批',
    targetCities: [],
  });

  const [hollandAnswers, setHollandAnswers] = useState<Record<string, number>>({});
  const [mbtiAnswers, setMbtiAnswers] = useState<Record<number, number>>({});

  const [preferences, setPreferences] = useState({
    universityWeight: 25,
    majorWeight: 25,
    cityWeight: 25,
    employmentWeight: 25,
    familyWishes: '',
  });

  const handleSubjectToggle = (subject: string) => {
    setProfile((prev) => ({
      ...prev,
      subjects: prev.subjects?.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...(prev.subjects || []), subject],
    }));
  };

  const handleCityToggle = (city: string) => {
    setProfile((prev) => ({
      ...prev,
      targetCities: prev.targetCities?.includes(city)
        ? prev.targetCities.filter((c) => c !== city)
        : [...(prev.targetCities || []), city],
    }));
  };

  const handleHollandAnswer = (trait: string, value: number) => {
    setHollandAnswers((prev) => ({ ...prev, [trait]: (prev[trait] || 0) + value }));
  };

  const calculateHolland = () => {
    const baseScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    Object.entries(hollandAnswers).forEach(([trait, score]) => {
      baseScores[trait as keyof typeof baseScores] = score;
    });
    return baseScores;
  };

  const calculateMbti = () => {
    const dimensions = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    Object.entries(mbtiAnswers).forEach(([, value]) => {
      const question = mbtiQuestions[parseInt(value as unknown as string)];
      if (question) {
        const option = question.options[value as unknown as number];
        if (option) {
          const code = option.split(':')[0];
          dimensions[code as keyof typeof dimensions]++;
        }
      }
    });
    return (
      (dimensions.E >= dimensions.I ? 'E' : 'I') +
      (dimensions.S >= dimensions.N ? 'S' : 'N') +
      (dimensions.T >= dimensions.F ? 'T' : 'F') +
      (dimensions.J >= dimensions.P ? 'J' : 'P')
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const assessment: AssessmentResult = {
        id: 0,
        userId: user?.id || 0,
        holland: calculateHolland(),
        mbti: calculateMbti(),
        createdAt: new Date().toISOString(),
      };

      const requestData: GenerateRecommendRequest = {
        profile: {
          ...profile,
          id: 0,
          userId: user?.id || 0,
          score: profile.score || 0,
          rank: profile.rank || 0,
          province: profile.province || '',
          subjects: profile.subjects || [],
          batch: profile.batch || '本科批',
          targetCities: profile.targetCities || [],
          createdAt: new Date().toISOString(),
        },
        assessment,
        preferences,
      };

      const response = await recommend.generate(requestData);
      if (response.success && response.data) {
        navigate('/recommend/result', { state: response.data });
      }
    } catch (error) {
      console.error('推荐生成失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profile.score && profile.rank && profile.province;
      case 2:
        return profile.subjects && profile.subjects.length >= 3;
      case 3:
        return Object.keys(hollandAnswers).length >= 6 && Object.keys(mbtiAnswers).length >= 4;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  高考分数
                </label>
                <input
                  type="number"
                  value={profile.score || ''}
                  onChange={(e) => setProfile((prev) => ({ ...prev, score: parseInt(e.target.value) }))}
                  placeholder="请输入您的高考分数"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  全省位次
                </label>
                <input
                  type="number"
                  value={profile.rank || ''}
                  onChange={(e) => setProfile((prev) => ({ ...prev, rank: parseInt(e.target.value) }))}
                  placeholder="请输入您的全省位次"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所在省份
              </label>
              <select
                value={profile.province}
                onChange={(e) => setProfile((prev) => ({ ...prev, province: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">请选择您所在的省份</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标城市（可多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCityToggle(city)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center ${
                      profile.targetCities?.includes(city)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                选择您的选考科目（至少选择3门）
              </label>
              <div className="grid grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => handleSubjectToggle(subject)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      profile.subjects?.includes(subject)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{subject}</div>
                    {profile.subjects?.includes(subject) && (
                      <Check className="w-5 h-5 mx-auto mt-2 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm">
                <strong>提示：</strong>选考科目直接影响您可报考的专业范围，
                请根据实际情况准确选择。部分专业对选考科目有特定要求。
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">霍兰德职业兴趣测评</h3>
              <p className="text-gray-600 mb-4">请根据您的实际情况，对以下描述进行评分（1-5分，1=非常不同意，5=非常同意）</p>
              <div className="space-y-4">
                {hollandQuestions.map((q, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-800 mb-3">{q.question}</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleHollandAnswer(q.trait, value)}
                          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                            hollandAnswers[q.trait] === value
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">MBTI 性格测评简版</h3>
              <p className="text-gray-600 mb-4">请选择最符合您的选项</p>
              <div className="space-y-4">
                {mbtiQuestions.map((q, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-800 mb-3">{q.question}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((option, optIndex) => (
                        <button
                          key={optIndex}
                          type="button"
                          onClick={() => setMbtiAnswers((prev) => ({ ...prev, [index]: optIndex }))}
                          className={`p-3 rounded-lg text-left transition-all ${
                            mbtiAnswers[index] === optIndex
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">志愿偏好权重设置</h3>
              <p className="text-gray-600 mb-6">
                请调整以下因素的权重，总权重为100%。系统将根据您的偏好生成更符合您期望的推荐结果。
              </p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">院校层次</label>
                    <span className="text-sm font-semibold text-blue-600">{preferences.universityWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.universityWeight}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setPreferences((prev) => {
                        const total = value + prev.majorWeight + prev.cityWeight + prev.employmentWeight;
                        const diff = total - 100;
                        return {
                          ...prev,
                          universityWeight: value,
                          majorWeight: Math.max(0, prev.majorWeight - diff / 3),
                          cityWeight: Math.max(0, prev.cityWeight - diff / 3),
                          employmentWeight: Math.max(0, prev.employmentWeight - diff / 3),
                        };
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">专业兴趣</label>
                    <span className="text-sm font-semibold text-blue-600">{Math.round(preferences.majorWeight)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.majorWeight}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setPreferences((prev) => {
                        const total = prev.universityWeight + value + prev.cityWeight + prev.employmentWeight;
                        const diff = total - 100;
                        return {
                          ...prev,
                          majorWeight: value,
                          universityWeight: Math.max(0, prev.universityWeight - diff / 3),
                          cityWeight: Math.max(0, prev.cityWeight - diff / 3),
                          employmentWeight: Math.max(0, prev.employmentWeight - diff / 3),
                        };
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">城市偏好</label>
                    <span className="text-sm font-semibold text-blue-600">{Math.round(preferences.cityWeight)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.cityWeight}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setPreferences((prev) => {
                        const total = prev.universityWeight + prev.majorWeight + value + prev.employmentWeight;
                        const diff = total - 100;
                        return {
                          ...prev,
                          cityWeight: value,
                          universityWeight: Math.max(0, prev.universityWeight - diff / 3),
                          majorWeight: Math.max(0, prev.majorWeight - diff / 3),
                          employmentWeight: Math.max(0, prev.employmentWeight - diff / 3),
                        };
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">就业前景</label>
                    <span className="text-sm font-semibold text-blue-600">{Math.round(preferences.employmentWeight)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.employmentWeight}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setPreferences((prev) => {
                        const total = prev.universityWeight + prev.majorWeight + prev.cityWeight + value;
                        const diff = total - 100;
                        return {
                          ...prev,
                          employmentWeight: value,
                          universityWeight: Math.max(0, prev.universityWeight - diff / 3),
                          majorWeight: Math.max(0, prev.majorWeight - diff / 3),
                          cityWeight: Math.max(0, prev.cityWeight - diff / 3),
                        };
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                家庭期望（选填）
              </label>
              <textarea
                value={preferences.familyWishes}
                onChange={(e) => setPreferences((prev) => ({ ...prev, familyWishes: e.target.value }))}
                placeholder="如有家庭期望或特殊要求，请在此说明..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">智能志愿推荐</h1>
          <p className="text-gray-600">完成以下步骤，获取个性化的志愿填报建议</p>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`mt-3 text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            步骤 {currentStep}: {steps[currentStep - 1]?.name}
          </h2>
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            上一步
          </button>
          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
              disabled={!canProceed()}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              下一步
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {loading ? '生成中...' : '生成推荐'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
