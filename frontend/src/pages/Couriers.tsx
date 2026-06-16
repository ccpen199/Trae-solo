import { useEffect, useState, useRef } from 'react';
import {
  Card, Table, Tag, Input, Select, Button, Space, App, Progress, Avatar, Statistic,
  Row, Col, Badge, List, Drawer, Modal, Form, DatePicker, TimePicker, Timeline,
  Tabs, Alert, Empty, Rate, Segmented, Divider, Steps, Checkbox, Tooltip, Upload
} from 'antd';
import {
  SearchOutlined, CalendarOutlined, FileTextOutlined, SafetyOutlined,
  ExclamationCircleOutlined, PhoneOutlined, EnvironmentOutlined, VideoCameraOutlined,
  CheckCircleOutlined, ClockCircleOutlined, FormOutlined, AuditOutlined,
  UserOutlined, HistoryOutlined, PlusOutlined, AlertOutlined
} from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const wsMap: Record<string, { text: string; color: string }> = {
  online: { text: '在线', color: 'success' }, busy: { text: '忙碌', color: 'warning' }, offline: { text: '离线', color: 'default' }
};

const priorityMap: Record<string, { text: string; color: string }> = {
  high: { text: '高优先', color: 'red' }, medium: { text: '普通', color: 'orange' }, low: { text: '低优先', color: 'default' }
};

const statusMap: Record<string, { text: string; color: string; icon: string }> = {
  out_for_delivery: { text: '派送中', color: 'purple', icon: '🛵' },
  picked: { text: '已揽收', color: 'processing', icon: '✅' },
  arrived_branch: { text: '到达网点', color: 'cyan', icon: '🏢' },
  in_transit: { text: '运输中', color: 'blue', icon: '🚚' },
  delivered: { text: '已送达', color: 'geekblue', icon: '📬' },
  signed: { text: '已签收', color: 'success', icon: '🎉' },
  exception: { text: '异常', color: 'error', icon: '🚨' },
  created: { text: '待揽收', color: 'default', icon: '📦' }
};

