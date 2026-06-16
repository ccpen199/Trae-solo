import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Space, Modal, Form, Input, Progress, App, Avatar, Timeline, Badge } from 'antd';
import { SendOutlined, CheckOutlined, WarningOutlined, ClockCircleOutlined, ThunderboltOutlined, StarOutlined, EnvironmentOutlined, UserOutlined, MobileOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

export default function CourierWorkbench() {
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const [data, setData] = useState<any>({ courier: {}, stats: {}, orders: [], complaints: [] });
  const [showSign, setShowSign] = useState<any>(null);
  const [showDetail, setShowDetail] = useState<any>(null);

  const load = () => api.couriers.workbench().then(setData).catch(e => message.error(e.message));
  useEffect(() => load(), []);

  const s = data.stats || {};
  const statCards = [
    { t: '待处理', v: s.pending_orders, i: <SendOutlined />, c: '#1677ff' },
    { t: '派送中', v: s.out_for_delivery, i: <EnvironmentOutlined />, c: '#722ed1' },
    { t: '今日签收', v: s.today_signed, i: <CheckOutlined />, c: '#52c41a' },
    { t: '待处理投诉', v: s.open_complaints, i: <WarningOutlined />, c: '#ff4d4f' },
    { t: 'SLA预警', v: s.sla_warning, i: <ThunderboltOutlined />, c: '#fa8c16' },
    { t: '个人评分', v: s.rating, i: <StarOutlined />, c: '#faad14' },
  ];

  const doSign = async (order: any, signType: string) => {
    try {
      await api.orders.patchStatus(order.id, { status: 'signed', sign_type: signType });
      message.success('签收成功并已回传'); setShowSign(null); load();
    } catch (e: any) { message.error(e.message); }
  };

  const doPickup = async (order: any) => {
    try {
      await api.orders.patchStatus(order.id, { status: order.status === 'arrived_branch' ? 'out_for_delivery' : 'in_transit' });
      message.success('状态已更新'); load();
    } catch (e: any) { message.error(e.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar size={56} style={{ background: 'linear-gradient(135deg, #1677ff, #69b1ff)', fontSize: 20 }}>
              {(data.courier?.name || '快').slice(0, 1)}
            </Avatar>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{data.courier?.name || '快递员'} <Tag color="blue">{data.courier?.brand_name || '-'}</Tag></div>
              <div style={{ color: '#595959' }}>
                工号 {data.courier?.employee_no} · {data.courier?.phone} · 服务区域：{data.courier?.service_area}
              </div>
              <div style={{ marginTop: 4 }}>
                <Badge status={data.courier?.work_status === 'online' ? 'success' : data.courier?.work_status === 'busy' ? 'warning' : 'default'}
                  text={data.courier?.work_status === 'online' ? '🟢 在线接单' : data.courier?.work_status === 'busy' ? '🟡 忙碌中' : '⚪ 离线'} />
                <span style={{ marginLeft: 16, color: '#595959' }}>累计派单 {s.total_orders || 0} · 准时率 {s.on_time_rate || 0}%</span>
              </div>
            </div>
          </div>
          <Space>
            <Button>扫码接单</Button>
            <Button type="primary">开始派送</Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[12, 12]}>
        {statCards.map((c, i) => (
          <Col xs={12} md={8} lg={4} key={i}>
            <Card styles={{ body: { padding: 16 } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic title={<span style={{ fontSize: 12 }}>{c.t}</span>} value={c.v} />
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.c + '18', color: c.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.i}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="📋 待派单聚合（按优先级排序）" extra={<Button size="small" onClick={load}>刷新</Button>}>
            {(data.orders || []).length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>暂无待处理订单，辛苦啦 🎉</div>
            ) : (
              <List
                itemLayout="vertical"
                dataSource={data.orders}
                renderItem={(item: any) => (
                  <List.Item key={item.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 4px' }}>
                    <List.Item.Meta
                      avatar={<Avatar style={{ background: item.status === 'out_for_delivery' ? '#722ed1' : '#1677ff' }}>
                        {item.status === 'out_for_delivery' ? '🚚' : '📦'}
                      </Avatar>}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <code>{item.tracking_no}</code>
                            <Tag color={item.status === 'out_for_delivery' ? 'purple' : 'blue'} style={{ marginLeft: 8 }}>
                              {item.status === 'out_for_delivery' ? '派送中' : item.status === 'arrived_branch' ? '到达网点' : item.status === 'in_transit' ? '运输中' : '已揽收'}
                            </Tag>
                            {item.priority === 'urgent' && <Tag color="red">加急</Tag>}
                          </div>
                          <Space>
                            <Button size="small" onClick={() => nav(`/orders/${item.id}`)}>详情</Button>
                            <Button size="small" onClick={() => setShowDetail(item)}>客户信息</Button>
                            {item.status === 'out_for_delivery' ? (
                              <Button size="small" type="primary" onClick={() => setShowSign(item)}>✍️ 电子签收</Button>
                            ) : (
                              <Button size="small" type="primary" onClick={() => doPickup(item)}>
                                {item.status === 'arrived_branch' ? '开始派送' : '确认揽收'}
                              </Button>
                            )}
                          </Space>
                        </div>
                      }
                      description={
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                          <div><UserOutlined /> <b>收件人：</b>{item.receiver_name} <MobileOutlined /> {item.receiver_phone}</div>
                          <div><EnvironmentOutlined /> <b>地址：</b>{item.receiver_address}</div>
                          <div>📦 {item.goods_name || '标准快递'} · {item.weight}kg · ¥{item.total_amount}</div>
                          <div>
                            <ClockCircleOutlined /> 预计送达：
                            <b style={{ color: item.estimated_delivery_time && dayjs(item.estimated_delivery_time).isBefore(dayjs()) ? '#ff4d4f' : '#1677ff' }}>
                              {dayjs(item.estimated_delivery_time).format('MM-DD HH:mm')}
                            </b>
                            {item.appointment_time && <Tag color="orange" style={{ marginLeft: 6 }}>预约 {dayjs(item.appointment_time).format('HH:mm')}</Tag>}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="⚠️ 投诉响应SLA监控" styles={{ body: { padding: 0 } }}>
            {(data.complaints || []).length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#8c8c8c' }}>暂无待处理投诉</div>
            ) : (
              (data.complaints || []).map((c: any, i: number) => {
                const remain = dayjs(c.sla_deadline).diff(dayjs(), 'hour');
                const percent = Math.max(0, Math.min(100, 100 - Math.abs(remain) * 100 / 8));
                return (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: i < (data.complaints?.length || 0) - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <code style={{ fontSize: 12 }}>{c.tracking_no}</code>
                      <Tag color={c.status === 'pending' ? (remain <= 2 ? 'red' : remain <= 4 ? 'orange' : 'blue') : 'green'}>
                        {c.status === 'pending' ? '待处理' : c.status === 'processing' ? '处理中' : '已完成'}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      <b>{c.type === 'delivery_delay' ? '配送延误' : c.type === 'package_damage' ? '包裹破损' : c.type === 'lost' ? '包裹丢失' : c.type === 'rude_service' ? '服务态度' : '地址错误'}</b>
                    </div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>{c.description?.slice?.(0, 30)}...</div>
                    <Progress percent={percent} size="small"
                      status={remain <= 2 ? 'exception' : remain <= 4 ? 'normal' : 'active'}
                      showInfo format={() => <span style={{ fontSize: 11 }}>剩余 {Math.max(0, remain)} 小时 SLA</span>} />
                    <Button size="small" type="primary" style={{ marginTop: 8 }} onClick={() => {
                      modal.success({ title: '已响应投诉', content: `已登记处理运单 ${c.tracking_no} 的投诉，客服会跟进。` });
                      api.complaints.patchStatus(c.id, { status: 'processing', resolution: '快递员已响应，正在核实' }).catch(() => {});
                    }}>立即响应</Button>
                  </div>
                );
              })
            )}
          </Card>

          <Card title="📊 今日工作指标" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>签收进度</span>
                  <b>{s.today_signed || 0} / {(s.out_for_delivery || 0) + (s.today_signed || 0)}</b>
                </div>
                <Progress percent={((s.today_signed || 0) / Math.max(1, (s.out_for_delivery || 0) + (s.today_signed || 0))) * 100} size="small" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>准时率</span>
                  <b style={{ color: '#52c41a' }}>{s.on_time_rate || 0}%</b>
                </div>
                <Progress percent={s.on_time_rate || 0} size="small" strokeColor="#52c41a" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>服务评分</span>
                  <b style={{ color: '#fa8c16' }}>★ {s.rating || 0}</b>
                </div>
                <Progress percent={(s.rating || 0) * 20} size="small" strokeColor="#fa8c16" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal title="✍️ 电子签收回传" open={!!showSign} onCancel={() => setShowSign(null)} footer={
        <Space>
          <Button onClick={() => setShowSign(null)}>取消</Button>
          <Button onClick={() => doSign(showSign, 'electronic')}>电子签名</Button>
          <Button type="primary" onClick={() => doSign(showSign, 'face')}>人脸识别签收</Button>
        </Space>
      }>
        {showSign && <div>
          <div style={{ padding: 12, background: '#f5f7fa', borderRadius: 8, marginBottom: 12 }}>
            <div><b>收件人：</b>{showSign.receiver_name} · {showSign.receiver_phone}</div>
            <div><b>地址：</b>{showSign.receiver_address}</div>
            <div><b>运单：</b><code>{showSign.tracking_no}</code></div>
          </div>
          <div style={{ border: '1px dashed #d9d9d9', height: 160, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', color: '#8c8c8c' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 40 }}>✍️</div>请用户手写签名</div>
          </div>
        </div>}
      </Modal>

      <Modal title="📞 客户信息 & 上门协商" open={!!showDetail} onCancel={() => setShowDetail(null)} footer={
        <Space>
          <Button onClick={() => setShowDetail(null)}>关闭</Button>
          <Button type="primary" onClick={() => { message.success('已发送上门时间协商短信'); setShowDetail(null); }}>发送预约短信</Button>
        </Space>
      } width={520}>
        {showDetail && <Timeline className="timeline-custom" items={[
          { color: 'blue', children: <div><b>收件人：{showDetail.receiver_name}</b>（{showDetail.receiver_phone}）</div> },
          { color: 'blue', children: <div>📍 {showDetail.receiver_address}</div> },
          { color: 'green', children: <div>📦 {showDetail.goods_name || '标准快递'} · {showDetail.weight}kg</div> },
          { color: 'gray', children: <div>🕐 预计送达：{dayjs(showDetail.estimated_delivery_time).format('MM-DD HH:mm')} {showDetail.appointment_time && <Tag color="orange">已约 {dayjs(showDetail.appointment_time).format('HH:mm')}</Tag>}</div> }
        ]} />}
      </Modal>
    </div>
  );
}
