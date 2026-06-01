import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Clock, DollarSign, Users, TrendingUp, Shield,
  Briefcase, UserPlus, FileCheck, Video, FileText, Scale, Calculator,
  ChevronRight, Star, Award, Zap, Building2, Settings
} from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const role = user?.role;

  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const result = await jobsApi.list({ limit: 6 });
    if (result.success && result.data?.jobs) {
      setFeaturedJobs(result.data.jobs);
    }
  };

  const jobTypeLabels: Record<string, string> = {
    daily: '日结',
    weekly: '周结',
    project: '项目制',
    remote: '远程'
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 已登录用户的工作台 */}
      {isAuthenticated && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  欢迎回来，{user?.name || user?.email}
                </h2>
                <p className="text-gray-500 mt-1">
                  {role === 'job_seeker' && '求职者工作台 - 发现适合你的岗位机会'}
                  {role === 'employer' && '雇主工作台 - 高效管理招聘与团队'}
                  {role === 'admin' && '运营管理后台 - 平台数据与运营管理'}
                </p>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Settings className="h-5 w-5" />
                账号设置
              </Link>
            </div>

            {/* 角色专属快捷入口 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {role === 'job_seeker' && (
                <>
                  <Link
                    to="/jobs"
                    className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl transition group"
                  >
                    <Briefcase className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">岗位大厅</h3>
                    <p className="text-sm text-gray-500">浏览全部岗位</p>
                    <ChevronRight className="h-4 w-4 text-blue-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/jobs/recommendations"
                    className="bg-green-50 hover:bg-green-100 p-4 rounded-xl transition group"
                  >
                    <Zap className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">智能匹配</h3>
                    <p className="text-sm text-gray-500">精准岗位推荐</p>
                    <ChevronRight className="h-4 w-4 text-green-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/profile"
                    className="bg-purple-50 hover:bg-purple-100 p-4 rounded-xl transition group"
                  >
                    <FileText className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">我的简历</h3>
                    <p className="text-sm text-gray-500">完善求职资料</p>
                    <ChevronRight className="h-4 w-4 text-purple-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/profile"
                    className="bg-orange-50 hover:bg-orange-100 p-4 rounded-xl transition group"
                  >
                    <Award className="h-8 w-8 text-orange-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">技能认证</h3>
                    <p className="text-sm text-gray-500">上传技能证书</p>
                    <ChevronRight className="h-4 w-4 text-orange-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                </>
              )}

              {role === 'employer' && (
                <>
                  <Link
                    to="/employer/jobs/create"
                    className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl transition group"
                  >
                    <Zap className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">极速发岗</h3>
                    <p className="text-sm text-gray-500">10秒发布岗位</p>
                    <ChevronRight className="h-4 w-4 text-blue-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/employer/jobs"
                    className="bg-green-50 hover:bg-green-100 p-4 rounded-xl transition group"
                  >
                    <FileText className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">简历筛选</h3>
                    <p className="text-sm text-gray-500">查看申请记录</p>
                    <ChevronRight className="h-4 w-4 text-green-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/employer/jobs"
                    className="bg-purple-50 hover:bg-purple-100 p-4 rounded-xl transition group"
                  >
                    <Video className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">面试管理</h3>
                    <p className="text-sm text-gray-500">安排与评价</p>
                    <ChevronRight className="h-4 w-4 text-purple-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/profile"
                    className="bg-orange-50 hover:bg-orange-100 p-4 rounded-xl transition group"
                  >
                    <Building2 className="h-8 w-8 text-orange-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">企业信息</h3>
                    <p className="text-sm text-gray-500">资质与认证</p>
                    <ChevronRight className="h-4 w-4 text-orange-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                </>
              )}

              {role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl transition group"
                  >
                    <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">数据概览</h3>
                    <p className="text-sm text-gray-500">平台运营数据</p>
                    <ChevronRight className="h-4 w-4 text-blue-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/admin"
                    className="bg-green-50 hover:bg-green-100 p-4 rounded-xl transition group"
                  >
                    <Users className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">用户管理</h3>
                    <p className="text-sm text-gray-500">用户状态管理</p>
                    <ChevronRight className="h-4 w-4 text-green-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/admin"
                    className="bg-red-50 hover:bg-red-100 p-4 rounded-xl transition group"
                  >
                    <Scale className="h-8 w-8 text-red-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">纠纷处理</h3>
                    <p className="text-sm text-gray-500">劳务纠纷仲裁</p>
                    <ChevronRight className="h-4 w-4 text-red-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                  <Link
                    to="/admin"
                    className="bg-purple-50 hover:bg-purple-100 p-4 rounded-xl transition group"
                  >
                    <Calculator className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-800">税务合规</h3>
                    <p className="text-sm text-gray-500">个税与发票</p>
                    <ChevronRight className="h-4 w-4 text-purple-600 mt-2 group-hover:translate-x-1 transition" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 未登录用户的 Hero 区域 */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">灵活用工撮合平台</h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                连接人才与机会，基于 LBS 与技能图谱的智能人岗匹配
              </p>
            </div>

            {/* 角色选择入口 */}
            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
              <Link
                to="/register?role=job_seeker"
                className="bg-white/10 hover:bg-white/20 backdrop-blur p-6 rounded-2xl transition text-center group"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">我要求职</h3>
                <p className="text-blue-100 text-sm mb-4">
                  发现优质岗位，展示技能与简历
                </p>
                <div className="text-xs text-blue-200 space-y-1">
                  <p>✓ 智能岗位匹配</p>
                  <p>✓ 视频简历上传</p>
                  <p>✓ 履约评分体系</p>
                </div>
              </Link>

              <Link
                to="/register?role=employer"
                className="bg-white/10 hover:bg-white/20 backdrop-blur p-6 rounded-2xl transition text-center group"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <Building2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">我要招聘</h3>
                <p className="text-blue-100 text-sm mb-4">
                  极速发布岗位，高效筛选人才
                </p>
                <div className="text-xs text-blue-200 space-y-1">
                  <p>✓ 10秒极速发岗</p>
                  <p>✓ AI 初面辅助</p>
                  <p>✓ 资金托管结算</p>
                </div>
              </Link>

              <Link
                to="/login"
                className="bg-white/10 hover:bg-white/20 backdrop-blur p-6 rounded-2xl transition text-center group"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">平台运营</h3>
                <p className="text-blue-100 text-sm mb-4">
                  管理后台，数据监控与运营
                </p>
                <div className="text-xs text-blue-200 space-y-1">
                  <p>✓ 数据统计看板</p>
                  <p>✓ 纠纷在线处理</p>
                  <p>✓ 税务合规引擎</p>
                </div>
              </Link>
            </div>

            {/* 搜索框 */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-xl p-2 shadow-xl flex">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索岗位、技能或公司..."
                  className="flex-1 px-4 py-3 text-gray-800 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <Search className="h-5 w-5" />
                  搜索岗位
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 justify-center">
                <Link to="/jobs?job_type=daily" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                  💰 日结岗位
                </Link>
                <Link to="/jobs?job_type=remote" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                  🏠 远程工作
                </Link>
                <Link to="/jobs?job_type=project" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                  📋 项目制
                </Link>
                <Link to="/jobs?job_type=weekly" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                  📅 周结岗位
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 平台特色 */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">核心业务能力</h2>
          <p className="text-gray-500">覆盖灵活用工全流程，闭环管理每一个环节</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">智能匹配</h3>
            <p className="text-sm text-gray-500">LBS + 技能图谱，毫秒级精准人岗匹配</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">资金托管</h3>
            <p className="text-sm text-gray-500">完工确认→平台放款→T+0 极速到账</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">视频面试</h3>
            <p className="text-sm text-gray-500">音视频存档，AI 初面辅助，评价闭环</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <FileCheck className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">电子合同</h3>
            <p className="text-sm text-gray-500">入职凭证，社保状态同步，链上存证</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Scale className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">纠纷举证</h3>
            <p className="text-sm text-gray-500">聊天记录/考勤/工时，在线仲裁处理</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
              <Calculator className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">税务合规</h3>
            <p className="text-sm text-gray-500">个税预缴，发票代开，社保穿透申报</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">信用体系</h3>
            <p className="text-sm text-gray-500">履约评分，上岗时效承诺，技能认证</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">安全保障</h3>
            <p className="text-sm text-gray-500">数据加密，资金监管，多方权益保障</p>
          </div>
        </div>

        {/* 热门岗位 */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🔥 热门岗位</h2>
            <Link to="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
              查看全部岗位 →
            </Link>
          </div>

          {featuredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map(job => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {jobTypeLabels[job.job_type] || job.job_type}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{job.company_name || '灵活用工平台'}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      ¥{job.salary_amount?.toLocaleString() || '面议'}
                    </span>
                    {job.location_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location_address.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">暂无岗位数据</p>
              {isAuthenticated && role === 'employer' && (
                <Link
                  to="/employer/jobs/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition inline-block"
                >
                  立即发布第一个岗位
                </Link>
              )}
              {!isAuthenticated && (
                <div className="flex gap-3 justify-center">
                  <Link
                    to="/register?role=employer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                  >
                    注册雇主账号
                  </Link>
                  <Link
                    to="/jobs"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition"
                  >
                    浏览岗位
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 注册引导 */}
        {!isAuthenticated && (
          <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">准备好开始了吗？</h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              加入灵活用工平台，开启高效、安全、合规的灵活用工新体验
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/register?role=job_seeker"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition flex items-center gap-2"
              >
                <UserPlus className="h-5 w-5" />
                立即求职
              </Link>
              <Link
                to="/register?role=employer"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition flex items-center gap-2"
              >
                <Building2 className="h-5 w-5" />
                立即招聘
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
