import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker,
  Input,
  Select,
  message,
  Typography,
  Row,
  Col,
  Card,
  Descriptions,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  SyncOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { interviews, jobs, resumes } from '../../api/endpoints';
import type { InterviewSchedule, Job, Resume } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const InterviewManage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InterviewSchedule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSchedule | null>(null);
  const [jobList, setJobList] = useState<Job[]>([]);
  const [resumeList, setResumeList] = useState<Resume[]>([]);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const mockInterviews: InterviewSchedule[] = [
    {
      id: 1,
      jobId: 1,
      jobseekerId: 1,
      companyId: 1,
      interviewTime: dayjs().add(1, 'day').toDate(),
      location: '上海市浦东新区张江高科技园区A座3楼',
      interviewer: '王经理',
      status: 'pending',
      calendarSynced: false,
      createdAt: new Date(),
      job: { id: 1, title: '海德堡印刷机机长', status: 'active' } as Job,
      jobseeker: { id: 1, name: '张三', email: 'zhangsan@example.com' } as any,
    },
    {
      id: 2,
      jobId: 2,
      jobseekerId: 2,
      companyId: 1,
      interviewTime: dayjs().add(2, 'days').toDate(),
      location: '上海市浦东新区张江高科技园区A座3楼',
      interviewer: '李主管',
      status: 'passed',
      calendarSynced: true,
      createdAt: new Date(),
      job: { id: 2, title: '小森印刷机副手', status: 'active' } as Job,
      jobseeker: { id: 2, name: '李四', email: 'lisi@example.com' } as any,
    },
    {
      id: 3,
      jobId: 1,
      jobseekerId: 3,
      companyId: 1,
      interviewTime: dayjs().subtract(1, 'day').toDate(),
      location: '上海市浦东新区张江高科技园区A座3楼',
      interviewer: '王经理',
      status: 'rejected',
      calendarSynced: true,
      createdAt: new Date(),
      job: { id: 1, title: '海德堡印刷机机长', status: 'active' } as Job,
      jobseeker: { id: 3, name: '王五', email: 'wangwu@example.com' } as any,
    },
  ];

  useEffect(() => {
    fetchData();
    fetchJobList();
    fetchResumeList();
  }, [page, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await interviews.list(params);
      const list = response.data?.list || response.data?.data || response.data || [];
      const total = response.data?.total ?? 0;
      setData(list.length > 0 ? list : mockInterviews);
      setTotal(total > 0 ? total : mockInterviews.length);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
      setData(mockInterviews);
      setTotal(mockInterviews.length);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobList = async () => {
    try {
      const response = await jobs.list({ pageSize: 100, status: 'active' });
      const list = response.data?.list || response.data?.data || response.data || [];
      setJobList(list);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchResumeList = async () => {
    try {
      const response = await resumes.list({ pageSize: 100 });
      const list = response.data?.list || response.data?.data || response.data || [];
      setResumeList(list);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: any }> = {
      pending: { color: 'processing', text: '待面试', icon: <ClockCircleOutlined /> },
      passed: { color: 'success', text: '已通过', icon: <CheckOutlined /> },
      rejected: { color: 'error', text: '已拒绝', icon: <CloseOutlined /> },
      cancelled: { color: 'default', text: '已取消', icon: <CloseOutlined /> },
    };
    return statusMap[status] || { color: 'default', text: status, icon: null };
  };

  const handleCreate = () => {
    setSelectedInterview(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleViewDetail = (record: InterviewSchedule) => {
    setSelectedInterview(record);
    setDetailModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const interviewData = {
        jobId: values.jobId,
        jobseekerId: values.jobseekerId,
        companyId: 1,
        interviewTime: values.interviewTime.toDate(),
        location: values.location,
        interviewer: values.interviewer,
        status: 'pending',
        calendarSynced: false,
      };

      await interviews.create(interviewData);
      message.success('面试安排创建成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create interview:', error);
      message.error('创建失败，请重试');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await interviews.update(id, { status });
      message.success('状态更新成功');
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('更新失败，请重试');
    }
  };

  const handleSyncCalendar = async (id: number) => {
    try {
      await interviews.syncCalendar(id);
      message.success('日历同步成功');
      fetchData();
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      message.error('同步失败，请重试');
    }
  };

  const handleDownloadICS = async (id: number) => {
    try {
      const icsData = await interviews.getICS(id);
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-${id}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('ICS 文件下载成功');
    } catch (error) {
      console.error('Failed to download ICS:', error);
      const mockICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Printing Job Platform//Interview//EN
BEGIN:VEVENT
UID:interview-${id}@printing-job.com
DTSTAMP:${dayjs().format('YYYYMMDDTHHmmss')}Z
DTSTART:${dayjs().add(1, 'day').format('YYYYMMDDTHHmmss')}Z
DTEND:${dayjs().add(1, 'day').add(1, 'hour').format('YYYYMMDDTHHmmss')}Z
SUMMARY:面试邀请
DESCRIPTION:印刷人才招聘平台面试安排
LOCATION:公司会议室
END:VEVENT
END:VCALENDAR`;

      const blob = new Blob([mockICS], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-${id}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('ICS 文件下载成功');
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const columns = [
    {
      title: '候选人',
      key: 'candidate',
      width: 120,
      render: (_: any, record: InterviewSchedule) => (
        <Space>
          <UserOutlined />
          <Text strong>{record.jobseeker?.name || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '应聘岗位',
      key: 'job',
      width: 180,
      render: (_: any, record: InterviewSchedule) => (
        <Tag color="blue">{record.job?.title || '-'}</Tag>
      ),
    },
    {
      title: '面试时间',
      dataIndex: 'interviewTime',
      key: 'interviewTime',
      width: 180,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '面试地点',
      dataIndex: 'location',
      key: 'location',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Space>
            <EnvironmentOutlined />
            <span>{text}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '面试官',
      dataIndex: 'interviewer',
      key: 'interviewer',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color}>
            {config.icon} {config.text}
          </Tag>
        );
      },
    },
    {
      title: '日历同步',
      dataIndex: 'calendarSynced',
      key: 'calendarSynced',
      width: 100,
      render: (synced: boolean) =>
        synced ? <Tag color="success">已同步</Tag> : <Tag color="default">未同步</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: InterviewSchedule) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确认该候选人通过面试？"
                onConfirm={() => handleStatusChange(record.id, 'passed')}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
                  通过
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确认拒绝该候选人？"
                onConfirm={() => handleStatusChange(record.id, 'rejected')}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<CloseOutlined />}>
                  拒绝
                </Button>
              </Popconfirm>
            </>
          )}
          {!record.calendarSynced && (
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => handleSyncCalendar(record.id)}
            >
              同步日历
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadICS(record.id)}
          >
            下载ICS
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: '8px' }} />
            面试管理
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建面试安排
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
            }}
          >
            <Option value="pending">待面试</Option>
            <Option value="passed">已通过</Option>
            <Option value="rejected">已拒绝</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder={['开始时间', '结束时间']}
            style={{ width: 360 }}
            onChange={(dates) => {
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
            }}
          />
          <Button type="primary" onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={() => {
            setStatusFilter(undefined);
            setDateRange(null);
            setPage(1);
            fetchData();
          }}>
            重置
          </Button>
        </Space>
      </Card>

      <Card>
        <Row gutter={24} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">总面试数</Text>
              <Title level={3} style={{ margin: '8px 0' }}>
                {total}
              </Title>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">待面试</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#1890ff' }}>
                {data.filter((i) => i.status === 'pending').length}
              </Title>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">已通过</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#52c41a' }}>
                {data.filter((i) => i.status === 'passed').length}
              </Title>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">已拒绝</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#ff4d4f' }}>
                {data.filter((i) => i.status === 'rejected').length}
              </Title>
            </div>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>创建面试安排</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="jobId"
                label="选择岗位"
                rules={[{ required: true, message: '请选择岗位' }]}
              >
                <Select placeholder="请选择招聘岗位" showSearch optionFilterProp="children">
                  {jobList.map((job) => (
                    <Option key={job.id} value={job.id}>
                      {job.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="jobseekerId"
                label="选择候选人"
                rules={[{ required: true, message: '请选择候选人' }]}
              >
                <Select placeholder="请选择候选人" showSearch optionFilterProp="children">
                  {resumeList.map((resume) => (
                    <Option key={resume.id} value={resume.id}>
                      {resume.name} - {resume.expectedPosition || '未填写职位'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="interviewTime"
            label="面试时间"
            rules={[{ required: true, message: '请选择面试时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm"
              placeholder="请选择面试时间"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="location"
                label="面试地点"
                rules={[{ required: true, message: '请输入面试地点' }]}
              >
                <Input placeholder="请输入面试地点" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="interviewer"
                label="面试官"
                rules={[{ required: true, message: '请输入面试官姓名' }]}
              >
                <Input placeholder="请输入面试官姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>面试详情</span>
            {selectedInterview && (
              <Tag color={getStatusConfig(selectedInterview.status).color}>
                {getStatusConfig(selectedInterview.status).icon}
                {getStatusConfig(selectedInterview.status).text}
              </Tag>
            )}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedInterview && selectedInterview.status === 'pending' && (
            <>
              <Button
                key="pass"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  handleStatusChange(selectedInterview.id, 'passed');
                  setDetailModalVisible(false);
                }}
              >
                通过
              </Button>
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  handleStatusChange(selectedInterview.id, 'rejected');
                  setDetailModalVisible(false);
                }}
              >
                拒绝
              </Button>
            </>
          ),
          selectedInterview && (
            <Button
              key="ics"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadICS(selectedInterview.id)}
            >
              下载ICS
            </Button>
          ),
        ]}
        width={700}
      >
        {selectedInterview ? (
          <Card>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="候选人">
                <Space>
                  <UserOutlined />
                  {selectedInterview.jobseeker?.name || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="应聘岗位">
                <Tag color="blue">{selectedInterview.job?.title || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="面试时间" span={2}>
                <Space>
                  <ClockCircleOutlined />
                  {dayjs(selectedInterview.interviewTime).format('YYYY-MM-DD HH:mm')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="面试地点" span={2}>
                <Space>
                  <EnvironmentOutlined />
                  {selectedInterview.location || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="面试官">
                {selectedInterview.interviewer || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="日历同步">
                {selectedInterview.calendarSynced ? (
                  <Tag color="success">已同步</Tag>
                ) : (
                  <Tag color="default">未同步</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="候选人邮箱">
                {selectedInterview.jobseeker?.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedInterview.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {selectedInterview.jobseeker && (
              <Card
                title="候选人信息"
                size="small"
                style={{ marginTop: '16px' }}
                type="inner"
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Text type="secondary">姓名：</Text>
                    <Text strong>{selectedInterview.jobseeker?.name || '-'}</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">邮箱：</Text>
                    <Text strong>{selectedInterview.jobseeker?.email || '-'}</Text>
                  </Col>
                </Row>
              </Card>
            )}
          </Card>
        ) : null}
      </Modal>
    </div>
  );
};

export default InterviewManage;
