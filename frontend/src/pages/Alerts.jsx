import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Select, Modal, Form, 
  message, Card, Row, Col, Input
} from 'antd';
import { EyeOutlined, CheckOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { changeAPI } from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

function Alerts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter, levelFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (levelFilter) params.level = levelFilter;
      const response = await changeAPI.getAlerts(params);
      setData(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getLevelTag = (level) => {
    const levelMap = {
      critical: { color: 'red', className: 'tag-level-critical', text: '严重' },
      high: { color: 'orange', className: 'tag-level-high', text: '高' },
      warning: { color: 'gold', className: 'tag-level-warning', text: '警告' },
      low: { color: 'blue', text: '低' },
    };
    const config = levelMap[level] || { color: 'default', className: '', text: level };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type) => {
    const typeMap = {
      permission: { color: 'red', text: '权限越权' },
      failure: { color: 'orange', text: '任务失败' },
      duplicate: { color: 'gold', text: '重复执行' },
      config: { color: 'purple', text: '配置误发' },
      security: { color: 'red', text: '信息泄露' },
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      open: { color: 'red', className: 'tag-status-failed', text: '待处理' },
      processing: { color: 'blue', className: 'tag-status-running', text: '处理中' },
      resolved: { color: 'green', className: 'tag-status-active', text: '已解决' },
    };
    const config = statusMap[status] || { color: 'default', className: '', text: status };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const handleResolve = (record) => {
    setSelectedAlert(record);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await changeAPI.updateAlert(selectedAlert.id, {
        status: 'resolved',
        resolution: values.resolution,
      });
      message.success('已标记为解决');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '告警ID',
      dataIndex: 'alert_id',
      key: 'alert_id',
      width: 140,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => getTypeTag(type),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => getLevelTag(level),
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '责任人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/alerts/${record.id}`)}
          >
            详情
          </Button>
          {record.status !== 'resolved' && (
            <Button 
              type="link" 
              size="small" 
              icon={<CheckOutlined />}
              onClick={() => handleResolve(record)}
            >
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <h1 className="page-title">告警记录</h1>
            <p style={{ color: '#666' }}>管理SDK系统告警和异常事件</p>
          </Col>
        </Row>
      </div>

      <Card>
        <div className="filter-bar">
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="open">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="resolved">已解决</Option>
          </Select>
          <Select
            placeholder="级别筛选"
            value={levelFilter}
            onChange={setLevelFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="critical">严重</Option>
            <Option value="high">高</Option>
            <Option value="warning">警告</Option>
          </Select>
          <Button onClick={loadData}>查询</Button>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title="解决告警"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="resolution" label="解决方案" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请描述解决方案" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认解决</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Alerts;
