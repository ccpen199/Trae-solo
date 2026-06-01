import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, message, Space, Tag, Input, DatePicker } from 'antd';
import { PlusOutlined, EyeOutlined, StopOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { canCreate, canExecute, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function Tasks() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    setUserRole(getCurrentRole());
    loadData();
    loadStrategies();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current, pageSize: pagination.pageSize, ...filters };
      const response = await api.get('/tasks', { params });
      setData(response.data.list);
      setPagination(p => ({ ...p, total: response.data.total }));
    } finally {
      setLoading(false);
    }
  };

  const loadStrategies = async () => {
    try {
      const response = await api.get('/strategies', { params: { status: 'active', pageSize: 100 } });
      setStrategies(response.data.list);
    } catch (e) {}
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleCancel = async (record) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消任务「${record.task_no}」吗？`,
      onOk: async () => {
        try {
          await api.post(`/tasks/${record.id}/cancel`);
          message.success('取消成功');
          loadData();
        } catch (error) {
          message.error(error.response?.data?.error || '取消失败');
        }
      }
    });
  };

  const handleRetry = async (record) => {
    Modal.confirm({
      title: '确认重试',
      content: `确定要重试任务「${record.task_no}」吗？`,
      onOk: async () => {
        try {
          await api.post(`/tasks/${record.id}/retry`);
          message.success('重试任务已提交');
          loadData();
        } catch (error) {
          message.error(error.response?.data?.error || '重试失败');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      await api.post('/tasks', values);
      message.success('任务提交成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const statusColor = {
    success: 'green',
    failed: 'red',
    running: 'blue',
    pending: 'orange',
    cancelled: 'default',
    partially_success: 'gold'
  };

  const statusNames = {
    success: '成功',
    failed: '失败',
    running: '执行中',
    pending: '待执行',
    cancelled: '已取消',
    partially_success: '部分成功'
  };

  const taskTypeNames = {
    backup: '备份',
    restore: '恢复',
    verify: '校验',
    delete: '删除'
  };

  const columns = [
    { title: '任务编号', dataIndex: 'task_no', key: 'task_no', width: 160 },
    { title: '任务类型', dataIndex: 'task_type', key: 'task_type', width: 80,
      render: (v) => taskTypeNames[v] || v
    },
    { title: '应用', dataIndex: 'app_name', key: 'app_name', width: 100 },
    { title: '环境', dataIndex: 'env_name', key: 'env_name', width: 100 },
    { title: '策略', dataIndex: 'strategy_name', key: 'strategy_name', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => <Tag color={statusColor[v]}>{statusNames[v]}</Tag>
    },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (v) => ({ low: '低', normal: '普通', high: '高', urgent: '紧急' }[v])
    },
    { title: '操作人', dataIndex: 'operator_name', key: 'operator_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/tasks/${record.id}`)}>
            详情
          </Button>
          {['pending', 'running'].includes(record.status) && canExecute(userRole, 'task') && (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleCancel(record)}>
              取消
            </Button>
          )}
          {record.status === 'failed' && canExecute(userRole, 'task') && (
            <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => handleRetry(record)}>
              重试
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="table-toolbar">
        <h1 className="page-title">执行任务</h1>
        {canCreate(userRole, 'task') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建任务
          </Button>
        )}
      </div>

      <div className="table-filters" style={{ marginBottom: 16 }}>
        <Select 
          placeholder="任务状态" 
          style={{ width: 120 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, status: v }))}
        >
          <Select.Option value="pending">待执行</Select.Option>
          <Select.Option value="running">执行中</Select.Option>
          <Select.Option value="success">成功</Select.Option>
          <Select.Option value="failed">失败</Select.Option>
        </Select>
        <Select 
          placeholder="任务类型" 
          style={{ width: 120 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, task_type: v }))}
        >
          <Select.Option value="backup">备份</Select.Option>
          <Select.Option value="restore">恢复</Select.Option>
          <Select.Option value="verify">校验</Select.Option>
        </Select>
        <DatePicker 
          placeholder="开始日期" 
          onChange={(d) => setFilters(f => ({ ...f, start_date: d?.format('YYYY-MM-DD') }))}
        />
        <DatePicker 
          placeholder="结束日期" 
          onChange={(d) => setFilters(f => ({ ...f, end_date: d?.format('YYYY-MM-DD') }))}
        />
        <Input.Search 
          placeholder="搜索" 
          style={{ width: 200 }} 
          allowClear
          onSearch={(v) => setFilters(f => ({ ...f, keyword: v }))}
          enterButton={<SearchOutlined />}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
        }}
      />

      <Modal
        title="新建备份任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="strategy_id" label="备份策略" rules={[{ required: true }]}>
            <Select placeholder="请选择备份策略">
              {strategies.filter(s => s.status === 'active').map(s => (
                <Select.Option key={s.id} value={s.id}>{s.strategy_name} ({s.app_name} - {s.env_name})</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="task_type" label="任务类型" rules={[{ required: true }]} initialValue="backup">
            <Select>
              <Select.Option value="backup">备份</Select.Option>
              <Select.Option value="restore">恢复</Select.Option>
              <Select.Option value="verify">校验</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="normal">
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="normal">普通</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交执行
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Tasks;
