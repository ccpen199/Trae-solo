import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag } from 'antd';
import { PlusOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { crawlTasks, competitors } from '../api.js';

const CrawlTasks = ({ currentUser }) => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [competitorList, setCompetitorList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasks, comps] = await Promise.all([
        crawlTasks.getAll(),
        competitors.getAll()
      ]);
      setList(tasks);
      setCompetitorList(comps);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await crawlTasks.create({ ...values, created_by: currentUser?.username || 'system' });
      message.success('创建成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleExecute = async (taskId) => {
    try {
      await crawlTasks.workflow(taskId, {
        action: 'execute',
        operator: currentUser?.username || 'system'
      });
      message.success('任务已开始执行');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const statusColors = {
    pending: 'default',
    queued: 'blue',
    running: 'processing',
    reviewing: 'orange',
    rejected: 'red',
    closed: 'default',
    completed: 'success',
    auto_block: 'red',
    manual_review: 'orange',
    observe: 'blue'
  };

  const typeLabels = {
    website: '官网抓取',
    app_store: '应用商店',
    price: '价格监控',
    review: '评论抓取',
    feature: '功能分析'
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '关联竞品',
      dataIndex: 'competitor_id',
      key: 'competitor_id',
      render: (id) => {
        const comp = competitorList.find(c => c.id === id);
        return comp ? comp.name : '-';
      }
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type) => <Tag color="blue">{typeLabels[type] || type}</Tag>
    },
    {
      title: '目标URL',
      dataIndex: 'target_url',
      key: 'target_url',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      )
    },
    {
      title: '创建人',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/tasks/${record.id}`)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button icon={<PlayCircleOutlined />} size="small" type="primary" onClick={() => handleExecute(record.id)}>
              执行
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>抓取任务</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建任务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="创建抓取任务"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="competitor_id" label="关联竞品">
            <Select placeholder="选择竞品（可选）" allowClear>
              {competitorList.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="task_type" label="任务类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="website">官网抓取</Select.Option>
              <Select.Option value="app_store">应用商店</Select.Option>
              <Select.Option value="price">价格监控</Select.Option>
              <Select.Option value="review">评论抓取</Select.Option>
              <Select.Option value="feature">功能分析</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="target_url" label="目标URL" rules={[{ required: true }]}>
            <Input placeholder="请输入要抓取的页面地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CrawlTasks;
