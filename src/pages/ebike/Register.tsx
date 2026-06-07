import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Steps,
  Form,
  Input,
  Button,
  Card,
  message,
  Upload,
  DatePicker,
  Select,
  Space,
  Row,
  Col,
  Descriptions,
  UploadProps,
} from 'antd'
import {
  ArrowLeftOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import { createEbike, verifyFrameNumber } from '@/api/modules/ebike'
import { uploadImage } from '@/api/modules/upload'

const { Step } = Steps
const { Dragger } = Upload
const { Option } = Select
const { TextArea } = Input

interface FormData {
  name: string
  idCard: string
  phone: string
  verifyCode: string
  frameNumber: string
  motorNumber: string
  brand: string
  model: string
  color: string
  purchaseDate: dayjs.Dayjs
  invoiceUrl: string
  idCardFrontUrl: string
  idCardBackUrl: string
  vehiclePhotoUrl: string
}

const brands = [
  '雅迪', '爱玛', '小牛', '台铃', '绿源', '新日', '立马', '小刀',
  '九号', '比德文', '速珂', '其他'
]

const colors = [
  '黑色', '白色', '红色', '蓝色', '绿色', '黄色', '灰色', '银色',
  '橙色', '紫色', '棕色', '其他'
]

export default function EbikeRegister() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<FormData>()
  const [formData, setFormData] = useState<Partial<FormData>>({})
  const [countdown, setCountdown] = useState(0)
  const [invoiceFileList, setInvoiceFileList] = useState<UploadFile[]>([])
  const [idCardFrontFileList, setIdCardFrontFileList] = useState<UploadFile[]>([])
  const [idCardBackFileList, setIdCardBackFileList] = useState<UploadFile[]>([])
  const [vehiclePhotoFileList, setVehiclePhotoFileList] = useState<UploadFile[]>([])

  const handleSendCode = () => {
    const phone = form.getFieldValue('phone')
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入正确的手机号')
      return
    }
    message.success('验证码已发送')
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleUpload = async (file: File): Promise<string> => {
    const response = await uploadImage(file)
    return response.url
  }

  const uploadProps: (
    setFileList: (files: UploadFile[]) => void,
    fileList: UploadFile[]
  ) => UploadProps = (setFileList, fileList) => ({
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: async (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件')
        return Upload.LIST_IGNORE
      }
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('图片大小不能超过 5MB')
        return Upload.LIST_IGNORE
      }
      try {
        const url = await handleUpload(file)
        setFileList([{
          uid: file.uid,
          name: file.name,
          status: 'done',
          url,
        }])
        return false
      } catch {
        message.error('上传失败')
        return false
      }
    },
    onChange: (info) => {
      setFileList(info.fileList)
    },
    onRemove: () => {
      setFileList([])
    },
  })

  const next = async () => {
    try {
      const values = await form.validateFields()
      
      if (current === 0) {
        setLoading(true)
        try {
          const valid = await verifyFrameNumber(values.frameNumber)
          if (!valid) {
            message.error('车架号已被登记')
            return
          }
        } catch {
          message.error('车架号验证失败')
          return
        } finally {
          setLoading(false)
        }
      }
      
      setFormData({ ...formData, ...values })
      setCurrent(current + 1)
    } catch {
      message.warning('请完善表单信息')
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await createEbike({
        frameNumber: formData.frameNumber || '',
        motorNumber: formData.motorNumber || '',
        brand: formData.brand || '',
        model: formData.model || '',
        color: formData.color || '',
        purchaseDate: formData.purchaseDate?.format('YYYY-MM-DD') || '',
      })
      message.success('登记申请提交成功')
      navigate('/ebike/list')
    } catch (error) {
      message.error('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: '身份核验',
      content: (
        <Form form={form} layout="vertical" initialValues={formData}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确' },
                ]}
              >
                <Input placeholder="请输入18位身份证号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                ]}
              >
                <Input placeholder="请输入手机号" maxLength={11} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="verifyCode"
                label="验证码"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Input placeholder="6位验证码" maxLength={6} />
                  <Button onClick={handleSendCode} disabled={countdown > 0}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Button>
                </Space.Compact>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      ),
    },
    {
      title: '车辆信息',
      content: (
        <Form form={form} layout="vertical" initialValues={formData}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="frameNumber"
                label="车架号"
                rules={[
                  { required: true, message: '请输入车架号' },
                  { min: 15, max: 20, message: '车架号长度应在15-20位之间' },
                ]}
              >
                <Input placeholder="请输入车架号（15-20位）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="motorNumber"
                label="电机号"
                rules={[{ required: true, message: '请输入电机号' }]}
              >
                <Input placeholder="请输入电机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="brand"
                label="品牌"
                rules={[{ required: true, message: '请选择品牌' }]}
              >
                <Select placeholder="请选择品牌" showSearch>
                  {brands.map((brand) => (
                    <Option key={brand} value={brand}>
                      {brand}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="model"
                label="型号"
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <Input placeholder="请输入型号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="color"
                label="颜色"
                rules={[{ required: true, message: '请选择颜色' }]}
              >
                <Select placeholder="请选择颜色">
                  {colors.map((color) => (
                    <Option key={color} value={color}>
                      {color}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="purchaseDate"
            label="购买日期"
            rules={[{ required: true, message: '请选择购买日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择购买日期" />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: '材料上传',
      content: (
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="购车发票" required>
              <Dragger
                {...uploadProps(setInvoiceFileList, invoiceFileList)}
                accept="image/*"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint">支持 JPG、PNG 格式，大小不超过 5MB</p>
              </Dragger>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="身份证正面" required>
              <Dragger
                {...uploadProps(setIdCardFrontFileList, idCardFrontFileList)}
                accept="image/*"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint">支持 JPG、PNG 格式，大小不超过 5MB</p>
              </Dragger>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="身份证反面" required>
              <Dragger
                {...uploadProps(setIdCardBackFileList, idCardBackFileList)}
                accept="image/*"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint">支持 JPG、PNG 格式，大小不超过 5MB</p>
              </Dragger>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="车辆照片" required>
              <Dragger
                {...uploadProps(setVehiclePhotoFileList, vehiclePhotoFileList)}
                accept="image/*"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint">支持 JPG、PNG 格式，大小不超过 5MB</p>
              </Dragger>
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      title: '确认提交',
      content: (
        <div>
          <Card title="身份信息" size="small" className="mb-4">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="姓名">{formData.name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{formData.phone}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{formData.idCard}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="车辆信息" size="small" className="mb-4">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="车架号">{formData.frameNumber}</Descriptions.Item>
              <Descriptions.Item label="电机号">{formData.motorNumber}</Descriptions.Item>
              <Descriptions.Item label="品牌">{formData.brand}</Descriptions.Item>
              <Descriptions.Item label="型号">{formData.model}</Descriptions.Item>
              <Descriptions.Item label="颜色">{formData.color}</Descriptions.Item>
              <Descriptions.Item label="购买日期">
                {formData.purchaseDate?.format('YYYY-MM-DD')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="上传材料" size="small">
            <Row gutter={16}>
              <Col span={6}>
                {invoiceFileList[0]?.url && (
                  <img src={invoiceFileList[0].url} alt="购车发票" className="w-full rounded" />
                )}
                <p className="text-center text-sm text-gray-500 mt-2">购车发票</p>
              </Col>
              <Col span={6}>
                {idCardFrontFileList[0]?.url && (
                  <img src={idCardFrontFileList[0].url} alt="身份证正面" className="w-full rounded" />
                )}
                <p className="text-center text-sm text-gray-500 mt-2">身份证正面</p>
              </Col>
              <Col span={6}>
                {idCardBackFileList[0]?.url && (
                  <img src={idCardBackFileList[0].url} alt="身份证反面" className="w-full rounded" />
                )}
                <p className="text-center text-sm text-gray-500 mt-2">身份证反面</p>
              </Col>
              <Col span={6}>
                {vehiclePhotoFileList[0]?.url && (
                  <img src={vehiclePhotoFileList[0].url} alt="车辆照片" className="w-full rounded" />
                )}
                <p className="text-center text-sm text-gray-500 mt-2">车辆照片</p>
              </Col>
            </Row>
          </Card>
          <div className="mt-4 p-3 bg-blue-50 rounded text-blue-700 text-sm">
            <CheckCircleOutlined className="mr-2" />
            请确认以上信息准确无误，提交后将进入审核流程
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/ebike/list')}
        >
          返回列表
        </Button>
      </div>
      <Card
        title={
          <div className="flex items-center gap-2">
            <ThunderboltOutlined className="text-[#722ED1]" />
            <span>电动车登记申请</span>
          </div>
        }
      >
        <Steps current={current} className="mb-8">
          {steps.map((step) => (
            <Step key={step.title} title={step.title} />
          ))}
        </Steps>

        <div className="min-h-[400px]">
          {steps[current].content}
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button onClick={prev} disabled={current === 0}>
            上一步
          </Button>
          <Space>
            {current < steps.length - 1 ? (
              <Button type="primary" onClick={next} loading={loading}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                提交申请
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  )
}
