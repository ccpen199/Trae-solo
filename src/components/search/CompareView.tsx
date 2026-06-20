import React, { useMemo } from 'react';
import {
  X,
  User,
  Ruler,
  Calendar,
  MapPin,
  Languages,
  Briefcase,
  Eye,
  Award,
  BarChart3,
  FileCheck,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import MatchScoreBar from '@/components/castings/MatchScoreBar';
import ScheduleConflictIndicator from './ScheduleConflictIndicator';
import type { MatchResult } from '@shared/types';

interface CompareViewProps {
  matchResults: MatchResult[];
  onRemove: (artistId: string) => void;
  onClose: () => void;
  className?: string;
}

interface AttrRowProps {
  label: string;
  icon: React.ReactNode;
  values: Array<{ artistId: string; value: string | number; isBest?: boolean; color?: string }>;
  unit?: string;
  numeric?: boolean;
  higherIsBetter?: boolean;
}

const CHART_COLORS = [
  '#e94560',
  '#0f3460',
  '#10b981',
  '#f59e0b',
];

const AttrRow: React.FC<AttrRowProps> = ({
  label,
  icon,
  values,
  unit = '',
  numeric = false,
  higherIsBetter = true,
}) => {
  const displayValues = useMemo(() => {
    if (!numeric) return values.map((v) => ({ ...v, isBest: false }));

    const numValues = values.map((v) => Number(v.value));
    const bestValue = higherIsBetter ? Math.max(...numValues) : Math.min(...numValues);

    return values.map((v) => ({
      ...v,
      isBest: Number(v.value) === bestValue,
    }));
  }, [values, numeric, higherIsBetter]);

  return (
    <div className="grid grid-cols-[160px_1fr] border-b border-midnight-700/50 last:border-b-0">
      <div className="flex items-center gap-2 py-3 pr-4">
        <span className="text-rose-400">{icon}</span>
        <span className="text-sm text-midnight-200 font-medium">{label}</span>
      </div>
      <div className="grid gap-2 py-3" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {displayValues.map((v) => (
          <div
            key={v.artistId}
            className={cn(
              'flex items-center justify-center px-3 py-1.5 rounded-lg text-sm transition-all duration-300',
              v.isBest
                ? 'bg-gradient-primary text-white font-semibold shadow-lg shadow-rose-500/20'
                : 'bg-midnight-800/50 text-midnight-200'
            )}
          >
            {v.value}
            {unit && <span className="ml-1 opacity-80">{unit}</span>}
            {v.isBest && <Award className="w-3.5 h-3.5 ml-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
};

const CompareView: React.FC<CompareViewProps> = ({
  matchResults,
  onRemove,
  onClose,
  className,
}) => {
  const radarData = useMemo(() => {
    const categories = ['身高', '技能', '语言', '经验', '匹配度'];
    return categories.map((cat) => {
      const dataPoint: Record<string, string | number> = { category: cat };
      matchResults.forEach((mr, idx) => {
        let value = 0;
        switch (cat) {
          case '身高':
            value = Math.min(100, ((mr.artist.height - 150) / 50) * 100);
            break;
          case '技能':
            value = Math.min(100, (mr.artist.skills.length / 10) * 100);
            break;
          case '语言':
            value = Math.min(100, (mr.artist.languages.length / 5) * 100);
            break;
          case '经验':
            value = Math.min(100, (mr.artist.tags.length / 8) * 100);
            break;
          case '匹配度':
            value = mr.score;
            break;
        }
        dataPoint[`artist_${idx}`] = Math.round(value);
      });
      return dataPoint;
    });
  }, [matchResults]);

  const scoreBarData = useMemo(() => {
    return matchResults.map((mr, idx) => ({
      name: mr.artist.stageName,
      score: mr.score,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [matchResults]);

  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    matchResults.forEach((mr) => mr.artist.skills.forEach((s) => skillSet.add(s)));
    return Array.from(skillSet);
  }, [matchResults]);

  const allLanguages = useMemo(() => {
    const langSet = new Set<string>();
    matchResults.forEach((mr) => mr.artist.languages.forEach((l) => langSet.add(l)));
    return Array.from(langSet);
  }, [matchResults]);

  if (matchResults.length === 0) return null;

  return (
    <Card variant="glass" className={cn('animate-fade-in-up', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-500" />
            艺人对比 ({matchResults.length}/4)
          </CardTitle>
          <p className="text-sm text-midnight-300 mt-1">选择最多4位艺人进行多维度对比分析</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} leftIcon={<X className="w-4 h-4" />}>
          关闭对比
        </Button>
      </CardHeader>

      <CardContent className="space-y-8">
        <div
          className="grid gap-4 pb-6 border-b border-midnight-700/50"
          style={{ gridTemplateColumns: `repeat(${matchResults.length}, minmax(0, 1fr))` }}
        >
          {matchResults.map((mr, idx) => {
            const primaryPhoto =
              mr.artist.mediaAssets.find((m) => m.isPrimary) || mr.artist.mediaAssets[0];
            return (
              <div key={mr.artist.id} className="relative">
                <button
                  onClick={() => onRemove(mr.artist.id)}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-midnight-800 border border-midnight-600 text-midnight-300 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all duration-300 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                  <img
                    src={primaryPhoto?.url}
                    alt={mr.artist.stageName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-semibold text-white mb-1">{mr.artist.stageName}</h3>
                    <p className="text-sm text-midnight-300">{mr.artist.realName}</p>
                  </div>
                  <div
                    className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {idx + 1}
                  </div>
                </div>
                <div className="mt-3">
                  <MatchScoreBar score={mr.score} size="sm" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-0">
          <div
            className="grid gap-2 pb-2"
            style={{ gridTemplateColumns: `160px repeat(${matchResults.length}, minmax(0, 1fr))` }}
          >
            <div />
            {matchResults.map((mr) => (
              <div key={mr.artist.id} className="text-center">
                <Badge
                  variant="primary"
                  size="sm"
                  className="text-xs"
                  style={{ backgroundColor: CHART_COLORS[matchResults.indexOf(mr) % CHART_COLORS.length] + '30' }}
                >
                  {mr.artist.stageName}
                </Badge>
              </div>
            ))}
          </div>

          <AttrRow
            label="年龄"
            icon={<Calendar className="w-4 h-4" />}
            values={matchResults.map((mr) => ({
              artistId: mr.artist.id,
              value: mr.artist.age,
            }))}
            unit="岁"
            numeric
            higherIsBetter={false}
          />

          <AttrRow
            label="身高"
            icon={<Ruler className="w-4 h-4" />}
            values={matchResults.map((mr) => ({
              artistId: mr.artist.id,
              value: mr.artist.height,
            }))}
            unit="cm"
            numeric
          />

          <AttrRow
            label="体重"
            icon={<User className="w-4 h-4" />}
            values={matchResults.map((mr) => ({
              artistId: mr.artist.id,
              value: mr.artist.weight,
            }))}
            unit="kg"
            numeric
            higherIsBetter={false}
          />

          <AttrRow
            label="三围"
            icon={<Ruler className="w-4 h-4" />}
            values={matchResults.map((mr) => ({
              artistId: mr.artist.id,
              value: `${mr.artist.bust}/${mr.artist.waist}/${mr.artist.hips}`,
            }))}
          />

          <AttrRow
            label="眼睛颜色"
            icon={<Eye className="w-4 h-4" />}
            values={matchResults.map((mr) => ({
              artistId: mr.artist.id,
              value: mr.artist.eyeColor,
            }))}
          />

          <AttrRow
            label="头发颜色"
            icon={<ChevronDown className="w-4 h-4" />}
            values={matchResults.map((mr) => ({
              artistId: mr.artist.id,
              value: mr.artist.hairColor,
            }))}
          />

          <AttrRow
            label="所在地"
            icon={<MapPin className="w-4 h-4" />}
            values={matchResults.map((mr) => ({
              artistId: mr.artist.id,
              value: mr.artist.location,
            }))}
          />

          <AttrRow
            label="合同状态"
            icon={<FileCheck className="w-4 h-4" />}
            values={matchResults.map((mr) => ({
              artistId: mr.artist.id,
              value:
                mr.artist.contractStatus === 'available'
                  ? '可接通告'
                  : mr.artist.contractStatus === 'signed'
                  ? '已签约'
                  : mr.artist.contractStatus === 'exclusive'
                  ? '专属合约'
                  : '暂不可用',
            }))}
          />

          <div className="grid grid-cols-[160px_1fr] border-b border-midnight-700/50 py-3">
            <div className="flex items-center gap-2 pr-4">
              <Briefcase className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-midnight-200 font-medium">专业技能</span>
            </div>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${matchResults.length}, minmax(0, 1fr))` }}
            >
              {matchResults.map((mr, idx) => (
                <div key={mr.artist.id} className="flex flex-wrap gap-1.5">
                  {allSkills.map((skill) => {
                    const hasSkill = mr.artist.skills.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all',
                          hasSkill
                            ? 'text-white shadow-sm'
                            : 'bg-midnight-700/30 text-midnight-500 border border-midnight-600/50'
                        )}
                        style={
                          hasSkill
                            ? { backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }
                            : undefined
                        }
                      >
                        {hasSkill && <Check className="w-3 h-3 mr-0.5" />}
                        {skill}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[160px_1fr] border-b border-midnight-700/50 py-3">
            <div className="flex items-center gap-2 pr-4">
              <Languages className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-midnight-200 font-medium">语言能力</span>
            </div>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${matchResults.length}, minmax(0, 1fr))` }}
            >
              {matchResults.map((mr, idx) => (
                <div key={mr.artist.id} className="flex flex-wrap gap-1.5">
                  {allLanguages.map((lang) => {
                    const hasLang = mr.artist.languages.includes(lang);
                    return (
                      <span
                        key={lang}
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all',
                          hasLang
                            ? 'text-white shadow-sm'
                            : 'bg-midnight-700/30 text-midnight-500 border border-midnight-600/50'
                        )}
                        style={
                          hasLang
                            ? { backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }
                            : undefined
                        }
                      >
                        {hasLang && <Check className="w-3 h-3 mr-0.5" />}
                        {lang}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[160px_1fr] py-3">
            <div className="flex items-start gap-2 pr-4 pt-1">
              <FileCheck className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-midnight-200 font-medium">档期情况</span>
            </div>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${matchResults.length}, minmax(0, 1fr))` }}
            >
              {matchResults.map((mr) => (
                <div key={mr.artist.id}>
                  <ScheduleConflictIndicator conflicts={mr.conflicts} compact />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <div className="p-4 rounded-xl bg-midnight-800/50 border border-midnight-700/50">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              匹配分数对比
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333366" />
                  <XAxis type="number" domain={[0, 100]} stroke="#8c8cb3" />
                  <YAxis type="category" dataKey="name" stroke="#8c8cb3" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #333366',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                    {scoreBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-midnight-800/50 border border-midnight-700/50">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-rose-400" />
              多维度能力雷达图
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333366" />
                  <PolarAngleAxis dataKey="category" stroke="#8c8cb3" tick={{ fill: '#8c8cb3', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#333366" />
                  {matchResults.map((mr, idx) => (
                    <Radar
                      key={mr.artist.id}
                      name={mr.artist.stageName}
                      dataKey={`artist_${idx}`}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{ color: '#d9d9e6', fontSize: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompareView;
