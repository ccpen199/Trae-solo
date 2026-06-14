import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
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
import { candidates, jobs } from '../api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Dragger } = Upload;
const { TextArea } = Input;

const educationOptions = ['大专', '本科', '硕士', '博士'];
const experienceOptions = ['不限', '0-1年', '1-3年', '3-5年', '5-10年', '10年以上'];
const cityOptions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];

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
      const res = await candidates.create(values);
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
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar) => <Avatar src={avatar} size={40} />,
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
      dataIndex: 'education',
      key: 'education',
      width: 80,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '工作年限',
      dataIndex: 'experience',
      key: 'experience',
      width: 100,
    },
    {
      title: '期望薪资',
      dataIndex: 'expectedSalary',
      key: 'expectedSalary',
      width: 120,
    },
    {
      title: '意向城市',
      dataIndex: 'expectedCity',
      key: 'expectedCity',
      width: 100,
    },
    {
      title: '简历评分',
      dataIndex: 'resumeScore',
      key: 'resumeScore',
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

  const handleAIMatch = async (record) => {
    try {
      const res = await candidates.match(null, record.id);
      if (res.code === 0) {
        message.success('AI匹配完成');
        navigate(`/candidates/${record.id}`);
      }
    } catch (err) {
      console.error('AI匹配失败:', err);
      message.error('AI匹配失败');
    }
  };

  const handleInterview = (record) => {
    message.info(`正在为 ${record.name} 发起面试...`);
  };

  const handleOffer = (record) => {
    message.info(`正在为 ${record.name} 发送Offer...`);
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
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddCandidate}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
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
          <Form.Item name="education" label="学历">
            <Select placeholder="请选择学历">
              {educationOptions.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="experience" label="工作年限">
            <Select placeholder="请选择工作年限">
              {experienceOptions.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="expectedSalary" label="期望薪资">
            <Input placeholder="例如：15-25K" />
          </Form.Item>
          <Form.Item name="expectedCity" label="意向城市">
            <Select placeholder="请选择意向城市">
              {cityOptions.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="skills" label="技能标签">
            <Select mode="tags" placeholder="输入技能后回车" />
          </Form.Item>
          <Form.Item name="resume" label="简历内容">
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
    </div>
  );
}

export default Candidates;
