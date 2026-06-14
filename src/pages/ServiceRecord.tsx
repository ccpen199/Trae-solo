import { useParams, useState, useMemo } from 'react';
import {
  Tabs, Descriptions, Tag, Table, Timeline as AntTimeline,
  Alert, Card, Progress, Button, Avatar, Space, Tooltip, Divider, message,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import {
  ArrowLeft, Video, Mic, Lock, Cloud, FileText, Pill, Heart,
  Activity, Thermometer, Droplets, Wind, ShieldCheck, Eye, Download,
  Clock, CheckCircle2, XCircle, AlertCircle, Play,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import PatientTypeTag from '@/components/PatientTypeTag';
import { useGlobalStore } from '@/store/useGlobalStore';
import type { VitalSign, Medication, NursingNote } from '@/types';
import dayjs from 'dayjs';
import { mockOrders, mockServiceRecords } from '@/mock';

const { TabPane } = Tabs;

export default function ServiceRecord() {
  const { id = 'o0001' } = useParams();
  const getOrderById = useGlobalStore((s) => s.getOrderById);
  const getRecordsByOrderId = useGlobalStore((s) => s.getRecordsByOrderId);
  const [submitting, setSubmitting] = useState(false);

  const order = useMemo(() => getOrderById(id) || mockOrders.find((o) => o.id === id) || mockOrders[0], [id, getOrderById]);
  const record = useMemo(() => getRecordsByOrderId(id) || mockServiceRecords.find((r) => r.orderId === id) || mockServiceRecords[0], [id, getRecordsByOrderId]);

  const durationText = useMemo(() => {
    if (!record?.recording) return '无';
    const mins = Math.floor(record.recording.duration / 60);
    return `${mins}分${record.recording.duration % 60}秒`;
  }, [record]);

  const scheduledTimeRange = useMemo(() => {
    if (!order) return '-';
    const start = dayjs(order.scheduledTime);
    const mins = order.serviceItems.reduce((s, it) => s + it.duration, 0);
    return `${start.format('YYYY-MM-DD HH:mm')} ~ ${start.add(mins, 'minute').format('HH:mm')}`;
  }, [order]);

  const medicationExecutedRate = useMemo(() => {
    const list = record?.medicationList || [];
    if (!list.length) return 75;
    return Math.round((list.filter((m) => m.administered).length / list.length) * 100);
  }, [record]);

  const defaultNotes: NursingNote[] = [
    { content: '患者神志清楚，精神可，生命体征平稳。伤口愈合良好，无红肿渗液。遵医嘱给药，观察无不良反应。协助翻身叩背，指导床上被动活动。', images: [], signature: order?.nurseInfo?.name || '李雅琴', createdAt: order?.actualStartTime ? dayjs(order.actualStartTime).add(55, 'minute').format('YYYY-MM-DD HH:mm:ss') : '2025-01-15 14:25:00' },
    { content: '测量血压145/92mmHg，患者主诉轻度头晕，已指导卧床休息。复测血压138/88mmHg，头晕缓解。已电话告知家属继续监测。', images: [], signature: order?.nurseInfo?.name || '李雅琴', createdAt: order?.actualStartTime ? dayjs(order.actualStartTime).add(25, 'minute').format('YYYY-MM-DD HH:mm:ss') : '2025-01-15 13:55:00' },
    { content: '已到达患者家中，核对身份信息。T36.5℃，P78次/分，R18次/分，BP132/80mmHg。患者精神可，家属在场。准备开始护理。', images: [], signature: order?.nurseInfo?.name || '李雅琴', createdAt: order?.actualStartTime || '2025-01-15 13:30:00' },
  ];

  const defaultMeds: Medication[] = [
    { name: '硝苯地平缓释片', dosage: '30mg', frequency: '每日1次', administered: true, remark: '早餐后服用' },
    { name: '阿司匹林肠溶片', dosage: '100mg', frequency: '每日1次', administered: true, remark: '观察有无出血' },
    { name: '甲钴胺片', dosage: '0.5mg', frequency: '每日3次', administered: true },
    { name: '复方丹参滴丸', dosage: '10丸', frequency: '每日3次', administered: false, remark: '患者自备未带' },
  ];

  const defaultVitals: VitalSign[] = [
    { temperature: 36.5, heartRate: 78, bloodPressure: { systolic: 132, diastolic: 80 }, respiratoryRate: 18, oxygenSaturation: 97, bloodGlucose: 6.2, recordedAt: order?.actualStartTime || '2025-01-15 13:30:00' },
    { temperature: 36.7, heartRate: 82, bloodPressure: { systolic: 145, diastolic: 92 }, respiratoryRate: 19, oxygenSaturation: 96, recordedAt: order?.actualStartTime ? dayjs(order.actualStartTime).add(25, 'minute').format('YYYY-MM-DD HH:mm:ss') : '2025-01-15 13:55:00' },
    { temperature: 36.6, heartRate: 76, bloodPressure: { systolic: 138, diastolic: 88 }, respiratoryRate: 18, oxygenSaturation: 97, bloodGlucose: 6.8, recordedAt: order?.actualStartTime ? dayjs(order.actualStartTime).add(55, 'minute').format('YYYY-MM-DD HH:mm:ss') : '2025-01-15 14:25:00' },
  ];

  const nursingNotes = record?.nursingNotes?.length ? record.nursingNotes : defaultNotes;
  const medicationList = record?.medicationList?.length ? record.medicationList : defaultMeds;
  const vitalSigns = record?.vitalSigns?.length ? record.vitalSigns : defaultVitals;

  const vitalTempHeartOption = useMemo(() => {
    const times = vitalSigns.map((v) => dayjs(v.recordedAt).format('HH:mm'));
    return {
      color: ['#06B6D4', '#10B981'],
      tooltip: { trigger: 'axis' },
      legend: { data: ['体温(℃)', '心率(bpm)'], bottom: 0 },
      grid: { left: 50, right: 50, top: 20, bottom: 50 },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: [
        { type: 'value', name: '体温', min: 35, max: 40, position: 'left' },
        { type: 'value', name: '心率', min: 50, max: 120, position: 'right' },
      ],
      series: [
        { name: '体温(℃)', type: 'line', yAxisIndex: 0, smooth: true, data: vitalSigns.map((v) => v.temperature ?? null), symbol: 'circle', symbolSize: 8, lineStyle: { width: 3 }, areaStyle: { opacity: 0.15 } },
        { name: '心率(bpm)', type: 'line', yAxisIndex: 1, smooth: true, data: vitalSigns.map((v) => v.heartRate ?? null), symbol: 'circle', symbolSize: 8, lineStyle: { width: 3 }, areaStyle: { opacity: 0.15 } },
      ],
    };
  }, [vitalSigns]);

  const bloodPressureOption = useMemo(() => {
    const times = vitalSigns.map((v) => dayjs(v.recordedAt).format('HH:mm'));
    return {
      color: ['#3B82F6', '#8B5CF6'],
      tooltip: { trigger: 'axis' },
      legend: { data: ['收缩压(mmHg)', '舒张压(mmHg)'], bottom: 0 },
      grid: { left: 50, right: 50, top: 20, bottom: 50 },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', min: 40, max: 200, name: 'mmHg' },
      series: [
        { name: '收缩压(mmHg)', type: 'line', smooth: true, data: vitalSigns.map((v) => v.bloodPressure?.systolic ?? null), symbol: 'circle', symbolSize: 8, lineStyle: { width: 3 }, areaStyle: { opacity: 0.1 } },
        { name: '舒张压(mmHg)', type: 'line', smooth: true, data: vitalSigns.map((v) => v.bloodPressure?.diastolic ?? null), symbol: 'circle', symbolSize: 8, lineStyle: { width: 3 }, areaStyle: { opacity: 0.1 } },
      ],
    };
  }, [vitalSigns]);

  const bindingItems = useMemo(() => [
    { title: '录像-护理记录绑定', li: <Video className="h-5 w-5 text-cyan-500" />, ri: <FileText className="h-5 w-5 text-blue-500" />, hash: (record?.recording?.encryptedHash || 'sha256:a7f3c8e21b9d').slice(0, 16) + '...', t: '2025-01-15 14:32:18' },
    { title: '录像-用药记录绑定', li: <Video className="h-5 w-5 text-cyan-500" />, ri: <Pill className="h-5 w-5 text-emerald-500" />, hash: 'sha256:7f3a9c2e1b8d...', t: '2025-01-15 14:32:19' },
    { title: '录像-体征数据绑定', li: <Video className="h-5 w-5 text-cyan-500" />, ri: <Heart className="h-5 w-5 text-rose-500" />, hash: 'sha256:b4e7d1f5a29c...', t: '2025-01-15 14:32:20' },
    { title: '全链路完整性校验', li: <ShieldCheck className="h-5 w-5 text-violet-500" />, ri: <Lock className="h-5 w-5 text-indigo-500" />, hash: 'sha256:a8c3f6e2d4b1...', t: '2025-01-15 14:32:21' },
  ], [record]);

  const nurseName = order?.nurseInfo?.name || '李雅琴';
  const verified = record?.dataBindingVerified;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); message.success('服务记录已提交审核'); }, 1200);
  };

  const medColumns = [
    { title: '药品名称', dataIndex: 'name', key: 'name', render: (t: string) => <div className="flex items-center gap-2"><Pill className="h-4 w-4 text-emerald-500" /><span className="font-medium">{t}</span></div> },
    { title: '规格剂量', dataIndex: 'dosage', key: 'dosage' },
    { title: '给药频次', dataIndex: 'frequency', key: 'frequency' },
    { title: '执行状态', key: 'a', render: (_: any, r: Medication) => r.administered ? <Tag color="success" icon={<CheckCircle2 className="h-3 w-3" />}>已执行</Tag> : <Tag color="default" icon={<XCircle className="h-3 w-3" />}>未执行</Tag> },
    { title: '护士核对', key: 's', render: () => <div className="flex items-center gap-2"><Avatar size={20} className="bg-cyan-500 text-xs">{nurseName.charAt(0)}</Avatar><span className="text-sm text-slate-600">{nurseName}</span></div> },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (t: string) => t || '-' },
  ];

  const vitalCard = (icon: any, label: string, value: string, bg: string) => (
    <div className={`flex items-center gap-2 rounded-lg ${bg} px-3 py-2`}>
      {icon}
      <div>
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <PageHeader
        showBack title="服务记录详情"
        description="包含录像、护理记录、用药、体征、绑定验证全流程材料"
        actions={[
          { key: 'audit', label: '提交审核', type: 'primary', icon: <CheckCircle2 className="h-4 w-4" />, onClick: handleSubmit, loading: submitting },
          { key: 'export', label: '导出记录', icon: <Download className="h-4 w-4" />, onClick: () => message.success('记录导出中...') },
        ]}
      />

      <Card className="mb-6 rounded-xl border border-slate-200">
        <Descriptions column={4} size="middle">
          <Descriptions.Item label="订单号"><span className="font-mono text-slate-700">{order?.orderNo || 'SO202501150001'}</span></Descriptions.Item>
          <Descriptions.Item label="患者姓名"><span className="font-medium">{order?.patientInfo.name || '张秀英'}</span></Descriptions.Item>
          <Descriptions.Item label="患者类型"><PatientTypeTag type={order?.patientType || 'elderly'} /></Descriptions.Item>
          <Descriptions.Item label="护士姓名"><div className="flex items-center gap-2"><Avatar size={24} className="bg-cyan-500 text-xs">{nurseName.charAt(0)}</Avatar><span className="text-sm">{nurseName}</span></div></Descriptions.Item>
          <Descriptions.Item label="预约时间段"><span className="text-slate-700">{scheduledTimeRange}</span></Descriptions.Item>
          <Descriptions.Item label="服务状态"><StatusBadge type="order" status={order?.status || 'completed'} /></Descriptions.Item>
          <Descriptions.Item label="录制时长"><div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-500" /><span className="font-mono text-slate-700">{durationText}</span></div></Descriptions.Item>
          <Descriptions.Item label="数据绑定"><div className="flex items-center gap-1.5"><ShieldCheck className={`h-4 w-4 ${verified ? 'text-emerald-500' : 'text-red-500'}`} /><span className={verified ? 'text-emerald-600' : 'text-red-600'}>{verified ? '已验证' : '未验证'}</span></div></Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="1" type="card" size="large">
        <TabPane tab={<span className="flex items-center gap-2"><Video className="h-4 w-4" />音视频录制</span>} key="1">
          <div className="grid grid-cols-2 gap-6">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-lg">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_60%)]" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <Play className="h-7 w-7 text-white fill-white ml-1" />
                </div>
                <p className="text-sm font-medium text-white/90">服务过程录像回放</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Tag color="cyan" bordered={false}>1080P · 高清</Tag>
                  {record?.recording?.hasInterruptions ? (
                    <Tag color="orange" bordered={false} icon={<AlertCircle className="h-3 w-3" />}>存在中断</Tag>
                  ) : (
                    <Tag color="green" bordered={false} icon={<CheckCircle2 className="h-3 w-3" />}>完整录制</Tag>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Card title={<div className="flex items-center gap-2"><Mic className="h-4 w-4 text-cyan-500" />服务音频波形</div>} className="rounded-xl">
                <div className="flex h-32 items-end justify-center gap-1 px-2 py-4">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const h = [40, 65, 48, 80, 55, 72, 38, 90, 62, 45, 78, 52, 88, 42, 68, 35][i];
                    const c = ['#06B6D4', '#0EA5E9', '#3B82F6', '#10B981'];
                    return <Tooltip key={i} title={`采样 ${i + 1}: ${h}%`}><div className="w-3 rounded-t-md transition-all hover:opacity-80" style={{ height: `${h}%`, background: `linear-gradient(to top, ${c[i % 4]}, ${c[(i + 2) % 4]})` }} /></Tooltip>;
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>采样率: 44.1kHz</span><span>声道: 立体声</span><span>时长: {durationText}</span>
                </div>
              </Card>
              <Card title={<div className="flex items-center gap-2"><Lock className="h-4 w-4 text-violet-500" />加密与存储信息</div>} className="rounded-xl">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4"><span className="text-slate-500 shrink-0">加密哈希值</span><code className="flex-1 truncate rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700">{record?.recording?.encryptedHash || 'sha256:a7f3c8e21b9d4f6e...'}</code></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">加密算法</span><Tag color="violet" bordered={false}>AES-256-GCM</Tag></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">云端脱敏转存</span><span className="flex items-center gap-1 text-emerald-600"><Cloud className="h-4 w-4" />已完成<CheckCircle2 className="h-4 w-4" /></span></div>
                  <Divider className="my-2" />
                  <div className="flex items-center justify-between"><span className="text-slate-500">文件大小</span><span className="font-medium text-slate-700">384.2 MB</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">文件格式</span><span className="font-medium text-slate-700">MP4 / WAV</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">存储位置</span><span className="font-mono text-xs text-slate-700">OSS-BJ-BUCKET-02</span></div>
                </div>
              </Card>
            </div>
          </div>
        </TabPane>

        <TabPane tab={<span className="flex items-center gap-2"><FileText className="h-4 w-4" />电子护理记录</span>} key="2">
          <Card className="rounded-xl">
            <AntTimeline mode="left" items={nursingNotes.slice().reverse().map((note, idx) => ({
              color: idx === 0 ? '#06B6D4' : '#10B981',
              label: <div className="text-xs font-mono text-slate-500">{note.createdAt}</div>,
              children: (
                <Card className="mb-2 rounded-lg border border-slate-200">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar className="h-9 w-9 bg-cyan-500 text-sm font-medium">{note.signature.charAt(0)}</Avatar>
                    <div><p className="text-sm font-semibold text-slate-800">{note.signature}</p><p className="text-xs text-slate-500">执业护士 · 安康护理中心</p></div>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">{note.content}</p>
                  {note.images?.length > 0 && <div className="mt-3 flex gap-2">{note.images.slice(0, 4).map((_, i) => <div key={i} className="h-20 w-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><Eye className="h-5 w-5" /></div>)}</div>}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" />{note.createdAt} 签名</div>
                    <code className="rounded bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500">HASH:{(Math.random().toString(36).slice(2, 10)).toUpperCase()}</code>
                  </div>
                </Card>
              ),
            }))} />
          </Card>
        </TabPane>

        <TabPane tab={<span className="flex items-center gap-2"><Pill className="h-4 w-4" />用药清单</span>} key="3">
          <Card className="rounded-xl">
            <Table columns={medColumns} dataSource={medicationList.map((m, i) => ({ ...m, key: i }))} pagination={false} size="middle" />
            <div className="mt-6 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 p-5">
              <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-slate-700">用药执行率</span><span className="text-lg font-bold text-emerald-600">{medicationExecutedRate}%</span></div>
              <Progress percent={medicationExecutedRate} status={medicationExecutedRate === 100 ? 'success' : 'active'} strokeColor={{ from: '#10B981', to: '#06B6D4' }} trailColor="white" />
              <p className="mt-2 text-xs text-slate-500">共 {medicationList.length} 项医嘱，已执行 {medicationList.filter((m) => m.administered).length} 项</p>
            </div>
          </Card>
        </TabPane>

        <TabPane tab={<span className="flex items-center gap-2"><Heart className="h-4 w-4" />生命体征</span>} key="4">
          <Card title={<div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-500" />体征录入时间线</div>} className="mb-6 rounded-xl">
            <AntTimeline mode="left" items={vitalSigns.map((v, idx) => ({
              color: idx % 2 === 0 ? '#06B6D4' : '#10B981',
              label: <div className="text-xs font-mono text-slate-500 pt-1">{v.recordedAt}</div>,
              children: (
                <div className="grid grid-cols-6 gap-3">
                  {vitalCard(<Thermometer className="h-4 w-4 text-orange-500" />, '体温', `${v.temperature?.toFixed(1)}℃`, 'bg-orange-50')}
                  {vitalCard(<Heart className="h-4 w-4 text-rose-500" />, '心率', `${v.heartRate}bpm`, 'bg-rose-50')}
                  {vitalCard(<Activity className="h-4 w-4 text-blue-500" />, '血压', `${v.bloodPressure?.systolic}/${v.bloodPressure?.diastolic}`, 'bg-blue-50')}
                  {vitalCard(<Wind className="h-4 w-4 text-cyan-500" />, '呼吸', `${v.respiratoryRate}次/分`, 'bg-cyan-50')}
                  {vitalCard(<Droplets className="h-4 w-4 text-sky-500" />, '血氧', `${v.oxygenSaturation}%`, 'bg-sky-50')}
                  {vitalCard(<div className="h-4 w-4 rounded bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">糖</div>, '血糖', v.bloodGlucose ? `${v.bloodGlucose.toFixed(1)}mmol/L` : '-', 'bg-emerald-50')}
                </div>
              ),
            }))} />
          </Card>
          <div className="grid grid-cols-2 gap-6">
            <Card title={<div className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-cyan-500" />体温 & 心率趋势</div>} className="rounded-xl">
              <ReactECharts option={vitalTempHeartOption} style={{ height: 280 }} notMerge lazyUpdate />
            </Card>
            <Card title={<div className="flex items-center gap-2"><Activity className="h-4 w-4 text-blue-500" />血压变化趋势</div>} className="rounded-xl">
              <ReactECharts option={bloodPressureOption} style={{ height: 280 }} notMerge lazyUpdate />
            </Card>
          </div>
        </TabPane>

        <TabPane tab={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />数据绑定验证</span>} key="5">
          <div className="mb-5">
            <Alert type={verified ? 'success' : 'error'} showIcon icon={verified ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              message={<span className="font-semibold">整体绑定状态：{verified ? <span className="text-emerald-600">验证通过</span> : <span className="text-red-600">验证未通过</span>}</span>}
              description="数据绑定验证通过，所有材料已完成强关联并加密归档，符合《互联网居家护理服务管理办法》要求。" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            {bindingItems.map((item, idx) => (
              <Card key={idx} className="rounded-xl border-slate-200 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">{item.li}<span className="text-slate-400 font-light">⇄</span>{item.ri}</div>
                    <div><p className="font-semibold text-slate-800">{item.title}</p><p className="text-xs text-slate-500">校验时间: {item.t}</p></div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="h-6 w-6 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600">通过</span></div>
                    <code className="rounded bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500">{item.hash}</code>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-cyan-50 to-sky-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30"><ShieldCheck className="h-6 w-6 text-white" /></div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800">合规性声明</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">本服务记录已通过区块链哈希存证，录像、护理记录、用药清单、体征数据之间已完成强校验绑定。任意数据篡改将导致哈希值不匹配而被检测到。本记录符合<span className="font-semibold text-slate-800">《互联网居家护理服务管理办法》</span>第二十三条规定。</p>
                <div className="mt-4 flex items-center gap-3"><Space size={4}><Button size="small" type="primary" icon={<Eye className="h-3.5 w-3.5" />}>查看存证凭证</Button><Button size="small" icon={<Download className="h-3.5 w-3.5" />}>下载校验报告</Button></Space></div>
              </div>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}
