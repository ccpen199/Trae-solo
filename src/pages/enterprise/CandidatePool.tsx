import { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout';
import { Card, Badge, MatchScore, Button, SkillRadarChart, Modal } from '@/components/ui';
import { Search, Filter, Grid, List, Download, MessageSquare, Calendar, Video, Award, X, User, MapPin, Clock, Briefcase, ChevronRight, CheckCircle } from 'lucide-react';
import { mockMatchResults, mockTalents } from '@shared/mock/data';
import { MatchResult, TalentProfile, INDUSTRY_LIST, SKILL_DIMENSIONS } from '@shared/types';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type SortOption = 'match' | 'experience' | 'newest';

interface FilterState {
  search: string;
  industry: string;
  minScore: number;
  maxScore: number;
  minExperience: number;
  maxExperience: number;
  location: string;
}

export default function CandidatePool() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState<TalentProfile | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    industry: '',
    minScore: 0,
    maxScore: 100,
    minExperience: 0,
    maxExperience: 20,
    location: '',
  });

  const filteredResults = useMemo(() => {
    let results = [...mockMatchResults];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter((r) =>
        r.talent?.name.toLowerCase().includes(searchLower) ||
        r.talent?.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    if (filters.industry) {
      results = results.filter((r) =>
        r.talent?.preferredIndustries.includes(filters.industry as any)
      );
    }

    if (filters.minScore > 0 || filters.maxScore < 100) {
      results = results.filter(
        (r) => r.overallScore >= filters.minScore && r.overallScore <= filters.maxScore
      );
    }

    if (filters.minExperience > 0 || filters.maxExperience < 20) {
      results = results.filter(
        (r) =>
          r.talent?.experienceYears >= filters.minExperience &&
          r.talent?.experienceYears <= filters.maxExperience
      );
    }

    if (filters.location) {
      results = results.filter((r) =>
        r.talent?.currentLocation.includes(filters.location)
      );
    }

    results.sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return b.overallScore - a.overallScore;
        case 'experience':
          return (b.talent?.experienceYears || 0) - (a.talent?.experienceYears || 0);
        case 'newest':
          return new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime();
        default:
          return 0;
      }
    });

    return results;
  }, [filters, sortBy]);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResults.map((r) => r.talentId)));
    }
  };

  const handleSelect = (talentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(talentId)) {
      newSelected.delete(talentId);
    } else {
      newSelected.add(talentId);
    }
    setSelectedIds(newSelected);
  };

  const handleViewDetail = (talent: TalentProfile) => {
    setSelectedCandidate(talent);
    setShowDetailPanel(true);
  };

  const getMatchResultForTalent = (talentId: string) => {
    return mockMatchResults.find((r) => r.talentId === talentId);
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚在线';
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-mint-500';
    if (score >= 75) return 'text-primary-500';
    return 'text-accent-500';
  };

  return (
    <PageLayout
      title="候选人才池"
      subtitle="AI智能匹配，精准筛选最优候选人"
    >
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="搜索候选人姓名、技能标签..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} />
                筛选
              </Button>
              <div className="flex items-center bg-neutral-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'grid' ? 'bg-white shadow-sm text-primary-500' : 'text-neutral-500 hover:text-primary-500'
                  )}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'list' ? 'bg-white shadow-sm text-primary-500' : 'text-neutral-500 hover:text-primary-500'
                  )}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">行业</label>
                <select
                  value={filters.industry}
                  onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none"
                >
                  <option value="">全部行业</option>
                  {INDUSTRY_LIST.map((i) => (
                    <option key={i.key} value={i.key}>{i.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">匹配分范围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minScore}
                    onChange={(e) => setFilters({ ...filters, minScore: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none"
                    placeholder="最低"
                  />
                  <span className="text-neutral-400">-</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.maxScore}
                    onChange={(e) => setFilters({ ...filters, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none"
                    placeholder="最高"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">工作年限</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={filters.minExperience}
                    onChange={(e) => setFilters({ ...filters, minExperience: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none"
                    placeholder="最低"
                  />
                  <span className="text-neutral-400">-</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={filters.maxExperience}
                    onChange={(e) => setFilters({ ...filters, maxExperience: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none"
                    placeholder="最高"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">所在地</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="城市名称"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">排序方式</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none"
                >
                  <option value="match">匹配度优先</option>
                  <option value="experience">经验优先</option>
                  <option value="newest">最新匹配</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-neutral-600">
              共 <span className="font-semibold text-primary-500">{filteredResults.length}</span> 位候选人
            </span>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredResults.length && filteredResults.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-600">全选</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => alert(`向 ${selectedIds.size} 位候选人发送面试邀请`)}
            >
              <Calendar size={16} />
              邀约面试
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => setShowTagModal(true)}
            >
              <Award size={16} />
              添加标签
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={selectedIds.size === 0}
            >
              <Download size={16} />
              导出
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredResults.map((result) => (
              <CandidateCard
                key={result.talentId}
                result={result}
                isSelected={selectedIds.has(result.talentId)}
                onSelect={() => handleSelect(result.talentId)}
                onViewDetail={() => result.talent && handleViewDetail(result.talent)}
                formatLastActive={formatLastActive}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResults.map((result) => (
              <CandidateListItem
                key={result.talentId}
                result={result}
                isSelected={selectedIds.has(result.talentId)}
                onSelect={() => handleSelect(result.talentId)}
                onViewDetail={() => result.talent && handleViewDetail(result.talent)}
                formatLastActive={formatLastActive}
                getScoreColor={getScoreColor}
              />
            ))}
          </div>
        )}

        {filteredResults.length === 0 && (
          <div className="text-center py-16">
            <User className="mx-auto text-neutral-300 mb-4" size={64} />
            <p className="text-neutral-500">没有找到符合条件的候选人</p>
            <Button variant="secondary" className="mt-4" onClick={() => setFilters({
              search: '',
              industry: '',
              minScore: 0,
              maxScore: 100,
              minExperience: 0,
              maxExperience: 20,
              location: '',
            })}>
              清除筛选条件
            </Button>
          </div>
        )}
      </div>

      {showDetailPanel && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowDetailPanel(false)}
          />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-serif font-bold text-primary-800">候选人详情</h2>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={selectedCandidate.avatar}
                    alt={selectedCandidate.name}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                  />
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-mint-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-primary-800">{selectedCandidate.name}</h3>
                    <Badge variant="primary">{selectedCandidate.experienceYears}年经验</Badge>
                  </div>
                  <p className="text-neutral-500 mt-1">期望薪资: ¥{selectedCandidate.expectedSalary}/月</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-neutral-500">
                    <MapPin size={14} />
                    <span>{selectedCandidate.currentLocation}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedCandidate.tags.map((tag) => (
                      <Badge key={tag} variant="info" size="sm">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <MatchScore
                  score={getMatchResultForTalent(selectedCandidate.id)?.overallScore || 0}
                  size="lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mint-50 flex items-center justify-center">
                      <Award className="text-mint-500" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">服务场景适配</p>
                      <p className="text-lg font-bold text-mint-500">{selectedCandidate.scenarioFitScore}%</p>
                    </div>
                  </div>
                </Card>
                <Card padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Briefcase className="text-primary-500" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">工作经验</p>
                      <p className="text-lg font-bold text-primary-500">{selectedCandidate.experienceYears}年</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary-800 flex items-center gap-2">
                  <Award size={18} />
                  证书资质
                </h4>
                <div className="space-y-3">
                  {selectedCandidate.certificates.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                          <Award className="text-accent-500" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-800">{cert.name}</p>
                          <p className="text-sm text-neutral-500">{cert.issuer} · {new Date(cert.issueDate).getFullYear()}年</p>
                        </div>
                      </div>
                      {cert.verified && (
                        <Badge variant="success">
                          <CheckCircle size={12} className="mr-1" />
                          已验证
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary-800">技能雷达对比</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <p className="text-sm text-neutral-500 mb-2 text-center">岗位要求</p>
                    <SkillRadarChart
                      data={getMatchResultForTalent(selectedCandidate.id)?.job?.skillRadar || selectedCandidate.skillRadar}
                      size={220}
                    />
                  </Card>
                  <Card>
                    <p className="text-sm text-neutral-500 mb-2 text-center">候选人能力</p>
                    <SkillRadarChart
                      data={selectedCandidate.skillRadar}
                      size={220}
                    />
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary-800">匹配度明细</h4>
                <MatchScore
                  score={getMatchResultForTalent(selectedCandidate.id)?.overallScore || 0}
                  size="md"
                  showDetails
                  breakdown={getMatchResultForTalent(selectedCandidate.id)}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary-800 flex items-center gap-2">
                  <Briefcase size={18} />
                  工作经历
                </h4>
                <div className="relative pl-8">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-neutral-200" />
                  {[
                    { title: '高级前台接待', company: '某五星级酒店', period: '2022 - 至今' },
                    { title: '前台接待', company: '某商务酒店', period: '2020 - 2022' },
                  ].map((exp, idx) => (
                    <div key={idx} className="relative pb-6 last:pb-0">
                      <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-primary-500 border-2 border-white" />
                      <p className="font-medium text-neutral-800">{exp.title}</p>
                      <p className="text-sm text-neutral-500">{exp.company}</p>
                      <p className="text-xs text-neutral-400 mt-1">{exp.period}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary-800 flex items-center gap-2">
                  <Video size={18} />
                  视频简历
                </h4>
                <div className="aspect-video bg-neutral-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Video className="mx-auto text-neutral-400 mb-2" size={48} />
                    <p className="text-neutral-500">视频简历</p>
                    <Button variant="secondary" size="sm" className="mt-3">
                      <Video size={16} />
                      播放视频
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary-800">服务场景适配度</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedCandidate.serviceScenarios.map((scenario, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-br from-mint-50 to-primary-50 rounded-xl text-center">
                      <p className="font-medium text-primary-700">{scenario}</p>
                      <p className="text-2xl font-bold text-mint-500 mt-1">{Math.min(100, 85 + idx * 5)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <Button variant="secondary" className="flex-1">
                  <MessageSquare size={18} />
                  发起沟通
                </Button>
                <Button className="flex-1">
                  <Calendar size={18} />
                  邀约面试
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title="批量添加标签"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowTagModal(false)}>取消</Button>
            <Button onClick={() => {
              alert(`已为 ${selectedIds.size} 位候选人添加标签`);
              setShowTagModal(false);
            }}>确定</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-neutral-600">已选择 <span className="font-semibold text-primary-500">{selectedIds.size}</span> 位候选人</p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">选择标签</label>
            <div className="flex flex-wrap gap-2">
              {['高潜力', '急招', '英语流利', '经验丰富', '可立即到岗', '本地人才'].map((tag) => (
                <Badge
                  key={tag}
                  variant="info"
                  className="cursor-pointer hover:bg-primary-100 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">自定义标签</label>
            <input
              type="text"
              placeholder="输入自定义标签，多个标签用逗号分隔"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}

interface CandidateCardProps {
  result: MatchResult;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
  formatLastActive: (date: Date) => string;
}

function CandidateCard({ result, isSelected, onSelect, onViewDetail, formatLastActive }: CandidateCardProps) {
  const { talent } = result;
  if (!talent) return null;

  return (
    <Card
      className={cn(
        'group transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-card-hover',
        isSelected && 'ring-2 ring-primary-500'
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 mt-1"
            />
            <div className="relative">
              <img
                src={talent.avatar}
                alt={talent.name}
                className="w-14 h-14 rounded-full"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-mint-500 rounded-full border-2 border-white animate-pulse-slow" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">{talent.name}</h3>
              <p className="text-sm text-neutral-500">{talent.experienceYears}年经验</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
                <Clock size={12} />
                <span>{formatLastActive(result.matchedAt)}</span>
              </div>
            </div>
          </div>
          <MatchScore score={result.overallScore} size="sm" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {talent.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="info" size="sm">{tag}</Badge>
          ))}
          {talent.tags.length > 3 && (
            <Badge variant="info" size="sm">+{talent.tags.length - 3}</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onViewDetail}
          >
            查看详情
            <ChevronRight size={16} />
          </Button>
          <Button variant="secondary" size="sm">
            <MessageSquare size={16} />
          </Button>
          <Button size="sm">
            <Calendar size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface CandidateListItemProps {
  result: MatchResult;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
  formatLastActive: (date: Date) => string;
  getScoreColor: (score: number) => string;
}

function CandidateListItem({ result, isSelected, onSelect, onViewDetail, formatLastActive, getScoreColor }: CandidateListItemProps) {
  const { talent } = result;
  if (!talent) return null;

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        'hover:shadow-card-hover',
        isSelected && 'ring-2 ring-primary-500'
      )}
      padding="sm"
    >
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
        />
        <div className="relative">
          <img
            src={talent.avatar}
            alt={talent.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-mint-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-800 truncate">{talent.name}</h3>
            <Badge variant="primary" size="sm">{talent.experienceYears}年</Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {talent.currentLocation}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatLastActive(result.matchedAt)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {talent.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="info" size="sm">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className={cn('text-2xl font-bold', getScoreColor(result.overallScore))}>
            {result.overallScore}
          </p>
          <p className="text-xs text-neutral-400">匹配度</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onViewDetail}>
            查看详情
          </Button>
          <Button variant="secondary" size="sm">
            <MessageSquare size={16} />
          </Button>
          <Button size="sm">
            <Calendar size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
