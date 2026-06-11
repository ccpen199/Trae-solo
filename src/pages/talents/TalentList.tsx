import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Award, Briefcase, Clock, ArrowRight, Users, CheckCircle } from 'lucide-react';
import { talentApi } from '../../lib/api';
import { TALENT_LEVEL_LABELS } from '../../../shared/types';
import type { Talent, TalentLevel } from '../../../shared/types';
import { cn } from '../../lib/utils';

const TalentList = () => {
  const navigate = useNavigate();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [skillFilter, setSkillFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<TalentLevel | ''>('');
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const fetchTalents = async () => {
      setLoading(true);
      try {
        const query: any = { page, pageSize };
        if (skillFilter) query.skill = skillFilter;
        if (levelFilter) query.level = levelFilter;
        if (verifiedFilter !== '') query.verified = verifiedFilter;
        const data = await talentApi.getList(query);
        setTalents(data.data);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to fetch talents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTalents();
  }, [page, skillFilter, levelFilter, verifiedFilter]);

  const filteredTalents = talents.filter(talent =>
    !searchKeyword ||
    talent.user?.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    talent.skills.some(s => s.toLowerCase().includes(searchKeyword.toLowerCase())) ||
    talent.bio.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const levels: { value: TalentLevel | ''; label: string }[] = [
    { value: '', label: '全部等级' },
    { value: 'entry', label: '初级' },
    { value: 'intermediate', label: '中级' },
    { value: 'advanced', label: '高级' },
    { value: 'expert', label: '专家' },
  ];

  const skills = ['UI设计', '工业设计', '动漫设计', '软件开发', '商标注册', '文案策划', '品牌设计', '插画', '3D建模', '视频剪辑'];

  const getLevelColor = (level: TalentLevel) => {
    const colors: Record<TalentLevel, string> = {
      entry: 'bg-slate-100 text-slate-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700',
      expert: 'bg-amber-100 text-amber-700',
    };
    return colors[level];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">专业人才库</h2>
          <p className="text-slate-500 mt-1">共 {total} 位认证服务商</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索服务商名称或技能..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as TalentLevel | '')}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {levels.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <select
              value={verifiedFilter === '' ? '' : String(verifiedFilter)}
              onChange={(e) => setVerifiedFilter(e.target.value === '' ? '' : e.target.value === 'true')}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">全部状态</option>
              <option value="true">已认证</option>
              <option value="false">未认证</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-slate-500 py-1.5">热门技能:</span>
          {skills.map(skill => (
            <button
              key={skill}
              onClick={() => setSkillFilter(skillFilter === skill ? '' : skill)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-colors',
                skillFilter === skill
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTalents.length > 0 ? (
          filteredTalents.map((talent) => (
            <div
              key={talent.id}
              onClick={() => navigate(`/talents/${talent.id}`)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {talent.user?.name?.charAt(0) || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 truncate">{talent.user?.name}</h3>
                      {talent.verified && (
                        <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                      {talent.idCardVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2', getLevelColor(talent.level))}>
                      {TALENT_LEVEL_LABELS[talent.level]}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      <span className="font-medium text-slate-800">{talent.rating.toFixed(1)}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 text-sm">{talent.completedProjects} 项目</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 text-sm line-clamp-2 mb-4">{talent.bio}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {talent.skills.slice(0, 4).map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                      {skill}
                    </span>
                  ))}
                  {talent.skills.length > 4 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">
                      +{talent.skills.length - 4}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {talent.completedProjects} 完成
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {talent.onTimeRate}% 按时
                  </span>
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 flex items-center justify-between">
                <span className="text-sm text-slate-500">查看详情</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无匹配的服务商</h3>
            <p className="text-slate-500">尝试调整筛选条件或搜索关键词</p>
          </div>
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-slate-600">
            {page} / {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default TalentList;
