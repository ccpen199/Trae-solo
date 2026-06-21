import { useState, useMemo } from 'react';
import {
  Tabs,
  Select,
  DatePicker,
  Input,
  Table,
  Button,
  Tag,
  Progress,
  Collapse,
  Switch,
  Avatar,
  Badge,
  Tooltip,
  Space,
  Dropdown,
  Modal,
  message,
  Radio,
  Empty,
  Image,
} from 'antd';
import type { TabsProps, TableProps, CollapseProps } from 'antd';
import {
  Wrench,
  MessageCircle,
  AlertTriangle,
  Siren,
  Clock,
  MapPin,
  User,
  ChevronDown,
  Send,
  ArrowUpCircle,
  XCircle,
  Eye,
  Settings,
  Navigation,
  Zap,
  CircleDot,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  Hammer,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import DataCard from '@/components/common/DataCard';
import StatusBadge from '@/components/common/StatusBadge';
import Timeline from '@/components/common/Timeline';
import { maskPhone, haversineDistance, gpsDispatch, DispatchableEngineer } from '@/utils';
import type { ServiceWorkOrder, WorkOrderUrgency, WorkOrderStatus } from '@/types';
import { cn } from '@/lib/utils';

const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Search } = Input;
const { Option } = Select;

const COLORS = {
  brand: '#0F4C81',
  success: '#00A86B',
  warning: '#FF6B35',
  danger: '#E63946',
  gold: '#D4A574',
  ink: '#4A4F5A',
};

const PRIORITY_COLORS: Record<WorkOrderUrgency, { bg: string; text: string; label: string; flash?: boolean }> = {
  urgent: { bg: 'bg-danger-100', text: 'text-danger-600', label: '紧急', flash: true },
  high: { bg: 'bg-warning-100', text: 'text-warning-600', label: '高' },
  medium: { bg: 'bg-brand-100', text: 'text-brand-600', label: '中' },
  low: { bg: 'bg-ink-100', text: 'text-ink-500', label: '低' },
};

const TYPE_ICONS: Record<string, { icon: typeof Wrench; color: string; label: string }> = {
  repair: { icon: Wrench, color: COLORS.brand, label: '维修' },
  cleaning: { icon: Hammer, color: COLORS.success, label: '保洁' },
  move: { icon: Navigation, color: COLORS.gold, label: '搬家' },
  complaint: { icon: AlertTriangle, color: COLORS.warning, label: '投诉' },
  consult: { icon: MessageCircle, color: COLORS.brand, label: '咨询' },
  dispute: { icon: AlertOctagon, color: COLORS.danger, label: '纠纷' },
  checkout: { icon: CheckCircle2, color: COLORS.success, label: '退租验房' },
  checkin: { icon: CircleDot, color: COLORS.gold, label: '入住交接' },
};

const MOCK_ENGINEERS: DispatchableEngineer[] = [
  { id: 'eng_001', name: '林工', lat: 31.235, lng: 121.478, todayOrders: 3, skills: ['水电', '家电'], online: true, status: 'idle' },
  { id: 'eng_002', name: '郑工', lat: 31.228, lng: 121.480, todayOrders: 5, skills: ['家电', '空调'], online: true, status: 'busy' },
  { id: 'eng_003', name: '梁工', lat: 31.240, lng: 121.465, todayOrders: 2, skills: ['水电', '门窗'], online: true, status: 'idle' },
  { id: 'eng_004', name: '宋工', lat: 31.220, lng: 121.470, todayOrders: 6, skills: ['厨卫', '家电'], online: false, status: 'rest' },
  { id: 'eng_005', name: '许工', lat: 31.233, lng: 121.485, todayOrders: 1, skills: ['锁具', '门窗'], online: true, status: 'idle' },
];

interface UpgradeRule {
  id: string;
  title: string;
  threshold: string;
  action: string;
  enabled: boolean;
}

const DEFAULT_UPGRADE_RULES: UpgradeRule[] = [
  { id: '1', title: '接单超时升级', threshold: '2小时', action: '自动升级主管 + 备用池派单', enabled: true },
  { id: '2', title: '到场超时升级', threshold: '4小时', action: '自动升级区域经理 + 客诉预警', enabled: true },
  { id: '3', title: '解决超时升级', threshold: '24小时', action: '自动升级总监 + 应急响应小组', enabled: true },
];

