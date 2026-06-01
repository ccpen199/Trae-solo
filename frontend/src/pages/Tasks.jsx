import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Radio,
  InputNumber,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { tasksApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const taskStatusMap = {
  pending_review: { color: 'orange', label: '待审核' },
  approved: { color: 'blue', label: '已通过' },
  rejected: { color: 'red', label: '已拒绝' },
  sending: { color: 'processing', label: '发送中' },
  completed: { color: 'green', label: '已完成' },
  failed: { color: 'error', label: '失败' }
};

const taskTypeMap = {
  transaction: { color: 'blue', label: '交易推送' },
  operation: { color: 'purple', label: '运营推送' }
};

const Tasks = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ keyword: '', status: '', task_type: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await tasksApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setData(result.data.list || []);
      setPagination(prev => ({
        ...prev,
        total: result.data.total || 0
      }));
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({ keyword: '', status: '', task_type: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = async (record) => {
    try {
      const result = await tasksApi.getDetail(record.id);
      setDetailData(result.data);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  const handleReview = (record) => {
    setEditingItem(record);
    reviewForm.resetFields();
    setReviewModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await tasksApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        scheduled_time: values.scheduled_time ? values.scheduled_time.format('YYYY-MM-DD HH:mm:ss') : null
      };
      await tasksApi.create(submitData);
      message.success('创建成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields();
      await tasksApi.review(editingItem.id, {
        ...values,
        reviewer: 'admin'
      });
      message.success('审核成功');
      setReviewModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('审核失败:', error);
    }
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 150
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 200,
      ellipsis: true
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
      render: (type) => {
        const config = taskTypeMap[type] || { color: 'default', label: type };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '发送类型',
      dataIndex: 'send_type',
      key: 'send_type',
      width: 100,
      render: (type) => (
        <Tag>{type === 'immediate' ? '立即发送' : '定时发送'}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = taskStatusMap[status] || { color: 'default', label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '发送统计',
      key: 'stats',
      width: 180,
      render: (_, record) => (
        <div>
          <div>总数: {record.total_count || 0}</div>
          <div>成功: {record.success_count || 0}</div>
          <div>失败: {record.failed_count || 0}</div>
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          {record.status === 'pending_review' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleReview(record)}
            >
              审核
            </Button>
          )}
          <Popconfirm
            title="确定要删除该任务吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索标题/内容"
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="任务类型"
            value={filters.task_type || undefined}
            onChange={(value) => setFilters(prev => ({ ...prev, task_type: value }))}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="transaction">交易推送</Option>
            <Option value="operation">运营推送</Option>
          </Select>
          <Select
            placeholder="状态"
            value={filters.status || undefined}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="pending_review">待审核</Option>
            <Option value="approved">已通过</Option>
            <Option value="rejected">已拒绝</Option>
            <Option value="sending">发送中</Option>
            <Option value="completed">已完成</Option>
            <Option value="failed">失败</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建任务
          </Button>
        </Space>
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
          showTotal: (total) => `共 ${total} 条`
        }}
        onChange={(page) => setPagination({ current: page.current, pageSize: page.pageSize, total: page.total })}
        scroll={{ x: 1300 }}
      />

      <Modal
        title="创建推送任务"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="task_type"
            label="任务类型"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select placeholder="请选择任务类型">
              <Option value="transaction">交易推送</Option>
              <Option value="operation">运营推送</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="推送标题"
            rules={[{ required: true, message: '请输入推送标题' }]}
          >
            <Input placeholder="请输入推送标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="推送内容"
            rules={[{ required: true, message: '请输入推送内容' }]}
          >
            <TextArea rows={4} placeholder="请输入推送内容" />
          </Form.Item>
          <Form.Item name="jump_url" label="跳转链接">
            <Input placeholder="请输入跳转链接" />
          </Form.Item>
          <Form.Item name="image_url" label="图片链接">
            <Input placeholder="请输入图片链接" />
          </Form.Item>
          <Form.Item
            name="send_type"
            label="发送类型"
            rules={[{ required: true, message: '请选择发送类型' }]}
          >
            <Radio.Group>
              <Radio value="immediate">立即发送</Radio>
              <Radio value="scheduled">定时发送</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.send_type !== curr.send_type}>
            {({ getFieldValue }) =>
              getFieldValue('send_type') === 'scheduled' && (
                <Form.Item
                  name="scheduled_time"
                  label="定时时间"
                  rules={[{ required: true, message: '请选择定时时间' }]}
                >
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item name="target_users" label="目标用户">
            <Select placeholder="请选择目标用户" mode="tags">
              <Option value="all">全部用户</Option>
              <Option value="active">活跃用户</Option>
              <Option value="new">新用户</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="审核任务"
        open={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
        width={500}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="status"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Radio.Group>
              <Radio value="approved">通过</Radio>
              <Radio value="rejected">拒绝</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="review_comment" label="审核意见">
            <TextArea rows={3} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {detailData && (
          <div>
            <p><strong>任务ID:</strong> {detailData.task_id}</p>
            <p><strong>标题:</strong> {detailData.title}</p>
            <p><strong>内容:</strong> {detailData.content}</p>
            <p><strong>类型:</strong> {taskTypeMap[detailData.task_type]?.label || detailData.task_type}</p>
            <p><strong>发送方式:</strong> {detailData.send_type === 'immediate' ? '立即发送' : '定时发送'}</p>
            <p><strong>状态:</strong> {taskStatusMap[detailData.status]?.label || detailData.status}</p>
            <p><strong>总数:</strong> {detailData.total_count || 0}</p>
            <p><strong>成功:</strong> {detailData.success_count || 0}</p>
            <p><strong>失败:</strong> {detailData.failed_count || 0}</p>
            <p><strong>已读:</strong> {detailData.read_count || 0}</p>
            <p><strong>未读:</strong> {detailData.unread_count || 0}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tasks;
