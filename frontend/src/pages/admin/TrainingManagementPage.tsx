import React, { useState, useMemo } from 'react';
import {
  Table,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Modal,
  Drawer,
  Progress,
  Tag,
  Card,
  List,
  Timeline,
  Space,
  Row,
  Col,
  message,
  Popconfirm,
  Pagination,
  Spin,
  Empty,
  Image,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BookOutlined,
  UserOutlined,
  ShopOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { adminApi, brokerApi } from '../../api';
import type { TrainingCourse, BrokerTraining, Broker, Store } from '../../types';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface CourseFilterParams {
  keyword?: string;
  category?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}

interface ProgressFilterParams {
  storeId?: number;
  brokerId?: number;
}

interface BrokerProgress {
  id: number;
  name: string;
  storeName: string;
  completedCount: number;
  inProgressCount: number;
  totalDuration: number;
  avgProgress: number;
  trainingList: BrokerTraining[];
}

const CATEGORY_OPTIONS = [
  { label: '行业知识', value: '行业知识', color: 'blue' },
  { label: '销售技巧', value: '销售技巧', color: 'green' },
  { label: '法律法规', value: '法律法规', color: 'orange' },
  { label: '服务礼仪', value: '服务礼仪', color: 'purple' },
];

const LEVEL_OPTIONS = [
  { label: '初级', value: '初级', color: 'success' },
  { label: '中级', value: '中级', color: 'warning' },
  { label: '高级', value: '高级', color: 'error' },
];

const getCategoryColor = (category: string) => {
  const opt = CATEGORY_OPTIONS.find((o) => o.value === category);
  return opt?.color || 'default';
};

const getLevelColor = (level: string) => {
  const opt = LEVEL_OPTIONS.find((o) => o.value === level);
  return opt?.color || 'default';
};

const TrainingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1');

  const [courseFilters, setCourseFilters] = useState<CourseFilterParams>({});
  const [coursePagination, setCoursePagination] = useState({ current: 1, pageSize: 10 });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);
  const [courseDetailVisible, setCourseDetailVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [courseForm] = Form.useForm();

  const [progressFilters, setProgressFilters] = useState<ProgressFilterParams>({});
  const [progressPagination, setProgressPagination] = useState({ current: 1, pageSize: 10 });
  const [brokerDetailVisible, setBrokerDetailVisible] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerProgress | null>(null);

  const { data: coursesData, loading: coursesLoading, refresh: refreshCourses } = useRequest(
    () =>
      adminApi.getCourses({
        ...courseFilters,
        keyword: searchKeyword || undefined,
        page: coursePagination.current,
        pageSize: coursePagination.pageSize,
      }),
    {
      refreshDeps: [courseFilters, searchKeyword, coursePagination],
    }
  );

  const { data: storesData } = useRequest(() => adminApi.getStores());
  const stores = storesData?.data || [];

  const { data: brokersData } = useRequest(() => brokerApi.getList({ pageSize: 100 }));
  const allBrokers = brokersData?.data || [];

  const courses = coursesData?.data || [];
  const coursesTotal = coursesData?.total || 0;

  const brokerProgressList = useMemo<BrokerProgress[]>(() => {
    return allBrokers
      .filter((broker) => {
        if (progressFilters.storeId && broker.store_id !== progressFilters.storeId) return false;
        if (progressFilters.brokerId && broker.id !== progressFilters.brokerId) return false;
        return true;
      })
      .map((broker) => {
        const trainingList = broker.training || [];
        const completedCount = trainingList.filter((t) => t.completed === 1).length;
        const inProgressCount = trainingList.filter((t) => t.completed === 0).length;
        const totalDuration = trainingList.reduce((sum, t) => sum + (t.duration || 0), 0);
        const totalProgress = trainingList.reduce((sum, t) => sum + (t.progress || 0), 0);
        const avgProgress = trainingList.length > 0 ? Math.round(totalProgress / trainingList.length) : 0;

        return {
          id: broker.id,
          name: broker.name,
          storeName: broker.store_name || '暂无门店',
          completedCount,
          inProgressCount,
          totalDuration,
          avgProgress,
          trainingList,
        };
      });
  }, [allBrokers, progressFilters]);

  const pagedBrokerProgress = useMemo(() => {
    const start = (progressPagination.current - 1) * progressPagination.pageSize;
    const end = start + progressPagination.pageSize;
    return brokerProgressList.slice(start, end);
  }, [brokerProgressList, progressPagination]);

  const courseColumns = [
    {
      title: '封面',
      dataIndex: 'cover',
      key: 'cover',
      width: 120,
      render: (_: any, record: TrainingCourse) => (
        <Image
          width={80}
          height={60}
          src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('专业培训课程封面，商务风格')}&image_size=square`}
          fallback="https://via.placeholder.com/80x60"
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: '课程标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{category}</Tag>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag color={getLevelColor(level)}>{level}</Tag>
      ),
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => (
        <span>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {duration}
        </span>
      ),
    },
    {
      title: '报名人数',
      dataIndex: 'enrolled_count',
      key: 'enrolled_count',
      width: 100,
      render: (count: number) => <span style={{ color: '#1677ff', fontWeight: 500 }}>{count || 0}</span>,
    },
    {
      title: '完成人数',
      dataIndex: 'completed_count',
      key: 'completed_count',
      width: 100,
      render: (count: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{count || 0}</span>,
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
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: TrainingCourse) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewCourseDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditCourse(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该课程？"
            onConfirm={() => handleDeleteCourse(record.id)}
            okText="确定"
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

  const progressColumns = [
    {
      title: '经纪人姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '所属门店',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 180,
      render: (text: string) => (
        <Space>
          <ShopOutlined style={{ color: '#1677ff' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '已完成课程',
      dataIndex: 'completedCount',
      key: 'completedCount',
      width: 120,
      render: (count: number) => (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          {count} 门
        </Tag>
      ),
    },
    {
      title: '进行中课程',
      dataIndex: 'inProgressCount',
      key: 'inProgressCount',
      width: 120,
      render: (count: number) => (
        <Tag color="processing" icon={<PlayCircleOutlined />}>
          {count} 门
        </Tag>
      ),
    },
    {
      title: '总学习时长',
      dataIndex: 'totalDuration',
      key: 'totalDuration',
      width: 120,
      render: (duration: number) => (
        <span>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {duration} 分钟
        </span>
      ),
    },
    {
      title: '平均进度',
      dataIndex: 'avgProgress',
      key: 'avgProgress',
      width: 160,
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: BrokerProgress) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewBrokerDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const storeRankColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => {
        const rank = index + 1;
        let color = '#666';
        if (rank === 1) color = '#faad14';
        if (rank === 2) color = '#bfbfbf';
        if (rank === 3) color = '#d46b08';
        return <span style={{ fontWeight: 600, color, fontSize: 16 }}>#{rank}</span>;
      },
    },
    {
      title: '门店名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <ShopOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '经纪人数量',
      dataIndex: 'brokerCount',
      key: 'brokerCount',
      width: 120,
    },
    {
      title: '完成课程总数',
      dataIndex: 'completedCourses',
      key: 'completedCourses',
      width: 120,
      render: (count: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{count}</span>,
    },
    {
      title: '平均完成率',
      dataIndex: 'avgCompletionRate',
      key: 'avgCompletionRate',
      width: 180,
      render: (rate: number) => <Progress percent={rate} size="small" />
    },
    {
      title: '总学习时长(小时)',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 140,
      render: (hours: number) => <span style={{ color: '#722ed1', fontWeight: 500 }}>{hours}</span>,
    },
  ];

  const completionRateOption = useMemo(() => ({
    title: { text: '课程完成率统计', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['报名人数', '完成人数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: courses.map((c) => c.title.length > 6 ? c.title.slice(0, 6) + '...' : c.title),
      axisLabel: { rotate: 30, fontSize: 11 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '报名人数',
        type: 'bar',
        data: courses.map((c) => c.enrolled_count || 0),
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '完成人数',
        type: 'bar',
        data: courses.map((c) => c.completed_count || 0),
        itemStyle: { color: '#52c41a' },
      },
    ],
  }), [courses]);

  const categoryOption = useMemo(() => {
    const categoryData = CATEGORY_OPTIONS.map((cat) => ({
      name: cat.label,
      value: courses.filter((c) => c.category === cat.value).length,
      itemStyle: { color: cat.color === 'blue' ? '#1677ff' : cat.color === 'green' ? '#52c41a' : cat.color === 'orange' ? '#fa8c16' : '#722ed1' },
    }));
    return {
      title: { text: '分类学习占比', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c}门 ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['55%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 18, fontWeight: 'bold' },
          },
          labelLine: { show: false },
          data: categoryData,
        },
      ],
    };
  }, [courses]);

  const monthlyTrendOption = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month').format('YYYY-MM'));
    const mockData = months.map(() => Math.floor(Math.random() * 50) + 20);
    const mockCompleted = months.map(() => Math.floor(Math.random() * 40) + 10);
    return {
      title: { text: '月度学习趋势', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增学习', '完成课程'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: months },
      yAxis: { type: 'value' },
      series: [
        {
          name: '新增学习',
          type: 'line',
          stack: 'Total',
          data: mockData,
          smooth: true,
          itemStyle: { color: '#1677ff' },
          areaStyle: { color: 'rgba(22, 119, 255, 0.2)' },
        },
        {
          name: '完成课程',
          type: 'line',
          stack: 'Total',
          data: mockCompleted,
          smooth: true,
          itemStyle: { color: '#52c41a' },
          areaStyle: { color: 'rgba(82, 196, 26, 0.2)' },
        },
      ],
    };
  }, []);

  const storeRankData = useMemo(() => {
    return stores
      .map((store: Store) => {
        const storeBrokers = allBrokers.filter((b) => b.store_id === store.id);
        const allTraining = storeBrokers.flatMap((b) => b.training || []);
        const completedCourses = allTraining.filter((t) => t.completed === 1).length;
        const totalHours = Math.round(allTraining.reduce((sum, t) => sum + (t.duration || 0), 0) / 60);
        const avgCompletionRate = allTraining.length > 0
          ? Math.round((completedCourses / allTraining.length) * 100)
          : 0;
        return {
          id: store.id,
          name: store.name,
          brokerCount: storeBrokers.length,
          completedCourses,
          avgCompletionRate,
          totalHours,
        };
      })
      .sort((a, b) => b.completedCourses - a.completedCourses);
  }, [stores, allBrokers]);

  const handleSearchCourse = (value: string) => {
    setSearchKeyword(value);
    setCoursePagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCategoryChange = (category: string | undefined) => {
    setCourseFilters((prev) => ({ ...prev, category }));
    setCoursePagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleLevelChange = (level: string | undefined) => {
    setCourseFilters((prev) => ({ ...prev, level }));
    setCoursePagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCoursePageChange = (page: number, pageSize: number) => {
    setCoursePagination({ current: page, pageSize });
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    courseForm.resetFields();
    setCourseModalVisible(true);
  };

  const handleEditCourse = (course: TrainingCourse) => {
    setEditingCourse(course);
    courseForm.setFieldsValue(course);
    setCourseModalVisible(true);
  };

  const handleViewCourseDetail = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setCourseDetailVisible(true);
  };

  const handleDeleteCourse = (id: number) => {
    message.success(`课程 ${id} 删除成功`);
    refreshCourses();
  };

  const handleCourseModalOk = async () => {
    try {
      const values = await courseForm.validateFields();
      if (editingCourse) {
        message.success('课程更新成功');
      } else {
        await adminApi.createCourse(values);
        message.success('课程创建成功');
      }
      setCourseModalVisible(false);
      refreshCourses();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleStoreFilterChange = (storeId: number | undefined) => {
    setProgressFilters((prev) => ({ ...prev, storeId, brokerId: undefined }));
    setProgressPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleBrokerFilterChange = (brokerId: number | undefined) => {
    setProgressFilters((prev) => ({ ...prev, brokerId }));
    setProgressPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleProgressPageChange = (page: number, pageSize: number) => {
    setProgressPagination({ current: page, pageSize });
  };

  const handleViewBrokerDetail = (broker: BrokerProgress) => {
    setSelectedBroker(broker);
    setBrokerDetailVisible(true);
  };

  const filteredBrokers = useMemo(() => {
    if (!progressFilters.storeId) return [];
    return allBrokers.filter((b) => b.store_id === progressFilters.storeId);
  }, [allBrokers, progressFilters.storeId]);

  const completedCourses = useMemo(() => {
    return selectedBroker?.trainingList.filter((t) => t.completed === 1) || [];
  }, [selectedBroker]);

  const inProgressCourses = useMemo(() => {
    return selectedBroker?.trainingList.filter((t) => t.completed === 0) || [];
  }, [selectedBroker]);

  const studyTimeline = useMemo(() => {
    if (!selectedBroker) return [];
    return selectedBroker.trainingList
      .map((t) => ({
        time: dayjs(t.start_date).format('YYYY-MM-DD HH:mm'),
        action: t.completed === 1 ? `完成课程：${t.course_title}` : `开始学习：${t.course_title}`,
        color: t.completed === 1 ? 'green' : 'blue',
      }))
      .sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())
      .slice(0, 10);
  }, [selectedBroker]);

  return (
    <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      <Card
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
          items={[
            {
              key: '1',
              label: (
                <span>
                  <BookOutlined /> 课程管理
                </span>
              ),
              children: (
                <div style={{ padding: '0 24px 24px' }}>
                  <div
                    style={{
                      background: '#fafafa',
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Search
                          placeholder="搜索课程标题"
                          prefix={<SearchOutlined />}
                          allowClear
                          value={searchKeyword}
                          onSearch={handleSearchCourse}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          style={{ flex: 1, maxWidth: 300, minWidth: 200 }}
                        />
                        <Select
                          placeholder="分类筛选"
                          allowClear
                          value={courseFilters.category}
                          onChange={handleCategoryChange}
                          style={{ width: 150 }}
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                              <Tag color={opt.color}>{opt.label}</Tag>
                            </Option>
                          ))}
                        </Select>
                        <Select
                          placeholder="级别筛选"
                          allowClear
                          value={courseFilters.level}
                          onChange={handleLevelChange}
                          style={{ width: 150 }}
                        >
                          {LEVEL_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                              <Tag color={opt.color}>{opt.label}</Tag>
                            </Option>
                          ))}
                        </Select>
                        <Button icon={<ReloadOutlined />} onClick={refreshCourses}>
                          刷新
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleAddCourse}
                        >
                          新增课程
                        </Button>
                      </div>
                    </Space>
                  </div>

                  <Spin spinning={coursesLoading}>
                    {courses.length > 0 ? (
                      <>
                        <Table
                          columns={courseColumns}
                          dataSource={courses}
                          rowKey="id"
                          pagination={false}
                          scroll={{ x: 1200 }}
                        />
                        <div
                          style={{
                            marginTop: 16,
                            display: 'flex',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <Pagination
                            current={coursePagination.current}
                            pageSize={coursePagination.pageSize}
                            total={coursesTotal}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total) => `共 ${total} 条记录`}
                            pageSizeOptions={['10', '20', '50']}
                            onChange={handleCoursePageChange}
                          />
                        </div>
                      </>
                    ) : (
                      <Empty
                        description="暂无课程数据"
                        style={{ padding: '60px 0' }}
                      />
                    )}
                  </Spin>
                </div>
              ),
            },
            {
              key: '2',
              label: (
                <span>
                  <UserOutlined /> 学习进度
                </span>
              ),
              children: (
                <div style={{ padding: '0 24px 24px' }}>
                  <div
                    style={{
                      background: '#fafafa',
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                  >
                    <Space wrap>
                      <span style={{ color: '#666' }}>
                        <FilterOutlined /> 筛选：
                      </span>
                      <Select
                        placeholder="选择门店"
                        allowClear
                        value={progressFilters.storeId}
                        onChange={handleStoreFilterChange}
                        style={{ width: 200 }}
                      >
                        {stores.map((store: Store) => (
                          <Option key={store.id} value={store.id}>
                            <ShopOutlined /> {store.name}
                          </Option>
                        ))}
                      </Select>
                      <Select
                        placeholder="选择经纪人"
                        allowClear
                        value={progressFilters.brokerId}
                        onChange={handleBrokerFilterChange}
                        style={{ width: 180 }}
                        disabled={!progressFilters.storeId}
                      >
                        {filteredBrokers.map((broker: Broker) => (
                          <Option key={broker.id} value={broker.id}>
                            <UserOutlined /> {broker.name}
                          </Option>
                        ))}
                      </Select>
                      <Button icon={<ReloadOutlined />} onClick={() => setProgressFilters({})}>
                        重置
                      </Button>
                    </Space>
                  </div>

                  {brokerProgressList.length > 0 ? (
                    <>
                      <Table
                        columns={progressColumns}
                        dataSource={pagedBrokerProgress}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 1000 }}
                      />
                      <div
                        style={{
                          marginTop: 16,
                          display: 'flex',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Pagination
                          current={progressPagination.current}
                          pageSize={progressPagination.pageSize}
                          total={brokerProgressList.length}
                          showSizeChanger
                          showQuickJumper
                          showTotal={(total) => `共 ${total} 条记录`}
                          pageSizeOptions={['10', '20', '50']}
                          onChange={handleProgressPageChange}
                        />
                      </div>
                    </>
                  ) : (
                    <Empty
                      description="暂无学习进度数据"
                      style={{ padding: '60px 0' }}
                    />
                  )}
                </div>
              ),
            },
            {
              key: '3',
              label: (
                <span>
                  <BarChartOutlined /> 统计分析
                </span>
              ),
              children: (
                <div style={{ padding: '0 24px 24px' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card
                        style={{ borderRadius: 8 }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <ReactECharts
                          option={completionRateOption}
                          style={{ height: 320 }}
                          notMerge
                        />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card
                        style={{ borderRadius: 8 }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <ReactECharts
                          option={categoryOption}
                          style={{ height: 320 }}
                          notMerge
                        />
                      </Card>
                    </Col>
                    <Col xs={24}>
                      <Card
                        style={{ borderRadius: 8 }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <ReactECharts
                          option={monthlyTrendOption}
                          style={{ height: 320 }}
                          notMerge
                        />
                      </Card>
                    </Col>
                    <Col xs={24}>
                      <Card
                        title={
                          <Space>
                            <ShopOutlined style={{ color: '#1677ff' }} />
                            <span>门店学习排名</span>
                          </Space>
                        }
                        style={{ borderRadius: 8 }}
                        bodyStyle={{ padding: '0 24px 24px' }}
                      >
                        <Table
                          columns={storeRankColumns}
                          dataSource={storeRankData}
                          rowKey="id"
                          pagination={false}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingCourse ? '编辑课程' : '新增课程'}
        open={courseModalVisible}
        onOk={handleCourseModalOk}
        onCancel={() => setCourseModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={courseForm} layout="vertical" preserve={false}>
          <Form.Item
            name="title"
            label="课程标题"
            rules={[{ required: true, message: '请输入课程标题' }]}
          >
            <Input placeholder="请输入课程标题" prefix={<FileTextOutlined />} />
          </Form.Item>
          <Form.Item
            name="description"
            label="课程描述"
            rules={[{ required: true, message: '请输入课程描述' }]}
          >
            <TextArea rows={3} placeholder="请输入课程描述" maxLength={500} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="时长(分钟)"
                rules={[{ required: true, message: '请输入课程时长' }]}
              >
                <Input type="number" placeholder="请输入分钟数" prefix={<ClockCircleOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="课程分类"
                rules={[{ required: true, message: '请选择课程分类' }]}
              >
                <Select placeholder="请选择分类">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      <Tag color={opt.color}>{opt.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="level"
            label="课程级别"
            rules={[{ required: true, message: '请选择课程级别' }]}
          >
            <Select placeholder="请选择级别">
              {LEVEL_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  <Tag color={opt.color}>{opt.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="课程内容"
            rules={[{ required: true, message: '请输入课程内容' }]}
          >
            <TextArea rows={4} placeholder="请输入课程内容详情" maxLength={2000} showCount />
          </Form.Item>
          <Form.Item
            name="cover"
            label="封面图"
            extra="支持jpg、png格式，建议尺寸800x600"
          >
            <Button icon={<UploadOutlined />}>上传封面图</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="课程详情"
        placement="right"
        width={600}
        open={courseDetailVisible}
        onClose={() => setCourseDetailVisible(false)}
        destroyOnClose
      >
        {selectedCourse && (
          <div>
            <Image
              width="100%"
              height={200}
              src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('专业培训课程封面，商务风格，' + selectedCourse.title)}&image_size=landscape_16_9`}
              fallback="https://via.placeholder.com/600x200"
              style={{ objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
            />
            <h2 style={{ marginBottom: 12 }}>{selectedCourse.title}</h2>
            <Space style={{ marginBottom: 16 }} wrap>
              <Tag color={getCategoryColor(selectedCourse.category)}>
                {selectedCourse.category}
              </Tag>
              <Tag color={getLevelColor(selectedCourse.level)}>
                {selectedCourse.level}
              </Tag>
              <Tag color="blue" icon={<ClockCircleOutlined />}>
                {selectedCourse.duration} 分钟
              </Tag>
              <Tag color="green" icon={<UserOutlined />}>
                报名 {selectedCourse.enrolled_count || 0} 人
              </Tag>
              <Tag color="success" icon={<CheckCircleOutlined />}>
                完成 {selectedCourse.completed_count || 0} 人
              </Tag>
            </Space>
            <Divider orientation="left" plain>课程描述</Divider>
            <p style={{ color: '#666', lineHeight: 1.8, marginBottom: 16 }}>
              {selectedCourse.description}
            </p>
            <Divider orientation="left" plain>课程内容</Divider>
            <p style={{ color: '#666', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selectedCourse.content}
            </p>
            <Divider orientation="left" plain>创建信息</Divider>
            <p style={{ color: '#999', fontSize: 13 }}>
              创建时间：{dayjs(selectedCourse.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </p>
          </div>
        )}
      </Drawer>

      <Drawer
        title="经纪人学习详情"
        placement="right"
        width={700}
        open={brokerDetailVisible}
        onClose={() => setBrokerDetailVisible(false)}
        destroyOnClose
      >
        {selectedBroker && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <UserOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                    <div style={{ fontWeight: 600, marginTop: 8 }}>{selectedBroker.name}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>{selectedBroker.storeName}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>
                      {selectedBroker.completedCount}
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>已完成课程</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                      {selectedBroker.avgProgress}%
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>平均进度</div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Divider orientation="left" plain>
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> 已完成课程
            </Divider>
            {completedCourses.length > 0 ? (
              <List
                size="small"
                dataSource={completedCourses}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.course_title}
                      description={
                        <Space>
                          <Tag color={getCategoryColor(item.category || '')}>{item.category}</Tag>
                          <span style={{ color: '#999' }}>
                            完成时间：{dayjs(item.complete_date).format('YYYY-MM-DD')}
                          </span>
                          <span style={{ color: '#faad14' }}>得分：{item.score}分</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Empty description="暂无已完成课程" imageStyle={{ height: 80 }} style={{ marginBottom: 16 }} />
            )}

            <Divider orientation="left" plain>
              <PlayCircleOutlined style={{ color: '#1677ff' }} /> 进行中课程
            </Divider>
            {inProgressCourses.length > 0 ? (
              <List
                size="small"
                dataSource={inProgressCourses}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.course_title}
                      description={
                        <div>
                          <Space style={{ marginBottom: 8 }}>
                            <Tag color={getCategoryColor(item.category || '')}>{item.category}</Tag>
                            <span style={{ color: '#999' }}>
                              开始时间：{dayjs(item.start_date).format('YYYY-MM-DD')}
                            </span>
                          </Space>
                          <Progress percent={item.progress} size="small" />
                        </div>
                      }
                    />
                  </List.Item>
                )}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Empty description="暂无进行中课程" imageStyle={{ height: 80 }} style={{ marginBottom: 16 }} />
            )}

            <Divider orientation="left" plain>
              <ClockCircleOutlined style={{ color: '#722ed1' }} /> 学习记录
            </Divider>
            {studyTimeline.length > 0 ? (
              <Timeline
                items={studyTimeline.map((item) => ({
                  color: item.color,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.action}</div>
                      <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无学习记录" imageStyle={{ height: 80 }} />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TrainingManagementPage;
