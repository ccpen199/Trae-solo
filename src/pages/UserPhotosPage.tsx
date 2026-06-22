import { useState } from 'react';
import {
  Upload,
  Grid3X3,
  LayoutGrid,
  List,
  Clock,
  Heart,
  Image,
  Lock,
  Globe,
  Users,
  ChevronDown,
  Search,
  Trash2,
  Download,
  MoreHorizontal,
  Check,
  Folder,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { photos } from '@/mock/data/photos';
import { usePhotoStore } from '@/store/photoStore';
import { cn } from '@/lib/utils';
import type { PrivacyType } from '@/types';

const sidebarCategories = [
  { key: 'all', label: '全部照片', icon: Image, count: 128 },
  { key: 'timeline', label: '按时间分组', icon: Calendar, count: 0 },
  { key: 'favorites', label: '我的收藏', icon: Heart, count: 24 },
];

const sortOptions = [
  { value: 'time-desc', label: '上传时间 最新' },
  { value: 'time-asc', label: '上传时间 最早' },
  { value: 'name-asc', label: '名称 A-Z' },
  { value: 'name-desc', label: '名称 Z-A' },
  { value: 'size-desc', label: '文件大小 最大' },
];

const viewModes = [
  { key: 'grid', icon: Grid3X3, label: '网格' },
  { key: 'waterfall', icon: LayoutGrid, label: '瀑布流' },
  { key: 'list', icon: List, label: '列表' },
];

const privacyIconMap: Record<PrivacyType, typeof Globe> = {
  public: Globe,
  private: Lock,
  friends: Users,
};

const privacyLabelMap: Record<PrivacyType, string> = {
  public: '公开',
  private: '私密',
  friends: '仅好友',
};

export default function UserPhotosPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'waterfall' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('time-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { photos: storePhotos } = usePhotoStore();
  const displayPhotos = storePhotos.length > 0 ? storePhotos : photos;

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const selectAll = () => {
    if (selectedPhotos.length === displayPhotos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(displayPhotos.map((p) => p.id));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-56 flex-shrink-0">
        <Card>
          <CardContent className="p-3">
            <Button
              className="w-full mb-4"
              variant="primary"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              上传照片
            </Button>

            <nav className="space-y-1">
              {sidebarCategories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    activeCategory === category.key
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-paper-600 hover:bg-paper-50 hover:text-paper-900'
                  )}
                >
                  <category.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left text-sm font-medium">
                    {category.label}
                  </span>
                  {category.count > 0 && (
                    <span className="text-xs text-paper-400">
                      {category.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-paper-100">
              <p className="text-xs font-medium text-paper-500 mb-2 px-3">
                按月份浏览
              </p>
              <nav className="space-y-1">
                {['2025年6月', '2025年5月', '2025年4月'].map((month, idx) => (
                  <button
                    key={month}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-paper-600 hover:bg-paper-50 hover:text-paper-900 transition-colors"
                  >
                    <Folder className="w-4 h-4 text-gold-500" />
                    <span className="flex-1 text-left">{month}</span>
                    <span className="text-xs text-paper-400">
                      {[42, 38, 25][idx]}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-w-0">
        <Card className="mb-6">
          <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="搜索照片..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                size="sm"
                className="w-36"
              />

              <div className="flex items-center bg-paper-100 rounded-lg p-1">
                {viewModes.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key as any)}
                    className={cn(
                      'p-1.5 rounded-md transition-all duration-200',
                      viewMode === mode.key
                        ? 'bg-white text-brand-500 shadow-sm'
                        : 'text-paper-500 hover:text-paper-700'
                    )}
                    title={mode.label}
                  >
                    <mode.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <Button
                variant={batchMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setBatchMode(!batchMode);
                  setSelectedPhotos([]);
                }}
              >
                {batchMode ? '取消批量' : '批量管理'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {batchMode && (
          <Card className="mb-4">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 text-sm text-paper-600 hover:text-paper-900"
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      selectedPhotos.length === displayPhotos.length
                        ? 'bg-brand-500 border-brand-500'
                        : 'border-paper-300'
                    )}
                  >
                    {selectedPhotos.length === displayPhotos.length && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span>全选</span>
                </button>
                <span className="text-sm text-paper-500">
                  已选 {selectedPhotos.length} 张
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  下载
                </Button>
                <Button variant="ghost" size="sm">
                  <Heart className="w-4 h-4 mr-1" />
                  收藏
                </Button>
                <Button variant="ghost" size="sm" className="text-darkroom-500">
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {displayPhotos.map((photo) => {
            const isSelected = selectedPhotos.includes(photo.id);
            const PrivacyIcon = privacyIconMap[photo.privacy as PrivacyType];

            return (
              <div
                key={photo.id}
                className={cn(
                  'group relative rounded-lg overflow-hidden bg-paper-100 cursor-pointer transition-all duration-300',
                  'hover:shadow-medium hover:-translate-y-0.5',
                  batchMode && isSelected && 'ring-2 ring-brand-500'
                )}
                onClick={() => {
                  if (batchMode) {
                    togglePhotoSelection(photo.id);
                  }
                }}
              >
                <div className="relative aspect-square">
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {batchMode && (
                    <div
                      className={cn(
                        'absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        isSelected
                          ? 'bg-brand-500 border-brand-500'
                          : 'bg-white/80 border-white/80'
                      )}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <Tag
                      variant={photo.privacy === 'private' ? 'default' : photo.privacy === 'friends' ? 'gold' : 'brand'}
                      size="sm"
                      className="bg-black/50 text-white border-0 backdrop-blur-sm"
                    >
                      <PrivacyIcon className="w-3 h-3" />
                    </Tag>
                  </div>

                  {photo.aiEnhanced && (
                    <div className="absolute bottom-2 left-2">
                      <Tag variant="brand" size="sm">
                        AI增强
                      </Tag>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-md bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {viewMode === 'list' && (
                  <div className="p-3">
                    <p className="text-sm font-medium text-paper-900 truncate">
                      {photo.id}.{photo.format}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-paper-500">
                      <span>
                        {photo.width}×{photo.height}
                      </span>
                      <span>{formatFileSize(photo.size)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="secondary" size="lg">
            加载更多
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="上传照片"
        size="lg"
      >
        <div className="border-2 border-dashed border-paper-300 rounded-lg p-12 text-center hover:border-brand-400 transition-colors cursor-pointer">
          <Upload className="w-12 h-12 text-paper-400 mx-auto mb-4" />
          <p className="text-paper-900 font-medium mb-1">点击或拖拽照片到这里上传</p>
          <p className="text-sm text-paper-500">支持 JPG、PNG、HEIC 格式，单张不超过 50MB</p>
        </div>
      </Modal>
    </div>
  );
}
