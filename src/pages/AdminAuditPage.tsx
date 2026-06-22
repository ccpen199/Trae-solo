import { useState } from 'react';
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Calendar,
  FileText,
  Image,
  AlertCircle,
  MessageSquare,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Tag } from '@/components/ui/Tag';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { communityWorks } from '@/mock/data/community';
import { cn } from '@/lib/utils';

const auditTabs = [
  { value: 'pending', label: '待审核', icon: Clock, count: 24 },
  { value: 'reviewing', label: '审核中', icon: AlertCircle, count: 8 },
  { value: 'approved', label: '已通过', icon: CheckCircle, count: 156 },
  { value: 'rejected', label: '已驳回', icon: XCircle, count: 12 },
];

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'template', label: '模板' },
  { value: 'image', label: '图片素材' },
  { value: 'sticker', label: '贴纸' },
  { value: 'font', label: '字体' },
];

const mockAuditItems = [
  {
    id: 'audit-001',
    name: '宝宝百日纪念册模板',
    type: 'template',
    typeName: '模板',
    previewUrl: 'https://picsum.photos/seed/audit001/400/300',
    designerId: 'user-1001',
    designerName: '甜甜妈妈',
    designerAvatar: 'https://picsum.photos/seed/user1001/100/100',
    status: 'pending',
    uploadedAt: '2025-06-18 14:30:00',
    description: '可爱的宝宝百日纪念相册模板，适合男宝女宝使用',
    tags: ['宝宝', '百日', '纪念'],
    price: 9.9,
  },
  {
    id: 'audit-002',
    name: '樱花季风景素材包',
    type: 'image',
    typeName: '图片素材',
    previewUrl: 'https://picsum.photos/seed/audit002/400/300',
    designerId: 'user-1002',
    designerName: '旅行的意义',
    designerAvatar: 'https://picsum.photos/seed/user1002/100/100',
    status: 'pending',
    uploadedAt: '2025-06-18 10:15:00',
    description: '日本樱花季高清风景照片，共20张',
    tags: ['樱花', '风景', '日本'],
    price: 19.9,
  },
  {
    id: 'audit-003',
    name: '手写书法字体',
    type: 'font',
    typeName: '字体',
    previewUrl: 'https://picsum.photos/seed/audit003/400/300',
    designerId: 'user-1003',
    designerName: '设计小达人',
    designerAvatar: 'https://picsum.photos/seed/user1003/100/100',
    status: 'reviewing',
    uploadedAt: '2025-06-17 16:45:00',
    description: '原创手写书法字体，适合国风设计',
    tags: ['书法', '字体', '国风'],
    price: 29.9,
  },
  {
    id: 'audit-004',
    name: '猫咪表情包贴纸',
    type: 'sticker',
    typeName: '贴纸',
    previewUrl: 'https://picsum.photos/seed/audit004/400/300',
    designerId: 'user-1004',
    designerName: '猫奴一枚',
    designerAvatar: 'https://picsum.photos/seed/user1004/100/100',
    status: 'approved',
    uploadedAt: '2025-06-16 09:20:00',
    description: '可爱猫咪表情包贴纸合集，共30个',
    tags: ['猫咪', '表情包', '可爱'],
    price: 4.9,
  },
  {
    id: 'audit-005',
    name: '商务风格PPT模板',
    type: 'template',
    typeName: '模板',
    previewUrl: 'https://picsum.photos/seed/audit005/400/300',
    designerId: 'user-1005',
    designerName: '职场老司机',
    designerAvatar: 'https://picsum.photos/seed/user1005/100/100',
    status: 'rejected',
    uploadedAt: '2025-06-15 14:00:00',
    description: '高端商务风格演示模板',
    tags: ['商务', 'PPT', '高端'],
    price: 14.9,
    rejectReason: '素材质量不达标，分辨率过低',
  },
  {
    id: 'audit-006',
    name: '北欧风装饰画素材',
    type: 'image',
    typeName: '图片素材',
    previewUrl: 'https://picsum.photos/seed/audit006/400/300',
    designerId: 'user-1006',
    designerName: '家居控',
    designerAvatar: 'https://picsum.photos/seed/user1006/100/100',
    status: 'pending',
    uploadedAt: '2025-06-18 08:30:00',
    description: '北欧风格装饰画素材，适合打印挂画',
    tags: ['北欧', '装饰画', '家居'],
    price: 12.9,
  },
];

