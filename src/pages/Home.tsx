import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Brain,
  Target,
  GitCompare,
  Users,
  MessageCircle,
  Video,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Zap,
  MapPin,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Heart,
  Sparkles,
  Check,
} from 'lucide-react';
import { recommend } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { GenerateRecommendRequest, StudentProfile, AssessmentResult } from '../../shared/types';

const subjects = ['物理', '化学', '生物', '历史', '地理', '政治'];

const provinces = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆',
];

const majorCategories = [
  { value: '工学', label: '工学', description: '工程技术类专业' },
  { value: '理学', label: '理学', description: '自然科学类专业' },
  { value: '医学', label: '医学', description: '医药卫生类专业' },
  { value: '文学', label: '文学', description: '语言文化类专业' },
  { value: '经济学', label: '经济学', description: '经济金融类专业' },
  { value: '管理学', label: '管理学', description: '管理类专业' },
  { value: '法学', label: '法学', description: '法律法学类专业' },
  { value: '教育学', label: '教育学', description: '教育类专业' },
];

const targetCities = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都',
  '西安', '重庆', '天津', '苏州', '长沙', '郑州', '青岛', '大连',
  '宁波', '厦门', '合肥', '福州', '济南', '昆明', '贵阳', '哈尔滨',
  '长春', '沈阳', '南昌', '南宁', '兰州', '乌鲁木齐',
];

const hollandQuestions = [
  { question: '我喜欢动手操作和使用工具、机械', trait: 'R', label: '实际型' },
  { question: '我喜欢探索研究未知的事物和现象', trait: 'I', label: '研究型' },
  { question: '我喜欢艺术创作和自由表达', trait: 'A', label: '艺术型' },
  { question: '我喜欢帮助他人和服务社会', trait: 'S', label: '社会型' },
  { question: '我喜欢领导团队和影响他人', trait: 'E', label: '企业型' },
  { question: '我喜欢有条理地处理数据和事务', trait: 'C', label: '常规型' },
];

const mbtiDimensions = [
  {
    dimension: 'EI',
    question: '在社交场合中，你通常：',
    options: [
      { value: 'E', label: '外向', description: '主动与他人交流，精力充沛' },
      { value: 'I', label: '内向', description: '独处时更自在，深度思考' },
    ],
  },
  {
    dimension: 'SN',
    question: '获取信息时，你更关注：',
    options: [
      { value: 'S', label: '感觉', description: '具体事实和细节，现实可行' },
      { value: 'N', label: '直觉', description: '整体模式和意义，创新可能' },
    ],
  },
  {
    dimension: 'TF',
    question: '做决策时，你更依赖：',
    options: [
      { value: 'T', label: '思考', description: '逻辑分析和客观标准' },
      { value: 'F', label: '情感', description: '价值观和对他人的影响' },
    ],
  },
  {
    dimension: 'JP',
    question: '对待生活，你更倾向于：',
    options: [
      { value: 'J', label: '判断', description: '有计划、有条理、提前准备' },
      { value: 'P', label: '感知', description: '灵活应变、保持开放、即兴发挥' },
    ],
  },
];

const features = [
  {
    icon: Brain,
    title: '智能推荐',
    description: '基于AI算法，结合分数、位次、兴趣，精准推荐院校和专业',
    path: '/recommend',
    actionText: '立即体验',
  },
  {
    icon: Target,
    title: '冲稳保方案',
    description: '科学梯度设计，最大化录取概率，降低滑档风险',
    path: '/recommend/result',
    actionText: '查看示例',
  },
  {
    icon: GitCompare,
    title: '院校对比',
    description: '多维度对比分析，层次、类型、投档线、就业一目了然',
    path: '/compare',
    actionText: '开始对比',
  },
  {
    icon: Users,
    title: '协作空间',
    description: '邀请老师、家长共同参与，多人协作填报志愿',
    path: '/collaboration',
    actionText: '创建空间',
  },
  {
    icon: MessageCircle,
    title: '问答社区',
    description: '专家在线答疑，解决选科、志愿、政策各类问题',
    path: '/qa',
    actionText: '提问专家',
  },
  {
    icon: Video,
    title: '直播答疑',
    description: '资深专家直播讲解，实时互动解答志愿填报疑问',
    path: '/live',
    actionText: '查看直播',
  },
];

const stats = [
  { value: '2800+', label: '高校数据', icon: GraduationCap },
  { value: '1600+', label: '专业信息', icon: BookOpen },
  { value: '98%', label: '录取准确率', icon: Award },
];

