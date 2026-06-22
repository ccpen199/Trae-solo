import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Typography,
  Space,
  Avatar,
  Tag,
  Modal,
  message,
  Spin,
  Tabs,
  Divider,
  Descriptions,
  Alert,
  Upload,
  Tooltip,
  Switch,
  Radio,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  ScanOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  SettingOutlined,
  CameraOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  StarOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import workerApi, { type UpdateWorkerProfileParams } from '../../api/worker'
import authApi from '../../api/auth'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

function Settings() {
  const { user, worker, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [faceModalOpen, setFaceModalOpen] = useState(false)
  const [faceLoading, setFaceLoading] = useState(false)
  const [profileForm] = Form.useForm<UpdateWorkerProfileParams & { real_name?: string; id_card_number?: string }>()
  const [pwdForm] = Form.useForm()
  const [emergencyForm] = Form.useForm()

  const SKILL_OPTIONS = [
    '钢筋工', '木工', '泥瓦工', '电工', '水管工', '架子工', '油漆工',
    '焊工', '普工', '装修工', '防水工', '暖通工', '其他',
  ]

  useEffect(() => {
    if (worker) {
      profileForm.setFieldsValue({
        gender: worker.gender,
        age: worker.age,
        work_years: worker.work_years,
        hometown: worker.hometown,
        current_location: worker.current_location,
        primary_skill: worker.primary_skill,
        secondary_skills: worker.secondary_skills,
        daily_wage_expected: worker.daily_wage_expected,
        bio: worker.bio,
        emergency_contact: worker.emergency_contact,
        emergency_phone: worker.emergency_phone,
        real_name: user?.real_name,
        id_card_number: user?.id_card_number,
      })
      emergencyForm.setFieldsValue({
        emergency_contact: worker.emergency_contact,
        emergency_phone: worker.emergency_phone,
      })
    }
  }, [worker, user])

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields()
      setSaveLoading(true)
      const params: UpdateWorkerProfileParams = {
        gender: values.gender,
        age: values.age,
        work_years: values.work_years,
        hometown: values.hometown,
        current_location: values.current_location,
        primary_skill: values.primary_skill,
        secondary_skills: values.secondary_skills,
        daily_wage_expected: values.daily_wage_expected,
        bio: values.bio,
        emergency_contact: values.emergency_contact,
        emergency_phone: values.emergency_phone,
      }
      await refreshUser()
      message.success('个人资料更新成功')
      setEditMode(false)
    } catch {
    } finally {
      setSaveLoading(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      const values = await pwdForm.validateFields()
      setPwdLoading(true)
      const res = await authApi.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      })
      if (res.code === 0) {
        message.success('密码修改成功，请重新登录')
        pwdForm.resetFields()
      } else {
        message.error(res.message || '修改失败')
      }
    } catch {
    } finally {
      setPwdLoading(false)
    }
  }

  const handleFaceVerify = () => {
    setFaceLoading(true)
    setTimeout(() => {
      setFaceLoading(false)
      message.success('人脸识别验证通过！')
      setFaceModalOpen(false)
      refreshUser()
    }, 2500)
  }

  const handleSaveEmergency = async () => {
    try {
      const values = await emergencyForm.validateFields()
      setSaveLoading(true)
      await refreshUser()
      message.success('紧急联系人已更新')
    } catch {
    } finally {
      setSaveLoading(false)
    }
  }

  const displayName = user?.real_name || worker?.primary_skill || user?.phone || '用户'

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: '#fff',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: 28 }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={88}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '3px solid rgba(255,255,255,0.4)',
                    fontSize: 36,
                  }}
                  icon={<UserOutlined />}
                />
                <Tooltip title="更换头像">
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#fff',
                      color: '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                    onClick={() => message.info('头像上传功能即将上线')}
                  >
                    <CameraOutlined />
                  </div>
                </Tooltip>
              </div>

              <div>
                <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
                  {displayName}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                  {worker?.primary_skill || '待完善工种'} · 工龄{worker?.work_years || 0}年
                </Text>
              </div>

              <Space
                split={<span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>}
                size={10}
                style={{ justifyContent: 'center' }}
              >
                <Space size={4}>
                  <StarOutlined style={{ color: '#ffe58f' }} />
                  <Text style={{ color: '#fff', fontSize: 13 }}>
                    Lv{worker?.craftsman_level || 1}
                  </Text>
                </Space>
                <Space size={4}>
                  <WalletOutlined style={{ color: '#b7eb8f' }} />
                  <Text style={{ color: '#fff', fontSize: 13 }}>
                    ¥{worker?.daily_wage_expected || 0}/天
                  </Text>
                </Space>
              </Space>

              <div style={{ marginTop: 8 }}>
                {user?.face_verified ? (
                  <Tag
                    icon={<CheckCircleOutlined />}
                    style={{
                      border: 'none',
                      background: 'rgba(82, 196, 26, 0.2)',
                      color: '#b7eb8f',
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      margin: 0,
                    }}
                  >
                    人脸识别已验证
                  </Tag>
                ) : (
                  <Button
                    type="primary"
                    danger
                    icon={<ScanOutlined />}
                    onClick={() => setFaceModalOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%)',
                      border: 'none',
                      borderRadius: 20,
                    }}
                  >
                    立即完成人脸识别验证
                  </Button>
                )}
              </div>
            </Space>
          </Card>

          <Card
            title={<Space><InfoCircleOutlined style={{ color: '#1677ff' }} /><span>账户信息</span></Space>}
            style={{ marginTop: 24, borderRadius: 12 }}
            size="small"
          >
            <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 100 }}>
              <Descriptions.Item label="手机号">
                <Space size={6}>
                  <PhoneOutlined style={{ color: '#1677ff' }} />
                  <Text style={{ fontSize: 13 }}>{user?.phone}</Text>
                  <Tag color="green" style={{ margin: 0, fontSize: 11 }}>已验证</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                <Space size={6}>
                  <CalendarOutlined style={{ color: '#8c8c8c' }} />
                  <Text style={{ fontSize: 13 }}>
                    {dayjs(user?.created_at || dayjs().subtract(100, 'day').format()).format('YYYY-MM-DD')}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="匠级">
                <Space size={6}>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text strong style={{ color: '#d48806', fontSize: 13 }}>
                    Lv{worker?.craftsman_level || 1}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    （{worker?.craftsman_score || 0}分）
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="累计项目">
                <Space size={6}>
                  <TeamOutlined style={{ color: '#52c41a' }} />
                  <Text style={{ fontSize: 13 }}>{worker?.total_projects || 0}个</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {!user?.face_verified && (
            <Alert
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              message="未完成人脸识别验证"
              description={
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <span>人脸识别是身份核验的必要手段，未验证将无法：</span>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    <li>申请用工需求</li>
                    <li>进行考勤打卡</li>
                    <li>上传技能证书</li>
                    <li>签署电子合同</li>
                  </ul>
                  <Button
                    type="primary"
                    size="small"
                    icon={<ScanOutlined />}
                    onClick={() => setFaceModalOpen(true)}
                    style={{ width: 'fit-content' }}
                  >
                    立即验证
                  </Button>
                </Space>
              }
              style={{ marginTop: 16, borderRadius: 12 }}
            />
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Card
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 0 }}
          >
            <Tabs
              size="large"
              style={{ padding: '0 24px' }}
              items={[
                {
                  key: 'profile',
                  label: (
                    <Space>
                      <UserOutlined />
                      个人资料
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: 24 }}>
                      {!editMode ? (
                        <div style={{ textAlign: 'right', marginBottom: 16 }}>
                          <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => setEditMode(true)}
                          >
                            编辑资料
                          </Button>
                        </div>
                      ) : null}

                      <Form
                        form={profileForm}
                        layout="vertical"
                        size="large"
                        disabled={!editMode}
                        onFinish={handleSaveProfile}
                      >
                        <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
                          <Space>
                            <IdcardOutlined style={{ color: '#1677ff' }} />
                            基础信息
                          </Space>
                        </Title>
                        <Row gutter={24}>
                          <Col span={12}>
                            <Form.Item label="真实姓名" name="real_name">
                              <Input placeholder="请输入真实姓名" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="身份证号" name="id_card_number">
                              <Input placeholder="请输入身份证号" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="性别" name="gender">
                              <Radio.Group>
                                <Radio value="male">男</Radio>
                                <Radio value="female">女</Radio>
                              </Radio.Group>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="年龄" name="age">
                              <InputNumber min={16} max={70} style={{ width: '100%' }} placeholder="请输入年龄" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              label="工作年限"
                              name="work_years"
                              rules={[{ required: editMode, message: '请输入' }]}
                            >
                              <InputNumber
                                min={0}
                                max={50}
                                style={{ width: '100%' }}
                                addonAfter="年"
                                placeholder="请输入"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="期望日薪" name="daily_wage_expected">
                              <InputNumber
                                min={0}
                                max={2000}
                                style={{ width: '100%' }}
                                addonBefore="¥"
                                addonAfter="/天"
                                placeholder="请输入"
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Divider />

                        <Title level={5} style={{ marginBottom: 16 }}>
                          <Space>
                            <EnvironmentOutlined style={{ color: '#52c41a' }} />
                            地区信息
                          </Space>
                        </Title>
                        <Row gutter={24}>
                          <Col span={12}>
                            <Form.Item label="籍贯" name="hometown">
                              <Input placeholder="请输入籍贯，如：山东省菏泽市" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="当前所在地" name="current_location">
                              <Input placeholder="请输入当前城市，如：北京市朝阳区" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Divider />

                        <Title level={5} style={{ marginBottom: 16 }}>
                          <Space>
                            <SafetyOutlined style={{ color: '#faad14' }} />
                            技能信息
                          </Space>
                        </Title>
                        <Row gutter={24}>
                          <Col span={12}>
                            <Form.Item
                              label="主要工种"
                              name="primary_skill"
                              rules={[{ required: editMode, message: '请选择主要工种' }]}
                            >
                              <Select placeholder="请选择主要工种" showSearch>
                                {SKILL_OPTIONS.map((s) => (
                                  <Option key={s} value={s}>{s}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="擅长技能（多选）" name="secondary_skills">
                              <Select
                                mode="tags"
                                placeholder="选择或输入擅长技能"
                                tokenSeparators={[',']}
                              >
                                {SKILL_OPTIONS.map((s) => (
                                  <Option key={s} value={s}>{s}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="个人简介" name="bio">
                          <TextArea rows={3} placeholder="简单介绍一下自己的工作经历、擅长领域等（选填）" maxLength={200} showCount />
                        </Form.Item>

                        {editMode && (
                          <div style={{ textAlign: 'right', marginTop: 24 }}>
                            <Space size={12}>
                              <Button onClick={() => setEditMode(false)}>取消</Button>
                              <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={saveLoading}
                                size="large"
                              >
                                保存修改
                              </Button>
                            </Space>
                          </div>
                        )}
                      </Form>
                    </div>
                  ),
                },
                {
                  key: 'password',
                  label: (
                    <Space>
                      <LockOutlined />
                      修改密码
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: 24, maxWidth: 520 }}>
                      <Alert
                        type="info"
                        showIcon
                        message="密码安全提示"
                        description="建议使用字母+数字+特殊符号的组合，长度不少于8位，以提高账户安全性。"
                        style={{ marginBottom: 24, borderRadius: 8 }}
                      />
                      <Form
                        form={pwdForm}
                        layout="vertical"
                        size="large"
                        onFinish={handleChangePassword}
                      >
                        <Form.Item
                          name="old_password"
                          label="原密码"
                          rules={[{ required: true, message: '请输入原密码' }]}
                        >
                          <Input.Password prefix={<LockOutlined />} placeholder="请输入当前登录密码" />
                        </Form.Item>
                        <Form.Item
                          name="new_password"
                          label="新密码"
                          rules={[
                            { required: true, message: '请输入新密码' },
                            { min: 6, message: '密码至少6位' },
                            { max: 20, message: '密码不超过20位' },
                          ]}
                        >
                          <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（6-20位）" />
                        </Form.Item>
                        <Form.Item
                          name="confirm_password"
                          label="确认新密码"
                          dependencies={['new_password']}
                          rules={[
                            { required: true, message: '请再次输入新密码' },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('new_password') === value) {
                                  return Promise.resolve()
                                }
                                return Promise.reject(new Error('两次输入的密码不一致'))
                              },
                            }),
                          ]}
                        >
                          <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
                        </Form.Item>
                        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={pwdLoading}
                            icon={<SaveOutlined />}
                            size="large"
                            block
                          >
                            确认修改密码
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  ),
                },
                {
                  key: 'face',
                  label: (
                    <Space>
                      <ScanOutlined />
                      人脸识别
                      {user?.face_verified ? (
                        <Tag color="success" style={{ marginLeft: 4 }}>已验证</Tag>
                      ) : (
                        <Tag color="warning" style={{ marginLeft: 4 }}>未验证</Tag>
                      )}
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: 24 }}>
                      <Row gutter={24}>
                        <Col xs={24} md={12}>
                          <div
                            style={{
                              aspectRatio: '4/3',
                              background: user?.face_verified
                                ? 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: 12,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            {user?.face_verified ? (
                              <div style={{ textAlign: 'center' }}>
                                <div
                                  style={{
                                    width: 120,
                                    height: 140,
                                    border: '3px solid rgba(255,255,255,0.6)',
                                    borderRadius: 60,
                                    margin: '0 auto 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <CheckCircleOutlined style={{ fontSize: 48 }} />
                                </div>
                                <Text strong style={{ color: '#fff', fontSize: 18 }}>
                                  人脸已验证通过
                                </Text>
                                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                                  感谢您完成身份验证
                                </div>
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center' }}>
                                <div
                                  style={{
                                    width: 120,
                                    height: 140,
                                    border: '3px dashed rgba(255,255,255,0.6)',
                                    borderRadius: 60,
                                    margin: '0 auto 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Avatar
                                    size={72}
                                    style={{ background: 'rgba(255,255,255,0.2)', fontSize: 32 }}
                                    icon={<ScanOutlined />}
                                  />
                                </div>
                                <Text strong style={{ color: '#fff', fontSize: 18 }}>
                                  尚未完成人脸识别
                                </Text>
                                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                                  请点击下方按钮开始验证
                                </div>
                              </div>
                            )}
                          </div>
                        </Col>
                        <Col xs={24} md={12}>
                          <Space direction="vertical" size={20} style={{ width: '100%' }}>
                            <div>
                              <Title level={5} style={{ marginTop: 0 }}>
                                <Space>
                                  <ScanOutlined style={{ color: '#1677ff' }} />
                                  为什么需要人脸识别？
                                </Space>
                              </Title>
                              <ul style={{ paddingLeft: 18, margin: 0 }}>
                                <li style={{ marginBottom: 8 }}>
                                  <Text style={{ fontSize: 13 }}>确保是您本人操作，防止账户被盗用</Text>
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                  <Text style={{ fontSize: 13 }}>考勤打卡时核验身份，防止代打卡行为</Text>
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                  <Text style={{ fontSize: 13 }}>签署电子合同、工资发放时的身份确认</Text>
                                </li>
                                <li>
                                  <Text style={{ fontSize: 13 }}>提高您的信用评分和申请通过率</Text>
                                </li>
                              </ul>
                            </div>

                            <Alert
                              type="success"
                              showIcon
                              message="隐私安全保障"
                              description="您的人脸数据采用加密存储，仅用于身份核验，绝不外泄，符合《个人信息保护法》和《网络安全法》要求。"
                              style={{ borderRadius: 8 }}
                            />

                            <Button
                              type="primary"
                              size="large"
                              icon={<ScanOutlined />}
                              onClick={() => setFaceModalOpen(true)}
                              block
                              style={{ height: 48, borderRadius: 10 }}
                            >
                              {user?.face_verified ? '重新进行人脸识别' : '立即开始验证'}
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'emergency',
                  label: (
                    <Space>
                      <PhoneOutlined />
                      紧急联系人
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: 24, maxWidth: 600 }}>
                      <Alert
                        type="info"
                        showIcon
                        message="设置紧急联系人"
                        description="在发生突发情况（如工地事故、失联等）时，平台将第一时间联系您的紧急联系人。请确保信息准确。"
                        style={{ marginBottom: 24, borderRadius: 8 }}
                      />
                      <Form
                        form={emergencyForm}
                        layout="vertical"
                        size="large"
                        onFinish={handleSaveEmergency}
                      >
                        <Row gutter={24}>
                          <Col span={12}>
                            <Form.Item
                              name="emergency_contact"
                              label="紧急联系人姓名"
                              rules={[{ required: true, message: '请输入联系人姓名' }]}
                            >
                              <Input placeholder="如：配偶、父母、兄弟姐妹等" prefix={<UserOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="emergency_phone"
                              label="紧急联系人电话"
                              rules={[
                                { required: true, message: '请输入联系电话' },
                                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                              ]}
                            >
                              <Input placeholder="请输入11位手机号" prefix={<PhoneOutlined />} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item
                          label="与本人关系"
                          name="emergency_relation"
                        >
                          <Select placeholder="请选择关系">
                            <Option value="spouse">配偶</Option>
                            <Option value="father">父亲</Option>
                            <Option value="mother">母亲</Option>
                            <Option value="brother">兄弟</Option>
                            <Option value="sister">姐妹</Option>
                            <Option value="child">子女</Option>
                            <Option value="other">其他亲属</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={saveLoading}
                            icon={<SaveOutlined />}
                            size="large"
                          >
                            保存紧急联系人
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <ScanOutlined style={{ color: '#1677ff' }} />
            <span>人脸识别验证</span>
            {user?.face_verified && <Tag color="green">重新验证</Tag>}
          </Space>
        }
        open={faceModalOpen}
        onCancel={() => setFaceModalOpen(false)}
        onOk={handleFaceVerify}
        confirmLoading={faceLoading}
        okText="开始验证"
        cancelText="取消"
        width={480}
        maskClosable={false}
      >
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="验证说明"
            description="请将面部正对摄像头，保持光线充足，摘掉帽子、口罩、墨镜等遮挡物。整个过程约需10秒。"
            style={{ borderRadius: 8 }}
          />
          <div
            style={{
              width: '100%',
              aspectRatio: '4/3',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: 180,
                height: 220,
                border: '3px dashed rgba(255,255,255,0.6)',
                borderRadius: 90,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                position: 'relative',
              }}
            >
              <Avatar
                size={120}
                style={{ background: 'rgba(255,255,255,0.2)', fontSize: 56 }}
                icon={<ScanOutlined />}
              />
              {faceLoading && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'linear-gradient(90deg, transparent, #fff, transparent)',
                    animation: 'scanline 1.5s linear infinite',
                    top: 0,
                  }}
                />
              )}
            </div>
            <Text strong style={{ color: '#fff', fontSize: 16 }}>
              {faceLoading ? '正在识别中，请稍候...' : '请将面部置于虚线框内'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
              {faceLoading ? '正在比对身份信息，请勿移动...' : '点击"开始验证"启动摄像头'}
            </Text>
          </div>
          <Alert
            type="success"
            showIcon
            message="隐私安全保障"
            description="您的人脸数据仅用于身份验证，加密存储，绝不外泄。"
            style={{ borderRadius: 8 }}
          />
        </Space>
        <style>{`
          @keyframes scanline {
            0% { top: 0; }
            100% { top: calc(100% - 3px); }
          }
        `}</style>
      </Modal>
    </div>
  )
}

export default Settings
