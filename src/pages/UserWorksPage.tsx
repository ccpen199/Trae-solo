import { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Share2,
  Eye,
  Globe,
  Lock,
  Users,
  Search,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { communityWorks } from '@/mock/data/community';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';
import type { PrivacyType } from '@/types';

const privacyOptions: {
  value: PrivacyType;
  label: string;
  icon: typeof Globe;
  description: string;
}[] = [
  {
    value: 'public',
    label: '公开',
    icon: Globe,
    description: '所有人可见',
  },
  {
    value: 'private',
    label: '仅自己',
    icon: Lock,
    description: '只有你能看到',
  },
  {
    value: 'friends',
    label: '指定好友',
    icon: Users,
    description: '仅指定好友可见',
  },
];

const tabOptions = [
  { value: 'all', label: '全部作品' },
  { value: 'public', label: '公开' },
  { value: 'private', label: '私密' },
];

export default function UserWorksPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [currentWorkId, setCurrentWorkId] = useState<string | null>(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyType>('public');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<string | null>(null);

  const { user } = useUserStore();

  const myWorks = communityWorks.slice(0, 8).map((work, idx) => ({
    ...work,
    privacy: (['public', 'private', 'friends', 'public', 'public', 'private', 'friends', 'public'] as PrivacyType[])[idx],
  }));

  const filteredWorks = myWorks.filter((work) => {
    if (activeTab !== 'all' && work.privacy !== activeTab) return false;
    if (searchQuery && !work.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openPrivacyModal = (workId: string, currentPrivacy: PrivacyType) => {
    setCurrentWorkId(workId);
    setSelectedPrivacy(currentPrivacy);
    setPrivacyModalOpen(true);
  };

  const handleDelete = (workId: string) => {
    setWorkToDelete(workId);
    setDeleteConfirmOpen(true);
  };

  const getPrivacyIcon = (privacy: PrivacyType) => {
    switch (privacy) {
      case 'public':
        return Globe;
      case 'private':
        return Lock;
      case 'friends':
        return Users;
      default:
        return Globe;
    }
  };

  const getPrivacyLabel = (privacy: PrivacyType) => {
    switch (privacy) {
      case 'public':
        return '公开';
      case 'private':
        return '私密';
      case 'friends':
        return '好友可见';
      default:
        return '公开';
    }
  };

  const getPrivacyVariant = (privacy: PrivacyType) => {
    switch (privacy) {
      case 'public':
        return 'brand';
      case 'private':
        return 'default';
      case 'friends':
        return 'gold';
      default:
        return 'brand';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-paper-900">
            我的作品
          </h1>
          <p className="mt-1 text-sm text-paper-500">
            共 {myWorks.length} 个作品
          </p>
        </div>
        <Button variant="primary" onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          创建作品
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList>
                {tabOptions.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="sm:w-64">
              <Input
                placeholder="搜索作品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {filteredWorks.map((work) => {
          const PrivacyIcon = getPrivacyIcon(work.privacy as PrivacyType);

          return (
            <Card
              key={work.id}
              hoverable
              className="overflow-hidden group"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-paper-100">
                <img
                  src={work.thumbnailUrl || work.imageUrl}
                  alt={work.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-3 right-3">
                  <Tag
                    variant={getPrivacyVariant(work.privacy as PrivacyType)}
                    size="sm"
                    className="bg-black/50 backdrop-blur-sm text-white border-0"
                  >
                    <PrivacyIcon className="w-3 h-3 mr-1" />
                    {getPrivacyLabel(work.privacy as PrivacyType)}
                  </Tag>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPrivacyModal(work.id, work.privacy as PrivacyType);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      隐私
                    </Button>
                  </div>
                </div>

                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-1.5 rounded-md bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-paper-900 truncate">{work.title}</h3>
                <div className="mt-2 flex items-center justify-between text-xs text-paper-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {work.createdAt}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {work.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {work.comments}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-1.5 rounded-md text-paper-400 hover:text-paper-600 hover:bg-paper-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-1.5 rounded-md text-paper-400 hover:text-paper-600 hover:bg-paper-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(work.id);
                    }}
                    className="p-1.5 rounded-md text-paper-400 hover:text-darkroom-500 hover:bg-darkroom-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredWorks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-paper-100 flex items-center justify-center">
              <Eye className="w-8 h-8 text-paper-400" />
            </div>
            <p className="text-paper-500">暂无作品</p>
            <Button variant="primary" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              创建第一个作品
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="隐私设置"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setPrivacyModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setPrivacyModalOpen(false);
              }}
            >
              确定
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedPrivacy === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setSelectedPrivacy(option.value)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left',
                  isSelected
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-paper-200 hover:border-paper-300 bg-white'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-brand-500 text-white' : 'bg-paper-100 text-paper-500'
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    'font-medium',
                    isSelected ? 'text-brand-700' : 'text-paper-900'
                  )}>
                    {option.label}
                  </p>
                  <p className="text-sm text-paper-500">{option.description}</p>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    isSelected
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-paper-300'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {selectedPrivacy === 'friends' && (
          <div className="mt-4 p-4 bg-paper-50 rounded-lg">
            <p className="text-sm text-paper-600 mb-3">选择可见的好友</p>
            <div className="flex flex-wrap gap-2">
              {['甜甜妈妈', '旅行的意义', '设计小达人', '猫奴一枚'].map((friend, idx) => (
                <Tag key={idx} variant="brand" size="md" closable>
                  {friend}
                </Tag>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-3">
              <Plus className="w-3.5 h-3.5 mr-1" />
              添加好友
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="删除作品"
        size="sm"
      >
        <p className="text-paper-600">
          确定要删除这个作品吗？删除后无法恢复。
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            取消
          </Button>
          <Button
            variant="primary"
            className="bg-darkroom-500 hover:bg-darkroom-600"
            onClick={() => {
              setDeleteConfirmOpen(false);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            确认删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
