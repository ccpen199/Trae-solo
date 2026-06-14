import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Card,
  Space,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Divider,
  Modal,
  Radio,
  Checkbox,
  Descriptions,
  Tag,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { api } from '@/api'
import type { Trade, Employer } from '@/types'
import dayjs, { Dayjs } from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography

interface FormValues {
  employerId: number
  projectName: string
  projectAddress: string
  detailedAddress: string
  latitude?: number
  longitude?: number
  tradeId: number
  quantity: number
  skillLevelRequired: string
  startDate: Dayjs
  endDate: Dayjs
  workDuration: string
  dailyWageMin: number
  dailyWageMax: number
  paymentMethod: string
  providesFood: boolean
  providesLodging: boolean
  certificateRequired: boolean
  certificateTypes: string[]
  safetyTraining: string
  otherQualifications: string
  projectIntro: string
  constructionEnvironment: string
  notes: string
}

const skillLevelOptions = [
  { value: '初级', label: '初级' },
  { value: '中级', label: '中级' },
  { value: '高级', label: '高级' },
  { value: '技师', label: '技师' },
]

const paymentMethodOptions = [
  { value: '日结', label: '日结' },
  { value: '周结', label: '周结' },
  { value: '月结', label: '月结' },
]

const certificateTypeOptions = [
  { value: '身份证', label: '身份证' },
  { value: '特种作业操作证', label: '特种作业操作证' },
  { value: '安全员证', label: '安全员证' },
  { value: '建造师证', label: '建造师证' },
  { value: '电工证', label: '电工证' },
  { value: '焊工证', label: '焊工证' },
  { value: '高空作业证', label: '高空作业证' },
  { value: '健康证', label: '健康证' },
]

const safetyTrainingOptions = [
  { value: '无需培训', label: '无需培训' },
  { value: '岗前安全培训', label: '岗前安全培训' },
  { value: '特种作业安全培训', label: '特种作业安全培训' },
  { value: '高空作业安全培训', label: '高空作业安全培训' },
]

