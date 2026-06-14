import { useState } from 'react';
import {
  Card,
  List,
  Tag,
  Select,
  Button,
  Space,
  Modal,
  Steps,
  Form,
  Input,
  DatePicker,
  Upload,
  Table,
  Row,
  Col,
  Typography,
  Skeleton,
  Empty,
  message,
  Divider,
  Checkbox,
  Radio,
  Alert,
} from 'antd';
import {
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import {
  getExams,
  getExamRegistrations,
  createExamRegistration,
  payExamRegistration,
} from '../../api/exam';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;
const { Dragger } = Upload;

const examTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'civil_servant', label: '公务员考试' },
  { value: 'public_institution', label: '事业单位' },
  { value: 'professional_qualification', label: '职业资格' },
  { value: 'teacher', label: '教师资格' },
  { value: 'medical', label: '医疗卫生' },
];

const mockAvailableExams = [
  {
    id: 1,
    name: '2024年国家公务员考试',
    type: 'civil_servant',
    typeName: '公务员考试',
    registrationStart: '2024-10-15 08:00:00',
    registrationEnd: '2024-10-24 18:00:00',
    examTime: '2024-11-26 09:00:00',
    fee: 100,
    description: '中央机关及其直属机构考试录用公务员',
    positions: 25000,
    applicants: 125800,
    requirements: '具有大专及以上文化程度',
  },
  {
    id: 2,
    name: '2024年一级建造师资格考试',
    type: 'professional_qualification',
    typeName: '职业资格',
    registrationStart: '2024-07-01 09:00:00',
    registrationEnd: '2024-07-15 17:00:00',
    examTime: '2024-09-07 09:00:00',
    fee: 240,
    description: '一级建造师执业资格考试',
    positions: null,
    applicants: 85600,
    requirements: '工程类或工程经济类专业大专及以上学历，满足相应工作年限',
  },
  {
    id: 3,
    name: '2024年医师资格考试',
    type: 'medical',
    typeName: '医疗卫生',
    registrationStart: '2024-02-01 09:00:00',
    registrationEnd: '2024-02-15 17:00:00',
    examTime: '2024-06-15 09:00:00',
    fee: 300,
    description: '国家医师资格考试',
    positions: null,
    applicants: 45200,
    requirements: '具有高等学校医学专业本科以上学历，在执业医师指导下，在医疗、预防、保健机构中试用期满一年',
  },
  {
    id: 4,
    name: '2024年中小学教师资格考试',
    type: 'teacher',
    typeName: '教师资格',
    registrationStart: '2024-01-12 09:00:00',
    registrationEnd: '2024-01-15 17:00:00',
    examTime: '2024-03-09 09:00:00',
    fee: 140,
    description: '中小学教师资格考试（笔试）',
    positions: null,
    applicants: 68900,
    requirements: '具有中华人民共和国国籍，遵守宪法和法律，热爱教育事业，具有良好的思想品德',
  },
];

const mockRegistrations = [
  {
    id: 1,
    examName: '2024年国家公务员考试',
    examType: 'civil_servant',
    examTypeName: '公务员考试',
    registrationTime: '2024-10-16 14:30:00',
    reviewStatus: 'approved',
    paymentStatus: 'paid',
    position: '办公厅综合处一级主任科员及以下',
    examLocation: '北京市',
  },
  {
    id: 2,
    examName: '2024年一级建造师资格考试',
    examType: 'professional_qualification',
    examTypeName: '职业资格',
    registrationTime: '2024-07-05 10:20:00',
    reviewStatus: 'pending',
    paymentStatus: 'unpaid',
    position: '建筑工程管理',
    examLocation: '上海市',
  },
  {
    id: 3,
    examName: '2024年上半年事业单位公开招聘',
    examType: 'public_institution',
    examTypeName: '事业单位',
    registrationTime: '2024-04-08 16:45:00',
    reviewStatus: 'rejected',
    paymentStatus: 'unpaid',
    position: '信息中心技术岗',
    examLocation: '广州市',
    rejectReason: '专业不符合要求',
  },
];

