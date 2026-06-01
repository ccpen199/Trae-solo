import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Input, Select, DatePicker, Form, Modal, message, Space, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { bidsApi, usersApi } from '../utils/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

function Bids() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    status: '',
    owner_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    loadUsers();
    loadData();
  }, [filters]);

  const hasPermission = (action) => {
    if (!currentUser) return false;
    const role = currentUser.role_name;
    const permissions = {
      business_owner: ['create', 'view', 'update', 'delete'],
      model_operator: ['view'],
      reviewer: ['view'],
      user: ['create', 'view']
    };
    return permissions[role]?.includes(action) || role === 'business_owner';
  };

  const loadUsers = async () => {
    try {
      const res = await usersApi.getList();
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await bidsApi.getList(filters);
      setData(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await bidsApi.create(values);
      message.success('创建成功');
      setCreateModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    uploaded: { text: '已上传', color: 'blue' },
    parsed: { text: '已解析', color: 'cyan' },
    matched: { text: '已匹配', color: 'green' },
    generated: { text: '已生成', color: 'purple' },
    reviewed: { text: '已审核', color: 'orange' },
    exported: { text: '已导出', color: 'success' }
  };

  const columns = [
    { title: '标书编号', dataIndex: 'bid_no', width: 160 },
    { title: '项目名称', dataIndex: 'project_name', render: (text, record) => (
      <a onClick={() => navigate(`/bids/${record.id}`)}>{text}</a>
    )},
    { title: '采购人', dataIndex: 'purchaser' },
    { title: '状态', dataIndex: 'status', width: 100, render: (status) => (
      <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.text || status}</Tag>
    )},
    { title: '评分项', dataIndex: 'item_count', width: 80 },
    { title: '响应数', dataIndex: 'response_count', width: 80 },
    { title: '缺漏项', dataIndex: 'missing_count', width: 80 },
    { title: '负责人', dataIndex: 'owner_name', width: 100 },
    { title: '创建人', dataIndex: 'creator_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', width: 170, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm') },
    { title: '操作', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/bids/${record.id}`)}>详情</Button>
      </Space>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">标书管理</h1>
        {hasPermission('create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建标书
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="状态">
            <Select 
              style={{ width: 120 }} 
              allowClear 
              placeholder="全部"
              onChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
            >
              {Object.entries(statusMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.text}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="负责人">
            <Select 
              style={{ width: 120 }} 
              allowClear 
              placeholder="全部"
              onChange={(v) => setFilters({ ...filters, owner_id: v, page: 1 })}
            >
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.real_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="创建时间">
            <RangePicker 
              onChange={(dates) => setFilters({ 
                ...filters, 
                start_date: dates?.[0]?.format('YYYY-MM-DD') || '', 
                end_date: dates?.[1]?.format('YYYY-MM-DD') || '',
                page: 1 
              })}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>搜索</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total,
            onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize })
          }}
        />
      </Card>

      <Modal
        title="新建标书"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreate}>
          <Form.Item label="项目名称" name="project_name" rules={[{ required: true }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item label="采购人" name="purchaser">
            <Input placeholder="请输入采购人" />
          </Form.Item>
          <Form.Item label="预算金额" name="budget_amount">
            <Input type="number" placeholder="请输入预算金额" />
          </Form.Item>
          <Form.Item label="负责人" name="owner_id">
            <Select placeholder="请选择负责人">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.real_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Bids;
