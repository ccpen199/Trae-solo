import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Space,
  Divider,
  Progress,
  Tabs,
  Table,
  message,
  Badge,
  Avatar,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Video,
  FileText,
  Pill,
  Heart,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Stethoscope,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import PatientTypeTag from '@/components/PatientTypeTag';
import StatCard from '@/components/StatCard';
import dayjs from 'dayjs';
import type { ServiceOrder, RecordingStatus, DataBindingStatus } from '@/types';

const { TabPane } = Tabs;

const RecordingStatusTag = ({ status }: { status: RecordingStatus }) => {
  const config: Record<RecordingStatus, { label: string; color: string; icon: React.ReactNode; pulse?: boolean }> = {
    recording: { label: '录制中', color: 'red', icon: <Play className="h-3 w-3" />, pulse: true },
    completed: { label: '已完成', color: 'green', icon: <CheckCircle2 className="h-3 w-3" /> },
    'not-started': { label: '未开始', color: 'default', icon: <MinusCircle className="h-3 w-3" /> },
    interrupted: { label: '已中断', color: 'red', icon: <XCircle className="h-3 w-3" /> },
    paused: { label: '已暂停', color: 'orange', icon: <MinusCircle className="h-3 w-3" /> },
  };
  const c = config[status];
  return (
    <Tag color={c.color} icon={c.icon} className={c.pulse ? 'animate-pulse' : ''}>
      {c.label}
    </Tag>
  );
};

const BindingStatusTag = ({ status }: { status: DataBindingStatus }) => {
  const config: Record<DataBindingStatus, { label: string; color: string }> = {
    'fully-bound': { label: '完全绑定', color: 'green' },
    partial: { label: '部分绑定', color: 'orange' },
    'not-bound': { label: '未绑定', color: 'default' },
  };
  const c = config[status];
  return <Tag color={c.color}>{c.label}</Tag>;
};

