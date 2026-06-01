import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm, Descriptions, Row, Col } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, PlayCircleOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { taskAPI, applicationAPI, ruleAPI } from '../services/api';
import dayjs from 'dayjs';

const Tasks = () => {
  const [data, setData] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
    loadApps();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await taskAPI.list();
      setData(res.data);
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      const res = await applicationAPI.list();
      setApps(res.data);
    } catch (err) {
      console.error('加载应用失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ rule_version: 1 });
    setModalVisible(true);
  };

  const handleAppChange = async (appId) => {
    if (appId) {
      try {
        const res = await ruleAPI.getVersion(appId);
        form.setFieldsValue({ rule_version: res.data.max_version || 1 });
      } catch (err) {
        console.error('获取规则版本失败');
      }
    }
  };

  const handleView = async (record) => {
    const res = await taskAPI.get(record.id);
    setViewingRecord(res.data);
    setDetailVisible(true);
  };

  const handleApprove = async (record) => {
    try {
      await taskAPI.approve(record.id, {});
      message.success('审批成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '审批失败');
    }
  };

  const handleExecute = async (record) => {
    try {
      await taskAPI.execute(record.id);
      message.success('执行中，请稍后刷新查看结果');
      setTimeout(loadData, 2000);
    } catch (err) {
      message.error(err.response?.data?.error || '执行失败');
    }
  };

  const handleRetry = async (record) => {
    try {
      await taskAPI.retry(record.id);
      message.success('已创建重试任务');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '重试失败');
    }
  };

  const handleCancel = async (record) => {
    try {
      await taskAPI.cancel(record.id);
      message.success('取消成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '取消失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await taskAPI.create(values);
      message.success('创建成功');
      setModalVisible(false);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const canApprove = ['admin', 'ops', 'security'].includes(user.role);

  const statusColorMap = {
    pending: 'orange',
    approved: 'blue',
    running: 'cyan',
    completed: 'green',
    failed: 'red',
    cancelled: 'default',
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 130,
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      width: 120,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p) => {
        const colorMap = { high: 'red', medium: 'orange', low: 'green' };
        return <Tag color={colorMap[p]}>{p}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '申请人',
      dataIndex: 'requested_by_name',
      key: 'requested_by_name',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          {record.status === 'pending' && canApprove && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
              审批
            </Button>
          )}
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleExecute(record)}>
              执行
            </Button>
          )}
          {record.status === 'failed' && (
            <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => handleRetry(record)}>
              重试
            </Button>
          )}
          {['pending', 'approved'].includes(record.status) && (
            <Popconfirm title="确定取消？" onConfirm={() => handleCancel(record)}>
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">执行任务</h2>
        <Space>
          <Button onClick={loadData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建任务
          </Button>
        </Space>
      </div>

      <div className="card-content">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
        />
      </div>

      <Modal
        title="新建任务"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="app_id" label="应用" rules={[{ required: true }]}>
            <Select onChange={handleAppChange}>
              {apps.map(app => (
                <Select.Option key={app.id} value={app.id}>{app.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="operation_type" label="操作类型" rules={[{ required: true }]} initialValue="mask">
            <Select>
              <Select.Option value="mask">日志脱敏</Select.Option>
              <Select.Option value="batch_mask">批量脱敏</Select.Option>
              <Select.Option value="preview">规则预览</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="input_data" label="输入内容" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="请输入需要脱敏的日志内容" />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="rule_version" label="规则版本" initialValue={1}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="任务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {viewingRecord && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="任务ID">{viewingRecord.task_id}</Descriptions.Item>
              <Descriptions.Item label="应用">{viewingRecord.app_name}</Descriptions.Item>
              <Descriptions.Item label="操作类型">{viewingRecord.operation_type}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColorMap[viewingRecord.status]}>{viewingRecord.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">{viewingRecord.priority}</Descriptions.Item>
              <Descriptions.Item label="规则版本">{viewingRecord.rule_version}</Descriptions.Item>
              <Descriptions.Item label="申请人">{viewingRecord.requested_by_name}</Descriptions.Item>
              <Descriptions.Item label="审批人">{viewingRecord.approved_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="执行人">{viewingRecord.executed_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(viewingRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <h4>原始内容</h4>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{viewingRecord.input_data}</pre>
                </div>
              </Col>
              <Col span={12}>
                <h4>处理结果</h4>
                <div style={{ padding: 12, background: '#f0f7ff', borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{viewingRecord.output_data || '-'}</pre>
                </div>
              </Col>
            </Row>
            {viewingRecord.error_message && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4 }}>
                <strong>错误信息:</strong> {viewingRecord.error_message}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tasks;
