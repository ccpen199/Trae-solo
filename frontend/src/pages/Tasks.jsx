import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Input, Select, Modal, Form, 
  message, Card, Row, Col, Checkbox, Popconfirm
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { taskAPI } from '../utils/api';

const { Option } = Select;

function Tasks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter, typeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const response = await taskAPI.getList(params);
      setData(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error(error.response?.data?.error || '加载数据失败');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', className: 'tag-status-pending', text: '待执行' },
      running: { color: 'blue', className: 'tag-status-running', text: '执行中' },
      completed: { color: 'green', className: 'tag-status-active', text: '已完成' },
      failed: { color: 'red', className: 'tag-status-failed', text: '失败' },
      cancelled: { color: 'default', className: 'tag-status-inactive', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', className: '', text: status };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type) => {
    const typeMap = {
      deploy: { color: 'blue', text: '部署' },
      config: { color: 'purple', text: '配置' },
      rollback: { color: 'orange', text: '回滚' },
      restart: { color: 'cyan', text: '重启' },
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await taskAPI.create(values);
      message.success('任务创建成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleBatchCancel = async () => {
    try {
      await taskAPI.batchAction({ ids: selectedRowKeys, action: 'cancel' });
      message.success('批量取消成功');
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 160,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
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
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: '环境',
      dataIndex: 'env_name',
      key: 'env_name',
      width: 100,
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
            onClick={() => navigate(`/tasks/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/tasks/${record.id}`)}
            >
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
        <Row justify="space-between" align="middle">
          <Col>
            <h1 className="page-title">执行任务</h1>
            <p style={{ color: '#666' }}>管理SDK部署、配置变更和回滚等执行任务</p>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建任务
            </Button>
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
            <Option value="pending">待执行</Option>
            <Option value="running">执行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="failed">失败</Option>
          </Select>
          <Select
            placeholder="类型筛选"
            value={typeFilter}
            onChange={setTypeFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="deploy">部署</Option>
            <Option value="config">配置</Option>
            <Option value="rollback">回滚</Option>
            <Option value="restart">重启</Option>
          </Select>
          <Button onClick={loadData}>查询</Button>
        </div>

        {selectedRowKeys.length > 0 && (
          <div className="batch-actions">
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Popconfirm
              title="确定要取消选中的任务吗？"
              onConfirm={handleBatchCancel}
              okText="确定"
              cancelText="取消"
            >
              <Button danger>批量取消</Button>
            </Popconfirm>
          </div>
        )}

        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status === 'running' || record.status === 'completed',
            }),
          }}
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
        title="新建任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="type" label="任务类型" rules={[{ required: true }]}>
            <Select>
              <Option value="deploy">部署</Option>
              <Option value="config">配置变更</Option>
              <Option value="rollback">版本回滚</Option>
              <Option value="restart">服务重启</Option>
            </Select>
          </Form.Item>
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Tasks;