const calcDuration = (startTime?: string) => {
  if (!startTime) return '00:00:00';
  const diff = dayjs().diff(dayjs(startTime), 'second');
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function ServiceOngoing() {
  const navigate = useNavigate();
  const { orders, bindServiceRecord } = useGlobalStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const ongoingOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === 'in-service' ||
          o.status === 'nurse-accepted' ||
          (o.status !== 'completed' && o.recordingStatus !== 'not-started')
      ),
    [orders]
  );

  const abnormalOrders = useMemo(
    () => orders.filter((o) => o.status === 'completed' && o.dataBindingStatus !== 'fully-bound'),
    [orders]
  );

  const todayStarted = useMemo(
    () =>
      orders.filter((o) => o.actualStartTime && dayjs(o.actualStartTime).isSame(dayjs(), 'day')).length,
    [orders]
  );

  const recordingCount = useMemo(
    () => orders.filter((o) => o.recordingStatus === 'recording').length,
    [orders]
  );

  const abnormalCount = useMemo(
    () => orders.filter((o) => o.dataBindingStatus !== 'fully-bound' && o.status === 'completed').length,
    [orders]
  );

  const ongoingColumns: ColumnsType<ServiceOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (text, record) => (
        <a
          onClick={() => navigate(`/orders/${record.id}`)}
          className="font-mono text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {text}
        </a>
      ),
    },
    {
      title: '患者',
      key: 'patient',
      width: 160,
      render: (_, record) => (
        <div>
          <p className="font-medium text-slate-800">{record.patientInfo.name}</p>
          <p className="text-xs text-slate-500">
            {record.patientInfo.age}岁 · {record.patientInfo.gender === 'male' ? '男' : '女'}
          </p>
        </div>
      ),
    },
    {
      title: '患者类型',
      key: 'patientType',
      width: 120,
      render: (_, record) => <PatientTypeTag type={record.patientType} size="sm" />,
    },
    {
      title: '护士',
      key: 'nurse',
      width: 160,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar size={32} className="bg-cyan-500 text-xs">
            {record.nurseInfo?.name?.charAt(0) || '护'}
          </Avatar>
          <div>
            <p className="text-sm font-medium text-slate-800">{record.nurseInfo?.name || '-'}</p>
            <p className="text-xs text-slate-500">{record.nurseInfo?.phone || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      title: '服务项目',
      key: 'serviceItems',
      width: 200,
      render: (_, record) => (
        <div>
          <p className="text-sm font-medium text-slate-800">{record.serviceItems[0]?.name}</p>
          {record.serviceItems.length > 1 && (
            <p className="text-xs text-slate-500">等 {record.serviceItems.length} 项</p>
          )}
        </div>
      ),
    },
    {
      title: '签到时间',
      key: 'checkIn',
      width: 160,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">
            {record.actualStartTime ? dayjs(record.actualStartTime).format('MM-DD HH:mm') : '-'}
          </span>
        </div>
      ),
    },
    {
      title: '服务时长',
      key: 'duration',
      width: 110,
      render: (_, record) => (
        <span className="font-mono text-sm font-medium text-slate-700">
          {calcDuration(record.actualStartTime)}
        </span>
      ),
    },
    {
      title: '录制状态',
      key: 'recordingStatus',
      width: 110,
      render: (_, record) => <RecordingStatusTag status={record.recordingStatus} />,
    },
    {
      title: '数据绑定',
      key: 'dataBindingStatus',
      width: 110,
      render: (_, record) => <BindingStatusTag status={record.dataBindingStatus} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<Video className="h-3.5 w-3.5" />}
            onClick={() => navigate(`/service/${record.id}/record`)}
          >
            查看录像
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  const abnormalColumns: ColumnsType<ServiceOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (text) => <span className="font-mono text-sm text-slate-700">{text}</span>,
    },
    {
      title: '患者',
      key: 'patient',
      width: 140,
      render: (_, record) => (
        <div>
          <p className="font-medium text-slate-800">{record.patientInfo.name}</p>
          <p className="text-xs text-slate-500">{record.patientInfo.phone}</p>
        </div>
      ),
    },
    {
      title: '护士',
      key: 'nurse',
      width: 140,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar size={28} className="bg-cyan-500 text-xs">
            {record.nurseInfo?.name?.charAt(0) || '护'}
          </Avatar>
          <span className="text-sm text-slate-700">{record.nurseInfo?.name || '-'}</span>
        </div>
      ),
    },
    {
      title: '护理记录',
      key: 'nursingNotes',
      width: 120,
      render: (_, record) =>
        record.hasNursingNotes ? (
          <Tag color="green" icon={<CheckCircle2 className="h-3 w-3" />}>
            已提交
          </Tag>
        ) : (
          <Tag color="red" icon={<XCircle className="h-3 w-3" />}>
            缺失
          </Tag>
        ),
    },
    {
      title: '用药清单',
      key: 'medication',
      width: 120,
      render: (_, record) =>
        record.hasMedicationList ? (
          <Tag color="green" icon={<CheckCircle2 className="h-3 w-3" />}>
            已提交
          </Tag>
        ) : (
          <Tag color="red" icon={<XCircle className="h-3 w-3" />}>
            缺失
          </Tag>
        ),
    },
    {
      title: '生命体征',
      key: 'vitalSigns',
      width: 120,
      render: (_, record) =>
        record.hasVitalSigns ? (
          <Tag color="green" icon={<CheckCircle2 className="h-3 w-3" />}>
            已提交
          </Tag>
        ) : (
          <Tag color="red" icon={<XCircle className="h-3 w-3" />}>
            缺失
          </Tag>
        ),
    },
    {
      title: '绑定状态',
      key: 'binding',
      width: 120,
      render: (_, record) => <BindingStatusTag status={record.dataBindingStatus} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          onClick={() => {
            bindServiceRecord(record.id);
            message.success('已一键补齐数据绑定');
          }}
        >
          一键补齐
        </Button>
      ),
    },
  ];

  const EmptyOngoing = () => (
    <div className="flex min-h-[320px] flex-col items-center justify-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Stethoscope className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-base font-medium text-slate-700">当前没有进行中的服务</p>
      <p className="mt-1 text-sm text-slate-500">所有服务已完成或尚未开始</p>
    </div>
  );

  const EmptyAbnormal = () => (
    <div className="flex min-h-[320px] flex-col items-center justify-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <ShieldCheck className="h-8 w-8 text-emerald-500" />
      </div>
      <p className="text-base font-medium text-slate-700">暂无绑定异常订单</p>
      <p className="mt-1 text-sm text-slate-500">所有已完成订单数据绑定正常</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="服务过程管控"
        description="音视频双录、电子护理记录、用药清单、生命体征全链路绑定监管"
        icon={<Activity className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="进行中服务"
          value={ongoingOrders.length}
          suffix="单"
          icon={<Stethoscope className="h-6 w-6" />}
          gradient="cyan"
        />
        <StatCard
          title="今日开始服务"
          value={todayStarted}
          suffix="单"
          icon={<Clock className="h-6 w-6" />}
          gradient="blue"
        />
        <StatCard
          title="录制中"
          value={recordingCount}
          suffix="路"
          icon={<Video className="h-6 w-6" />}
          gradient="green"
        />
        <StatCard
          title="数据绑定异常"
          value={abnormalCount}
          suffix="单"
          icon={<AlertTriangle className="h-6 w-6" />}
          gradient="orange"
        />
      </div>

      <Card className="border-0 shadow-lg" styles={{ body: { padding: 0 } }}>
        <Tabs
          defaultActiveKey="1"
          size="large"
          className="px-2 pt-2"
          items={[
            {
              key: '1',
              label: (
                <span className="flex items-center gap-2 px-2">
                  <Activity className="h-4 w-4" />
                  进行中服务
                  <Badge count={ongoingOrders.length} size="small" color="#06B6D4" />
                </span>
              ),
              children: (
                <div className="pt-2">
                  {ongoingOrders.length > 0 ? (
                    <DataTable
                      columns={ongoingColumns as any}
                      dataSource={ongoingOrders}
                      rowKey="id"
                      showSearch={false}
                      showFilter={false}
                      pagination={false}
                      scroll={{ x: 1400 }}
                    />
                  ) : (
                    <EmptyOngoing />
                  )}
                </div>
              ),
            },
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2 px-2">
                  <AlertTriangle className="h-4 w-4" />
                  绑定异常监控
                  {abnormalCount > 0 && (
                    <Badge count={abnormalCount} size="small" color="#F59E0B" />
                  )}
                </span>
              ),
              children: (
                <div className="pt-2">
                  {abnormalOrders.length > 0 ? (
                    <DataTable
                      columns={abnormalColumns as any}
                      dataSource={abnormalOrders}
                      rowKey="id"
                      showSearch={false}
                      showFilter={false}
                      pagination={false}
                      scroll={{ x: 1100 }}
                    />
                  ) : (
                    <EmptyAbnormal />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
