import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Input, Select, Modal, Form, 
  message, Popconfirm, Spin, Card, Row, Col
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { applicationAPI } from '../utils/api';

const { Option } = Select;

function Applications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      const response = await applicationAPI.getList(params);
      let list = response.data.list || [];
      if (searchText) {
        list = list.filter(item => 
          item.name?.includes(searchText) || 
          item.app_id?.includes(searchText)
        );
      }
      setData(list);
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
      active: { color: 'green', className: 'tag-status-active', text: '活跃' },
      inactive: { color: 'default', className: 'tag-status-inactive', text: '停用' },
      archived: { color: 'default', className: 'tag-status-inactive', text: '归档' },
    };
    const config = statusMap[status] || { color: 'default', className: '', text: status };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await applicationAPI.update(id, { status: 'archived' });
      message.success('归档成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await applicationAPI.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await applicationAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    {
      title: '应用ID',
      dataIndex: 'app_id',
      key: 'app_id',
      width: 160,
    },
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
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
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/applications/${record.id}`)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要归档该应用吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              归档
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <h1 className="page-title">应用管理</h1>
            <p style={{ color: '#666' }}>管理SDK应用、环境、版本和密钥</p>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建应用
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <div className="filter-bar">
          <Input
            placeholder="搜索应用名称或ID"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={loadData}
            style={{ width: 240 }}
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="active">活跃</Option>
            <Option value="inactive">停用</Option>
            <Option value="archived">归档</Option>
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
        title={editingItem ? '编辑应用' : '新建应用'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="应用名称"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="请输入应用名称" />
          </Form.Item>
          <Form.Item name="description" label="应用描述">
            <Input.TextArea rows={4} placeholder="请输入应用描述" />
          </Form.Item>
          {editingItem && (
            <Form.Item name="status" label="状态">
              <Select>
                <Option value="active">活跃</Option>
                <Option value="inactive">停用</Option>
                <Option value="archived">归档</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingItem ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Applications;
