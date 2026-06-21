import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gavel,
  MapPin,
  Users,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Trophy,
  Send,
  AlertCircle,
  ChevronRight,
  Pause,
  Play,
  LogOut,
  Award,
  Star,
  Building2,
  MessageSquare,
  ArrowLeft,
  Plus,
  FileText,
  Crown,
  X,
  User,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  Tabs,
  Card,
  Tag,
  Button,
  Modal,
  message,
  Empty,
  Avatar,
  Badge,
  Divider,
  Tooltip,
  Progress,
  Rate,
  Table,
} from 'antd';
import { mockCaseSources } from '../../../api/mock/data';
import { CASE_CAUSES, PROVINCES } from '@/constants';
import { formatMoney, formatDate, formatDateTime, isOverdue, isUpcoming } from '@/utils/format';
import type { CaseSource, CaseSourceStatus, CaseBid } from '@/types/case';

const STATUS_CONFIG: Record<CaseSourceStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '招募中', color: 'blue' },
  bidding: { label: '竞标中', color: 'gold' },
  selected: { label: '已中标', color: 'purple' },
  processing: { label: '办理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
};

const BID_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'default' },
  reviewing: { label: '审核中', color: 'blue' },
  shortlisted: { label: '已入围', color: 'gold' },
  won: { label: '已中标', color: 'success' },
  lost: { label: '未中标', color: 'error' },
  withdrawn: { label: '已撤回', color: 'default' },
};

interface MyBid extends CaseBid {
  status: string;
  rank: number;
  caseData: CaseSource;
}

