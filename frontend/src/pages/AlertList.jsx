import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, message, Typography, Card,
  Select, Modal, Input
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { alertApi } from '../services/api.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const severityColors = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
  low: 'green'
};

const statusColors = {
  open: 'red',
  acknowledged: 'blue',
  resolved: 'green',
  closed: 'default'
};

function AlertList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [closureBasis, setClosureBasis] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await alertApi.getList({ ...filters, page, page_size: pageSize });
      setData(response.data.data);
      setPagination({
        current: page,
        pageSize,
        total: response.data.total
      });
    } catch (error) {
      message.error('加载告警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (record) => {
    try {
      await alertApi.acknowledge(record.id);
      message.success('已确认告警');
      loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleResolve = (record) => {
    setCurrentAlert(record);
    setClosureBasis('');
    setResolveModalVisible(true);
  };

  const confirmResolve = async () => {
    try {
      await alertApi.resolve(currentAlert.id, { closure_basis: closureBasis });
      message.success('告警已解决');
      setResolveModalVisible(false);
      loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleClose = async (record) => {
    try {
      await alertApi.close(record.id, { closure_basis: '手动关闭' });
      message.success('告警已关闭');
      loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const getAlertClass = (severity) => {
    return `alert-${severity}`;
  };

  const columns = [
    {
      title: '告警标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
        </div>
      )
    },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (s) => <Tag color={severityColors[s]}>{s}</Tag>,
      filters: [
        { text: '严重', value: 'critical' },
        { text: '高', value: 'high' },
        { text: '中', value: 'medium' },
        { text: '低', value: 'low' }
      ],
      onFilter: (value, record) => record.severity === value
    },
    { title: '应用', dataIndex: 'app_name', key: 'app_name' },
    { title: '责任人', dataIndex: 'responsible_user_name', key: 'responsible_user_name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={statusColors[s]}>{s}</Tag>
    },
    { title: '建议动作', dataIndex: 'suggested_action', key: 'suggested_action', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'open' && (
            <Button type="link" size="small" onClick={() => handleAcknowledge(record)}>确认</Button>
          )}
          {['open', 'acknowledged'].includes(record.status) && (
            <Button type="link" size="small" onClick={() => handleResolve(record)}>解决</Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleClose(record)}>关闭</Button>
        </Space>
      )
    }
  ];

  return (
    <div className="table-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>告警中心</Title>
          <Text type="secondary">管理系统告警和异常事件</Text>
        </div>
        <Space>
          <Select
            placeholder="按状态筛选"
            style={{ width: 120 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Option value="open">待处理</Option>
            <Option value="acknowledged">已确认</Option>
            <Option value="resolved">已解决</Option>
            <Option value="closed">已关闭</Option>
          </Select>
          <Select
            placeholder="按严重程度筛选"
            style={{ width: 120 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, severity: v })}
          >
            <Option value="critical">严重</Option>
            <Option value="high">高</Option>
            <Option value="medium">中</Option>
            <Option value="low">低</Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        rowClassName={(record) => getAlertClass(record.severity)}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData(page, pageSize)
        }}
      />

      <Modal
        title="解决告警"
        open={resolveModalVisible}
        onOk={confirmResolve}
        onCancel={() => setResolveModalVisible(false)}
        okText="确认解决"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>告警标题：</Text>
          <Text>{currentAlert?.title}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>关闭依据：</Text>
        </div>
        <TextArea
          rows={4}
          value={closureBasis}
          onChange={(e) => setClosureBasis(e.target.value)}
          placeholder="请描述问题原因和解决方案"
        />
      </Modal>
    </div>
  );
}

export default AlertList;
