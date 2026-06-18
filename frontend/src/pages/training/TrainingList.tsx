import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Tag,
  Space,
  Row,
  Col,
  message,
  Progress,
  Rate,
  Tabs,
  Table,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FireOutlined,
  TrophyOutlined,
  BookOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trainingApi } from '../../api';
import {
  TrainingCourse,
  WorkerRoleMap,
  User,
} from '../../types';

const { Option } = Select;
const { TabPane } = Tabs;

const LevelMap: Record<string, { text: string; color: string }> = {
  beginner: { text: '入门', color: 'green' },
  intermediate: { text: '进阶', color: 'orange' },
  advanced: { text: '高级', color: 'red' },
};

const CategoryMap: Record<string, string> = {
  nanny: '保姆',
  cleaner: '保洁',
  maternity: '月嫂',
  general: '通用',
};

interface MyProgressItem {
  id: string;
  course_id: string;
  course_title: string;
  progress: number;
  passed: boolean;
  last_study_time: string;
}

export default function TrainingList() {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [searchForm] = Form.useForm();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isWorker, setIsWorker] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [myProgress, setMyProgress] = useState<MyProgressItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setCurrentUser(user);
        setIsWorker(user.role === 'worker');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  useEffect(() => {
    if (isWorker && activeTab === 'mine') {
      fetchMyProgress();
    }
  }, [isWorker, activeTab]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const result = await trainingApi.courses(filters);
      setCourses(result.list || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProgress = async () => {
    setProgressLoading(true);
    try {
      const result = await trainingApi.myProgress();
      setMyProgress(result.list || []);
    } catch (error) {
      console.error(error);
    } finally {
      setProgressLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    const cleanedFilters: any = {};
    Object.keys(values).forEach((key) => {
      if (values[key] !== undefined && values[key] !== '' && values[key] !== null) {
        cleanedFilters[key] = values[key];
      }
    });
    setFilters(cleanedFilters);
    setTimeout(() => fetchCourses(), 0);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setFilters({});
    setTimeout(() => fetchCourses(), 0);
  };

  const getCoverStyle = (index: number) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    ];
    return gradients[index % gradients.length];
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      nanny: '👶',
      cleaner: '🧹',
      maternity: '🤱',
      general: '📚',
    };
    return icons[category] || '📖';
  };

  const renderCourseCard = (course: TrainingCourse, index: number) => (
    <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
      <Card
        hoverable
        className="card-hover course-card"
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 12, overflow: 'hidden', height: '100%' }}
        onClick={() => navigate(`/training/${course.id}`)}
      >
        <div
          style={{
            height: 140,
            background: getCoverStyle(index),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            color: 'white',
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 8,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
            }}
          >
            {getCategoryIcon(course.category)}
          </div>
          <PlayCircleOutlined
            style={{
              position: 'absolute',
              fontSize: 44,
              opacity: 0.9,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'none',
            }}
            className="play-icon"
          />
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 11,
            }}
          >
            <ClockCircleOutlined /> {Math.floor(course.duration / 60)}分{course.duration % 60}秒
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.4,
              marginBottom: 10,
              minHeight: 42,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.title}
          </div>
          <Space size={[6, 6]} wrap style={{ marginBottom: 12 }}>
            <Tag color="blue" style={{ margin: 0 }}>
              {CategoryMap[course.category] || course.category}
            </Tag>
            <Tag
              color={LevelMap[course.level]?.color || 'default'}
              style={{ margin: 0 }}
            >
              {LevelMap[course.level]?.text || course.level}
            </Tag>
          </Space>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 8,
              borderTop: '1px solid #f0f0f0',
              color: '#999',
              fontSize: 12,
            }}
          >
            <Space>
              <ClockCircleOutlined /> {course.duration}分钟
            </Space>
            <Space>
              <FireOutlined style={{ color: '#fa8c16' }} />
              {course.completed_count || 0}人学习
            </Space>
          </div>
        </div>
      </Card>
    </Col>
  );

  const progressColumns = [
    {
      title: '课程名称',
      dataIndex: 'course_title',
      key: 'course_title',
      render: (text: string, record: MyProgressItem) => (
        <a
          style={{ cursor: 'pointer', color: '#1677ff' }}
          onClick={() => navigate(`/training/${record.course_id}`)}
        >
          <BookOutlined style={{ marginRight: 6 }} />
          {text}
        </a>
      ),
    },
    {
      title: '学习进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 280,
      render: (progress: number) => (
        <Progress
          percent={progress}
          size="small"
          status={progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'passed',
      key: 'passed',
      width: 120,
      align: 'center' as const,
      render: (passed: boolean) =>
        passed ? (
          <Tag color="green" icon={<TrophyOutlined />}>
            已通过
          </Tag>
        ) : (
          <Tag color="blue" icon={<LoadingOutlined />}>
            学习中
          </Tag>
        ),
    },
    {
      title: '最后学习时间',
      dataIndex: 'last_study_time',
      key: 'last_study_time',
      width: 180,
      render: (text: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#999' }} />
          <span style={{ color: '#666', fontSize: 12 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: MyProgressItem) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/training/${record.course_id}`)}
        >
          继续学习
        </Button>
      ),
    },
  ];

  const renderAllTab = () => (
    <Card
      className="card-hover"
      bodyStyle={{ padding: 20 }}
      style={{ marginTop: 16 }}
      loading={loading}
    >
      {courses.length === 0 ? (
        <Empty description="暂无课程" />
      ) : (
        <Row gutter={[16, 16]}>
          {courses.map((course, index) => renderCourseCard(course, index))}
        </Row>
      )}
    </Card>
  );

  const renderMyProgressTab = () => (
    <Card
      className="card-hover"
      bodyStyle={{ padding: 20 }}
      style={{ marginTop: 16 }}
      loading={progressLoading}
    >
      <Table
        rowKey="id"
        columns={progressColumns}
        dataSource={myProgress}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        locale={{ emptyText: '暂无学习记录，快去学习课程吧！' }}
      />
    </Card>
  );

  return (
    <div className="page-container">
      <Card
        className="filter-card"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 20 }}
      >
        <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="category" label="课程分类">
                <Select placeholder="请选择分类" allowClear>
                  <Option value="nanny">保姆</Option>
                  <Option value="cleaner">保洁</Option>
                  <Option value="maternity">月嫂</Option>
                  <Option value="general">通用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="level" label="难度等级">
                <Select placeholder="请选择难度" allowClear>
                  <Option value="beginner">入门</Option>
                  <Option value="intermediate">进阶</Option>
                  <Option value="advanced">高级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="课程名称/描述" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={24} lg={4}>
              <Form.Item label=" " colon={false}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        bodyStyle={{ padding: 0 }}
        className="card-hover"
        title={
          <Space>
            <BookOutlined style={{ color: '#722ed1' }} />
            <span>培训课程</span>
          </Space>
        }
        extra={
          <Space>
            <Tag color="purple">
              <FireOutlined /> 共 {courses.length} 门课程
            </Tag>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 20px 20px 20px' }}
        >
          <TabPane
            tab={
              <span>
                <BookOutlined /> 全部课程
              </span>
            }
            key="all"
          >
            {renderAllTab()}
          </TabPane>
          {isWorker && (
            <TabPane
              tab={
                <span>
                  <CheckCircleOutlined /> 我的学习
                </span>
              }
              key="mine"
            >
              {renderMyProgressTab()}
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
