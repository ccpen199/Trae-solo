import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Select,
  Switch,
  message,
  Divider,
  Descriptions,
  Tag,
  List,
  Modal,
  Progress,
  Space,
  Radio,
  Row,
  Col,
  Steps
} from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  LockOutlined,
  CreditCardOutlined,
  CameraOutlined,
  SaveOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { User } from '@/types';
import { userApi } from '@/api';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const Settings: React.FC = () => {
  const { userInfo, setUserInfo } = useUserStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(userInfo?.avatar);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyForm] = Form.useForm();

  useEffect(() => {
    if (userInfo) {
      profileForm.setFieldsValue({
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        company: userInfo.company,
        location: userInfo.location,
        bio: userInfo.bio
      });
      setAvatarUrl(userInfo.avatar);
    }
  }, [userInfo]);

  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      const result = await userApi.updateProfile(values);
      setUserInfo(result);
      message.success('个人信息更新成功');
    } catch (error) {
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      await userApi.changePassword(values.oldPassword, values.newPassword);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Change password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (info: any) => {
    if (info.file.status === 'done') {
      try {
        const result = await userApi.uploadAvatar(info.file.originFileObj);
        setAvatarUrl(result.avatar);
        if (userInfo) {
          setUserInfo({ ...userInfo, avatar: result.avatar });
        }
        message.success('头像上传成功');
      } catch (error) {
        console.error('Upload avatar error:', error);
      }
    }
  };

  const handleVerifySubmit = async (values: any) => {
    try {
      setLoading(true);
      if (verifyStep === 0) {
        message.success('验证码已发送');
        setVerifyStep(1);
      } else if (verifyStep === 1) {
        message.success('单位认证提交成功，等待审核');
        setVerifyModalVisible(false);
        setVerifyStep(0);
      }
    } catch (error) {
      console.error('Verify error:', error);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 1,
      type: 'alipay',
      name: '支付宝',
      account: '138****8888',
      verified: true,
      default: true
    },
    {
      id: 2,
      type: 'wechat',
      name: '微信支付',
      account: '138****8888',
      verified: true,
      default: false
    },
    {
      id: 3,
      type: 'bank',
      name: '工商银行',
      account: '**** **** **** 8888',
      branch: '北京中关村支行',
      verified: false,
      default: false
    }
  ];

  const tabItems = [
    {
      key: 'profile',
      label: <span><UserOutlined />基本信息</span>,
      children: (
        <div className="max-w-2xl">
          <div className="flex items-center gap-8 mb-8">
            <div className="relative">
              <Avatar size={120} src={avatarUrl} icon={<UserOutlined />}>
                {userInfo?.name?.charAt(0)}
              </Avatar>
              <Upload
                name="avatar"
                showUploadList={false}
                customRequest={handleAvatarUpload}
                className="absolute bottom-0 right-0"
              >
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                />
              </Upload>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{userInfo?.name}</h3>
              <p className="text-gray-500 mb-2">{userInfo?.email}</p>
              <div className="flex items-center gap-2">
                {userInfo?.verified ? (
                  <Tag color="green" icon={<SafetyOutlined />}>已认证</Tag>
                ) : (
                  <Tag color="orange" icon={<WarningOutlined />}>未认证</Tag>
                )}
                <Tag color="blue">平台运营</Tag>
              </div>
            </div>
          </div>

          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
          >
            <Form.Item
              name="name"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[{ required: true, message: '请输入手机号' }]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item
              name="company"
              label="公司名称"
            >
              <Input placeholder="请输入公司名称" />
            </Form.Item>
            <Form.Item
              name="location"
              label="所在地区"
            >
              <Select placeholder="请选择所在地区">
                <Option value="tianning">天宁区</Option>
                <Option value="zhonglou">钟楼区</Option>
                <Option value="wujin">武进区</Option>
                <Option value="xinbei">新北区</Option>
                <Option value="jintan">金坛区</Option>
                <Option value="liyang">溧阳市</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="bio"
              label="个人简介"
            >
              <TextArea rows={4} placeholder="请简单介绍一下您或您的公司..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      key: 'verify',
      label: <span><SafetyOutlined />单位认证</span>,
      children: (
        <div>
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  userInfo?.verified ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {userInfo?.verified ? (
                    <CheckCircleOutlined className="text-3xl text-green-500" />
                  ) : (
                    <WarningOutlined className="text-3xl text-orange-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {userInfo?.verified ? '单位认证已通过' : '尚未完成单位认证'}
                  </h3>
                  <p className="text-gray-500">
                    {userInfo?.verified
                      ? '您的单位认证已通过，享受更多平台权益'
                      : '完成单位认证可获得更多平台权益，提高信誉度'}
                  </p>
                </div>
              </div>
              {!userInfo?.verified && (
                <Button type="primary" onClick={() => setVerifyModalVisible(true)}>
                  立即认证
                </Button>
              )}
            </div>
          </Card>

          {userInfo?.verified && (
            <Card title="认证信息">
              <Descriptions column={2}>
                <Descriptions.Item label="单位名称">某某科技有限公司</Descriptions.Item>
                <Descriptions.Item label="统一社会信用代码">91110108MA0XXXXXX</Descriptions.Item>
                <Descriptions.Item label="单位类型">有限责任公司</Descriptions.Item>
                <Descriptions.Item label="成立日期">2020-01-01</Descriptions.Item>
                <Descriptions.Item label="法人代表">张三</Descriptions.Item>
                <Descriptions.Item label="注册资本">500万元</Descriptions.Item>
                <Descriptions.Item label="认证时间" span={2}>
                  {dayjs(userInfo.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card title="认证权益" className="mt-6">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div className="text-center p-4">
                  <div className="text-3xl text-blue-500 mb-2">⭐</div>
                  <div className="font-medium">专属标识</div>
                  <div className="text-sm text-gray-500">认证标识展示</div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center p-4">
                  <div className="text-3xl text-green-500 mb-2">📈</div>
                  <div className="font-medium">更高额度</div>
                  <div className="text-sm text-gray-500">提升发布限额</div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center p-4">
                  <div className="text-3xl text-orange-500 mb-2">🎯</div>
                  <div className="font-medium">优先推荐</div>
                  <div className="text-sm text-gray-500">任务优先曝光</div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center p-4">
                  <div className="text-3xl text-purple-500 mb-2">🛡️</div>
                  <div className="font-medium">专属客服</div>
                  <div className="text-sm text-gray-500">一对一服务</div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      )
    },
    {
      key: 'security',
      label: <span><LockOutlined />安全设置</span>,
      children: (
        <div className="max-w-2xl">
          <List
            itemLayout="horizontal"
            dataSource={[
              {
                title: '登录密码',
                description: '当前密码强度：强',
                action: '修改',
                onClick: () => document.getElementById('password-form')?.scrollIntoView()
              },
              {
                title: '手机绑定',
                description: `已绑定：${userInfo?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`,
                action: '更换'
              },
              {
                title: '邮箱绑定',
                description: `已绑定：${userInfo?.email}`,
                action: '更换'
              },
              {
                title: '两步验证',
                description: '开启后登录时需要输入验证码',
                action: '开启',
                switch: true
              },
              {
                title: '登录记录',
                description: '查看最近的登录记录',
                action: '查看'
              }
            ]}
            renderItem={(item) => (
              <List.Item
                actions={[
                  item.switch ? (
                    <Switch defaultChecked={false} />
                  ) : (
                    <Button type="link" onClick={item.onClick}>{item.action}</Button>
                  )
                ]}
              >
                <List.Item.Meta
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            )}
          />

          <Divider />

          <div id="password-form">
            <h4 className="text-lg font-bold mb-4">修改密码</h4>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password
                  placeholder="请输入当前密码"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码长度不能少于8位' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message: '密码需包含大小写字母和数字'
                  }
                ]}
              >
                <Input.Password
                  placeholder="请输入新密码"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    }
                  })
                ]}
              >
                <Input.Password
                  placeholder="请再次输入新密码"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确认修改
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      )
    },
    {
      key: 'payment',
      label: <span><CreditCardOutlined />收款方式</span>,
      children: (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold">我的收款方式</h4>
            <Button type="primary" icon={<PlusOutlined />}>添加收款方式</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                className={`relative ${method.default ? 'border-blue-500 border-2' : ''}`}
                actions={[
                  <Button type="link">编辑</Button>,
                  <Button type="link" danger>删除</Button>
                ]}
              >
                {method.default && (
                  <Tag color="blue" className="absolute top-3 right-3">默认</Tag>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    method.type === 'alipay' ? 'bg-blue-100' :
                    method.type === 'wechat' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    <CreditCardOutlined className={`text-2xl ${
                      method.type === 'alipay' ? 'text-blue-500' :
                      method.type === 'wechat' ? 'text-green-500' : 'text-orange-500'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-500">{method.account}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {method.verified ? (
                      <>
                        <CheckCircleOutlined className="text-green-500" />
                        <span className="text-xs text-green-500">已认证</span>
                      </>
                    ) : (
                      <>
                        <WarningOutlined className="text-orange-500" />
                        <span className="text-xs text-orange-500">待认证</span>
                      </>
                    )}
                  </div>
                  {!method.default && (
                    <Button type="link">设为默认</Button>
                  )}
                </div>
                {method.branch && (
                  <div className="text-xs text-gray-400 mt-2">{method.branch}</div>
                )}
              </Card>
            ))}
          </div>

          <Card title="交易设置" className="mt-6">
            <List
              dataSource={[
                {
                  title: '自动支付',
                  description: '任务完成后自动支付服务商款项',
                  switch: true,
                  default: false
                },
                {
                  title: '支付提醒',
                  description: '有需要支付的款项时发送通知',
                  switch: true,
                  default: true
                },
                {
                  title: '电子发票',
                  description: '交易完成后自动开具电子发票',
                  switch: true,
                  default: true
                }
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[<Switch defaultChecked={item.default} />]}
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
      )
    }
  ];

  return (
    <div>
      <Card className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">账户设置</h2>
      </Card>
      <Card>
        <Tabs
          defaultActiveKey="profile"
          items={tabItems}
          type="card"
        />
      </Card>

      <Modal
        title="单位认证"
        open={verifyModalVisible}
        onCancel={() => {
          setVerifyModalVisible(false);
          setVerifyStep(0);
          verifyForm.resetFields();
        }}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <div className="mb-6">
          <Steps current={verifyStep}>
            <Steps.Step title="验证手机号" />
            <Steps.Step title="填写单位信息" />
            <Steps.Step title="等待审核" />
          </Steps>
        </div>

        {verifyStep === 0 && (
          <Form
            form={verifyForm}
            layout="vertical"
            onFinish={handleVerifySubmit}
          >
            <Form.Item
              name="phone"
              label="手机号"
              initialValue={userInfo?.phone}
            >
              <Input disabled />
            </Form.Item>
            <div className="flex gap-3">
              <Form.Item
                name="code"
                label="验证码"
                rules={[{ required: true, message: '请输入验证码' }]}
                className="flex-1"
              >
                <Input placeholder="请输入验证码" />
              </Form.Item>
              <Button className="mt-8">获取验证码</Button>
            </div>
            <Form.Item className="mb-0 flex justify-end">
              <Button type="primary" htmlType="submit" loading={loading}>
                下一步
              </Button>
            </Form.Item>
          </Form>
        )}

        {verifyStep === 1 && (
          <Form
            form={verifyForm}
            layout="vertical"
            onFinish={handleVerifySubmit}
          >
            <Form.Item
              name="companyName"
              label="单位名称"
              rules={[{ required: true, message: '请输入单位名称' }]}
            >
              <Input placeholder="请输入单位全称" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="creditCode"
                  label="统一社会信用代码"
                  rules={[{ required: true, message: '请输入统一社会信用代码' }]}
                >
                  <Input placeholder="91开头的18位代码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="legalPerson"
                  label="法人代表"
                  rules={[{ required: true, message: '请输入法人代表姓名' }]}
                >
                  <Input placeholder="请输入法人代表姓名" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="businessLicense"
              label="营业执照"
              rules={[{ required: true, message: '请上传营业执照' }]}
            >
              <Upload>
                <Button icon={<PlusOutlined />}>上传营业执照照片</Button>
              </Upload>
            </Form.Item>
            <Form.Item className="mb-0 flex justify-end gap-2">
              <Button onClick={() => setVerifyStep(0)}>上一步</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交认证
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Settings;
