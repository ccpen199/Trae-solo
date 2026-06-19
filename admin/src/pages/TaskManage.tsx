import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, DatePicker, Switch, App, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getTaskList, createTask, updateTask } from '../services/api';

const { RangePicker } = DatePicker;

const taskTypes = [
  { value: 'checkin', label: '签到' },
  { value: 'steps', label: '步数兑换' },
  { value: 'video', label: '视频完播' },
  { value: 'invite', label: '邀请好友' },
  { value: 'custom', label: '自定义任务' },
  { value: 'activity', label: '限时活动' },
  { value: 'festival', label: '节日专题' },
];

const TaskManage: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const data: any = await getTaskList(page, pageSize);
      setList(data.list || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const handleOpen = (record?: any) => {
    setEditing(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        timeRange: record.start_time && record.end_time ? [dayjs(record.start_time), dayjs(record.end_time)] : undefined,
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        start_time: values.timeRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.timeRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
      };
      delete payload.timeRange;

      if (editing) {
        await updateTask(editing.id, payload);
        message.success('更新成功');
      } else {
        await createTask(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '任务名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', render: (v: string) => <Tag color="blue">{taskTypes.find(t => t.value === v)?.label || v}</Tag> },
    { title: '金币奖励', dataIndex: 'reward_coins', render: (v: number) => <span style={{ color: '#f5222d', fontWeight: 600 }}>{v}</span> },
    { title: '现金奖励', dataIndex: 'reward_cash', render: (v: number) => `¥${v || 0}` },
    { title: '每日上限', dataIndex: 'daily_limit', render: (v: number) => v === 0 ? '无限制' : v },
    { title: '热门', dataIndex: 'is_hot', render: (v: number) => v ? <Tag color="red">🔥热门</Tag> : null },
    { title: '状态', dataIndex: 'is_active', render: (v: number) => v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag> },
    { title: '排序', dataIndex: 'sort_order' },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, r: any) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleOpen(r)}>编辑</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🎯 任务管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>新建任务</Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={{ current: page, pageSize, total, onChange: setPage, onShowSizeChange: (_, s) => setPageSize(s) }}
      />

      <Modal
        title={editing ? '编辑任务' : '新建任务'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
              <Input placeholder="请输入任务名称" />
            </Form.Item>
            <Form.Item name="type" label="任务类型" rules={[{ required: true }]}>
              <Select options={taskTypes} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={2} placeholder="请输入任务描述" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="reward_coins" label="金币奖励" initialValue={0}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="reward_cash" label="现金奖励(元)" initialValue={0}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="daily_limit" label="每日上限" initialValue={1}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="total_limit" label="总名额限制" initialValue={0}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="target_user_level" label="目标用户等级" initialValue={0}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="sort_order" label="排序权重" initialValue={0}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="target_regions" label="定向投放地域(逗号分隔，如:北京,上海)">
            <Input placeholder="留空表示不限地域" />
          </Form.Item>
          <Form.Item name="timeRange" label="活动时间范围(限时活动/节日专题)">
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="is_active" label="是否启用" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
            <Form.Item name="is_hot" label="热门标记" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskManage;
