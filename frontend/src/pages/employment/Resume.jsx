import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Empty,
  Skeleton,
  Typography,
  Avatar,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Modal,
  List,
  message,
  Popconfirm,
  Divider,
  Progress,
  Tabs,
  Upload,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  EyeOutlined,
  FileTextOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useRequest from '../../hooks/useRequest';
import { getMyResume, saveResume } from '../../api/employment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { TabPane } = Tabs;

const mockResume = {
  id: 1,
  avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20headshot&image_size=square',
  name: '张三',
  phone: '13812345678',
  email: 'zhangsan@example.com',
  gender: '男',
  age: 28,
  location: '北京市朝阳区',
  jobIntention: '高级前端开发工程师',
  expectedSalary: '25K-35K',
  workYears: 5,
  education: '本科',
  selfIntroduction: '5年前端开发经验，精通React、Vue等主流框架，有大型政务系统开发经验。具备良好的团队协作能力和沟通能力，对技术有热情，喜欢钻研新技术。',
  skills: ['React', 'Vue', 'TypeScript', 'Node.js', 'Webpack', 'Git', 'HTML5', 'CSS3', 'JavaScript', 'TypeScript'],
  workExperience: [
    {
      id: 1,
      company: '科技创新有限公司',
      position: '高级前端开发工程师',
      startDate: '2021-03',
      endDate: '至今',
      description: '负责公司核心政务产品的前端架构设计与开发，带领5人团队完成多个重要项目。优化系统性能，将首屏加载时间从5秒降低到1.5秒。',
    },
    {
      id: 2,
      company: '互联网科技公司',
      position: '前端开发工程师',
      startDate: '2019-06',
      endDate: '2021-02',
      description: '参与电商平台的前端开发，负责商品详情页、购物车等核心模块。使用React技术栈，与后端团队紧密协作，按时交付高质量代码。',
    },
  ],
  education: [
    {
      id: 1,
      school: '北京理工大学',
      major: '计算机科学与技术',
      degree: '本科',
      startDate: '2015-09',
      endDate: '2019-06',
      description: '主修课程：数据结构、算法设计、操作系统、计算机网络、软件工程等。GPA: 3.8/4.0',
    },
  ],
  projectExperience: [
    {
      id: 1,
      name: '政务服务平台',
      role: '前端技术负责人',
      startDate: '2022-01',
      endDate: '2023-12',
      description: '负责省级政务服务平台的前端架构设计，采用微前端架构，支持100+业务模块接入。项目服务群众超过5000万人次，获得省级科技进步奖。',
    },
    {
      id: 2,
      name: '企业管理系统',
      role: '前端开发工程师',
      startDate: '2020-03',
      endDate: '2020-12',
      description: '参与企业ERP系统的前端开发，负责财务管理、人力资源等模块。使用Vue + Element UI技术栈，提高企业运营效率30%。',
    },
  ],
};

