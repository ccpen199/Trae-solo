import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Descriptions,
  Tag,
  Avatar,
  Button,
  Input,
  Select,
  Timeline,
  Image,
  Modal,
  Upload,
  Divider,
  Alert,
  Tabs,
  Space,
  message,
} from 'antd';
import {
  ArrowLeft,
  AlertTriangle,
  User,
  FileText,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  UserPlus,
  Eye,
  MapPin,
  FileWarning,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockRiskTickets } from '@/mock';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import {
  RISK_TYPE_MAP,
  SEVERITY_MAP,
  TICKET_STATUS_MAP,
} from '@/utils/constants';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface EvidenceItem {
  id: string;
  type: 'screenshot' | 'system-log' | 'location' | 'video' | 'patient-statement';
  typeLabel: string;
  url?: string;
  thumbnail?: string;
  description: string;
  timestamp: string;
  uploader: string;
}

interface ProcessRecord {
  id: string;
  action: 'assign' | 'reply' | 'process' | 'close';
  actionLabel: string;
  operator: string;
  content: string;
  timestamp: string;
}

const mockEvidenceList: EvidenceItem[] = [
  {
    id: 'ev001',
    type: 'screenshot',
    typeLabel: '录像截图',
    thumbnail: 'https://picsum.photos/seed/nursing1/400/240',
    description: '服务录像第15分32秒截图，疑似超范围操作',
    timestamp: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    uploader: '风控系统自动采集',
  },
  {
    id: 'ev002',
    type: 'system-log',
    typeLabel: '系统日志',
    description: '系统检测到护士端操作非订单服务项目：静脉穿刺（ID: OP_VEIN_001），该操作不在护士执业许可范围内',
    timestamp: dayjs().subtract(2, 'hour').subtract(45, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    uploader: '风控系统自动采集',
  },
  {
    id: 'ev003',
    type: 'location',
    typeLabel: '位置轨迹',
    description: '服务期间GPS轨迹显示护士在订单地址范围外停留约18分钟',
    timestamp: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    uploader: '风控系统自动采集',
  },
  {
    id: 'ev004',
    type: 'patient-statement',
    typeLabel: '患者陈述',
    description: '患者家属电话投诉："护士给病人输了液，但我们订单上没有这项服务，而且我母亲说有点不舒服。"',
    timestamp: dayjs().subtract(1, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    uploader: '客服专员-李婷',
  },
  {
    id: 'ev005',
    type: 'video',
    typeLabel: '视频片段',
    thumbnail: 'https://picsum.photos/seed/nursing2/400/240',
    description: '异常操作关键视频片段（45秒）',
    timestamp: dayjs().subtract(45, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    uploader: '风控专员-刘强',
  },
];

const mockProcessRecords: ProcessRecord[] = [
  {
    id: 'pr001',
    action: 'assign',
    actionLabel: '创建并分配',
    operator: '风控系统',
    content: '系统自动检测到异常，创建风控工单并分配至风控专员-刘强',
    timestamp: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'pr002',
    action: 'reply',
    actionLabel: '回复',
    operator: '风控专员-刘强',
    content: '已收到工单，正在调取相关服务录像和系统日志进行核实。预计2小时内给出初步结论。',
    timestamp: dayjs().subtract(3, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'pr003',
    action: 'reply',
    actionLabel: '回复',
    operator: '风控专员-刘强',
    content: '已联系涉事护士王桂兰，其承认进行了超出订单范围的静脉输液操作，理由是患者家属强烈要求。已告知护士此举的严重性。',
    timestamp: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'pr004',
    action: 'reply',
    actionLabel: '回复',
    operator: '风控专员-刘强',
    content: '已与患者家属电话沟通，患者目前情况稳定，家属情绪有所缓和。我们承诺严肃处理此事。',
    timestamp: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  },
];

const assigneeOptions = [
  { value: 'u002', label: '风控专员-刘强' },
  { value: 'u003', label: '风控主管-周磊' },
  { value: 'u004', label: '高级风控-吴敏' },
  { value: 'u005', label: '质控专员-王芳' },
  { value: 'u006', label: '机构管理员-陈红' },
];

const resultOptions = [
  { value: 'pass', label: '通过（无违规）' },
  { value: 'warning', label: '警告教育' },
  { value: 'training', label: '强制培训' },
  { value: 'punishment', label: '处罚处分' },
];

const evidenceIconMap: Record<string, React.ReactNode> = {
  screenshot: <ImageIcon className="h-5 w-5 text-amber-500" />,
  'system-log': <FileWarning className="h-5 w-5 text-blue-500" />,
  location: <MapPin className="h-5 w-5 text-green-500" />,
  video: <Video className="h-5 w-5 text-purple-500" />,
  'patient-statement': <MessageSquare className="h-5 w-5 text-pink-500" />,
};

const actionIconMap: Record<string, React.ReactNode> = {
  assign: <UserPlus className="h-4 w-4 text-blue-500" />,
  reply: <MessageSquare className="h-4 w-4 text-green-500" />,
  process: <CheckCircle className="h-4 w-4 text-amber-500" />,
  close: <XCircle className="h-4 w-4 text-slate-500" />,
};

const actionColorMap: Record<string, string> = {
  assign: 'text-blue-600',
  reply: 'text-green-600',
  process: 'text-amber-600',
  close: 'text-slate-600',
};

const SEVERITY_BADGE: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-slate-100', text: 'text-slate-600' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700' },
  critical: { bg: 'bg-red-50', text: 'text-red-700' },
};

export default function RiskTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { riskTickets, setRiskTickets } = useGlobalStore();

  const [activeTab, setActiveTab] = useState('evidence');
  const [assignee, setAssignee] = useState<string | undefined>(undefined);
  const [processResult, setProcessResult] = useState<string | undefined>(undefined);
  const [processNote, setProcessNote] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const ticket = useMemo(() => {
    if (!id) return undefined;
    return riskTickets.find((t) => t.id === id) || mockRiskTickets.find((t) => t.id === id);
  }, [id, riskTickets]);

  const pendingDuration = useMemo(() => {
    if (!ticket) return '-';
    const start = dayjs(ticket.createdAt);
    const end = ticket.resolvedAt ? dayjs(ticket.resolvedAt) : dayjs();
    const hours = end.diff(start, 'hour');
    const minutes = end.diff(start, 'minute') % 60;
    if (hours < 24) return `${hours}小时${minutes}分钟`;
    const days = Math.floor(hours / 24);
    return `${days}天${hours % 24}小时`;
  }, [ticket]);

  const isOverdue = useMemo(() => {
    if (!ticket) return false;
    if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
    return dayjs().diff(dayjs(ticket.createdAt), 'hour') > 24;
  }, [ticket]);

  const isHighRisk = ticket && (ticket.severity === 'critical' || ticket.severity === 'high');

  if (!ticket) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-slate-300" />
        <p className="text-lg text-slate-500">未找到对应的风控工单</p>
        <Button type="primary" onClick={() => navigate(-1)}>
          返回上一页
        </Button>
      </div>
    );
  }

  const riskTypeConfig = RISK_TYPE_MAP[ticket.riskType];
  const severityConfig = SEVERITY_MAP[ticket.severity];
  const severityBadge = SEVERITY_BADGE[ticket.severity];

  const tabItems = [
    {
      key: 'evidence',
      label: (
        <span className="flex items-center gap-1.5">
          <Eye className="h-4 w-4" />
          证据链
        </span>
      ),
      children: (
        <div className="py-4">
          <Timeline
            items={mockEvidenceList.map((ev) => ({
              dot: evidenceIconMap[ev.type] || <FileText className="h-5 w-5 text-slate-400" />,
              children: (
                <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <Tag color={riskTypeConfig?.color || '#64748B'} className="m-0">
                      {ev.typeLabel}
                    </Tag>
                    <span className="text-xs text-slate-400">{ev.timestamp}</span>
                  </div>
                  <p className="mb-2 text-sm text-slate-700">{ev.description}</p>
                  {ev.thumbnail && (
                    <div className="mb-2 overflow-hidden rounded-md">
                      <Image
                        src={ev.thumbnail}
                        alt={ev.typeLabel}
                        className="max-h-48 rounded-md object-cover"
                        preview={{ mask: '查看大图' }}
                      />
                    </div>
                  )}
                  <div className="text-xs text-slate-400">采集人：{ev.uploader}</div>
                </div>
              ),
            }))}
          />
        </div>
      ),
    },
    {
      key: 'process',
      label: (
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          处理记录
        </span>
      ),
      children: (
        <div className="py-4">
          <Timeline
            items={mockProcessRecords.map((pr) => ({
              dot: actionIconMap[pr.action] || <FileText className="h-4 w-4 text-slate-400" />,
              children: (
                <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={cn('text-sm font-medium', actionColorMap[pr.action])}>
                      {pr.actionLabel}
                    </span>
                    <span className="text-xs text-slate-400">{pr.timestamp}</span>
                  </div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    {pr.operator}
                  </div>
                  <p className="text-sm text-slate-600">{pr.content}</p>
                </div>
              ),
            }))}
          />
        </div>
      ),
    },
    {
      key: 'related',
      label: (
        <span className="flex items-center gap-1.5">
          <LinkIcon className="h-4 w-4" />
          关联材料
        </span>
      ),
      children: (
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FileText className="h-4 w-4 text-blue-500" />
              关联订单
            </div>
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="订单号">
                <a className="text-blue-600 hover:underline">{ticket.orderNo}</a>
              </Descriptions.Item>
              <Descriptions.Item label="护士">{ticket.nurseName || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{ticket.createdAt}</Descriptions.Item>
              <Descriptions.Item label="工单编号">{ticket.ticketNo}</Descriptions.Item>
            </Descriptions>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              服务记录
            </div>
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="服务状态">已结束</Descriptions.Item>
              <Descriptions.Item label="录像状态">存在中断</Descriptions.Item>
              <Descriptions.Item label="签到状态">已签到</Descriptions.Item>
              <Descriptions.Item label="数据核验">不一致</Descriptions.Item>
            </Descriptions>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              关联保单
            </div>
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="保单号">POL202506012001</Descriptions.Item>
              <Descriptions.Item label="保险公司">中国平安保险</Descriptions.Item>
              <Descriptions.Item label="产品">居家护理意外险A款</Descriptions.Item>
              <Descriptions.Item label="保障状态">
                <Tag color="green">保障中</Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      label: (
        <span className="flex items-center gap-1.5">
          <Send className="h-4 w-4" />
          处理操作
        </span>
      ),
      children: (
        <div className="mx-auto max-w-2xl space-y-6 py-4">
          {isHighRisk && (
            <Alert
              type="error"
              showIcon
              icon={<AlertTriangle className="h-4 w-4" />}
              message="高危工单提醒"
              description="该工单严重程度为高/紧急，请优先处理并在24小时内给出处理结论。"
            />
          )}

          {isOverdue && (
            <Alert
              type="warning"
              showIcon
              icon={<Clock className="h-4 w-4" />}
              message="超时提醒"
              description="该工单已超过24小时未处理，请尽快完成处理。"
            />
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h4 className="mb-4 text-sm font-medium text-slate-700">指派处理人</h4>
            <Select
              className="w-full"
              placeholder="请选择处理人"
              value={assignee}
              onChange={setAssignee}
              options={assigneeOptions}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h4 className="mb-4 text-sm font-medium text-slate-700">处理结果</h4>
            <Select
              className="w-full"
              placeholder="请选择处理结果"
              value={processResult}
              onChange={setProcessResult}
              options={resultOptions}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h4 className="mb-4 text-sm font-medium text-slate-700">处理说明</h4>
            <Input.TextArea
              rows={4}
              placeholder="请输入处理说明..."
              value={processNote}
              onChange={(e) => setProcessNote(e.target.value)}
            />
          </div>

          <Divider />

          <Space className="w-full justify-end">
            <Button onClick={() => navigate(-1)}>取消</Button>
            <Button
              type="primary"
              icon={<Send className="h-4 w-4" />}
              disabled={!processResult}
              onClick={() => setConfirmModalVisible(true)}
            >
              确认提交
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        showBack
        onBack={() => navigate(-1)}
        title="风控工单详情"
        description={ticket.ticketNo}
        icon={<AlertTriangle className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            异常信息
          </h3>
          <Descriptions column={1} size="small" colon={false}>
            <Descriptions.Item label="异常类型">
              <Tag color={riskTypeConfig?.color}>{riskTypeConfig?.label || ticket.riskType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="严重程度">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  severityBadge?.bg,
                  severityBadge?.text
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', severityConfig?.dotColor)} />
                {severityConfig?.label || ticket.severity}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="异常描述">
              <span className="text-sm text-slate-600">{ticket.description}</span>
            </Descriptions.Item>
            <Descriptions.Item label="关联订单">
              <a className="text-blue-600 hover:underline">{ticket.orderNo}</a>
            </Descriptions.Item>
            <Descriptions.Item label="护士信息">
              <div className="flex items-center gap-2">
                <Avatar size="small" icon={<User className="h-3.5 w-3.5" />} />
                <span className="text-sm">{ticket.nurseName || '-'}</span>
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Clock className="h-4 w-4 text-blue-500" />
            处理状态
          </h3>
          <Descriptions column={1} size="small" colon={false}>
            <Descriptions.Item label="创建时间">
              <span className="text-sm text-slate-600">{ticket.createdAt}</span>
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <StatusBadge type="ticket" status={ticket.status} />
            </Descriptions.Item>
            <Descriptions.Item label="处理人">
              <div className="flex items-center gap-2">
                <Avatar size="small" icon={<User className="h-3.5 w-3.5" />} />
                <span className="text-sm">{ticket.assigneeName || '暂未分配'}</span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="待处理时长">
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm',
                  isOverdue ? 'font-medium text-red-600' : 'text-slate-600'
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                {pendingDuration}
                {isOverdue && <span className="text-xs text-red-500">（已超时）</span>}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="px-4"
          size="large"
        />
      </div>

      <Modal
        title="确认处理"
        open={confirmModalVisible}
        okText="确认提交"
        cancelText="取消"
        onOk={() => {
          setConfirmModalVisible(false);
          message.success('工单处理完成，结果已记录');
          setProcessResult(undefined);
          setProcessNote('');
          setAssignee(undefined);
        }}
        onCancel={() => setConfirmModalVisible(false)}
      >
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-600">
            确认提交工单 <strong>{ticket.ticketNo}</strong> 的处理结果？
          </p>
          {processResult && (
            <p className="text-sm">
              处理结果：
              <Tag color="blue">{resultOptions.find((o) => o.value === processResult)?.label}</Tag>
            </p>
          )}
          {processNote && (
            <p className="text-sm text-slate-500">处理说明：{processNote}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