export default function WorkOrderCenter() {
  const { workOrders, assignEngineer, completeWorkOrder } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [dispatchMode, setDispatchMode] = useState<'manual' | 'grab'>('manual');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterUrgency, setFilterUrgency] = useState<string | undefined>(undefined);
  const [filterDate, setFilterDate] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [filterStaff, setFilterStaff] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState<string>('');
  const [upgradeRules, setUpgradeRules] = useState<UpgradeRule[]>(DEFAULT_UPGRADE_RULES);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [targetOrderForDispatch, setTargetOrderForDispatch] = useState<ServiceWorkOrder | null>(null);

  const todayCompleted = useMemo(() => {
    return workOrders.filter((w) => {
      if (!w.completeTime) return false;
      return dayjs(w.completeTime).isSame(dayjs(), 'day');
    }).length;
  }, [workOrders]);

  const pendingCount = useMemo(
    () => workOrders.filter((w) => ['pending', 'accepted'].includes(w.status)).length,
    [workOrders]
  );
  const processingCount = useMemo(
    () => workOrders.filter((w) => ['assigned', 'processing', 'scheduled'].includes(w.status)).length,
    [workOrders]
  );
  const upgradedCount = useMemo(() => {
    return workOrders.filter((w) => {
      const created = dayjs(w.createTime);
      const diffMin = dayjs().diff(created, 'minute');
      const isAssigned = ['assigned', 'processing', 'scheduled'].includes(w.status);
      return (
        (w.status === 'pending' && diffMin > 120) ||
        (isAssigned && !w.actualVisitTime && diffMin > 240) ||
        (isAssigned && w.status !== 'completed' && diffMin > 1440)
      );
    }).length;
  }, [workOrders]);

  const filteredOrders = useMemo(() => {
    let result = [...workOrders];
    if (activeTab !== 'all') {
      const tabStatusMap: Record<string, WorkOrderStatus[]> = {
        pending: ['pending', 'accepted'],
        processing: ['assigned', 'processing', 'scheduled'],
        upgraded: ['pending', 'accepted', 'assigned', 'processing', 'scheduled'],
        completed: ['completed', 'to_rate'],
        closed: ['closed', 'cancelled'],
      };
      result = result.filter((w) => tabStatusMap[activeTab]?.includes(w.status));
    }
    if (activeTab === 'upgraded') {
      result = result.filter((w) => {
        const created = dayjs(w.createTime);
        const diffMin = dayjs().diff(created, 'minute');
        const isAssigned = ['assigned', 'processing', 'scheduled'].includes(w.status);
        return (
          (w.status === 'pending' && diffMin > 120) ||
          (isAssigned && !w.actualVisitTime && diffMin > 240) ||
          (isAssigned && w.status !== 'completed' && diffMin > 1440)
        );
      });
    }
    if (filterType) result = result.filter((w) => w.type === filterType);
    if (filterUrgency) result = result.filter((w) => w.urgency === filterUrgency);
    if (filterDate && filterDate[0] && filterDate[1]) {
      const start = filterDate[0]!;
      const end = filterDate[1]!;
      result = result.filter((w) => {
        const t = dayjs(w.createTime);
        return (t.isSame(start) || t.isAfter(start)) && (t.isSame(end) || t.isBefore(end));
      });
    }
    if (filterStaff) {
      result = result.filter((w) => w.assigneeEngineerName?.includes(filterStaff));
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (w) =>
          w.orderNo.toLowerCase().includes(kw) ||
          w.title.toLowerCase().includes(kw) ||
          w.propertyAddress?.toLowerCase().includes(kw) ||
          w.submitterName.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [workOrders, activeTab, filterType, filterUrgency, filterDate, filterStaff, keyword]);

  const pendingDispatchOrders = useMemo(() => {
    return workOrders
      .filter((w) => ['pending', 'accepted'].includes(w.status))
      .sort((a, b) => {
        const urgRank = { urgent: 0, high: 1, medium: 2, low: 3 };
        return urgRank[a.urgency] - urgRank[b.urgency];
      })
      .slice(0, 5);
  }, [workOrders]);

  const selectedOrder = useMemo(
    () => workOrders.find((w) => w.id === selectedWorkOrderId) || pendingDispatchOrders[0] || null,
    [workOrders, selectedWorkOrderId, pendingDispatchOrders]
  );

  const recommendedEngineers = useMemo(() => {
    if (!selectedOrder || !selectedOrder.latitude || !selectedOrder.longitude) return [];
    return gpsDispatch(selectedOrder.latitude, selectedOrder.longitude, MOCK_ENGINEERS).slice(0, 3);
  }, [selectedOrder]);

  const dispatchMapOption: EChartsOption = useMemo(() => {
    const orderPoints = pendingDispatchOrders.map((o, idx) => ({
      name: o.orderNo,
      value: [o.longitude || 121.4737, o.latitude || 31.2304, 22 - idx * 2],
      itemStyle: { color: COLORS.danger },
      order: o,
    }));

    const assignedOrders = workOrders.filter((w) =>
      ['assigned', 'processing', 'scheduled'].includes(w.status)
    );

    const engineerPoints = MOCK_ENGINEERS.map((e) => ({
      name: e.name,
      value: [e.lng, e.lat, e.online ? 18 : 12],
      itemStyle: { color: e.online ? COLORS.brand : '#9CA3AF' },
      engineer: e,
    }));

    const linesData = assignedOrders
      .filter((o) => o.latitude && o.longitude)
      .map((o) => {
        const eng = MOCK_ENGINEERS[Math.floor(Math.random() * MOCK_ENGINEERS.length)];
        return {
          coords: [
            [o.longitude!, o.latitude!],
            [eng.lng, eng.lat],
          ],
          lineStyle: {
            type: o.status === 'assigned' ? 'dashed' : 'solid',
            color: o.status === 'assigned' ? COLORS.warning : COLORS.success,
            width: 2,
          },
        };
      });

    const distanceCircles: any[] = [];
    if (selectedOrder && selectedOrder.latitude && selectedOrder.longitude) {
      [1, 2, 3].forEach((km, i) => {
        const lngDelta = km / 85;
        const latDelta = km / 111;
        const data: number[][] = [];
        for (let a = 0; a <= 360; a += 10) {
          const rad = (a * Math.PI) / 180;
          data.push([
            selectedOrder.longitude! + lngDelta * Math.cos(rad),
            selectedOrder.latitude! + latDelta * Math.sin(rad),
          ]);
        }
        distanceCircles.push({
          type: 'line',
          coordinateSystem: 'cartesian2d',
          data: [data],
          polyline: true,
          silent: true,
          lineStyle: {
            color: COLORS.brand,
            width: 1,
            type: 'dashed',
            opacity: 0.3 + i * 0.15,
          },
          label: {
            show: true,
            position: 'end',
            formatter: `${km}km`,
            color: COLORS.brand,
            fontSize: 10,
          },
        });
      });
    }

    const roadLines: any[] = [];
    const baseLat = 31.2304;
    const baseLng = 121.4737;
    for (let i = -3; i <= 3; i++) {
      roadLines.push({
        type: 'line',
        coordinateSystem: 'cartesian2d',
        polyline: true,
        silent: true,
        lineStyle: { color: '#D1D5DB', width: 1, type: 'solid', opacity: 0.4 },
        data: [
          [
            [baseLng - 0.04, baseLat + i * 0.008],
            [baseLng + 0.04, baseLat + i * 0.008],
          ],
        ],
      });
      roadLines.push({
        type: 'line',
        coordinateSystem: 'cartesian2d',
        polyline: true,
        silent: true,
        lineStyle: { color: '#D1D5DB', width: 1, type: 'solid', opacity: 0.4 },
        data: [
          [
            [baseLng + i * 0.008, baseLat - 0.025],
            [baseLng + i * 0.008, baseLat + 0.025],
          ],
        ],
      });
    }

    return {
      backgroundColor: '#FAFBFC',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data?.order) {
            const o = params.data.order as ServiceWorkOrder;
            const typeConf = TYPE_ICONS[o.type] || TYPE_ICONS.repair;
            const prio = PRIORITY_COLORS[o.urgency];
            const eta = selectedOrder?.latitude && o.latitude
              ? Math.round(haversineDistance(selectedOrder.latitude, selectedOrder.longitude!, o.latitude, o.longitude!) * 10)
              : 20 + Math.floor(Math.random() * 30);
            return `
              <div style="padding:4px">
                <div style="font-weight:600;margin-bottom:4px;color:${COLORS.ink}">${o.orderNo} · ${typeConf.label}</div>
                <div style="color:#6B7280;font-size:12px;margin-bottom:2px">📍 ${o.propertyAddress || '-'}</div>
                <div style="margin:4px 0">
                  <span style="background:${prio.bg.replace('bg-', '').includes('danger') ? '#FEF2F2' : prio.bg.includes('warning') ? '#FFF7ED' : prio.bg.includes('brand') ? '#EFF6FF' : '#F3F4F6'};color:${prio.text.includes('danger') ? COLORS.danger : prio.text.includes('warning') ? COLORS.warning : prio.text.includes('brand') ? COLORS.brand : '#6B7280'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500">${prio.label}</span>
                </div>
                <div style="color:#6B7280;font-size:12px">⏱️ ETA: ${eta}分钟</div>
              </div>
            `;
          }
          if (params.data?.engineer) {
            const e = params.data.engineer as DispatchableEngineer;
            return `
              <div style="padding:4px">
                <div style="font-weight:600;margin-bottom:4px">👷 ${e.name}</div>
                <div style="color:${e.online ? COLORS.success : '#9CA3AF'};font-size:12px;margin-bottom:2px">
                  ${e.online ? '● 在线' : '○ 离线'} · ${e.status === 'idle' ? '空闲' : e.status === 'busy' ? '忙碌' : '休息'}
                </div>
                <div style="color:#6B7280;font-size:12px">今日接单: ${e.todayOrders}单</div>
              </div>
            `;
          }
          return '';
        },
      },
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: {
        type: 'value',
        min: 121.42,
        max: 121.52,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: 31.195,
        max: 31.265,
        show: false,
      },
      series: [
        ...roadLines,
        ...distanceCircles,
        {
          name: '派单连线',
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          zlevel: 2,
          effect: {
            show: true,
            period: 6,
            trailLength: 0,
            symbol: 'arrow',
            symbolSize: 8,
          },
          lineStyle: {
            color: COLORS.success,
            width: 2,
            opacity: 0.8,
            curveness: 0.2,
          },
          data: linesData,
        },
        {
          name: '工单位置',
          type: 'effectScatter',
          coordinateSystem: 'cartesian2d',
          zlevel: 3,
          rippleEffect: {
            period: 4,
            scale: 5,
            brushType: 'stroke',
          },
          symbolSize: (val: number[]) => val[2] as number,
          data: orderPoints as any,
        },
        {
          name: '工程师位置',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          zlevel: 4,
          symbolSize: (val: number[]) => val[2] as number,
          data: engineerPoints as any,
        },
      ],
    };
  }, [pendingDispatchOrders, workOrders, selectedOrder]);

  const tabItems: TabsProps['items'] = [
    { key: 'all', label: `全部 (${workOrders.length})` },
    { key: 'pending', label: `待响应 (${pendingCount})` },
    { key: 'processing', label: `处理中 (${processingCount})` },
    { key: 'upgraded', label: `已升级 (${upgradedCount})` },
    { key: 'completed', label: `已完成 (${workOrders.filter((w) => ['completed', 'to_rate'].includes(w.status)).length})` },
    { key: 'closed', label: `已关闭 (${workOrders.filter((w) => ['closed', 'cancelled'].includes(w.status)).length})` },
  ];

  const calcSLAProgress = (order: ServiceWorkOrder): { response: number; handle: number; responseOverdue: boolean; handleOverdue: boolean } => {
    const created = dayjs(order.createTime);
    const elapsed = dayjs().diff(created, 'minute');
    const response = Math.min(100, Math.round((elapsed / Math.max(1, order.slaResponseTime)) * 100));
    const handle = Math.min(100, Math.round((elapsed / Math.max(1, order.slaHandleTime)) * 100));
    return {
      response,
      handle,
      responseOverdue: elapsed > order.slaResponseTime,
      handleOverdue: elapsed > order.slaHandleTime,
    };
  };

  const handleDispatch = (order: ServiceWorkOrder) => {
    setTargetOrderForDispatch(order);
    setDispatchModalOpen(true);
  };

  const confirmDispatch = (engineerId: string) => {
    if (targetOrderForDispatch) {
      assignEngineer(targetOrderForDispatch.id, engineerId);
      message.success(`工单已派给 ${MOCK_ENGINEERS.find((e) => e.id === engineerId)?.name}`);
      setDispatchModalOpen(false);
      setTargetOrderForDispatch(null);
    }
  };

  const handleUpgrade = (orderId: string) => {
    Modal.confirm({
      title: '确认升级工单',
      content: '升级后将通知上级主管并加入高优先级处理队列，是否继续？',
      okText: '确认升级',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        message.success('工单已升级，已通知区域主管');
      },
    });
  };

  const handleCloseOrder = (orderId: string) => {
    Modal.confirm({
      title: '确认关闭工单',
      content: '关闭后工单将不可恢复，请确认操作。',
      okText: '确认关闭',
      cancelText: '取消',
      onOk: () => {
        completeWorkOrder(orderId, 5);
        message.success('工单已关闭');
      },
    });
  };

  const toggleUpgradeRule = (ruleId: string) => {
    setUpgradeRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const tableColumns: TableProps<ServiceWorkOrder>['columns'] = [
    {
      title: '工单号 / 类型',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      render: (_, record) => {
        const typeConf = TYPE_ICONS[record.type] || TYPE_ICONS.repair;
        const IconComp = typeConf.icon;
        return (
          <div className="flex items-start gap-2">
            <div
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${typeConf.color}15`, color: typeConf.color }}
            >
              <IconComp className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <Button type="link" size="small" className="!p-0 !h-auto text-left font-medium text-brand-600 hover:underline">
                {record.orderNo}
              </Button>
              <div className="text-xs text-ink-400 mt-0.5">{typeConf.label}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'urgency',
      key: 'urgency',
      width: 90,
      render: (urgency: WorkOrderUrgency) => {
        const p = PRIORITY_COLORS[urgency];
        return (
          <Tag
            color={urgency === 'urgent' ? 'red' : urgency === 'high' ? 'orange' : urgency === 'medium' ? 'blue' : 'default'}
            className={cn('font-medium', p.flash && 'animate-pulse')}
          >
            {p.label}
          </Tag>
        );
      },
    },
    {
      title: '标题 / 描述',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium text-ink-800 truncate">{record.title}</div>
          <div className="text-xs text-ink-500 mt-0.5 truncate">{record.description}</div>
        </div>
      ),
    },
    {
      title: '租客信息',
      key: 'tenant',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium text-ink-700 flex items-center gap-1">
            <User className="h-3 w-3 text-ink-400" />
            {record.submitterName}
          </div>
          <div className="text-xs text-ink-500 mt-0.5">{maskPhone(record.submitterPhone)}</div>
        </div>
      ),
    },
    {
      title: '房源地址',
      dataIndex: 'propertyAddress',
      key: 'propertyAddress',
      width: 200,
      ellipsis: true,
      render: (addr) => (
        <div className="flex items-start gap-1 text-sm text-ink-600">
          <MapPin className="h-3 w-3 text-ink-400 mt-0.5 shrink-0" />
          <span className="truncate">{addr || '-'}</span>
        </div>
      ),
    },
    {
      title: 'SLA 进度',
      key: 'sla',
      width: 200,
      render: (_, record) => {
        const sla = calcSLAProgress(record);
        return (
          <div className="space-y-1.5 w-full">
            <div>
              <div className="flex justify-between text-[10px] text-ink-400 mb-0.5">
                <span>响应SLA</span>
                <span className={cn(sla.responseOverdue && 'text-danger-500 font-medium', sla.responseOverdue && 'animate-pulse')}>
                  {sla.response}%
                </span>
              </div>
              <Progress
                percent={sla.response}
                size="small"
                showInfo={false}
                strokeColor={sla.responseOverdue ? COLORS.danger : COLORS.brand}
                className="[&_.ant-progress-bg]:!h-1.5"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-ink-400 mb-0.5">
                <span>处理SLA</span>
                <span className={cn(sla.handleOverdue && 'text-danger-500 font-medium', sla.handleOverdue && 'animate-pulse')}>
                  {sla.handle}%
                </span>
              </div>
              <Progress
                percent={sla.handle}
                size="small"
                showInfo={false}
                strokeColor={sla.handleOverdue ? COLORS.danger : COLORS.success}
                className="[&_.ant-progress-bg]:!h-1.5"
              />
            </div>
          </div>
        );
      },
    },
    {
      title: '处理人',
      key: 'engineer',
      width: 110,
      render: (_, record) => (
        <div>
          {record.assigneeEngineerName ? (
            <div className="flex items-center gap-1.5">
              <Avatar size={22} className="!bg-brand-100 !text-brand-600 text-xs">
                {record.assigneeEngineerName.charAt(0)}
              </Avatar>
              <span className="text-sm text-ink-700">{record.assigneeEngineerName}</span>
            </div>
          ) : (
            <span className="text-xs text-ink-400">未派单</span>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <StatusBadge status={status} type="workorder" />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const canDispatch = ['pending', 'accepted'].includes(record.status);
        const canUpgrade = !['completed', 'closed', 'cancelled'].includes(record.status);
        return (
          <Space size={4}>
            {canDispatch && (
              <Button
                type="primary"
                size="small"
                icon={<Send className="h-3 w-3" />}
                onClick={() => handleDispatch(record)}
              >
                派单
              </Button>
            )}
            {canUpgrade && (
              <Button
                size="small"
                icon={<ArrowUpCircle className="h-3 w-3" />}
                danger
                onClick={() => handleUpgrade(record.id)}
              >
                升级
              </Button>
            )}
            {!['closed', 'cancelled'].includes(record.status) && (
              <Button
                size="small"
                icon={<XCircle className="h-3 w-3" />}
                onClick={() => handleCloseOrder(record.id)}
              >
                关闭
              </Button>
            )}
            <Button size="small" icon={<Eye className="h-3 w-3" />} type="link">
              详情
            </Button>
          </Space>
        );
      },
    },
  ];

  const expandedRowRender = (record: ServiceWorkOrder) => {
    const timelineItems = record.timeline.map((t) => ({
      time: dayjs(t.time).format('MM-DD HH:mm'),
      title: t.title,
      description: t.description
        ? `${t.description}${t.operatorName ? ` · ${t.operatorName}${t.operatorRole ? `(${t.operatorRole})` : ''}` : ''}`
        : undefined,
      status:
        (t.type === 'complete' || t.type === 'close'
          ? 'success'
          : t.type === 'create' || t.type === 'accept' || t.type === 'dispatch' || t.type === 'visit' || t.type === 'process'
          ? 'processing'
          : 'warning') as 'success' | 'processing' | 'warning' | 'danger',
    }));

    const allImages = record.timeline.flatMap((t) => t.images || []).concat(record.attachments);

    return (
      <div className="grid grid-cols-12 gap-6 py-2">
        <div className="col-span-7">
          <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-500" /> 工单时间轴
          </h4>
          <Timeline items={timelineItems} />
        </div>
        <div className="col-span-5 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-ink-700 mb-3">现场图片 / 凭证</h4>
            {allImages.length > 0 ? (
              <Image.PreviewGroup>
                <div className="grid grid-cols-3 gap-2">
                  {allImages.slice(0, 6).map((img, idx) => (
                    <Image
                      key={idx}
                      src={img}
                      width="100%"
                      height={72}
                      className="object-cover rounded-md"
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : (
              <Empty description="暂无图片" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-700 mb-3">沟通记录</h4>
            <div className="bg-ink-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="text-ink-600">
                <span className="font-medium text-brand-600">[客服]</span> 您好，工单已受理，我们将尽快安排工程师上门。
                <div className="text-[10px] text-ink-400 mt-0.5">
                  {dayjs(record.createTime).add(5, 'minute').format('MM-DD HH:mm')}
                </div>
              </div>
              <div className="text-ink-600">
                <span className="font-medium text-ink-700">[用户]</span> 好的，请尽快，谢谢。
                <div className="text-[10px] text-ink-400 mt-0.5">
                  {dayjs(record.createTime).add(8, 'minute').format('MM-DD HH:mm')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up space-y-6 p-6 bg-ink-50 min-h-screen">
      {/* 标题栏 */}
      <div className="card-standard flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-50 text-warning-500">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-800 font-serif">维修工单中心</h1>
            <p className="text-xs text-ink-500 mt-0.5">GPS定位派单 · 超时自动升级</p>
          </div>
        </div>
        <Space>
          <Button icon={<RefreshCw className="h-3.5 w-3.5" />}>刷新数据</Button>
        </Space>
      </div>

      {/* 区块1：工单概览条 */}
      <div className="grid grid-cols-4 gap-5">
        <DataCard
          title="待响应"
          value={pendingCount}
          unit="单"
          prefix={<Clock className="h-4 w-4" />}
          trend={-8.3}
          comparedTo="week"
          accentColor={COLORS.warning}
          sparkline={Array.from({ length: 12 }, () => Math.floor(Math.random() * 20 + pendingCount - 8))}
        />
        <DataCard
          title="处理中"
          value={processingCount}
          unit="单"
          prefix={<Hammer className="h-4 w-4" />}
          trend={12.5}
          comparedTo="week"
          accentColor={COLORS.brand}
          sparkline={Array.from({ length: 12 }, () => Math.floor(Math.random() * 20 + processingCount - 8))}
        />
        <DataCard
          title="已升级"
          value={upgradedCount}
          unit="单"
          prefix={<Zap className="h-4 w-4" />}
          trend={-15.2}
          comparedTo="week"
          accentColor={COLORS.danger}
          sparkline={Array.from({ length: 12 }, () => Math.floor(Math.random() * 10 + upgradedCount - 3))}
        />
        <DataCard
          title="今日已完成"
          value={todayCompleted}
          unit="单"
          prefix={<CheckCircle2 className="h-4 w-4" />}
          trend={23.6}
          comparedTo="week"
          accentColor={COLORS.success}
          sparkline={Array.from({ length: 12 }, () => Math.floor(Math.random() * 15 + todayCompleted - 5))}
        />
      </div>

      {/* 区块2：派单地图 */}
      <div className="card-standard overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="section-title !mb-0">派单地图</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: COLORS.danger }} />
                <span className="w-2 h-2 rounded-full -ml-3.5 mr-1" style={{ backgroundColor: COLORS.danger }} />
                <span className="text-ink-500">工单位置</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.brand }} />
                <span className="text-ink-500">工程师位置</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-0.5" style={{ backgroundColor: COLORS.success }} />
                <span className="text-ink-500">派单连线</span>
              </div>
            </div>
          </div>
          <Radio.Group
            value={dispatchMode}
            onChange={(e) => setDispatchMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
            options={[
              { label: '智能派单', value: 'manual' },
              { label: '抢单模式', value: 'grab' },
            ]}
          />
        </div>

        <div className="flex gap-0" style={{ height: 480 }}>
          <div className="flex-1 relative rounded-xl overflow-hidden border border-ink-100">
            <ReactECharts
              option={dispatchMapOption}
              style={{ width: '100%', height: '100%' }}
              notMerge={true}
            />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-sm border border-ink-100">
              <div className="font-medium text-ink-700 mb-0.5">上海市区范围</div>
              <div className="text-ink-500">中心: 人民广场 121.4737, 31.2304</div>
            </div>
          </div>

          <div className="w-[320px] flex flex-col gap-3 ml-4 shrink-0">
            <div className="flex-1 border border-ink-100 rounded-xl overflow-hidden flex flex-col">
              <div className="px-3 py-2.5 bg-ink-50 border-b border-ink-100 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-ink-700 flex items-center gap-1.5">
                  <Siren className="h-3.5 w-3.5 text-warning-500" />
                  待派单列表
                </h4>
                <Badge count={pendingDispatchOrders.length} size="small" />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {pendingDispatchOrders.length === 0 ? (
                  <Empty description="暂无待派工单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  pendingDispatchOrders.map((order) => {
                    const prio = PRIORITY_COLORS[order.urgency];
                    const typeConf = TYPE_ICONS[order.type] || TYPE_ICONS.repair;
                    const IconComp = typeConf.icon;
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedWorkOrderId(order.id)}
                        className={cn(
                          'p-2.5 rounded-lg cursor-pointer transition-all border',
                          isSelected
                            ? 'bg-brand-50 border-brand-200 shadow-sm'
                            : 'bg-white border-ink-100 hover:border-brand-100 hover:bg-ink-50'
                        )}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Tag
                              color={order.urgency === 'urgent' ? 'red' : order.urgency === 'high' ? 'orange' : order.urgency === 'medium' ? 'blue' : 'default'}
                              className="!mr-0 !text-[10px] !py-0 !px-1.5"
                            >
                              {prio.label}
                            </Tag>
                            <span className="flex items-center gap-1 text-xs font-medium text-ink-700 truncate">
                              <IconComp className="h-3 w-3" style={{ color: typeConf.color }} />
                              {typeConf.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-ink-400 shrink-0 ml-1">
                            {dayjs(order.createTime).format('HH:mm')}
                          </span>
                        </div>
                        <div className="text-xs text-ink-600 line-clamp-1 mb-1">{order.title}</div>
                        <div className="text-[11px] text-ink-400 truncate flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {order.propertyAddress?.replace(/^上海市/, '') || '-'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border border-brand-200 rounded-xl overflow-hidden flex flex-col bg-gradient-to-br from-brand-50/50 to-white">
              <div className="px-3 py-2.5 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-brand-700 flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5" />
                  派单建议
                </h4>
                {selectedOrder ? (
                  <span className="text-[10px] text-brand-500 bg-white px-1.5 py-0.5 rounded">就近推荐</span>
                ) : null}
              </div>
              <div className="p-2.5 space-y-2">
                {!selectedOrder ? (
                  <div className="text-center text-xs text-ink-400 py-6">请选择左侧工单查看推荐工程师</div>
                ) : recommendedEngineers.length === 0 ? (
                  <Empty description="暂无可用工程师" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  recommendedEngineers.map((eng, idx) => (
                    <div
                      key={eng.id}
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 rounded-lg bg-white border',
                        idx === 0 ? 'border-brand-200 shadow-sm' : 'border-ink-100'
                      )}
                    >
                      <div className="relative">
                        <Avatar size={38} className="!bg-gradient-to-br !from-brand-400 !to-brand-600 text-white font-medium">
                          {eng.name.charAt(0)}
                        </Avatar>
                        <span
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                            eng.online ? 'bg-success-500' : 'bg-ink-300'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-ink-800">{eng.name}</span>
                          {idx === 0 && (
                            <Tag color="gold" className="!text-[10px] !mr-0 !py-0 !px-1.5">
                              最佳
                            </Tag>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-500 mt-0.5 flex items-center gap-2">
                          <span>📍 {eng.distance.toFixed(1)}km</span>
                          <span>⏱ {Math.round(eng.distance * 8)}分钟</span>
                        </div>
                        <div className="text-[10px] text-ink-400 mt-0.5">今日接单：{eng.todayOrders}单</div>
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        className="shrink-0"
                        icon={<Send className="h-3 w-3" />}
                        onClick={() => confirmDispatch(eng.id)}
                      >
                        派单
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 区块3：工单管理表格 */}
      <div className="card-standard">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="mb-4" />

        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-ink-50 rounded-lg">
          <div className="flex items-center gap-1.5 text-sm text-ink-600 font-medium">
            <Filter className="h-3.5 w-3.5" />
            筛选条件：
          </div>
          <Select
            placeholder="工单类型"
            allowClear
            style={{ width: 120 }}
            value={filterType}
            onChange={setFilterType}
          >
            {Object.entries(TYPE_ICONS).map(([key, conf]) => (
              <Option key={key} value={key}>
                {conf.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="优先级"
            allowClear
            style={{ width: 100 }}
            value={filterUrgency}
            onChange={setFilterUrgency}
          >
            <Option value="urgent">紧急</Option>
            <Option value="high">高</Option>
            <Option value="medium">中</Option>
            <Option value="low">低</Option>
          </Select>
          <RangePicker
            format="YYYY-MM-DD"
            style={{ width: 260 }}
            value={filterDate as any}
            onChange={(v) => setFilterDate(v as any)}
          />
          <Select
            placeholder="处理管家"
            allowClear
            style={{ width: 120 }}
            value={filterStaff}
            onChange={setFilterStaff}
          >
            {MOCK_ENGINEERS.map((e) => (
              <Option key={e.id} value={e.name}>
                {e.name}
              </Option>
            ))}
          </Select>
          <Search
            placeholder="关键词搜索"
            allowClear
            style={{ width: 220 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Button
            onClick={() => {
              setFilterType(undefined);
              setFilterUrgency(undefined);
              setFilterDate(null);
              setFilterStaff(undefined);
              setKeyword('');
            }}
          >
            重置
          </Button>
        </div>

        <Table<ServiceWorkOrder>
          rowKey="id"
          columns={tableColumns}
          dataSource={filteredOrders}
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条工单`,
          }}
          expandable={{
            expandedRowRender,
            expandIcon: ({ expanded, onExpand, record }) => (
              <ChevronDown
                className={cn(
                  'h-4 w-4 cursor-pointer transition-transform text-ink-400 hover:text-brand-500',
                  expanded && 'rotate-180'
                )}
                onClick={(e: any) => {
                  e.stopPropagation();
                  onExpand(record, e);
                }}
              />
            ),
          }}
        />
      </div>

      {/* 区块4：超时升级规则配置 */}
      <div className="card-standard">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-50 text-danger-500">
              <Settings className="h-4 w-4" />
            </div>
            <h3 className="section-title !mb-0">超时升级规则配置</h3>
          </div>
          <Button type="link" size="small" icon={<Settings className="h-3.5 w-3.5" />}>
            高级配置
          </Button>
        </div>
        <Collapse
          ghost
          items={upgradeRules.map<CollapseProps['items'][number]>((rule) => ({
            key: rule.id,
            label: (
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-warning-500" />
                  <span className="text-sm font-medium text-ink-700">{rule.title}</span>
                  <Tag color="purple" className="!text-[10px]">
                    阈值 {rule.threshold}
                  </Tag>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-500">{rule.action}</span>
                  <Switch
                    checked={rule.enabled}
                    size="small"
                    onChange={() => toggleUpgradeRule(rule.id)}
                    onClick={(_checked, e: any) => e?.stopPropagation?.()}
                  />
                </div>
              </div>
            ),
            children: (
              <div className="grid grid-cols-4 gap-4 p-4 bg-ink-50 rounded-lg ml-8">
                <div>
                  <div className="text-xs text-ink-500 mb-1">触发条件</div>
                  <div className="text-sm text-ink-700 font-medium">
                    超过 {rule.threshold} 未处理
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-500 mb-1">升级动作</div>
                  <div className="text-sm text-ink-700 font-medium">{rule.action}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500 mb-1">通知渠道</div>
                  <div className="text-sm text-ink-700 font-medium">短信 · 站内信 · 钉钉</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500 mb-1">操作</div>
                  <Space>
                    <Button size="small" type="link" className="!p-0">
                      编辑阈值
                    </Button>
                    <Button size="small" type="link" className="!p-0">
                      查看历史
                    </Button>
                  </Space>
                </div>
              </div>
            ),
          }))}
        />
      </div>

      {/* 派单Modal */}
      <Modal
        title="派单确认"
        open={dispatchModalOpen}
        onCancel={() => setDispatchModalOpen(false)}
        footer={null}
        width={520}
      >
        {targetOrderForDispatch && (
          <div className="space-y-4">
            <div className="p-3 bg-brand-50 rounded-lg border border-brand-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-ink-500">目标工单</span>
                <Tag color={targetOrderForDispatch.urgency === 'urgent' ? 'red' : 'blue'}>
                  {PRIORITY_COLORS[targetOrderForDispatch.urgency].label}
                </Tag>
              </div>
              <div className="text-sm font-semibold text-ink-800">{targetOrderForDispatch.orderNo} · {targetOrderForDispatch.title}</div>
              <div className="text-xs text-ink-500 mt-1">
                {targetOrderForDispatch.propertyAddress}
              </div>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {MOCK_ENGINEERS.filter((e) => e.online).map((eng) => {
                const dist =
                  targetOrderForDispatch.latitude && targetOrderForDispatch.longitude
                    ? haversineDistance(targetOrderForDispatch.latitude, targetOrderForDispatch.longitude, eng.lat, eng.lng)
                    : Math.random() * 5 + 0.5;
                return (
                  <div
                    key={eng.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-ink-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-pointer"
                    onClick={() => confirmDispatch(eng.id)}
                  >
                    <Avatar size={36} className="!bg-brand-100 !text-brand-600">
                      {eng.name.charAt(0)}
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink-800">{eng.name}</div>
                      <div className="text-xs text-ink-500">
                        📍 {dist.toFixed(1)}km · ⏱ {Math.round(dist * 8)}分钟 · 📋 今日{eng.todayOrders}单
                      </div>
                    </div>
                    <Button type="primary" size="small" icon={<Send className="h-3 w-3" />}>
                      派单
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