interface QuickFillData {
  profile: Partial<StudentProfile>;
  assessment: Partial<AssessmentResult>;
  preferences: {
    universityWeight: number;
    majorWeight: number;
    cityWeight: number;
    employmentWeight: number;
    familyWishes?: string;
  };
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [score, setScore] = useState('');
  const [rank, setRank] = useState('');
  const [province, setProvince] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTargetCities, setSelectedTargetCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showAssessment, setShowAssessment] = useState(false);
  const [showFamilyWishes, setShowFamilyWishes] = useState(false);

  const [hollandScores, setHollandScores] = useState<Record<string, number>>({});
  const [mbtiSelections, setMbtiSelections] = useState<Record<string, string>>({});

  const [familyMajors, setFamilyMajors] = useState<string[]>([]);
  const [familyCities, setFamilyCities] = useState<string[]>([]);
  const [familySpecialRequirements, setFamilySpecialRequirements] = useState('');

  const handleStartFill = () => {
    navigate('/recommend');
  };

  const calculateMbti = (): string => {
    const e = mbtiSelections['EI'] || 'I';
    const s = mbtiSelections['SN'] || 'S';
    const t = mbtiSelections['TF'] || 'T';
    const j = mbtiSelections['JP'] || 'J';
    return e + s + t + j;
  };

  const getHollandScores = (): { R: number; I: number; A: number; S: number; E: number; C: number } => {
    return {
      R: hollandScores['R'] || 3,
      I: hollandScores['I'] || 3,
      A: hollandScores['A'] || 3,
      S: hollandScores['S'] || 3,
      E: hollandScores['E'] || 3,
      C: hollandScores['C'] || 3,
    };
  };

  const isAssessmentComplete = (): boolean => {
    const hollandComplete = Object.keys(hollandScores).length === 6;
    const mbtiComplete = Object.keys(mbtiSelections).length === 4;
    return hollandComplete && mbtiComplete;
  };

  const getFamilyWishesText = (): string => {
    const parts: string[] = [];
    if (familyMajors.length > 0) {
      parts.push(`期望专业方向：${familyMajors.join('、')}`);
    }
    if (familyCities.length > 0) {
      parts.push(`期望城市：${familyCities.join('、')}`);
    }
    if (familySpecialRequirements.trim()) {
      parts.push(`特殊要求：${familySpecialRequirements.trim()}`);
    }
    return parts.join('；');
  };

  const handleQuickFill = async () => {
    setError('');

    if (!score || parseInt(score) < 0 || parseInt(score) > 750) {
      setError('请输入有效的高考分数（0-750）');
      return;
    }

    if (!rank || parseInt(rank) < 1) {
      setError('请输入有效的全省位次');
      return;
    }

    if (!province) {
      setError('请选择您所在的省份');
      return;
    }

    if (selectedSubjects.length < 3) {
      setError('请至少选择3个选考科目');
      return;
    }

    const quickFillData: QuickFillData = {
      profile: {
        score: parseInt(score),
        rank: parseInt(rank),
        province,
        subjects: selectedSubjects,
        targetCities: selectedTargetCities,
        batch: '本科批',
      },
      assessment: {
        holland: getHollandScores(),
        mbti: calculateMbti(),
      },
      preferences: {
        universityWeight: 25,
        majorWeight: 25,
        cityWeight: 25,
        employmentWeight: 25,
        familyWishes: getFamilyWishesText(),
      },
    };

    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: '/recommend', quickFillData } });
      return;
    }

    setLoading(true);
    try {
      const profile: StudentProfile = {
        id: 0,
        userId: user?.id || 0,
        score: parseInt(score),
        rank: parseInt(rank),
        province,
        subjects: selectedSubjects,
        batch: '本科批',
        targetCities: selectedTargetCities,
        createdAt: new Date().toISOString(),
      };

      const assessment: AssessmentResult = {
        id: 0,
        userId: user?.id || 0,
        holland: getHollandScores(),
        mbti: calculateMbti(),
        createdAt: new Date().toISOString(),
      };

      const preferences = {
        universityWeight: 25,
        majorWeight: 25,
        cityWeight: 25,
        employmentWeight: 25,
        familyWishes: getFamilyWishesText(),
      };

      const requestData: GenerateRecommendRequest = {
        profile,
        assessment,
        preferences,
      };

      const response = await recommend.generate(requestData);
      if (response.success && response.data) {
        navigate('/recommend/result', { state: response.data });
      } else {
        setError('推荐生成失败，请稍后重试');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '推荐生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleToggleTargetCity = (city: string) => {
    setSelectedTargetCities((prev) =>
      prev.includes(city)
        ? prev.filter((c) => c !== city)
        : [...prev, city]
    );
  };

  const handleToggleFamilyMajor = (major: string) => {
    setFamilyMajors((prev) =>
      prev.includes(major)
        ? prev.filter((m) => m !== major)
        : [...prev, major]
    );
  };

  const handleToggleFamilyCity = (city: string) => {
    setFamilyCities((prev) =>
      prev.includes(city)
        ? prev.filter((c) => c !== city)
        : [...prev, city]
    );
  };

  const handleHollandScore = (trait: string, value: number) => {
    setHollandScores((prev) => ({ ...prev, [trait]: value }));
  };

  const handleMbtiSelect = (dimension: string, value: string) => {
    setMbtiSelections((prev) => ({ ...prev, [dimension]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4 mr-2" />
                2024年志愿填报季正式开启
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                智能志愿填报
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  精准规划未来
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                基于百万级历史数据和先进AI算法，为每位考生量身定制最优志愿方案，
                让每一分都发挥最大价值，助力考生迈入理想大学。
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleStartFill}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  开始填报
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/universities')}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                >
                  查询院校
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-3xl blur-3xl transform rotate-6" />
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl"
                    >
                      <stat.icon className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center text-amber-800">
                    <Award className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">已帮助 100,000+ 考生成功填报志愿</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">快速填报</h2>
                <p className="text-blue-100">输入基本信息，立即获取个性化推荐</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl text-white">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  高考分数 <span className="text-red-300">*</span>
                </label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="请输入高考分数（0-750）"
                  min="0"
                  max="750"
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  全省位次 <span className="text-red-300">*</span>
                </label>
                <input
                  type="number"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="请输入全省位次"
                  min="1"
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                所在省份 <span className="text-red-300">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-white/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" className="text-gray-900">请选择省份</option>
                  {provinces.map((p) => (
                    <option key={p} value={p} className="text-gray-900">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">
                选科组合 <span className="text-red-300">*</span>
                <span className="text-blue-200 ml-2">（至少选择3个）</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => handleToggleSubject(subject)}
                    className={`py-3 px-2 rounded-xl font-medium transition-all ${
                      selectedSubjects.includes(subject)
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
              {selectedSubjects.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-blue-100 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  已选择 {selectedSubjects.length} 个科目
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">
                目标城市 <span className="text-blue-200">（可多选，可选）</span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white/5 rounded-xl">
                {targetCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleToggleTargetCity(city)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center ${
                      selectedTargetCities.includes(city)
                        ? 'bg-white text-blue-600 shadow'
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {city}
                    {selectedTargetCities.includes(city) && (
                      <Check className="w-3.5 h-3.5 ml-1" />
                    )}
                  </button>
                ))}
              </div>
              {selectedTargetCities.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-blue-100 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  已选择 {selectedTargetCities.length} 个目标城市
                </div>
              )}
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowAssessment(!showAssessment)}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">兴趣测评快捷入口</div>
                    <div className="text-sm text-blue-100">
                      {isAssessmentComplete()
                        ? '测评已完成'
                        : '完成霍兰德和MBTI测评，获得更精准推荐'}
                    </div>
                  </div>
                </div>
                {showAssessment ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>

              {showAssessment && (
                <div className="mt-4 p-6 bg-white/5 rounded-xl border border-white/10 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      霍兰德职业兴趣测评（简版）
                    </h3>
                    <p className="text-blue-100 text-sm mb-4">
                      请根据您的实际情况，对以下描述进行评分（1-5分，1=非常不同意，5=非常同意）
                    </p>
                    <div className="space-y-4">
                      {hollandQuestions.map((q, index) => (
                        <div key={index} className="p-4 bg-white/10 rounded-xl">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-white font-medium">{q.question}</p>
                              <p className="text-blue-200 text-xs mt-1">{q.label}（{q.trait}）</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleHollandScore(q.trait, value)}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-all text-sm ${
                                  hollandScores[q.trait] === value
                                    ? 'bg-white text-blue-600 shadow-lg'
                                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
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

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      MBTI 性格类型选择
                    </h3>
                    <p className="text-blue-100 text-sm mb-4">
                      请选择最符合您的选项
                    </p>
                    <div className="space-y-4">
                      {mbtiDimensions.map((dim, index) => (
                        <div key={index} className="p-4 bg-white/10 rounded-xl">
                          <p className="text-white font-medium mb-3">{dim.question}</p>
                          <div className="grid grid-cols-2 gap-3">
                            {dim.options.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleMbtiSelect(dim.dimension, option.value)}
                                className={`p-3 rounded-xl text-left transition-all ${
                                  mbtiSelections[dim.dimension] === option.value
                                    ? 'bg-white text-blue-600 shadow-lg'
                                    : 'bg-white/5 text-white border border-white/20 hover:bg-white/10'
                                }`}
                              >
                                <div className="font-semibold flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                    {option.value}
                                  </span>
                                  {option.label}
                                </div>
                                <p className={`text-xs mt-1 ${
                                  mbtiSelections[dim.dimension] === option.value
                                    ? 'text-blue-600'
                                    : 'text-blue-200'
                                }`}>
                                  {option.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isAssessmentComplete() && (
                    <div className="p-4 bg-green-500/20 border border-green-400/50 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0" />
                      <div className="text-white text-sm">
                        <div className="font-medium">测评已完成</div>
                        <div className="text-green-200 text-xs">
                          MBTI类型：{calculateMbti()} | 霍兰德得分：R:{getHollandScores().R} I:{getHollandScores().I} A:{getHollandScores().A} S:{getHollandScores().S} E:{getHollandScores().E} C:{getHollandScores().C}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowFamilyWishes(!showFamilyWishes)}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">家庭意愿输入</div>
                    <div className="text-sm text-blue-100">
                      {familyMajors.length > 0 || familyCities.length > 0 || familySpecialRequirements.trim()
                        ? '已填写家庭意愿'
                        : '填写家庭期望，让推荐更符合家人期待'}
                    </div>
                  </div>
                </div>
                {showFamilyWishes ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>

              {showFamilyWishes && (
                <div className="mt-4 p-6 bg-white/5 rounded-xl border border-white/10 space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-3">
                      期望专业方向 <span className="text-blue-200 text-sm font-normal">（可多选，可选）</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {majorCategories.map((major) => (
                        <button
                          key={major.value}
                          type="button"
                          onClick={() => handleToggleFamilyMajor(major.value)}
                          className={`p-3 rounded-xl text-left transition-all ${
                            familyMajors.includes(major.value)
                              ? 'bg-white text-blue-600 shadow-lg'
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <div className="font-medium text-sm flex items-center gap-2">
                            {familyMajors.includes(major.value) && (
                              <Check className="w-4 h-4" />
                            )}
                            {major.label}
                          </div>
                          <p className={`text-xs mt-1 ${
                            familyMajors.includes(major.value) ? 'text-blue-600' : 'text-blue-200'
                          }`}>
                            {major.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-white font-semibold mb-3">
                      期望城市 <span className="text-blue-200 text-sm font-normal">（可多选，可选）</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white/5 rounded-xl">
                      {targetCities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleToggleFamilyCity(city)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center ${
                            familyCities.includes(city)
                              ? 'bg-white text-blue-600 shadow'
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {city}
                          {familyCities.includes(city) && (
                            <Check className="w-3.5 h-3.5 ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-white font-semibold mb-3">
                      特殊要求 <span className="text-blue-200 text-sm font-normal">（如军警、公费师范生等，可选）</span>
                    </h3>
                    <textarea
                      value={familySpecialRequirements}
                      onChange={(e) => setFamilySpecialRequirements(e.target.value)}
                      placeholder="如有特殊要求（如军警、公费师范生、定向就业等），请在此说明..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors resize-none"
                    />
                  </div>

                  {(familyMajors.length > 0 || familyCities.length > 0 || familySpecialRequirements.trim()) && (
                    <div className="p-4 bg-green-500/20 border border-green-400/50 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0" />
                      <div className="text-white text-sm">
                        <div className="font-medium">家庭意愿已填写</div>
                        {getFamilyWishesText() && (
                          <div className="text-green-200 text-xs mt-1">
                            {getFamilyWishesText()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleQuickFill}
              disabled={loading}
              className="w-full py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  智能推荐生成中...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  立即获取智能推荐
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-blue-100 text-sm">
              {isAuthenticated
                ? '点击后将直接生成推荐结果并跳转至结果页面'
                : '演示环境可直接生成推荐方案，数据会自动带入志愿填报流程'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              六大核心功能
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              全方位覆盖志愿填报的每一个环节，提供专业、智能、贴心的服务体验
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 border border-transparent hover:border-blue-200 shadow-sm hover:shadow-lg"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <button
                  onClick={() => navigate(feature.path)}
                  className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform duration-300"
                >
                  {feature.actionText}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              准备好开启你的志愿填报之旅了吗？
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              立即注册，免费体验智能志愿推荐系统，让专业的AI助你一臂之力
            </p>
            <button
              onClick={handleStartFill}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              立即开始
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
