import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Tag, message, Select } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { alertAPI, applicationAPI } from '../services/api';
import dayjs from 'dayjs';

const Alerts = () => {
  const [data, setData] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [handlingRecord, setHandlingRecord] = useState(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
    loadApps();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await alertAPI.list(filters);
      setData(res.data);
    } catch (err) {
      console.error('加载失败');
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

  const handleOpenHandle = (record) => {
    setHandlingRecord(record);
    form.resetFields();
    setHandleModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await alertAPI.handle(handlingRecord.id, values);
      message.success('处理成功');
      setHandleModalVisible(false);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '处理失败');
    }
  };

  const severityColorMap = {
    critical: 'red',
    error: 'orange',
    warning: 'gold',
    info: 'blue',
  };

  const columns = [
    {
      title: '告警ID',
      dataIndex: 'alert_id',
      key: 'alert_id',
      width: 130,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 120,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s) => <Tag color={severityColorMap[s]}>{s}</Tag>,
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'open' ? 'red' : 'green'}>
          {status === 'open' ? '待处理' : '已处理'}
        </Tag>
      ),
    },
    {
      title: '处理人',
      dataIndex: 'handled_by_name',
      key: 'handled_by_name',
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
      width: 100,
      render: (_, record) => record.status === 'open' && (
        <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleOpenHandle(record)}>
          处理
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">告警中心</h2>
        <Button onClick={loadData}>刷新</Button>
      </div>

      <div className="filter-form">
        <Space>
          <Select
            style={{ width: 150 }}
            placeholder="状态"
            allowClear
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Select.Option value="open">待处理</Select.Option>
            <Select.Option value="handled">已处理</Select.Option>
          </Select>
          <Select
            style={{ width: 150 }}
            placeholder="严重程度"
            allowClear
            onChange={(v) => setFilters({ ...filters, severity: v })}
          >
            <Select.Option value="critical">严重</Select.Option>
            <Select.Option value="error">错误</Select.Option>
            <Select.Option value="warning">警告</Select.Option>
            <Select.Option value="info">信息</Select.Option>
          </Select>
          <Select
            style={{ width: 200 }}
            placeholder="应用"
            allowClear
            onChange={(v) => setFilters({ ...filters, appId: v })}
          >
            {apps.map(app => (
              <Select.Option key={app.id} value={app.id}>{app.name}</Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={loadData}>查询</Button>
          <Button onClick={() => { setFilters({}); loadData(); }}>重置</Button>
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
        title="处理告警"
        open={handleModalVisible}
        onOk={handleSubmit}
        onCancel={() => setHandleModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="告警标题">
            <Input value={handlingRecord?.title} disabled />
          </Form.Item>
          <Form.Item name="remark" label="处理备注">
            <Input.TextArea rows={4} placeholder="请输入处理备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Alerts;
