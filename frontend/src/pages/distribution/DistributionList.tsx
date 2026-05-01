import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { distributionApi, contentApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DistributionList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [approvedContents, setApprovedContents] = useState<any[]>([]);
  const [form] = Form.useForm();

  const channels = [
    { value: 'WEB', label: '官网' },
    { value: 'APP', label: 'App' },
    { value: 'WECHAT', label: '微信公众号' },
    { value: 'WEIBO', label: '微博' },
    { value: 'DOUYIN', label: '抖音' },
    { value: 'XIAOHONGSHU', label: '小红书' },
    { value: 'ZHIHU', label: '知乎' },
  ];

  useEffect(() => {
    fetchDistributions();
  }, [pagination.current, pagination.pageSize]);

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const response: any = await distributionApi.getList(params);
      setData(response.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.total || 0,
      }));
    } catch (error) {
      message.error('获取分发列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedContents = async () => {
    try {
      const response: any = await contentApi.getList({ status: 'APPROVED' });
      setApprovedContents(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch approved contents:', error);
    }
  };

  const handleOpenModal = () => {
    fetchApprovedContents();
    form.resetFields();
    setShowModal(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        contentId: values.contentId,
        channels: values.channels,
        scheduledAt: values.scheduledAt?.toISOString(),
      };

      await distributionApi.create(data);
      message.success('分发已创建');
      setShowModal(false);
      fetchDistributions();
    } catch (error) {
      message.error('创建分发失败');
    }
  };

  const handleRetry = async (record: any) => {
    try {
      await distributionApi.retry(record.id, '手动重试');
      message.success('已重新分发');
      fetchDistributions();
    } catch (error) {
      message.error('重试失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'default',
      SCHEDULED: 'processing',
      PUBLISHING: 'processing',
      PUBLISHED: 'success',
      FAILED: 'error',
      RETRYING: 'warning',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: '待发布',
      SCHEDULED: '已定时',
      PUBLISHING: '发布中',
      PUBLISHED: '已发布',
      FAILED: '发布失败',
      RETRYING: '重试中',
    };
    return texts[status] || status;
  };

  const getChannelText = (channel: string) => {
    const ch = channels.find((c) => c.value === channel);
    return ch?.label || channel;
  };

  const columns = [
    {
      title: '内容标题',
      dataIndex: ['content', 'title'],
      key: 'title',
      ellipsis: true,
      width: 250,
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (channel: string) => <Tag color="blue">{getChannelText(channel)}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '渠道链接',
      dataIndex: 'channelUrl',
      key: 'channelUrl',
      width: 150,
      render: (url: string) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            查看
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: '计划时间',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      width: 180,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '立即'),
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 180,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '重试次数',
      dataIndex: 'retryCount',
      key: 'retryCount',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'FAILED' && (
            <Popconfirm title="确定重试?" onConfirm={() => handleRetry(record)}>
              <Button type="link" size="small" icon={<SyncOutlined />}>
                重试
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const stats = [
    {
      title: '待发布',
      value: data.filter((d) => ['PENDING', 'SCHEDULED'].includes(d.status)).length,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
    },
    {
      title: '发布中',
      value: data.filter((d) => ['PUBLISHING', 'RETRYING'].includes(d.status)).length,
      icon: <SyncOutlined style={{ color: '#1890ff' }} />,
    },
    {
      title: '已发布',
      value: data.filter((d) => d.status === 'PUBLISHED').length,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    },
    {
      title: '失败',
      value: data.filter((d) => d.status === 'FAILED').length,
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
    },
  ];

  return (
    <div>
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h2>内容分发</h2>
          <p style={{ color: 'rgba(0,0,0,0.45)' }}>管理内容的多平台分发</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          新建分发
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card size="small">
              <Statistic title={stat.title} value={stat.value} prefix={stat.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
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
            onChange: (page, pageSize) =>
              setPagination({ ...pagination, current: page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title="新建分发"
        open={showModal}
        onCancel={() => setShowModal(false)}
        width={600}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="contentId"
            label="选择内容"
            rules={[{ required: true, message: '请选择要分发的内容' }]}
          >
            <Select placeholder="选择已审核通过的内容" showSearch optionFilterProp="children">
              {approvedContents.map((content) => (
                <Select.Option key={content.id} value={content.id}>
                  {content.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="channels"
            label="选择渠道"
            rules={[{ required: true, message: '请选择分发渠道' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择分发渠道"
              options={channels}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="scheduledAt"
            label="定时发布"
            extra="留空则立即发布"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                创建分发
              </Button>
              <Button onClick={() => setShowModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DistributionList;
