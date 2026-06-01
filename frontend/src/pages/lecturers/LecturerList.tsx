import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Popconfirm, Avatar, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { lecturerApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const LecturerList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await lecturerApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      });
      setData(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    setFilters(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCreate = () => {
    setEditingLecturer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingLecturer(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingLecturer) {
        await lecturerApi.update(editingLecturer.id, values);
        message.success('更新成功');
      } else {
        await lecturerApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    active: { color: 'success', text: '正常' },
    inactive: { color: 'default', text: '停用' },
    suspended: { color: 'warning', text: '暂停' },
  };

  const columns = [
    {
      title: '讲师编号',
      dataIndex: 'lecturer_code',
      key: 'lecturer_code',
      width: 120,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => (
        <Avatar src={avatar} icon={<UserOutlined />} size="small" />
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: '专业领域',
      dataIndex: 'specialty',
      key: 'specialty',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '课程数量',
      dataIndex: 'course_count',
      key: 'course_count',
      width: 100,
      render: (count: number) => count || 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，确认删除该讲师吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">讲师管理</h1>
          <p className="page-description">管理平台所有讲师信息</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增讲师
        </Button>
      </div>

      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="讲师编号/姓名/手机号" prefix={<SearchOutlined />} style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { setFilters({}); loadData(); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
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
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
        }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={editingLecturer ? '编辑讲师' : '新增讲师'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lecturer_code" label="讲师编号" rules={[{ required: true }]}>
                <Input placeholder="请输入讲师编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="specialty" label="专业领域">
            <Input placeholder="请输入专业领域，如：Java开发、数据分析等" />
          </Form.Item>
          <Form.Item name="avatar" label="头像地址">
            <Input placeholder="请输入头像图片URL" />
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={3} placeholder="请输入个人简介" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select placeholder="请选择状态">
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LecturerList;
