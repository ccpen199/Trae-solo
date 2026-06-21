import { useState, useMemo } from 'react';
import {
  Select,
  Radio,
  Checkbox,
  DatePicker,
  Button,
  Tag,
  Card,
  Steps,
  Progress,
  Collapse,
  Badge,
  Rate,
  Drawer,
  Modal,
  Input,
  Table,
  Avatar,
  Space,
  Empty,
  InputNumber,
  Alert,
  Statistic,
  Divider,
  message,
} from 'antd';
import type { TableProps, CollapseProps, CheckboxProps } from 'antd';
import {
  ShieldAlert,
  Flame,
  Droplets,
  Mountain,
  Home,
  AlertTriangle,
  Activity,
  Building2,
  CalendarDays,
  Users,
  FileSignature,
  Send,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  Star,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Truck,
  Umbrella,
  Bell,
  FileText,
  Building,
  Siren,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import DataCard from '@/components/common/DataCard';
import StatusBadge from '@/components/common/StatusBadge';
import Timeline from '@/components/common/Timeline';
import ProgressRing from '@/components/common/ProgressRing';
import { maskPhone, haversineDistance, formatMoney } from '@/utils';
import type { EmergencyPlacement, ServiceWorkOrder } from '@/types';
import { cn } from '@/lib/utils';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { Meta } = Card;

const COLORS = {
  brand: '#0F4C81',
  success: '#00A86B',
  warning: '#FF6B35',
  danger: '#E63946',
  gold: '#D4A574',
  ink: '#4A4F5A',
  orange: '#F97316',
};

const EMERGENCY_TYPES = [
  { value: 'fire', label: '火灾', icon: Flame, color: COLORS.danger },
  { value: 'flood', label: '水灾', icon: Droplets, color: '#3B82F6' },
  { value: 'earthquake', label: '地震', icon: Mountain, color: '#A855F7' },
  { value: 'structure', label: '房屋结构', icon: Home, color: COLORS.warning },
  { value: 'pandemic', label: '疫情', icon: Umbrella, color: COLORS.success },
  { value: 'other', label: '其他', icon: AlertTriangle, color: COLORS.gold },
];

const PROOF_TYPES: { label: string; value: string }[] = [
  { label: '官方通报', value: 'official' },
  { label: '现场照片', value: 'photos' },
  { label: '视频证据', value: 'video' },
  { label: '保险公司出险', value: 'insurance' },
];

const AGREEMENT_TEMPLATES = [
  { value: 'standard_v2_3', label: '标准应急安置协议V2.3' },
  { value: 'pandemic_special', label: '疫情专项安置协议' },
  { value: 'fire_temporary', label: '火灾临时安置协议' },
];

const COOPERATE_HOTELS = [
  { id: 'h001', name: '如家精选酒店(人民广场店)', address: '上海市黄浦区西藏中路100号', price: 328, stars: 3, lat: 31.233, lng: 121.475 },
  { id: 'h002', name: '汉庭优佳酒店(陆家嘴店)', address: '上海市浦东新区陆家嘴环路500号', price: 388, stars: 3, lat: 31.240, lng: 121.495 },
  { id: 'h003', name: '全季酒店(静安寺店)', address: '上海市静安区南京西路800号', price: 458, stars: 4, lat: 31.225, lng: 121.450 },
  { id: 'h004', name: '桔子水晶酒店(徐家汇店)', address: '上海市徐汇区漕溪北路200号', price: 498, stars: 4, lat: 31.190, lng: 121.435 },
  { id: 'h005', name: '亚朵酒店(虹桥店)', address: '上海市长宁区虹桥路1500号', price: 528, stars: 4, lat: 31.195, lng: 121.400 },
  { id: 'h006', name: '希尔顿欢朋酒店(浦东店)', address: '上海市浦东新区世纪大道1000号', price: 688, stars: 5, lat: 31.235, lng: 121.510 },
];

const HOTEL_PROGRESS_STEPS = [
  { title: '查询房态', icon: Eye },
  { title: '锁定房源', icon: ShieldAlert },
  { title: '生成订单', icon: FileText },
  { title: '租客确认', icon: Users },
  { title: '办理入住', icon: CheckCircle2 },
  { title: '完成结算', icon: DollarSign },
];

const AGREEMENT_SUMMARY = `
根据《房屋租赁服务协议》第12条不可抗力条款约定，经双方友好协商，就原租住房屋因不可抗力因素导致无法正常居住的情况，达成以下临时安置协议：

1. 安置原因：因【不可抗力类型】导致原租住房屋无法正常居住；
2. 安置方式：平台提供合作酒店临时住宿，标准间/大床房；
3. 费用承担：本次安置费用由【费用承担方】承担；
4. 安置期限：自入住之日起预计【天数】晚，如需延长需另行申请；
5. 权利义务：双方应配合办理入住/退房手续，保持酒店设施完好；
6. 其他约定：本协议为临时补充协议，与原租赁合同具有同等法律效力。
`;

const PLACEMENT_TIMELINE_STEPS = [
  { title: '触发应急', icon: Bell },
  { title: '协议签署', icon: FileSignature },
  { title: '酒店对接', icon: Building2 },
  { title: '办理入住', icon: CheckCircle2 },
  { title: '完成结算', icon: DollarSign },
];

interface HotelStepRecord {
  step: number;
  time: string;
  operator: string;
}

export default function EmergencyCenter() {
  const { emergencyPlacements, workOrders } = useAppStore();

  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [emergencyType, setEmergencyType] = useState<string>('fire');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [proofTypes, setProofTypes] = useState<CheckboxProps['value']>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);

  const [agreementTemplate, setAgreementTemplate] = useState<string>('standard_v2_3');
  const [agreementExpanded, setAgreementExpanded] = useState(false);
  const [signStatus, setSignStatus] = useState<'pending' | 'signed'>('pending');

  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>(undefined);
  const [roomType, setRoomType] = useState<string>('标准间');
  const [roomCount, setRoomCount] = useState<number>(1);
  const [stayRange, setStayRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    dayjs(),
    dayjs().add(3, 'day'),
  ]);
  const [hotelProgress, setHotelProgress] = useState<number>(0);
  const [stepRecords, setStepRecords] = useState<HotelStepRecord[]>([
    { step: 0, time: dayjs().format('MM-DD HH:mm'), operator: '系统自动' },
  ]);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<EmergencyPlacement | null>(null);

  const emergencyWorkOrders = useMemo(() => {
    return workOrders.filter(
      (w) => w.type === 'repair' && (w.urgency === 'urgent' || w.needEmergencyPlacement)
    );
  }, [workOrders]);

  const selectedOrder = useMemo(
    () => (selectedOrderId ? workOrders.find((w) => w.id === selectedOrderId) : null),
    [workOrders, selectedOrderId]
  );

  const activePlacements = useMemo(() => {
    return emergencyPlacements.filter(
      (p) => !['settled', 'returned', 'cancelled'].includes(p.status)
    );
  }, [emergencyPlacements]);

  const historyPlacements = useMemo(() => {
    return emergencyPlacements.slice(0, 10);
  }, [emergencyPlacements]);

  const monthlyPlacements = useMemo(() => {
    return emergencyPlacements.filter((p) =>
      dayjs(p.createTime).isSame(dayjs(), 'month')
    ).length;
  }, [emergencyPlacements]);

  const totalCost = useMemo(() => {
    return emergencyPlacements.reduce(
      (sum, p) => sum + (p.actualCost || p.estimatedCost || 0),
      0
    );
  }, [emergencyPlacements]);

  const avgSatisfaction = useMemo(() => {
    const rates = [4.8, 4.6, 4.9, 4.7, 4.5, 4.8];
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }, []);

  const estimatedHotelCost = useMemo(() => {
    if (!selectedHotelId) return 0;
    const hotel = COOPERATE_HOTELS.find((h) => h.id === selectedHotelId);
    if (!hotel) return 0;
    let days = 3;
    if (stayRange && stayRange[0] && stayRange[1]) {
      days = Math.max(1, stayRange[1].diff(stayRange[0], 'day'));
    }
    return hotel.price * roomCount * days;
  }, [selectedHotelId, stayRange, roomCount]);

  const sortedHotels = useMemo(() => {
    const baseLat = selectedOrder?.latitude || 31.2304;
    const baseLng = selectedOrder?.longitude || 121.4737;
    return [...COOPERATE_HOTELS]
      .map((h) => ({
        ...h,
        distance: haversineDistance(baseLat, baseLng, h.lat, h.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [selectedOrder]);

  const handleTriggerEmergency = () => {
    if (!selectedOrderId) {
      message.warning('请选择关联工单');
      return;
    }
    if (proofTypes.length === 0) {
      message.warning('请至少选择一项判定依据');
      return;
    }
    setConfirmModalOpen(true);
  };

  const confirmTriggerEmergency = () => {
    setConfirmModalOpen(false);
    setTriggerSuccess(true);
    setHotelProgress(1);
    setStepRecords([
      ...stepRecords,
      { step: 1, time: dayjs().format('MM-DD HH:mm'), operator: '应急专员' },
    ]);
    message.success('不可抗力判定已触发，合同履约已冻结，安置流程已启动');
    Modal.success({
      title: '应急流程已启动',
      content: (
        <div>
          <div>✅ 冻结合同履约进度</div>
          <div>✅ 启动安置方案匹配</div>
          <div>✅ 通知区域应急小组</div>
          <div className="mt-2 text-warning-600">
            ⚠️ 请尽快确认安置酒店并发送协议
          </div>
        </div>
      ),
    });
  };

  const handleSendAgreement = () => {
    setSignStatus('pending');
    message.success('协议已发送给租客，等待签署');
    setTimeout(() => {
      setSignStatus('signed');
      message.success('租客已完成协议签署');
    }, 3000);
  };

  const advanceHotelProgress = () => {
    if (hotelProgress >= 6) return;
    if (!selectedHotelId) {
      message.warning('请先选择合作酒店');
      return;
    }
    const nextStep = hotelProgress + 1;
    setHotelProgress(nextStep);
    setStepRecords([
      ...stepRecords,
      {
        step: nextStep,
        time: dayjs().format('MM-DD HH:mm'),
        operator: nextStep === 3 ? '租客' : nextStep === 4 ? '酒店前台' : '应急专员',
      },
    ]);
    message.success(HOTEL_PROGRESS_STEPS[nextStep - 1].title + ' 已完成');
  };

  const getPlacementProgress = (p: EmergencyPlacement): number => {
    const statusOrder: Record<string, number> = {
      pending: 1,
      arranging: 2,
      placed: 4,
      extended: 4,
      returned: 5,
      settled: 5,
      cancelled: 0,
    };
    return statusOrder[p.status] || 0;
  };

  const getEmergencyTypeConfig = (reason: string) => {
    const match = EMERGENCY_TYPES.find((t) => reason.includes(t.label));
    return match || EMERGENCY_TYPES[0];
  };

  const historyTableColumns: TableProps<EmergencyPlacement>['columns'] = [
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      key: 'workOrderNo',
      width: 140,
      render: (v) => (
        <Button type="link" size="small" className="!p-0 text-brand-600 font-medium">
          {v}
        </Button>
      ),
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (_, record) => {
        const cfg = getEmergencyTypeConfig(record.reason);
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs text-ink-700">{cfg.label}</span>
          </div>
        );
      },
    },
    {
      title: '房源地址',
      dataIndex: 'originalPropertyAddress',
      key: 'originalPropertyAddress',
      ellipsis: true,
      width: 200,
    },
    {
      title: '安置酒店',
      dataIndex: 'hotelName',
      key: 'hotelName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '入住天数',
      key: 'stayDays',
      width: 90,
      render: (_, record) => (
        <span className="text-sm font-mono text-ink-700">
          {record.stayDays + record.extendCount * 2}晚
        </span>
      ),
    },
    {
      title: '费用',
      key: 'cost',
      width: 110,
      render: (_, record) => (
        <span className="text-sm font-mono text-ink-700">
          {formatMoney(record.actualCost || record.estimatedCost)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => <StatusBadge status={s} type="workorder" />,
    },
    {
      title: '处理人',
      key: 'operator',
      width: 90,
      render: () => (
        <div className="flex items-center gap-1.5">
          <Avatar size={20} className="!bg-brand-100 !text-brand-600 !text-[10px]">
            应
          </Avatar>
          <span className="text-xs text-ink-600">应急专员</span>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-6 p-6 bg-ink-50 min-h-screen">
      {/* 标题栏 */}
      <div className="card-standard flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-50 text-danger-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-800 font-serif">应急安置中心</h1>
            <p className="text-xs text-ink-500 mt-0.5">
              不可抗力判定 · 协议自动调用 · 酒店对接
            </p>
          </div>
        </div>
        <Space>
          {activePlacements.length > 0 && (
            <Badge count={activePlacements.length} size="small" offset={[-4, 2]}>
              <Button icon={<Bell className="h-3.5 w-3.5" />} type="primary" ghost>
                进行中 {activePlacements.length}
              </Button>
            </Badge>
          )}
        </Space>
      </div>

      {/* 左右布局 6:6 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 左栏：应急处置工作台 */}
        <div className="col-span-6 flex flex-col gap-5">
          {/* 应急触发面板 */}
          <div
            className={cn(
              'rounded-xl border-2 bg-white p-5 shadow-card',
              triggerSuccess ? 'border-success-300' : 'border-warning-400'
            )}
            style={triggerSuccess ? undefined : { boxShadow: `0 0 0 3px ${COLORS.orange}12` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${COLORS.orange}15`, color: COLORS.orange }}
                >
                  <Siren className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-800">应急触发面板</h3>
                  <p className="text-xs text-ink-500 mt-0.5">判定不可抗力并启动安置流程</p>
                </div>
              </div>
              {triggerSuccess && (
                <Tag color="success" icon={<CheckCircle2 className="h-3 w-3" />}>
                  已触发
                </Tag>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  关联工单 <span className="text-danger-500">*</span>
                </label>
                <Select
                  placeholder="选择应急工单(仅显示type=emergency的工单)"
                  style={{ width: '100%' }}
                  value={selectedOrderId}
                  onChange={setSelectedOrderId}
                  showSearch
                  optionFilterProp="label"
                >
                  {emergencyWorkOrders.length === 0 ? (
                    <Option value="" disabled>
                      暂无应急工单
                    </Option>
                  ) : (
                    emergencyWorkOrders.map((wo) => (
                      <Option key={wo.id} value={wo.id} label={`${wo.orderNo} ${wo.title}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="font-medium text-ink-800">{wo.orderNo}</span>
                            <span className="ml-2 text-xs text-ink-500 truncate">
                              {wo.title}
                            </span>
                          </div>
                          <Tag
                            color={wo.urgency === 'urgent' ? 'red' : 'orange'}
                            className="!text-[10px] shrink-0"
                          >
                            {wo.urgency === 'urgent' ? '紧急' : '高'}
                          </Tag>
                        </div>
                      </Option>
                    ))
                  )}
                </Select>
                {selectedOrder && (
                  <div className="mt-2 p-2.5 bg-ink-50 rounded-lg text-xs space-y-1">
                    <div className="flex items-start gap-1.5 text-ink-600">
                      <MapPin className="h-3 w-3 mt-0.5 text-ink-400 shrink-0" />
                      <span>{selectedOrder.propertyAddress}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-ink-600">
                      <Users className="h-3 w-3 text-ink-400 shrink-0" />
                      <span>
                        {selectedOrder.submitterName} ({maskPhone(selectedOrder.submitterPhone)})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  不可抗力类型 <span className="text-danger-500">*</span>
                </label>
                <Radio.Group
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {EMERGENCY_TYPES.map((t) => {
                      const Icon = t.icon;
                      const checked = emergencyType === t.value;
                      return (
                        <Radio.Button
                          key={t.value}
                          value={t.value}
                          className={cn(
                            '!h-auto !px-3 !py-2.5 !rounded-lg flex flex-col items-center gap-1 !border !border-ink-200',
                            checked && '!border-transparent'
                          )}
                          style={checked ? { backgroundColor: `${t.color}12` } : undefined}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: checked ? t.color : COLORS.ink }}
                          />
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: checked ? t.color : COLORS.ink }}
                          >
                            {t.label}
                          </span>
                        </Radio.Button>
                      );
                    })}
                  </div>
                </Radio.Group>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  事件描述
                </label>
                <TextArea
                  rows={3}
                  placeholder="请详细描述事件经过、影响范围、已采取措施等..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  maxLength={500}
                  showCount
                  className="!text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  判定依据 <span className="text-danger-500">*</span>
                  <span className="text-ink-400 ml-1">(可多选)</span>
                </label>
                <Checkbox.Group
                  value={proofTypes}
                  onChange={setProofTypes}
                  className="grid grid-cols-2 gap-3"
                >
                  {PROOF_TYPES.map((p) => (
                    <Checkbox
                      key={p.value}
                      value={p.value}
                      className="!text-xs !mb-0 [&_.ant-checkbox]:!mt-0.5"
                    >
                      {p.label}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>

              <Button
                type="primary"
                size="large"
                danger
                block
                icon={<Siren className="h-4 w-4" />}
                onClick={handleTriggerEmergency}
                disabled={triggerSuccess}
              >
                {triggerSuccess ? '不可抗力判定已触发' : '一键触发不可抗力判定'}
              </Button>

              {triggerSuccess && (
                <Alert
                  type="success"
                  showIcon
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  message="不可抗力判定成功"
                  description={
                    <div className="text-xs space-y-0.5">
                      <div>✓ 合同履约进度已冻结</div>
                      <div>✓ 应急安置流程已启动</div>
                      <div>✓ 区域应急小组已通知</div>
                    </div>
                  }
                />
              )}
            </div>
          </div>

          {/* 协议调用 */}
          <div className="card-standard">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                <FileSignature className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink-800">协议调用</h3>
                <p className="text-xs text-ink-500 mt-0.5">自动匹配安置协议模板并发送</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  协议模板
                </label>
                <Select
                  style={{ width: '100%' }}
                  value={agreementTemplate}
                  onChange={setAgreementTemplate}
                >
                  {AGREEMENT_TEMPLATES.map((t) => (
                    <Option key={t.value} value={t.value}>
                      {t.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <Collapse
                ghost
                activeKey={agreementExpanded ? 'preview' : []}
                onChange={(keys) => setAgreementExpanded(keys.length > 0)}
                className="border border-ink-100 rounded-lg !bg-ink-50/50"
              >
                <Collapse.Panel
                  header={
                    <div className="flex items-center gap-2 text-xs font-medium text-ink-600 py-1">
                      <FileText className="h-3.5 w-3.5" />
                      {agreementExpanded ? '收起协议预览' : '展开协议预览'}
                    </div>
                  }
                  key="preview"
                >
                  <div className="text-xs text-ink-600 leading-relaxed whitespace-pre-line bg-white rounded-lg p-4 border border-ink-100 max-h-52 overflow-y-auto">
                    <div className="text-sm font-semibold text-ink-800 text-center mb-3 pb-2 border-b border-ink-100">
                      {AGREEMENT_TEMPLATES.find((t) => t.value === agreementTemplate)?.label}
                    </div>
                    {AGREEMENT_SUMMARY.split('\n').map((line, i) =>
                      line.trim() ? (
                        <p
                          key={i}
                          className={cn(
                            line.includes('【') &&
                              'bg-gold-50 text-gold-800 px-1 rounded inline-block'
                          )}
                        >
                          {line}
                        </p>
                      ) : (
                        <div key={i} className="h-2" />
                      )
                    )}
                    <div className="mt-4 pt-3 border-t border-ink-100 flex justify-end gap-6 text-ink-500">
                      <span>甲方(平台)：上海优居科技</span>
                      <span>乙方(租客)：{selectedOrder?.submitterName || '____________'}</span>
                    </div>
                  </div>
                </Collapse.Panel>
              </Collapse>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-600">租客签约状态：</span>
                  {signStatus === 'signed' ? (
                    <Tag color="success" icon={<CheckCircle2 className="h-3 w-3" />}>
                      已签署
                    </Tag>
                  ) : (
                    <Tag color="warning" icon={<Clock className="h-3 w-3" />}>
                      待签署
                    </Tag>
                  )}
                </div>
                <Button
                  type="primary"
                  icon={<Send className="h-3.5 w-3.5" />}
                  disabled={!triggerSuccess || signStatus === 'signed'}
                  size="small"
                  onClick={handleSendAgreement}
                >
                  发送协议给租客
                </Button>
              </div>
            </div>
          </div>

          {/* 酒店对接进度 */}
          <div className="card-standard">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-500">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink-800">酒店对接进度</h3>
                <p className="text-xs text-ink-500 mt-0.5">匹配合作酒店并跟踪全流程</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  合作酒店
                  <span className="text-brand-500 ml-1">(按工单位置距离排序)</span>
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="请选择安置酒店"
                  value={selectedHotelId}
                  onChange={setSelectedHotelId}
                  showSearch
                  optionFilterProp="label"
                >
                  {sortedHotels.map((h) => (
                    <Option
                      key={h.id}
                      value={h.id}
                      label={`${h.name} ${h.distance.toFixed(1)}km`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-ink-800">{h.name}</span>
                            <Tag color="gold" className="!text-[10px]">
                              {'★'.repeat(h.stars)}
                            </Tag>
                          </div>
                          <div className="text-[11px] text-ink-500 truncate mt-0.5">
                            {h.address}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold text-danger-500">
                            ¥{h.price}
                            <span className="text-[10px] text-ink-400 font-normal">/晚</span>
                          </div>
                          <div className="text-[10px] text-brand-500">
                            📍{h.distance.toFixed(1)}km
                          </div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">
                    房型
                  </label>
                  <Select
                    style={{ width: '100%' }}
                    value={roomType}
                    onChange={setRoomType}
                    size="small"
                  >
                    <Option value="标准间">标准间</Option>
                    <Option value="大床房">大床房</Option>
                    <Option value="双床房">双床房</Option>
                    <Option value="家庭房">家庭房</Option>
                    <Option value="豪华套房">豪华套房</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">
                    房间数
                  </label>
                  <InputNumber
                    min={1}
                    max={10}
                    value={roomCount}
                    onChange={(v) => setRoomCount(Number(v) || 1)}
                    className="!w-full"
                    size="small"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  入住日期
                </label>
                <RangePicker
                  style={{ width: '100%' }}
                  size="small"
                  value={stayRange as any}
                  onChange={(v) => setStayRange(v as any)}
                />
              </div>

              <div className="p-3 bg-gradient-to-r from-gold-50/80 to-warning-50/50 rounded-lg border border-gold-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-ink-500 mb-0.5">预计费用自动计算</div>
                  <div className="text-lg font-bold font-mono text-danger-600">
                    {formatMoney(estimatedHotelCost)}
                  </div>
                  <div className="text-[10px] text-ink-400 mt-0.5">
                    {COOPERATE_HOTELS.find((h) => h.id === selectedHotelId)?.price || 0}元/晚 × {roomCount}间 × {stayRange && stayRange[0] && stayRange[1] ? stayRange[1].diff(stayRange[0], 'day') : 3}晚
                  </div>
                </div>
                <ProgressRing
                  progress={Math.round((hotelProgress / 6) * 100)}
                  size={64}
                  color={COLORS.gold}
                  label="进度"
                />
              </div>

              <div>
                <Steps
                  size="small"
                  current={hotelProgress}
                  direction="horizontal"
                  className="!text-xs"
                  items={HOTEL_PROGRESS_STEPS.map((s) => {
                    const IconComp = s.icon;
                    return {
                      title: (
                        <span className="text-[11px]">{s.title}</span>
                      ),
                      icon: (
                        <div className="flex items-center justify-center w-full h-full">
                          <IconComp className="h-3 w-3" />
                        </div>
                      ),
                    };
                  })}
                />
                <div className="mt-3 space-y-1 max-h-28 overflow-y-auto pr-1">
                  {stepRecords
                    .slice()
                    .reverse()
                    .map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] py-1 px-2 bg-ink-50 rounded"
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-success-500" />
                          <span className="text-ink-700">
                            {HOTEL_PROGRESS_STEPS[r.step]?.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-ink-400">
                          <span>{r.operator}</span>
                          <span className="font-mono">{r.time}</span>
                        </div>
                      </div>
                    ))}
                </div>
                {hotelProgress < 6 && (
                  <Button
                    type="primary"
                    block
                    size="small"
                    className="mt-3"
                    icon={<ChevronRight className="h-3.5 w-3.5" />}
                    onClick={advanceHotelProgress}
                  >
                    推进到下一步：{HOTEL_PROGRESS_STEPS[hotelProgress]?.title}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右栏：进行中安置与历史记录 */}
        <div className="col-span-6 flex flex-col gap-5">
          {/* 当前进行中 */}
          <div className="card-standard flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-500">
                  <Activity className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-800">当前进行中</h3>
                  <p className="text-xs text-ink-500 mt-0.5">进行中的应急安置订单</p>
                </div>
              </div>
              <Badge
                count={activePlacements.length}
                className="[&_.ant-badge-count]:!bg-warning-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: 520 }}>
              {activePlacements.length === 0 ? (
                <Empty description="暂无进行中的安置" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                activePlacements.map((p) => {
                  const cfg = getEmergencyTypeConfig(p.reason);
                  const TypeIcon = cfg.icon;
                  const progress = getPlacementProgress(p);
                  return (
                    <Card
                      key={p.id}
                      size="small"
                      className={cn(
                        'border-ink-100 hover:border-brand-200 transition-all cursor-pointer',
                        p.status === 'placed' && '!border-success-200'
                      )}
                      onClick={() => {
                        setSelectedPlacement(p);
                        setDetailDrawerOpen(true);
                      }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                            >
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                                {p.workOrderNo}
                                <StatusBadge status={p.status} type="workorder" />
                              </div>
                              <div className="text-[11px] text-ink-400 mt-0.5 truncate">
                                {p.reason}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-start gap-1.5">
                            <Building className="h-3 w-3 text-brand-500 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-ink-700 font-medium truncate">
                                {p.hotelName}
                              </div>
                              <div className="text-ink-400 text-[10px] truncate">
                                {p.hotelAddress}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Users className="h-3 w-3 text-brand-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-ink-700 font-medium">
                                {p.roomType} · {p.personCount}人
                              </div>
                              <div className="text-ink-400 text-[10px]">
                                {p.hotelStars}星酒店 · 住{p.stayDays + p.extendCount * 2}晚
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <CalendarDays className="h-3 w-3 text-brand-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-ink-700 font-mono text-[11px]">
                                {dayjs(p.checkInTime).format('MM-DD HH:mm')}
                              </div>
                              <div className="text-ink-400 text-[10px]">
                                ~ {dayjs(p.expectedCheckOutTime).format('MM-DD')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <DollarSign className="h-3 w-3 text-gold-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-danger-600 font-mono font-bold text-sm">
                                {formatMoney(p.estimatedCost)}
                              </div>
                              <div className="text-ink-400 text-[10px]">
                                承担：{p.costPayer === 'landlord' ? '房东' : p.costPayer === 'platform' ? '平台' : p.costPayer === 'insurance' ? '保险' : '共担'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1">
                          <Steps
                            size="small"
                            current={progress}
                            direction="horizontal"
                            className="[&_.ant-steps-item-title]:!text-[10px] [&_.ant-steps-icon]:!w-5 [&_.ant-steps-icon]:!h-5 [&_.ant-steps-icon]:!text-[10px] [&_.ant-steps-item-process_.ant-steps-item-icon]:!bg-brand-500"
                            items={PLACEMENT_TIMELINE_STEPS.map((s) => {
                              const IconComp = s.icon;
                              return {
                                title: <span className="text-[10px]">{s.title}</span>,
                                icon: (
                                  <div className="flex items-center justify-center w-full h-full">
                                    <IconComp className="h-2.5 w-2.5" />
                                  </div>
                                ),
                              };
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="text-[10px] text-ink-400">预计</div>
                              <div className="text-xs font-mono text-ink-600">
                                {formatMoney(p.estimatedCost)}
                              </div>
                            </div>
                            {p.actualCost && (
                              <div>
                                <div className="text-[10px] text-ink-400">实际</div>
                                <div className="text-xs font-mono text-danger-600 font-medium">
                                  {formatMoney(p.actualCost)}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            type="link"
                            size="small"
                            className="!text-brand-600 !text-xs"
                            icon={<Eye className="h-3 w-3" />}
                          >
                            查看明细
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* 历史安置记录 */}
          <div className="card-standard flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-800">历史安置记录</h3>
                </div>
              </div>
              <Button type="link" size="small" className="!text-brand-600">
                查看全部
              </Button>
            </div>

            <div className="flex-1 -mx-2 overflow-x-auto">
              <Table<EmergencyPlacement>
                rowKey="id"
                columns={historyTableColumns}
                dataSource={historyPlacements}
                size="small"
                pagination={false}
                scroll={{ x: 900 }}
                rowClassName="hover:bg-brand-50/30 transition-colors cursor-pointer"
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedPlacement(record);
                    setDetailDrawerOpen(true);
                  },
                })}
              />
            </div>
          </div>

          {/* 数据统计 */}
          <div className="grid grid-cols-3 gap-4">
            <DataCard
              title="本月安置次数"
              value={monthlyPlacements}
              unit="次"
              prefix={<Truck className="h-4 w-4" />}
              trend={18.5}
              comparedTo="month"
              accentColor={COLORS.brand}
              sparkline={Array.from({ length: 12 }, () => Math.floor(Math.random() * 8 + 2))}
            />
            <DataCard
              title="累计费用"
              value={(totalCost / 10000).toFixed(1)}
              unit="万元"
              prefix={<DollarSign className="h-4 w-4" />}
              trend={12.3}
              comparedTo="month"
              accentColor={COLORS.gold}
              sparkline={Array.from({ length: 12 }, () => Math.floor(Math.random() * 50 + 30))}
            />
            <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-card group hover:-translate-y-1 hover:shadow-cardHover transition-all duration-300">
              <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl" style={{ backgroundColor: COLORS.success }} />
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center">
                  <div
                    className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${COLORS.success}12`, color: COLORS.success }}
                  >
                    <Star className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-medium text-ink-600">租客满意度</h3>
                </div>
              </div>
              <div className="mb-4 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-ink-800 tabular-nums">
                  {avgSatisfaction.toFixed(1)}
                </span>
                <Rate
                  disabled
                  allowHalf
                  value={avgSatisfaction}
                  className="!text-[16px] [&_.ant-rate-star]:!margin-inline-end-0.5"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <CheckCircle2 className="h-3 w-3 text-success-500" />
                <span>98.6% 推荐率</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 确认Modal */}
      <Modal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-50 text-danger-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">确认触发不可抗力判定</span>
          </div>
        }
        onOk={confirmTriggerEmergency}
        okText="确认触发"
        okButtonProps={{ danger: true, size: 'large' }}
        cancelText="取消"
        cancelButtonProps={{ size: 'large' }}
        width={540}
      >
        <div className="space-y-4">
          <Alert
            type="warning"
            showIcon
            icon={<AlertTriangle className="h-4 w-4" />}
            message="此操作不可撤销，请谨慎确认"
            description={
              <div className="text-xs space-y-1 mt-1">
                <div>• 将冻结关联租赁合同的履约进度</div>
                <div>• 将自动启动应急安置全流程</div>
                <div>• 将通知区域应急小组和上级主管</div>
                <div>• 将生成不可撤销的审计日志记录</div>
              </div>
            }
          />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-ink-50 rounded-lg space-y-1">
              <div className="text-ink-400">关联工单</div>
              <div className="text-ink-800 font-medium">
                {workOrders.find((w) => w.id === selectedOrderId)?.orderNo || '-'}
              </div>
            </div>
            <div className="p-3 bg-ink-50 rounded-lg space-y-1">
              <div className="text-ink-400">不可抗力类型</div>
              <div className="text-ink-800 font-medium">
                {EMERGENCY_TYPES.find((t) => t.value === emergencyType)?.label}
              </div>
            </div>
            <div className="p-3 bg-ink-50 rounded-lg space-y-1">
              <div className="text-ink-400">判定依据</div>
              <div className="text-ink-800 font-medium">
                {proofTypes
                  .map((v) => PROOF_TYPES.find((p) => p.value === v)?.label)
                  .join('、')}
              </div>
            </div>
            <div className="p-3 bg-ink-50 rounded-lg space-y-1">
              <div className="text-ink-400">申请人</div>
              <div className="text-ink-800 font-medium">
                {workOrders.find((w) => w.id === selectedOrderId)?.submitterName || '-'}
              </div>
            </div>
          </div>
          {eventDescription && (
            <div className="p-3 bg-ink-50 rounded-lg">
              <div className="text-ink-400 text-xs mb-1">事件描述</div>
              <div className="text-xs text-ink-700 leading-relaxed">{eventDescription}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* 详情Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base font-semibold text-ink-800">
                安置详情：{selectedPlacement?.placementNo}
              </div>
              <div className="text-xs text-ink-500 mt-0.5">{selectedPlacement?.reason}</div>
            </div>
          </div>
        }
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={520}
        extra={
          selectedPlacement && (
            <StatusBadge status={selectedPlacement.status} type="workorder" />
          )
        }
      >
        {selectedPlacement && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-ink-400 mb-1">原房源地址</div>
                <div className="text-sm text-ink-800 font-medium">
                  {selectedPlacement.originalPropertyAddress}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-ink-400 mb-1">安置酒店</div>
                <div className="text-sm text-ink-800 font-medium">
                  {selectedPlacement.hotelName}
                </div>
                <div className="text-xs text-ink-500">{selectedPlacement.hotelAddress}</div>
              </div>
              <div>
                <div className="text-[11px] text-ink-400 mb-1">申请人</div>
                <div className="text-sm text-ink-800 font-medium">
                  {selectedPlacement.applicantName}
                </div>
                <div className="text-xs text-ink-500">
                  {maskPhone(selectedPlacement.applicantPhone)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-ink-400 mb-1">房间信息</div>
                <div className="text-sm text-ink-800 font-medium">
                  {selectedPlacement.roomType} · {selectedPlacement.personCount}人
                </div>
                <div className="text-xs text-ink-500">
                  {'★'.repeat(selectedPlacement.hotelStars)}级酒店
                </div>
              </div>
              <div>
                <div className="text-[11px] text-ink-400 mb-1">入住时间</div>
                <div className="text-sm font-mono text-ink-800">
                  {dayjs(selectedPlacement.checkInTime).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-ink-400 mb-1">退房时间</div>
                <div className="text-sm font-mono text-ink-800">
                  {(selectedPlacement.actualCheckOutTime || selectedPlacement.expectedCheckOutTime) &&
                    dayjs(
                      selectedPlacement.actualCheckOutTime ||
                        selectedPlacement.expectedCheckOutTime
                    ).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-gradient-to-r from-gold-50 to-warning-50 rounded-lg">
              <Statistic
                title={<span className="text-[11px] text-ink-500">入住天数</span>}
                value={selectedPlacement.stayDays + selectedPlacement.extendCount * 2}
                suffix="晚"
                className="!text-sm"
              />
              <Statistic
                title={<span className="text-[11px] text-ink-500">续住次数</span>}
                value={selectedPlacement.extendCount}
                suffix="次"
                className="!text-sm"
              />
              <Statistic
                title={<span className="text-[11px] text-ink-500">实际费用</span>}
                value={(selectedPlacement.actualCost || selectedPlacement.estimatedCost) / 1000}
                precision={1}
                suffix="K"
                className="!text-sm !text-danger-600"
              />
            </div>

            <Divider className="!my-0" />

            <div>
              <h4 className="text-sm font-semibold text-ink-700 mb-3">安置时间轴</h4>
              <Timeline
                items={selectedPlacement.timeline.map((t) => ({
                  time: dayjs(t.time).format('MM-DD HH:mm'),
                  title: t.title,
                  description: t.description
                    ? `${t.description}${t.operatorName ? ` · ${t.operatorName}` : ''}${
                        t.costChange ? ` · 费用变更 ${formatMoney(t.costChange)}` : ''
                      }`
                    : undefined,
                  status:
                    t.type === 'settle' || t.type === 'checkout'
                      ? 'success'
                      : t.type === 'apply' || t.type === 'approve' || t.type === 'arrange' ||
                        t.type === 'checkin' || t.type === 'extend'
                      ? 'processing'
                      : 'warning',
                }))}
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink-700 mb-3">费用明细</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-ink-100">
                  <span className="text-ink-500">房费（基础）</span>
                  <span className="font-mono text-ink-700">
                    {formatMoney(selectedPlacement.estimatedCost)}
                  </span>
                </div>
                {selectedPlacement.extendCount > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-ink-100">
                    <span className="text-ink-500">续住费用（{selectedPlacement.extendCount}次）</span>
                    <span className="font-mono text-warning-600">
                      +{formatMoney(selectedPlacement.extendCount * 600)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-ink-100">
                  <span className="text-ink-500">其他杂费</span>
                  <span className="font-mono text-ink-700">
                    {formatMoney(Math.floor(Math.random() * 200 + 50))}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-ink-700 font-semibold">合计（实际）</span>
                  <span className="font-mono text-danger-600 font-bold text-base">
                    {formatMoney(selectedPlacement.actualCost || selectedPlacement.estimatedCost)}
                  </span>
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-ink-400">
                    费用承担方：
                    <Tag color="blue" className="!text-[10px]">
                      {selectedPlacement.costPayer === 'landlord'
                        ? '房东'
                        : selectedPlacement.costPayer === 'platform'
                        ? '平台'
                        : selectedPlacement.costPayer === 'insurance'
                        ? '保险理赔'
                        : '各方共担'}
                    </Tag>
                  </span>
                  {selectedPlacement.insuranceClaimNo && (
                    <span className="text-ink-400">
                      理赔单号：
                      <span className="font-mono text-ink-600">
                        {selectedPlacement.insuranceClaimNo}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button block icon={<Eye className="h-3.5 w-3.5" />}>
                查看入住凭证
              </Button>
              <Button block type="primary" icon={<FileSignature className="h-3.5 w-3.5" />}>
                结算费用
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
