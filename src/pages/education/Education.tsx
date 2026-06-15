import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, MapPin, FileText, BookOpen, Search, School as SchoolIcon, Building2, Users, Bell, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/api/client';
import type { School } from '../../../shared/types';
import { cn } from '@/lib/utils';

const quickServices = [
  { name: '入学报名', icon: FileText, path: '/education/enrollment', color: 'from-primary-400 to-primary-600', desc: '小学入学在线报名' },
  { name: '学区查询', icon: MapPin, path: '#', color: 'from-eco-400 to-eco-600', desc: '查询住址对应学区' },
  { name: '学籍管理', icon: Users, path: '#', color: 'from-warm-400 to-warm-600', desc: '学籍信息查询管理' },
  { name: '教育资源', icon: BookOpen, path: '#', color: 'from-purple-400 to-purple-600', desc: '优质教育资源分享' },
];

const schoolTypes = [
  { value: '', label: '全部' },
  { value: 'primary', label: '小学' },
  { value: 'middle', label: '中学' },
  { value: 'high', label: '高中' },
];

const schoolTypeMap: Record<string, { name: string; color: string }> = {
  primary: { name: '小学', color: 'bg-blue-100 text-blue-600' },
  middle: { name: '中学', color: 'bg-green-100 text-green-600' },
  high: { name: '高中', color: 'bg-orange-100 text-orange-600' },
};

const policyNotifications = [
  { id: '1', title: '南宁市2024年小学招生工作安排', date: '2024-05-20', type: 'important' },
  { id: '2', title: '关于做好义务教育阶段免试入学工作的通知', date: '2024-05-15', type: 'normal' },
  { id: '3', title: '2024年中小学学区划分方案公布', date: '2024-05-10', type: 'important' },
  { id: '4', title: '随迁子女入学办理指南更新', date: '2024-05-05', type: 'normal' },
];

export default function Education() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [address, setAddress] = useState('');
  const [searchResult, setSearchResult] = useState<{ school: School | null; confidence: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guidelines, setGuidelines] = useState<{
    title: string;
    content: string;
    timeline: Array<{ date: string; event: string }>;
    requiredDocuments: string[];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [schoolsData, guidelinesData] = await Promise.all([
        api.education.getSchools(selectedType || undefined),
        api.education.getEnrollmentGuidelines(),
      ]);
      setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      setGuidelines(guidelinesData as any);
    } catch (e) {
      console.error('Failed to load education data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSchool = async () => {
    if (!address.trim()) return;
    setIsSearching(true);
    try {
      const result = await api.education.getSchoolByAddress(address);
      setSearchResult(result as any);
    } catch (e) {
      console.error('Failed to search school:', e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">教育服务</h1>
          <p className="text-gray-500 mt-1">入学报名、学区查询、学籍管理，一站式教育服务</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl">
          <GraduationCap className="w-4 h-4" />
          <span className="text-sm font-medium">南宁市 · 青秀区</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickServices.map((service, index) => (
          <button
            key={service.name}
            onClick={() => navigate(service.path)}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-left group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg', service.color)}>
              <service.icon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                学校列表
              </h3>
              <div className="flex gap-2">
                {schoolTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      selectedType === type.value
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {schools.length > 0 ? schools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                        <SchoolIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">{school.name}</h4>
                        <p className="text-sm text-gray-500">{school.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', schoolTypeMap[school.type]?.color)}>
                            {schoolTypeMap[school.type]?.name}
                          </span>
                          <span className="text-xs text-gray-400">{school.district}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">暂无学校数据</div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-warm-500" />
              入学政策通知
            </h3>
            <div className="space-y-3">
              {policyNotifications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {item.type === 'important' ? (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                    </div>
                  </div>
                  {item.type === 'important' && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                      重要
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5" />
              <h3 className="font-semibold text-lg">学区查询</h3>
            </div>
            <p className="text-primary-100 text-sm mb-4">输入您的家庭住址，快速查询对应学区学校</p>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSchool()}
                  placeholder="请输入详细地址，如：滨湖路1号"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                onClick={handleSearchSchool}
                disabled={isSearching || !address.trim()}
                className="w-full py-3 bg-white text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    查询中...
                  </span>
                ) : '查询学区'}
              </button>
            </div>
            {searchResult && searchResult.school && (
              <div className="mt-4 p-4 bg-white/20 backdrop-blur rounded-xl border border-white/30 animate-fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-eco-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{searchResult.school.name}</p>
                    <p className="text-sm text-primary-100 mt-1">{searchResult.school.address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-primary-200">匹配度：</span>
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-eco-400 rounded-full transition-all duration-500"
                          style={{ width: `${searchResult.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{Math.round(searchResult.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {guidelines && (
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-500" />
                报名时间安排
              </h3>
              <div className="space-y-4">
                {guidelines.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        index === 0 ? 'bg-primary-500' : 'bg-gray-300'
                      )} />
                      {index < guidelines.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-gray-800">{item.event}</p>
                      <p className="text-sm text-primary-600 mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/education/enrollment')}
                className="w-full mt-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-glow"
              >
                立即报名
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <SchoolIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">328</p>
          <p className="text-sm text-gray-500 mt-1">全市小学</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-eco-100 flex items-center justify-center text-eco-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">12.5万</p>
          <p className="text-sm text-gray-500 mt-1">在校小学生</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center text-warm-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">99.8%</p>
          <p className="text-sm text-gray-500 mt-1">入学率</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">8,642</p>
          <p className="text-sm text-gray-500 mt-1">专任教师</p>
        </div>
      </div>
    </div>
  );
}
