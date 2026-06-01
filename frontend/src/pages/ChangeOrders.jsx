import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Select, Modal, Form, 
  message, Card, Row, Col, Input, Radio
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { changeAPI } from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

function ChangeOrders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      const response = await changeAPI.getOrders(params);
      setData(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', className: 'tag-status-pending', text: '待审核' },
      approved: { color: 'green', className: 'tag-status-active', text: '已批准' },
      rejected: { color: 'red', className: 'tag-status-failed', text: '已拒绝' },
    };
    const config = statusMap[status] || { color: 'default', className: '', text: status };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type) => {
    const typeMap = {
      config: { color: 'purple', text: '配置变更' },
      version: { color: 'blue', text: '版本升级' },
      feature: { color: 'cyan', text: '功能开关' },
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleReview = async (id, status) => {
    try {
      await changeAPI.reviewOrder(id, status, 1);
      message.success('审核完成');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleCreate = async (values) => {
    try {
      await changeAPI.createOrder(values);
      message.success('变更单创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const columns = [
    {
      title: '变更单号',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 140,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => getTypeTag(type),
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
          <Button type="link" size="small" icon={<EyeOutlined />}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button 
                type="link" 
                size="small" 
                icon={<CheckOutlined />}
                onClick={() => handleReview(record.id, 'approved')}
              >
                批准
              </Button>
              <Button 
                type="link" 
                size="small" 
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReview(record.id, 'rejected')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <h1 className="page-title">变更单</h1>
            <p style={{ color: '#666' }}>管理SDK配置变更、版本升级等变更请求</p>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              申请变更
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <div className="filter-bar">
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="pending">待审核</Option>
            <Option value="approved">已批准</Option>
            <Option value="rejected">已拒绝</Option>
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
        title="申请变更"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="type" label="变更类型" rules={[{ required: true }]}>
            <Select>
              <Option value="config">配置变更</Option>
              <Option value="version">版本升级</Option>
              <Option value="feature">功能开关</Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="变更标题" rules={[{ required: true }]}>
            <Input placeholder="请输入变更标题" />
          </Form.Item>
          <Form.Item name="description" label="变更描述">
            <TextArea rows={3} placeholder="请描述变更内容和原因" />
          </Form.Item>
          <Form.Item name="impact" label="影响范围">
            <Radio.Group>
              <Radio value="low">低影响</Radio>
              <Radio value="medium">中影响</Radio>
              <Radio value="high">高影响</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="rollback_plan" label="回滚方案">
            <TextArea rows={3} placeholder="请描述回滚步骤" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交申请</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ChangeOrders;
