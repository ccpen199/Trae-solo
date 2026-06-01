import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Popconfirm, Card, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { courseApi, lecturerApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;

const CourseList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadLecturers();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadLecturers = async () => {
    try {
      const res = await lecturerApi.list({ page_size: 100 });
      setLecturers(res.data.data);
    } catch (error) {
      console.error('加载讲师列表失败:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await courseApi.list({
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
    setEditingCourse(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingCourse(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCourse) {
        await courseApi.update(editingCourse.id, values);
        message.success('更新成功');
      } else {
        await courseApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleSubmitReview = async (record: any) => {
    try {
      await courseApi.submitReview(record.id);
      message.success('已提交审核');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending_review: { color: 'processing', text: '待审核' },
    approved: { color: 'success', text: '审核通过' },
    rejected: { color: 'error', text: '审核拒绝' },
    published: { color: 'green', text: '已发布' },
    offline: { color: 'default', text: '已下架' },
  };

  const columns = [
    {
      title: '课程编码',
      dataIndex: 'course_code',
      key: 'course_code',
      width: 120,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number, record: any) => (
        record.is_free ? <Tag color="green">免费</Tag> : `¥${price}`
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/courses/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleSubmitReview(record)}>
              提交审核
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
          <h1 className="page-title">课程管理</h1>
          <p className="page-description">管理平台所有课程信息</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建课程
        </Button>
      </div>

      <Card className="filter-bar" size="small">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="课程编码/名称" prefix={<SearchOutlined />} />
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
      </Card>

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
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingCourse ? '编辑课程' : '新建课程'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="course_code" label="课程编码" rules={[{ required: true }]}>
            <Input placeholder="请输入课程编码" />
          </Form.Item>
          <Form.Item name="name" label="课程名称" rules={[{ required: true }]}>
            <Input placeholder="请输入课程名称" />
          </Form.Item>
          <Form.Item name="description" label="课程描述">
            <Input.TextArea rows={3} placeholder="请输入课程描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lecturer_id" label="所属讲师">
                <Select placeholder="请选择讲师" allowClear>
                  {lecturers.map((l: any) => (
                    <Option key={l.id} value={l.id}>{l.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="课程分类">
                <Input placeholder="请输入分类" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="价格(元)">
                <Input type="number" min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_free" label="是否免费" valuePropName="checked">
                <Select>
                  <Option value={0}>收费</Option>
                  <Option value={1}>免费</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseList;
