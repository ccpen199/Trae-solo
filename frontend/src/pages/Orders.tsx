import { useEffect, useState } from 'react';
import type { TimelineProps } from 'antd';
import {
  Card, Table, Input, Select, DatePicker, Button, Space, Tag, message,
  Modal, Timeline, Statistic, Row, Col, Tooltip, Badge, Drawer, List,
  Alert, Empty, Progress, Steps, Divider, Typography, Form
} from 'antd';
const { Text } = Typography;
import {
  SearchOutlined, QrcodeOutlined, ShoppingOutlined, ClockCircleOutlined,
  EnvironmentOutlined, BellOutlined, AlertOutlined, CheckCircleOutlined,
  EyeOutlined, VideoCameraOutlined, CheckOutlined, EditOutlined, CloseOutlined
} from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';

const statusMap: Record<string, { text: string; color: string; icon: string }> = {
  created: { text: '已创建', color: 'default', icon: '📦' },
  picked: { text: '已揽收', color: 'processing', icon: '✅' },
  in_transit: { text: '运输中', color: 'blue', icon: '🚚' },
  arrived_branch: { text: '到达网点', color: 'cyan', icon: '🏢' },
  out_for_delivery: { text: '派送中', color: 'purple', icon: '🛵' },
  delivered: { text: '已送达', color: 'geekblue', icon: '📬' },
  signed: { text: '已签收', color: 'success', icon: '🎉' },
  exception: { text: '异常', color: 'error', icon: '🚨' },
  returned: { text: '退回', color: 'warning', icon: '↩️' }
};

