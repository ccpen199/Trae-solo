import React, { useState, useMemo } from 'react';
import {
  Search,
  FileText,
  CheckCircle,
  FileWarning,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Upload,
  X,
  Tag,
  Users,
  Layers,
  Hourglass,
  ChevronDown,
  Sparkles,
  Info,
  Save,
  ArrowLeft,
  Palette,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockPolicyDocuments, mockPolicyTags } from '@/mock/data';
import { formatDate, getStatusText, getStatusColor } from '@/utils/format';
import type { PolicyDocument, PolicyTag, PolicyStatus, TagCategory } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'list' | 'editor' | 'tags';
type StatusFilter = 'all' | PolicyStatus;
type TagCategoryFilter = 'all' | TagCategory;

const tagCategoryInfo: Record<TagCategory, { label: string; icon: React.ReactNode; color: string }> = {
  crowd: { label: '人群标签', icon: <Users className="w-4 h-4" />, color: '#165DFF' },
  scene: { label: '场景标签', icon: <Layers className="w-4 h-4" />, color: '#722ED1' },
  timeliness: { label: '时效标签', icon: <Hourglass className="w-4 h-4" />, color: '#FF7D00' },
};

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
  { value: 'expired', label: '已过期' },
];

const tagCategoryOptions = [
  { value: 'all', label: '全部分类' },
  { value: 'crowd', label: '人群标签' },
  { value: 'scene', label: '场景标签' },
  { value: 'timeliness', label: '时效标签' },
];

const colorPresets = [
  '#165DFF', '#0FC6C2', '#FF7D00', '#00B42A', '#722ED1',
  '#F53F3F', '#86909C', '#14C9C9', '#722ED1', '#F7BA1E',
];

const PolicyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tagCategoryFilter, setTagCategoryFilter] = useState<TagCategoryFilter>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyDocument | null>(null);
  const [policies, setPolicies] = useState<PolicyDocument[]>(mockPolicyDocuments);
  const [tags, setTags] = useState<PolicyTag[]>(mockPolicyTags);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<PolicyTag | null>(null);
  const [tagForm, setTagForm] = useState({ name: '', category: 'crowd' as TagCategory, color: '#165DFF' });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagSelector, setShowTagSelector] = useState<TagCategory | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    documentNo: '',
    issuingAuthority: '',
    publishDate: '',
    effectiveDate: '',
    expiryDate: '',
    summary: '',
    content: '',
    tagIds: [] as string[],
  });

  const stats = useMemo(() => {
    const total = policies.length;
    const published = policies.filter((p) => p.status === 'published').length;
    const draft = policies.filter((p) => p.status === 'draft').length;
    const expiring = policies.filter((p) => {
      if (!p.expiryDate) return false;
      const expiry = new Date(p.expiryDate).getTime();
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      return expiry > now && expiry - now < thirtyDays;
    }).length;
    return { total, published, draft, expiring };
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchSearch =
        searchText === '' ||
        policy.title.includes(searchText) ||
        policy.documentNo.includes(searchText);
      const matchStatus = statusFilter === 'all' || policy.status === statusFilter;
      const matchCategory =
        tagCategoryFilter === 'all' ||
        policy.tags.some((tag) => tag.category === tagCategoryFilter);
      return matchSearch && matchStatus && matchCategory;
    });
  }, [policies, searchText, statusFilter, tagCategoryFilter]);

  const tagUsageCount = useMemo(() => {
    const countMap: Record<string, number> = {};
    policies.forEach((policy) => {
      policy.tags.forEach((tag) => {
        countMap[tag.id] = (countMap[tag.id] || 0) + 1;
      });
    });
    return countMap;
  }, [policies]);

  const recommendedTags = useMemo(() => {
    if (!formData.title && !formData.summary) return [];
    const text = `${formData.title} ${formData.summary}`.toLowerCase();
    return tags
      .filter((tag) => {
        const tagWords = tag.name.toLowerCase().split(/[人员\s]+/);
        return tagWords.some((word) => word.length > 1 && text.includes(word));
      })
      .slice(0, 5);
  }, [formData.title, formData.summary, tags]);

  const statCards = [
    {
      title: '政策文件总数',
      value: stats.total,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
    },
    {
      title: '已发布',
      value: stats.published,
      icon: CheckCircle,
      gradient: 'from-success-500 to-success-600',
      bgColor: 'bg-success-500/10',
      textColor: 'text-success-500',
    },
    {
      title: '草稿',
      value: stats.draft,
      icon: FileWarning,
      gradient: 'from-warning-500 to-warning-600',
      bgColor: 'bg-warning-500/10',
      textColor: 'text-warning-500',
    },
    {
      title: '即将到期',
      value: stats.expiring,
      icon: Clock,
      gradient: 'from-danger-500 to-danger-600',
      bgColor: 'bg-danger-500/10',
      textColor: 'text-danger-500',
    },
  ];

  const tabs = [
    { key: 'list' as const, label: '政策列表', icon: FileText },
    { key: 'editor' as const, label: editingPolicy ? '编辑政策' : '新建政策', icon: Plus },
    { key: 'tags' as const, label: '标签管理', icon: Tag },
  ];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'editor' && !editingPolicy) {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      documentNo: '',
      issuingAuthority: '',
      publishDate: '',
      effectiveDate: '',
      expiryDate: '',
      summary: '',
      content: '',
      tagIds: [],
    });
    setSelectedTags([]);
    setEditingPolicy(null);
  };

  const handleEditPolicy = (policy: PolicyDocument) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      documentNo: policy.documentNo,
      issuingAuthority: policy.issuingAuthority,
      publishDate: policy.publishDate,
      effectiveDate: policy.effectiveDate,
      expiryDate: policy.expiryDate || '',
      summary: policy.summary,
      content: policy.content,
      tagIds: policy.tags.map((t) => t.id),
    });
    setSelectedTags(policy.tags.map((t) => t.id));
    setActiveTab('editor');
  };

  const handleSavePolicy = (status: PolicyStatus = 'draft') => {
    const policyTags = tags.filter((t) => selectedTags.includes(t.id));
    if (editingPolicy) {
      setPolicies(
        policies.map((p) =>
          p.id === editingPolicy.id
            ? { ...p, ...formData, tags: policyTags, status }
            : p
        )
      );
    } else {
      const newPolicy: PolicyDocument = {
        id: `P${Date.now()}`,
        ...formData,
        tags: policyTags,
        status,
        viewCount: 0,
      };
      setPolicies([newPolicy, ...policies]);
    }
    setActiveTab('list');
    resetForm();
  };

  const handlePublishPolicy = (id: string) => {
    setPolicies(
      policies.map((p) =>
        p.id === id ? { ...p, status: 'published' as PolicyStatus } : p
      )
    );
  };

  const handleUnpublishPolicy = (id: string) => {
    setPolicies(
      policies.map((p) =>
        p.id === id ? { ...p, status: 'draft' as PolicyStatus } : p
      )
    );
  };

  const handleDeletePolicy = (id: string) => {
    if (confirm('确定要删除这个政策文件吗？')) {
      setPolicies(policies.filter((p) => p.id !== id));
    }
  };

  const handleAddTag = () => {
    setEditingTag(null);
    setTagForm({ name: '', category: 'crowd', color: '#165DFF' });
    setShowTagModal(true);
  };

  const handleEditTag = (tag: PolicyTag) => {
    setEditingTag(tag);
    setTagForm({ name: tag.name, category: tag.category, color: tag.color });
    setShowTagModal(true);
  };

  const handleSaveTag = () => {
    if (!tagForm.name.trim()) return;
    if (editingTag) {
      setTags(tags.map((t) => (t.id === editingTag.id ? { ...t, ...tagForm } : t)));
      setPolicies(
        policies.map((p) => ({
          ...p,
          tags: p.tags.map((t) => (t.id === editingTag.id ? { ...t, ...tagForm } : t)),
        }))
      );
    } else {
      const newTag: PolicyTag = {
        id: `T${Date.now()}`,
        ...tagForm,
      };
      setTags([...tags, newTag]);
    }
    setShowTagModal(false);
  };

  const handleDeleteTag = (id: string) => {
    if (confirm('确定要删除这个标签吗？删除后相关政策将不再显示此标签。')) {
      setTags(tags.filter((t) => t.id !== id));
      setPolicies(
        policies.map((p) => ({
          ...p,
          tags: p.tags.filter((t) => t.id !== id),
        }))
      );
    }
  };

  const toggleTagSelection = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const addRecommendedTag = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const getTagsByCategory = (category: TagCategory) => {
    return tags.filter((t) => t.category === category);
  };

  const renderPolicyCard = (policy: PolicyDocument, index: number) => {
    const statusColor = getStatusColor(policy.status);

    return (
      <motion.div
        key={policy.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card hover className="h-full flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-neutral-600 mb-1 line-clamp-2 hover:text-primary-500 transition-colors cursor-pointer">
                {policy.title}
              </h3>
              <p className="text-xs text-neutral-400 font-mono">{policy.documentNo}</p>
            </div>
            <span className={`badge badge-${statusColor} flex-shrink-0 ml-2`}>
              {getStatusText(policy.status)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {policy.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>

          <p className="text-sm text-neutral-400 line-clamp-2 mb-3 flex-1">
            {policy.summary}
          </p>

          <div className="border-t border-neutral-100 pt-3">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span>{policy.issuingAuthority}</span>
              <span>发布于 {formatDate(policy.publishDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-neutral-300">
                <Eye className="w-3.5 h-3.5" />
                <span>{policy.viewCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => alert(`查看政策：${policy.title}`)}
                >
                  查看
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => handleEditPolicy(policy)}
                >
                  编辑
                </Button>
                {policy.status === 'draft' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<CheckCircle className="w-3.5 h-3.5" />}
                    onClick={() => handlePublishPolicy(policy.id)}
                    className="text-success-500 hover:text-success-600"
                  >
                    发布
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Clock className="w-3.5 h-3.5" />}
                    onClick={() => handleUnpublishPolicy(policy.id)}
                    className="text-warning-500 hover:text-warning-600"
                  >
                    下架
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const renderListTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-64 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
            <input
              type="text"
              placeholder="搜索标题/文号"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowStatusDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
            >
              <Tag className="w-4 h-4 text-neutral-400" />
              {tagCategoryOptions.find((o) => o.value === tagCategoryFilter)?.label}
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
                {tagCategoryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTagCategoryFilter(option.value as TagCategoryFilter);
                      setShowCategoryDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors',
                      tagCategoryFilter === option.value
                        ? 'text-primary-500 bg-primary-50'
                        : 'text-neutral-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowCategoryDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
            >
              <FileText className="w-4 h-4 text-neutral-400" />
              {statusOptions.find((o) => o.value === statusFilter)?.label}
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value as StatusFilter);
                      setShowStatusDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors',
                      statusFilter === option.value
                        ? 'text-primary-500 bg-primary-50'
                        : 'text-neutral-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => handleTabChange('editor')}
            className="ml-auto"
          >
            新建政策
          </Button>

          <span className="text-sm text-neutral-400">
            共 {filteredPolicies.length} 条记录
          </span>
        </div>
      </Card>

      {filteredPolicies.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((policy, index) =>
            renderPolicyCard(policy, index)
          )}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <FileText className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">暂无符合条件的政策文件</p>
        </Card>
      )}
    </motion.div>
  );

  const renderEditorTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => handleTabChange('list')}
            className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-neutral-600">
              {editingPolicy ? '编辑政策' : '新建政策'}
            </h2>
            <p className="text-xs text-neutral-400">
              {editingPolicy ? '修改政策文件信息' : '创建新的政策文件'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-2">
              政策标题 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入政策标题"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-2">
              文号
            </label>
            <input
              type="text"
              value={formData.documentNo}
              onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
              placeholder="如：京人社发〔2025〕1号"
              className="input-base font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-2">
              发布机构
            </label>
            <input
              type="text"
              value={formData.issuingAuthority}
              onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
              placeholder="请输入发布机构名称"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-2">
              发布日期
            </label>
            <input
              type="date"
              value={formData.publishDate}
              onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-2">
              生效日期
            </label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-2">
              失效日期
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="input-base"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-neutral-500 mb-2">
            政策摘要
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="请输入政策摘要，简要概括政策内容要点..."
            rows={3}
            className="input-base resize-none"
          />
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-neutral-500 mb-2">
            政策内容
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="请输入政策正文内容..."
            rows={10}
            className="input-base resize-none font-mono text-sm"
          />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warning-500" />
              智能标签推荐
            </label>
            <span className="text-xs text-neutral-400">
              基于政策内容自动推荐相关标签
            </span>
          </div>
          {recommendedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-3 bg-warning-50 rounded-lg border border-warning-100">
              {recommendedTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addRecommendedTag(tag.id)}
                  disabled={selectedTags.includes(tag.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-all',
                    selectedTags.includes(tag.id)
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-white hover:scale-105 cursor-pointer'
                  )}
                  style={{
                    borderColor: selectedTags.includes(tag.id) ? undefined : tag.color,
                    borderWidth: '1px',
                    color: selectedTags.includes(tag.id) ? undefined : tag.color,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  {tag.name}
                  {selectedTags.includes(tag.id) && <CheckCircle className="w-3 h-3" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 rounded-lg text-center">
              <p className="text-sm text-neutral-400">
                输入政策标题和摘要后，系统将自动推荐相关标签
              </p>
            </div>
          )}
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-neutral-500 mb-3">
            标签分类选择
          </label>
          <div className="space-y-4">
            {(Object.keys(tagCategoryInfo) as TagCategory[]).map((category) => (
              <div key={category} className="relative">
                <button
                  onClick={() =>
                    setShowTagSelector(showTagSelector === category ? null : category)
                  }
                  className="w-full flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: tagCategoryInfo[category].color }}
                    >
                      {tagCategoryInfo[category].icon}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-neutral-600">
                        {tagCategoryInfo[category].label}
                      </p>
                      <p className="text-xs text-neutral-400">
                        已选{' '}
                        {getTagsByCategory(category).filter((t) => selectedTags.includes(t.id)).length}{' '}
                        个标签
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-neutral-400 transition-transform',
                      showTagSelector === category && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {showTagSelector === category && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-2 flex flex-wrap gap-2">
                        {getTagsByCategory(category).map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => toggleTagSelection(tag.id)}
                            className={cn(
                              'px-3 py-1 text-sm rounded-full transition-all border',
                              selectedTags.includes(tag.id)
                                ? 'text-white border-transparent'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
                            )}
                            style={{
                              backgroundColor: selectedTags.includes(tag.id)
                                ? tag.color
                                : undefined,
                            }}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-neutral-500 mb-2">
            附件上传
          </label>
          <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center hover:border-primary-300 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-400">点击或拖拽文件到此处上传</p>
            <p className="text-xs text-neutral-300 mt-1">支持 PDF、Word、Excel 格式，最大 10MB</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => handleTabChange('list')}>
            取消
          </Button>
          <Button variant="secondary" onClick={() => handleSavePolicy('draft')}>
            保存草稿
          </Button>
          <Button
            icon={<Save className="w-4 h-4" />}
            onClick={() => handleSavePolicy('published')}
          >
            立即发布
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  const renderTagsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-neutral-600">标签管理</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              管理政策智能标签分类，支持人群、场景、时效三类标签
            </p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={handleAddTag}>
            新增标签
          </Button>
        </div>

        <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-primary-600 mb-1">智能标签系统说明</h4>
              <p className="text-xs text-primary-400 leading-relaxed">
                智能标签系统基于自然语言处理技术，自动为政策文件生成分类标签。系统支持三类标签：
                人群标签（按适用人群分类）、场景标签（按业务场景分类）、时效标签（按政策时效性分类）。
                管理员可自定义标签名称和颜色，系统会根据政策内容自动推荐相关标签。
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {(Object.keys(tagCategoryInfo) as TagCategory[]).map((category, catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <Card className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: tagCategoryInfo[category].color }}
                  >
                    {tagCategoryInfo[category].icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-600">
                      {tagCategoryInfo[category].label}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      共 {getTagsByCategory(category).length} 个标签
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {getTagsByCategory(category).map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-neutral-600">{tag.name}</span>
                        <span className="text-xs text-neutral-300 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {tagUsageCount[tag.id] || 0} 次
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditTag(tag)}
                          className="w-7 h-7 rounded hover:bg-white flex items-center justify-center text-neutral-400 hover:text-primary-500 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="w-7 h-7 rounded hover:bg-white flex items-center justify-center text-neutral-400 hover:text-danger-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {getTagsByCategory(category).length === 0 && (
                    <div className="py-6 text-center">
                      <Tag className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400">暂无标签</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-600 mb-2">政策文件智能标签管理</h1>
          <p className="text-sm text-neutral-400">
            管理政策文件及智能标签分类，提升政策检索效率和精准度
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card hover className="relative overflow-hidden">
                <div
                  className={`absolute top-0 right-0 w-24 h-24 ${card.bgColor} rounded-bl-full -translate-y-6 translate-x-6`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}
                    >
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-neutral-400 mb-1">{card.title}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-neutral-600">
                      {card.value}
                    </span>
                    <span className="text-xs text-neutral-400">件</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card padding="none" className="mb-5">
          <div className="flex border-b border-neutral-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors relative',
                  activeTab === tab.key
                    ? 'text-primary-500'
                    : 'text-neutral-400 hover:text-neutral-500'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                  />
                )}
              </button>
            ))}
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {activeTab === 'list' && <div key="list">{renderListTab()}</div>}
          {activeTab === 'editor' && <div key="editor">{renderEditorTab()}</div>}
          {activeTab === 'tags' && <div key="tags">{renderTagsTab()}</div>}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showTagModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowTagModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-white rounded-xl shadow-modal z-50"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <h3 className="text-base font-semibold text-neutral-600">
                  {editingTag ? '编辑标签' : '新增标签'}
                </h3>
                <button
                  onClick={() => setShowTagModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-2">
                    标签名称 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tagForm.name}
                    onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                    placeholder="请输入标签名称"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-2">
                    标签分类
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(tagCategoryInfo) as TagCategory[]).map((category) => (
                      <button
                        key={category}
                        onClick={() => setTagForm({ ...tagForm, category })}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all',
                          tagForm.category === category
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: tagCategoryInfo[category].color }}
                        >
                          {tagCategoryInfo[category].icon}
                        </div>
                        <span className="text-xs text-neutral-600">
                          {tagCategoryInfo[category].label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-2">
                    标签颜色
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          onClick={() => setTagForm({ ...tagForm, color })}
                          className={cn(
                            'w-7 h-7 rounded-full transition-transform hover:scale-110',
                            tagForm.color === color && 'ring-2 ring-offset-2'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={tagForm.color}
                        onChange={(e) =>
                          setTagForm({ ...tagForm, color: e.target.value })
                        }
                        className="w-20 px-2 py-1 text-xs border border-neutral-200 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-neutral-100">
                <Button variant="outline" onClick={() => setShowTagModal(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveTag}>保存</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PolicyManagement;
