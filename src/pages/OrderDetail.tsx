import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Avatar,
  Progress,
  Button,
  Tag,
  message,
  Empty,
} from 'antd';
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Stethoscope,
  Baby,
  HeartHandshake,
  Activity,
  Feather,
  Send,
  FileText,
  AlertCircle,
  Clock,
  Star,
  Navigation,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockOrders, mockNurses } from '@/mock';
import PageHeader from '@/components/PageHeader';
import PatientTypeTag from '@/components/PatientTypeTag';
import StatusBadge from '@/components/StatusBadge';
import Timeline, { type TimelineItem } from '@/components/Timeline';
import type { ServiceOrder, OrderStatus, Nurse } from '@/types';
import dayjs from 'dayjs';

const patientIconMap: Record<string, React.ReactNode> = {
  elderly: <HeartHandshake className="h-4 w-4" />,
  maternal: <Baby className="h-4 w-4" />,
  'post-hospital': <Activity className="h-4 w-4" />,
  hospice: <Feather className="h-4 w-4" />,
};

const scheduleStatusMap: Record<string, { label: string; color: string }> = {
  available: { label: '档期空闲', color: 'text-emerald-600 bg-emerald-50' },
  busy: { label: '当日有单', color: 'text-amber-600 bg-amber-50' },
  full: { label: '档期已满', color: 'text-slate-600 bg-slate-100' },
};

const statusTimelineOrder: OrderStatus[] = [
  'created',
  'risk-assessed',
  'dispatched',
  'nurse-accepted',
  'in-service',
  'completed',
];

const timelineNodeInfo: Record<OrderStatus, { title: string; icon?: React.ReactNode }> = {
  created: { title: '订单创建' },
  'risk-assessed': { title: '风险评估' },
  dispatched: { title: '智能派单' },
  'nurse-accepted': { title: '护士接单' },
  'in-service': { title: '护士签到' },
  completed: { title: '服务完成' },
  cancelled: { title: '订单取消' },
};