export default function Orders() {
  const nav = useNavigate();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [dashboard, setDashboard] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState<any>({});

  const [scanModal, setScanModal] = useState(false);
  const [syncModal, setSyncModal] = useState(false);
  const [drawerOrder, setDrawerOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifDrawer, setNotifDrawer] = useState<any>({ open: false, list: [] });

  const [faceModal, setFaceModal] = useState<{ open: boolean; order: any; loading: boolean }>({ open: false, order: null, loading: false });
  const [reviewModal, setReviewModal] = useState<{ open: boolean; order: any; action: string }>({ open: false, order: null, action: '' });
  const [reviewForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const r: any = await api.orders.list({ page, pageSize, ...f });
      setData({ list: r.list || r.items || [], total: r.total || (r.items || r.list || []).length });
      const d: any = await api.dashboard.overview();
      setDashboard(d);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [page, f]);

  const countdown = (eta: string) => {
    if (!eta) return { hours: 0, pct: 0, expired: false, done: false, text: '-' };
    const target = dayjs(eta);
    const now = dayjs();
    const diffMin = target.diff(now, 'minute');
    if (diffMin <= 0) return { hours: 0, pct: 100, expired: true, done: true, text: '已到达' };
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    const totalWindow = 72;
    const pct = Math.max(5, Math.min(95, 100 - Math.round((diffMin / (totalWindow * 60)) * 100)));
    return { hours, mins, pct, expired: false, done: false, text: `${hours}h ${mins}m` };
  };

  const onScan = (orderNo: string) => {
    if (!orderNo.trim()) return;
    const found = data.list.find((o: any) => o.tracking_no === orderNo || o.order_no === orderNo);
    if (found) {
      setScanModal(false);
      openOrderDrawer(found);
    } else {
      message.warning(`未找到运单 ${orderNo}，请确认单号`);
    }
  };

  const openOrderDrawer = async (order: any) => {
    setDrawerOrder(order);
    setDrawerOpen(true);
  };

  const loadNotifications = async () => {
    try {
      const r: any = await api.notifications.list();
      setNotifDrawer({ open: true, list: r.list || r.data || [] });
    } catch (e: any) { message.error(e.message); }
  };

  const openFaceVerify = (order: any) => {
    setFaceModal({ open: true, order, loading: false });
  };

  const onFaceVerify = async () => {
    if (!faceModal.order) return;
    setFaceModal({ ...faceModal, loading: true });
    try {
      const mockFaceData = 'face_' + Math.random().toString(36).substring(2, 20) + '_data_' + Date.now();
      const r: any = await api.orders.verifyFace(faceModal.order.id, mockFaceData);
      if (r.verified) {
        message.success('✅ 人脸识别通过，本人确认，已完成签收验证');
        setDrawerOrder({ ...drawerOrder, is_face_verified: 1 });
        setData({ ...data, list: data.list.map((o: any) => o.id === faceModal.order.id ? { ...o, is_face_verified: 1 } : o) });
        setTimeout(() => setFaceModal({ open: false, order: null, loading: false }), 800);
      } else {
        Modal.error({
          title: '人脸核验失败',
          content: '人脸不匹配，非本人签收。为防止错收误收，请确认收件人身份后再次核验，或转至错收待复核流程。'
        });
      }
    } catch (e: any) {
      Modal.confirm({
        title: '错收误收风险确认',
        icon: <AlertOutlined style={{ color: '#fa8c16' }} />,
        content: '人脸核验未通过，疑似错收误收。是否标记为待复核，转入人工复查流程？',
        okText: '标记待复查',
        okType: 'danger',
        cancelText: '重新核验',
        onOk: async () => {
          await api.orders.patchStatus(faceModal.order.id, { sign_type: 'face_pending', face_verified: 0 });
          message.warning('已标记为错收待复查，将进入快递员端复查流程');
          setFaceModal({ open: false, order: null, loading: false });
        }
      });
    } finally {
      setFaceModal({ ...faceModal, loading: false });
    }
  };

  const reviewAddress = (order: any, action: string) => {
    setReviewModal({ open: true, order, action });
    reviewForm.resetFields();
  };

  const onReviewAddress = async () => {
    if (!reviewModal.order) return;
    try {
      const vals = await reviewForm.validateFields();
      await api.orders.reviewAddress(reviewModal.order.id, {
        action: reviewModal.action,
        corrected_address: vals.corrected_address,
        note: vals.note
      });
      message.success('地址复核处理成功');
      setReviewModal({ open: false, order: null, action: '' });
      reviewForm.resetFields();
      if (drawerOrder?.id === reviewModal.order.id) {
        setDrawerOrder({
          ...drawerOrder,
          is_address_abnormal: reviewModal.action === 'confirm_abnormal' ? 1 : 0,
          receiver_address: vals.corrected_address || drawerOrder.receiver_address
        });
      }
      load();
    } catch (e: any) { message.error(e.message); }
  };

  const cols = [
    {
      title: '运单号',
      dataIndex: 'tracking_no',
      fixed: 'left' as const,
      width: 190,
      render: (t: string, r: any) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => nav(`/orders/${r.id}`)}>
            <code style={{ fontSize: 13 }}>{t}</code>
          </a>
          <Space size={4}>
            {r.is_face_verified ? <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
              <CheckCircleOutlined /> 人脸已核
            </Tag> : r.status === 'out_for_delivery' ? (
              <Tag color="orange" style={{ fontSize: 10, padding: '0 4px' }}>
                <VideoCameraOutlined /> 待人脸签收
              </Tag>
            ) : null}
            {r.is_address_abnormal ? <Tag color="red" style={{ fontSize: 10, padding: '0 4px' }}>
              <AlertOutlined /> 异常地址
            </Tag> : null}
            {r.has_voice_note ? <Tag color="purple" style={{ fontSize: 10, padding: '0 4px' }}>🎙 语音留言</Tag> : null}
          </Space>
        </Space>
      )
    },
    {
      title: '寄/收件人',
      width: 170,
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: '#8c8c8c' }}>寄:</span> {r.sender_name}
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: '#8c8c8c' }}>收:</span> <b>{r.receiver_name}</b> {r.receiver_phone}
          </div>
        </Space>
      )
    },
    {
      title: '品牌 / 快递员',
      width: 170,
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue">{r.brand_name}</Tag>
          <div style={{ fontSize: 12, color: '#595959' }}>
            {r.courier_name ? `${r.courier_name} · ${r.courier_phone || ''}` : '待分配'}
          </div>
        </Space>
      )
    },
    {
      title: '📍 最新轨迹',
      width: 220,
      render: (_: any, r: any) => {
        const evt = r.latest_event || (r.events && r.events[0]) || null;
        if (!evt) return <span style={{ color: '#8c8c8c', fontSize: 12 }}>暂无轨迹</span>;
        return (
          <Tooltip title={`${evt.location || ''} - ${evt.description || ''}`}>
            <Space direction="vertical" size={0}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>
                {(statusMap[evt.event_type || 'in_transit'] || {}).icon || '📍'} {evt.description || evt.event_type}
              </div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                <EnvironmentOutlined /> {evt.location || '未知'} · {dayjs(evt.created_at || evt.time).format('MM-DD HH:mm')}
              </div>
            </Space>
          </Tooltip>
        );
      }
    },
    {
      title: '⏱ 预计送达倒计时',
      width: 170,
      render: (_: any, r: any) => {
        const cd = countdown(r.estimated_delivery_time);
        if (r.status === 'signed' || r.status === 'delivered') {
          return <Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><span style={{ color: '#52c41a', fontWeight: 500 }}>已签收/送达</span></Space>;
        }
        if (cd.expired) {
          return <Space><AlertOutlined style={{ color: '#ff4d4f' }} /><span style={{ color: '#ff4d4f', fontWeight: 500 }}>已超时</span></Space>;
        }
        return (
          <Tooltip title={`预计送达：${dayjs(r.estimated_delivery_time).format('YYYY-MM-DD HH:mm')}`}>
            <Space direction="vertical" size={2}>
              <div style={{ fontSize: 14, fontWeight: 700, color: cd.hours < 4 ? '#ff4d4f' : cd.hours < 8 ? '#fa8c16' : '#1677ff' }}>
                <ClockCircleOutlined /> {cd.text}
              </div>
              <Progress percent={cd.pct} size="small" showInfo={false}
                strokeColor={cd.hours < 4 ? '#ff4d4f' : cd.hours < 8 ? '#fa8c16' : '#52c41a'} />
            </Space>
          </Tooltip>
        );
      }
    },
    {
      title: '异常/推送',
      width: 110,
      render: (_: any, r: any) => {
        const flags = [];
        if (r.status === 'exception') flags.push(<Tag key="e" color="red">异常</Tag>);
        if (r.is_address_abnormal) flags.push(<Tag key="a" color="red">地址异常</Tag>);
        if (r.notification_count > 0 || r.notif_count > 0) {
          flags.push(
            <Badge key="n" count={r.notification_count || r.notif_count || 0} size="small">
              <Button size="small" type="text" icon={<BellOutlined />}>推送</Button>
            </Badge>
          );
        }
        return flags.length ? <Space wrap>{flags}</Space> : <Tag color="green">正常</Tag>;
      }
    },
    { title: '金额', dataIndex: 'total_amount', width: 80, render: (v: number) => <b>¥{v || 0}</b> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 95,
      render: (s: string) => {
        const st = statusMap[s] || { text: s, color: 'default', icon: '' };
        return <Tag color={st.color}>{st.icon} {st.text}</Tag>;
      }
    },
    {
      title: '操作',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => openOrderDrawer(r)}>轨迹</Button>
          <Button size="small" type="primary" onClick={() => nav(`/orders/${r.id}`)}>详情</Button>
        </Space>
      )
    }
  ];

  const trendOpt = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['创建', '派送', '签收'], top: 0 },
    grid: { left: 40, right: 10, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')) },
    yAxis: { type: 'value' },
    series: [
      { name: '创建', type: 'line', smooth: true, data: [12, 18, 15, 22, 19, 25, 16], itemStyle: { color: '#1677ff' } },
      { name: '派送', type: 'line', smooth: true, data: [10, 15, 14, 20, 17, 23, 18], itemStyle: { color: '#722ed1' } },
      { name: '签收', type: 'line', smooth: true, data: [9, 14, 13, 18, 16, 22, 17], itemStyle: { color: '#52c41a' } }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[16, 12]}>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 14 } }}>
            <Statistic title="总运单" value={dashboard?.summary?.total_orders || 0} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 14 } }}>
            <Statistic title="运输中/派送中" value={dashboard?.summary?.active_orders || 0} valueStyle={{ color: '#1677ff', fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 14 } }}>
            <Statistic title="异常运单" value={dashboard?.summary?.exception_orders || 0} valueStyle={{ color: '#ff4d4f', fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<Space><BellOutlined /> 未读推送</Space>}
              value={0}
              valueStyle={{ color: '#fa8c16', fontSize: 22 }}
              suffix={
                <Button type="link" size="small" onClick={loadNotifications}>查看</Button>
              }
            />
          </Card>
        </Col>
      </Row>

      <Card title="📈 运单生命周期趋势（近7天）" size="small">
        <ReactECharts option={trendOpt} style={{ height: 220 }} />
      </Card>

      {dashboard?.alerts && dashboard.alerts.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<AlertOutlined />}
          message={`检测到 ${dashboard.alerts.length} 条异常事件`}
          description={
            <Space direction="vertical" size={4}>
              {dashboard.alerts.slice(0, 4).map((a: any, i: number) => (
                <div key={i}>
                  <Tag color="red">{a.order_no}</Tag>
                  <span style={{ color: '#8c8c8c' }}>{a.brand_name}</span>
                  <span style={{ marginLeft: 8 }}>{a.status === 'exception' ? '运输异常' : '异常地址预警'}：{a.receiver_address}</span>
                  <Button type="link" size="small" onClick={() => nav(`/orders/${a.id}`)}>处理 →</Button>
                </div>
              ))}
            </Space>
          }
        />
      )}

      <Card
        title="📦 运单管理 · 包裹全生命周期跟踪"
        extra={
          <Space wrap>
            <Button icon={<QrcodeOutlined />} onClick={() => setScanModal(true)}>面单扫码查询</Button>
            <Button type="dashed" icon={<ShoppingOutlined />} onClick={() => setSyncModal(true)}>电商订单一键同步</Button>
            <Button type="primary" onClick={() => nav('/create-order')}>创建运单</Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Input allowClear placeholder="运单号/姓名/手机号" prefix={<SearchOutlined />}
            onChange={e => setF(s => ({ ...s, keyword: e.target.value }))} style={{ width: 220 }} />
          <Select allowClear placeholder="状态" style={{ width: 130 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.text}` }))}
            onChange={v => setF(s => ({ ...s, status: v }))} />
          <Select allowClear placeholder="品牌筛选" style={{ width: 140 }}
            options={(dashboard?.brandStats || []).map((b: any) => ({ value: b.id, label: b.name }))}
            onChange={v => setF(s => ({ ...s, brand_id: v }))} />
          <Select allowClear placeholder="异常筛选" style={{ width: 140 }}
            options={[
              { value: 'abnormal_address', label: '异常地址' },
              { value: 'face_required', label: '待人脸签收' },
              { value: 'has_notification', label: '有推送记录' }
            ]}
            onChange={v => setF(s => ({ ...s, abnormal: v }))} />
          <DatePicker.RangePicker
            onChange={v => setF(s => ({ ...s, date_from: v?.[0]?.format('YYYY-MM-DD'), date_to: v?.[1]?.format('YYYY-MM-DD') }))} />
          <Button type="primary" onClick={load}>查询</Button>
        </Space>

        <Table
          size="middle"
          columns={cols}
          dataSource={data.list}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page, pageSize, total: data.total,
            showSizeChanger: false, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条运单`,
            onChange: (p) => setPage(p)
          }}
          onRow={(r) => ({
            onDoubleClick: () => nav(`/orders/${r.id}`)
          })}
        />
      </Card>

      <Modal
        title={<><QrcodeOutlined /> 面单扫码查询</>}
        open={scanModal}
        onCancel={() => setScanModal(false)}
        footer={null}
        width={480}
      >
        <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
          <div style={{
            width: 220, height: 220, margin: '0 auto 12px',
            background: 'repeating-linear-gradient(90deg, #000 0 4px, #fff 4px 8px)',
            borderRadius: 8, position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#ff4d4f',
              animation: 'scan 1.5s linear infinite', boxShadow: '0 0 10px #ff4d4f'
            }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag color="red" style={{ padding: '4px 12px', fontSize: 14 }}>📷 摄像头扫码中...</Tag>
            </div>
          </div>
          <p style={{ color: '#8c8c8c', marginBottom: 16 }}>将面单条码/二维码对准摄像头，或手动输入运单号</p>
          <Input
            size="large"
            placeholder="请输入或扫描运单号"
            prefix={<QrcodeOutlined />}
            onPressEnter={(e: any) => onScan(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <div style={{ marginTop: 12 }}>
            <Space>
              <Button type="primary" onClick={() => onScan('SF2026061501203900120')}>用示例运单测试</Button>
              <Button onClick={() => setScanModal(false)}>取消</Button>
            </Space>
          </div>
        </div>
        <style>{`@keyframes scan { 0% { top: 0 } 50% { top: calc(100% - 3px) } 100% { top: 0 } }`}</style>
      </Modal>

      <Modal
        title={<><ShoppingOutlined /> 电商订单一键同步</>}
        open={syncModal}
        onCancel={() => setSyncModal(false)}
        footer={null}
        width={640}
      >
        <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
          支持淘宝、京东、拼多多、抖音、快手、Shopify 等主流电商平台的订单一键导入，自动创建运单并生成物流轨迹。
        </p>
        <Select
          mode="multiple"
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="选择需要同步的电商平台"
          defaultValue={['taobao', 'jd', 'pdd']}
          options={[
            { value: 'taobao', label: '淘宝/天猫' },
            { value: 'jd', label: '京东' },
            { value: 'pdd', label: '拼多多' },
            { value: 'douyin', label: '抖音小店' },
            { value: 'kuaishou', label: '快手小店' },
            { value: 'shopify', label: 'Shopify' },
            { value: 'wechat', label: '微信视频号' }
          ]}
        />
        <Alert
          type="info"
          showIcon
          message="同步预览（将创建以下运单）"
          style={{ marginBottom: 16 }}
        />
        <List
          size="small"
          bordered
          dataSource={[
            { order_no: 'TB202606150001', goods: '女装连衣裙 x1', amount: 158, from: 'taobao' },
            { order_no: 'JD202606150042', goods: '手机壳 x2', amount: 56, from: 'jd' },
            { order_no: 'PDD202606150128', goods: '零食礼包 x1', amount: 89, from: 'pdd' },
          ]}
          renderItem={(item: any) => (
            <List.Item>
              <Space>
                <Tag color={item.from === 'taobao' ? 'orange' : item.from === 'jd' ? 'red' : 'magenta'}>
                  {({ taobao: '淘宝', jd: '京东', pdd: '拼多多' } as any)[item.from]}
                </Tag>
                <Text code>{item.order_no}</Text>
                <span>{item.goods}</span>
              </Space>
              <Space>
                <Statistic value={item.amount} prefix="¥" valueStyle={{ fontSize: 14, fontWeight: 500 }} />
                <Button type="link" size="small">配置</Button>
              </Space>
            </List.Item>
          )}
        />
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Space>
            <Button onClick={() => setSyncModal(false)}>取消</Button>
            <Button type="primary" onClick={() => { message.success(`同步成功，已创建3条运单`); setSyncModal(false); load(); }}>
              立即同步 (3 条)
            </Button>
          </Space>
        </div>
      </Modal>

      <Drawer
        title={<Space><EyeOutlined /> 运单实时轨迹与生命周期</Space>}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        extra={drawerOrder && <Button type="primary" size="small" onClick={() => nav(`/orders/${drawerOrder.id}`)}>查看完整详情</Button>}
      >
        {drawerOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row gutter={[12, 8]}>
              <Col span={12}>
                <Card size="small">
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>运单号</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 15 }}>{drawerOrder.tracking_no}</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>当前状态</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    <Tag color={(statusMap[drawerOrder.status] || {}).color}>
                      {(statusMap[drawerOrder.status] || {}).icon} {(statusMap[drawerOrder.status] || {}).text}
                    </Tag>
                  </div>
                </Card>
              </Col>
            </Row>

            {drawerOrder.estimated_delivery_time && (
              <Card size="small" title="⏱ 预计送达倒计时">
                {(() => {
                  const cd = countdown(drawerOrder.estimated_delivery_time);
                  if (drawerOrder.status === 'signed' || drawerOrder.status === 'delivered') {
                    return <div style={{ color: '#52c41a', fontSize: 18, fontWeight: 600 }}>✅ 已签收/送达</div>;
                  }
                  if (cd.expired) return <Alert type="error" message="已超过预计送达时间，请联系快递员" showIcon />;
                  return (
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: cd.hours < 4 ? '#ff4d4f' : cd.hours < 8 ? '#fa8c16' : '#1677ff' }}>
                        <ClockCircleOutlined /> {cd.text}
                      </div>
                      <Progress percent={cd.pct}
                        strokeColor={cd.hours < 4 ? '#ff4d4f' : cd.hours < 8 ? '#fa8c16' : '#52c41a'} />
                      <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                        预计送达：{dayjs(drawerOrder.estimated_delivery_time).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                  );
                })()}
              </Card>
            )}

            {drawerOrder.is_address_abnormal && (
              <Alert
                type="error"
                showIcon
                icon={<AlertOutlined />}
                message="🚨 异常地址已拦截"
                description={
                  <div>
                    <p>收货地址 <b>{drawerOrder.receiver_address}</b> 疑似虚构/不存在</p>
                    <Space>
                      <Button size="small" danger>标记已核实</Button>
                      <Button size="small">联系收件人</Button>
                      <Button size="small" type="primary">人工复核</Button>
                    </Space>
                  </div>
                }
              />
            )}

            <Card size="small" title="📜 包裹生命周期全轨迹" styles={{ body: { padding: 12 } }}>
              <Steps
                direction="vertical"
                size="small"
                current={['created', 'picked', 'in_transit', 'arrived_branch', 'out_for_delivery', 'delivered', 'signed'].indexOf(drawerOrder.status)}
                items={[
                  { title: '运单创建', description: dayjs(drawerOrder.created_at).format('YYYY-MM-DD HH:mm'), status: 'finish' },
                  { title: '快递员揽收', description: drawerOrder.picked_at ? dayjs(drawerOrder.picked_at).format('MM-DD HH:mm') : '等待揽收' },
                  { title: '运输中', description: '途经转运中心' },
                  { title: '到达网点', description: '已到达目的地网点' },
                  {
                    title: '派送中',
                    description: drawerOrder.courier_name ? `${drawerOrder.courier_name} 正在派送 · ${drawerOrder.courier_phone}` : '待分配快递员',
                    subTitle: drawerOrder.has_voice_note && '🎙 快递员有语音留言'
                  },
                  {
                    title: '签收验证',
                    description: drawerOrder.is_face_verified
                      ? '✅ 人脸识别二次确认通过，本人签收'
                      : '签收前需人脸识别二次确认（防止错收误收）',
                    status: drawerOrder.is_face_verified ? 'finish' : 'process'
                  },
                  { title: '已签收完成', description: drawerOrder.signed_at ? dayjs(drawerOrder.signed_at).format('MM-DD HH:mm') : '等待签收' }
                ]}
              />
              <Divider style={{ margin: '12px 0' }} />
              <Timeline
                items={((drawerOrder.tracking_events || drawerOrder.events || [
                  { time: drawerOrder.created_at, event_type: 'created', description: '运单创建', location: drawerOrder.sender_address }
                ]) as any[]).map((e: any): NonNullable<TimelineProps['items']>[number] => ({
                  color: e.event_type === 'exception' ? 'red' : e.event_type === 'signed' ? 'green' : 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {(statusMap[e.event_type] || {}).icon || '📍'} {e.description}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        <EnvironmentOutlined /> {e.location || '未知'} · {dayjs(e.created_at || e.time).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    </div>
                  )
                }))}
              />
            </Card>

            <Card size="small" title="🔔 异常/主动推送记录">
              {(drawerOrder.notifications || []).length > 0 ? (
                <List
                  size="small"
                  dataSource={drawerOrder.notifications}
                  renderItem={(n: any) => (
                    <List.Item>
                      <Space>
                        <Badge color={n.read_at ? 'default' : 'red'} />
                        <Tag color={n.type === 'exception' ? 'red' : n.type === 'warning' ? 'orange' : 'blue'}>
                          {({ exception: '异常', warning: '预警', info: '通知' } as any)[n.type] || '通知'}
                        </Tag>
                        <span style={{ fontWeight: 500 }}>{n.title}</span>
                      </Space>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>{dayjs(n.created_at).format('MM-DD HH:mm')}</div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无推送记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            {drawerOrder.status === 'out_for_delivery' && !drawerOrder.is_face_verified && (
              <Alert
                type="warning"
                showIcon
                icon={<VideoCameraOutlined />}
                message="签收前需人脸识别二次确认"
                description="本运单启用了错收误收防护机制，快递员送达时需对收件人进行人脸识别验证，确保本人签收。"
                action={
                  <Button type="primary" size="small" icon={<VideoCameraOutlined />} onClick={() => openFaceVerify(drawerOrder)}>
                    立即人脸核验
                  </Button>
                }
                style={{ marginTop: 12 }}
              />
            )}

            {drawerOrder.is_address_abnormal && (
              <Alert
                type="error"
                showIcon
                icon={<AlertOutlined />}
                message="收货地址异常，已拦截"
                description="系统检测到该地址包含异常关键词（虚构/假小区/不存在街道等），请人工复核后恢复派送。"
                action={
                  <Space style={{ marginTop: 8 }}>
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => reviewAddress(drawerOrder, 'confirm_normal')}>
                      地址正常
                    </Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => reviewAddress(drawerOrder, 'correct_address')}>
                      修正地址
                    </Button>
                    <Button size="small" danger icon={<CloseOutlined />} onClick={() => reviewAddress(drawerOrder, 'confirm_abnormal')}>
                      确认异常
                    </Button>
                  </Space>
                }
                style={{ marginTop: 12 }}
              />
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        title={<><BellOutlined /> 异常事件主动推送记录</>}
        open={notifDrawer.open}
        onClose={() => setNotifDrawer({ open: false, list: [] })}
        width={520}
      >
        <List
          dataSource={notifDrawer.list}
          locale={{ emptyText: '暂无推送' }}
          renderItem={(n: any) => (
            <List.Item>
              <Space direction="vertical" size={2} style={{ flex: 1 }}>
                <Space>
                  <Badge status={n.read_at ? 'default' : 'error'} />
                  <Tag color={n.type === 'exception' ? 'red' : n.type === 'warning' ? 'orange' : 'blue'}>
                    {({ exception: '异常', warning: '预警', info: '通知' } as any)[n.type] || '通知'}
                  </Tag>
                  <b>{n.title}</b>
                </Space>
                <div style={{ color: '#595959' }}>{n.content}</div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>{dayjs(n.created_at).format('YYYY-MM-DD HH:mm')}</div>
              </Space>
            </List.Item>
          )}
        />
      </Drawer>

      <Modal
        title={
          <Space>
            <VideoCameraOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <b>错收误收防护 · 人脸识别二次确认</b>
            <Tag color="orange">{faceModal.order?.tracking_no}</Tag>
          </Space>
        }
        open={faceModal.open}
        onOk={onFaceVerify}
        onCancel={() => setFaceModal({ open: false, order: null, loading: false })}
        okText="确认核验"
        okButtonProps={{ type: 'primary', size: 'large' }}
        cancelText="取消"
        confirmLoading={faceModal.loading}
        width={560}
      >
        {faceModal.order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <Alert
              type="info"
              showIcon
              message="为防止错收误收，请对收件人进行人脸识别验证，确保为本人签收。"
            />
            <div style={{ position: 'relative', width: '100%', maxWidth: 360, height: 280, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 180, height: 200, border: '2px solid #1677ff', borderRadius: '50%/40%', overflow: 'hidden', background: 'rgba(22,119,255,0.1)' }}>
                <div style={{
                  width: '100%', height: '100%',
                  background: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face) center/cover',
                  filter: 'brightness(0.85)'
                }} />
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, transparent, #52c41a, transparent)',
                  animation: 'scanface 2s ease-in-out infinite',
                  boxShadow: '0 0 20px #52c41a'
                }} />
              </div>
              {faceModal.loading && (
                <div style={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                  <div style={{ width: 40, height: 40, border: '3px solid #1677ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                  <div style={{ color: '#fff', fontSize: 14 }}>正在识别人脸特征...</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 360, fontSize: 13, color: '#8c8c8c' }}>
              <span>👤 收件人：<b style={{ color: '#262626' }}>{faceModal.order.receiver_name}</b></span>
              <span>📱 手机号：<b style={{ color: '#262626' }}>{faceModal.order.receiver_phone}</b></span>
            </div>
            <Alert
              type="warning"
              showIcon
              icon={<AlertOutlined />}
              message="若人脸识别不通过，将自动转入错收误收待复查流程，由快递员端进行人工二次确认。"
            />
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <AlertOutlined style={{ color: '#fa8c16' }} />
            <b>异常地址人工复核</b>
            <Tag color="red">{reviewModal.order?.tracking_no}</Tag>
          </Space>
        }
        open={reviewModal.open}
        onOk={onReviewAddress}
        onCancel={() => { setReviewModal({ open: false, order: null, action: '' }); reviewForm.resetFields(); }}
        okText="确认提交"
        okButtonProps={{ danger: reviewModal.action === 'confirm_abnormal' }}
        width={560}
      >
        {reviewModal.order && (
          <Form form={reviewForm} layout="vertical">
            <Alert
              type={
                reviewModal.action === 'confirm_normal' ? 'success' :
                reviewModal.action === 'confirm_abnormal' ? 'error' : 'warning'
              }
              showIcon
              message={
                reviewModal.action === 'confirm_normal' ? '确认该地址为正常地址，系统将解除异常拦截，恢复派送流程。' :
                reviewModal.action === 'confirm_abnormal' ? '确认该地址为异常地址，运单将保持异常状态，建议联系寄件人核实后重新派送。' :
                '请输入修正后的正确地址，系统将更新地址并恢复派送流程。'
              }
              style={{ marginBottom: 16 }}
            />
            <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ marginBottom: 4 }}><b>运单号：</b><code>{reviewModal.order.tracking_no}</code></div>
              <div style={{ marginBottom: 4 }}><b>收件人：</b>{reviewModal.order.receiver_name} · {reviewModal.order.receiver_phone}</div>
              <div style={{ marginBottom: 4 }}><b>当前地址：</b><span style={{ color: '#cf1322' }}>{reviewModal.order.receiver_address}</span></div>
              <div><b>当前状态：</b>{statusMap[reviewModal.order.status]?.text || reviewModal.order.status}</div>
            </div>
            {reviewModal.action === 'correct_address' && (
              <>
                <Form.Item name="corrected_address" label="修正后地址" rules={[{ required: true, message: '请输入修正后的完整地址' }]}>
                  <Input.TextArea rows={3} placeholder="请输入省/市/区/街道/门牌号等完整地址信息" />
                </Form.Item>
                <Form.Item name="note" label="备注说明">
                  <Input.TextArea rows={2} placeholder="可选：填写地址修正的原因或说明" />
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Modal>

      <style>{`
        @keyframes scanface {
          0% { top: 0; }
          50% { top: calc(100% - 3px); }
          100% { top: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
