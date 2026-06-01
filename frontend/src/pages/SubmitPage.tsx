import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Select,
  Upload,
  Button,
  Card,
  Row,
  Col,
  message,
  Typography,
} from 'antd'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import type { ProblemType, Severity, ConsoleError } from '@/types'
import { submitFeedback } from '@/api'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select
const { Dragger } = Upload

const typeOptions: { label: string; value: ProblemType }[] = [
  { label: '功能缺陷', value: 'bug' },
  { label: '功能建议', value: 'feature' },
  { label: '性能问题', value: 'performance' },
  { label: '界面问题', value: 'ui' },
  { label: '其他', value: 'other' },
]

const severityOptions: { label: string; value: Severity }[] = [
  { label: '致命', value: 'critical' },
  { label: '严重', value: 'major' },
  { label: '一般', value: 'minor' },
  { label: '轻微', value: 'trivial' },
]

const moduleOptions = [
  '用户认证',
  '用户模块',
  '订单模块',
  '支付模块',
  '商品模块',
  '搜索模块',
  '后台管理',
  '其他',
]

const SubmitPage = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [collectedInfo, setCollectedInfo] = useState<{
    browser_info: string
    os_info: string
    screen_resolution: string
    user_agent: string
    page_url: string
    console_errors: ConsoleError[]
  } | null>(null)

  useEffect(() => {
    const collectInfo = () => {
      const ua = navigator.userAgent
      const getBrowser = () => {
        if (ua.includes('Chrome') && !ua.includes('Edg')) return `Chrome ${ua.match(/Chrome\/(\d+)/)?.[1] || ''}`
        if (ua.includes('Firefox')) return `Firefox ${ua.match(/Firefox\/(\d+)/)?.[1] || ''}`
        if (ua.includes('Safari') && !ua.includes('Chrome')) return `Safari ${ua.match(/Version\/(\d+)/)?.[1] || ''}`
        if (ua.includes('Edg')) return `Edge ${ua.match(/Edg\/(\d+)/)?.[1] || ''}`
        if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
        return 'Unknown'
      }
      const getOS = () => {
        if (ua.includes('Windows NT 10')) return 'Windows 10/11'
        if (ua.includes('Windows')) return 'Windows'
        if (ua.includes('Mac OS X')) return 'macOS'
        if (ua.includes('Linux')) return 'Linux'
        if (ua.includes('Android')) return 'Android'
        if (ua.includes('iOS')) return 'iOS'
        return 'Unknown'
      }
      const errors: ConsoleError[] = []
      const originalError = console.error
      console.error = (...args: unknown[]) => {
        errors.push({
          message: args.map(String).join(' '),
          timestamp: new Date().toISOString(),
        })
        originalError.apply(console, args as Parameters<typeof originalError>)
      }
      setTimeout(() => {
        console.error = originalError
      }, 100)

      setCollectedInfo({
        user_agent: ua,
        browser_info: getBrowser(),
        os_info: getOS(),
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        page_url: window.location.href,
        console_errors: errors,
      })
    }
    collectInfo()
  }, [])

  const uploadProps: UploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false,
    accept: 'image/*',
    multiple: true,
    listType: 'picture-card',
  }

  const onFinish = async (values: unknown) => {
    if (!collectedInfo) {
      message.error('设备信息收集失败，请刷新页面重试')
      return
    }
    setLoading(true)
    try {
      const formData = values as {
        title: string
        description: string
        problem_type: ProblemType
        severity: Severity
        module: string
        version: string
        contact: string
        reproduce_steps: string
      }
      const files = fileList
        .filter((f) => f.originFileObj)
        .map((f) => f.originFileObj as File)
      await submitFeedback(
        {
          title: formData.title,
          description: formData.description,
          problem_type: formData.problem_type,
          severity: formData.severity,
          module: formData.module,
          version: formData.version,
          contact: formData.contact,
          reproduce_steps: formData.reproduce_steps || '',
          ...collectedInfo,
          source_channel: 'web',
          affected_users_count: 1,
        },
        files
      )
      message.success('反馈提交成功！')
      navigate('/list')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '提交失败')
    } finally {
      setLoading(false)
    }
  }

  const normFile = (e: unknown) => {
    if (Array.isArray(e)) return e
    return (e as { fileList: UploadFile[] })?.fileList
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>提交问题反馈</Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            problem_type: 'bug',
            severity: 'minor',
            module: '用户认证',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请简要描述问题" maxLength={100} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contact"
                label="联系方式"
                rules={[{ required: true, message: '请输入联系方式' }]}
              >
                <Input placeholder="手机号或邮箱，方便我们联系您" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="problem_type"
                label="问题类型"
                rules={[{ required: true, message: '请选择问题类型' }]}
              >
                <Select>
                  {typeOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="severity"
                label="严重级别"
                rules={[{ required: true, message: '请选择严重级别' }]}
              >
                <Select>
                  {severityOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="module"
                label="产品模块"
                rules={[{ required: true, message: '请选择产品模块' }]}
              >
                <Select>
                  {moduleOptions.map((opt) => (
                    <Option key={opt} value={opt}>
                      {opt}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本号"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="如：v1.2.3 或 1.0.0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="问题描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述您遇到的问题..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
          <Form.Item
            name="reproduce_steps"
            label="复现步骤"
          >
            <TextArea
              rows={3}
              placeholder="请描述复现问题的步骤（可选）"
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item
            name="upload"
            label="上传截图"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
              <p className="ant-upload-hint">
                支持 JPG、PNG、GIF 格式，可上传多张
              </p>
            </Dragger>
          </Form.Item>
          {collectedInfo && (
            <Card size="small" title="自动收集的设备信息" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div><strong>浏览器：</strong>{collectedInfo.browser_info}</div>
                </Col>
                <Col span={6}>
                  <div><strong>操作系统：</strong>{collectedInfo.os_info}</div>
                </Col>
                <Col span={6}>
                  <div><strong>分辨率：</strong>{collectedInfo.screen_resolution}</div>
                </Col>
                <Col span={6}>
                  <div><strong>页面URL：</strong>{collectedInfo.page_url.slice(0, 30)}...</div>
                </Col>
              </Row>
            </Card>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              <UploadOutlined /> 提交反馈
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default SubmitPage
