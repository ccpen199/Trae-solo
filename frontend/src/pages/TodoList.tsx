import React, { useState } from 'react';
import { Table, Card, Tag, Button, Space, Select, Modal, Form, Input, message, DatePicker } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../services/api';
import { Todo, TodoStatus, TodoPriority, TodoType } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const TodoList: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    type: undefined as string | undefined,
    priority: undefined as string | undefined,
    page: 1,
    pageSize: 10,
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['todos', filters],
    queryFn: async () => {
      const params: any = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      const response = await todoApi.getList(params);
      return response.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['todoStats'],
    queryFn: async () => {
      const response = await todoApi.getStats();
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await todoApi.create(values);
      return response.data;
    },
    onSuccess: () => {
      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await todoApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新失败');
    },
  });

  const handleStatusChange = (id: string, status: TodoStatus) => {
    updateMutation.mutate({ id, data: { status } });
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: TodoType) => {
        const typeText: Record<TodoType, string> = {
          ORDER_REVIEW: '订单审核',
          ACCOUNT_REVIEW: '账号审核',
          EXCEPTION_HANDLE: '异常处理',
          CUSTOMER_FOLLOWUP: '客户跟进',
          OTHER: '其他',
        };
        return typeText[type] || type;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: TodoPriority) => {
        const colorMap: Record<TodoPriority, string> = {
          LOW: 'default',
          MEDIUM: 'orange',
          HIGH: 'red',
          URGENT: 'magenta',
        };
        const priorityText: Record<TodoPriority, string> = {
          LOW: '低',
          MEDIUM: '中',
          HIGH: '高',
          URGENT: '紧急',
        };
        return <Tag color={colorMap[priority]}>{priorityText[priority]}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: TodoStatus, record: Todo) => {
        const colorMap: Record<TodoStatus, string> = {
          PENDING: 'orange',
          IN_PROGRESS: 'processing',
          COMPLETED: 'success',
          CANCELED: 'default',
        };
        const statusText: Record<TodoStatus, string> = {
          PENDING: '待处理',
          IN_PROGRESS: '处理中',
          COMPLETED: '已完成',
          CANCELED: '已取消',
        };
        return (
          <Select
            value={status}
            style={{ width: 100 }}
            size="small"
            onChange={(val) => handleStatusChange(record.id, val)}
          >
            <Select.Option value="PENDING">待处理</Select.Option>
            <Select.Option value="IN_PROGRESS">处理中</Select.Option>
            <Select.Option value="COMPLETED">已完成</Select.Option>
            <Select.Option value="CANCELED">已取消</Select.Option>
          </Select>
        );
      },
    },
    {
      title: '截止时间',
      dataIndex: 'dueAt',
      key: 'dueAt',
      width: 160,
      render: (time: string | null) => {
        if (!time) return '-';
        const isOverdue = dayjs(time).isBefore(dayjs());
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {dayjs(time).format('YYYY-MM-DD HH:mm')}
          </span>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 160,
      render: (time: string | null) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>总数</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statsData?.total || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>待处理</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
              {statsData?.byStatus?.PENDING || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>处理中</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {statsData?.byStatus?.IN_PROGRESS || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>已完成</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              {statsData?.byStatus?.COMPLETED || 0}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="large">
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => setFilters((prev) => ({ ...prev, status: val, page: 1 }))}
            >
              <Option value="PENDING">待处理</Option>
              <Option value="IN_PROGRESS">处理中</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="CANCELED">已取消</Option>
            </Select>
            <Select
              placeholder="选择类型"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => setFilters((prev) => ({ ...prev, type: val, page: 1 }))}
            >
              <Option value="ORDER_REVIEW">订单审核</Option>
              <Option value="ACCOUNT_REVIEW">账号审核</Option>
              <Option value="EXCEPTION_HANDLE">异常处理</Option>
              <Option value="CUSTOMER_FOLLOWUP">客户跟进</Option>
              <Option value="OTHER">其他</Option>
            </Select>
            <Select
              placeholder="选择优先级"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => setFilters((prev) => ({ ...prev, priority: val, page: 1 }))}
            >
              <Option value="LOW">低</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="HIGH">高</Option>
              <Option value="URGENT">紧急</Option>
            </Select>
          </Space>
          <Button type="primary" onClick={() => setCreateModalVisible(true)}>
            新建待办
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total: data?.pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(pagination) => setFilters((prev) => ({ ...prev, page: pagination.current, pageSize: pagination.pageSize }))}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="新建待办"
        open={createModalVisible}
        onOk={() => {
          form.validateFields().then((values) => {
            const submitData = {
              ...values,
              dueAt: values.dueAt ? values.dueAt.toISOString() : undefined,
            };
            createMutation.mutate(submitData);
          });
        }}
        onCancel={() => setCreateModalVisible(false)}
        confirmLoading={createMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入待办标题" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Select.Option value="ORDER_REVIEW">订单审核</Select.Option>
              <Select.Option value="ACCOUNT_REVIEW">账号审核</Select.Option>
              <Select.Option value="EXCEPTION_HANDLE">异常处理</Select.Option>
              <Select.Option value="CUSTOMER_FOLLOWUP">客户跟进</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            initialValue="MEDIUM"
          >
            <Select>
              <Select.Option value="LOW">低</Select.Option>
              <Select.Option value="MEDIUM">中</Select.Option>
              <Select.Option value="HIGH">高</Select.Option>
              <Select.Option value="URGENT">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dueAt"
            label="截止时间"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={4} placeholder="请输入待办描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TodoList;
