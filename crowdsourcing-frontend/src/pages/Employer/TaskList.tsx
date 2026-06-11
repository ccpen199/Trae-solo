import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Select, 
  Input, 
  Slider, 
  Space, 
  Table, 
  Tag, 
  Avatar,
  Pagination,
  Radio,
  Spin,
  Empty,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
  EyeOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Task, TaskStatus, TaskCategory } from '@/types';
import { taskApi } from '@/api';
import TaskCard from '@/components/TaskCard';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

const formatCurrency = (value: number) => {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const categoryOptions: { value: TaskCategory; label: string }[] = [
  { value: 'design', label: '设计' },
  { value: 'development', label: '开发' },
  { value: 'writing', label: '文案' },
  { value: 'marketing', label: '营销' },
  { value: 'video', label: '视频' },
  { value: 'consulting', label: '咨询' }
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: '待审核' },
  { value: 'published', label: '已发布' },
  { value: 'bidding', label: '投标中' },
  { value: 'selected', label: '已选人' },
  { value: 'in_progress', label: '进行中' },
  { value: 'submitted', label: '已提交' },
  { value: 'reviewing', label: '评审中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

const sortOptions = [
  { value: 'createdAt_desc', label: '最新发布' },
  { value: 'createdAt_asc', label: '最早发布' },
  { value: 'budgetMax_desc', label: '预算最高' },
  { value: 'budgetMax_asc', label: '预算最低' },
  { value: 'bidCount_desc', label: '投标最多' }
];

const categoryColors: Record<string, string> = {
  design: 'magenta',
  development: 'blue',
  writing: 'green',
  marketing: 'orange',
  video: 'red',
  consulting: 'purple'
};

const statusColors: Record<TaskStatus, string> = {
  draft: 'default',
  pending: 'warning',
  published: 'blue',
  bidding: 'cyan',
  selected: 'geekblue',
  in_progress: 'processing',
  submitted: 'purple',
  reviewing: 'gold',
  revising: 'orange',
  completed: 'success',
  cancelled: 'default',
  disputed: 'red'
};

const EmployerTaskList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [filters, setFilters] = useState({
    keyword: '',
    category: undefined as TaskCategory | undefined,
    status: searchParams.get('status') as TaskStatus || undefined,
    budgetMin: undefined as number | undefined,
    budgetMax: undefined as number | undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [sortBy, sortOrder] = (filters.sortBy + '_' + filters.sortOrder).split('_');
      const result = await taskApi.getMyTasks({
        page,
        pageSize,
        keyword: filters.keyword,
        category: filters.category,
        status: filters.status,
        budgetMin: filters.budgetMin,
        budgetMax: filters.budgetMax,
        sortBy: sortBy === 'createdAt' ? 'createdAt' : sortBy,
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      setTasks(result.list || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, pageSize, filters]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPage(1);
  };

  const handleCategoryChange = (value: TaskCategory | undefined) => {
    setFilters(prev => ({ ...prev, category: value }));
    setPage(1);
  };

  const handleStatusChange = (value: TaskStatus | undefined) => {
    setFilters(prev => ({ ...prev, status: value }));
    setPage(1);
    if (value) {
      setSearchParams({ status: value });
    } else {
      searchParams.delete('status');
      setSearchParams(searchParams);
    }
  };

  const handleBudgetChange = (value: number[]) => {
    setFilters(prev => ({ 
      ...prev, 
      budgetMin: value[0] > 0 ? value[0] : undefined,
      budgetMax: value[1] < 100000 ? value[1] : undefined
    }));
    setPage(1);
  };

  const handleSortChange = (e: any) => {
    const [sortBy, sortOrder] = e.target.value.split('_');
    setFilters(prev => ({ 
      ...prev, 
      sortBy: sortBy === 'createdAt' ? 'createdAt' : sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    }));
    setPage(1);
  };

  const handleViewDetail = (id: string) => {
    navigate(`/employer/tasks/${id}`);
  };

  const columns = [
    {
      title: '任务信息',
      dataIndex: 'title',
      key: 'title',
      render: (_: any, record: Task) => (
        <div className="flex flex-col gap-1">
          <div 
            className="font-medium text-gray-800 cursor-pointer hover:text-primary-700 transition-colors"
            onClick={() => handleViewDetail(record.id)}
          >
            {record.title}
          </div>
          <div className="flex items-center gap-2">
            <Tag color={categoryColors[record.category]}>{record.categoryName}</Tag>
            <Tag color={statusColors[record.status]}>{record.statusName}</Tag>
            {record.auditStatus === 'pending' && <Tag color="warning">审核中</Tag>}
          </div>
        </div>
      )
    },
    {
      title: '预算',
      dataIndex: 'budgetMax',
      key: 'budget',
      render: (_: any, record: Task) => (
        <div className="text-gray-800 font-medium">
          ¥{formatCurrency(record.budgetMin)} - ¥{formatCurrency(record.budgetMax)}
        </div>
      )
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (value: string) => (
        <div className="flex items-center gap-1 text-gray-600">
          <CalendarOutlined />
          {dayjs(value).format('YYYY-MM-DD')}
        </div>
      )
    },
    {
      title: '投标人数',
      dataIndex: 'bidCount',
      key: 'bidCount',
      render: (value: number) => (
        <div className="flex items-center gap-1 text-gray-600">
          <TeamOutlined />
          {value} 人
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      sorter: true
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            >
              查看
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">任务管理</h2>
          <p className="text-gray-500 mt-1">管理您发布的所有任务</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/employer/tasks/publish')}>
          发布新任务
        </Button>
      </div>

      <Card className="card-hover">
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Search
              placeholder="搜索任务标题..."
              allowClear
              enterButton={<SearchOutlined />}
             
              onSearch={handleSearch}
              style={{ width: 320 }}
            />
            <Select
              placeholder="选择分类"
              allowClear
             
              value={filters.category}
              onChange={handleCategoryChange}
              style={{ width: 150 }}
            >
              {categoryOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
            <Select
              placeholder="选择状态"
              allowClear
             
              value={filters.status}
              onChange={handleStatusChange}
              style={{ width: 150 }}
            >
              {statusOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
            <Radio.Group value={filters.sortBy + '_' + filters.sortOrder} onChange={handleSortChange}>
              {sortOptions.map(opt => (
                <Radio.Button key={opt.value} value={opt.value}>{opt.label}</Radio.Button>
              ))}
            </Radio.Group>
            <div className="ml-auto flex items-center gap-2">
              <Button 
                type={viewMode === 'card' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('card')}
              />
              <Button 
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('list')}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <FilterOutlined className="text-gray-500" />
            <span className="text-sm text-gray-500">预算范围：</span>
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <span className="text-sm text-gray-600">¥0</span>
              <Slider
                range
                min={0}
                max={100000}
                step={1000}
                defaultValue={[0, 100000]}
                onChange={handleBudgetChange}
                tooltip={{ formatter: (value) => `¥${value?.toLocaleString()}` }}
                className="flex-1"
              />
              <span className="text-sm text-gray-600">¥100,000+</span>
            </div>
          </div>
        </div>
      </Card>

      {viewMode === 'card' ? (
        <>
          {tasks.length > 0 ? (
            <Row gutter={[16, 16]}>
              {tasks.map(task => (
                <Col xs={24} sm={12} lg={8} key={task.id}>
                  <TaskCard task={task} onView={handleViewDetail} />
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无任务" className="py-12" />
          )}
        </>
      ) : (
        <Card className="card-hover">
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            pagination={false}
            loading={loading}
          />
        </Card>
      )}

      {total > 0 && (
        <div className="flex justify-end">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条记录`}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EmployerTaskList;
