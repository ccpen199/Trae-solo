import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Space, Modal, Form, Input, Switch, message, Typography, Spin, Row, Col, Statistic } from 'antd';
import { PlusOutlined, CloudSyncOutlined, CloudOutlined, MobileOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

const statusColor = { pending: 'orange', in_progress: 'blue', completed: 'green' };
const statusMap = { pending: '待处理', in_progress: '进行中', completed: '已完成' };
const typeMap = { collect: '信息采集', verify: '核实校验', loan_assist: '贷款协助', payment_remind: '缴费提醒' };

export default function CoordinatorTasks() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [coordinator, setCoordinator] = useState('');
  const [status, setStatus] = useState('');
  const [coordinators, setCoordinators] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/coordinator/coordinators').then(r => setCoordinators(r.data || [])).catch(() => {});
  }, []);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 10 };
      if (coordinator) params.coordinator_name = coordinator;
      if (status) params.status = status;
      const res = await api.get('/coordinator/tasks', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    const vals = await form.validateFields();
    try {
      await api.post('/coordinator/tasks', vals);
      message.success('任务已创建');
      setAddModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const handleSync = (rec) => {
    Modal.confirm({
      title: '标记为已同步?',
      content: `任务: ${rec.description}`,
      onOk: async () => {
        try {
          await api.put(`/coordinator/tasks/${rec.id}/sync`, { status: 'completed' });
          message.success('同步完成');
          load();
        } catch (e) { message.error(e.message); }
      },
    });
  };

  const columns = [
    { title: '协理员', dataIndex: 'coordinator_name', width: 100 },
    { title: '负责村', dataIndex: 'village', width: 100 },
    { title: '任务类型', dataIndex: 'task_type', width: 120, render: v => typeMap[v] || v },
    { title: '任务描述', dataIndex: 'description', width: 220 },
    { title: '状态', dataIndex: 'status', width: 100, render: v => <Tag color={statusColor[v]}>{statusMap[v]}</Tag> },
    { title: '离线模式', dataIndex: 'offline_flag', width: 100, render: v => v ? <Tag color="orange"><CloudOutlined /> 离线</Tag> : <Tag color="green"><CloudSyncOutlined /> 在线</Tag> },
    { title: '同步时间', dataIndex: 'synced_at', width: 170, render: v => v || '-' },
    { title: '操作', width: 140, render: (_, r) => r.offline_flag === 1 && r.status !== 'completed' && (
      <Button size="small" icon={<CloudSyncOutlined />} onClick={() => handleSync(r)}>同步</Button>
    ) },
  ];

  const pendingCount = data.filter(d => d.status === 'pending').length;
  const offlineCount = data.filter(d => d.offline_flag === 1).length;

  return (
    <div>
      <Title level={4}>村级协理员任务中心</Title>
      <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8, marginBottom: 16 }}>
        <Space>
          <MobileOutlined style={{ fontSize: 24, color: '#1B5E20' }} />
          <span style={{ fontSize: 14 }}>支持移动端采集信息、离线业务处理及云端同步 | 对接农业农村部数据平台 | 对接地方政务服务平台</span>
        </Space>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="待处理任务" value={pendingCount} suffix="项" valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="离线处理中" value={offlineCount} suffix="项" prefix={<CloudOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="协理员" value={coordinators.length} suffix="人" valueStyle={{ color: '#1B5E20' }} /></Card></Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select placeholder="协理员" value={coordinator || undefined} onChange={v => { setCoordinator(v || ''); load(1); }} style={{ width: 150 }} allowClear>
          {coordinators.map(c => <Option key={c.coordinator_name} value={c.coordinator_name}>{c.coordinator_name} - {c.village}</Option>)}
        </Select>
        <Select placeholder="状态" value={status || undefined} onChange={v => { setStatus(v || ''); load(1); }} style={{ width: 120 }} allowClear>
          <Option value="pending">待处理</Option>
          <Option value="in_progress">进行中</Option>
          <Option value="completed">已完成</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAddModal(true); }}>指派任务</Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); load(p); } }} scroll={{ x: 1100 }} />

      <Modal title="指派协理员任务" open={addModal} onOk={submitAdd} onCancel={() => setAddModal(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item label="协理员姓名" name="coordinator_name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="负责村" name="village" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="任务类型" name="task_type" rules={[{ required: true }]}>
            <Select>
              <Option value="collect">信息采集</Option>
              <Option value="verify">核实校验</Option>
              <Option value="loan_assist">贷款协助</Option>
              <Option value="payment_remind">缴费提醒</Option>
            </Select>
          </Form.Item>
          <Form.Item label="任务描述" name="description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="是否离线任务" name="offline_flag" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