const riskPointSuggestions: Record<string, string[]> = {
  low: ['患者状态稳定，常规护理即可', '建议每季度复评一次风险等级'],
  medium: ['需关注跌倒风险，床边加设防护', '用药期间注意观察不良反应', '建议家属陪同照护'],
  high: ['需安排资深护士上门服务', '服务全程开启录像留存证据', '建议增加生命体征监测频次', '出发前与家属电话沟通确认'],
  critical: ['必须指派经验丰富的主管护士', '建议家属全程在场陪同', '服务前做好应急预案准备', '全程双录像+GPS实时追踪', '服务后2小时内电话随访'],
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    orders,
    setOrders,
    nurses,
    setNurses,
    getOrderById,
    getNurseById,
    updateOrder,
  } = useGlobalStore();

  useEffect(() => {
    if (orders.length === 0) {
      setOrders(mockOrders);
    }
    if (nurses.length === 0) {
      setNurses(mockNurses);
    }
  }, [orders.length, nurses.length, setOrders, setNurses]);

  const order = useMemo(() => {
    if (!id) return undefined;
    return getOrderById(id) || mockOrders.find((o) => o.id === id);
  }, [id, getOrderById]);

  const assignedNurse = useMemo(() => {
    if (!order?.nurseId) return undefined;
    return getNurseById(order.nurseId) || mockNurses.find((n) => n.id === order.nurseId);
  }, [order, getNurseById]);

  const recommendedNurses = useMemo(() => {
    if (!order) return [] as (Nurse & { matchScore: number; distance: number; scheduleStatus: string })[];
    const available = mockNurses
      .filter((n) => n.verifyStatus === 'verified')
      .slice(0, 4)
      .map((n, idx) => ({
        ...n,
        matchScore: 95 - idx * 5 - Math.floor(Math.random() * 8),
        distance: Number((0.8 + idx * 1.2 + Math.random() * 2).toFixed(1)),
        scheduleStatus: ['available', 'available', 'busy', 'full'][idx] || 'available',
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
    return available;
  }, [order]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!order) return [];
    const currentIndex = statusTimelineOrder.indexOf(order.status);
    return statusTimelineOrder.map((status, idx) => {
      const isCancelled = order.status === 'cancelled';
      let statusType: TimelineItem['status'];
      if (isCancelled) {
        statusType = idx <= currentIndex ? 'completed' : 'pending';
      } else if (idx < currentIndex || order.status === 'completed') {
        statusType = 'completed';
      } else if (idx === currentIndex) {
        statusType = 'current';
      } else {
        statusType = 'pending';
      }
      const info = timelineNodeInfo[status];
      return {
        id: status,
        title: info.title,
        status: isCancelled && idx === currentIndex ? 'error' : statusType,
        time: idx <= currentIndex ? dayjs(order.createdAt).add(idx * 2, 'hour').format('HH:mm') : undefined,
      };
    });
  }, [order]);

  const handleDispatch = (nurseId?: string) => {
    if (!order) return;
    const targetNurse = nurseId
      ? recommendedNurses.find((n) => n.id === nurseId)
      : recommendedNurses[0];
    if (!targetNurse) {
      message.warning('暂无可派遣的护士');
      return;
    }
    updateOrder(order.id, {
      status: 'dispatched',
      nurseId: targetNurse.id,
      nurseInfo: {
        id: targetNurse.id,
        name: targetNurse.name,
        phone: targetNurse.phone,
      },
    });
    message.success(`已成功派单给护士：${targetNurse.name}`);
  };

  const handleRiskAssessment = () => {
    if (!order) return;
    navigate(`/risk-assessment/${order.id}`);
  };

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Empty description="订单不存在" />
      </div>
    );
  }

  const serviceColumns = [
    {
      title: '项目编码',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => (
        <span className="font-mono text-sm text-slate-600">{text}</span>
      ),
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span className="font-medium text-slate-900">{text}</span>
      ),
    },
    {
      title: '服务时长',
      dataIndex: 'duration',
      key: 'duration',
      align: 'center' as const,
      render: (val: number) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {val}分钟
        </span>
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      render: (val: number) => (
        <span className="font-medium text-slate-700">¥{val.toFixed(2)}</span>
      ),
    },
    {
      title: '小计',
      key: 'subtotal',
      align: 'right' as const,
      render: (_: unknown, record: { price: number }) => (
        <span className="font-semibold text-slate-900">¥{record.price.toFixed(2)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        showBack={true}
        title="订单详情"
        description={order.orderNo}
        onBack={() => navigate('/orders')}
        actions={[
          {
            key: 'dispatch',
            label: '智能派单',
            icon: <Send className="h-4 w-4" />,
            type: 'primary',
            onClick: () => handleDispatch(),
            disabled: ['dispatched', 'nurse-accepted', 'in-service', 'completed', 'cancelled'].includes(order.status),
          },
          {
            key: 'risk',
            label: '风险评估',
            icon: <AlertCircle className="h-4 w-4" />,
            onClick: handleRiskAssessment,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-medical-600" />
                <span className="font-semibold">患者基本信息</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">姓名</div>
                  <div className="font-medium text-slate-900">
                    {order.patientInfo.name}
                    <span className="ml-2 text-sm text-slate-500 font-normal">
                      {order.patientInfo.gender === 'male' ? '男' : '女'} · {order.patientInfo.age}岁
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">联系电话</div>
                  <a
                    href={`tel:${order.patientInfo.phone}`}
                    className="font-medium text-medical-600 hover:text-medical-700 hover:underline cursor-pointer"
                  >
                    {order.patientInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400 mb-0.5">服务地址</div>
                  <div className="font-medium text-slate-900 break-words">
                    {order.patientInfo.address}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">过敏史</div>
                  <div className="font-medium text-slate-900">
                    {order.patientInfo.allergies && order.patientInfo.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {order.patientInfo.allergies.map((a, i) => (
                          <Tag key={i} color="red" className="m-0">
                            {a}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">无</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">临床诊断</div>
                  <div className="font-medium text-slate-900">
                    {order.patientInfo.diagnosis || '暂无'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 shrink-0">
                  {patientIconMap[order.patientType]}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <PatientTypeTag type={order.patientType} size="md" />
                  <StatusBadge type="risk" status={order.riskLevel} />
                  <StatusBadge type="order" status={order.status} />
                  {order.hasInsurance && (
                    <Tag color="purple" icon={<FileText className="h-3 w-3" />}>
                      已投保
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-medical-600" />
                <span className="font-semibold">服务项目清单</span>
              </div>
            }
            className="shadow-sm"
          >
            <Table
              columns={serviceColumns}
              dataSource={order.serviceItems}
              rowKey="code"
              pagination={false}
              bordered={false}
              size="middle"
            />
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                共 {order.serviceItems.length} 项服务 · 合计时长{' '}
                {order.serviceItems.reduce((s, i) => s + i.duration, 0)} 分钟
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-slate-500">应付总金额：</span>
                <span className="text-2xl font-bold text-medical-600">
                  ¥{order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-medical-600" />
                <span className="font-semibold">预约与调度</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <div className="text-xs text-slate-400">预约时间</div>
                    <div className="mt-1 font-medium text-slate-900">
                      {dayjs(order.scheduledTime).format('YYYY年MM月DD日 HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <div className="text-xs text-slate-400">订单创建</div>
                    <div className="mt-1 font-medium text-slate-900">
                      {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <div className="text-xs text-slate-400">预计距离</div>
                    <div className="mt-1 flex items-center gap-1 font-medium text-slate-900">
                      <Navigation className="h-4 w-4 text-medical-600" />
                      {order.distanceKm || '-'} km
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-3">
                  {assignedNurse ? '派遣护士信息' : '派单状态'}
                </div>
                {assignedNurse ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-medical-50/50 to-white">
                    <div className="flex items-start gap-4">
                      <Avatar size={56} className="bg-medical-600 text-lg">
                        {assignedNurse.name.charAt(0)}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-base">
                            {assignedNurse.name}
                          </span>
                          <Tag color="blue" className="m-0 text-xs">
                            {assignedNurse.certificateType}
                          </Tag>
                        </div>
                        <div className="mt-1 text-sm text-slate-500 font-mono">
                          {assignedNurse.certificateNumber}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-amber-600">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{assignedNurse.rating}</span>
                          </div>
                          <div className="text-slate-600">
                            完成订单 <span className="font-medium text-slate-900">{assignedNurse.completedOrders}</span> 单
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          {assignedNurse.phone} · {assignedNurse.organizationName}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[140px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <Clock className="h-8 w-8 mb-2 text-slate-300" />
                    <div className="text-sm">暂未派单</div>
                    <div className="text-xs mt-1 text-slate-400">请点击右上角"智能派单"</div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-medical-600" />
                <span className="font-semibold">订单状态流转</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="px-2 py-2">
              <Timeline items={timelineItems} mode="horizontal" />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card
            title={
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">匹配护士推荐</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="space-y-4">
              {recommendedNurses.map((nurse, idx) => (
                <div
                  key={nurse.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all hover:shadow-md',
                    idx === 0
                      ? 'border-medical-200 bg-gradient-to-br from-medical-50/60 to-white'
                      : 'border-slate-200 hover:border-medical-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar size={44} className="bg-gradient-to-br from-medical-500 to-medical-600">
                      {nurse.name.charAt(0)}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{nurse.name}</span>
                        <span className="text-xs font-bold text-medical-600">
                          {nurse.matchScore}%
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Progress
                          percent={nurse.matchScore}
                          showInfo={false}
                          size="small"
                          strokeColor={{
                            '0%': '#3B82F6',
                            '100%': idx === 0 ? '#10B981' : '#6366F1',
                          }}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Navigation className="h-3 w-3" />
                          {nurse.distance}km
                        </span>
                        <span className={cn('px-1.5 py-0.5 rounded', scheduleStatusMap[nurse.scheduleStatus].color)}>
                          {scheduleStatusMap[nurse.scheduleStatus].label}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {nurse.rating}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Button
                          type={idx === 0 ? 'primary' : 'default'}
                          size="small"
                          block
                          icon={<Send className="h-3.5 w-3.5" />}
                          onClick={() => handleDispatch(nurse.id)}
                          disabled={nurse.scheduleStatus === 'full' || !!assignedNurse}
                        >
                          立即派单
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">风险评估概览</span>
              </div>
            }
            className="shadow-sm"
            extra={
              <Button
                type="link"
                size="small"
                icon={<FileText className="h-3.5 w-3.5" />}
                onClick={handleRiskAssessment}
              >
                查看详情
              </Button>
            }
          >
            <div className="flex flex-col items-center">
              <div className="mb-4 transform scale-150">
                <StatusBadge type="risk" status={order.riskLevel} showDot={true} />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-slate-900">
                  {order.riskLevel === 'low' ? '12' : order.riskLevel === 'medium' ? '26' : order.riskLevel === 'high' ? '42' : '58'}
                </span>
                <span className="text-sm text-slate-400">/ 100 分</span>
              </div>
              <Progress
                percent={order.riskLevel === 'low' ? 12 : order.riskLevel === 'medium' ? 26 : order.riskLevel === 'high' ? 42 : 58}
                showInfo={false}
                strokeColor={
                  order.riskLevel === 'low' ? '#10B981' :
                  order.riskLevel === 'medium' ? '#F59E0B' :
                  order.riskLevel === 'high' ? '#F97316' : '#EF4444'
                }
                trailColor={
                  order.riskLevel === 'low' ? '#D1FAE5' :
                  order.riskLevel === 'medium' ? '#FEF3C7' :
                  order.riskLevel === 'high' ? '#FFEDD5' : '#FEE2E2'
                }
                className="w-full mt-2 mb-5"
              />
              <div className="w-full space-y-2">
                <div className="text-xs font-medium text-slate-500 mb-2">主要风险提示</div>
                {(riskPointSuggestions[order.riskLevel] || []).slice(0, 3).map((point, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600 p-2 rounded-lg bg-slate-50"
                  >
                    <span className={cn(
                      'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                      order.riskLevel === 'low' ? 'bg-emerald-500' :
                      order.riskLevel === 'medium' ? 'bg-amber-500' :
                      order.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
                    )}>
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
