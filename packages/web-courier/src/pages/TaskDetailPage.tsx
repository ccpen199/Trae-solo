import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Steps, Spin, Input, Form, Upload, Modal, message, Space, Tag, Descriptions, Radio } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, CameraOutlined, InboxOutlined, TruckOutlined, CheckSquareOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/api';

const statusStepIdx: Record<string, number> = { PENDING: 0, ACCEPTED: 1, EN_ROUTE: 2, ARRIVED: 3, PICKED: 4, DELIVERING: 4, COMPLETED: 5 };
const stepTitles = ['工单创建', '已接单', '前往收件地址', '已到达', '收件/派件完成', '工单办结'];

const TaskDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const r: any = await api.get('/courier/tasks', { params: { page: 1, pageSize: 100 } });
      setTask(r.data.list.find((t: any) => t.id === id));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>;
  if (!task) return <div>工单不存在</div>;

  const goAction = async (apiPath: string, successMsg: string, body: any = {}) => {
    const p = new Promise<GeolocationPosition>((res, rej) => navigator.geolocation?.getCurrentPosition(res, rej, { timeout: 5000 }));
    try {
      const pos = await p.catch(() => ({ coords: { latitude: 23.1291, longitude: 113.2644 } }));
      const { latitude: lat, longitude: lon } = (pos as any).coords;
      await api.post(`/courier/tasks/${id}/${apiPath}`, { lat, lon, ...body });
      message.success(successMsg);
      load();
    } catch (e: any) { if (e?.message) message.error(e.message); }
  };

  const pickupModal = () => Modal.confirm({
    title: '完成收件操作',
    content: (
      <Form form={form} layout="vertical">
        <Form.Item label="材料清单" name="materials" initialValue={['证件原件', '申请表', '身份证复印件']}>
          <Checkbox.Group options={['证件原件', '申请表', '身份证复印件', '照片回执', '户口本页', '其他材料']} />
        </Form.Item>
        <Form.Item label="签收人姓名" name="signerName" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="签收人身份证" name="signerIdCard" rules={[{ pattern: /^\d{17}[0-9Xx]$/ }]}><Input maxLength={18} /></Form.Item>
        <Form.Item label="收件照片" name="photoUrl" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
          <Upload listType="picture-card" beforeUpload={() => false} maxCount={3}>
            <CameraOutlined /><div style={{ marginTop: 4 }}>拍照</div>
          </Upload>
        </Form.Item>
      </Form>
    ),
    okText: '确认收件',
    onOk: async () => {
      const vals = await form.validateFields();
      await goAction('pickup', '收件完成，材料已上传系统', {
        materials: vals.materials, signerName: vals.signerName, signerIdCard: vals.signerIdCard,
        photoUrl: vals.photoUrl?.[0]?.url || '/mock-pickup.jpg',
      });
    },
  });

  return (
    <div>
      <div className="courier-header" style={{ padding: 16 }}>
        <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', marginBottom: 10, cursor: 'pointer' }}>
          <ArrowLeftOutlined style={{ marginRight: 8 }} />返回
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>工单：{task.taskNo}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{task.taskType} · {task.orderNo}</div>
          </div>
          <Tag color="processing">{task.status}</Tag>
        </div>
      </div>

      <div style={{ padding: 16, background: '#fff' }}>
        <Steps size="small" direction="vertical" current={statusStepIdx[task.status] || 0} items={stepTitles.map(t => ({ title: t }))} />
      </div>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title={<span><EnvironmentOutlined /> 收件地址</span>}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="地址">{`广州市天河区天河路385号（模拟）`}</Descriptions.Item>
          <Descriptions.Item label="联系人">张**</Descriptions.Item>
          <Descriptions.Item label="联系电话">139****5678</Descriptions.Item>
          <Descriptions.Item label="距离">{task.distance}km</Descriptions.Item>
        </Descriptions>
        <div className="map-placeholder">
          <div className="map-pin" style={{ top: '30%', left: '55%' }}>🏃</div>
          <div className="map-pin" style={{ top: '65%', left: '35%' }}>📍</div>
          <span>📱 LBS实时导航：直线距离{task.distance}km</span>
        </div>
      </Card>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title={<span><InboxOutlined /> 工单信息</span>}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="业务类型">{task.orderType?.replace(/_/g, ' / ')}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="预约时段">{task.appointment ? `${dayjs(task.appointment.from).format('MM-DD HH:mm')}~${dayjs(task.appointment.to).format('HH:mm')}` : '立即'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <div style={{ padding: 16 }}>
        {task.status === 'PENDING' && <Button type="primary" block size="large" onClick={() => goAction('accept', '已接单')}>接单</Button>}
        {task.status === 'ACCEPTED' && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block size="large" onClick={() => goAction('enroute', '已出发，导航前往')}>🚗 出发前往</Button>
            <Button block onClick={() => navigate(-1)}>稍后处理</Button>
          </Space>
        )}
        {task.status === 'EN_ROUTE' && <Button type="primary" block size="large" onClick={() => goAction('arrive', '已到达收件地址')}>✅ 我已到达</Button>}
        {task.status === 'ARRIVED' && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block size="large" onClick={pickupModal}>📦 完成收件</Button>
          </Space>
        )}
        {(task.status === 'PICKED' || task.status === 'DELIVERING') && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block size="large" onClick={() => Modal.confirm({
              title: '完成派件',
              content: (
                <Form layout="vertical">
                  <Form.Item label="签收人" name="signerName" rules={[{ required: true }]}><Input /></Form.Item>
                  <Form.Item label="签收方式"><Radio.Group defaultValue="signed"><Radio value="signed">本人签收</Radio><Radio value="代签">代收</Radio></Radio.Group></Form.Item>
                </Form>
              ),
              onOk: async () => { await goAction('deliver', '派件完成', { photoUrl: '/mock-sign.jpg', signerName: '本人', signed: true }); },
            })}>📮 完成派件</Button>
          </Space>
        )}
        {task.status === 'COMPLETED' && (
          <Card style={{ borderRadius: 10, background: '#F0FFF4', border: '1px solid #B7EB8F', textAlign: 'center' }}>
            <CheckSquareOutlined style={{ fontSize: 36, color: '#52C41A' }} />
            <div style={{ marginTop: 8, fontWeight: 600, color: '#389E0D' }}>本工单已完成</div>
          </Card>
        )}
      </div>
    </div>
  );
};

import { Checkbox } from 'antd';
export default TaskDetailPage;