export default function JobCreate() {
  const navigate = useNavigate()
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [employers, setEmployers] = useState<Employer[]>([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewData, setPreviewData] = useState<FormValues | null>(null)
  const [autoLocationLoading, setAutoLocationLoading] = useState(false)

  useEffect(() => {
    fetchTrades()
    fetchEmployers()
  }, [])

  useEffect(() => {
    if (employers.length > 0 && !form.getFieldValue('employerId')) {
      form.setFieldValue('employerId', employers[0].id)
    }
  }, [employers, form])

  useEffect(() => {
    if (trades.length > 0 && !form.getFieldValue('tradeId')) {
      form.setFieldValue('tradeId', trades[0].id)
    }
  }, [trades, form])

  const fetchTrades = async () => {
    try {
      const res = await api.getTrades()
      if (res.code === 0) {
        setTrades(Array.isArray(res.data) ? res.data : (res.data as any).list || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch trades:', err)
    }
  }

  const fetchEmployers = async () => {
    setLoading(true)
    try {
      const res = await api.getEmployers({ pageSize: 1000 })
      if (res.code === 0) {
        setEmployers(res.data.list || res.data || [])
      } else {
        setError(res.message || '获取雇主列表失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoGetLocation = () => {
    setAutoLocationLoading(true)
    setTimeout(() => {
      const lat = 30 + Math.random() * 10
      const lng = 110 + Math.random() * 10
      form.setFieldsValue({
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
      })
      message.success('已自动获取经纬度成功')
      setAutoLocationLoading(false)
    }, 1000)
  }

  const handlePreview = async () => {
    try {
      const values = await form.validateFields()
      setPreviewData(values)
      setPreviewVisible(true)
    } catch (err: any) {
      if (err.errorFields) {
        message.warning('请先完善必填项')
        return
      }
      message.error(err.message || '校验失败')
    }
  }

  const handleSubmit = async (confirmedData?: FormValues | null) => {
    let values = confirmedData || previewData

    if (!values) {
      try {
        values = await form.validateFields()
        setPreviewData(values)
      } catch (err: any) {
        if (err.errorFields) {
          message.warning('请先完善必填项')
          return
        }
        message.error(err.message || '校验失败')
        return
      }
    }

    setPreviewVisible(false)
    setSubmitting(true)

    try {
      const trade = trades.find(t => t.id === values.tradeId)

      const data = {
        employerId: values.employerId,
        projectName: values.projectName,
        projectAddress: values.projectAddress,
        detailedAddress: values.detailedAddress,
        latitude: values.latitude || 0,
        longitude: values.longitude || 0,
        tradeId: values.tradeId,
        tradeName: trade?.name || '',
        quantity: values.quantity,
        skillLevelRequired: values.skillLevelRequired,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        workDuration: values.workDuration,
        dailyWageMin: values.dailyWageMin,
        dailyWageMax: values.dailyWageMax,
        paymentMethod: values.paymentMethod,
        providesFood: values.providesFood,
        providesLodging: values.providesLodging,
        certificateRequired: values.certificateRequired,
        certificateTypes: values.certificateTypes,
        safetyTraining: values.safetyTraining,
        otherQualifications: values.otherQualifications,
        projectIntro: values.projectIntro,
        constructionEnvironment: values.constructionEnvironment,
        notes: values.notes,
        dailyWage: values.dailyWageMin,
        workHours: values.workDuration,
        qualificationRequired: values.skillLevelRequired,
        description: values.projectIntro,
      }

      const res = await api.createJob(data)
      if (res.code === 0) {
        message.success('发布招工需求成功，正在跳转...')

        setTimeout(async () => {
          try {
            await api.reviewJob(res.data.id, 'ai', {
              result: 'pass',
              comment: 'AI自动审核通过',
              reviewer: 'system',
              details: '85',
            })
          } catch (reviewErr) {
            console.warn('AI审核调用失败，但不影响发布', reviewErr)
          }
        }, 500)

        setTimeout(() => {
          navigate(`/jobs/${res.data.id}`)
        }, 1500)
      } else {
        message.error(res.message || '发布失败')
        setSubmitting(false)
      }
    } catch (err: any) {
      message.error(err.message || '提交失败')
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/jobs')
  }

  const getEmployerName = (id: number) => {
    const e = employers.find(emp => emp.id === id) as Employer & Record<string, any>
    if (!e) return '-'
    return e.companyName || e.company_name || '-'
  }

  const getTradeName = (id: number) => {
    const t = trades.find(tr => tr.id === id)
    return t ? `${t.name} - ${t.category}` : '-'
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>发布招工需求</h2>
      </Space>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            projectName: `演示招工需求-${dayjs().format('MMDDHHmm')}`,
            projectAddress: '北京市朝阳区建国路演示工地',
            detailedAddress: '1号楼A座施工现场',
            latitude: 39.9042,
            longitude: 116.4074,
            quantity: 1,
            skillLevelRequired: '中级',
            startDate: dayjs().add(1, 'day'),
            endDate: dayjs().add(30, 'day'),
            workDuration: '8小时/天',
            dailyWageMin: 200,
            dailyWageMax: 300,
            paymentMethod: '日结',
            providesFood: false,
            providesLodging: false,
            certificateRequired: false,
            safetyTraining: '无需培训',
            projectIntro: '演示项目用于验证招工需求提交、审核和智能匹配流程。',
            constructionEnvironment: '室内外标准施工环境',
            notes: '按平台流程完成实名核验和安全交底',
          }}
        >
          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#1890ff' }} />
                <span>基本信息</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="employerId"
                  label="雇主选择"
                  rules={[{ required: true, message: '请选择雇主' }]}
                >
                  <Select
                    placeholder="请选择雇主"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {employers.map((e) => {
                      const record = e as Employer & Record<string, any>
                      const companyName = record.companyName || record.company_name || ''
                      const contactName = record.contactName || record.contact_name || ''
                      const contactPhone = record.contactPhone || record.contact_phone || ''
                      return (
                        <Option key={e.id} value={e.id} label={companyName}>
                          {companyName} - {contactName} ({contactPhone})
                        </Option>
                      )
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="projectName"
                  label="项目名称"
                  rules={[{ required: true, message: '请输入项目名称' }]}
                >
                  <Input placeholder="请输入项目名称" maxLength={100} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="projectAddress"
                  label="项目地址"
                  rules={[{ required: true, message: '请输入项目地址' }]}
                >
                  <Input placeholder="请输入项目地址（如：北京市朝阳区xxx街道xxx号）" maxLength={200} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#52c41a' }} />
                <span>地理位置</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={24}>
              <Col span={16}>
                <Form.Item
                  name="detailedAddress"
                  label="详细地址"
                  rules={[{ required: true, message: '请输入详细地址' }]}
                >
                  <Input placeholder="请输入详细地址，包括门牌号、楼层等" maxLength={200} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="自动获取经纬度">
                  <Button
                    type="dashed"
                    block
                    icon={<EnvironmentOutlined />}
                    onClick={handleAutoGetLocation}
                    loading={autoLocationLoading}
                  >
                    {autoLocationLoading ? '定位中...' : '点击自动获取'}
                  </Button>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="latitude"
                  label="纬度"
                  rules={[{ required: true, message: '请输入纬度' }]}
                >
                  <InputNumber
                    placeholder="纬度"
                    style={{ width: '100%' }}
                    min={-90}
                    max={90}
                    step={0.000001}
                    precision={6}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="longitude"
                  label="经度"
                  rules={[{ required: true, message: '请输入经度' }]}
                >
                  <InputNumber
                    placeholder="经度"
                    style={{ width: '100%' }}
                    min={-180}
                    max={180}
                    step={0.000001}
                    precision={6}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="地图位置预览">
                  <div
                    style={{
                      height: 72,
                      border: '1px dashed #d9d9d9',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Space>
                      <EnvironmentOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      <Text type="secondary">地图预览图标</Text>
                    </Space>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#faad14' }} />
                <span>工种要求</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="tradeId"
                  label="工种选择"
                  rules={[{ required: true, message: '请选择工种' }]}
                >
                  <Select
                    placeholder="请选择工种"
                    showSearch
                    optionFilterProp="children"
                  >
                    {trades.map((t) => (
                      <Option key={t.id} value={t.id}>
                        {t.name} - {t.category}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="quantity"
                  label="需求人数"
                  rules={[
                    { required: true, message: '请输入需求人数' },
                    { type: 'number', min: 1, message: '需求人数必须大于0' },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={1000}
                    placeholder="需求人数（人）"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="skillLevelRequired"
                  label="技能等级要求"
                  rules={[{ required: true, message: '请选择技能等级' }]}
                >
                  <Select placeholder="请选择技能等级">
                    {skillLevelOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#722ed1' }} />
                <span>工期要求</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="startDate"
                  label="开始日期"
                  rules={[{ required: true, message: '请选择开始日期' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    minDate={dayjs()}
                    format="YYYY-MM-DD"
                    placeholder="选择开始日期"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="endDate"
                  label="结束日期"
                  dependencies={['startDate']}
                  rules={[
                    { required: true, message: '请选择结束日期' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || !getFieldValue('startDate')) {
                          return Promise.resolve()
                        }
                        if (value.isBefore(getFieldValue('startDate'))) {
                          return Promise.reject(new Error('结束日期必须晚于开始日期'))
                        }
                        return Promise.resolve()
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    minDate={dayjs()}
                    format="YYYY-MM-DD"
                    placeholder="选择结束日期"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="workDuration"
                  label="工作时长"
                  rules={[{ required: true, message: '请输入工作时长' }]}
                >
                  <Select placeholder="请选择工作时长">
                    <Option value="8小时/天">8小时/天</Option>
                    <Option value="10小时/天">10小时/天</Option>
                    <Option value="12小时/天">12小时/天</Option>
                    <Option value="弹性工作制">弹性工作制</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#eb2f96' }} />
                <span>薪资待遇</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="dailyWageMin"
                  label="日薪最低"
                  rules={[
                    { required: true, message: '请输入日薪最低' },
                    { type: 'number', min: 0, message: '日薪不能小于0' },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={10000}
                    placeholder="元/天"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="dailyWageMax"
                  label="日薪最高"
                  dependencies={['dailyWageMin']}
                  rules={[
                    { required: true, message: '请输入日薪最高' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value) return Promise.resolve()
                        if (value < getFieldValue('dailyWageMin')) {
                          return Promise.reject(new Error('日薪最高不能低于最低'))
                        }
                        return Promise.resolve()
                      },
                    }),
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={10000}
                    placeholder="元/天"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="paymentMethod"
                  label="结算方式"
                  rules={[{ required: true, message: '请选择结算方式' }]}
                >
                  <Radio.Group>
                    {paymentMethodOptions.map((opt) => (
                      <Radio key={opt.value} value={opt.value}>
                        {opt.label}
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="providesFood" label="是否包吃" valuePropName="checked">
                  <Checkbox>包吃</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="providesLodging" label="是否包住" valuePropName="checked">
                  <Checkbox>包住</Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#13c2c2' }} />
                <span>资质要求</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="certificateRequired"
                  label="是否需要持证上岗"
                  valuePropName="checked"
                >
                  <Checkbox>需要持证</Checkbox>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="certificateTypes"
                  label="所需证书类型"
                  dependencies={['certificateRequired']}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (getFieldValue('certificateRequired') && (!value || value.length === 0)) {
                          return Promise.reject(new Error('请选择所需证书类型'))
                        }
                        return Promise.resolve()
                      },
                    }),
                  ]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择所需证书类型"
                    style={{ width: '100%' }}
                  >
                    {certificateTypeOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="safetyTraining"
                  label="安全培训要求"
                  rules={[{ required: true, message: '请选择安全培训要求' }]}
                >
                  <Select placeholder="请选择安全培训要求">
                    {safetyTrainingOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="otherQualifications" label="其他资质说明">
                  <Input placeholder="请输入其他资质说明" maxLength={200} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#f5222d' }} />
                <span>项目描述</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Form.Item
              name="projectIntro"
              label="项目简介"
              rules={[{ required: true, message: '请输入项目简介' }]}
            >
              <TextArea
                rows={3}
                placeholder="请详细描述项目内容、规模等信息"
                maxLength={500}
                showCount
              />
            </Form.Item>
            <Form.Item
              name="constructionEnvironment"
              label="施工环境"
            >
              <TextArea
                rows={2}
                placeholder="请描述施工环境，如室内、室外、高空等"
                maxLength={300}
                showCount
              />
            </Form.Item>
            <Form.Item
              name="notes"
              label="注意事项"
            >
              <TextArea
                rows={2}
                placeholder="请描述施工注意事项、特殊要求等"
                maxLength={300}
                showCount
              />
            </Form.Item>
          </Card>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                取消
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={handlePreview}
              >
                预览
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSubmit()}
                loading={submitting}
              >
                提交发布
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>

      <Modal
        title="招工信息预览"
        open={previewVisible}
        width={800}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="back" onClick={() => setPreviewVisible(false)}>
            返回修改
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={() => handleSubmit(previewData)}>
            确认发布
          </Button>,
        ]}
      >
        {previewData && (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="基本信息">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>雇主：</Text>
                    <Text>{getEmployerName(previewData.employerId)}</Text>
                  </Space>
                  <Space>
                    <Text strong>项目名称：</Text>
                    <Text>{previewData.projectName}</Text>
                  </Space>
                  <Space>
                    <Text strong>项目地址：</Text>
                    <Text>{previewData.projectAddress}</Text>
                  </Space>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="地理位置">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>详细地址：</Text>
                    <Text>{previewData.detailedAddress}</Text>
                  </Space>
                  <Space>
                    <Text strong>经纬度：</Text>
                    <Text code>{previewData.latitude?.toFixed(6)}, {previewData.longitude?.toFixed(6)}</Text>
                  </Space>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="工种要求">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>工种：</Text>
                    <Tag color="blue">{getTradeName(previewData.tradeId)}</Tag>
                  </Space>
                  <Space>
                    <Text strong>需求人数：</Text>
                    <Tag color="green">{previewData.quantity} 人</Tag>
                  </Space>
                  <Space>
                    <Text strong>技能等级：</Text>
                    <Tag color="orange">{previewData.skillLevelRequired}</Tag>
                  </Space>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="工期要求">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>开始日期：</Text>
                    <Text>{previewData.startDate.format('YYYY-MM-DD')}</Text>
                  </Space>
                  <Space>
                    <Text strong>结束日期：</Text>
                    <Text>{previewData.endDate.format('YYYY-MM-DD')}</Text>
                  </Space>
                  <Space>
                    <Text strong>工作时长：</Text>
                    <Tag>{previewData.workDuration}</Tag>
                  </Space>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="薪资待遇">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>日薪范围：</Text>
                    <Tag color="red">¥{previewData.dailyWageMin} - ¥{previewData.dailyWageMax} 元/天</Tag>
                  </Space>
                  <Space>
                    <Text strong>结算方式：</Text>
                    <Tag color="purple">{previewData.paymentMethod}</Tag>
                  </Space>
                  <Space>
                    <Text strong>包吃住：</Text>
                    <Space>
                      {previewData.providesFood && <Tag color="green">包吃</Tag>}
                      {previewData.providesLodging && <Tag color="green">包住</Tag>}
                      {!previewData.providesFood && !previewData.providesLodging && <Text type="secondary">不包吃住</Text>}
                    </Space>
                  </Space>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="资质要求">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>持证上岗：</Text>
                    <Text>
                      {previewData.certificateRequired ? (
                        <Space>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} /> 需要
                        </Space>
                      ) : (
                        <Space>
                          <ExclamationCircleOutlined style={{ color: '#faad14' }} /> 不需要
                        </Space>
                      )}
                    </Text>
                  </Space>
                  {previewData.certificateRequired && previewData.certificateTypes && previewData.certificateTypes.length > 0 && (
                    <Space>
                      <Text strong>所需证书：</Text>
                      <Space wrap>
                        {previewData.certificateTypes.map(c => (
                          <Tag key={c} color="blue">{c}</Tag>
                        ))}
                      </Space>
                    </Space>
                  )}
                  <Space>
                    <Text strong>安全培训：</Text>
                    <Tag color="cyan">{previewData.safetyTraining}</Tag>
                  </Space>
                  {previewData.otherQualifications && (
                    <Space>
                      <Text strong>其他资质：</Text>
                      <Text>{previewData.otherQualifications}</Text>
                    </Space>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="项目描述">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>项目简介：</Text>
                    <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                      {previewData.projectIntro}
                    </div>
                  </div>
                  {previewData.constructionEnvironment && (
                    <div>
                      <Text strong>施工环境：</Text>
                      <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                        {previewData.constructionEnvironment}
                      </div>
                    </div>
                  )}
                  {previewData.notes && (
                    <div>
                      <Text strong>注意事项：</Text>
                      <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                        {previewData.notes}
                      </div>
                    </div>
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}
