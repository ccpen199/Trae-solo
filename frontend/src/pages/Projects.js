import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  message, 
  Popconfirm, 
  Card, 
  Typography,
  Input,
  Select,
  Row,
  Col,
  DatePicker
} from 'antd';
import { 
  PlusOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { projectApi, registrationApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

const statusColors = {
  draft: 'default',
  announcing: 'blue',
  registration: 'cyan',
  bidding: 'orange',
  completed: 'green',
  finished: 'purple'
};

const statusLabels = {
  draft: '草稿',
  announcing: '公告中',
  registration: '报名中',
  bidding: '竞价中',
  completed: '已成交',
  finished: '已完成'
};

const statusOptions = Object.keys(statusLabels).map(key => ({
  label: statusLabels[key],
  value: key
}));

const Projects = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchProjects();
  }, [pagination.current, pagination.pageSize]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getProjects({
        ...filters,
        page: pagination.current,
        limit: pagination.pageSize
      });
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      message.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await projectApi.deleteProject(id);
      message.success('删除成功');
      fetchProjects();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handlePublish = async (id) => {
    try {
      const response = await projectApi.publishProject(id);
      if (response.data.success) {
        message.success('项目已发布，状态变更为公告中');
        fetchProjects();
      }
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleStartBidding = async (id) => {
    try {
      const response = await projectApi.startBidding(id);
      if (response.data.success) {
        message.success('竞价已开始');
        fetchProjects();
      }
    } catch (error) {
      message.error('开始竞价失败');
    }
  };

  const handleEndBidding = async (id) => {
    try {
      const response = await projectApi.endBidding(id);
      if (response.data.success) {
        message.success('竞价已结束，系统自动确认成交');
        fetchProjects();
      }
    } catch (error) {
      message.error('结束竞价失败');
    }
  };

  const handleRegister = async (projectId) => {
    try {
      const response = await registrationApi.register({ projectId });
      if (response.data.success) {
        message.success('报名成功！请等待保证金锁定后激活竞价权限');
        fetchProjects();
      }
    } catch (error) {
      message.error('报名失败');
    }
  };

  const columns = [
    {
      title: '项目编号',
      dataIndex: 'projectNumber',
      key: 'projectNumber',
      width: 160,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '预算金额',
      dataIndex: 'budget',
      key: 'budget',
      width: 140,
      render: (val) => `¥${Number(val).toLocaleString()}`
    },
    {
      title: '保证金',
      dataIndex: 'deposit',
      key: 'deposit',
      width: 120,
      render: (val) => `¥${Number(val).toLocaleString()}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    {
      title: '公告时间',
      dataIndex: 'announcementDate',
      key: 'announcementDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('MM-DD') : '-'
    },
    {
      title: '创建人',
      dataIndex: ['Tenderer', 'realName'],
      key: 'creator',
      width: 100,
      render: (name) => name || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: hasRole(['tenderer', 'supervisor']) ? 280 : 200,
      fixed: 'right',
      render: (_, record) => {
        const isTenderer = hasRole('tenderer');
        const isBidder = hasRole('bidder');
        const isSupervisor = hasRole('supervisor');
        
        return (
          <Space size="small">
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/projects/${record.id}`)}
            >
              详情
            </Button>
            
            {isTenderer && record.status === 'draft' && (
              <>
                <Button 
                  type="link" 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/projects/${record.id}/edit`)}
                >
                  编辑
                </Button>
                <Button 
                  type="link" 
                  size="small" 
                  icon={<CheckCircleOutlined />}
                  onClick={() => handlePublish(record.id)}
                  style={{ color: '#52c41a' }}
                >
                  发布
                </Button>
                <Popconfirm
                  title="确定删除此项目？"
                  onConfirm={() => handleDelete(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="link" 
                    size="small" 
                    danger
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </>
            )}

            {isTenderer && record.status === 'announcing' && (
              <Button 
                type="link" 
                size="small" 
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartBidding(record.id)}
                style={{ color: '#1890ff' }}
              >
                开始竞价
              </Button>
            )}

            {isTenderer && record.status === 'bidding' && (
              <Button 
                type="link" 
                size="small" 
                icon={<PauseCircleOutlined />}
                onClick={() => handleEndBidding(record.id)}
                style={{ color: '#fa8c16' }}
              >
                结束竞价
              </Button>
            )}

            {isBidder && (record.status === 'announcing' || record.status === 'registration') && (
              <Button 
                type="primary" 
                size="small"
                onClick={() => handleRegister(record.id)}
              >
                报名
              </Button>
            )}

            {isBidder && record.status === 'bidding' && (
              <Button 
                type="primary" 
                size="small"
                onClick={() => navigate(`/bidding/${record.id}`)}
              >
                竞价大厅
              </Button>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <Card 
        title={
          <Title level={4} style={{ margin: 0 }}>
            {hasRole(['tenderer', 'supervisor']) ? '项目管理' : '项目列表'}
          </Title>
        }
        extra={
          hasRole(['tenderer', 'supervisor']) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/projects/create')}
            >
              新建项目
            </Button>
          )
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="搜索项目名称/编号"
              allowClear
              onSearch={(value) => {
                setFilters({ ...filters, keyword: value });
                fetchProjects();
              }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: '100%' }}
              options={statusOptions}
              onChange={(value) => {
                setFilters({ ...filters, status: value });
                fetchProjects();
              }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates) {
                  setFilters({ 
                    ...filters, 
                    startDate: dates[0].format('YYYY-MM-DD'),
                    endDate: dates[1].format('YYYY-MM-DD')
                  });
                } else {
                  const { startDate, endDate, ...rest } = filters;
                  setFilters(rest);
                }
                fetchProjects();
              }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Button onClick={fetchProjects} icon={<PlusOutlined rotate={90} />}>
              刷新
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1200 }}
          onChange={(newPagination) => {
            setPagination(newPagination);
          }}
        />
      </Card>
    </div>
  );
};

export default Projects;
