import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Gavel,
  MapPin,
  Clock,
  Users,
  FileText,
  Download,
  Calendar,
  Building2,
  ShieldCheck,
  MessageSquare,
  Send,
  Check,
  X,
  Edit3,
  Eye,
  User,
  Star,
  AlertCircle,
  Award,
  FileCheck2,
  FileSignature,
  Scale,
} from 'lucide-react';
import {
  Tabs,
  Tag,
  Modal,
  Form,
  Input,
  Button,
  Card,
  Avatar,
  Rate,
  Progress,
  Table,
  Tooltip,
  message,
  Divider,
  Empty,
} from 'antd';
import { mockCaseSources, mockContracts } from '@/mock/data';
import { CASE_CAUSES, PROVINCES } from '@/constants';
import {
  formatMoney,
  formatDate,
  formatDateTime,
  formatFileSize,
  isOverdue,
  isUpcoming,
} from '@/utils/format';
import type { CaseBid } from '@/types/case';

const { TextArea } = Input;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '招募中', color: 'blue' },
  bidding: { label: '竞标中', color: 'gold' },
  selected: { label: '已中标', color: 'purple' },
  processing: { label: '办理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
};

const CaseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedBids, setSelectedBids] = useState<string[]>([]);
  const [signingOpen, setSigningOpen] = useState(false);
  const [form] = Form.useForm();

  const caseData = useMemo(() => {
    return mockCaseSources.find((c) => c.id === id) || mockCaseSources[0];
  }, [id]);

  const contract = useMemo(() => {
    return mockContracts.find((c) => c.caseId === caseData?.id);
  }, [caseData]);

  const causeInfo = useMemo(
    () => CASE_CAUSES.find((c) => c.value === caseData?.cause),
    [caseData]
  );
  const provinceInfo = useMemo(
    () => PROVINCES.find((p) => p.value === caseData?.province),
    [caseData]
  );
  const statusConfig = useMemo(
    () => STATUS_CONFIG[caseData?.status || 'draft'],
    [caseData]
  );

  const handleSubmitBid = () => {
    form.validateFields().then((values) => {
      message.success('投标已提交，等待客户审阅');
      setBidModalOpen(false);
      form.resetFields();
    });
  };

  const toggleCompareBid = (bidId: string) => {
    setSelectedBids((prev) => {
      if (prev.includes(bidId)) {
        return prev.filter((id) => id !== bidId);
      }
      if (prev.length >= 3) {
        message.warning('最多只能对比3个投标');
        return prev;
      }
      return [...prev, bidId];
    });
  };

  const comparedBids = caseData?.bids.filter((b) => selectedBids.includes(b.id)) || [];

  const compareColumns = [
    {
      title: '对比项',
      dataIndex: 'field',
      key: 'field',
      width: 120,
      className: 'bg-neutral-ink-50 font-medium text-neutral-ink-700',
    },
    ...comparedBids.map((bid) => ({
      title: (
        <div className="flex items-center gap-2">
          <Avatar size={24} src={bid.lawyerAvatar} />
          <span>{bid.lawyerName}</span>
        </div>
      ),
      dataIndex: bid.id,
      key: bid.id,
    })),
  ];

  const compareData = comparedBids.length > 0
    ? [
        {
          field: '律所',
          ...Object.fromEntries(comparedBids.map((b) => [b.id, b.lawyerFirm])),
        },
        {
          field: '信用分',
          ...Object.fromEntries(
            comparedBids.map((b) => [
              b.id,
              <div key={b.id} className="flex items-center gap-1">
                <Star className="w-4 h-4 text-accent-gold fill-accent-gold" />
                <span className="font-semibold">{b.lawyerCreditScore}</span>
              </div>,
            ])
          ),
        },
        {
          field: '报价金额',
          ...Object.fromEntries(
            comparedBids.map((b) => [
              b.id,
              <span key={b.id} className="text-accent-gold font-serif font-bold text-lg">
                ¥{formatMoney(b.price, 0)}
              </span>,
            ])
          ),
        },
        {
          field: '预计周期',
          ...Object.fromEntries(
            comparedBids.map((b) => [b.id, `${b.estimatedDays}天`])
          ),
        },
        {
          field: '沟通次数',
          ...Object.fromEntries(
            comparedBids.map((b) => [
              b.id,
              <div key={b.id} className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-primary-500" />
                <span>{b.messageCount}次</span>
              </div>,
            ])
          ),
        },
        {
          field: '投标时间',
          ...Object.fromEntries(
            comparedBids.map((b) => [b.id, formatDateTime(b.submittedAt)])
          ),
        },
      ]
    : [];

  const renderBidCard = (bid: CaseBid) => {
    const isSelected = selectedBids.includes(bid.id);
    return (
      <Card
        key={bid.id}
        className={cn(
          'lc-card border-0 transition-all duration-300',
          isSelected && 'ring-2 ring-accent-gold'
        )}
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar size={48} src={bid.lawyerAvatar} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-semibold text-primary-900 text-lg">
                    {bid.lawyerName}
                  </span>
                  <Tag color="blue">主办律师</Tag>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-neutral-ink-500">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{bid.lawyerFirm}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-accent-gold font-serif font-bold text-2xl">
                ¥{formatMoney(bid.price, 0)}
              </div>
              <div className="text-xs text-neutral-ink-500 mt-0.5">
                预计 {bid.estimatedDays} 天
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-ink-100">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm text-neutral-ink-600">信用分</span>
              <span className="text-sm font-semibold text-primary-900">
                {bid.lawyerCreditScore}
              </span>
              <Rate
                disabled
                allowHalf
                defaultValue={bid.lawyerCreditScore / 20}
                className="!text-xs"
                style={{ fontSize: 12 }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-neutral-ink-600">{bid.messageCount}次沟通</span>
            </div>
            <div className="text-xs text-neutral-ink-500">
              {formatDateTime(bid.submittedAt)} 提交
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm font-medium text-neutral-ink-700 mb-2">代理方案：</div>
            <p className="text-sm text-neutral-ink-600 leading-relaxed whitespace-pre-line">
              {bid.proposal}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="primary"
              className="flex-1"
              icon={<Send className="w-4 h-4" />}
              onClick={() => message.success(`已向 ${bid.lawyerName} 发起沟通`)}
            >
              发起沟通
            </Button>
            <Button
              icon={<Scale className="w-4 h-4" />}
              onClick={() => toggleCompareBid(bid.id)}
              className={cn(isSelected && '!bg-accent-gold !text-primary-900 !border-accent-gold')}
            >
              {isSelected ? '已选择' : '对比'}
            </Button>
            {caseData?.status === 'bidding' && (
              <Button
                className="!bg-green-600 !text-white hover:!bg-green-700"
                icon={<Check className="w-4 h-4" />}
                onClick={() => {
                  Modal.confirm({
                    title: '确认中标律师',
                    content: `确定选择 ${bid.lawyerName} 律师代理本案吗？`,
                    okText: '确认选择',
                    cancelText: '取消',
                    onOk: () => message.success(`已选择 ${bid.lawyerName} 律师，合同生成中...`),
                  });
                }}
              >
                选择中标
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const tabItems = [
    {
      key: 'info',
      label: (
        <span className="flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          案件详情
        </span>
      ),
    },
    {
      key: 'evidence',
      label: (
        <span className="flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4" />
          证据材料 ({caseData?.evidenceFiles.length || 0})
        </span>
      ),
    },
    {
      key: 'bids',
      label: (
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          律师投标 ({caseData?.bids.length || 0})
        </span>
      ),
    },
    {
      key: 'contract',
      label: (
        <span className="flex items-center gap-1.5">
          <FileSignature className="w-4 h-4" />
          委托合同
        </span>
      ),
    },
  ];

  if (!caseData) {
    return (
      <div className="lc-card p-16">
        <Empty description="案件不存在或已被删除" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center gap-1.5 text-sm text-neutral-ink-500 hover:text-primary-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回案源列表
        </button>
      </div>

      <Card className="lc-card border-0 overflow-hidden" styles={{ body: { padding: 0 } }}>
        <div className="primary-gradient p-6 text-white">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Tag color={statusConfig.color === 'gold' ? 'gold' : statusConfig.color} className="!m-0">
                  {statusConfig.label}
                </Tag>
                {causeInfo && <Tag color="blue">{causeInfo.label}</Tag>}
                {caseData.tags.slice(0, 3).map((tag) => (
                  <Tag key={tag} className="!m-0">
                    {tag}
                  </Tag>
                ))}
              </div>
              <h1 className="text-2xl font-serif font-bold text-white leading-snug mb-4">
                {caseData.title}
              </h1>
              <div className="flex items-center gap-6 flex-wrap text-primary-100">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-accent-gold" />
                  <span className="accent-gold font-serif font-bold text-2xl">
                    ¥{formatMoney(caseData.amount, 0)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {provinceInfo?.label || caseData.province}
                    {caseData.city ? ` · ${caseData.city}` : ''}
                  </span>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1.5',
                    isOverdue(caseData.deadline)
                      ? 'text-red-300'
                      : isUpcoming(caseData.deadline, 3)
                      ? 'text-yellow-300'
                      : ''
                  )}
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    截止日期：{formatDate(caseData.deadline)}
                    {isOverdue(caseData.deadline)
                      ? '（已截止）'
                      : isUpcoming(caseData.deadline, 3)
                      ? '（即将截止）'
                      : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{caseData.bids.length} 位律师已投标</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              {(caseData.status === 'bidding' || caseData.status === 'published') && (
                <Button
                  type="primary"
                  size="large"
                  className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light !font-semibold"
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={() => setBidModalOpen(true)}
                >
                  我要投标
                </Button>
              )}
              <Button
                size="large"
                className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20"
                icon={<Eye className="w-4 h-4" />}
              >
                收藏案源
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-neutral-ivory/50 border-b border-neutral-ink-100">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-ink-500" />
              <span className="text-sm text-neutral-ink-500">发布方：</span>
              <span className="text-sm font-medium text-neutral-ink-900">{caseData.publisherName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-ink-500" />
              <span className="text-sm text-neutral-ink-500">发布时间：</span>
              <span className="text-sm text-neutral-ink-700">{formatDateTime(caseData.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-neutral-ink-500" />
              <span className="text-sm text-neutral-ink-500">诚意金：</span>
              <span className="text-sm font-semibold text-accent-gold">¥{formatMoney(caseData.deposit, 0)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="lc-card border-0" styles={{ body: { padding: 0 } }}>
        <Tabs
          defaultActiveKey="info"
          className="px-6"
          items={tabItems.map((item) => ({
            ...item,
            children: (
              <div className="pt-4 -mx-6 px-6">
                {item.key === 'info' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="lc-section-title">案件描述</h3>
                      <p className="text-neutral-ink-700 leading-relaxed whitespace-pre-line bg-neutral-ink-50 p-5 rounded-lg">
                        {caseData.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="lc-card p-4">
                        <div className="text-sm text-neutral-ink-500 mb-1">案件案由</div>
                        <div className="font-serif font-semibold text-primary-900">
                          {causeInfo?.label || '-'}
                        </div>
                      </div>
                      <div className="lc-card p-4">
                        <div className="text-sm text-neutral-ink-500 mb-1">标的金额</div>
                        <div className="font-serif font-bold text-lg text-accent-gold">
                          ¥{formatMoney(caseData.amount, 0)}
                        </div>
                      </div>
                      <div className="lc-card p-4">
                        <div className="text-sm text-neutral-ink-500 mb-1">所在地区</div>
                        <div className="font-serif font-semibold text-primary-900">
                          {provinceInfo?.label || caseData.province}
                          {caseData.city ? ` · ${caseData.city}` : ''}
                        </div>
                      </div>
                      <div className="lc-card p-4">
                        <div className="text-sm text-neutral-ink-500 mb-1">投标截止</div>
                        <div
                          className={cn(
                            'font-serif font-semibold',
                            isOverdue(caseData.deadline)
                              ? 'text-accent-red'
                              : isUpcoming(caseData.deadline, 3)
                              ? 'text-yellow-600'
                              : 'text-primary-900'
                          )}
                        >
                          {formatDate(caseData.deadline)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="lc-section-title">案件标签</h3>
                      <div className="flex gap-2 flex-wrap">
                        {caseData.tags.map((tag) => (
                          <Tag key={tag} className="!px-3 !py-1 !text-sm">
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {item.key === 'evidence' && (
                  <div>
                    {caseData.evidenceFiles.length > 0 ? (
                      <div className="space-y-3">
                        {caseData.evidenceFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 lc-card border-0 hover:border-primary-200 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                <FileText className="w-6 h-6 text-primary-500" />
                              </div>
                              <div>
                                <div className="font-medium text-neutral-ink-900">{file.name}</div>
                                <div className="text-sm text-neutral-ink-500 mt-0.5">
                                  {formatFileSize(file.size)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                icon={<Eye className="w-4 h-4" />}
                                onClick={() => message.info('正在打开文件预览...')}
                              >
                                预览
                              </Button>
                              <Button
                                type="primary"
                                icon={<Download className="w-4 h-4" />}
                                onClick={() => message.success('开始下载文件')}
                              >
                                下载
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12">
                        <Empty description="暂无证据材料" />
                      </div>
                    )}
                  </div>
                )}

                {item.key === 'bids' && (
                  <div className="space-y-6">
                    {caseData.bids.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-primary-500" />
                          <span className="text-sm text-neutral-ink-600">
                            共 {caseData.bids.length} 位律师投标，可选择最多3位进行对比
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedBids.length > 0 && (
                            <span className="text-sm text-neutral-ink-500">
                              已选择 {selectedBids.length} 个投标
                            </span>
                          )}
                          <Button
                            onClick={() => setCompareMode(!compareMode)}
                            className={cn(
                              compareMode &&
                                '!bg-accent-gold !text-primary-900 !border-accent-gold'
                            )}
                            icon={<Scale className="w-4 h-4" />}
                          >
                            {compareMode ? '退出对比' : '对比模式'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {compareMode && selectedBids.length > 1 && (
                      <Card className="lc-card border-0 bg-neutral-ivory/50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-serif font-semibold text-primary-900 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-accent-gold" />
                            投标对比分析
                          </h3>
                          <Button
                            size="small"
                            icon={<X className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setSelectedBids([]);
                              setCompareMode(false);
                            }}
                          >
                            清除对比
                          </Button>
                        </div>
                        <Table
                          columns={compareColumns as any}
                          dataSource={compareData}
                          pagination={false}
                          bordered
                          size="middle"
                        />
                      </Card>
                    )}

                    {caseData.bids.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {caseData.bids.map(renderBidCard)}
                      </div>
                    ) : (
                      <div className="py-12">
                        <Empty description="暂无律师投标，成为第一个投标的律师吧" />
                        {(caseData.status === 'bidding' || caseData.status === 'published') && (
                          <div className="flex justify-center mt-4">
                            <Button
                              type="primary"
                              className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
                              icon={<Edit3 className="w-4 h-4" />}
                              onClick={() => setBidModalOpen(true)}
                            >
                              立即投标
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {item.key === 'contract' && (
                  <div className="space-y-6">
                    {contract ? (
                      <>
                        <div className="lc-card p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h3 className="font-serif font-semibold text-xl text-primary-900 mb-1">
                                委托代理合同
                              </h3>
                              <p className="text-sm text-neutral-ink-500">
                                合同编号：{contract.id} · 生成时间：{formatDateTime(contract.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {contract.clientSigned ? (
                                <Tag color="success" icon={<Check className="w-3 h-3" />}>
                                  客户已签署
                                </Tag>
                              ) : (
                                <Tag color="warning" icon={<Clock className="w-3 h-3" />}>
                                  等待客户签署
                                </Tag>
                              )}
                              {contract.lawyerSigned ? (
                                <Tag color="success" icon={<Check className="w-3 h-3" />}>
                                  律师已签署
                                </Tag>
                              ) : (
                                <Tag color="warning" icon={<Clock className="w-3 h-3" />}>
                                  等待律师签署
                                </Tag>
                              )}
                            </div>
                          </div>

                          <div className="bg-neutral-ivory/50 p-6 rounded-lg border border-neutral-ink-100 mb-6">
                            <div className="prose max-w-none text-neutral-ink-700">
                              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                {contract.content}
                              </pre>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-neutral-ink-100">
                            <div className="flex items-center gap-6">
                              <div>
                                <Progress
                                  type="circle"
                                  percent={
                                    (contract.clientSigned ? 50 : 0) + (contract.lawyerSigned ? 50 : 0)
                                  }
                                  size={64}
                                  strokeColor={{ '0%': '#0A1628', '100%': '#C9A962' }}
                                />
                              </div>
                              <div>
                                <div className="text-sm text-neutral-ink-500 mb-1">签署进度</div>
                                <div className="font-serif font-semibold text-primary-900">
                                  {[contract.clientSigned, contract.lawyerSigned].filter(Boolean).length}/2 方已签署
                                </div>
                                {contract.signedAt && (
                                  <div className="text-xs text-neutral-ink-500 mt-1">
                                    完成时间：{formatDateTime(contract.signedAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button icon={<Download className="w-4 h-4" />}>下载合同</Button>
                              {!contract.lawyerSigned && (
                                <Button
                                  type="primary"
                                  className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
                                  icon={<FileSignature className="w-4 h-4" />}
                                  onClick={() => setSigningOpen(true)}
                                >
                                  签署合同
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <Divider />

                        <div className="lc-card p-6">
                          <h4 className="font-serif font-semibold text-primary-900 mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            合同签署须知
                          </h4>
                          <ul className="space-y-2 text-sm text-neutral-ink-600">
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              本平台采用电子签名技术，签署的合同与纸质合同具有同等法律效力
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              签署前请仔细阅读合同条款，特别是费用支付、违约责任等重要内容
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              合同签署完成后，案件将自动进入办理阶段
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              如需修改合同内容，请先与对方沟通确认后重新生成
                            </li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <div className="py-12">
                        <Empty
                          description={
                            <div className="text-center">
                              <p className="mb-2">暂无委托合同</p>
                              <p className="text-sm text-neutral-ink-500">
                                选择中标律师后，系统将自动生成委托代理合同
                              </p>
                            </div>
                          }
                        />
                        {caseData.bids.length > 0 && caseData.status === 'bidding' && (
                          <div className="flex justify-center mt-4">
                            <Tooltip title="请先在「律师投标」中选择中标律师">
                              <Button type="primary" disabled icon={<FileSignature className="w-4 h-4" />}>
                                生成委托合同
                              </Button>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-accent-gold" />
            <span className="font-serif font-semibold">提交投标</span>
          </div>
        }
        open={bidModalOpen}
        onCancel={() => setBidModalOpen(false)}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="报价金额（元）"
            name="price"
            rules={[{ required: true, message: '请输入报价金额' }]}
          >
            <Input
              size="large"
              type="number"
              placeholder="请输入您的代理费用报价"
              prefix="¥"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="预计办理周期（天）"
              name="estimatedDays"
              rules={[{ required: true, message: '请输入预计周期' }]}
            >
              <Input size="large" type="number" placeholder="预计完成天数" suffix="天" />
            </Form.Item>
            <Form.Item
              label="收费方式"
              name="feeType"
              rules={[{ required: true, message: '请选择收费方式' }]}
            >
              <Input size="large" placeholder="如：固定收费/风险代理/半风险" />
            </Form.Item>
          </div>

          <Form.Item
            label="代理方案"
            name="proposal"
            rules={[{ required: true, message: '请填写代理方案' }]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述您的案件分析、代理策略、团队配置、服务承诺等内容..."
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item label="增值服务（选填）" name="extraServices">
            <TextArea
              rows={3}
              placeholder="如：免费法律咨询、执行阶段指导、法律培训等..."
            />
          </Form.Item>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-ink-100">
            <div className="text-sm text-neutral-ink-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              提交后客户将收到通知，您可在「我的投标」中查看进度
            </div>
            <div className="flex items-center gap-3">
              <Button size="large" onClick={() => setBidModalOpen(false)}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
                icon={<Send className="w-4 h-4" />}
                onClick={handleSubmitBid}
              >
                提交投标
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-accent-gold" />
            <span className="font-serif font-semibold">签署委托合同</span>
          </div>
        }
        open={signingOpen}
        onCancel={() => setSigningOpen(false)}
        footer={null}
        width={560}
      >
        <div className="mt-4 space-y-5">
          <div className="p-4 bg-neutral-ivory rounded-lg border border-neutral-ink-100">
            <div className="text-sm text-neutral-ink-500 mb-1">合同名称</div>
            <div className="font-medium text-primary-900">{contract?.caseTitle} - 委托代理合同</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-neutral-ink-900">身份已验证</div>
                <div className="text-sm text-neutral-ink-500">您的律师执业身份已通过平台认证</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-neutral-ink-900">合同内容已确认</div>
                <div className="text-sm text-neutral-ink-500">我已仔细阅读并理解合同全部条款</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-neutral-ink-900">电子签名授权</div>
                <div className="text-sm text-neutral-ink-500">同意使用平台电子签名技术签署本合同</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-900">签署提示</span>
            </div>
            <p className="text-sm text-neutral-ink-600 leading-relaxed">
              点击「确认签署」后，本合同将立即生效，您需要按照合同约定履行代理义务。
              电子签名与手写签名具有同等法律效力。
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-ink-100">
            <Button size="large" onClick={() => setSigningOpen(false)}>
              取消
            </Button>
            <Button
              type="primary"
              size="large"
              className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
              icon={<FileSignature className="w-4 h-4" />}
              onClick={() => {
                message.success('合同签署成功！案件已进入办理阶段');
                setSigningOpen(false);
              }}
            >
              确认签署
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default CaseDetail;