const Resume = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [form] = Form.useForm();
  const [workForm] = Form.useForm();
  const [educationForm] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [skillInput, setSkillInput] = useState('');

  const [resume, setResume] = useState(mockResume);
  const [skills, setSkills] = useState(mockResume.skills);

  const [workModalVisible, setWorkModalVisible] = useState(false);
  const [educationModalVisible, setEducationModalVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [editingEducation, setEditingEducation] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  const { loading, data: resumeData } = useRequest(getMyResume, {
    onError: () => message.error('获取简历信息失败'),
  });

  const { loading: saveLoading, run: runSave } = useRequest(saveResume, {
    manual: true,
    onSuccess: () => {
      message.success('简历保存成功！');
    },
    onError: () => message.error('保存失败，请稍后重试'),
  });

  const displayResume = resumeData || resume;

  const resumeCompleteness = useMemo(() => {
    let score = 0;
    const total = 100;

    if (displayResume.name) score += 10;
    if (displayResume.phone) score += 10;
    if (displayResume.email) score += 10;
    if (displayResume.avatar) score += 5;
    if (displayResume.jobIntention) score += 10;
    if (displayResume.expectedSalary) score += 5;
    if (displayResume.selfIntroduction) score += 10;
    if (skills.length > 0) score += 10;
    if (displayResume.workExperience?.length > 0) score += 15;
    if (displayResume.education?.length > 0) score += 10;
    if (displayResume.projectExperience?.length > 0) score += 5;

    return Math.min(score, total);
  }, [displayResume, skills]);

  const getCompletenessColor = (score) => {
    if (score >= 90) return '#52C41A';
    if (score >= 70) return '#1E6FDB';
    if (score >= 50) return '#FAAD14';
    return '#F5222D';
  };

  const getCompletenessText = (score) => {
    if (score >= 90) return '非常完整';
    if (score >= 70) return '比较完整';
    if (score >= 50) return '基本完整';
    return '需要完善';
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleAddWork = () => {
    setEditingWork(null);
    workForm.resetFields();
    setWorkModalVisible(true);
  };

  const handleEditWork = (work) => {
    setEditingWork(work);
    workForm.setFieldsValue({
      ...work,
      dateRange: work.startDate && work.endDate !== '至今'
        ? [work.startDate, work.endDate].map(d => d ? `${d}-01` : null)
        : null,
    });
    setWorkModalVisible(true);
  };

  const handleSaveWork = async () => {
    try {
      const values = await workForm.validateFields();
      const newWork = {
        id: editingWork ? editingWork.id : Date.now(),
        ...values,
        startDate: values.dateRange?.[0]?.format('YYYY-MM') || '',
        endDate: values.dateRange?.[1] ? values.dateRange[1].format('YYYY-MM') : '至今',
      };
      delete newWork.dateRange;

      const updatedWork = editingWork
        ? displayResume.workExperience.map(w => w.id === editingWork.id ? newWork : w)
        : [...displayResume.workExperience, newWork];

      setResume({ ...displayResume, workExperience: updatedWork });
      setWorkModalVisible(false);
      message.success(editingWork ? '工作经历已更新' : '工作经历已添加');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteWork = (workId) => {
    setResume({
      ...displayResume,
      workExperience: displayResume.workExperience.filter(w => w.id !== workId),
    });
    message.success('工作经历已删除');
  };

  const handleAddEducation = () => {
    setEditingEducation(null);
    educationForm.resetFields();
    setEducationModalVisible(true);
  };

  const handleEditEducation = (edu) => {
    setEditingEducation(edu);
    educationForm.setFieldsValue({
      ...edu,
      dateRange: edu.startDate && edu.endDate
        ? [edu.startDate, edu.endDate].map(d => d ? `${d}-01` : null)
        : null,
    });
    setEducationModalVisible(true);
  };

  const handleSaveEducation = async () => {
    try {
      const values = await educationForm.validateFields();
      const newEdu = {
        id: editingEducation ? editingEducation.id : Date.now(),
        ...values,
        startDate: values.dateRange?.[0]?.format('YYYY-MM') || '',
        endDate: values.dateRange?.[1]?.format('YYYY-MM') || '',
      };
      delete newEdu.dateRange;

      const updatedEdu = editingEducation
        ? displayResume.education.map(e => e.id === editingEducation.id ? newEdu : e)
        : [...displayResume.education, newEdu];

      setResume({ ...displayResume, education: updatedEdu });
      setEducationModalVisible(false);
      message.success(editingEducation ? '教育经历已更新' : '教育经历已添加');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteEducation = (eduId) => {
    setResume({
      ...displayResume,
      education: displayResume.education.filter(e => e.id !== eduId),
    });
    message.success('教育经历已删除');
  };

  const handleAddProject = () => {
    setEditingProject(null);
    projectForm.resetFields();
    setProjectModalVisible(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    projectForm.setFieldsValue({
      ...project,
      dateRange: project.startDate && project.endDate
        ? [project.startDate, project.endDate].map(d => d ? `${d}-01` : null)
        : null,
    });
    setProjectModalVisible(true);
  };

  const handleSaveProject = async () => {
    try {
      const values = await projectForm.validateFields();
      const newProject = {
        id: editingProject ? editingProject.id : Date.now(),
        ...values,
        startDate: values.dateRange?.[0]?.format('YYYY-MM') || '',
        endDate: values.dateRange?.[1]?.format('YYYY-MM') || '',
      };
      delete newProject.dateRange;

      const updatedProjects = editingProject
        ? displayResume.projectExperience.map(p => p.id === editingProject.id ? newProject : p)
        : [...displayResume.projectExperience, newProject];

      setResume({ ...displayResume, projectExperience: updatedProjects });
      setProjectModalVisible(false);
      message.success(editingProject ? '项目经历已更新' : '项目经历已添加');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteProject = (projectId) => {
    setResume({
      ...displayResume,
      projectExperience: displayResume.projectExperience.filter(p => p.id !== projectId),
    });
    message.success('项目经历已删除');
  };

  const handleSaveResume = async () => {
    try {
      const values = await form.validateFields();
      const resumeData = {
        ...values,
        skills,
        workExperience: displayResume.workExperience,
        education: displayResume.education,
        projectExperience: displayResume.projectExperience,
      };
      await runSave(resumeData);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleViewApplications = () => {
    navigate('/employment/applications');
  };

  const tabItems = [
    {
      key: 'basic',
      label: (
        <Space>
          <UserOutlined />
          基本信息
        </Space>
      ),
    },
    {
      key: 'work',
      label: (
        <Space>
          <FileTextOutlined />
          工作经历
        </Space>
      ),
    },
    {
      key: 'education',
      label: (
        <Space>
          <FileTextOutlined />
          教育经历
        </Space>
      ),
    },
    {
      key: 'project',
      label: (
        <Space>
          <FileTextOutlined />
          项目经验
        </Space>
      ),
    },
    {
      key: 'skills',
      label: (
        <Space>
          <CheckCircleOutlined />
          技能特长
        </Space>
      ),
    },
    {
      key: 'self',
      label: (
        <Space>
          <EditOutlined />
          自我评价
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>简历管理</Title>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)}>
            预览简历
          </Button>
          <Button icon={<FileTextOutlined />} onClick={handleViewApplications}>
            投递记录
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveResume}
            loading={saveLoading}
          >
            保存简历
          </Button>
        </Space>
      </div>

      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 20 }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Space size={16}>
              <Avatar src={displayResume.avatar} size={64} icon={<UserOutlined />} />
              <div>
                <Title level={4} style={{ margin: 0, marginBottom: 4 }}>{displayResume.name}</Title>
                <Tag color="#1E6FDB">{displayResume.jobIntention}</Tag>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Text type="secondary" style={{ minWidth: 80 }}>简历完整度:</Text>
              <Progress
                percent={resumeCompleteness}
                size="small"
                strokeColor={getCompletenessColor(resumeCompleteness)}
                style={{ flex: 1, maxWidth: 300 }}
              />
              <Text strong style={{ color: getCompletenessColor(resumeCompleteness), minWidth: 80 }}>
                {resumeCompleteness}%
              </Text>
              <Tag color={getCompletenessColor(resumeCompleteness)}>
                {getCompletenessText(resumeCompleteness)}
              </Tag>
            </div>
          </Col>
          <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              期望薪资: <Text strong style={{ color: '#F5222D' }}>{displayResume.expectedSalary}</Text>
            </Text>
            <Upload showUploadList={false} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />} size="small">
                上传附件简历
              </Button>
            </Upload>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={8}>
          <Card style={{ position: 'sticky', top: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar src={displayResume.avatar} size={100} icon={<UserOutlined />} />
              <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>{displayResume.name}</Title>
              <Tag color="#1E6FDB">{displayResume.jobIntention}</Tag>
              <div style={{ marginTop: 8, color: '#F5222D', fontWeight: 'bold' }}>
                期望薪资: {displayResume.expectedSalary}
              </div>
            </div>

            <Divider />

            <List
              size="small"
              dataSource={[
                { icon: <PhoneOutlined />, label: '手机', value: displayResume.phone },
                { icon: <MailOutlined />, label: '邮箱', value: displayResume.email },
                { icon: <UserOutlined />, label: '性别', value: displayResume.gender },
                { icon: <UserOutlined />, label: '年龄', value: `${displayResume.age}岁` },
                { icon: <EnvironmentOutlined />, label: '所在地', value: displayResume.location },
                { icon: <FileTextOutlined />, label: '工作年限', value: `${displayResume.workYears}年` },
                { icon: <FileTextOutlined />, label: '学历', value: displayResume.education },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    {item.icon}
                    <Text type="secondary">{item.label}:</Text>
                    <Text>{item.value}</Text>
                  </Space>
                </List.Item>
              )}
            />

            <Divider />

            <Title level={5} style={{ marginBottom: 12 }}>技能标签</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {skills.map((skill, index) => (
                <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                  {skill}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={16}>
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />

            <Divider style={{ margin: '16px 0' }} />

            <Form form={form} layout="vertical" initialValues={displayResume}>
              {activeTab === 'basic' && (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="name"
                      label="姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phone"
                      label="手机号"
                      rules={[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                      ]}
                    >
                      <Input placeholder="请输入手机号" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入正确的邮箱格式' },
                      ]}
                    >
                      <Input placeholder="请输入邮箱" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="gender" label="性别">
                      <Select placeholder="请选择性别">
                        <Option value="男">男</Option>
                        <Option value="女">女</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="age" label="年龄">
                      <InputNumber min={18} max={70} style={{ width: '100%' }} placeholder="请输入年龄" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="location" label="所在地">
                      <Input placeholder="请输入所在地" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="jobIntention"
                      label="求职意向"
                      rules={[{ required: true, message: '请输入求职意向' }]}
                    >
                      <Input placeholder="请输入求职意向" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="expectedSalary"
                      label="期望薪资"
                      rules={[{ required: true, message: '请选择期望薪资' }]}
                    >
                      <Select placeholder="请选择期望薪资">
                        <Option value="10K-15K">10K-15K</Option>
                        <Option value="15K-20K">15K-20K</Option>
                        <Option value="20K-25K">20K-25K</Option>
                        <Option value="25K-30K">25K-30K</Option>
                        <Option value="30K-35K">30K-35K</Option>
                        <Option value="35K+">35K以上</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="workYears" label="工作年限">
                      <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="请输入工作年限" addonAfter="年" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="education" label="最高学历">
                      <Select placeholder="请选择最高学历">
                        <Option value="大专">大专</Option>
                        <Option value="本科">本科</Option>
                        <Option value="硕士">硕士</Option>
                        <Option value="博士">博士</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {activeTab === 'work' && (
                <div>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddWork}>
                      添加工作经历
                    </Button>
                  </div>
                  {displayResume.workExperience.length > 0 ? (
                    <List
                      dataSource={displayResume.workExperience}
                      renderItem={(work) => (
                        <List.Item
                          key={work.id}
                          actions={[
                            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditWork(work)} size="small">
                              编辑
                            </Button>,
                            <Popconfirm
                              title="确定要删除这条工作经历吗？"
                              onConfirm={() => handleDeleteWork(work.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                                删除
                              </Button>
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <Text strong>{work.position}</Text>
                                <Text type="secondary">@</Text>
                                <Text>{work.company}</Text>
                              </Space>
                            }
                            description={
                              <div>
                                <Tag color="blue">{work.startDate} - {work.endDate}</Tag>
                                <div style={{ marginTop: 8, color: '#666' }}>{work.description}</div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无工作经历" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              )}

              {activeTab === 'education' && (
                <div>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEducation}>
                      添加教育经历
                    </Button>
                  </div>
                  {displayResume.education.length > 0 ? (
                    <List
                      dataSource={displayResume.education}
                      renderItem={(edu) => (
                        <List.Item
                          key={edu.id}
                          actions={[
                            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditEducation(edu)} size="small">
                              编辑
                            </Button>,
                            <Popconfirm
                              title="确定要删除这条教育经历吗？"
                              onConfirm={() => handleDeleteEducation(edu.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                                删除
                              </Button>
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <Text strong>{edu.school}</Text>
                                <Tag color="green">{edu.degree}</Tag>
                              </Space>
                            }
                            description={
                              <div>
                                <div style={{ marginBottom: 4 }}>
                                  <Text>{edu.major}</Text>
                                  <Text type="secondary" style={{ marginLeft: 8 }}>{edu.startDate} - {edu.endDate}</Text>
                                </div>
                                <div style={{ color: '#666' }}>{edu.description}</div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无教育经历" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              )}

              {activeTab === 'project' && (
                <div>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProject}>
                      添加项目经历
                    </Button>
                  </div>
                  {displayResume.projectExperience.length > 0 ? (
                    <List
                      dataSource={displayResume.projectExperience}
                      renderItem={(project) => (
                        <List.Item
                          key={project.id}
                          actions={[
                            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditProject(project)} size="small">
                              编辑
                            </Button>,
                            <Popconfirm
                              title="确定要删除这条项目经历吗？"
                              onConfirm={() => handleDeleteProject(project.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                                删除
                              </Button>
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <Text strong>{project.name}</Text>
                                <Tag color="orange">{project.role}</Tag>
                              </Space>
                            }
                            description={
                              <div>
                                <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                                  {project.startDate} - {project.endDate}
                                </Text>
                                <div style={{ color: '#666' }}>{project.description}</div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无项目经历" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">添加您掌握的技能，提高简历匹配度</Text>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {skills.map((skill, index) => (
                      <Tag
                        key={index}
                        color="blue"
                        closable
                        onClose={() => handleRemoveSkill(skill)}
                        style={{ padding: '4px 12px', fontSize: 14 }}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                  <Input.Search
                    placeholder="输入技能名称，回车添加"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onSearch={handleAddSkill}
                    enterButton={<PlusOutlined />}
                    allowClear
                  />
                  <Divider />
                  <div>
                    <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>推荐技能</Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['React', 'Vue', 'TypeScript', 'Node.js', 'Python', 'Java', 'MySQL', 'Git'].map((skill) => (
                        <Tag
                          key={skill}
                          color={skills.includes(skill) ? 'blue' : 'default'}
                          style={{ cursor: 'pointer', padding: '4px 12px' }}
                          onClick={() => {
                            if (!skills.includes(skill)) {
                              setSkills([...skills, skill]);
                            }
                          }}
                        >
                          {skills.includes(skill) ? <CheckCircleOutlined /> : <PlusOutlined />} {skill}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'self' && (
                <Form.Item name="selfIntroduction" label="自我评价">
                  <TextArea
                    rows={8}
                    placeholder="简单介绍一下自己，包括您的优势、求职意向、职业规划等"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              )}
            </Form>
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingWork ? '编辑工作经历' : '添加工作经历'}
        open={workModalVisible}
        onOk={handleSaveWork}
        onCancel={() => setWorkModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={workForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="company"
                label="公司名称"
                rules={[{ required: true, message: '请输入公司名称' }]}
              >
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="position"
                label="职位"
                rules={[{ required: true, message: '请输入职位' }]}
              >
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="dateRange"
                label="工作时间"
                rules={[{ required: true, message: '请选择工作时间' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  picker="month"
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label="工作描述"
                rules={[{ required: true, message: '请输入工作描述' }]}
              >
                <TextArea rows={4} placeholder="描述您的工作内容和成就" maxLength={500} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingEducation ? '编辑教育经历' : '添加教育经历'}
        open={educationModalVisible}
        onOk={handleSaveEducation}
        onCancel={() => setEducationModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={educationForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="school"
                label="学校名称"
                rules={[{ required: true, message: '请输入学校名称' }]}
              >
                <Input placeholder="请输入学校名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="degree"
                label="学历"
                rules={[{ required: true, message: '请选择学历' }]}
              >
                <Select placeholder="请选择学历">
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="major"
                label="专业"
                rules={[{ required: true, message: '请输入专业' }]}
              >
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="dateRange"
                label="在校时间"
                rules={[{ required: true, message: '请选择在校时间' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  picker="month"
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="补充说明">
                <TextArea rows={3} placeholder="补充说明（如GPA、主修课程、荣誉奖项等）" maxLength={300} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingProject ? '编辑项目经历' : '添加项目经历'}
        open={projectModalVisible}
        onOk={handleSaveProject}
        onCancel={() => setProjectModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={projectForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="role"
                label="担任角色"
                rules={[{ required: true, message: '请输入担任角色' }]}
              >
                <Input placeholder="如：技术负责人、前端开发工程师" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="dateRange"
                label="项目时间"
                rules={[{ required: true, message: '请选择项目时间' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  picker="month"
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label="项目描述"
                rules={[{ required: true, message: '请输入项目描述' }]}
              >
                <TextArea rows={4} placeholder="描述项目内容、您的职责以及项目成果" maxLength={500} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="简历预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div style={{ padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar src={displayResume.avatar} size={80} icon={<UserOutlined />} />
            <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>{displayResume.name}</Title>
            <Tag color="#1E6FDB" style={{ fontSize: 14 }}>{displayResume.jobIntention}</Tag>
            <div style={{ marginTop: 8, color: '#F5222D', fontWeight: 'bold', fontSize: 16 }}>
              期望薪资: {displayResume.expectedSalary}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Text type="secondary">简历完整度: </Text>
            <Text strong style={{ color: getCompletenessColor(resumeCompleteness) }}>
              {resumeCompleteness}%
            </Text>
            <Tag color={getCompletenessColor(resumeCompleteness)} style={{ marginLeft: 8 }}>
              {getCompletenessText(resumeCompleteness)}
            </Tag>
          </div>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={12} sm={8}>
                <Text type="secondary">手机号：</Text>
                <Text>{displayResume.phone}</Text>
              </Col>
              <Col xs={12} sm={8}>
                <Text type="secondary">邮箱：</Text>
                <Text>{displayResume.email}</Text>
              </Col>
              <Col xs={12} sm={8}>
                <Text type="secondary">所在地：</Text>
                <Text>{displayResume.location}</Text>
              </Col>
            </Row>
          </Card>

          <Divider orientation="left">自我介绍</Divider>
          <Paragraph style={{ marginBottom: 24 }}>{displayResume.selfIntroduction}</Paragraph>

          <Divider orientation="left">技能特长</Divider>
          <div style={{ marginBottom: 24 }}>
            {skills.map((skill, index) => (
              <Tag key={index} color="blue" style={{ padding: '4px 12px', fontSize: 14, marginBottom: 4 }}>
                {skill}
              </Tag>
            ))}
          </div>

          <Divider orientation="left">工作经历</Divider>
          {displayResume.workExperience.map((work) => (
            <div key={work.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 16 }}>{work.position} @ {work.company}</Text>
                <Tag color="blue">{work.startDate} - {work.endDate}</Tag>
              </div>
              <Paragraph style={{ color: '#666', marginTop: 4 }}>{work.description}</Paragraph>
            </div>
          ))}

          <Divider orientation="left">教育经历</Divider>
          {displayResume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Text strong style={{ fontSize: 16 }}>{edu.school}</Text>
                  <Tag color="green">{edu.degree}</Tag>
                  <Text>{edu.major}</Text>
                </Space>
                <Text type="secondary">{edu.startDate} - {edu.endDate}</Text>
              </div>
              {edu.description && <Paragraph style={{ color: '#666', marginTop: 4 }}>{edu.description}</Paragraph>}
            </div>
          ))}

          <Divider orientation="left">项目经历</Divider>
          {displayResume.projectExperience.map((project) => (
            <div key={project.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Text strong style={{ fontSize: 16 }}>{project.name}</Text>
                  <Tag color="orange">{project.role}</Tag>
                </Space>
                <Text type="secondary">{project.startDate} - {project.endDate}</Text>
              </div>
              <Paragraph style={{ color: '#666', marginTop: 4 }}>{project.description}</Paragraph>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Resume;