const personalInfo = {
  name: '张三',
  idCard: '110101199001011234',
  phone: '13800138000',
  email: 'zhangsan@example.com',
  gender: 'male',
  birthDate: '1990-01-01',
  ethnicity: '汉族',
  politicalStatus: '中共党员',
  education: '本科',
  degree: '学士学位',
  major: '计算机科学与技术',
  graduationSchool: '清华大学',
  graduationDate: '2012-06-30',
  address: '北京市海淀区中关村大街1号',
  workUnit: '某科技有限公司',
  workYears: 12,
};

const examInstructions = [
  '请仔细阅读《招考公告》和《报考指南》等内容，熟悉公务员招考的相关政策。',
  '报名时，报考人员要仔细阅读诚信承诺书，提交的报考申请材料应当真实、准确。',
  '报考人员提供虚假报考申请材料的，一经查实，即取消报考资格。',
  '报名期间，报考人员可在报名期间内改报其他职位。',
  '请妥善保管好本人的用户名和密码，以防他人盗用。',
  '报名成功后，请及时关注资格审查结果。',
];

const Registrations = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [form] = Form.useForm();

  const { loading, data: exams, refresh: refreshExams } = useRequest(getExams, {
    onError: () => {
      message.error('获取考试列表失败');
    },
  });

  const {
    loading: registrationsLoading,
    data: registrations,
    refresh: refreshRegistrations,
  } = useRequest(getExamRegistrations, {
    onError: () => {
      message.error('获取报名记录失败');
    },
  });

  const { loading: submitLoading, run: submitRegistration } = useRequest(createExamRegistration, {
    manual: true,
    onSuccess: () => {
      message.success('报名提交成功，等待审核');
      setRegisterModalVisible(false);
      setCurrentStep(0);
      setSelectedExam(null);
      setAgreed(false);
      form.resetFields();
      refreshRegistrations();
    },
    onError: () => {
      message.error('报名提交失败，请重试');
    },
  });

  const { loading: payLoading, run: pay } = useRequest(payExamRegistration, {
    manual: true,
    onSuccess: () => {
      message.success('缴费成功');
      refreshRegistrations();
    },
    onError: () => {
      message.error('缴费失败，请重试');
    },
  });

  const availableExams = exams || mockAvailableExams;
  const myRegistrations = registrations || mockRegistrations;

  const getTypeColor = (type) => {
    const colorMap = {
      civil_servant: '#1E6FDB',
      public_institution: '#52C41A',
      professional_qualification: '#FAAD14',
      teacher: '#722ED1',
      medical: '#13C2C2',
      other: '#8C8C8C',
    };
    return colorMap[type] || '#8C8C8C';
  };

  const getReviewStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'processing', text: '待审核', icon: <ClockCircleOutlined /> },
      approved: { color: 'success', text: '审核通过', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', text: '审核未通过', icon: <CloseCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getPaymentStatusTag = (status) => {
    const statusMap = {
      unpaid: { color: 'warning', text: '待缴费', icon: <DollarOutlined /> },
      paid: { color: 'success', text: '已缴费', icon: <CheckCircleOutlined /> },
      refunded: { color: 'default', text: '已退款', icon: <CloseCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.unpaid;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getTypeName = (type) => {
    const option = examTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  const filteredExams = availableExams.filter(item => {
    return typeFilter === 'all' || item.type === typeFilter;
  });

  const handleRegister = (exam) => {
    setSelectedExam(exam);
    setCurrentStep(0);
    setAgreed(false);
    form.resetFields();
    form.setFieldsValue({
      name: personalInfo.name,
      idCard: personalInfo.idCard,
      phone: personalInfo.phone,
      email: personalInfo.email,
      gender: personalInfo.gender,
      birthDate: dayjs(personalInfo.birthDate),
      ethnicity: personalInfo.ethnicity,
      politicalStatus: personalInfo.politicalStatus,
      education: personalInfo.education,
      degree: personalInfo.degree,
      major: personalInfo.major,
      graduationSchool: personalInfo.graduationSchool,
      graduationDate: dayjs(personalInfo.graduationDate),
      address: personalInfo.address,
      workUnit: personalInfo.workUnit,
      workYears: personalInfo.workYears,
    });
    setRegisterModalVisible(true);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!agreed) {
        message.warning('请阅读并同意报考须知');
        return;
      }
    }
    if (currentStep === 1) {
      form.validateFields().then(() => {
        setCurrentStep(currentStep + 1);
      }).catch(() => {
        message.error('请完善报名信息');
      });
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        examId: selectedExam.id,
        examName: selectedExam.name,
        birthDate: values.birthDate.format('YYYY-MM-DD'),
        graduationDate: values.graduationDate.format('YYYY-MM-DD'),
      };
      await submitRegistration(formattedValues);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handlePay = (id) => {
    Modal.confirm({
      title: '确认缴费',
      content: '确定要缴纳考试费用吗？',
      onOk: () => pay(id),
    });
  };

  const handleCancel = (record) => {
    Modal.confirm({
      title: '取消报名',
      content: '确定要取消该考试的报名吗？取消后将无法恢复。',
      onOk: () => {
        message.success('已取消报名');
        refreshRegistrations();
      },
    });
  };

  const handleViewDetail = (record) => {
    setSelectedRegistration(record);
    setDetailModalVisible(true);
  };

  const uploadProps = {
    beforeUpload: () => false,
    fileList: [],
  };

  const columns = [
    {
      title: '考试名称',
      dataIndex: 'examName',
      key: 'examName',
      render: (text, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{text}</Text>
          <Tag color={getTypeColor(record.examType)} style={{ margin: 0 }}>{record.examTypeName}</Tag>
        </Space>
      ),
    },
    {
      title: '报考职位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '报名时间',
      dataIndex: 'registrationTime',
      key: 'registrationTime',
      width: 180,
    },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: 120,
      render: (status) => getReviewStatusTag(status),
    },
    {
      title: '缴费状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 120,
      render: (status) => getPaymentStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看详情
          </Button>
          {record.reviewStatus === 'approved' && record.paymentStatus === 'unpaid' && (
            <Button
              type="link"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handlePay(record.id)}
              loading={payLoading}
            >
              继续缴费
            </Button>
          )}
          {record.reviewStatus !== 'approved' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancel(record)}
            >
              取消报名
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading || registrationsLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>考试报名</Title>
        <Text type="secondary">选择考试，在线完成报名流程</Text>
      </div>

      <Card
        title={
          <Space>
            <EditOutlined style={{ color: '#1E6FDB' }} />
            可报名考试
          </Space>
        }
        extra={
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 160 }}
          >
            {examTypeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        }
        style={{ marginBottom: 24 }}
      >
        {filteredExams.length === 0 ? (
          <Empty description="暂无符合条件的考试" />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredExams.map(exam => (
              <Col xs={24} sm={12} lg={8} key={exam.id}>
                <Card
                  hoverable
                  title={
                    <Space>
                      <Tag color={getTypeColor(exam.type)} style={{ margin: 0 }}>{exam.typeName}</Tag>
                    </Space>
                  }
                  extra={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <ClockCircleOutlined /> {dayjs(exam.registrationStart).format('MM-DD')} 开始
                    </Text>
                  }
                  actions={[
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleRegister(exam)}
                      style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
                    >
                      立即报名
                    </Button>,
                  ]}
                >
                  <Title level={5} style={{ margin: '0 0 12px 0', minHeight: 48 }}>{exam.name}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13, minHeight: 36 }}>
                    {exam.description}
                  </Text>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                    <CalendarOutlined style={{ marginRight: 6 }} />
                    报名时间：{dayjs(exam.registrationStart).format('MM-DD')} ~ {dayjs(exam.registrationEnd).format('MM-DD')}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                    <ClockCircleOutlined style={{ marginRight: 6 }} />
                    考试时间：{dayjs(exam.examTime).format('YYYY-MM-DD')}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    <DollarOutlined style={{ marginRight: 6 }} />
                    考试费用：¥{exam.fee}
                  </div>
                  {exam.applicants && (
                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                      <Tag color="blue">{exam.applicants.toLocaleString()} 人已报名</Tag>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1E6FDB' }} />
            我的报名记录
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={myRegistrations}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{ emptyText: <Empty description="暂无报名记录" /> }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#1E6FDB' }} />
            考试报名
          </Space>
        }
        open={registerModalVisible}
        onCancel={() => {
          setRegisterModalVisible(false);
          setCurrentStep(0);
          setSelectedExam(null);
          setAgreed(false);
          form.resetFields();
        }}
        width={800}
        footer={null}
        maskClosable={false}
      >
        <Divider style={{ margin: '0 0 24px 0' }} />

        {selectedExam && (
          <>
            <Steps current={currentStep} style={{ marginBottom: 32 }}>
              <Step title="选择考试" description="阅读报考须知" />
              <Step title="填写信息" description="完善报名信息" />
              <Step title="上传材料" description="照片及证明" />
              <Step title="确认缴费" description="提交并缴费" />
            </Steps>

            {currentStep === 0 && (
              <div>
                <Card
                  title={selectedExam.name}
                  size="small"
                  style={{ marginBottom: 24 }}
                >
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Text type="secondary">
                        <Tag color={getTypeColor(selectedExam.type)}>{selectedExam.typeName}</Tag>
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">考试费用：<Text strong>¥{selectedExam.fee}</Text></Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">
                        <CalendarOutlined /> 报名时间：{dayjs(selectedExam.registrationStart).format('YYYY-MM-DD')} ~ {dayjs(selectedExam.registrationEnd).format('YYYY-MM-DD')}
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">
                        <ClockCircleOutlined /> 考试时间：{dayjs(selectedExam.examTime).format('YYYY-MM-DD')}
                      </Text>
                    </Col>
                  </Row>
                </Card>

                <Card
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: '#1E6FDB' }} />
                      报考须知
                    </Space>
                  }
                  size="small"
                  style={{ marginBottom: 24 }}
                >
                  <div style={{ lineHeight: 2, maxHeight: 200, overflowY: 'auto', paddingRight: 12 }}>
                    {examInstructions.map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ color: '#1E6FDB' }}>{index + 1}.</span>
                        <Text type="secondary">{item}</Text>
                      </div>
                    ))}
                  </div>
                </Card>

                <Alert
                  message="报考条件"
                  description={selectedExam.requirements}
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
                  我已仔细阅读并同意以上报考须知，承诺所填信息真实有效
                </Checkbox>
              </div>
            )}

            {currentStep === 1 && (
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  gender: 'male',
                  ethnicity: '汉族',
                  politicalStatus: '中共党员',
                  education: '本科',
                  degree: '学士学位',
                }}
              >
                <Title level={5} style={{ marginBottom: 16 }}>
                  <Space>
                    <UserOutlined style={{ color: '#1E6FDB' }} />
                    基本信息
                  </Space>
                </Title>
                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="gender"
                      label="性别"
                      rules={[{ required: true, message: '请选择性别' }]}
                    >
                      <Radio.Group>
                        <Radio value="male">男</Radio>
                        <Radio value="female">女</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="idCard"
                      label="身份证号"
                      rules={[
                        { required: true, message: '请输入身份证号' },
                        { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确' },
                      ]}
                    >
                      <Input prefix={<IdcardOutlined />} placeholder="请输入身份证号" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="birthDate"
                      label="出生日期"
                      rules={[{ required: true, message: '请选择出生日期' }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="ethnicity"
                      label="民族"
                      rules={[{ required: true, message: '请输入民族' }]}
                    >
                      <Input placeholder="请输入民族" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="politicalStatus"
                      label="政治面貌"
                      rules={[{ required: true, message: '请选择政治面貌' }]}
                    >
                      <Select placeholder="请选择政治面貌">
                        <Option value="中共党员">中共党员</Option>
                        <Option value="中共预备党员">中共预备党员</Option>
                        <Option value="共青团员">共青团员</Option>
                        <Option value="群众">群众</Option>
                        <Option value="其他">其他</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Title level={5} style={{ marginBottom: 16 }}>
                  <Space>
                    <PhoneOutlined style={{ color: '#1E6FDB' }} />
                    联系方式
                  </Space>
                </Title>
                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="phone"
                      label="手机号码"
                      rules={[
                        { required: true, message: '请输入手机号码' },
                        { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                      ]}
                    >
                      <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="电子邮箱"
                      rules={[
                        { required: true, message: '请输入电子邮箱' },
                        { type: 'email', message: '邮箱格式不正确' },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="请输入电子邮箱" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="address"
                  label="通讯地址"
                  rules={[{ required: true, message: '请输入通讯地址' }]}
                >
                  <Input prefix={<HomeOutlined />} placeholder="请输入通讯地址" />
                </Form.Item>

                <Divider />

                <Title level={5} style={{ marginBottom: 16 }}>
                  <Space>
                    <BankOutlined style={{ color: '#1E6FDB' }} />
                    教育背景
                  </Space>
                </Title>
                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="education"
                      label="学历"
                      rules={[{ required: true, message: '请选择学历' }]}
                    >
                      <Select placeholder="请选择学历">
                        <Option value="high_school">高中</Option>
                        <Option value="college">大专</Option>
                        <Option value="bachelor">本科</Option>
                        <Option value="master">硕士</Option>
                        <Option value="doctor">博士</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="degree"
                      label="学位"
                      rules={[{ required: true, message: '请选择学位' }]}
                    >
                      <Select placeholder="请选择学位">
                        <Option value="none">无</Option>
                        <Option value="bachelor">学士学位</Option>
                        <Option value="master">硕士学位</Option>
                        <Option value="doctor">博士学位</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="major"
                      label="专业"
                      rules={[{ required: true, message: '请输入专业' }]}
                    >
                      <Input placeholder="请输入专业" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="graduationDate"
                      label="毕业时间"
                      rules={[{ required: true, message: '请选择毕业时间' }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" picker="date" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="graduationSchool"
                  label="毕业院校"
                  rules={[{ required: true, message: '请输入毕业院校' }]}
                >
                  <Input placeholder="请输入毕业院校" />
                </Form.Item>

                <Divider />

                <Title level={5} style={{ marginBottom: 16 }}>
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#1E6FDB' }} />
                    工作经历
                  </Space>
                </Title>
                <Row gutter={[16, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="workUnit"
                      label="工作单位"
                    >
                      <Input placeholder="请输入工作单位" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="workYears"
                      label="工作年限"
                    >
                      <Input type="number" placeholder="请输入工作年限" addonAfter="年" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            )}

            {currentStep === 2 && (
              <div>
                <Title level={5} style={{ marginBottom: 16 }}>
                  <Space>
                    <UploadOutlined style={{ color: '#1E6FDB' }} />
                    上传证件照片
                  </Space>
                </Title>
                <Card size="small" style={{ marginBottom: 24 }}>
                  <Dragger {...uploadProps} style={{ padding: 20 }}>
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined style={{ fontSize: 32, color: '#1E6FDB' }} />
                    </p>
                    <p className="ant-upload-text">点击或拖拽上传证件照片</p>
                    <p className="ant-upload-hint">
                      支持JPG、PNG格式，文件大小不超过2MB，建议近期免冠正面证件照
                    </p>
                  </Dragger>
                  <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                    <div>• 照片要求：近期免冠正面证件照，蓝底或白底</div>
                    <div>• 尺寸要求：2寸标准证件照（35×45mm）</div>
                    <div>• 文件大小：不超过2MB</div>
                  </div>
                </Card>

                <Title level={5} style={{ marginBottom: 16 }}>
                  <Space>
                    <FileTextOutlined style={{ color: '#1E6FDB' }} />
                    上传证明材料
                  </Space>
                </Title>
                <Card size="small">
                  <Dragger {...uploadProps} style={{ padding: 20 }}>
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined style={{ fontSize: 32, color: '#1E6FDB' }} />
                    </p>
                    <p className="ant-upload-text">点击或拖拽上传证明材料</p>
                    <p className="ant-upload-hint">
                      支持PDF、JPG、PNG格式，可上传学历证书、学位证书、工作证明等
                    </p>
                  </Dragger>
                  <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                    <div>• 学历证书扫描件</div>
                    <div>• 学位证书扫描件（如有）</div>
                    <div>• 工作证明（如有要求）</div>
                    <div>• 其他相关证明材料</div>
                  </div>
                </Card>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <Alert
                  message="请确认以下报名信息准确无误"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Card title="报考信息" size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Text type="secondary">考试名称：</Text>
                      <Text strong>{selectedExam.name}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">考试类型：</Text>
                      <Text strong>{selectedExam.typeName}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">考试时间：</Text>
                      <Text strong>{dayjs(selectedExam.examTime).format('YYYY-MM-DD')}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">考试费用：</Text>
                      <Text strong style={{ color: '#F5222D' }}>¥{selectedExam.fee}</Text>
                    </Col>
                  </Row>
                </Card>

                <Card title="个人信息" size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Text type="secondary">姓名：</Text>
                      <Text strong>{form.getFieldValue('name')}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">身份证号：</Text>
                      <Text strong>{form.getFieldValue('idCard')}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">性别：</Text>
                      <Text strong>{form.getFieldValue('gender') === 'male' ? '男' : '女'}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">出生日期：</Text>
                      <Text strong>{form.getFieldValue('birthDate')?.format('YYYY-MM-DD')}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">联系电话：</Text>
                      <Text strong>{form.getFieldValue('phone')}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">电子邮箱：</Text>
                      <Text strong>{form.getFieldValue('email')}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">学历：</Text>
                      <Text strong>{form.getFieldValue('education')}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">专业：</Text>
                      <Text strong>{form.getFieldValue('major')}</Text>
                    </Col>
                  </Row>
                </Card>

                <Card title="缴费信息" size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text type="secondary">应缴费用：</Text>
                      <Title level={4} style={{ display: 'inline', margin: '0 0 0 8px', color: '#F5222D' }}>
                        ¥{selectedExam.fee}
                      </Title>
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      <div>支持支付宝、微信、银行卡支付</div>
                      <div>缴费成功后将生成报名序号</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handlePrev} disabled={currentStep === 0}>
                上一步
              </Button>
              <Space>
                <Button
                  onClick={() => {
                    setRegisterModalVisible(false);
                    setCurrentStep(0);
                    setSelectedExam(null);
                    setAgreed(false);
                    form.resetFields();
                  }}
                >
                  取消
                </Button>
                {currentStep < 3 ? (
                  <Button type="primary" onClick={handleNext} style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}>
                    下一步
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={submitLoading}
                    style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
                  >
                    确认并缴费
                  </Button>
                )}
              </Space>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1E6FDB' }} />
            报名详情
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedRegistration && (
          <div>
            <Space style={{ marginBottom: 24 }}>
              <Tag color={getTypeColor(selectedRegistration.examType)}>{selectedRegistration.examTypeName}</Tag>
              {getReviewStatusTag(selectedRegistration.reviewStatus)}
              {getPaymentStatusTag(selectedRegistration.paymentStatus)}
            </Space>

            <Card title="考试信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Text type="secondary">考试名称：</Text>
                  <Text strong>{selectedRegistration.examName}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">报考职位：</Text>
                  <Text strong>{selectedRegistration.position}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">考试地点：</Text>
                  <Text strong>{selectedRegistration.examLocation}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">报名时间：</Text>
                  <Text strong>{selectedRegistration.registrationTime}</Text>
                </Col>
              </Row>
            </Card>

            {selectedRegistration.rejectReason && (
              <Alert
                message="审核不通过原因"
                description={selectedRegistration.rejectReason}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Card title="个人信息" size="small">
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text type="secondary">姓名：</Text>
                  <Text strong>{personalInfo.name}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">身份证号：</Text>
                  <Text strong>{personalInfo.idCard}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">联系电话：</Text>
                  <Text strong>{personalInfo.phone}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">电子邮箱：</Text>
                  <Text strong>{personalInfo.email}</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Registrations;
