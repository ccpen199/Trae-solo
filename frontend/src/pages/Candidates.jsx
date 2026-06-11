import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Modal,
  Form,
  Upload,
  Progress,
  Avatar,
  Tag,
  message,
  Spin,
  Popconfirm,
  Row,
  Col,
  Card,
  DatePicker,
  TimePicker,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
  EyeOutlined,
  RobotOutlined,
  VideoCameraOutlined,
  SendOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { candidates, jobs, interviews, applications, offers } from '../api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Dragger } = Upload;
const { TextArea } = Input;

const educationOptions = ['大专', '本科', '硕士', '博士'];
const experienceOptions = ['不限', '0-1年', '1-3年', '3-5年', '5-10年', '10年以上'];
const cityOptions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
const genderOptions = ['男', '女'];
const interviewTypeOptions = [
  { value: 'video', label: '视频面试' },
  { value: 'phone', label: '电话面试' },
  { value: 'onsite', label: '现场面试' },
];

function Candidates() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    keyword: '',
    education: undefined,
    experience: undefined,
    city: undefined,
    jobId: undefined,
  });
  const [jobOptions, setJobOptions] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewForm] = Form.useForm();
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerForm] = Form.useForm();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchJobOptions();
    fetchCandidates();
  }, []);

  const fetchJobOptions = async () => {
    try {
      const res = await jobs.getList({ pageSize: 100 });
      if (res.code === 0) {
        setJobOptions(res.data.list || []);
      }
    } catch (err) {
      console.error('获取岗位列表失败:', err);
    }
  };

  const fetchCandidates = async (page = 1, pageSize = 10, newFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...newFilters,
      };
      const res = await candidates.getList(params);
      if (res.code === 0) {
        setData(res.data.list || []);
        setPagination({
          current: page,
          pageSize,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      console.error('获取求职者列表失败:', err);
      message.error('获取求职者列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const newFilters = { ...filters, keyword: value };
    setFilters(newFilters);
    fetchCandidates(1, pagination.pageSize, newFilters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchCandidates(1, pagination.pageSize, newFilters);
  };

  const handleTableChange = (newPagination) => {
    fetchCandidates(newPagination.current, newPagination.pageSize, filters);
  };

  const handleAddCandidate = async (values) => {
    try {
      const payload = {
        name: values.name,
        phone: values.phone,
        email: values.email,
        gender: values.gender,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
        city: values.city,
        highest_education: values.highest_education,
        work_years: values.work_years,
        expected_position: values.expected_position,
        expected_salary_min: values.expected_salary_min,
        expected_salary_max: values.expected_salary_max,
        expected_city: values.expected_city,
        current_company: values.current_company,
        current_position: values.current_position,
        skill_tags: values.skill_tags ? values.skill_tags.join(',') : undefined,
        parsed_content: values.parsed_content,
      };
      const res = await candidates.create(payload);
      if (res.code === 0) {
        message.success('添加成功');
        setAddModalVisible(false);
        form.resetFields();
        fetchCandidates(pagination.current, pagination.pageSize, filters);
      }
    } catch (err) {
      console.error('添加求职者失败:', err);
      message.error('添加失败');
    }
  };

  const handleUploadResume = async (file) => {
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await candidates.uploadResume(formData);
      if (res.code === 0) {
        message.success('简历上传成功，正在解析...');
        setTimeout(() => {
          fetchCandidates(pagination.current, pagination.pageSize, filters);
        }, 1000);
      }
    } catch (err) {
      console.error('上传简历失败:', err);
      message.error('上传失败');
    } finally {
      setUploadLoading(false);
    }
    return false;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text, record) => (
        <Space>
          <Avatar size={32} src={record.avatar}>
            {text?.charAt(0)}
          </Avatar>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
    },
    {
      title: '学历',
      dataIndex: 'highest_education',
      key: 'highest_education',
      width: 80,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: '工作年限',
      dataIndex: 'work_years',
      key: 'work_years',
      width: 100,
      render: (text) => text != null ? `${text}年` : '-',
    },
    {
      title: '期望薪资',
      key: 'expected_salary',
      width: 140,
      render: (_, record) => {
        if (record.expected_salary_min != null && record.expected_salary_max != null) {
          return `${record.expected_salary_min}-${record.expected_salary_max}K`;
        }
        if (record.expected_salary_min != null) return `${record.expected_salary_min}K起`;
        return '-';
      },
    },
    {
      title: '意向城市',
      dataIndex: 'expected_city',
      key: 'expected_city',
      width: 100,
    },
    {
      title: '简历评分',
      dataIndex: 'resume_score',
      key: 'resume_score',
      width: 150,
      render: (score) => (
        <Progress
          percent={score || 0}
          size="small"
          status={getScoreColor(score)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/candidates/${record.id}`)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<RobotOutlined />}
            onClick={() => handleAIMatch(record)}
          >
            AI匹配
          </Button>
          <Button
            type="link"
            size="small"
            icon={<VideoCameraOutlined />}
            onClick={() => handleInterview(record)}
          >
            发起面试
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleOffer(record)}
          >
            发Offer
          </Button>
        </Space>
      ),
    },
  ];

  const handleAIMatch = (record) => {
    setCurrentRecord(record);
    setSelectedJob(null);
    setMatchModalVisible(true);
  };

  const handleMatchSubmit = async () => {
    if (!selectedJob) {
      message.warning('请选择要匹配的岗位');
      return;
    }
    setMatchLoading(true);
    try {
      const res = await candidates.match(selectedJob, currentRecord.id);
      if (res.code === 0) {
        message.success('AI匹配完成');
        setMatchModalVisible(false);
        navigate(`/candidates/${currentRecord.id}`);
      }
    } catch (err) {
      console.error('AI匹配失败:', err);
      message.error('AI匹配失败');
    } finally {
      setMatchLoading(false);
    }
  };

  const ensureApplication = async (candidateId, jobId) => {
    try {
      const res = await applications.getList({ candidate_id: candidateId, job_id: jobId, pageSize: 1 });
      if (res.code === 0 && res.data?.list?.length > 0) {
        return res.data.list[0];
      }
    } catch (err) {
      console.error('查询申请失败:', err);
    }
    const res = await applications.create({
      candidate_id: candidateId,
      job_id: jobId,
      status: 'screening',
    });
    if (res.code === 0) return res.data;
    throw new Error('创建申请失败');
  };

  const handleInterview = (record) => {
    setCurrentRecord(record);
    interviewForm.resetFields();
    setInterviewModalVisible(true);
  };

  const handleInterviewSubmit = async () => {
    try {
      const values = await interviewForm.validateFields();
      setInterviewLoading(true);
      const application = await ensureApplication(currentRecord.id, values.job_id);
      const scheduleTime = values.schedule_date && values.schedule_time
        ? dayjs(values.schedule_date)
            .hour(values.schedule_time.hour())
            .minute(values.schedule_time.minute())
            .format('YYYY-MM-DD HH:mm:ss')
        : undefined;
      const res = await interviews.create({
        application_id: application.id,
        job_id: values.job_id,
        candidate_id: currentRecord.id,
        interview_type: values.interview_type,
        schedule_time: scheduleTime,
        duration: values.duration,
        interviewer_name: values.interviewer_name,
        interviewer_phone: values.interviewer_phone,
      });
      if (res.code === 0) {
        message.success('面试安排成功');
        setInterviewModalVisible(false);
        interviewForm.resetFields();
      } else {
        message.error(res.message || '面试安排失败');
      }
    } catch (err) {
      if (err.errorFields) return;
      console.error('面试安排失败:', err);
      message.error('面试安排失败');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleOffer = (record) => {
    setCurrentRecord(record);
    offerForm.resetFields();
    setOfferModalVisible(true);
  };

  const handleOfferSubmit = async () => {
    try {
      const values = await offerForm.validateFields();
      setOfferLoading(true);
      const application = await ensureApplication(currentRecord.id, values.job_id);
      const res = await offers.create({
        application_id: application.id,
        job_id: values.job_id,
        candidate_id: currentRecord.id,
        salary_min: values.salary_min,
        salary_max: values.salary_max,
        entry_date: values.entry_date ? values.entry_date.format('YYYY-MM-DD') : undefined,
        probation_salary: values.probation_salary,
        probation_period: values.probation_period,
        work_place: values.work_place,
        benefits: values.benefits,
        other_terms: values.other_terms,
      });
      if (res.code === 0) {
        message.success('Offer发送成功');
        setOfferModalVisible(false);
        offerForm.resetFields();
      } else {
        message.error(res.message || 'Offer发送失败');
      }
    } catch (err) {
      if (err.errorFields) return;
      console.error('Offer发送失败:', err);
      message.error('Offer发送失败');
    } finally {
      setOfferLoading(false);
    }
  };

  const uploadProps = {
    name: 'resume',
    multiple: false,
    accept: '.pdf,.doc,.docx,.txt',
    beforeUpload: handleUploadResume,
    showUploadList: false,
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索姓名、手机号、邮箱"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="学历"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('education', value)}
            >
              {educationOptions.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="工作年限"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('experience', value)}
            >
              {experienceOptions.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="期望城市"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('city', value)}
            >
              {cityOptions.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="匹配岗位"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('jobId', value)}
            >
              {jobOptions.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
              >
                添加求职者
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                上传简历
              </Button>
            </Space>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 1200, y: 'calc(100vh - 320px)' }}
            responsive
          />
        </Spin>
      </Card>

      <Modal
        title="添加求职者"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        destroyOnClose
        width={640}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddCandidate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择性别" allowClear>
                  {genderOptions.map((item) => (
                    <Option key={item} value={item}>{item}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="birthday" label="出生日期">
                <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="工作城市">
                <Select placeholder="请选择工作城市" allowClear>
                  {cityOptions.map((item) => (
                    <Option key={item} value={item}>{item}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="highest_education" label="最高学历">
                <Select placeholder="请选择学历" allowClear>
                  {educationOptions.map((item) => (
                    <Option key={item} value={item}>{item}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="work_years" label="工作年限">
                <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="请输入工作年限" addonAfter="年" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="current_company" label="当前公司">
                <Input placeholder="请输入当前公司" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="current_position" label="当前职位">
                <Input placeholder="请输入当前职位" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="expected_position" label="期望职位">
            <Input placeholder="请输入期望职位" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expected_salary_min" label="期望薪资下限（K/月）">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="最低期望薪资" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_salary_max" label="期望薪资上限（K/月）">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="最高期望薪资" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="expected_city" label="意向城市">
            <Select placeholder="请选择意向城市" allowClear>
              {cityOptions.map((item) => (
                <Option key={item} value={item}>{item}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="skill_tags" label="技能标签">
            <Select mode="tags" placeholder="输入技能后回车" />
          </Form.Item>
          <Form.Item name="parsed_content" label="简历内容">
            <TextArea rows={4} placeholder="请输入简历内容" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAddModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认添加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上传简历"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Spin spinning={uploadLoading}>
          <Dragger {...uploadProps} height={200}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽简历文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 .pdf, .doc, .docx, .txt 格式，单个文件不超过 10MB
            </p>
          </Dragger>
        </Spin>
        <div style={{ marginTop: 16, textAlign: 'center', color: '#999' }}>
          <p>上传后将自动解析简历内容并创建求职者档案</p>
        </div>
      </Modal>

      <Modal
        title="AI岗位匹配"
        open={matchModalVisible}
        onCancel={() => setMatchModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setMatchModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={matchLoading} onClick={handleMatchSubmit}>
            开始匹配
          </Button>,
        ]}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#999' }}>
            选择要匹配的岗位，AI将自动分析求职者与岗位的匹配度
          </span>
        </div>
        <Select
          placeholder="请选择岗位"
          style={{ width: '100%' }}
          onChange={setSelectedJob}
          showSearch
          optionFilterProp="children"
        >
          {jobOptions.map((job) => (
            <Option key={job.id} value={job.id}>
              {job.title}
            </Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="发起面试"
        open={interviewModalVisible}
        onCancel={() => {
          setInterviewModalVisible(false);
          interviewForm.resetFields();
        }}
        confirmLoading={interviewLoading}
        onOk={handleInterviewSubmit}
        destroyOnClose
        width={560}
      >
        <Form form={interviewForm} layout="vertical" preserve={false}>
          <Form.Item
            name="job_id"
            label="选择岗位"
            rules={[{ required: true, message: '请选择岗位' }]}
          >
            <Select placeholder="请选择岗位" showSearch optionFilterProp="children">
              {jobOptions.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="schedule_date" label="面试日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="schedule_time" label="面试时间">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="interview_type"
            label="面试方式"
            rules={[{ required: true, message: '请选择面试方式' }]}
          >
            <Select placeholder="请选择面试方式">
              {interviewTypeOptions.map((item) => (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="duration" label="面试时长（分钟）">
            <InputNumber min={15} max={480} style={{ width: '100%' }} placeholder="请输入面试时长" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="interviewer_name" label="面试官姓名">
                <Input placeholder="请输入面试官姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="interviewer_phone" label="面试官电话">
                <Input placeholder="请输入面试官电话" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="发送Offer"
        open={offerModalVisible}
        onCancel={() => {
          setOfferModalVisible(false);
          offerForm.resetFields();
        }}
        confirmLoading={offerLoading}
        onOk={handleOfferSubmit}
        destroyOnClose
        width={560}
      >
        <Form form={offerForm} layout="vertical" preserve={false}>
          <Form.Item
            name="job_id"
            label="选择岗位"
            rules={[{ required: true, message: '请选择岗位' }]}
          >
            <Select placeholder="请选择岗位" showSearch optionFilterProp="children">
              {jobOptions.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salary_min" label="薪资下限（K/月）" rules={[{ required: true, message: '请输入薪资下限' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="薪资下限" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salary_max" label="薪资上限（K/月）" rules={[{ required: true, message: '请输入薪资上限' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="薪资上限" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="entry_date" label="入职日期" rules={[{ required: true, message: '请选择入职日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="probation_salary" label="试用期薪资（K/月）">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="试用期薪资" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="probation_period" label="试用期（月）">
                <InputNumber min={0} max={12} style={{ width: '100%' }} placeholder="试用期月数" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="work_place" label="工作地点">
            <Input placeholder="请输入工作地点" />
          </Form.Item>
          <Form.Item name="benefits" label="福利待遇">
            <Input placeholder="请输入福利待遇" />
          </Form.Item>
          <Form.Item name="other_terms" label="Offer内容">
            <TextArea rows={4} placeholder="请输入Offer详细内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Candidates;
