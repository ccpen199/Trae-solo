import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Award,
  Building2,
  Clock,
  Eye,
  Send,
  Heart,
  Share2,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Zap,
  Target,
} from 'lucide-react';
import {
  Tag,
  Button,
  Avatar,
  Divider,
  Badge,
  Result,
  message,
  Tooltip,
  Breadcrumb,
} from 'antd';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { generateMockData } from '@/mock/data';
import { TOWNSHIPS, getTownshipByCode } from '@/mock/townships';
import { TownshipCode, JobPosition, Enterprise, MatchDimension } from '@shared/types';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import MatchRadarChart, { MatchRadarScores } from '@/components/charts/MatchRadarChart';
import TownshipTag from '@/components/common/TownshipTag';
import EnterpriseCard from '@/components/common/EnterpriseCard';
import { cn } from '@/lib/utils';

function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mockData = useMemo(() => generateMockData(), []);
  const [isApplied, setIsApplied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [applying, setApplying] = useState(false);

  const job = useMemo(() => {
    const found = mockData.positions.find((p) => p.id === id);
    if (found) return found;
    return mockData.positions[0];
  }, [mockData.positions, id]);

  const enterprise = useMemo(() => {
    return mockData.enterprises.find((e) => e.id === job.enterpriseId) || mockData.enterprises[0];
  }, [mockData.enterprises, job]);

  const matchResult = useMemo(() => {
    const overall = Math.floor(70 + Math.random() * 25);
    const dimensions: MatchRadarScores = {
      skill: Math.floor(65 + Math.random() * 30),
      experience: Math.floor(60 + Math.random() * 35),
      education: Math.floor(70 + Math.random() * 25),
      location: Math.floor(50 + Math.random() * 45),
      salary: Math.floor(65 + Math.random() * 30),
    };
    const targetScores: Partial<MatchRadarScores> = {
      skill: 90,
      experience: 85,
      education: 80,
      location: 95,
      salary: 85,
    };
    return { overall, dimensions, targetScores };
  }, []);

  const gapAnalysis = useMemo(() => {
    const suggestions: { dimension: string; current: number; target: number; advice: string }[] = [];
    const dims: { key: keyof MatchRadarScores; label: string }[] = [
      { key: 'skill', label: '技能匹配' },
      { key: 'experience', label: '经验匹配' },
      { key: 'education', label: '学历匹配' },
      { key: 'location', label: '地点匹配' },
      { key: 'salary', label: '薪资匹配' },
    ];
    dims.forEach(({ key, label }) => {
      const current = matchResult.dimensions[key];
      const target = matchResult.targetScores[key] || 100;
      if (current < target - 10) {
        let advice = '';
        switch (key) {
          case 'skill':
            advice = '建议补充相关技能证书或参加职业技能培训';
            break;
          case 'experience':
            advice = '可突出相关项目经验，或考虑从初级岗位切入';
            break;
          case 'education':
            advice = '可通过成人教育或职业培训提升学历水平';
            break;
          case 'location':
            advice = '该职位距离较远，可考虑通勤或住宿方案';
            break;
          case 'salary':
            advice = '薪资期望可适当调整，或与HR进一步沟通';
            break;
        }
        suggestions.push({ dimension: label, current, target, advice });
      }
    });
    return suggestions;
  }, [matchResult]);

  const similarJobs = useMemo(() => {
    return mockData.positions
      .filter((p) => p.township === job.township && p.id !== job.id)
      .slice(0, 3)
      .map((j) => ({
        ...j,
        matchScore: Math.floor(65 + Math.random() * 30),
      }));
  }, [mockData.positions, job]);

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return '面议';
    if (min === max) return `${min}K`;
    return `${min}-${max}K`;
  };

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setIsApplied(true);
      message.success('简历投递成功！企业将尽快与您联系');
    }, 1500);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    message.success(isFavorited ? '已取消收藏' : '已加入收藏夹');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getInitial = (name: string) => name?.charAt(0) || '企';

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/jobseeker')}>首页</a> },
            { title: <a onClick={() => navigate('/jobs')}>职位搜索</a> },
            { title: job.title },
          ]}
          className="!text-sm mb-2"
        />
        <Button
          type="text"
          icon={<ChevronLeft size={16} />}
          onClick={() => navigate(-1)}
          className="!text-gray-500 !px-0"
        >
          返回列表
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-7 space-y-4"
        >
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  {job.urgent && (
                    <Tag color="red" className="!text-xs">急招</Tag>
                  )}
                  <Tag color="orange" className="!text-xs">{job.type}</Tag>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} className="text-gray-400" />
                    {job.enterpriseName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    {getTownshipByCode(job.township as TownshipCode)?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" />
                    {formatDate(job.publishedAt)}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold text-vital-orange-500 mb-1">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </div>
                <div className="text-xs text-gray-400">{job.salaryType}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
              <TownshipTag code={job.township as TownshipCode} size="md" />
              <Tag className="!text-sm !px-3 !py-1 !bg-gray-50 !border-gray-200">
                <Briefcase size={12} className="mr-1 inline" />
                {job.experience}
              </Tag>
              <Tag className="!text-sm !px-3 !py-1 !bg-gray-50 !border-gray-200">
                <GraduationCap size={12} className="mr-1 inline" />
                {job.education}
              </Tag>
              <Tag className="!text-sm !px-3 !py-1 !bg-gray-50 !border-gray-200">
                <Users size={12} className="mr-1 inline" />
                招{job.hiringCount}人
              </Tag>
              <Tag className="!text-sm !px-3 !py-1 !bg-gray-50 !border-gray-200">
                <Eye size={12} className="mr-1 inline" />
                {job.viewCount}次浏览
              </Tag>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="primary"
                size="large"
                icon={<Send size={18} />}
                loading={applying}
                onClick={handleApply}
                disabled={isApplied}
                className={cn(
                  '!h-11 !px-8 !text-base font-medium',
                  isApplied && '!bg-success-500 !border-success-500'
                )}
              >
                {isApplied ? '已投递' : '一键投递'}
              </Button>
              <Button
                size="large"
                icon={<Heart size={18} fill={isFavorited ? '#FF7D00' : 'none'} />}
                onClick={handleFavorite}
                className={cn(
                  '!h-11 !px-6',
                  isFavorited && '!text-vital-orange-500 !border-vital-orange-300'
                )}
              >
                {isFavorited ? '已收藏' : '收藏'}
              </Button>
              <Tooltip title="分享职位">
                <Button size="large" icon={<Share2 size={18} />} className="!h-11 !px-4" />
              </Tooltip>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
              职位描述
            </h2>

            {job.jobDescription && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">岗位介绍</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {job.jobDescription}
                </p>
              </div>
            )}

            {job.responsibilities?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                  <Target size={14} className="text-industrial-blue-500" />
                  岗位职责
                </h3>
                <ul className="space-y-2">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-industrial-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.requirements?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                  <Zap size={14} className="text-vital-orange-500" />
                  任职要求
                </h3>
                <ul className="space-y-2">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-vital-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.requiredSkills?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1">
                  <BookOpen size={14} className="text-industrial-blue-500" />
                  技能要求
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((s) => (
                    <Tag
                      key={s.id}
                      color={s.required ? 'blue' : 'default'}
                      className="!text-sm !px-3 !py-1 !rounded-md"
                    >
                      {s.name}
                      {s.required && <span className="ml-1 text-xs">(必填)</span>}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {job.benefits?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1">
                  <TrendingUp size={14} className="text-success-500" />
                  福利待遇
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-industrial-blue-50 text-industrial-blue-600 rounded-md"
                    >
                      <CheckCircle2 size={12} />
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
              工作地点
            </h2>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-industrial-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-industrial-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-800 font-medium mb-1">
                  {getTownshipByCode(job.township as TownshipCode)?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {job.address || '中山市' + getTownshipByCode(job.township as TownshipCode)?.name + '工业园'}
                </p>
              </div>
            </div>
            <div className="mt-4 h-40 bg-gradient-to-br from-industrial-blue-50 to-industrial-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin size={32} className="mx-auto mb-2 text-industrial-blue-400" />
                <p className="text-sm">地图位置预览</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-vital-orange-500 rounded-full inline-block" />
              企业信息
            </h2>
            <EnterpriseCard enterprise={enterprise} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3 space-y-4"
        >
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-4">
            <div className="text-center mb-4">
              <h3 className="text-base font-bold text-gray-900 mb-1">智能匹配分析</h3>
              <p className="text-xs text-gray-500">基于您的简历综合评估</p>
            </div>

            <div className="flex justify-center mb-4">
              <MatchScoreRing score={matchResult.overall} size="lg" />
            </div>

            <div className="mb-4">
              <MatchRadarChart
                scores={matchResult.dimensions}
                targetScores={matchResult.targetScores}
                height={240}
              />
            </div>

            <Divider className="!my-3" />

            {gapAnalysis.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                  <AlertCircle size={14} className="text-vital-orange-500" />
                  提升建议
                </h4>
                <div className="space-y-2">
                  {gapAnalysis.map((g, i) => (
                    <div
                      key={i}
                      className="p-3 bg-vital-orange-50 rounded-lg border border-vital-orange-100"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-800">{g.dimension}</span>
                        <span className="text-xs font-mono-num text-vital-orange-600">
                          {g.current}% / {g.target}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{g.advice}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-success-50 rounded-lg border border-success-100 text-center">
                <CheckCircle2 size={24} className="mx-auto text-success-500 mb-1" />
                <p className="text-sm text-success-700 font-medium">匹配度良好，建议投递！</p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="primary"
                block
                size="large"
                icon={<Send size={18} />}
                loading={applying}
                onClick={handleApply}
                disabled={isApplied}
                className={cn(
                  '!h-11 !text-base',
                  isApplied && '!bg-success-500 !border-success-500'
                )}
              >
                {isApplied ? '✓ 已成功投递' : '立即投递简历'}
              </Button>
              <Button
                block
                size="large"
                onClick={handleFavorite}
                className={cn(
                  '!h-10',
                  isFavorited && '!text-vital-orange-500 !border-vital-orange-300'
                )}
              >
                {isFavorited ? '♥ 已收藏' : '♡ 收藏职位'}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-industrial-blue-600 font-mono-num">
                    {job.viewCount}
                  </div>
                  <div className="text-xs text-gray-500">浏览</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-vital-orange-500 font-mono-num">
                    {job.applicationCount}
                  </div>
                  <div className="text-xs text-gray-500">投递</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-success-600 font-mono-num">
                    {job.hiringCount}
                  </div>
                  <div className="text-xs text-gray-500">在招</div>
                </div>
              </div>
            </div>
          </div>

          {similarJobs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-industrial-blue-500 rounded-full inline-block" />
                相似职位推荐
              </h3>
              <div className="space-y-3">
                {similarJobs.map((sj) => (
                  <div
                    key={sj.id}
                    className="p-3 rounded-lg border border-gray-100 hover:border-industrial-blue-200 hover:bg-industrial-blue-50/30 cursor-pointer transition-all group"
                    onClick={() => navigate(`/jobs/${sj.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <MatchScoreRing score={sj.matchScore} size="sm" showLabel={false} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-industrial-blue-600 transition-colors">
                          {sj.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate mb-1">{sj.enterpriseName}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-vital-orange-500">
                            {formatSalary(sj.salaryMin, sj.salaryMax)}
                          </span>
                          <TownshipTag code={sj.township as TownshipCode} size="sm" showIcon={false} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default JobDetail;