export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filteredItems = mockAuditItems.filter((item) => {
    if (item.status !== activeTab) return false;
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (
      searchQuery &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.designerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleApprove = (itemId: string) => {
    setDetailModalOpen(false);
  };

  const openRejectModal = (item: any) => {
    setSelectedItem(item);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    setRejectModalOpen(false);
    setDetailModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewing':
        return 'brand';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审核';
      case 'reviewing':
        return '审核中';
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已驳回';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-paper-900">
            版权审核
          </h1>
          <p className="mt-1 text-sm text-paper-500">
            管理设计师上传的素材版权审核
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            导出记录
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {auditTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    <Icon className="w-4 h-4 mr-1.5" />
                    {tab.label}
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-paper-200">
                      {tab.count}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="搜索素材名称、设计师..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={selectedType}
                onChange={setSelectedType}
                options={typeOptions}
                size="sm"
                className="w-36"
              />
              <Button variant="ghost" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                更多筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} hoverable className="overflow-hidden group">
            <div className="relative aspect-[4/3] overflow-hidden bg-paper-100">
              <img
                src={item.previewUrl}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="absolute top-3 right-3">
                <Tag
                  variant={getStatusColor(item.status) as any}
                  size="sm"
                  className="backdrop-blur-sm"
                >
                  {getStatusText(item.status)}
                </Tag>
              </div>

              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(item);
                    }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    查看详情
                  </Button>
                  {item.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-forest-500 hover:bg-forest-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(item.id);
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-darkroom-500 hover:bg-darkroom-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRejectModal(item);
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-medium text-paper-900 truncate">{item.name}</h3>

              <div className="mt-2 flex items-center gap-2">
                <Avatar
                  src={item.designerAvatar}
                  alt={item.designerName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-paper-600 truncate">
                    {item.designerName}
                  </p>
                </div>
                <Tag variant="default" size="sm">
                  {item.typeName}
                </Tag>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-paper-500">
                  <Calendar className="w-3 h-3" />
                  {item.uploadedAt}
                </div>
                <div className="text-sm font-medium text-brand-500">
                  ¥{item.price.toFixed(2)}
                </div>
              </div>

              {item.rejectReason && (
                <div className="mt-3 p-2 bg-darkroom-50 rounded-lg">
                  <p className="text-xs text-darkroom-600">
                    <span className="font-medium">驳回原因：</span>
                    {item.rejectReason}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-paper-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-paper-400" />
            </div>
            <p className="text-paper-500">暂无{getStatusText(activeTab)}的素材</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pt-4">
        <Button variant="secondary" size="sm">
          加载更多
        </Button>
      </div>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="素材详情"
        size="lg"
        footer={
          selectedItem?.status === 'pending' ? (
            <div className="flex items-center justify-between">
              <Button
                variant="primary"
                className="bg-darkroom-500 hover:bg-darkroom-600"
                onClick={() => openRejectModal(selectedItem)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                驳回
              </Button>
              <Button
                variant="primary"
                className="bg-forest-500 hover:bg-forest-600"
                onClick={() => handleApprove(selectedItem.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                通过审核
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-paper-100">
              <img
                src={selectedItem.previewUrl}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <Tag variant={getStatusColor(selectedItem.status) as any} size="sm">
                  {getStatusText(selectedItem.status)}
                </Tag>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-display font-semibold text-paper-900">
                {selectedItem.name}
              </h3>
              <div className="mt-2 flex items-center gap-3">
                <Avatar
                  src={selectedItem.designerAvatar}
                  alt={selectedItem.designerName}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-paper-700">
                    {selectedItem.designerName}
                  </p>
                  <p className="text-xs text-paper-400">
                    上传于 {selectedItem.uploadedAt}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-paper-500">素材类型</p>
                <p className="mt-1 font-medium text-paper-900">
                  {selectedItem.typeName}
                </p>
              </div>
              <div>
                <p className="text-sm text-paper-500">售价</p>
                <p className="mt-1 font-medium text-brand-500">
                  ¥{selectedItem.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-paper-500">素材描述</p>
              <p className="mt-1 text-paper-700">{selectedItem.description}</p>
            </div>

            <div>
              <p className="text-sm text-paper-500 mb-2">标签</p>
              <div className="flex flex-wrap gap-2">
                {selectedItem.tags.map((tag: string, idx: number) => (
                  <Tag key={idx} variant="brand" size="sm">
                    #{tag}
                  </Tag>
                ))}
              </div>
            </div>

            {selectedItem.rejectReason && (
              <div className="p-4 bg-darkroom-50 rounded-lg border border-darkroom-200">
                <p className="text-sm font-medium text-darkroom-700 mb-1">
                  驳回原因
                </p>
                <p className="text-sm text-darkroom-600">
                  {selectedItem.rejectReason}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="驳回审核"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              className="bg-darkroom-500 hover:bg-darkroom-600"
              onClick={handleReject}
            >
              确认驳回
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-paper-600">
            请填写驳回原因，以便设计师了解问题并进行修改。
          </p>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-1.5">
              驳回原因
            </label>
            <textarea
              className="w-full h-32 px-4 py-3 rounded-md border border-paper-300 bg-white text-paper-900 placeholder-paper-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              placeholder="请输入驳回原因..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-700 mb-2">
              快速选择
            </label>
            <div className="flex flex-wrap gap-2">
              {['版权问题', '质量不达标', '内容违规', '重复素材', '信息不全'].map(
                (reason) => (
                  <button
                    key={reason}
                    onClick={() => setRejectReason(reason)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-all',
                      rejectReason === reason
                        ? 'bg-brand-500 text-white'
                        : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
                    )}
                  >
                    {reason}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
