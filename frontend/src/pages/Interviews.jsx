import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Modal,
  Form,
  Spin,
  message,
  Card,
  Tabs,
  Calendar,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  CloseOutlined,
  EyeOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { interviews, candidates, jobs } from '../api';
import { useAuth } from '../context/AuthContext';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

const statusMap = {
  pending: { color: 'orange', text: '待开始' },
  ongoing: { color: 'blue', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
};

function Interviews() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [viewMode, setViewMode] = useState('list');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined,
    dateRange: undefined,
    interviewer: undefined,
  });
  const [candidateOptions, setCandidateOptions] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [interviewerOptions] = useState([
    { value: '张三', label: '张三' },
    { value: '李四', label: '李四' },
    { value: '王五', label: '王五' },
  ]);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        keyword: filters.keyword,
        status: filters.status,
        interviewer: filters.interviewer,
      };
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await interviews.getList(params);
      if (res.code === 0) {
        setData(res.data.list);
        setPagination({
          current: page,
          pageSize,
          total: res.data.total,
        });
      } else {
        message.error(res.message || '获取面试列表失败');
      }
    } catch (err) {
      console.error('获取面试列表失败:', err);
      message.error('获取面试列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [candidatesRes, jobsRes] = await Promise.all([
        candidates.getList({ pageSize: 100 }),
        jobs.getList({ pageSize: 100 }),
      ]);
      if (candidatesRes.code === 0) {
        setCandidateOptions(
          candidatesRes.data.list.map((c) => ({
            value: c.id,
            label: c.name,
          }))
        );
      }
      if (jobsRes.code === 0) {
        setJobOptions(
          jobsRes.data.list.map((j) => ({
            value: j.id,
            label: j.title,
          }))
        );
      }
    } catch (err) {
      console.error('获取选项失败:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchOptions();
    }
  }, [token, filters]);

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, keyword: value }));
  };

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleDateChange = (dates) => {
    setFilters((prev) => ({ ...prev, dateRange: dates }));
  };

  const handleInterviewerChange = (value) => {
    setFilters((prev) => ({ ...prev, interviewer: value }));
  };

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const handleCreate = () => {
    setModalVisible(true);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        interviewTime: values.interviewTime.format('YYYY-MM-DD HH:mm:ss'),
      };
      const res = await interviews.create(data);
      if (res.code === 0) {
        message.success('创建面试成功');
        setModalVisible(false);
        fetchData(pagination.current, pagination.pageSize);
      } else {
        message.error(res.message || '创建面试失败');
      }
    } catch (err) {
      console.error('创建面试失败:', err);
      if (err.errorFields) return;
      message.error('创建面试失败，请稍后重试');
    }
  };

  const handleStart = async (id) => {
    try {
      const res = await interviews.start(id);
      if (res.code === 0) {
        message.success('面试已开始');
        navigate(`/interviews/${id}`);
      } else {
        message.error(res.message || '开始面试失败');
      }
    } catch (err) {
      console.error('开始面试失败:', err);
      message.error('开始面试失败，请稍后重试');
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await interviews.cancel(id);
      if (res.code === 0) {
        message.success('面试已取消');
        fetchData(pagination.current, pagination.pageSize);
      } else {
        message.error(res.message || '取消面试失败');
      }
    } catch (err) {
      console.error('取消面试失败:', err);
      message.error('取消面试失败，请稍后重试');
    }
  };

  const columns = [
    {
      title: '求职者',
      dataIndex: 'candidateName',
      key: 'candidateName',
      render: (text) => <span>{text}</span>,
    },
    {
      title: '岗位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text) => <span>{text}</span>,
    },
    {
      title: '面试时间',
      dataIndex: 'interviewTime',
      key: 'interviewTime',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '面试官',
      dataIndex: 'interviewer',
      key: 'interviewer',
      render: (text) => <span>{text}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/interviews/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStart(record.id)}
            >
              开始
            </Button>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="确认取消此面试？"
              onConfirm={() => handleCancel(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<CloseOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const renderListView = () => (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={pagination}
      onChange={handleTableChange}
      scroll={{ x: 800 }}
    />
  );

  const renderCalendarView = () => (
    <Card>
      <Calendar
        dateCellRender={(value) => {
          const dayInterviews = data.filter(
            (item) => dayjs(item.interviewTime).format('YYYY-MM-DD') === value.format('YYYY-MM-DD')
          );
          return (
            <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {dayInterviews.map((item) => (
                <li key={item.id} style={{ marginBottom: '4px' }}>
                  <Tag color={statusMap[item.status]?.color || 'default'}>
                    {dayjs(item.interviewTime).format('HH:mm')} - {item.candidateName}
                  </Tag>
                </li>
              ))}
            </ul>
          );
        }}
      />
    </Card>
  );

  return (
    <div>
      <Card
        title="面试管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建面试
          </Button>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索求职者/岗位"
              allowClear
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) handleSearch('');
              }}
              icon={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              onChange={handleStatusChange}
            >
              <Option value="pending">待开始</Option>
              <Option value="ongoing">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker style={{ width: '100%' }} onChange={handleDateChange} />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="选择面试官"
              allowClear
              style={{ width: '100%' }}
              onChange={handleInterviewerChange}
              options={interviewerOptions}
            />
          </Col>
        </Row>

        <Tabs
          activeKey={viewMode}
          onChange={setViewMode}
          style={{ marginBottom: '16px' }}
          items={[
            {
              key: 'list',
              label: (
                <span>
                  <UnorderedListOutlined /> 列表视图
                </span>
              ),
            },
            {
              key: 'calendar',
              label: (
                <span>
                  <CalendarOutlined /> 日历视图
                </span>
              ),
            },
          ]}
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : viewMode === 'list' ? (
          renderListView()
        ) : (
          renderCalendarView()
        )}
      </Card>

      <Modal
        title="新建面试"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText="创建"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="candidateId"
            label="求职者"
            rules={[{ required: true, message: '请选择求职者' }]}
          >
            <Select placeholder="请选择求职者" options={candidateOptions} />
          </Form.Item>
          <Form.Item
            name="jobId"
            label="岗位"
            rules={[{ required: true, message: '请选择岗位' }]}
          >
            <Select placeholder="请选择岗位" options={jobOptions} />
          </Form.Item>
          <Form.Item
            name="interviewTime"
            label="面试时间"
            rules={[{ required: true, message: '请选择面试时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item
            name="interviewer"
            label="面试官"
            rules={[{ required: true, message: '请选择面试官' }]}
          >
            <Select placeholder="请选择面试官" options={interviewerOptions} />
          </Form.Item>
          <Form.Item
            name="method"
            label="面试方式"
            rules={[{ required: true, message: '请选择面试方式' }]}
          >
            <Select placeholder="请选择面试方式">
              <Option value="video">视频面试</Option>
              <Option value="onsite">现场面试</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Interviews;
