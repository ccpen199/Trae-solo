import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Upload, Row, Col, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, UploadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { materialApi, courseApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;

const MaterialList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [currentMaterial, setCurrentMaterial] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [authForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadCourses = async () => {
    try {
      const res = await courseApi.list({ page_size: 100 });
      setCourses(res.data.data);
    } catch (error) {
      console.error('加载课程列表失败:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await materialApi.list({
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
    setEditingMaterial(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingMaterial(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleAuthorize = (record: any) => {
    setCurrentMaterial(record);
    authForm.resetFields();
    setAuthModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMaterial) {
        await materialApi.update(editingMaterial.id, values);
        message.success('更新成功');
      } else {
        await materialApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleAuthSubmit = async () => {
    try {
      const values = await authForm.validateFields();
      await materialApi.authorize(currentMaterial.id, {
        ...values,
        authorization_start_date: values.authorization_start_date?.format('YYYY-MM-DD'),
        authorization_end_date: values.authorization_end_date?.format('YYYY-MM-DD'),
      });
      message.success('授权成功');
      setAuthModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const typeMap: Record<string, string> = {
    video: '视频',
    audio: '音频',
    image: '图片',
    document: '文档',
    other: '其他',
  };

  const authStatusMap: Record<string, { color: string; text: string }> = {
    authorized: { color: 'success', text: '已授权' },
    pending: { color: 'processing', text: '待授权' },
    unauthorized: { color: 'error', text: '未授权' },
    expired: { color: 'warning', text: '已过期' },
  };

  const columns = [
    {
      title: '素材编号',
      dataIndex: 'material_code',
      key: 'material_code',
      width: 130,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '素材名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => typeMap[type] || type,
    },
    {
      title: '所属课程',
      dataIndex: ['course', 'name'],
      key: 'course_name',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '授权状态',
      dataIndex: 'authorization_status',
      key: 'authorization_status',
      width: 100,
      render: (status: string) => {
        const cfg = authStatusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '-',
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
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/materials/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.authorization_status !== 'authorized' && (
            <Button type="link" size="small" icon={<SafetyCertificateOutlined />} onClick={() => handleAuthorize(record)}>
              授权
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">素材管理</h1>
          <p className="page-description">管理课程相关的所有素材资源</p>
        </div>
        <Space>
          <Upload beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>批量上传</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建素材
          </Button>
        </Space>
      </div>

      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="素材编码/名称" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(typeMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="authorization_status" label="授权状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(authStatusMap).map(([key, value]) => (
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
        title={editingMaterial ? '编辑素材' : '新建素材'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="material_code" label="素材编码" rules={[{ required: true }]}>
                <Input placeholder="请输入素材编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="素材类型" rules={[{ required: true }]}>
                <Select placeholder="请选择类型">
                  {Object.entries(typeMap).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="name" label="素材名称" rules={[{ required: true }]}>
            <Input placeholder="请输入素材名称" />
          </Form.Item>
          <Form.Item name="course_id" label="所属课程">
            <Select placeholder="请选择课程" allowClear showSearch optionFilterProp="children">
              {courses.map((c: any) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="素材描述">
            <Input.TextArea rows={3} placeholder="请输入素材描述" />
          </Form.Item>
          <Form.Item name="file_url" label="文件地址">
            <Input placeholder="请输入文件访问地址" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="素材授权"
        open={authModalVisible}
        onOk={handleAuthSubmit}
        onCancel={() => setAuthModalVisible(false)}
        width={500}
      >
        <Form form={authForm} layout="vertical">
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <p style={{ margin: 0 }}>
              <strong>素材名称:</strong> {currentMaterial?.name}
            </p>
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="authorization_start_date" label="授权开始日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="authorization_end_date" label="授权结束日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="authorization_type" label="授权类型" rules={[{ required: true }]}>
            <Select placeholder="请选择授权类型">
              <Option value="exclusive">独家授权</Option>
              <Option value="non_exclusive">非独家授权</Option>
              <Option value="buyout">买断</Option>
            </Select>
          </Form.Item>
          <Form.Item name="authorized_party" label="被授权方">
            <Input placeholder="请输入被授权方名称" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="授权备注说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialList;
