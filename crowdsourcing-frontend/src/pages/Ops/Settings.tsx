import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  Tabs,
  Avatar,
  Descriptions,
  Tag,
  Row,
  Col,
  Divider,
  Switch,
  Radio,
  DatePicker,
  Typography,
  Space,
  Modal,
  Progress,
  Alert,
  List,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  EditOutlined,
  SafetyOutlined,
  BankOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { userApi } from '@/api';
import { useUserStore } from '@/store/userStore';
import type { User, Provider } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SKILL_OPTIONS = [
  '政务办事', '民生服务', '社区治理', '市场监管', '公共安全', '数据分析',
  'Python', 'Java', 'SQL', '运维管理', '系统监控', '网络管理',
  '数据库管理', 'Linux', 'Windows Server', 'Docker', 'Kubernetes',
];

const CATEGORY_OPTIONS = [
  { value: 'gov_service', label: '政务办事' },
  { value: 'livelihood', label: '民生服务' },
  { value: 'community', label: '社区治理' },
  { value: 'market', label: '市场监管' },
  { value: 'safety', label: '公共安全' },
  { value: 'data_analysis', label: '数据分析' },
];

const OpsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [providerInfo, setProviderInfo] = useState<Provider | null>(null);
  const [avatarFile, setAvatarFile] = useState<UploadProps['fileList']>([]);
  const [idCardFiles, setIdCardFiles] = useState<UploadProps['fileList']>([]);
  const [certificateFiles, setCertificateFiles] = useState<UploadProps['fileList']>([]);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const { userInfo: storeUserInfo } = useUserStore();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const [userData, providerData] = await Promise.all([
        userApi.getUserInfo(),
        userApi.getProviderProfile(),
      ]);
      setUserInfo(userData);
      setProviderInfo(providerData);

      form.setFieldsValue({
        nickname: userData.nickname,
        phone: userData.phone,
        email: userData.email,
        gender: userData.gender,
        birthday: userData.birthday ? dayjs(userData.birthday) : null,
        location: userData.location,
        bio: providerData.bio,
        categories: providerData.categories,
        skills: providerData.skills,
        experienceYears: providerData.experienceYears,
        education: providerData.education,
        hourlyRate: providerData.hourlyRate,
        available: providerData.available,
        responseTime: providerData.responseTime,
      });

      paymentForm.setFieldsValue({
        bankName: providerData.paymentMethods?.bank?.bankName,
        bankAccount: providerData.paymentMethods?.bank?.accountNumber,
        bankAccountName: providerData.paymentMethods?.bank?.accountName,
        alipayAccount: providerData.paymentMethods?.alipay?.account,
        wechatAccount: providerData.paymentMethods?.wechat?.account,
      });
    } catch (error) {
      message.error('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasic = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const formData = new FormData();
      formData.append('nickname', values.nickname);
      formData.append('phone', values.phone);
      formData.append('email', values.email);
      formData.append('gender', values.gender || '');
      formData.append('birthday', values.birthday ? values.birthday.format('YYYY-MM-DD') : '');
      formData.append('location', values.location || '');
      formData.append('bio', values.bio || '');
      formData.append('categories', JSON.stringify(values.categories || []));
      formData.append('skills', JSON.stringify(values.skills || []));
      formData.append('experienceYears', values.experienceYears?.toString() || '');
      formData.append('education', values.education || '');
      formData.append('hourlyRate', values.hourlyRate?.toString() || '');
      formData.append('available', values.available ? 'true' : 'false');
      formData.append('responseTime', values.responseTime?.toString() || '');

      avatarFile?.forEach((file) => {
        if (file.originFileObj) {
          formData.append('avatar', file.originFileObj);
        }
      });

      await userApi.updateUserInfo(formData);
      message.success('基本信息保存成功');
      loadUserInfo();
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      const values = await securityForm.validateFields();
      setSaving(true);

      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }

      await userApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success('密码修改成功');
      securityForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    try {
      const values = await paymentForm.validateFields();
      setSaving(true);

      await userApi.updatePaymentMethods({
        bank: values.bankName ? {
          bankName: values.bankName,
          accountNumber: values.bankAccount,
          accountName: values.bankAccountName,
        } : undefined,
        alipay: values.alipayAccount ? {
          account: values.alipayAccount,
        } : undefined,
        wechat: values.wechatAccount ? {
          account: values.wechatAccount,
        } : undefined,
      });

      message.success('收款方式保存成功');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitVerification = async () => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('realName', '');
      formData.append('idCardNumber', '');

      idCardFiles?.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append(`idCard[${index}]`, file.originFileObj);
        }
      });

      certificateFiles?.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append(`certificates[${index}]`, file.originFileObj);
        }
      });

      await userApi.submitVerification(formData);
      message.success('认证资料已提交');
      setVerificationModalVisible(false);
      loadUserInfo();
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const getVerificationStatus = () => {
    if (!providerInfo?.verificationStatus) return 'unverified';
    return providerInfo.verificationStatus;
  };

  const verificationStatusConfig: Record<string, { text: string; color: string; icon: React.ReactNode; progress: number }> = {
    unverified: { text: '未认证', color: 'default', icon: <CloseCircleOutlined />, progress: 0 },
    pending: { text: '审核中', color: 'processing', icon: <ClockCircleOutlined />, progress: 50 },
    verified: { text: '已认证', color: 'success', icon: <CheckCircleOutlined />, progress: 100 },
    rejected: { text: '认证失败', color: 'error', icon: <CloseCircleOutlined />, progress: 25 },
  };

  const avatarUploadProps: UploadProps = {
    fileList: avatarFile,
    onChange: ({ fileList: newFileList }) => setAvatarFile(newFileList),
    beforeUpload: () => false,
    maxCount: 1,
    accept: 'image/*',
  };

  const idCardUploadProps: UploadProps = {
    fileList: idCardFiles,
    onChange: ({ fileList: newFileList }) => setIdCardFiles(newFileList),
    beforeUpload: () => false,
    maxCount: 2,
    accept: 'image/*',
  };

  const certificateUploadProps: UploadProps = {
    fileList: certificateFiles,
    onChange: ({ fileList: newFileList }) => setCertificateFiles(newFileList),
    beforeUpload: () => false,
    multiple: true,
    accept: 'image/*,.pdf,.doc,.docx',
  };

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <UserOutlined /> 基本资料
        </span>
      ),
    },
    {
      key: 'verification',
      label: (
        <span>
          <IdcardOutlined /> 资质认证
        </span>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyOutlined /> 安全设置
        </span>
      ),
    },
    {
      key: 'payment',
      label: (
        <span>
          <BankOutlined /> 收款方式
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={3} style={{ margin: 0 }}>账户设置</Title>
        <Text type="secondary">管理您的个人信息和账户设置</Text>
      </div>

      <Card loading={loading}>
        <Tabs defaultActiveKey="basic" items={tabItems}>
          <Tabs.TabPane tab="基本资料" key="basic">
            <Row gutter={24}>
              <Col xs={24} lg={6}>
                <div className="text-center">
                  <Avatar
                    size={120}
                    src={userInfo?.avatar}
                    icon={<UserOutlined />}
                    className="mb-4"
                  />
                  <div className="mb-4">
                    <Upload {...avatarUploadProps}>
                      <Button icon={<UploadOutlined />}>
                        更换头像
                      </Button>
                    </Upload>
                  </div>
                  <Text strong className="block text-lg">{userInfo?.nickname}</Text>
                  <Text type="secondary" className="block">
                    {userInfo?.email}
                  </Text>
                  <div className="mt-2">
                    {providerInfo?.verificationStatus === 'verified' && (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        已认证
                      </Tag>
                    )}
                    {providerInfo?.level && (
                      <Tag color="gold">L{providerInfo.level} 运维专员</Tag>
                    )}
                  </div>

                  <Divider />

                  <Descriptions column={1}>
                    <Descriptions.Item label="完成办件">
                      <Text strong>{providerInfo?.completedTasks || 0}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="平均评分">
                      <Text strong>{providerInfo?.rating?.toFixed(1) || '5.0'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="累计收入">
                      <Text strong type="success">
                        ¥{providerInfo?.totalEarnings?.toLocaleString('zh-CN') || '0'}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </Col>

              <Col xs={24} lg={18}>
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{ available: true, responseTime: 24 }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="nickname"
                        label="昵称"
                        rules={[{ required: true, message: '请输入昵称' }]}
                      >
                        <Input placeholder="请输入昵称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                      >
                        <Input placeholder="请输入邮箱" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="phone" label="手机号码">
                        <Input placeholder="请输入手机号码" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="gender" label="性别">
                        <Radio.Group>
                          <Radio value="male">男</Radio>
                          <Radio value="female">女</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="birthday" label="出生日期">
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="location" label="所在地区">
                        <Input placeholder="例如：常州市天宁区" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="bio" label="个人简介">
                    <TextArea
                      rows={3}
                      placeholder="介绍一下您的专业背景、擅长领域和工作经验"
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>

                  <Divider orientation="left">专业能力</Divider>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="categories"
                        label="擅长领域"
                        rules={[{ required: true, message: '请选择擅长领域' }]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="请选择擅长的服务领域"
                          maxTagCount={3}
                        >
                          {CATEGORY_OPTIONS.map(cat => (
                            <Option key={cat.value} value={cat.value}>
                              {cat.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="skills"
                        label="技能标签"
                        rules={[{ required: true, message: '请选择技能标签' }]}
                      >
                        <Select
                          mode="tags"
                          placeholder="选择或输入专业技能"
                          tokenSeparators={[',']}
                          maxTagCount={5}
                        >
                          {SKILL_OPTIONS.map(skill => (
                            <Option key={skill} value={skill}>
                              {skill}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="experienceYears" label="从业年限">
                        <Select placeholder="请选择">
                          {[1, 2, 3, 5, 8, 10, 15].map(year => (
                            <Option key={year} value={year}>
                              {year} 年
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="education" label="最高学历">
                        <Select placeholder="请选择">
                          <Option value="high_school">高中及以下</Option>
                          <Option value="college">大专</Option>
                          <Option value="bachelor">本科</Option>
                          <Option value="master">硕士</Option>
                          <Option value="doctor">博士</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="hourlyRate" label="时薪 (元/小时)">
                        <Input type="number" placeholder="请输入期望时薪" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider orientation="left">接单设置</Divider>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="available"
                        label="接单状态"
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="接单中" unCheckedChildren="休息中" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="responseTime" label="响应时间 (小时)">
                        <Select placeholder="请选择">
                          <Option value={1}>1 小时内</Option>
                          <Option value={6}>6 小时内</Option>
                          <Option value={12}>12 小时内</Option>
                          <Option value={24}>24 小时内</Option>
                          <Option value={48}>48 小时内</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item className="mb-0">
                    <Space>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        loading={saving}
                        onClick={handleSaveBasic}
                      >
                        保存修改
                      </Button>
                      <Button onClick={loadUserInfo}>
                        重置
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab="资质认证" key="verification">
            <div className="max-w-3xl mx-auto">
              <Card className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Title level={4} style={{ margin: 0 }}>认证状态</Title>
                    <Text type="secondary">
                      完成实名认证和资质认证，提升您的信用等级和接单优先级
                    </Text>
                  </div>
                  <div className="text-center">
                    <div className="w-32 mb-2">
                      <Progress
                        percent={verificationStatusConfig[getVerificationStatus()].progress}
                        showInfo={false}
                        strokeColor={
                          verificationStatusConfig[getVerificationStatus()].color === 'success'
                            ? '#52C41A'
                            : verificationStatusConfig[getVerificationStatus()].color === 'error'
                            ? '#F5222D'
                            : '#1E40AF'
                        }
                      />
                    </div>
                    <Tag
                      color={verificationStatusConfig[getVerificationStatus()].color}
                      icon={verificationStatusConfig[getVerificationStatus()].icon}
                    >
                      {verificationStatusConfig[getVerificationStatus()].text}
                    </Tag>
                  </div>
                </div>
              </Card>

              {providerInfo?.verificationStatus === 'verified' ? (
                <Alert
                  message="您已完成实名认证和资质认证"
                  description={
                    <div>
                      <Paragraph className="m-0">
                        认证时间：{dayjs(providerInfo.verifiedAt!).format('YYYY-MM-DD')}
                      </Paragraph>
                      <Paragraph className="m-0">
                        认证类型：个人实名认证 + 专业资质认证
                      </Paragraph>
                    </div>
                  }
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              ) : (
                <>
                  <Alert
                    message="认证须知"
                    description={
                      <ul className="m-0 pl-4">
                        <li>实名认证需要上传身份证正反面照片</li>
                        <li>资质认证可上传学历证书、职业资格证书、获奖证书等</li>
                        <li>审核通常在 1-3 个工作日内完成</li>
                        <li>认证通过后可获得更高的信用评级和更多的接单机会</li>
                      </ul>
                    }
                    type="info"
                    showIcon
                    className="mb-6"
                  />

                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setVerificationModalVisible(true)}
                  >
                    {providerInfo?.verificationStatus === 'pending' ? '重新提交认证' : '提交认证申请'}
                  </Button>
                </>
              )}
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="安全设置" key="security">
            <div className="max-w-2xl">
              <Card title="修改密码" className="mb-6">
                <Form form={securityForm} layout="vertical">
                  <Form.Item
                    name="oldPassword"
                    label="当前密码"
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password placeholder="请输入当前密码" />
                  </Form.Item>
                  <Form.Item
                    name="newPassword"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 8, message: '密码长度不能少于8位' },
                    ]}
                  >
                    <Input.Password placeholder="请输入新密码（至少8位）" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="确认新密码"
                    rules={[{ required: true, message: '请确认新密码' }]}
                  >
                    <Input.Password placeholder="请再次输入新密码" />
                  </Form.Item>
                  <Form.Item className="mb-0">
                    <Button
                      type="primary"
                      loading={saving}
                      onClick={handleSaveSecurity}
                    >
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card title="账户安全">
                <List
                  itemLayout="horizontal"
                  dataSource={[
                    {
                      title: '手机号码',
                      description: userInfo?.phone || '未绑定',
                      action: <Button type="link">{userInfo?.phone ? '更换' : '绑定'}</Button>,
                    },
                    {
                      title: '邮箱验证',
                      description: userInfo?.email ? '已验证' : '未验证',
                      action: <Button type="link">{userInfo?.email ? '更换' : '验证'}</Button>,
                    },
                    {
                      title: '两步验证',
                      description: '未开启',
                      action: <Button type="link">开启</Button>,
                    },
                    {
                      title: '登录设备管理',
                      description: '当前登录设备：macOS / Chrome',
                      action: <Button type="link">管理</Button>,
                    },
                  ]}
                  renderItem={item => (
                    <List.Item
                      actions={[item.action]}
                      style={{ paddingLeft: 0, paddingRight: 0 }}
                    >
                      <List.Item.Meta
                        title={item.title}
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="收款方式" key="payment">
            <div className="max-w-2xl">
              <Alert
                message="安全提醒"
                description="请确保您的收款账户信息准确无误，所有款项将转入您指定的账户"
                type="warning"
                showIcon
                className="mb-6"
              />

              <Form form={paymentForm} layout="vertical">
                <Card title="银行卡" className="mb-6">
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        name="bankName"
                        label="开户银行"
                      >
                        <Select placeholder="请选择开户银行" showSearch>
                          <Option value="icbc">中国工商银行</Option>
                          <Option value="ccb">中国建设银行</Option>
                          <Option value="abc">中国农业银行</Option>
                          <Option value="boc">中国银行</Option>
                          <Option value="cmb">招商银行</Option>
                          <Option value="spdb">浦发银行</Option>
                          <Option value="cmbc">民生银行</Option>
                          <Option value="other">其他银行</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="bankAccountName"
                        label="开户人姓名"
                      >
                        <Input placeholder="请输入开户人真实姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="bankAccount"
                        label="银行卡号"
                      >
                        <Input placeholder="请输入银行卡号" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="支付宝" className="mb-6">
                  <Form.Item
                    name="alipayAccount"
                    label="支付宝账号"
                  >
                    <Input placeholder="请输入支付宝账号（手机号或邮箱）" />
                  </Form.Item>
                </Card>

                <Card title="微信支付" className="mb-6">
                  <Form.Item
                    name="wechatAccount"
                    label="微信账号"
                  >
                    <Input placeholder="请输入微信账号" />
                  </Form.Item>
                </Card>

                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={handleSavePayment}
                  >
                    保存收款方式
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        title="提交资质认证"
        open={verificationModalVisible}
        onCancel={() => setVerificationModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVerificationModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={saving} onClick={handleSubmitVerification}>
            提交认证
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        <div className="space-y-6">
          <div>
            <Text strong className="block mb-2">
              1. 上传身份证照片
            </Text>
            <Upload {...idCardUploadProps}>
              <Button icon={<UploadOutlined />}>上传身份证（正反面）</Button>
            </Upload>
            <Text type="secondary" className="block mt-1 text-sm">
              请上传身份证正面和反面照片，支持 JPG、PNG 格式
            </Text>
          </div>

          <div>
            <Text strong className="block mb-2">
              2. 上传资质证书（可选）
            </Text>
            <Upload {...certificateUploadProps}>
              <Button icon={<UploadOutlined />}>上传资质证书</Button>
            </Upload>
            <Text type="secondary" className="block mt-1 text-sm">
              可上传学历证书、职业资格证书、获奖证书等，支持 JPG、PNG、PDF 格式，可上传多个
            </Text>
          </div>

          <Alert
            message="承诺条款"
            description={
              <div>
                <Paragraph className="m-0 mb-2">
                  我声明所提交的所有信息和材料均真实有效，如有虚假，愿意承担相应的法律责任。
                </Paragraph>
                <Paragraph className="m-0">
                  我同意常州市公共服务聚合平台根据相关法律法规对提交的资料进行审核，并有权根据审核结果决定是否通过认证。
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

export default OpsSettings;
