import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  message,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined,
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { contentApi, workflowApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const ContentList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    categoryId: '',
    dateRange: [],
  });
  const [categories, setCategories] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchCategories();
    fetchContents();
  }, [pagination.current, pagination.pageSize]);

  const fetchCategories = async () => {
    try {
      const response: any = await contentApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchContents = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.status) params.status = filters.status;
      if (filters.categoryId) params.categoryId = filters.categoryId;

      const response: any = await contentApi.getList(params);
      setData(response.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.total || 0,
      }));
    } catch (error) {
      message.error('获取内容列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await contentApi.delete(id);
      message.success('删除成功');
      fetchContents();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitReview = async (record: any) => {
    try {
      await workflowApi.start(record.id);
      message.success('已提交审核');
      fetchContents();
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交审核失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'default',
      PENDING_REVIEW: 'warning',
      IN_REVIEW: 'processing',
      NEEDS_REVISION: 'orange',
      APPROVED: 'success',
      PUBLISHED: 'blue',
      ARCHIVED: 'default',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      DRAFT: '草稿',
      PENDING_REVIEW: '待审核',
      IN_REVIEW: '审核中',
      NEEDS_REVISION: '待修改',
      APPROVED: '已通过',
      PUBLISHED: '已发布',
      ARCHIVED: '已归档',
      REJECTED: '已驳回',
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 250,
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
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '作者',
      dataIndex: ['author', 'displayName'],
      key: 'author',
      width: 100,
      render: (name: string, record: any) => name || record.author?.username || '-',
    },
    {
      title: '版本',
      dataIndex: 'currentVersion',
      key: 'currentVersion',
      width: 80,
      render: (v: number) => `v${v}`,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/content/edit/${record.id}`)}
          >
            查看
          </Button>
          {(record.status === 'DRAFT' || record.status === 'NEEDS_REVISION') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/content/edit/${record.id}`)}
            >
              编辑
            </Button>
          )}
          {record.status === 'DRAFT' && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSubmitReview(record)}
            >
              提交审核
            </Button>
          )}
          {record.status === 'DRAFT' && (
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const stats = [
    {
      title: '草稿',
      value: data.filter((d) => d.status === 'DRAFT').length,
      icon: <FileTextOutlined style={{ color: '#8c8c8c' }} />,
    },
    {
      title: '审核中',
      value: data.filter((d) => ['PENDING_REVIEW', 'IN_REVIEW'].includes(d.status)).length,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
    },
    {
      title: '已通过',
      value: data.filter((d) => ['APPROVED', 'PUBLISHED'].includes(d.status)).length,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    },
    {
      title: '已发布',
      value: data.filter((d) => d.status === 'PUBLISHED').length,
      icon: <SyncOutlined style={{ color: '#1890ff' }} />,
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>内容管理</h2>
          <p style={{ color: 'rgba(0,0,0,0.45)' }}>管理所有内容稿件</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/create')}>
          新建内容
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card size="small">
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索标题"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && fetchContents()}
          />
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            value={filters.status || undefined}
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Select.Option value="DRAFT">草稿</Select.Option>
            <Select.Option value="PENDING_REVIEW">待审核</Select.Option>
            <Select.Option value="IN_REVIEW">审核中</Select.Option>
            <Select.Option value="APPROVED">已通过</Select.Option>
            <Select.Option value="PUBLISHED">已发布</Select.Option>
            <Select.Option value="REJECTED">已驳回</Select.Option>
          </Select>
          <Select
            placeholder="选择分类"
            style={{ width: 150 }}
            allowClear
            value={filters.categoryId || undefined}
            onChange={(v) => setFilters({ ...filters, categoryId: v })}
          >
            {categories.map((cat) => (
              <Select.Option key={cat.id} value={cat.id}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })}
          />
          <Button type="primary" onClick={fetchContents}>
            搜索
          </Button>
          <Button onClick={() => setFilters({ keyword: '', status: '', categoryId: '', dateRange: [] })}>
            重置
          </Button>
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
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
          }}
        />
      </Card>
    </div>
  );
};

export default ContentList;
