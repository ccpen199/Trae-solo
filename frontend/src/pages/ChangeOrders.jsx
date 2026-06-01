import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Descriptions, Row, Col } from 'antd';
import { PlusOutlined, CheckOutlined, PlayCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { changeOrderAPI, applicationAPI } from '../services/api';
import dayjs from 'dayjs';

const ChangeOrders = () => {
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
      const res = await changeOrderAPI.list();
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
    setModalVisible(true);
  };

  const handleView = async (record) => {
    const res = await changeOrderAPI.get(record.id);
    setViewingRecord(res.data);
    setDetailVisible(true);
  };

  const handleApprove = async (record) => {
    try {
      await changeOrderAPI.approve(record.id);
      message.success('审批成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '审批失败');
    }
  };

  const handleExecute = async (record) => {
    try {
      await changeOrderAPI.execute(record.id);
      message.success('执行成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '执行失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await changeOrderAPI.create(values);
      message.success('创建成功');
      setModalVisible(false);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const canApprove = ['admin', 'ops', 'security'].includes(user.role);
  const canExecute = ['admin', 'ops'].includes(user.role);

  const statusColorMap = {
    draft: 'default',
    submitted: 'blue',
    approved: 'cyan',
    executed: 'green',
    cancelled: 'red',
  };

  const riskColorMap = {
    low: 'green',
    medium: 'orange',
    high: 'red',
  };

  const columns = [
    {
      title: '变更单ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 130,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
    },
    {
      title: '变更类型',
      dataIndex: 'change_type',
      key: 'change_type',
      width: 120,
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (level) => <Tag color={riskColorMap[level]}>{level}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '创建人',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
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
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          {record.status === 'draft' && canApprove && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
              审批
            </Button>
          )}
          {record.status === 'approved' && canExecute && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleExecute(record)}>
              执行
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">变更单</h2>
        <Space>
          <Button onClick={loadData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建变更单
          </Button>
        </Space>
      </div>

      <div className="card-content">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </div>

      <Modal
        title="新建变更单"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="app_id" label="应用" rules={[{ required: true }]}>
            <Select>
              {apps.map(app => (
                <Select.Option key={app.id} value={app.id}>{app.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="change_type" label="变更类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="rule_add">新增规则</Select.Option>
              <Select.Option value="rule_update">修改规则</Select.Option>
              <Select.Option value="rule_delete">删除规则</Select.Option>
              <Select.Option value="app_config">应用配置</Select.Option>
              <Select.Option value="system">系统变更</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="old_value" label="变更前内容">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="new_value" label="变更后内容">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="risk_level" label="风险等级" initialValue="low">
            <Select>
              <Select.Option value="low">低风险</Select.Option>
              <Select.Option value="medium">中风险</Select.Option>
              <Select.Option value="high">高风险</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="rollback_plan" label="回滚方案">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {viewingRecord && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="变更单ID">{viewingRecord.order_id}</Descriptions.Item>
              <Descriptions.Item label="应用">{viewingRecord.app_name}</Descriptions.Item>
              <Descriptions.Item label="变更类型">{viewingRecord.change_type}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColorMap[viewingRecord.status]}>{viewingRecord.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={riskColorMap[viewingRecord.risk_level]}>{viewingRecord.risk_level}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{viewingRecord.created_by_name}</Descriptions.Item>
              <Descriptions.Item label="审批人">{viewingRecord.approved_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="执行时间">
                {viewingRecord.executed_at ? dayjs(viewingRecord.executed_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <h4>描述</h4>
              <p>{viewingRecord.description || '-'}</p>
            </div>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <h4>变更前</h4>
                <div style={{ padding: 12, background: '#fff2f0', borderRadius: 4, minHeight: 60 }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{viewingRecord.old_value || '-'}</pre>
                </div>
              </Col>
              <Col span={12}>
                <h4>变更后</h4>
                <div style={{ padding: 12, background: '#f6ffed', borderRadius: 4, minHeight: 60 }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{viewingRecord.new_value || '-'}</pre>
                </div>
              </Col>
            </Row>
            {viewingRecord.rollback_plan && (
              <div style={{ marginTop: 16 }}>
                <h4>回滚方案</h4>
                <p>{viewingRecord.rollback_plan}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChangeOrders;
