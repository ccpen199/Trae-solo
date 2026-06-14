import { useState } from 'react'
import { Card, Row, Col, Button, Form, Input, Avatar, Divider, Upload, message } from 'antd'
import {
  UserOutlined,
  CameraOutlined,
  EditOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'

const Profile = () => {
  const { user, updateUserInfo } = useAuthStore()
  const [form] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar)

  const handleEdit = () => {
    form.setFieldsValue({
      name: user?.name,
      phone: user?.phone,
      email: user?.email,
    })
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      updateUserInfo({
        name: values.name,
        email: values.email,
        avatar: avatarUrl,
      })
      message.success('个人信息更新成功')
      setEditing(false)
    } catch {
      // 表单验证失败
    }
  }

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      setAvatarUrl(URL.createObjectURL(info.file.originFileObj))
      message.success('头像上传成功')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">个人中心</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card className="text-center">
            <div className="mb-4">
              <div className="relative inline-block">
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  src={avatarUrl}
                  className="bg-gradient-to-r from-[#1677ff] to-[#52c41a]"
                />
                <Upload
                  showUploadList={false}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute bottom-0 right-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1677ff] flex items-center justify-center cursor-pointer border-2 border-white">
                    <CameraOutlined className="text-white text-sm" />
                  </div>
                </Upload>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-1">
              {user?.name || user?.phone}
            </h3>
            <p className="text-gray-500 mb-4">{user?.phone}</p>
            <Divider />
            <div className="text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">用户ID</span>
                <span className="font-mono">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">用户角色</span>
                <span>{user?.role === 'admin' ? '管理员' : '普通用户'}</span>
              </div>
            </div>
          </Card>

          <Card title="数据统计" className="mt-6">
            <Row gutter={[8, 16]}>
              <Col span={12} className="text-center border-r">
                <div className="text-2xl font-bold text-[#1677ff]">3</div>
                <div className="text-gray-500 text-sm">体检预约</div>
              </Col>
              <Col span={12} className="text-center">
                <div className="text-2xl font-bold text-[#52c41a]">2</div>
                <div className="text-gray-500 text-sm">保险保单</div>
              </Col>
              <Col span={12} className="text-center border-r border-t pt-4">
                <div className="text-2xl font-bold text-[#fa8c16]">3</div>
                <div className="text-gray-500 text-sm">健康报告</div>
              </Col>
              <Col span={12} className="text-center border-t pt-4">
                <div className="text-2xl font-bold text-[#f5222d]">2</div>
                <div className="text-gray-500 text-sm">风险预警</div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span>基本信息</span>
                {!editing ? (
                  <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                    编辑
                  </Button>
                ) : (
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                    保存
                  </Button>
                )}
              </div>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name: user?.name,
                phone: user?.phone,
                email: user?.email,
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入姓名" disabled={!editing} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                    ]}
                  >
                    <Input placeholder="请输入手机号" disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { type: 'email', message: '请输入有效的邮箱' },
                    ]}
                  >
                    <Input placeholder="请输入邮箱" disabled={!editing} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="性别">
                    <Input placeholder="未设置" disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="出生日期">
                    <Input placeholder="未设置" disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="身份证号">
                    <Input placeholder="未设置" disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card title="安全设置" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold">登录密码</h4>
                  <p className="text-gray-500 text-sm">修改您的登录密码</p>
                </div>
                <Button>修改密码</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold">手机号码</h4>
                  <p className="text-gray-500 text-sm">当前绑定手机号：{user?.phone}</p>
                </div>
                <Button>更换手机号</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold">实名认证</h4>
                  <p className="text-gray-500 text-sm">完成实名认证，享受更多服务</p>
                </div>
                <Button type="primary">去认证</Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Profile
