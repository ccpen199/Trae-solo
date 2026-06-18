import { useState } from 'react'
import { NavBar, Form, Input, Button, Space, Tabs, Toast, CheckList } from 'antd-mobile'
import { UserOutline, LockOutline, PhonebookOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import './index.css'

function Login() {
  const [activeTab, setActiveTab] = useState('login')
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      const values = await form.validateFields()
      console.log('登录信息:', values)
      Toast.show({
        icon: 'success',
        content: '登录成功'
      })
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (error) {
      console.log('验证失败:', error)
    }
  }

  const handleRegister = async () => {
    try {
      const values = await form.validateFields()
      console.log('注册信息:', values)
      Toast.show({
        icon: 'success',
        content: '注册成功'
      })
      setTimeout(() => {
        setActiveTab('login')
      }, 1000)
    } catch (error) {
      console.log('验证失败:', error)
    }
  }

  return (
    <div className="login-page">
      <NavBar>登录 / 注册</NavBar>

      <div className="login-header">
        <div className="logo">⚡</div>
        <h1>新能源充电平台</h1>
        <p>开启您的绿色出行之旅</p>
      </div>

      <div className="login-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
        >
          <Tabs.Tab title="登录" key="login" />
          <Tabs.Tab title="注册" key="register" />
        </Tabs>
      </div>

      <div className="login-form">
        <Form form={form} layout="horizontal">
          {activeTab === 'login' ? (
            <Space direction="vertical" block>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, message: '请输入手机号' }]}
              >
                <Input placeholder="请输入手机号" clearable />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input type="password" placeholder="请输入密码" clearable />
              </Form.Item>

              <div className="form-actions">
                <span className="forgot-password">忘记密码？</span>
              </div>

              <Button block color="primary" size="large" onClick={handleLogin}>
                登录
              </Button>

              <div className="other-login">
                <span>其他登录方式</span>
                <div className="login-icons">
                  <div className="login-icon wechat">微</div>
                  <div className="login-icon alipay">支</div>
                </div>
              </div>
            </Space>
          ) : (
            <Space direction="vertical" block>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, message: '请输入手机号' }]}
              >
                <Input placeholder="请输入手机号" clearable />
              </Form.Item>

              <Form.Item
                name="code"
                label="验证码"
                rules={[{ required: true, message: '请输入验证码' }]}
                extra={<Button size="mini" color="primary">获取验证码</Button>}
              >
                <Input placeholder="请输入验证码" clearable />
              </Form.Item>

              <Form.Item
                name="password"
                label="设置密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input type="password" placeholder="请设置6-16位密码" clearable />
              </Form.Item>

              <Form.Item
                name="inviteCode"
                label="邀请码"
              >
                <Input placeholder="请输入邀请码（选填）" clearable />
              </Form.Item>

              <div className="agreement">
                <CheckList defaultValue={['agree']}>
                  <CheckList.Item value="agree">
                    我已阅读并同意<span className="link">《用户协议》</span>和<span className="link">《隐私政策》</span>
                  </CheckList.Item>
                </CheckList>
              </div>

              <Button block color="primary" size="large" onClick={handleRegister}>
                注册
              </Button>
            </Space>
          )}
        </Form>
      </div>
    </div>
  )
}

export default Login
