import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Steps, Descriptions, Card, Tabs, Button, Input, Tag,
  Timeline, Avatar, Alert, Divider, Modal, message, Table, List,
} from 'antd';
import type { TabsProps } from 'antd';
import ReactECharts from 'echarts-for-react';
import {
  Video, FileText, Heart, Pill, CheckCircle, XCircle,
  MessageSquare, AlertTriangle, Clock, User, StickyNote,
  X, Play, ShieldCheck,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import PageHeader from '@/components/PageHeader';
import PatientTypeTag from '@/components/PatientTypeTag';
import StatusBadge from '@/components/StatusBadge';
import { AUDIT_STAGE_MAP } from '@/utils/constants';
import { formatDateTime, cn } from '@/lib/utils';
import type { AuditStage, AuditResult, ServiceOrder, RiskLevel } from '@/types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const STAGE_BG: Record<AuditStage, string> = {
  'self-check': 'bg-blue-50 text-blue-700 border-blue-200',
  'quality-control': 'bg-amber-50 text-amber-700 border-amber-200',
  'platform-check': 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function AuditWorkbench() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAuditTaskById, getOrderById, getAuditTasks, updateAuditTask, auth } = useGlobalStore();
  const task = id ? getAuditTaskById(id) : undefined;
  const order = task ? getOrderById(task.orderId) : undefined;
  const allTasks = getAuditTasks();

  const [activeTab, setActiveTab] = useState('video');
  const [auditRemark, setAuditRemark] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [abnormalList, setAbnormalList] = useState([
    { id: 'a1', tab: 'medication', tabLabel: '用药清单', description: '二甲双胍片执行记录缺少签名确认', time: dayjs().subtract(15, 'minute').format('HH:mm') },
  ]);

  const currentStage: AuditStage = task?.stage || 'quality-control';
  const stageIdx = { 'self-check': 0, 'quality-control': 1, 'platform-check': 2 }[currentStage];
  const materialIntegrity = [
    { key: 'video', label: '录像完整性', pass: true },
    { key: 'notes', label: '护理记录完整性', pass: true },
    { key: 'medication', label: '用药执行', pass: false },
    { key: 'vitals', label: '体征录入', pass: true },
    { key: 'binding', label: '数据绑定', pass: true },
  ];

  const auditHistory = useMemo(() => {
    if (!task) return [];
    const prev = allTasks.filter(t => t.orderId === task.orderId && t.id !== task.id && t.result !== 'pending');
    const order: AuditStage[] = ['self-check', 'quality-control', 'platform-check'];
    prev.sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage));
    if (prev.length === 0) return [{ id: 'mock', auditor: '护士-王秀英', stage: 'self-check' as AuditStage, result: 'approved' as AuditResult, time: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'), remark: '服务已完成，资料完整，自检通过。' }];
    return prev.map(t => ({ id: t.id, auditor: t.auditorName || '系统', stage: t.stage, result: t.result, time: t.completedAt || t.startedAt, remark: t.remarks || (t.result === 'approved' ? '资料完整，审核通过' : '存在待补充项') }));
  }, [task, allTasks]);

  const displayOrder = useMemo((): ServiceOrder => {
    if (order) return order as ServiceOrder;
    return {
      id: 'o', orderNo: task?.orderNo || 'SO202506081023', patientType: 'elderly',
      patientInfo: { name: task?.patientName || '李淑珍', age: 78, gender: 'female', phone: '139****5678', address: '', diagnosis: '' },
      nurseInfo: { name: task?.nurseName || '王秀英' }, riskLevel: 'medium' as RiskLevel,
    } as ServiceOrder;
  }, [order, task]);

  const handleBack = () => navigate('/audit-todo');

  const handleMarkAbnormal = () => {
    const tabLabels: Record<string, string> = { video: '服务录像', notes: '护理记录', medication: '用药清单', vitals: '生命体征' };
    Modal.confirm({
      title: '标记异常', icon: <AlertTriangle className="text-red-500" />,
      content: <div className="space-y-2"><p>当前位置：<Tag color="blue">{tabLabels[activeTab]}</Tag></p><TextArea rows={3} placeholder="请描述异常情况..." id="abn-input" /></div>,
      okText: '确认标记', okButtonProps: { danger: true },
      onOk: () => {
        const desc = (document.getElementById('abn-input') as HTMLTextAreaElement)?.value?.trim();
        if (!desc) { message.warning('请填写异常描述'); return Promise.reject(); }
        setAbnormalList(p => [...p, { id: 'abn-' + Date.now(), tab: activeTab, tabLabel: tabLabels[activeTab], description: desc, time: dayjs().format('HH:mm') }]);
        message.success('已标记异常');
      },
    });
  };

  const submitAudit = (result: AuditResult, remarks: string) => {
    if (id) updateAuditTask(id, { result, remarks, completedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), auditorId: auth?.id, auditorName: auth?.name });
    message.success(result === 'approved' ? '审核通过' : '已驳回');
    setTimeout(() => navigate('/audit-todo'), 800);
  };

  const handlePass = () => Modal.confirm({
    title: '确认审核通过', icon: <CheckCircle className="text-emerald-500" />,
    content: <div className="space-y-3"><p className="text-sm text-slate-600">请确认提交审核意见：</p><TextArea rows={3} placeholder="请填写审核意见（可选）..." value={auditRemark} onChange={e => setAuditRemark(e.target.value)} /></div>,
    okText: '确认通过', okButtonProps: { type: 'primary' },
    onOk: () => submitAudit('approved', auditRemark || '资料完整，服务规范，审核通过。'),
  });

  const handleReject = () => setRejectModalOpen(true);
  const confirmReject = () => { if (!rejectReason.trim()) { message.warning('请填写驳回原因'); return; } submitAudit('rejected', rejectReason); setRejectModalOpen(false); };

  const vitalOption = {
    grid: { left: 40, right: 20, top: 30, bottom: 30 }, tooltip: { trigger: 'axis' },
    legend: { data: ['收缩压', '舒张压', '心率'], top: 0, right: 0 },
    xAxis: { type: 'category', data: ['09:00', '09:20', '09:40', '10:00', '10:20'] },
    yAxis: [{ type: 'value', name: 'mmHg', min: 60, max: 200 }, { type: 'value', name: '次/分', min: 50, max: 120 }],
    series: [
      { name: '收缩压', type: 'line', smooth: true, data: [138, 142, 135, 140, 136], itemStyle: { color: '#EF4444' } },
      { name: '舒张压', type: 'line', smooth: true, data: [85, 88, 82, 86, 84], itemStyle: { color: '#3B82F6' } },
      { name: '心率', type: 'line', smooth: true, yAxisIndex: 1, data: [78, 82, 76, 80, 77], itemStyle: { color: '#10B981' } },
    ],
  };

  const medData = [
    { key: '1', name: '硝苯地平缓释片', dosage: '30mg', frequency: '每日1次', administered: true, remark: '早餐后服用' },
    { key: '2', name: '阿司匹林肠溶片', dosage: '100mg', frequency: '每日1次', administered: true, remark: '-' },
    { key: '3', name: '二甲双胍片', dosage: '500mg', frequency: '每日2次', administered: false, remark: '餐中服用，签名缺失' },
  ];
  const medCols = [
    { title: '药品', dataIndex: 'name', render: (t: string) => <span className="flex items-center gap-2"><Pill className="h-4 w-4 text-blue-500" />{t}</span> },
    { title: '剂量', dataIndex: 'dosage', width: 90 },
    { title: '频次', dataIndex: 'frequency', width: 90 },
    { title: '执行', dataIndex: 'administered', width: 80, render: (v: boolean) => v ? <Tag color="success">已执行</Tag> : <Tag color="error">待确认</Tag> },
    { title: '备注', dataIndex: 'remark' },
  ];

  const notes = [
    { id: 'n1', time: '09:05', content: '患者神志清楚，精神可，主诉轻度头晕。测量血压138/85mmHg，心率78次/分。协助患者取舒适卧位，指导低盐饮食注意事项。', signature: displayOrder.nurseInfo?.name || '王秀英' },
    { id: 'n2', time: '09:35', content: '执行伤口换药：右下肢胫前区陈旧性伤口，创面肉芽新鲜，无异常渗出。碘伏消毒后无菌敷料覆盖包扎固定。', signature: displayOrder.nurseInfo?.name || '王秀英' },
    { id: 'n3', time: '10:10', content: '指导患者进行床上被动肢体活动，协助翻身叩背。再次测量生命体征平稳，整理床单位，告知注意事项后离开。', signature: displayOrder.nurseInfo?.name || '王秀英' },
  ];

  const videoTS = [{ t: '00:00', l: '签到入场，核对患者信息' }, { t: '05:20', l: '生命体征首次测量' }, { t: '15:40', l: '伤口换药操作' }, { t: '38:10', l: '用药指导与确认' }, { t: '55:30', l: '健康宣教与签退' }];

  const materialTabs: TabsProps['items'] = [
    { key: 'video', label: <span className="flex items-center gap-1.5"><Video className="h-4 w-4" />服务录像</span>, children: (
      <div className="space-y-4">
        <div className="relative aspect-video rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
          <div className="relative z-10 flex flex-col items-center gap-3 text-white">
            <button className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><Play className="h-6 w-6 ml-1" fill="white" /></button>
            <p className="text-xs text-white/70">点击播放服务录像 (01:02:35)</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10"><div className="h-full w-3/5 bg-medical-500" /></div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <h4 className="mb-2 text-sm font-semibold flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-500" />关键时间点</h4>
          {videoTS.map((ts, i) => (
            <div key={i} className="flex items-start gap-2 rounded p-1.5 hover:bg-white">
              <span className="mt-0.5 rounded bg-medical-100 px-1.5 py-0.5 font-mono text-xs text-medical-700">{ts.t}</span>
              <span className="text-sm text-slate-700">{ts.l}</span>
            </div>
          ))}
        </div>
      </div>
    ) },
    { key: 'notes', label: <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" />护理记录</span>, children: (
      <List itemLayout="vertical" dataSource={notes} renderItem={n => (
        <List.Item key={n.id}>
          <div className="w-full rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <Tag color="blue" icon={<Clock className="h-3 w-3" />} className="!m-0 !text-xs">{n.time}</Tag>
              <span className="text-xs text-slate-500">签名: <i className="font-medium text-slate-700 not-italic">{n.signature}</i></span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{n.content}</p>
          </div>
        </List.Item>
      )} />
    ) },
    { key: 'medication', label: <span className="flex items-center gap-1.5"><Pill className="h-4 w-4" />用药清单</span>, children: <Table columns={medCols} dataSource={medData} pagination={false} /> },
    { key: 'vitals', label: <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />生命体征</span>, children: (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {[{ l: '体温', v: '36.5℃', c: 'bg-orange-50 text-orange-700' }, { l: '血压', v: '136/84', c: 'bg-red-50 text-red-700' }, { l: '心率', v: '77', c: 'bg-pink-50 text-pink-700' }, { l: 'SpO₂', v: '98%', c: 'bg-blue-50 text-blue-700' }].map(x => (
            <div key={x.l} className={cn('rounded-xl p-3 text-center text-xs', x.c)}><div className="opacity-70">{x.l}</div><div className="mt-0.5 text-base font-bold">{x.v}</div></div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 p-3"><ReactECharts option={vitalOption} style={{ height: 240 }} notMerge /></div>
      </div>
    ) },
  ];

  const stageCfg = AUDIT_STAGE_MAP[currentStage];

  return (
    <div className="space-y-5">
      <PageHeader showBack onBack={handleBack} title="审核工作台" description={`正在审核：${task?.orderNo || displayOrder.orderNo}`} icon={<CheckCircle className="h-6 w-6" />}
        actions={[{ key: 'pass', label: '审核通过', icon: <CheckCircle className="h-4 w-4" />, type: 'primary', onClick: handlePass }, { key: 'reject', label: '驳回', icon: <XCircle className="h-4 w-4" />, danger: true, onClick: handleReject }]} />

      <Card className="rounded-xl" bordered={false}>
        <div className="mb-4"><Steps current={stageIdx} status={task?.result === 'approved' ? 'finish' : task?.result === 'rejected' ? 'error' : 'process'}
          items={[{ title: '护士自检', subTitle: 'self-check', icon: <User className="h-5 w-5" /> }, { title: '机构质控', subTitle: 'quality-control', icon: <ShieldCheck className="h-5 w-5" /> }, { title: '平台巡检', subTitle: 'platform-check', icon: <CheckCircle className="h-5 w-5" /> }]} />
        </div>
        <Divider className="my-0" />
        <div className="pt-3">
          <Descriptions column={5} size="small" labelStyle={{ color: '#64748B', fontWeight: 500 }}>
            <Descriptions.Item label="订单号"><span className="font-mono font-medium">{displayOrder.orderNo}</span></Descriptions.Item>
            <Descriptions.Item label="患者"><div><span className="font-medium">{displayOrder.patientInfo?.name}</span><div className="text-xs text-slate-500">{displayOrder.patientInfo?.gender === 'male' ? '男' : '女'} · {displayOrder.patientInfo?.age}岁</div></div></Descriptions.Item>
            <Descriptions.Item label="类型"><PatientTypeTag type={displayOrder.patientType} size="sm" /></Descriptions.Item>
            <Descriptions.Item label="护士"><span className="font-medium">{displayOrder.nurseInfo?.name}</span></Descriptions.Item>
            <Descriptions.Item label="风险"><StatusBadge type="risk" status={displayOrder.riskLevel || 'low'} /></Descriptions.Item>
          </Descriptions>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="rounded-xl" bordered={false} styles={{ body: { paddingTop: 6 } }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={materialTabs} size="large" />
            <div className="flex justify-end pt-1"><Button type="primary" danger icon={<AlertTriangle className="h-4 w-4" />} onClick={handleMarkAbnormal}>标记异常</Button></div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-xl" bordered={false} title={<span className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-medical-600" />审核面板</span>}>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div><div className="text-xs text-slate-500">当前阶段</div><Tag className={cn('m-0 mt-1 border rounded-md px-2 py-0.5 text-xs', STAGE_BG[currentStage])}>{stageCfg.label}</Tag></div>
                <div className="text-right"><div className="text-xs text-slate-500">状态</div>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium mt-1',
                    task?.result === 'approved' ? 'bg-emerald-50 text-emerald-700' : task?.result === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', task?.result === 'approved' ? 'bg-emerald-500' : task?.result === 'rejected' ? 'bg-red-500' : 'bg-amber-500')} />
                    {task?.result === 'approved' ? '通过' : task?.result === 'rejected' ? '驳回' : '待审核'}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between"><h4 className="text-sm font-semibold">材料完整性</h4><span className="text-xs text-slate-500">{materialIntegrity.filter(i => i.pass).length}/5</span></div>
                {materialIntegrity.map(i => (
                  <div key={i.key} className="flex items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{i.label}</span>
                    {i.pass ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="h-3.5 w-3.5" />通过</span> : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3.5 w-3.5" />不通过</span>}
                  </div>
                ))}
              </div>

              <div>
                <h4 className="mb-1.5 text-sm font-semibold flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-medical-600" />审核意见</h4>
                <TextArea rows={3} placeholder="请填写审核意见..." value={auditRemark} onChange={e => setAuditRemark(e.target.value)} />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" />异常标记{abnormalList.length > 0 && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">{abnormalList.length}</span>}</h4>
                  {abnormalList.length > 0 && <span className="text-xs text-slate-500">悬停移除</span>}
                </div>
                {abnormalList.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">暂无异常标记</div> :
                  abnormalList.map(a => (
                    <div key={a.id} className="group relative rounded-xl border border-red-200 bg-red-50/70 p-2.5 mb-1.5">
                      <button onClick={() => setAbnormalList(p => p.filter(x => x.id !== a.id))} className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-red-400 opacity-0 hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                      <div className="flex items-center gap-1.5 mb-0.5"><Tag color="red" className="m-0 text-[10px]">{a.tabLabel}</Tag><span className="text-[11px] text-slate-500">{a.time}</span></div>
                      <p className="text-xs text-red-800 pr-5">{a.description}</p>
                    </div>
                  ))}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold flex items-center gap-1.5"><Clock className="h-4 w-4 text-medical-600" />审核历史</h4>
                <Timeline items={auditHistory.map(h => {
                  const sc = AUDIT_STAGE_MAP[h.stage];
                  return {
                    color: h.result === 'approved' ? 'green' : 'red',
                    dot: h.result === 'approved' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />,
                    children: (
                      <div className="rounded-lg bg-slate-50 p-2.5 -ml-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5"><Avatar size={20} style={{ backgroundColor: sc.color }} className="!h-5 !w-5 !text-[10px] !leading-5">{h.auditor.charAt(0)}</Avatar><span className="text-xs font-medium">{h.auditor}</span></div>
                          <Tag color={h.result === 'approved' ? 'success' : 'error'} className="!m-0 !text-[10px]">{h.result === 'approved' ? '通过' : '驳回'}</Tag>
                        </div>
                        <div className="text-[11px] text-slate-500 mb-1">{sc.label} · {formatDateTime(h.time)}</div>
                        <p className="text-xs text-slate-700">{h.remark}</p>
                      </div>
                    ),
                  };
                })} />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2.5">
            <Button type="primary" size="large" icon={<CheckCircle className="h-5 w-5" />} onClick={handlePass} className="!h-11 !text-sm">审核通过</Button>
            <Button danger size="large" icon={<XCircle className="h-5 w-5" />} onClick={handleReject} className="!h-11 !text-sm">驳回</Button>
          </div>
        </div>
      </div>

      <Modal title={<span className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />确认驳回审核</span>}
        open={rejectModalOpen} onOk={confirmReject} onCancel={() => setRejectModalOpen(false)} okText="确认驳回" okButtonProps={{ danger: true }} width={480}>
        <Alert type="warning" showIcon message="驳回后将退回至上一阶段重新处理" description="请务必填写详细的驳回原因。" className="mb-3" />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">驳回原因 <span className="text-red-500">*</span></label>
          <TextArea rows={3} placeholder="请详细说明驳回原因..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} maxLength={500} showCount />
        </div>
      </Modal>
    </div>
  );
}
