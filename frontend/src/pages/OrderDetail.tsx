import { useEffect, useState } from 'react';
import { Row, Col, Card, Descriptions, Tag, Timeline, Button, App, Modal, Form, Input, DatePicker, Space, Progress } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import dayjs from 'dayjs';

const statusMap: Record<string, { text: string; color: string }> = {
  created: { text: '已创建', color: 'default' }, picked: { text: '已揽收', color: 'processing' },
  in_transit: { text: '运输中', color: 'blue' }, arrived_branch: { text: '到达网点', color: 'cyan' },
  out_for_delivery: { text: '派送中', color: 'purple' }, delivered: { text: '已送达', color: 'geekblue' },
  signed: { text: '已签收', color: 'success' }, exception: { text: '异常', color: 'error' }, returned: { text: '退回', color: 'warning' }
};

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { modal, message } = App.useApp();
  const [detail, setDetail] = useState<any>(null);
  const [countdown, setCountdown] = useState('');
  const [showAppointment, setShowAppointment] = useState(false);
  const [showFace, setShowFace] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    api.orders.detail(+id!).then(r => setDetail(r)).catch(e => message.error(e.message));
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!detail?.estimated_delivery_time) return;
    const t = setInterval(() => {
      const diff = new Date(detail.estimated_delivery_time).getTime() - Date.now();
      if (diff <= 0) { setCountdown('已超时'); return; }
      const d = Math.floor(diff / 86400000), h = Math.floor(diff % 86400000 / 3600000);
      const m = Math.floor(diff % 3600000 / 60000), s = Math.floor(diff % 60000 / 1000);
      setCountdown(`${d ? d + '天 ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, [detail]);

  if (!detail) return <Card loading />;

  const st = statusMap[detail.status] || { text: detail.status, color: 'default' };

  // 简易包裹地图
  const renderMap = () => {
    const lngs = [detail.sender_longitude, detail.receiver_longitude].filter(Boolean);
    const lats = [detail.sender_latitude, detail.receiver_latitude].filter(Boolean);
    if (!lngs.length) return <div style={{ padding: 60, textAlign: 'center', color: '#8c8c8c' }}>地址坐标缺失</div>;
    const minLng = Math.min(...lngs) - 0.5, maxLng = Math.max(...lngs) + 0.5;
    const minLat = Math.min(...lats) - 0.5, maxLat = Math.max(...lats) + 0.5;
    const pos = (lng: number, lat: number) => ({
      left: `${((lng - minLng) / (maxLng - minLng || 1)) * 88 + 6}%`,
      top: `${(1 - (lat - minLat) / (maxLat - minLat || 1)) * 82 + 9}%`
    });
    const courierP = detail.courier_lng ? pos(detail.courier_lng, detail.courier_lat) : null;
    return (
      <div className="map-container" style={{ height: 380 }}>
        <svg className="order-path" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1677ff" />
              <stop offset="100%" stopColor="#52c41a" />
            </linearGradient>
          </defs>
          <line
            x1={parseFloat(pos(detail.sender_longitude, detail.sender_latitude).left)}
            y1={parseFloat(pos(detail.sender_longitude, detail.sender_latitude).top)}
            x2={parseFloat(pos(detail.receiver_longitude || detail.sender_longitude + 2, detail.receiver_latitude || detail.sender_latitude).left)}
            y2={parseFloat(pos(detail.receiver_longitude || detail.sender_longitude + 2, detail.receiver_latitude || detail.sender_latitude).top)}
            stroke="url(#lineGrad)" strokeWidth="0.4" strokeDasharray="1,0.5" opacity="0.7"
          />
        </svg>
        {detail.sender_longitude && <div className="map-node" style={pos(detail.sender_longitude, detail.sender_latitude)}>
          <div className="dot" style={{ background: '#1677ff', width: 14, height: 14 }} />
          <div className="label">📦 寄件地</div>
        </div>}
        {detail.receiver_longitude && <div className="map-node" style={pos(detail.receiver_longitude, detail.receiver_latitude)}>
          <div className="dot" style={{ background: '#52c41a', width: 14, height: 14 }} />
          <div className="label">🏠 收件地</div>
        </div>}
        {courierP && <div className="map-node" style={courierP}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fa8c16', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, boxShadow: '0 0 0 5px #fa8c1633', animation: 'pulse 1.6s infinite' }}>🚚</div>
          <div className="label">快递员 {detail.courier_name?.slice?.(0, 1) || ''}</div>
        </div>}
      </div>
    );
  };

  const onSign = async (signType: string) => {
    try {
      await api.orders.patchStatus(detail.id, { status: 'signed', sign_type: signType, sign_image: signType === 'electronic' ? 'data:image/svg+xml;e-signature' : null });
      message.success('签收成功！'); load(); setShowSign(false);
    } catch (e: any) { message.error(e.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Button onClick={() => nav(-1)}>← 返回</Button>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              运单 <code>{detail.tracking_no}</code>
              <Tag color={st.color} style={{ marginLeft: 12, fontSize: 14 }}>{st.text}</Tag>
              {detail.is_address_abnormal ? <Tag color="red" style={{ fontSize: 13 }}>🚨 地址异常已拦截</Tag> : null}
              {detail.face_verified ? <Tag color="green" style={{ fontSize: 13 }}>✅ 人脸识别签收</Tag> : null}
            </div>
            <div style={{ color: '#595959' }}>订单号 {detail.order_no} · {detail.brand_name}({detail.brand_code}) · 下单 {dayjs(detail.created_at).format('YYYY-MM-DD HH:mm')}</div>
          </div>
          <Space>
            {detail.status === 'out_for_delivery' && !detail.face_verified && <>
              <Button type="primary" onClick={() => setShowAppointment(true)}>⏰ 协商上门时间</Button>
              <Button onClick={() => setShowFace(true)}>👤 人脸识别签收</Button>
              <Button type="primary" onClick={() => setShowSign(true)}>✍️ 电子签收</Button>
            </>}
            {(detail.status !== 'signed' && detail.status !== 'exception') &&
              <Button danger onClick={() => setShowComplaint(true)}>投诉</Button>}
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="🗺️ 包裹实时位置 · 预计送达倒计时" extra={
            <div style={{ fontSize: 18, color: countdown.includes('超时') ? '#ff4d4f' : '#1677ff', fontWeight: 700 }}>
              ⏳ {countdown || '已签收'}
            </div>
          }>
            {renderMap()}
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ padding: 12, background: '#f5f7fa', borderRadius: 8 }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>快递员</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{detail.courier_name || '未分配'} {detail.courier_phone && <span style={{ color: '#595959' }}>({detail.courier_phone})</span>}</div>
                <div style={{ fontSize: 12, color: '#fa8c16', marginTop: 4 }}>★ {detail.courier_rating || '-'}</div>
              </div>
              {detail.voice_greeting && <div style={{ padding: 12, background: '#fff7e6', borderRadius: 8, border: '1px dashed #ffd591' }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>📢 快递员语音留言</div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#595959', lineHeight: 1.6 }}>"{detail.voice_greeting}"</div>
                <Button size="small" style={{ marginTop: 8 }}>▶️ 播放语音</Button>
              </div>}
              <div style={{ padding: 12, background: '#f6ffed', borderRadius: 8 }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>费用明细</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>¥{detail.total_amount}</div>
                <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>运费 {detail.price} + 保价 {detail.insurance_fee}</div>
              </div>
              <div style={{ padding: 12, background: '#e6f4ff', borderRadius: 8 }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>预计送达</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{detail.estimated_delivery_time ? dayjs(detail.estimated_delivery_time).format('MM-DD HH:mm') : '-'}</div>
                <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>品牌评分 ★{detail.brand_rating}</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="📈 物流轨迹" styles={{ body: { padding: '4px 20px 20px' } }}>
            <Timeline className="timeline-custom" items={(detail.events || []).map((e: any, i: number) => ({
              color: e.is_exception ? 'red' : (i === 0 ? 'blue' : 'gray'),
              children: <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b style={{ color: e.is_exception ? '#ff4d4f' : '#000' }}>
                    {e.is_exception ? '🚨 ' : ''}{e.event_desc}
                  </b>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>{dayjs(e.created_at).format('MM-DD HH:mm')}</span>
                </div>
                {(e.location || e.operator_name) && <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                  {e.location && `📍 ${e.location}`} {e.operator_name && `· 操作人：${e.operator_name}`}
                </div>}
                {e.exception_type && <Tag color="red" style={{ marginTop: 4 }}>异常：{e.exception_type}</Tag>}
              </div>
            }))} />
          </Card>
        </Col>
      </Row>

      <Card title="📦 运单详情">
        <Row gutter={[24, 12]}>
          <Col xs={24} md={12}>
            <Descriptions column={1} bordered size="small" title="寄件人">
              <Descriptions.Item label="姓名">{detail.sender_name}</Descriptions.Item>
              <Descriptions.Item label="手机">{detail.sender_phone}</Descriptions.Item>
              <Descriptions.Item label="地址">{detail.sender_address}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions column={1} bordered size="small" title={<>收件人 {detail.is_address_abnormal && <Tag color="red">⚠️ 异常地址已拦截</Tag>}</>}>
              <Descriptions.Item label="姓名">{detail.receiver_name}</Descriptions.Item>
              <Descriptions.Item label="手机">{detail.receiver_phone}</Descriptions.Item>
              <Descriptions.Item label="地址">{detail.receiver_address}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24}>
            <Descriptions column={4} bordered size="small" title="物品信息">
              <Descriptions.Item label="物品名称">{detail.goods_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="类型">{detail.goods_type}</Descriptions.Item>
              <Descriptions.Item label="重量">{detail.weight} kg</Descriptions.Item>
              <Descriptions.Item label="尺寸">{detail.length}×{detail.width}×{detail.height} cm</Descriptions.Item>
              <Descriptions.Item label="保价金额">¥{detail.declared_value}</Descriptions.Item>
              <Descriptions.Item label="运费">¥{detail.price}</Descriptions.Item>
              <Descriptions.Item label="保价费">¥{detail.insurance_fee}</Descriptions.Item>
              <Descriptions.Item label="实付"><b style={{ color: '#ff4d4f' }}>¥{detail.total_amount}</b></Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Modal title="协商上门时间" open={showAppointment} onCancel={() => setShowAppointment(false)} onOk={async () => {
        try {
          const v = await form.validateFields();
          await api.orders.appointment(detail.id, v.appointment_time.format('YYYY-MM-DD HH:mm:ss'));
          message.success('预约成功，快递员会按时上门'); setShowAppointment(false); load();
        } catch (e: any) { message.error(e.message); }
      }}>
        <Form form={form} layout="vertical">
          <Form.Item name="appointment_time" label="选择上门时间段" rules={[{ required: true }]}>
            <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="备注留言">
            <Input.TextArea rows={2} placeholder="给快递员留言，如门口保安代收等..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="👤 人脸识别签收 · 错收误收防护" open={showFace} onCancel={() => setShowFace(false)} footer={
        <Space>
          <Button onClick={() => setShowFace(false)}>取消</Button>
          <Button type="primary" onClick={async () => {
            try {
              // 模拟用户 face_data，user1 对应 face_template_user1
              const u = JSON.parse(localStorage.getItem('user') || '{}');
              const faceData = u.username ? `captured_face_template_${u.username}` : 'captured_face_' + Date.now();
              const r: any = await api.orders.verifyFace(detail.id, faceData);
              if (r.verified) {
                message.success('✅ ' + r.message);
                await api.orders.patchStatus(detail.id, { status: 'signed', sign_type: 'face', face_verified: 1 });
                setShowFace(false); load();
              } else {
                modal.error({ title: '❌ 人脸不匹配', content: r.message + '，为防止错收误收，请确认为本人后重试。' });
              }
            } catch (e: any) { message.error(e.message); }
          }}>确认签收</Button>
        </Space>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 240, height: 240, borderRadius: 120, background: 'linear-gradient(135deg, #1677ff, #69b1ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: 80 }}>👤</div>
            <div style={{ position: 'absolute', inset: 0, border: '3px solid #fff', borderRadius: 120, animation: 'pulse 1.2s infinite' }} />
          </div>
          <Progress percent={78} showInfo={false} status="active" style={{ width: 280 }} />
          <div style={{ color: '#1677ff' }}>📷 正在采集人脸数据...</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', textAlign: 'center', lineHeight: 1.6 }}>
            签收前人脸识别二次确认<br/>有效防止错收、误收、冒领包裹
          </div>
        </div>
      </Modal>

      <Modal title="✍️ 电子签收回传" open={showSign} onCancel={() => setShowSign(false)} footer={
        <Space>
          <Button onClick={() => setShowSign(false)}>取消</Button>
          <Button type="primary" onClick={() => onSign('electronic')}>确认电子签收</Button>
        </Space>
      }>
        <div style={{ border: '1px dashed #d9d9d9', height: 180, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
          <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
            <div style={{ fontSize: 40 }}>✍️</div>
            <div>请在此处手写签名（模拟电子签名板）</div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>签名后会回传到平台并与快递员终端同步，作为签收凭证。</div>
      </Modal>

      <Modal title="提交投诉" open={showComplaint} onCancel={() => setShowComplaint(false)} onOk={async () => {
        try {
          const v = await form.validateFields();
          await api.complaints.create({ order_id: detail.id, ...v });
          message.success('投诉已提交，我们会在8小时内处理'); setShowComplaint(false);
        } catch (e: any) { message.error(e.message); }
      }}>
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="投诉类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'delivery_delay', label: '配送延误' },
              { value: 'package_damage', label: '包裹破损' },
              { value: 'lost', label: '包裹丢失' },
              { value: 'rude_service', label: '服务态度差' },
              { value: 'wrong_address', label: '地址错误' }
            ]} />
          </Form.Item>
          <Form.Item name="description" label="详细描述" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细描述您遇到的问题..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
