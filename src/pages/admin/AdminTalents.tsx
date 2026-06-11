import { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  Star,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Edit,
  Eye,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi, talentApi } from '../../lib/api';
import { TALENT_LEVEL_LABELS } from '../../../shared/types';
import type { Talent, TalentLevel } from '../../../shared/types';
import { cn } from '../../lib/utils';

const AdminTalents = () => {
  const navigate = useNavigate();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [levelFilter, setLevelFilter] = useState<TalentLevel | ''>('');
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [verifyForm, setVerifyForm] = useState({ verified: true, level: 'intermediate' as TalentLevel });

  useEffect(() => {
    const fetchTalents = async () => {
      setLoading(true);
      try {
        const query: any = { page, pageSize };
        if (levelFilter) query.level = levelFilter;
        if (verifiedFilter !== '') query.verified = verifiedFilter;
        const data = await adminApi.getTalents(query);
        setTalents(data.data);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to fetch talents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTalents();
  }, [page, levelFilter, verifiedFilter]);

  const handleVerify = async () => {
    if (!selectedTalent) return;
    try {
      await talentApi.verify(selectedTalent.id, verifyForm.verified, verifyForm.level);
      setShowVerifyModal(false);
      setSelectedTalent(null);
      const query: any = { page, pageSize };
      if (levelFilter) query.level = levelFilter;
      if (verifiedFilter !== '') query.verified = verifiedFilter;
      const data = await adminApi.getTalents(query);
      setTalents(data.data);
    } catch (err) {
      console.error('Failed to verify talent:', err);
    }
  };

  const filteredTalents = talents.filter(talent =>
    !searchKeyword ||
    talent.user?.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    talent.realName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    talent.skills.some(s => s.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  const levels: { value: TalentLevel | ''; label: string }[] = [
    { value: '', label: '全部等级' },
    { value: 'entry', label: '初级' },
    { value: 'intermediate', label: '中级' },
    { value: 'advanced', label: '高级' },
    { value: 'expert', label: '专家' },
  ];

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
          <h2 className="text-2xl font-bold text-slate-800">服务商分级管理</h2>
          <p className="text-slate-500 mt-1">管理平台服务商资质认证和等级评定</p>
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
          <div className="flex items-center gap-2">
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
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">服务商</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">等级</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">评分</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">完成项目</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">按时率</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">认证状态</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTalents.length > 0 ? (
              filteredTalents.map(talent => (
                <tr key={talent.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {talent.user?.name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">{talent.user?.name}</p>
                          {talent.verified && <Award className="w-4 h-4 text-blue-500" />}
                          {talent.idCardVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                        <p className="text-sm text-slate-500">{talent.realName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getLevelColor(talent.level))}>
                      {TALENT_LEVEL_LABELS[talent.level]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium text-slate-800">{talent.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-800">{talent.completedProjects}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'font-medium',
                      talent.onTimeRate >= 95 ? 'text-green-600' :
                      talent.onTimeRate >= 85 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {talent.onTimeRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {talent.verified ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        已认证
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        待认证
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/talents/${talent.id}`)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTalent(talent);
                          setVerifyForm({ verified: talent.verified, level: talent.level });
                          setShowVerifyModal(true);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Shield className="w-4 h-4 text-blue-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无服务商</h3>
                  <p className="text-slate-500">尝试调整筛选条件</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {total > pageSize && (
          <div className="flex items-center justify-center gap-2 p-6 border-t border-slate-200">
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

      {showVerifyModal && selectedTalent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">服务商资质审核</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedTalent.user?.name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{selectedTalent.user?.name}</p>
                    <p className="text-sm text-slate-500">{selectedTalent.realName}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">认证状态</label>
                <select
                  value={String(verifyForm.verified)}
                  onChange={(e) => setVerifyForm({ ...verifyForm, verified: e.target.value === 'true' })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="true">已认证</option>
                  <option value="false">未认证</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">专业等级</label>
                <select
                  value={verifyForm.level}
                  onChange={(e) => setVerifyForm({ ...verifyForm, level: e.target.value as TalentLevel })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {levels.filter(l => l.value !== '').map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedTalent(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                确认审核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTalents;
