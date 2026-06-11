import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Award,
  CheckCircle,
  Briefcase,
  Clock,
  Calendar,
  FileText,
  Image,
  Award as AwardIcon,
  Mail,
  MessageSquare,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { talentApi } from '../../lib/api';
import { TALENT_LEVEL_LABELS } from '../../../shared/types';
import type { Talent } from '../../../shared/types';
import { cn } from '../../lib/utils';

const TalentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'certifications'>('overview');

  useEffect(() => {
    const fetchTalent = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await talentApi.getById(Number(id));
        setTalent(data);
      } catch (err) {
        console.error('Failed to fetch talent:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTalent();
  }, [id]);

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      entry: 'bg-slate-100 text-slate-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700',
      expert: 'bg-amber-100 text-amber-700',
    };
    return colors[level] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">服务商不存在</p>
        <button onClick={() => navigate('/talents')} className="mt-4 text-blue-600 hover:underline">
          返回人才库
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '基本信息' },
    { id: 'portfolio', label: `作品集 (${talent.portfolio.length})` },
    { id: 'certifications', label: `资质认证 (${talent.certifications.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/talents')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
        <div className="px-8 pb-8">
          <div className="flex items-end gap-6 -mt-16">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-5xl flex-shrink-0">
              {talent.user?.name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">{talent.user?.name}</h1>
                {talent.verified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <AwardIcon className="w-3.5 h-3.5" />
                    平台认证
                  </div>
                )}
                {talent.idCardVerified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    实名验证
                  </div>
                )}
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getLevelColor(talent.level))}>
                  {TALENT_LEVEL_LABELS[talent.level]}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-slate-800">{talent.rating.toFixed(1)}</span>
                  <span className="text-slate-500">综合评分</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Briefcase className="w-4 h-4" />
                  {talent.completedProjects} 个完成项目
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-4 h-4" />
                  {talent.onTimeRate}% 按时交付率
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-4 h-4" />
                  入驻于 {new Date(talent.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="pb-4 flex gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all">
                <MessageSquare className="w-4 h-4" />
                联系沟通
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                <Mail className="w-4 h-4" />
                发送邀请
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">个人简介</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{talent.bio}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">专业技能</h3>
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">数据统计</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600 mb-1">{talent.completedProjects}</p>
                  <p className="text-sm text-slate-600">完成项目</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600 mb-1">{talent.rating.toFixed(1)}</p>
                  <p className="text-sm text-slate-600">综合评分</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                  <p className="text-3xl font-bold text-amber-600 mb-1">{talent.onTimeRate}%</p>
                  <p className="text-sm text-slate-600">按时交付</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <p className="text-3xl font-bold text-purple-600 mb-1">{TALENT_LEVEL_LABELS[talent.level]}</p>
                  <p className="text-sm text-slate-600">专业等级</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">认证信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      talent.idCardVerified ? 'bg-green-100' : 'bg-slate-200'
                    )}>
                      <Shield className={cn('w-5 h-5', talent.idCardVerified ? 'text-green-600' : 'text-slate-400')} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">实名认证</p>
                      <p className="text-xs text-slate-500">身份证信息核验</p>
                    </div>
                  </div>
                  {talent.idCardVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <span className="text-xs text-slate-400">未认证</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      talent.verified ? 'bg-blue-100' : 'bg-slate-200'
                    )}>
                      <AwardIcon className={cn('w-5 h-5', talent.verified ? 'text-blue-600' : 'text-slate-400')} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">平台认证</p>
                      <p className="text-xs text-slate-500">专业资质审核</p>
                    </div>
                  </div>
                  {talent.verified ? (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  ) : (
                    <span className="text-xs text-slate-400">未认证</span>
                  )}
                </div>
              </div>
            </div>

            {talent.certifications.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">主要资质</h3>
                <div className="space-y-3">
                  {talent.certifications.slice(0, 3).map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <AwardIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{cert.name}</p>
                        <p className="text-xs text-slate-500">{cert.issuer} · {cert.issueDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {talent.portfolio.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {talent.portfolio.map((item, idx) => (
                <div key={idx} className="group rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-all">
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                    {item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium text-slate-700">
                          查看作品 <ExternalLink className="w-4 h-4" />
                        </span>
                      </a>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-slate-800 mb-1">{item.title}</h4>
                    <p className="text-slate-600 text-sm line-clamp-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无作品集</h3>
              <p className="text-slate-500">该服务商暂未上传作品集</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'certifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {talent.certifications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {talent.certifications.map((cert, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      cert.verified ? 'bg-green-100' : 'bg-slate-100'
                    )}>
                      <AwardIcon className={cn('w-6 h-6', cert.verified ? 'text-green-600' : 'text-slate-400')} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800">{cert.name}</h4>
                        {cert.verified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{cert.type}</p>
                      <p className="text-sm text-slate-500">颁发机构: {cert.issuer}</p>
                      <p className="text-sm text-slate-500">颁发日期: {cert.issueDate}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AwardIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无资质认证</h3>
              <p className="text-slate-500">该服务商暂未上传资质认证</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TalentDetail;