const Bidding: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('published');
  const [bidDetailOpen, setBidDetailOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseSource | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<MyBid | null>(null);

  const myPublishedCases = useMemo(() => {
    return mockCaseSources.slice(0, 3);
  }, []);

  const myBids: MyBid[] = useMemo(() => {
    return [
      {
        id: 'my-bid-001',
        caseId: 'cs-001',
        lawyerId: 'user-001',
        lawyerName: '张明',
        lawyerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming',
        lawyerFirm: '北京市正义律师事务所',
        lawyerCreditScore: 85,
        price: 580000,
        proposal: '1. 案件分析：本案证据充分，胜诉概率较高；2. 代理方案：半风险代理，前期20万，胜诉后按回款15%提成；3. 团队配置：主办律师+助理律师；4. 预计周期：6-8个月。',
        estimatedDays: 210,
        submittedAt: '2024-03-05T10:30:00.000Z',
        messageCount: 3,
        status: 'shortlisted',
        rank: 2,
        caseData: mockCaseSources[0],
      },
      {
        id: 'my-bid-002',
        caseId: 'cs-005',
        lawyerId: 'user-001',
        lawyerName: '张明',
        lawyerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming',
        lawyerFirm: '北京市正义律师事务所',
        lawyerCreditScore: 85,
        price: 300000,
        proposal: '1. 辩护策略：从证据链完整性、金额认定、主观故意等角度切入；2. 类似经验：曾成功辩护多起职务侵占案件，其中2起不起诉、3起缓刑；3. 报价：侦查+审查起诉+审判三阶段共30万；4. 团队：刑事部主任亲办。',
        estimatedDays: 150,
        submittedAt: '2024-03-15T10:00:00.000Z',
        messageCount: 2,
        status: 'reviewing',
        rank: 1,
        caseData: mockCaseSources[4],
      },
      {
        id: 'my-bid-003',
        caseId: 'cs-003',
        lawyerId: 'user-001',
        lawyerName: '张明',
        lawyerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming',
        lawyerFirm: '北京市正义律师事务所',
        lawyerCreditScore: 85,
        price: 0,
        proposal: '风险代理方案：前期不收费，回款后按20%提成。团队有处理过300人群体诉讼经验。',
        estimatedDays: 240,
        submittedAt: '2024-03-10T09:15:00.000Z',
        messageCount: 5,
        status: 'lost',
        rank: 3,
        caseData: mockCaseSources[2],
      },
    ];
  }, []);

  const myWonCases = useMemo(() => {
    return [
      {
        ...mockCaseSources[0],
        status: 'processing' as CaseSourceStatus,
        myPrice: 580000,
        selectedAt: '2024-03-12T14:30:00.000Z',
        contractSigned: true,
        progress: 35,
      },
      {
        ...mockCaseSources[4],
        status: 'selected' as CaseSourceStatus,
        myPrice: 300000,
        selectedAt: '2024-03-20T10:00:00.000Z',
        contractSigned: false,
        progress: 10,
      },
    ];
  }, []);

  const handleViewBids = (caseItem: CaseSource) => {
    setSelectedCase(caseItem);
    setBidDetailOpen(true);
  };

  const handleSelectWinner = (bid: CaseBid) => {
    Modal.confirm({
      title: '确认中标律师',
      icon: <Trophy className="w-5 h-5 text-accent-gold" />,
      content: (
        <div className="space-y-3">
          <p>确定选择以下律师作为本案的中标律师吗？</p>
          <div className="p-4 bg-neutral-ink-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Avatar size={40} src={bid.lawyerAvatar} />
              <div>
                <div className="font-medium text-primary-900">{bid.lawyerName}</div>
                <div className="text-sm text-neutral-ink-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {bid.lawyerFirm}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-ink-200">
              <span className="text-sm text-neutral-ink-600">报价金额</span>
              <span className="text-xl font-serif font-bold text-accent-gold">
                ¥{formatMoney(bid.price, 0)}
              </span>
            </div>
          </div>
          <p className="text-sm text-neutral-ink-600">
            确认后系统将自动生成委托代理合同，诚意金将划转至托管账户。
          </p>
        </div>
      ),
      okText: '确认中标',
      cancelText: '取消',
      okButtonProps: {
        className: '!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light',
      },
      onOk: () => {
        message.success(`已选择 ${bid.lawyerName} 律师，合同生成中...`);
        setBidDetailOpen(false);
      },
    });
  };

  const handleManageStatus = (caseItem: CaseSource, action: string) => {
    if (action === 'pause') {
      Modal.confirm({
        title: '暂停招募',
        content: '确定要暂停该案件的招募吗？暂停后律师将无法看到此案件。',
        okText: '确认暂停',
        cancelText: '取消',
        onOk: () => message.success('案件已暂停招募'),
      });
    } else if (action === 'cancel') {
      Modal.confirm({
        title: '取消发布',
        icon: <XCircle className="w-5 h-5 text-accent-red" />,
        content: '确定要取消发布该案件吗？取消后所有投标将被退回，诚意金将原路返还。',
        okText: '确认取消',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: () => message.success('案件已取消发布'),
      });
    } else if (action === 'resume') {
      message.success('案件已恢复招募');
    }
  };

  const handleWithdraw = () => {
    if (!selectedBid) return;
    Modal.confirm({
      title: '撤回投标',
      icon: <AlertCircle className="w-5 h-5 text-accent-red" />,
      content: (
        <div className="space-y-2">
          <p>确定要撤回对以下案件的投标吗？</p>
          <div className="p-3 bg-neutral-ink-50 rounded-lg">
            <p className="font-medium text-primary-900">{selectedBid.caseData.title}</p>
            <p className="text-sm text-neutral-ink-500 mt-1">
              您的报价：¥{formatMoney(selectedBid.price, 0)}
            </p>
          </div>
          <p className="text-sm text-neutral-ink-600">撤回后无法恢复，如需重新投标请再次提交。</p>
        </div>
      ),
      okText: '确认撤回',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        message.success('投标已撤回');
        setWithdrawModalOpen(false);
      },
    });
  };

  const renderPublishedCard = (caseItem: CaseSource) => {
    const causeInfo = CASE_CAUSES.find((c) => c.value === caseItem.cause);
    const provinceInfo = PROVINCES.find((p) => p.value === caseItem.province);
    const statusConfig = STATUS_CONFIG[caseItem.status];

    return (
      <Card
        key={caseItem.id}
        className="lc-card border-0 hover:-translate-y-1 transition-all duration-300"
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3
              className="font-serif font-semibold text-lg text-primary-900 line-clamp-2 flex-1 leading-snug cursor-pointer hover:text-accent-gold transition-colors"
              onClick={() => navigate(`/cases/${caseItem.id}`)}
            >
              {caseItem.title}
            </h3>
            <Tag
              color={statusConfig.color === 'gold' ? 'gold' : statusConfig.color}
              className="flex-shrink-0 !m-0"
            >
              {statusConfig.label}
            </Tag>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-accent-gold">
              <Gavel className="w-4 h-4" />
              <span className="font-serif font-bold text-xl">¥{formatMoney(caseItem.amount, 0)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
              <Users className="w-3.5 h-3.5" />
              <span>{caseItem.bids.length}人竞标</span>
            </div>
            <Badge
              count={caseItem.bids.filter((b) => b.messageCount > 0).length}
              size="small"
              offset={[-2, 2]}
            >
              <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>新消息</span>
              </div>
            </Badge>
          </div>

          <p className="text-sm text-neutral-ink-600 line-clamp-2 mb-4 leading-relaxed">
            {caseItem.description}
          </p>

          <div className="flex gap-1.5 flex-wrap mb-4">
            {causeInfo && (
              <Tag color="blue" className="!m-0">
                {causeInfo.label}
              </Tag>
            )}
            {caseItem.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} className="!m-0">
                {tag}
              </Tag>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-ink-100 mb-4">
            <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {provinceInfo?.label || caseItem.province}
                {caseItem.city ? `·${caseItem.city}` : ''}
              </span>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-sm',
                isOverdue(caseItem.deadline)
                  ? 'text-accent-red'
                  : isUpcoming(caseItem.deadline, 3)
                  ? 'text-yellow-600'
                  : 'text-neutral-ink-500'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isOverdue(caseItem.deadline)
                  ? '已截止'
                  : `${formatDate(caseItem.deadline, 'MM-DD')}截止`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="primary"
              icon={<Users className="w-4 h-4" />}
              onClick={() => handleViewBids(caseItem)}
            >
              查看投标 ({caseItem.bids.length})
            </Button>
            {(caseItem.status === 'published' || caseItem.status === 'bidding') && (
              <Tooltip title="暂停招募">
                <Button
                  icon={<Pause className="w-4 h-4" />}
                  onClick={() => handleManageStatus(caseItem, 'pause')}
                >
                  暂停
                </Button>
              </Tooltip>
            )}
            {caseItem.status === 'draft' && (
              <Tooltip title="恢复招募">
                <Button
                  icon={<Play className="w-4 h-4" />}
                  onClick={() => handleManageStatus(caseItem, 'resume')}
                >
                  恢复
                </Button>
              </Tooltip>
            )}
            <Button
              danger
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => handleManageStatus(caseItem, 'cancel')}
            >
              取消
            </Button>
            <Button
              icon={<ChevronRight className="w-4 h-4" />}
              onClick={() => navigate(`/cases/${caseItem.id}`)}
            >
              详情
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderMyBidCard = (bid: MyBid) => {
    const causeInfo = CASE_CAUSES.find((c) => c.value === bid.caseData.cause);
    const provinceInfo = PROVINCES.find((p) => p.value === bid.caseData.province);
    const bidStatus = BID_STATUS_CONFIG[bid.status];
    const totalBids = bid.caseData.bids.length + 1;

    return (
      <Card
        key={bid.id}
        className="lc-card border-0 hover:-translate-y-1 transition-all duration-300"
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3
              className="font-serif font-semibold text-lg text-primary-900 line-clamp-2 flex-1 leading-snug cursor-pointer hover:text-accent-gold transition-colors"
              onClick={() => navigate(`/cases/${bid.caseData.id}`)}
            >
              {bid.caseData.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {bid.rank <= 3 && bid.status !== 'lost' && bid.status !== 'withdrawn' && (
                <Tooltip title={`当前排名第 ${bid.rank} 名`}>
                  <Badge
                    count={bid.rank}
                    className="!bg-accent-gold"
                    style={{ backgroundColor: '#C9A962' }}
                  />
                </Tooltip>
              )}
              <Tag color={bidStatus.color} className="!m-0">
                {bidStatus.label}
              </Tag>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="lc-card p-3 !border-0 !bg-neutral-ivory !shadow-none">
              <div className="text-xs text-neutral-ink-500 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                我的报价
              </div>
              <div className="font-serif font-bold text-lg text-accent-gold">
                {bid.price > 0 ? `¥${formatMoney(bid.price, 0)}` : '风险代理'}
              </div>
            </div>
            <div className="lc-card p-3 !border-0 !bg-neutral-ivory !shadow-none">
              <div className="text-xs text-neutral-ink-500 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                当前排名
              </div>
              <div className="font-serif font-bold text-lg text-primary-900">
                {bid.status === 'lost' || bid.status === 'withdrawn' ? (
                  <span className="text-neutral-ink-500">-</span>
                ) : (
                  <>
                    第 <span className="text-accent-gold">{bid.rank}</span> / {totalBids} 名
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap mb-4">
            {causeInfo && (
              <Tag color="blue" className="!m-0">
                {causeInfo.label}
              </Tag>
            )}
            {bid.caseData.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} className="!m-0">
                {tag}
              </Tag>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-ink-100 mb-4">
            <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {provinceInfo?.label || bid.caseData.province}
                {bid.caseData.city ? `·${bid.caseData.city}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(bid.submittedAt)}</span>
            </div>
          </div>

          {bid.messageCount > 0 && (
            <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-primary-500" />
                <span className="text-primary-700">
                  客户有 <span className="font-semibold">{bid.messageCount}</span> 条新消息
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              icon={<MessageSquare className="w-4 h-4" />}
              onClick={() => message.info('正在打开沟通窗口...')}
            >
              沟通
            </Button>
            <Button
              type="primary"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => navigate(`/cases/${bid.caseData.id}`)}
            >
              查看案件
            </Button>
            {(bid.status === 'pending' || bid.status === 'reviewing') && (
              <Button
                danger
                icon={<LogOut className="w-4 h-4" />}
                onClick={() => {
                  setSelectedBid(bid);
                  setWithdrawModalOpen(true);
                }}
              >
                撤回投标
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderWonCard = (caseItem: any) => {
    const causeInfo = CASE_CAUSES.find((c) => c.value === caseItem.cause);
    const provinceInfo = PROVINCES.find((p) => p.value === caseItem.province);
    const statusConfig = STATUS_CONFIG[caseItem.status];

    return (
      <Card
        key={caseItem.id}
        className="lc-card border-0 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        <div className="bg-gradient-to-r from-accent-gold/10 to-accent-gold/5 border-b border-accent-gold/20 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-accent-gold" />
              <span className="font-medium text-primary-900">已中标案件</span>
            </div>
            <Tag
              color={statusConfig.color === 'gold' ? 'gold' : statusConfig.color}
              className="!m-0"
            >
              {statusConfig.label}
            </Tag>
          </div>
        </div>

        <div className="p-5">
          <h3
            className="font-serif font-semibold text-lg text-primary-900 line-clamp-2 mb-3 leading-snug cursor-pointer hover:text-accent-gold transition-colors"
            onClick={() => navigate(`/cases/${caseItem.id}`)}
          >
            {caseItem.title}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="lc-card p-3 !border-0 !bg-neutral-ivory !shadow-none">
              <div className="text-xs text-neutral-ink-500 mb-1">中标金额</div>
              <div className="font-serif font-bold text-lg text-accent-gold">
                ¥{formatMoney(caseItem.myPrice, 0)}
              </div>
            </div>
            <div className="lc-card p-3 !border-0 !bg-neutral-ivory !shadow-none">
              <div className="text-xs text-neutral-ink-500 mb-1">案件标的</div>
              <div className="font-serif font-bold text-lg text-primary-900">
                ¥{formatMoney(caseItem.amount, 0)}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-ink-600">办理进度</span>
              <span className="text-sm font-medium text-primary-900">{caseItem.progress}%</span>
            </div>
            <Progress
              percent={caseItem.progress}
              strokeColor={{ '0%': '#0A1628', '100%': '#C9A962' }}
              showInfo={false}
            />
          </div>

          {!caseItem.contractSigned && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">等待签署合同</p>
                  <p className="text-xs text-yellow-600 mt-0.5">请尽快签署委托代理合同以启动办理</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-1.5 flex-wrap mb-4">
            {causeInfo && (
              <Tag color="blue" className="!m-0">
                {causeInfo.label}
              </Tag>
            )}
            {caseItem.tags.slice(0, 2).map((tag: string) => (
              <Tag key={tag} className="!m-0">
                {tag}
              </Tag>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-ink-100 mb-4">
            <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {provinceInfo?.label || caseItem.province}
                {caseItem.city ? `·${caseItem.city}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
              <Award className="w-3.5 h-3.5" />
              <span>中标于 {formatDate(caseItem.selectedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!caseItem.contractSigned && (
              <Button
                type="primary"
                className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
                icon={<FileText className="w-4 h-4" />}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
              >
                签署合同
              </Button>
            )}
            {caseItem.contractSigned && (
              <Button
                type="primary"
                icon={<FileText className="w-4 h-4" />}
                onClick={() => navigate('/workspace')}
              >
                进入工作台
              </Button>
            )}
            <Button icon={<Eye className="w-4 h-4" />} onClick={() => navigate(`/cases/${caseItem.id}`)}>
              案件详情
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderBidDetailModal = () => {
    if (!selectedCase) return null;
    const sortedBids = [...selectedCase.bids].sort((a, b) => a.price - b.price);

    return (
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-gold" />
            <span className="font-serif font-semibold">查看投标 - {selectedCase.title}</span>
          </div>
        }
        open={bidDetailOpen}
        onCancel={() => setBidDetailOpen(false)}
        footer={null}
        width={900}
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-5">
          {selectedCase.bids.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-ink-600">
                  共 <span className="font-semibold text-primary-900">{selectedCase.bids.length}</span> 位律师投标
                </div>
                <span className="text-xs text-neutral-ink-500">按报价从低到高排序</span>
              </div>
              {sortedBids.map((bid, index) => (
                <div
                  key={bid.id}
                  className="lc-card border-0 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar size={48} src={bid.lawyerAvatar} />
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-gold rounded-full flex items-center justify-center">
                              <Crown className="w-3 h-3 text-primary-900" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-semibold text-primary-900 text-lg">
                              {bid.lawyerName}
                            </span>
                            {index === 0 && <Tag color="gold">最优报价</Tag>}
                            <Tag color="blue">主办律师</Tag>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-ink-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {bid.lawyerFirm}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-accent-gold fill-accent-gold" />
                              信用分 {bid.lawyerCreditScore}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-accent-gold font-serif font-bold text-2xl">
                          {bid.price > 0 ? `¥${formatMoney(bid.price, 0)}` : '风险代理'}
                        </div>
                        <div className="text-xs text-neutral-ink-500 mt-0.5">
                          预计 {bid.estimatedDays} 天
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 p-4 bg-neutral-ivory/50 rounded-lg">
                      <div className="text-sm font-medium text-neutral-ink-700 mb-2">代理方案：</div>
                      <p className="text-sm text-neutral-ink-600 leading-relaxed whitespace-pre-line">
                        {bid.proposal}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-ink-100">
                      <div className="flex items-center gap-4 text-sm text-neutral-ink-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {bid.messageCount} 次沟通
                        </span>
                        <span>{formatDateTime(bid.submittedAt)} 提交</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          icon={<MessageSquare className="w-4 h-4" />}
                          onClick={() => message.success(`已向 ${bid.lawyerName} 发起沟通`)}
                        >
                          发起沟通
                        </Button>
                        {selectedCase.status === 'bidding' && (
                          <Button
                            type="primary"
                            className="!bg-green-600 !text-white hover:!bg-green-700"
                            icon={<CheckCircle2 className="w-4 h-4" />}
                            onClick={() => handleSelectWinner(bid)}
                          >
                            选择中标
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12">
              <Empty description="暂无律师投标，请耐心等待" />
            </div>
          )}
        </div>
      </Modal>
    );
  };

  const tabItems = [
    {
      key: 'published',
      label: (
        <span className="flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          我发布的
          <Badge count={myPublishedCases.length} size="small" className="!ml-1" />
        </span>
      ),
      children: (
        <div>
          {myPublishedCases.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                {myPublishedCases.map(renderPublishedCard)}
              </div>
              <div className="flex justify-center">
                <Button
                  type="primary"
                  icon={<Plus className="w-4 h-4" />}
                  className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
                  onClick={() => navigate('/cases/publish')}
                >
                  发布新案件
                </Button>
              </div>
            </>
          ) : (
            <div className="lc-card p-16 text-center">
              <Empty
                description={
                  <div>
                    <p className="mb-3">您还没有发布任何案件</p>
                    <Button
                      type="primary"
                      icon={<Plus className="w-4 h-4" />}
                      className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
                      onClick={() => navigate('/cases/publish')}
                    >
                      立即发布案件
                    </Button>
                  </div>
                }
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'bidding',
      label: (
        <span className="flex items-center gap-1.5">
          <Send className="w-4 h-4" />
          我投标的
          <Badge count={myBids.filter((b) => b.status !== 'lost' && b.status !== 'withdrawn').length} size="small" className="!ml-1" />
        </span>
      ),
      children: (
        <div>
          {myBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {myBids.map(renderMyBidCard)}
            </div>
          ) : (
            <div className="lc-card p-16 text-center">
              <Empty
                description={
                  <div>
                    <p className="mb-3">您还没有提交任何投标</p>
                    <Button
                      type="primary"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => navigate('/cases')}
                    >
                      浏览案源市场
                    </Button>
                  </div>
                }
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'won',
      label: (
        <span className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4" />
          我中标的
          <Badge count={myWonCases.length} size="small" className="!ml-1" />
        </span>
      ),
      children: (
        <div>
          {myWonCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {myWonCases.map(renderWonCard)}
            </div>
          ) : (
            <div className="lc-card p-16 text-center">
              <Empty
                description={
                  <div>
                    <Trophy className="w-12 h-12 mx-auto text-neutral-ink-300 mb-3" />
                    <p className="mb-3">暂无中标案件</p>
                    <p className="text-sm text-neutral-ink-500">继续努力，相信您的专业能力！</p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">投标管理</h1>
          <p className="text-neutral-ink-500 mt-1">
            管理您发布的案件、提交的投标以及中标的案件
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/cases')}>
            返回案源市场
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
            onClick={() => navigate('/cases/publish')}
          >
            发布案件
          </Button>
        </div>
      </div>

      <Card className="lc-card border-0">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          className="lc-tabs"
        />
      </Card>

      {renderBidDetailModal()}

      <Modal
        title={
          <div className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-accent-red" />
            <span className="font-serif font-semibold">撤回投标确认</span>
          </div>
        }
        open={withdrawModalOpen}
        onCancel={() => setWithdrawModalOpen(false)}
        footer={null}
        width={520}
      >
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-accent-red/5 rounded-lg border border-accent-red/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-accent-red">撤回投标后将无法参与本次竞标</p>
                <p className="text-sm text-neutral-ink-600 mt-1">
                  如需重新参与，请在投标截止前重新提交投标
                </p>
              </div>
            </div>
          </div>

          {selectedBid && (
            <div className="p-4 bg-neutral-ivory rounded-lg border border-neutral-ink-100">
              <div className="text-sm text-neutral-ink-500 mb-1">案件名称</div>
              <div className="font-medium text-primary-900 mb-3">{selectedBid.caseData.title}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-neutral-ink-500 mb-0.5">我的报价</div>
                  <div className="font-serif font-bold text-accent-gold">
                    {selectedBid.price > 0 ? `¥${formatMoney(selectedBid.price, 0)}` : '风险代理'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-ink-500 mb-0.5">投标时间</div>
                  <div className="font-medium text-primary-900">
                    {formatDate(selectedBid.submittedAt)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-ink-100">
            <Button size="large" onClick={() => setWithdrawModalOpen(false)}>
              取消
            </Button>
            <Button
              size="large"
              danger
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleWithdraw}
            >
              确认撤回
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

export default Bidding;
