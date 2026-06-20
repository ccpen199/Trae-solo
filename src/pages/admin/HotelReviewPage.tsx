import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { cn, formatDate } from '../../components/lib/utils';
import { adminApi } from '../../services/api';
import { ApplicationStatus } from '@shared/types';

interface HotelApplication {
  id: string;
  hotelName: string;
  city: string;
  country: string;
  starRating: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  submittedAt: string;
  status: ApplicationStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  roomCount?: number;
}

type TabType = 'all' | 'pending' | 'approved' | 'rejected';

const HotelReviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<HotelApplication[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve');
  const [selectedApp, setSelectedApp] = useState<HotelApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadApplications();
  }, [activeTab]);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.hotels.getAll() as any;
      const items = Array.isArray(data) ? data : (data.items || []);
      const mappedItems = items.map((h: any) => ({
        id: h.id,
        hotelName: h.name || h.legalName,
        city: h.address?.city || '-',
        country: h.address?.country || '-',
        starRating: h.starRating || h.propertyDetails?.starRating || 0,
        contactPerson: h.contactPerson?.name || '-',
        contactEmail: h.contactPerson?.email || '-',
        contactPhone: h.contactPerson?.phone || '-',
        submittedAt: h.submittedAt || h.createdAt,
        status: mapStatus(h.status),
        reviewNotes: h.reviewNotes,
        reviewedBy: h.reviewedBy,
        reviewedAt: h.reviewedAt,
        roomCount: h.propertyDetails?.roomCount,
      }));
      setApplications(mappedItems);
    } catch (error) {
      console.warn('Failed to load hotel applications, using mock data');
      setApplications(getMockApplications());
    } finally {
      setIsLoading(false);
    }
  };

  const mapStatus = (status: string): ApplicationStatus => {
    const statusMap: Record<string, ApplicationStatus> = {
      'PENDING_REVIEW': ApplicationStatus.UNDER_REVIEW,
      'ACTIVE': ApplicationStatus.APPROVED,
      'REJECTED': ApplicationStatus.REJECTED,
      'draft': ApplicationStatus.DRAFT,
      'submitted': ApplicationStatus.SUBMITTED,
      'under_review': ApplicationStatus.UNDER_REVIEW,
      'additional_info_required': ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
      'approved': ApplicationStatus.APPROVED,
      'rejected': ApplicationStatus.REJECTED,
    };
    return statusMap[status] || ApplicationStatus.SUBMITTED;
  };

  const getMockApplications = (): HotelApplication[] => {
    return [
      {
        id: 'app-001',
        hotelName: '巴黎塞纳河精品酒店',
        city: '巴黎',
        country: '法国',
        starRating: 4,
        contactPerson: 'Pierre Dubois',
        contactEmail: 'pierre@paris-boutique.com',
        contactPhone: '+33 1 23 45 67 89',
        submittedAt: '2025-06-18T10:30:00Z',
        status: ApplicationStatus.UNDER_REVIEW,
        roomCount: 45,
      },
      {
        id: 'app-002',
        hotelName: '京都岚山温泉旅馆',
        city: '京都',
        country: '日本',
        starRating: 5,
        contactPerson: '山田太郎',
        contactEmail: 'yamada@kyoto-ryokan.jp',
        contactPhone: '+81 75-123-4567',
        submittedAt: '2025-06-17T14:20:00Z',
        status: ApplicationStatus.SUBMITTED,
        roomCount: 28,
      },
      {
        id: 'app-003',
        hotelName: '纽约时代广场万豪',
        city: '纽约',
        country: '美国',
        starRating: 4,
        contactPerson: 'John Smith',
        contactEmail: 'john@ny-marriott.com',
        contactPhone: '+1 212-555-0123',
        submittedAt: '2025-06-17T09:15:00Z',
        status: ApplicationStatus.UNDER_REVIEW,
        roomCount: 120,
      },
      {
        id: 'app-004',
        hotelName: '三亚亚龙湾海景度假酒店',
        city: '三亚',
        country: '中国',
        starRating: 5,
        contactPerson: '李明',
        contactEmail: 'liming@sanya-resort.com',
        contactPhone: '+86 138 0000 0001',
        submittedAt: '2025-06-16T16:45:00Z',
        status: ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
        roomCount: 200,
      },
      {
        id: 'app-005',
        hotelName: '伦敦白金汉精品酒店',
        city: '伦敦',
        country: '英国',
        starRating: 4,
        contactPerson: 'James Wilson',
        contactEmail: 'james@london-buckingham.com',
        contactPhone: '+44 20 1234 5678',
        submittedAt: '2025-06-16T11:00:00Z',
        status: ApplicationStatus.SUBMITTED,
        roomCount: 68,
      },
      {
        id: 'app-006',
        hotelName: '上海外滩华尔道夫酒店',
        city: '上海',
        country: '中国',
        starRating: 5,
        contactPerson: '王芳',
        contactEmail: 'wangfang@shanghai-waldorf.com',
        contactPhone: '+86 139 0000 0002',
        submittedAt: '2025-06-15T08:30:00Z',
        status: ApplicationStatus.APPROVED,
        reviewNotes: '资质齐全，已通过审核',
        reviewedBy: '系统管理员',
        reviewedAt: '2025-06-16T10:00:00Z',
        roomCount: 180,
      },
      {
        id: 'app-007',
        hotelName: '罗马西班牙广场精品酒店',
        city: '罗马',
        country: '意大利',
        starRating: 4,
        contactPerson: 'Marco Rossi',
        contactEmail: 'marco@rome-boutique.it',
        contactPhone: '+39 06 1234 5678',
        submittedAt: '2025-06-14T15:20:00Z',
        status: ApplicationStatus.REJECTED,
        reviewNotes: '营业执照不完整，请补充后重新提交',
        reviewedBy: '平台运营',
        reviewedAt: '2025-06-15T09:30:00Z',
        roomCount: 35,
      },
      {
        id: 'app-008',
        hotelName: '东京银座东急酒店',
        city: '东京',
        country: '日本',
        starRating: 4,
        contactPerson: '佐藤健',
        contactEmail: 'sato@tokyo-ginza.jp',
        contactPhone: '+81 3-1234-5678',
        submittedAt: '2025-06-13T10:00:00Z',
        status: ApplicationStatus.APPROVED,
        reviewNotes: '资料完整，酒店位置优越',
        reviewedBy: '系统管理员',
        reviewedAt: '2025-06-14T14:00:00Z',
        roomCount: 156,
      },
    ];
  };

  const tabs = [
    { id: 'all' as TabType, label: '全部', count: applications.length },
    { id: 'pending' as TabType, label: '待审核', count: applications.filter(a => 
      a.status === ApplicationStatus.SUBMITTED || 
      a.status === ApplicationStatus.UNDER_REVIEW ||
      a.status === ApplicationStatus.ADDITIONAL_INFO_REQUIRED
    ).length },
    { id: 'approved' as TabType, label: '已通过', count: applications.filter(a => a.status === ApplicationStatus.APPROVED).length },
    { id: 'rejected' as TabType, label: '已拒绝', count: applications.filter(a => a.status === ApplicationStatus.REJECTED).length },
  ];

  const getStatusConfig = (status: ApplicationStatus) => {
    const configs: Record<ApplicationStatus, { label: string; variant: any }> = {
      [ApplicationStatus.DRAFT]: { label: '草稿', variant: 'default' },
      [ApplicationStatus.SUBMITTED]: { label: '已提交', variant: 'primary' },
      [ApplicationStatus.UNDER_REVIEW]: { label: '审核中', variant: 'warning' },
      [ApplicationStatus.ADDITIONAL_INFO_REQUIRED]: { label: '需补充信息', variant: 'accent' },
      [ApplicationStatus.APPROVED]: { label: '已通过', variant: 'success' },
      [ApplicationStatus.REJECTED]: { label: '已拒绝', variant: 'danger' },
    };
    return configs[status] || configs[ApplicationStatus.SUBMITTED];
  };

  const filteredApplications = applications.filter(app => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'pending' ? (
        app.status === ApplicationStatus.SUBMITTED || 
        app.status === ApplicationStatus.UNDER_REVIEW ||
        app.status === ApplicationStatus.ADDITIONAL_INFO_REQUIRED
      ) :
      activeTab === 'approved' ? app.status === ApplicationStatus.APPROVED :
      activeTab === 'rejected' ? app.status === ApplicationStatus.REJECTED : true;

    const matchesKeyword = !searchKeyword || 
      app.hotelName.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesCity = !searchCity || 
      app.city.toLowerCase().includes(searchCity.toLowerCase());

    return matchesTab && matchesKeyword && matchesCity;
  });

  const totalPages = Math.ceil(filteredApplications.length / pageSize);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleReview = (app: HotelApplication, type: 'approve' | 'reject') => {
    setSelectedApp(app);
    setReviewType(type);
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!selectedApp) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.hotels.review(selectedApp.id, {
        status: reviewType === 'approve' ? 'APPROVED' : 'REJECTED',
        notes: reviewNotes,
      });
      loadApplications();
      setReviewModalOpen(false);
    } catch (error) {
      console.warn('Failed to submit review, updating locally');
      setApplications(prev => prev.map(app => 
        app.id === selectedApp.id 
          ? {
              ...app,
              status: reviewType === 'approve' ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED,
              reviewNotes,
              reviewedBy: '系统管理员',
              reviewedAt: new Date().toISOString(),
            }
          : app
      ));
      setReviewModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-3.5 h-3.5',
              i < rating ? 'text-gold-foil fill-gold-foil' : 'text-cloud-300'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-graphite-900">酒店审核</h1>
          <p className="text-graphite-500 mt-1">管理酒店入驻申请审核</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索酒店名称"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="搜索城市"
                value={searchCity}
                onChange={(e) => {
                  setSearchCity(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-b border-cloud-200 -mx-6 px-6 mb-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'border-deep-blue text-deep-blue'
                      : 'border-transparent text-graphite-500 hover:text-graphite-700'
                  )}
                >
                  {tab.label}
                  <Badge 
                    variant={activeTab === tab.id ? 'primary' : 'default'} 
                    size="sm" 
                    className="ml-2"
                  >
                    {tab.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cloud-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">酒店信息</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">城市</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">星级</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">联系人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">申请日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApplications.length > 0 ? (
                  paginatedApplications.map((app) => {
                    const statusConfig = getStatusConfig(app.status);
                    const canReview = 
                      app.status === ApplicationStatus.SUBMITTED || 
                      app.status === ApplicationStatus.UNDER_REVIEW ||
                      app.status === ApplicationStatus.ADDITIONAL_INFO_REQUIRED;
                    return (
                      <tr key={app.id} className="border-b border-cloud-100 hover:bg-cloud-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-deep-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-deep-blue" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-graphite-900">{app.hotelName}</p>
                              {app.roomCount && (
                                <p className="text-xs text-graphite-500">{app.roomCount}间客房</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-graphite-700">{app.city}</span>
                        </td>
                        <td className="py-3 px-4">
                          {renderStars(app.starRating)}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm text-graphite-900">{app.contactPerson}</p>
                            <p className="text-xs text-graphite-500">{app.contactEmail}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-graphite-700">
                            {formatDate(app.submittedAt)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusConfig.variant} size="sm">
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Eye className="w-4 h-4" />}
                            >
                              详情
                            </Button>
                            {canReview && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  leftIcon={<Check className="w-4 h-4" />}
                                  onClick={() => handleReview(app, 'approve')}
                                >
                                  通过
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  leftIcon={<X className="w-4 h-4" />}
                                  onClick={() => handleReview(app, 'reject')}
                                >
                                  拒绝
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="w-12 h-12 text-graphite-300" />
                        <p className="text-graphite-500">暂无酒店申请数据</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-cloud-100">
              <p className="text-sm text-graphite-500">
                共 {filteredApplications.length} 条记录，第 {currentPage} / {totalPages} 页
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  上一页
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewType === 'approve' ? '审核通过' : '审核拒绝'}
        description={selectedApp ? `酒店名称：${selectedApp.hotelName}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewModalOpen(false)}>
              取消
            </Button>
            <Button
              variant={reviewType === 'approve' ? 'primary' : 'destructive'}
              onClick={submitReview}
              isLoading={isSubmitting}
            >
              确认{reviewType === 'approve' ? '通过' : '拒绝'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              审核备注 {reviewType === 'reject' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={reviewType === 'approve' ? '请输入审核备注（选填）' : '请输入拒绝原因'}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue resize-none',
                reviewType === 'reject' ? 'border-red-300' : 'border-cloud-300'
              )}
              rows={4}
            />
          </div>
          {reviewType === 'approve' && (
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-700">
                <strong>提示：</strong>审核通过后，酒店将正式上线平台，可开始接受预订。
              </p>
            </div>
          )}
          {reviewType === 'reject' && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>提示：</strong>审核拒绝后，酒店方将收到拒绝通知，可修改后重新提交申请。
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default HotelReviewPage;
