import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Table,
  Avatar,
  Progress,
  Space,
  Descriptions,
  Spin,
  message,
  Typography,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UploadOutlined,
  DownloadOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  GiftOutlined,
  EnvironmentOutlined,
  MoneyCollectOutlined,
  ReadOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { jobs, interviews, offers } from '../api';

const { Title, Text, Paragraph } = Typography;

function JobDetail() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (token && id) {
      loadJobDetail();
    }
  }, [token, id]);

  const loadJobDetail = async () => {
    setLoading(true);
    try {
      const [jobRes, appRes] = await Promise.all([
        jobs.getDetail(id),
        jobs.getDetail(id),
      ]);

      if (jobRes.code === 0) {
        setJob(jobRes.data.job);
        setApplications(jobRes.data.applications || []);
      }
    } catch (err) {
      message.error('加载岗位详情失败');
      console.error('加载岗位详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id, currentStatus) => {
    try {
      setActionLoading((prev) => ({ ...prev, publish: true }));
      let res;
      if (currentStatus === 'published') {
        res = await jobs.unpublish(id);
      } else {
        res = await jobs.publish(id);
      }
      if (res.code === 0) {
        message.success(currentStatus === 'published' ? '下架成功' : '发布成功');
        setJob((prev) => ({
          ...prev,
          status: currentStatus === 'published' ? 'offline' : 'published',
        }));
      }
    } catch (err) {
      message.error('操作失败');
      console.error('操作失败:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, publish: false }));
    }
  };

  const handleViewResume = (application) => {
    message.info(`查看 ${application.candidate_name} 的简历`);
  };

  const handleStartInterview = async (application) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`interview_${application.id}`]: true }));
      const res = await interviews.create({
        application_id: application.id,
        schedule_time: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        interview_type: 'video',
        interview_round: 1,
        duration: 30,
      });
      if (res.code === 0) {
        message.success('面试已安排');
        loadJobDetail();
      }
    } catch (err) {
      message.error('发起面试失败');
      console.error('发起面试失败:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`interview_${application.id}`]: false }));
    }
  };

  const handleSendOffer = async (application) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`offer_${application.id}`]: true }));
      const res = await offers.create({
        application_id: application.id,
        job_id: job.id,
        candidate_id: application.candidate_id,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        entry_date: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      });
      if (res.code === 0) {
        message.success('Offer已发送');
        loadJobDetail();
      }
    } catch (err) {
      message.error('发送Offer失败');
      console.error('发送Offer失败:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`offer_${application.id}`]: false }));
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      published: { color: 'success', text: '已发布' },
      draft: { color: 'default', text: '草稿' },
      closed: { color: 'error', text: '已关闭' },
      offline: { color: 'warning', text: '已下架' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const getApplicationStatusTag = (status) => {
    const statusMap = {
      applied: { color: 'default', text: '已投递' },
      reviewing: { color: 'processing', text: '简历筛选中' },
      interview: { color: 'blue', text: '面试中' },
      offer: { color: 'purple', text: 'Offer阶段' },
      hired: { color: 'success', text: '已入职' },
      rejected: { color: 'error', text: '已拒绝' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const getMatchProgressColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const getEducationText = (edu) => {
    const map = {
      high_school: '高中及以下',
      college: '大专',
      bachelor: '本科',
      master: '硕士',
      doctor: '博士',
    };
    return map[edu] || edu;
  };

  const getExperienceText = (exp) => {
    const map = {
      no_limit: '不限',
      fresh: '应届生',
      '1-3': '1-3年',
      '3-5': '3-5年',
      '5-10': '5-10年',
      '10+': '10年以上',
    };
    return map[exp] || exp;
  };

  const applicationColumns = [
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.expected_position}
            </Text>
          </div>
        </div>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: '匹配度',
      dataIndex: 'match_score',
      key: 'match_score',
      width: 150,
      render: (score) => (
        <div style={{ width: 100 }}>
          <Progress
            percent={score || 0}
            size="small"
            strokeColor={getMatchProgressColor(score)}
            format={(p) => `${p}%`}
          />
        </div>
      ),
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getApplicationStatusTag(status),
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '学历/经验',
      key: 'profile',
      render: (_, record) => (
        <div>
          <div>{getEducationText(record.highest_education)}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.work_years}年工作经验
          </Text>
        </div>
      ),
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewResume(record)}
          >
            简历
          </Button>
          {record.status !== 'interview' && record.status !== 'offer' && record.status !== 'hired' && record.status !== 'rejected' && (
            <Button
              type="link"
              size="small"
              icon={<CalendarOutlined />}
              loading={actionLoading[`interview_${record.id}`]}
              onClick={() => handleStartInterview(record)}
            >
              面试
            </Button>
          )}
          {(record.status === 'interview' || record.status === 'reviewing') && (
            <Popconfirm
              title="确定要发送Offer吗？"
              onConfirm={() => handleSendOffer(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                icon={<GiftOutlined />}
                loading={actionLoading[`offer_${record.id}`]}
              >
                Offer
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!job) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">岗位不存在或已被删除</Text>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => navigate('/jobs')}>返回列表</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Space wrap>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/jobs')}>
                返回
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                {job.title}
              </Title>
              {getStatusTag(job.status)}
            </Space>
            <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.45)' }}>
              {job.department} · {job.hr_name || 'HR'}
            </div>
          </div>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/jobs/create?id=${job.id}`)}
            >
              编辑
            </Button>
            <Button
              type={job.status === 'published' ? 'default' : 'primary'}
              icon={job.status === 'published' ? <DownloadOutlined /> : <UploadOutlined />}
              loading={actionLoading.publish}
              onClick={() => handlePublish(job.id, job.status)}
            >
              {job.status === 'published' ? '下架' : '发布'}
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label={<Space><MoneyCollectOutlined />薪资</Space>}>
                {job.salary_negotiable ? (
                  <Tag>面议</Tag>
                ) : (
                  <Text strong style={{ color: '#f5222d' }}>
                    {job.salary_min}K - {job.salary_max}K
                  </Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><EnvironmentOutlined />工作地点</Space>}>
                {job.work_city} {job.work_district}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><ReadOutlined />学历要求</Space>}>
                {getEducationText(job.education)}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><ExperimentOutlined />经验要求</Space>}>
                {getExperienceText(job.experience)}
              </Descriptions.Item>
              <Descriptions.Item label="职位类型">
                {job.job_type === 'full_time' ? '全职' : job.job_type === 'part_time' ? '兼职' : job.job_type === 'internship' ? '实习' : '合同'}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {job.publish_time ? dayjs(job.publish_time).format('YYYY-MM-DD') : '未发布'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="职位描述" style={{ marginBottom: 16 }}>
            <Paragraph style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {job.jd_content}
            </Paragraph>
          </Card>

          {job.competency_tags && (
            <Card title="胜任力标签" style={{ marginBottom: 16 }}>
              <Space wrap>
                {job.competency_tags.split(',').map((tag, idx) => (
                  <Tag key={idx} color="blue">
                    {tag}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          {job.benefits && (
            <Card title="福利待遇" style={{ marginBottom: 16 }}>
              <Space wrap>
                {job.benefits.split(',').map((benefit, idx) => (
                  <Tag key={idx} color="green">
                    {benefit}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="岗位数据" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {job.application_count || 0}
                  </div>
                  <Text type="secondary">投递人数</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {job.interview_count || 0}
                  </div>
                  <Text type="secondary">面试人数</Text>
                </div>
              </Col>
            </Row>
          </Card>

          <Card
            title={`投递者列表 (${applications.length})`}
            extra={<a onClick={() => navigate('/applications')}>查看全部</a>}
          >
            <Table
              dataSource={applications}
              columns={applicationColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ x: 400 }}
              locale={{ emptyText: '暂无投递者' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default JobDetail;