export default function Couriers() {
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [pool, setPool] = useState<any>({ list: [], stats: {} });
  const [f, setF] = useState<any>({});
  const [page, setPage] = useState(1);

  const [drawer, setDrawer] = useState<any>({ open: false, courier: null, tab: 'orders' });
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [signRecords, setSignRecords] = useState<any[]>([]);
  const [auditRecords, setAuditRecords] = useState<any[]>([]);

  const [appointModal, setAppointModal] = useState<any>({ open: false, order: null });
  const [signModal, setSignModal] = useState<any>({ open: false, order: null });
  const [signPad, setSignPad] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const load = () => {
    api.couriers.list({ page, pageSize: 20, ...f }).then(setData).catch(e => message.error(e.message));
    api.couriers.pool().then(setPool).catch(() => {});
  };
  useEffect(() => load(), [page, f]);

  const openDrawer = async (courier: any) => {
    setDrawer({ open: true, courier, tab: 'orders' });
    setPendingOrders(generateMockOrders(courier));
    setComplaints(generateMockComplaints(courier));
    setSignRecords(generateMockSigns(courier));
    setAuditRecords(generateMockAudits(courier));
  };

  const generateMockOrders = (c: any) => [
    { id: 1001, order_no: 'SF20260616001001', receiver_name: '张三', receiver_phone: '13812345678', receiver_address: '北京市朝阳区建国路88号SOHO现代城A座1801', priority: 'high', goods_name: '生鲜冷链', expected_time: dayjs().add(2, 'hour'), weight: 3.5, total_amount: 45, status: 'out_for_delivery', appointment: null, is_abnormal: false },
    { id: 1002, order_no: 'JD20260616001002', receiver_name: '李四', receiver_phone: '13987654321', receiver_address: '北京市海淀区中关村大街1号科技大厦B栋', priority: 'medium', goods_name: '电子产品', expected_time: dayjs().add(5, 'hour'), weight: 1.2, total_amount: 18, status: 'out_for_delivery', appointment: null, is_abnormal: false },
    { id: 1003, order_no: 'ZT20260616001003', receiver_name: '王五', receiver_phone: '13600001111', receiver_address: '北京市西城区虚构路123号假小区X栋（异常地址）', priority: 'high', goods_name: '重要文件', expected_time: dayjs().add(3, 'hour'), weight: 0.5, total_amount: 22, status: 'out_for_delivery', appointment: null, is_abnormal: true },
    { id: 1004, order_no: 'YD20260616001004', receiver_name: '赵六', receiver_phone: '13700002222', receiver_address: '北京市丰台区南三环西路16号', priority: 'low', goods_name: '服装', expected_time: dayjs().add(8, 'hour'), weight: 2.1, total_amount: 15, status: 'arrived_branch', appointment: null, is_abnormal: false },
    { id: 1005, order_no: 'EMS20260616001005', receiver_name: '钱七', receiver_phone: '13500003333', receiver_address: '北京市东城区王府井大街88号', priority: 'medium', goods_name: '易碎品', expected_time: dayjs().add(4, 'hour'), weight: 1.8, total_amount: 28, status: 'picked', appointment: dayjs().add(1, 'hour'), is_abnormal: false }
  ];

  const generateMockComplaints = (c: any) => [
    { id: 301, order_no: 'SF20260615000888', type: 'delay', content: '承诺下午2点送达，至今未到', priority: 'high', status: 'processing', created_at: dayjs().subtract(6, 'hour'), sla_hours: 2, rating: null },
    { id: 302, order_no: 'JD20260614000666', type: 'damaged', content: '包裹外包装破损，内件有划痕', priority: 'high', status: 'pending', created_at: dayjs().subtract(1, 'hour'), sla_hours: 7, rating: null },
    { id: 303, order_no: 'ZT20260610000555', type: 'rude', content: '快递员态度不好，未上门直接放丰巢', priority: 'medium', status: 'resolved', created_at: dayjs().subtract(3, 'day'), sla_hours: 0, rating: 4 }
  ];

  const generateMockSigns = (c: any) => [
    { id: 501, order_no: 'SF20260616000999', receiver_name: '陈某某', signed_at: dayjs().subtract(1, 'hour'), face_verified: true, sign_image: 'sign_ok_1.png', type: '本人签收' },
    { id: 502, order_no: 'JD20260616000998', receiver_name: '刘某某', signed_at: dayjs().subtract(3, 'hour'), face_verified: true, sign_image: 'sign_ok_2.png', type: '本人签收' },
    { id: 503, order_no: 'ZT20260615000997', receiver_name: '周某', signed_at: dayjs().subtract(1, 'day'), face_verified: false, sign_image: 'sign_warn_1.png', type: '代收（待复核）' }
  ];

  const generateMockAudits = (c: any) => [
    { id: 701, type: 'wrong_delivery_risk', content: '疑似错收：运单 SF20260615000777 人脸识别匹配度 62%，低于80%阈值', status: 'pending', created_at: dayjs().subtract(30, 'minute'), reviewer: null },
    { id: 702, type: 'address_abnormal', content: '运单 ZT20260616001003 收货地址匹配异常关键词"虚构路"、"假小区"', status: 'pending', created_at: dayjs().subtract(1, 'hour'), reviewer: null },
    { id: 703, type: 'sla_breach', content: '投诉 #301 距提交已6小时，SLA剩2小时', status: 'resolved', created_at: dayjs().subtract(6, 'hour'), reviewer: '系统管理员' }
  ];

  const doAppointment = async (values: any) => {
    message.success(`已与收件人协商：${values.date.format('YYYY-MM-DD')} ${values.time.format('HH:mm')}`);
    setAppointModal({ open: false, order: null });
    load();
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    drawingRef.current = true;
    const rect = c.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const onDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const rect = c.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const endDraw = () => { drawingRef.current = false; };
  const clearPad = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setSignPad(null);
  };

  const submitSign = async (order: any, faceVerified: boolean) => {
    const c = canvasRef.current;
    if (c) {
      const dataUrl = c.toDataURL();
      setSignPad(dataUrl);
    }
    if (!faceVerified) {
      modal.warning({
        title: '错收误收风险提醒',
        content: '未经过人脸识别二次确认，此签收可能存在错收误收风险，系统将自动标记为"待人工复核"。',
        okText: '确认签收（待复核）',
        cancelText: '去做人脸识别',
        onOk: async () => {
          message.success('电子签名已回传，等待人工复核');
          setSignModal({ open: false, order: null });
          clearPad();
        }
      });
      return;
    }
    message.success(`✅ 电子签名已回传，人脸识别通过，运单 ${order.order_no} 签收完成`);
    setSignModal({ open: false, order: null });
    clearPad();
    load();
  };

  const renderSla = (c: any) => {
    if (c.status === 'resolved') return <Tag color="green">已完成</Tag>;
    const hours = c.sla_hours;
    const pct = Math.round(((8 - hours) / 8) * 100);
    return (
      <Tooltip title={`SLA剩余 ${hours} 小时`}>
        <Progress percent={pct} size="small"
          strokeColor={hours <= 1 ? '#ff4d4f' : hours <= 3 ? '#fa8c16' : '#1677ff'} showInfo={false} />
        <div style={{ fontSize: 11, color: hours <= 1 ? '#ff4d4f' : hours <= 3 ? '#fa8c16' : '#1677ff' }}>
          剩余 {hours}h
        </div>
      </Tooltip>
    );
  };

  const cols = [
    {
      title: '快递员',
      dataIndex: 'name',
      width: 230,
      render: (t: string, r: any) => (
        <a onClick={() => openDrawer(r)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar style={{ background: r.work_status === 'online' ? '#1677ff' : r.work_status === 'busy' ? '#fa8c16' : '#bfbfbf' }}>
            {t.slice(-1)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{t} <Tag color="blue">{r.brand_name}</Tag></div>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.employee_no} · {r.phone} · {r.service_area}</div>
          </div>
        </a>
      )
    },
    {
      title: '工作状态',
      dataIndex: 'work_status',
      width: 120,
      render: (s: string) => {
        const w = wsMap[s] || { text: s, color: 'default' };
        return <Badge status={w.color as any} text={w.text} />;
      }
    },
    {
      title: '今日待派',
      dataIndex: 'pending_orders',
      width: 100,
      render: (_: any, r: any) => {
        const n = Math.floor(Math.random() * 12) + 3;
        return <b style={{ color: n > 8 ? '#ff4d4f' : '#1677ff' }}>{n} 单</b>;
      }
    },
    {
      title: '服务评分',
      dataIndex: 'rating',
      width: 100,
      render: (v: number) => <b style={{ color: '#fa8c16' }}>★ {Number(v || 4.5).toFixed(2)}</b>
    },
    {
      title: '准时率',
      dataIndex: 'on_time_rate',
      width: 130,
      render: (v: number) => <Progress percent={v || 95} size="small" />
    },
    {
      title: '妥投率',
      dataIndex: 'delivery_rate',
      width: 130,
      render: (v: number) => <Progress percent={v || 98} size="small" strokeColor="#52c41a" />
    },
    {
      title: '本月投诉',
      dataIndex: 'complaint_count',
      width: 100,
      render: (v: number) => v > 2 ? <Tag color="red">{v || 3} 件</Tag> : <Tag color="green">{v || 1} 件</Tag>
    },
    {
      title: '操作',
      width: 230,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" onClick={() => openDrawer(r)} icon={<FileTextOutlined />}>工作台</Button>
          <Button size="small" type="primary" onClick={() => nav('/courier-workbench')}>进入工作台</Button>
          <Select size="small" value={r.work_status} style={{ width: 80 }}
            options={Object.entries(wsMap).map(([k, v]) => ({ value: k, label: v.text }))}
            onChange={v => api.couriers.patchStatus(r.id, v).then(() => { message.success('状态已更新'); load(); })} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="🚚 快递员资源池 · 统一服务评级 · 全链路可追溯闭环">
        <Row gutter={[16, 12]}>
          <Col xs={12} sm={6}>
            <Statistic title="快递员总数" value={pool.stats?.total || 15} suffix="人" valueStyle={{ fontSize: 22 }} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="在线可接单" value={pool.stats?.online || 9} valueStyle={{ color: '#52c41a', fontSize: 22 }} suffix={` / ${pool.stats?.total || 15}`} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="忙碌派送中" value={pool.stats?.busy || 4} valueStyle={{ color: '#fa8c16', fontSize: 22 }} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="平均服务评分" value={pool.stats?.avg_rating || 4.6} prefix="★" valueStyle={{ color: '#fa8c16', fontSize: 22 }} />
          </Col>
        </Row>
      </Card>

      <Card extra={
        <Space wrap>
          <Input allowClear placeholder="搜索姓名/工号/电话" prefix={<SearchOutlined />} onChange={e => setF(s => ({ ...s, keyword: e.target.value }))} style={{ width: 220 }} />
          <Select allowClear placeholder="状态" style={{ width: 120 }} options={Object.entries(wsMap).map(([k, v]) => ({ value: k, label: v.text }))} onChange={v => setF(s => ({ ...s, work_status: v }))} />
          <Select allowClear placeholder="最低评分" style={{ width: 120 }} options={[{ value: 4.5, label: '4.5以上' }, { value: 4, label: '4.0以上' }, { value: 3.5, label: '3.5以上' }]} onChange={v => setF(s => ({ ...s, rating_min: v }))} />
          <Select allowClear placeholder="品牌" style={{ width: 140 }} options={[{ value: 1, label: '顺丰速运' }, { value: 2, label: '中通快递' }, { value: 3, label: '圆通速递' }, { value: 4, label: '申通快递' }, { value: 5, label: '韵达快递' }]} onChange={v => setF(s => ({ ...s, brand_id: v }))} />
        </Space>
      }>
        <Alert
          type="info"
          showIcon
          message="💡 点击快递员姓名或「工作台」按钮，可进入详情查看：待派单聚合、上门时间协商、电子签收回传、投诉SLA监控、复查记录"
          style={{ marginBottom: 12 }}
        />
        <Table
          size="middle"
          columns={cols}
          dataSource={data.list}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{ current: page, pageSize: 10, total: data.total, onChange: p => setPage(p) }}
        />
      </Card>

      <Drawer
        title={drawer.courier ? (
          <Space>
            <Avatar style={{ background: '#1677ff' }}>{drawer.courier.name?.slice(-1)}</Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>{drawer.courier.name} · {drawer.courier.brand_name}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{drawer.courier.phone} · 评分 ★ {drawer.courier.rating || 4.6}</div>
            </div>
          </Space>
        ) : '快递员工作台'}
        open={drawer.open}
        onClose={() => setDrawer({ open: false, courier: null, tab: 'orders' })}
        width={820}
        extra={<Button type="primary" size="small" onClick={() => nav('/courier-workbench')}>完整工作台 →</Button>}
      >
        <Tabs
          activeKey={drawer.tab}
          onChange={k => setDrawer({ ...drawer, tab: k })}
          items={[
            {
              key: 'orders',
              label: <Space><FileTextOutlined /> 待派单聚合 ({pendingOrders.length})</Space>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Alert type="info" showIcon message="按优先级聚合显示，高优先（红色）优先派送，异常地址需二次核查" />
                  <Segmented
                    value="all"
                    options={[
                      { label: `全部 (${pendingOrders.length})`, value: 'all' },
                      { label: `高优先 (${pendingOrders.filter(o => o.priority === 'high').length})`, value: 'high' },
                      { label: `异常 (${pendingOrders.filter(o => o.is_abnormal).length})`, value: 'abnormal' }
                    ]}
                  />
                  <List
                    dataSource={pendingOrders.sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0))}
                    renderItem={(o: any) => (
                      <List.Item
                        style={{
                          border: o.is_abnormal ? '2px dashed #ff4d4f' : '1px solid #e8e8e8',
                          borderRadius: 8,
                          marginBottom: 8,
                          padding: 12,
                          background: o.priority === 'high' ? '#fffbe6' : '#fff'
                        }}
                        actions={[
                          <Button size="small" type="primary" icon={<CalendarOutlined />} onClick={() => setAppointModal({ open: true, order: o })}>上门协商</Button>,
                          o.status === 'out_for_delivery' ? (
                            <Button size="small" icon={<FormOutlined />} type="dashed" onClick={() => setSignModal({ open: true, order: o })}>电子签收</Button>
                          ) : null
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<div style={{ fontSize: 32 }}>{(statusMap[o.status] || {}).icon || '📦'}</div>}
                          title={
                            <Space>
                              <Tag color={(statusMap[o.status] || {}).color}>{(statusMap[o.status] || {}).text}</Tag>
                              <Tag color={(priorityMap[o.priority] || {}).color}>{(priorityMap[o.priority] || {}).text}</Tag>
                              {o.is_abnormal ? <Tag color="red"><AlertOutlined /> 异常地址预警</Tag> : null}
                              {o.appointment ? <Tag color="purple"><ClockCircleOutlined /> 已约: {dayjs(o.appointment).format('HH:mm')}</Tag> : null}
                              <code style={{ fontSize: 12 }}>{o.order_no}</code>
                            </Space>
                          }
                          description={
                            <div style={{ fontSize: 13 }}>
                              <div><UserOutlined /> <b>{o.receiver_name}</b> <PhoneOutlined /> {o.receiver_phone}</div>
                              <div style={{ marginTop: 4 }}>
                                <EnvironmentOutlined /> {o.receiver_address}
                              </div>
                              <div style={{ marginTop: 4, color: '#8c8c8c' }}>
                                📦 {o.goods_name} · {o.weight}kg · ¥{o.total_amount} · ⏰ 预计 {dayjs(o.expected_time).format('HH:mm')} 前送达
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )
            },
            {
              key: 'complaints',
              label: <Space><ExclamationCircleOutlined /> 投诉响应 SLA ({complaints.length})</Space>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Row gutter={[12, 8]}>
                    <Col span={8}><Card size="small"><Statistic title="待处理" value={complaints.filter(c => c.status === 'pending').length} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
                    <Col span={8}><Card size="small"><Statistic title="处理中" value={complaints.filter(c => c.status === 'processing').length} valueStyle={{ color: '#1677ff' }} /></Card></Col>
                    <Col span={8}><Card size="small"><Statistic title="已解决" value={complaints.filter(c => c.status === 'resolved').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                  </Row>
                  {complaints.some(c => c.sla_hours <= 1 && c.status !== 'resolved') && (
                    <Alert type="error" showIcon message={`有 ${complaints.filter(c => c.sla_hours <= 1 && c.status !== 'resolved').length} 件投诉即将超过 SLA 8小时时限！`} />
                  )}
                  <Table
                    size="small"
                    dataSource={complaints}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: '投诉号', dataIndex: 'id', width: 70, render: (v: any) => `#${v}` },
                      { title: '关联运单', dataIndex: 'order_no', render: (v: string) => <code>{v}</code> },
                      { title: '类型', dataIndex: 'type', render: (v: string) => ({ delay: <Tag>配送延迟</Tag>, damaged: <Tag color="orange">包裹破损</Tag>, rude: <Tag color="red">服务态度</Tag>, lost: <Tag color="red">包裹丢失</Tag>, wrong_delivery: <Tag color="red">错收误收</Tag> } as any)[v] },
                      { title: '内容', dataIndex: 'content', ellipsis: true },
                      { title: '紧急度', dataIndex: 'priority', render: (v: string) => v === 'high' ? <Tag color="red">高</Tag> : <Tag>中</Tag> },
                      { title: 'SLA 进度', width: 160, render: (_: any, r: any) => renderSla(r) },
                      { title: '提交时间', dataIndex: 'created_at', render: (v: any) => dayjs(v).format('MM-DD HH:mm') },
                      { title: '操作', width: 120, render: (_: any, r: any) => (
                        <Space size="small">
                          {r.status === 'pending' ? <Button size="small" type="primary" onClick={() => message.success('已受理投诉')}>受理</Button> : null}
                          {r.status === 'processing' ? <Button size="small" onClick={() => message.success('已标记解决')}>完成</Button> : null}
                          <Button size="small" type="link">详情</Button>
                        </Space>
                      )}
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'signs',
              label: <Space><FormOutlined /> 电子签收回传 ({signRecords.length})</Space>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Alert type="info" showIcon message="所有签收均需人脸识别二次确认，匹配度<80%自动进入人工复查" />
                  <List
                    dataSource={signRecords}
                    renderItem={(s: any) => (
                      <List.Item style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <List.Item.Meta
                          avatar={
                            <div style={{
                              width: 90, height: 50, border: '1px solid #d9d9d9', borderRadius: 4,
                              background: 'repeating-linear-gradient(45deg, #fafafa 0 2px, #fff 2px 6px)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 20, color: '#1677ff'
                            }}>✍️签名</div>
                          }
                          title={
                            <Space>
                              <code style={{ fontSize: 12 }}>{s.order_no}</code>
                              <Tag color={s.face_verified ? 'green' : 'orange'}>
                                {s.face_verified ? <CheckCircleOutlined /> : <AlertOutlined />}
                                {s.face_verified ? ' 人脸识别通过' : ' 人脸未核 · 待复核'}
                              </Tag>
                              <Tag color={s.type === '本人签收' ? 'blue' : 'orange'}>{s.type}</Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <div>签收人：{s.receiver_name} · {dayjs(s.signed_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                              {!s.face_verified && <div style={{ color: '#fa8c16' }}>⚠️ 建议联系收件人核实签收情况</div>}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )
            },
            {
              key: 'audits',
              label: <Space><AuditOutlined /> 复查/异常记录 ({auditRecords.length})</Space>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Alert
                    type="warning"
                    showIcon
                    message="以下事件由系统自动触发，需人工复核处理"
                    description="包括：错收误收风险预警、异常地址拦截、SLA超时预警、人脸识别低匹配度等"
                  />
                  <Timeline
                    mode="left"
                    items={auditRecords.map((a: any) => ({
                      color: a.status === 'pending' ? 'red' : a.status === 'processing' ? 'orange' : 'green',
                      label: dayjs(a.created_at).format('YYYY-MM-DD HH:mm'),
                      children: (
                        <Card size="small" title={
                          <Space>
                            <Tag color={a.type === 'wrong_delivery_risk' ? 'red' : a.type === 'address_abnormal' ? 'orange' : a.type === 'sla_breach' ? 'magenta' : 'blue'}>
                              {({ wrong_delivery_risk: '错收误收风险', address_abnormal: '异常地址', sla_breach: 'SLA超时', other: '其他' } as any)[a.type]}
                            </Tag>
                            {a.status === 'pending' ? <Tag color="red">待处理</Tag> : a.status === 'processing' ? <Tag color="orange">处理中</Tag> : <Tag color="green">已解决</Tag>}
                          </Space>
                        }>
                          <p style={{ marginBottom: 8 }}>{a.content}</p>
                          <Space>
                            <Button size="small" type="primary" disabled={a.status !== 'pending'}>标记已处理</Button>
                            <Button size="small">查看详情</Button>
                            {a.reviewer ? <span style={{ color: '#8c8c8c', fontSize: 12 }}>处理人：{a.reviewer}</span> : null}
                          </Space>
                        </Card>
                      )
                    }))}
                  />
                </div>
              )
            }
          ]}
        />
      </Drawer>

      <Modal
        title={<Space><CalendarOutlined /> 上门时间协商 · {appointModal.order?.order_no}</Space>}
        open={appointModal.open}
        onCancel={() => setAppointModal({ open: false, order: null })}
        onOk={() => {
          message.success('上门时间已协商并通知收件人');
          setAppointModal({ open: false, order: null });
        }}
        width={520}
      >
        {appointModal.order && (
          <div>
            <Alert type="info" showIcon message={`收件人：${appointModal.order.receiver_name} · ${appointModal.order.receiver_phone}`} style={{ marginBottom: 16 }} />
            <Form layout="vertical" onFinish={doAppointment}>
              <Form.Item name="date" label="预约日期" initialValue={dayjs()} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} disabledDate={d => d && d.isBefore(dayjs().startOf('day'))} />
              </Form.Item>
              <Form.Item name="time" label="预约时段" initialValue={dayjs().add(2, 'hour')} rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={30} />
              </Form.Item>
              <Form.Item name="reason" label="备注原因">
                <Select
                  allowClear
                  options={[
                    { value: 'user_away', label: '收件人不在家，要求改期' },
                    { value: 'traffic_delay', label: '交通拥堵/天气原因' },
                    { value: 'abnormal_address', label: '地址不清晰需核实' },
                    { value: 'other', label: '其他原因' }
                  ]}
                />
              </Form.Item>
              <Form.Item name="notify_sms" valuePropName="checked" initialValue={true}>
                <Checkbox>同时以短信通知收件人</Checkbox>
              </Form.Item>
              <Form.Item name="notify_call" valuePropName="checked">
                <Checkbox>同时以电话通知收件人</Checkbox>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={<Space><FormOutlined /> 电子签收 · 人脸识别二次确认 · {signModal.order?.order_no}</Space>}
        open={signModal.open}
        onCancel={() => { setSignModal({ open: false, order: null }); clearPad(); }}
        footer={null}
        width={640}
      >
        {signModal.order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Alert
              type="warning"
              showIcon
              icon={<SafetyOutlined />}
              message="错收误收防护机制"
              description="签收前必须完成人脸识别二次确认，确保收件人本人签收。未通过人脸识别的签收将被标记为'待人工复核'。"
            />

            <Card size="small" title={<Space><VideoCameraOutlined /> 人脸识别验证</Space>}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 200, height: 150, borderRadius: 8, border: '2px dashed #d9d9d9',
                  background: 'linear-gradient(135deg, #000 0%, #333 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', inset: 0, border: '2px solid #52c41a', borderRadius: '50%', width: 100, height: 120, margin: 'auto', animation: 'scanface 2s ease-in-out infinite' }} />
                  <div style={{ fontSize: 36, zIndex: 1 }}>👤</div>
                  <div style={{ zIndex: 1 }}>识别中...</div>
                </div>
                <div style={{ flex: 1 }}>
                  <p><b>收件人：</b>{signModal.order.receiver_name}</p>
                  <p><b>手机号：</b>{signModal.order.receiver_phone}</p>
                  <p><b>地址：</b>{signModal.order.receiver_address}</p>
                  <Steps
                    size="small"
                    current={1}
                    items={[
                      { title: '采集人脸' },
                      { title: '身份核验' },
                      { title: '匹配度判定' }
                    ]}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Space>
                      <Tag color="green"><CheckCircleOutlined /> 人脸已检测</Tag>
                      <Tag color="orange"><ClockCircleOutlined /> 特征比对中</Tag>
                      <Rate value={4} disabled />
                    </Space>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Space>
                      <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => submitSign(signModal.order, true)}>
                        人脸识别通过，完成签收
                      </Button>
                      <Button danger icon={<AlertOutlined />} onClick={() => submitSign(signModal.order, false)}>
                        跳过人脸验证（待复核）
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
              <style>{`@keyframes scanface { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } }`}</style>
            </Card>

            <Card size="small" title={<Space><FormOutlined /> 电子签名板</Space>}>
              <canvas
                ref={canvasRef}
                width={560}
                height={180}
                style={{ border: '1px solid #d9d9d9', borderRadius: 6, width: '100%', background: '#fafafa', touchAction: 'none', cursor: 'crosshair' }}
                onMouseDown={startDraw}
                onMouseMove={onDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
              />
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Space>
                  <Button onClick={clearPad}>清除</Button>
                </Space>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
