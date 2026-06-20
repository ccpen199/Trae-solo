import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Download,
  Edit3,
  Trash2,
  FileText,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  HelpCircle,
  Lock,
  Globe,
  Database,
  UserX,
  Copy,
  Check,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { gdprApi } from '../services/api';
import { useAuthStore, selectIsAuthenticated, selectUser } from '../store/authStore';
import { formatDate } from '../components/lib/utils';
import {
  GDPRRequest,
  GDPRRequestType,
  GDPRRequestStatus,
} from '@shared/types';

const GDPRPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<GDPRRequestType | null>(null);
  const [requestDescription, setRequestDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [gdprInfo, setGdprInfo] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/gdpr' } });
      return;
    }
    loadGDPRData();
  }, [isAuthenticated]);

  const loadGDPRData = async () => {
    setIsLoading(true);
    try {
      const [requestsData, infoData] = await Promise.all([
        gdprApi.getMyRequests(),
        gdprApi.getRightsInfo(),
      ]);
      setRequests(requestsData as GDPRRequest[]);
      setGdprInfo(infoData);
    } catch (error) {
      console.error('Failed to load GDPR data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedRequestType) return;
    setIsSubmitting(true);
    try {
      await gdprApi.createRequest({
        type: selectedRequestType,
        description: requestDescription,
      });
      setShowRequestModal(false);
      setSelectedRequestType(null);
      setRequestDescription('');
      await loadGDPRData();
    } catch (error) {
      console.error('Failed to submit request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('确定要取消此请求吗？')) return;
    try {
      await gdprApi.cancelRequest(requestId);
      await loadGDPRData();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      const data = await gdprApi.exportMyData(format);
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([data as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRequestTypeConfig = (type: GDPRRequestType) => {
    const configs: Record<GDPRRequestType, { label: string; icon: any; description: string }> = {
      [GDPRRequestType.ACCESS]: {
        label: '访问权',
        icon: Eye,
        description: '请求获取我们持有的您的所有个人数据副本',
      },
      [GDPRRequestType.RECTIFICATION]: {
        label: '更正权',
        icon: Edit3,
        description: '请求更正不准确或不完整的个人数据',
      },
      [GDPRRequestType.ERASURE]: {
        label: '删除权',
        icon: Trash2,
        description: '请求删除您的个人数据（被遗忘权）',
      },
      [GDPRRequestType.EXPORT]: {
        label: '数据可携权',
        icon: Download,
        description: '以机器可读格式获取您的个人数据',
      },
      [GDPRRequestType.RESTRICTION]: {
        label: '限制处理权',
        icon: Lock,
        description: '请求限制对您个人数据的处理',
      },
      [GDPRRequestType.OBJECTION]: {
        label: '反对权',
        icon: UserX,
        description: '反对基于合法利益处理您的个人数据',
      },
    };
    return configs[type];
  };

  const getStatusConfig = (status: GDPRRequestStatus) => {
    const configs: Record<GDPRRequestStatus, { label: string; variant: any; icon: any }> = {
      [GDPRRequestStatus.PENDING]: {
        label: '待处理',
        variant: 'warning',
        icon: Clock,
      },
      [GDPRRequestStatus.IN_PROGRESS]: {
        label: '处理中',
        variant: 'primary',
        icon: Clock,
      },
      [GDPRRequestStatus.COMPLETED]: {
        label: '已完成',
        variant: 'success',
        icon: CheckCircle,
      },
      [GDPRRequestStatus.REJECTED]: {
        label: '已拒绝',
        variant: 'danger',
        icon: XCircle,
      },
    };
    return configs[status];
  };

  const requestTypes = [
    { type: GDPRRequestType.ACCESS, color: 'from-blue-500 to-blue-600' },
    { type: GDPRRequestType.RECTIFICATION, color: 'from-green-500 to-green-600' },
    { type: GDPRRequestType.ERASURE, color: 'from-red-500 to-red-600' },
    { type: GDPRRequestType.EXPORT, color: 'from-purple-500 to-purple-600' },
    { type: GDPRRequestType.RESTRICTION, color: 'from-amber-500 to-amber-600' },
    { type: GDPRRequestType.OBJECTION, color: 'from-grey-500 to-grey-600' },
  ];

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="bg-gradient-to-br from-deep-blue via-deep-blue-light to-deep-blue text-white py-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-shield-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  数据主体权利
                </h1>
                <p className="text-cloud-200 max-w-2xl">
                  根据欧盟《通用数据保护条例》(GDPR)，您享有多项数据主体权利。
                  您可以在此处提交请求，我们将在30天内回复您的申请。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-cloud-300" />
                  <div>
                    <p className="text-sm text-cloud-200">响应时间</p>
                    <p className="text-lg font-semibold">30 天内</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-cloud-300" />
                  <div>
                    <p className="text-sm text-cloud-200">已处理请求</p>
                    <p className="text-lg font-semibold">
                      {requests.filter((r) => r.status === GDPRRequestStatus.COMPLETED).length} 个
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-cloud-300" />
                  <div>
                    <p className="text-sm text-cloud-200">待处理请求</p>
                    <p className="text-lg font-semibold">
                      {requests.filter(
                        (r) =>
                          r.status === GDPRRequestStatus.PENDING ||
                          r.status === GDPRRequestStatus.IN_PROGRESS
                      ).length}{' '}
                      个
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-graphite-900 mb-6">
              您的GDPR权利
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requestTypes.map(({ type, color }) => {
                const config = getRequestTypeConfig(type);
                const Icon = config.icon;
                return (
                  <Card
                    key={type}
                    className="card-hover cursor-pointer border-2 border-transparent hover:border-deep-blue/20"
                    onClick={() => {
                      setSelectedRequestType(type);
                      setShowRequestModal(true);
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-graphite-900 mb-1">
                            {config.label}
                          </h3>
                          <p className="text-sm text-graphite-500">
                            {config.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-4"
                        leftIcon={<Send className="w-4 h-4" />}
                      >
                        提交请求
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-deep-blue" />
                  快速数据导出
                </CardTitle>
                <CardDescription>
                  立即下载您的个人数据副本，无需提交请求
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="primary"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={() => handleExportData('json')}
                  >
                    导出 JSON 格式
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={() => handleExportData('csv')}
                  >
                    导出 CSV 格式
                  </Button>
                </div>
                <p className="text-xs text-graphite-500 mt-4">
                  导出的数据包括：个人资料信息、预订历史记录、会员信息、积分交易记录等
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-graphite-900 mb-6">
              我的请求记录
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <SkeletonText lines={3} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => {
                  const typeConfig = getRequestTypeConfig(request.type);
                  const statusConfig = getStatusConfig(request.status);
                  const TypeIcon = typeConfig.icon;
                  const StatusIcon = statusConfig.icon;
                  const isExpanded = expandedRequestId === request.id;

                  return (
                    <Card key={request.id} className="overflow-hidden">
                      <div
                        className="p-5 cursor-pointer hover:bg-cloud-50 transition-colors"
                        onClick={() =>
                          setExpandedRequestId(isExpanded ? null : request.id)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-deep-blue/10 rounded-xl flex items-center justify-center">
                              <TypeIcon className="w-6 h-6 text-deep-blue" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-graphite-900">
                                  {typeConfig.label}
                                </h3>
                                <Badge
                                  variant={statusConfig.variant}
                                  size="sm"
                                  dot
                                >
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-graphite-500">
                                提交于 {formatDate(request.submittedAt)}
                                {request.completedAt &&
                                  ` · 完成于 ${formatDate(request.completedAt)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {request.status === GDPRRequestStatus.PENDING && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelRequest(request.id);
                                }}
                              >
                                取消
                              </Button>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-graphite-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-graphite-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-cloud-100">
                          <div className="pt-4 space-y-4">
                            {request.description && (
                              <div>
                                <p className="text-sm font-medium text-graphite-700 mb-1">
                                  您的请求说明
                                </p>
                                <div className="p-4 bg-cloud-50 rounded-xl">
                                  <p className="text-graphite-600">
                                    {request.description}
                                  </p>
                                </div>
                              </div>
                            )}

                            {request.responseDetails && (
                              <div>
                                <p className="text-sm font-medium text-graphite-700 mb-1">
                                  我们的回复
                                </p>
                                <div className="p-4 bg-deep-blue/5 rounded-xl border border-deep-blue/10">
                                  <p className="text-graphite-600 whitespace-pre-wrap">
                                    {request.responseDetails}
                                  </p>
                                </div>
                              </div>
                            )}

                            {request.processedBy && (
                              <div className="flex items-center gap-2 text-sm text-graphite-500">
                                <UserX className="w-4 h-4" />
                                <span>处理人: {request.processedBy}</span>
                              </div>
                            )}

                            {request.status === GDPRRequestStatus.PENDING && (
                              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-amber-900">
                                      正在处理中
                                    </p>
                                    <p className="text-sm text-amber-700">
                                      您的请求正在处理中，我们会在30天内完成处理并通过邮件通知您。
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-cloud-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-graphite-400" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-graphite-900 mb-2">
                    暂无请求记录
                  </h3>
                  <p className="text-graphite-500 mb-6 max-w-md mx-auto">
                    您还没有提交任何数据主体权利请求。如果您需要行使您的GDPR权利，请从上方选择相应的权利类型。
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="bg-gradient-to-br from-cloud-50 to-white border-2 border-cloud-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-deep-blue" />
                关于GDPR的常见问题
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {gdprInfo?.faqs?.map((faq: any, i: number) => (
                <div key={i} className="p-4 bg-white rounded-xl border border-cloud-100">
                  <h4 className="font-semibold text-graphite-900 mb-2">
                    {faq.question}
                  </h4>
                  <p className="text-sm text-graphite-600">{faq.answer}</p>
                </div>
              ))}
              {!gdprInfo?.faqs && (
                <>
                  <div className="p-4 bg-white rounded-xl border border-cloud-100">
                    <h4 className="font-semibold text-graphite-900 mb-2">
                      什么是GDPR？
                    </h4>
                    <p className="text-sm text-graphite-600">
                      《通用数据保护条例》(General Data Protection Regulation,
                      GDPR)是欧盟的一项数据保护法规，于2018年5月25日生效。
                      它旨在统一欧盟境内的个人数据保护法律，赋予个人更多对其个人数据的控制权。
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-cloud-100">
                    <h4 className="font-semibold text-graphite-900 mb-2">
                      处理我的请求需要多长时间？
                    </h4>
                    <p className="text-sm text-graphite-600">
                      根据GDPR规定，我们需要在收到请求后的一个月内回复。
                      在复杂情况下，这个期限可以延长最多两个月，我们会提前通知您延期原因。
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-cloud-100">
                    <h4 className="font-semibold text-graphite-900 mb-2">
                      我需要支付费用吗？
                    </h4>
                    <p className="text-sm text-graphite-600">
                      通常情况下，行使数据主体权利是免费的。但如果请求明显没有根据或过度，
                      我们可能会收取合理的行政费用或拒绝处理请求。
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-cloud-100">
                    <h4 className="font-semibold text-graphite-900 mb-2">
                      如何联系数据保护官(DPO)？
                    </h4>
                    <p className="text-sm text-graphite-600">
                      您可以通过邮箱 dpo@stayglobal.com 联系我们的数据保护官，
                      或写信至：StayGlobal Data Protection Officer, 123 Innovation Street,
                      Singapore 123456。
                    </p>
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-cloud-100">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Globe className="w-4 h-4" />}
                >
                  查看完整隐私政策
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<FileText className="w-4 h-4" />}
                >
                  查看Cookie政策
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Shield className="w-4 h-4" />}
                >
                  查看数据处理协议
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedRequestType(null);
          setRequestDescription('');
        }}
        title={
          selectedRequestType
            ? `提交${getRequestTypeConfig(selectedRequestType).label}请求`
            : '提交GDPR请求'
        }
        description={
          selectedRequestType
            ? getRequestTypeConfig(selectedRequestType).description
            : '请选择您要行使的权利类型'
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestModal(false);
                setSelectedRequestType(null);
                setRequestDescription('');
              }}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitRequest}
              isLoading={isSubmitting}
              disabled={!selectedRequestType}
              leftIcon={<Send className="w-4 h-4" />}
            >
              提交请求
            </Button>
          </div>
        }
      >
        {selectedRequestType ? (
          <div className="space-y-6">
            <div className="p-4 bg-deep-blue/5 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-deep-blue/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  {React.createElement(
                    getRequestTypeConfig(selectedRequestType).icon,
                    { className: 'w-6 h-6 text-deep-blue' }
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-graphite-900">
                    {getRequestTypeConfig(selectedRequestType).label}
                  </h3>
                  <p className="text-sm text-graphite-600">
                    {getRequestTypeConfig(selectedRequestType).description}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                请求说明 (可选)
              </label>
              <textarea
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="请详细描述您的请求，包括需要访问、更正或删除的具体数据..."
                className="input-field h-32 resize-none"
              />
              <p className="text-xs text-graphite-500 mt-2">
                提供更多细节可以帮助我们更快地处理您的请求
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 text-sm">
                    请谨慎提交
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    删除权请求一旦执行，您的部分数据将被永久删除且无法恢复。
                    建议您在提交删除请求前先导出您的数据。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-cloud-300 text-deep-blue focus:ring-deep-blue"
                />
                <span className="text-sm text-graphite-600">
                  我确认我是数据主体本人，或者我已获得数据主体的授权代表其行使权利
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-cloud-300 text-deep-blue focus:ring-deep-blue"
                />
                <span className="text-sm text-graphite-600">
                  我理解我有权在任何时候撤回该请求，且不影响撤回前基于同意进行的处理的合法性
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requestTypes.map(({ type, color }) => {
              const config = getRequestTypeConfig(type);
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  className="p-4 border-2 border-cloud-200 rounded-xl cursor-pointer hover:border-deep-blue hover:bg-deep-blue/5 transition-all"
                  onClick={() => setSelectedRequestType(type)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-graphite-900">
                        {config.label}
                      </h4>
                      <p className="text-xs text-graphite-500 mt-1">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
};

export default GDPRPage;
