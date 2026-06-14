import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Tag,
  Progress,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Spin,
  Alert,
  Row,
  Col,
  DatePicker,
  Upload,
  List,
  Space,
  Divider,
  Card,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { api } from '@/api'
import type { Worker, Trade } from '@/types'

const { Option } = Select
const { RangePicker } = DatePicker

interface WorkerListItem extends Omit<Worker, 'tradeIds' | 'healthStatus' | 'idCard' | 'performanceScore'> {
  trade_ids: number[]
  health_status: 'green' | 'yellow' | 'red'
  id_card: string
  performance_score: number
  certificate_count: number
  training_count: number
  review_count: number
}

interface SkillCertificateForm {
  certificate_type: string
  certificate_number: string
  issuing_authority: string
  issue_date: Dayjs | null
  expiry_date: Dayjs | null
  ocr_result: string
  verified: boolean
}

interface SafetyTrainingForm {
  training_name: string
  training_date: Dayjs | null
  training_hours: number
  exam_score: number
  passed: boolean
}

export default function Workers() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workers, setWorkers] = useState<WorkerListItem[]>([])
  const [total, setTotal] = useState(0)
  const [trades, setTrades] = useState<Trade[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [tradeId, setTradeId] = useState<number | null>(null)
  const [healthStatus, setHealthStatus] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [healthAlertVisible, setHealthAlertVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTrades()
  }, [])

  useEffect(() => {
    fetchWorkers()
  }, [page, tradeId, healthStatus, keyword])

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

  const fetchWorkers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, pageSize }
      if (tradeId) params.tradeId = tradeId
      if (healthStatus) params.healthStatus = healthStatus
      if (keyword) params.keyword = keyword

      const res = await api.getWorkers(params)
      if (res.code === 0) {
        setWorkers(res.data.list)
        setTotal(res.data.total)
      } else {
        setError(res.message || '获取工人列表失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handleTradeChange = (value: number | null) => {
    setTradeId(value)
    setPage(1)
  }

  const handleHealthChange = (value: string | null) => {
    setHealthStatus(value)
    setPage(1)
  }

  const handleAdd = () => {
    form.resetFields()
    form.setFieldsValue({
      health_status: 'green',
      nucleic_acid_status: 'untested',
      vaccination_status: 'unvaccinated',
      skill_certificates: [{
        certificate_type: '安全员证',
        certificate_number: '待录入',
        issuing_authority: '住建部门培训中心',
        issue_date: dayjs(),
        expiry_date: dayjs().add(1, 'year'),
        ocr_result: '待上传',
        verified: false,
      }],
      safety_trainings: [{
        training_name: '岗前安全生产培训',
        training_date: dayjs(),
        training_hours: 8,
        exam_score: 90,
        passed: true,
      }],
    })
    setHealthAlertVisible(false)
    setModalVisible(true)
  }

  const handleHealthStatusChange = (value: string) => {
    setHealthAlertVisible(value === 'red')
  }

  const transformFormData = (values: any) => {
    const transformDate = (date: Dayjs | null) => date ? date.format('YYYY-MM-DD') : ''

    const skillCertificates = (values.skill_certificates || []).map((cert: SkillCertificateForm) => ({
      certificateType: cert.certificate_type,
      certificateNumber: cert.certificate_number,
      issuingAuthority: cert.issuing_authority,
      issueDate: transformDate(cert.issue_date),
      expiryDate: transformDate(cert.expiry_date),
      ocrResult: cert.ocr_result || '',
      verified: !!cert.verified,
    }))

    const safetyTrainings = (values.safety_trainings || []).map((training: SafetyTrainingForm) => ({
      trainingName: training.training_name,
      trainingDate: transformDate(training.training_date),
      trainingHours: training.training_hours || 0,
      examScore: training.exam_score || 0,
      passed: !!training.passed,
    }))

    return {
      idCard: values.id_card,
      name: values.name,
      gender: values.gender,
      age: values.age,
      phone: values.phone,
      address: values.address || '',
      latitude: 0,
      longitude: 0,
      tradeIds: values.trade_ids || [],
      healthStatus: values.health_status,
      healthCodeSource: values.health_code_source,
      healthCodeUpdatedAt: transformDate(values.health_code_updated_at),
      nucleicAcidStatus: values.nucleic_acid_status,
      vaccinationStatus: values.vaccination_status,
      skillCertificates,
      safetyTrainings,
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (values.health_status === 'red') {
        Modal.confirm({
          title: '健康风险确认',
          icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
          content: (
            <div>
              <p>该工人健康码为<strong style={{ color: '#ff4d4f' }}>红码</strong>，存在健康风险。</p>
              <p>是否确认继续建档？</p>
            </div>
          ),
          okText: '确认继续',
          okType: 'danger',
          cancelText: '取消',
          onOk: async () => {
            await submitForm(values)
          },
        })
      } else {
        await submitForm(values)
      }
    } catch (err: any) {
      if (err.errorFields) {
        return
      }
      message.error(err.message || '提交失败')
    }
  }

  const submitForm = async (values: any) => {
    setSubmitting(true)
    try {
      const data = transformFormData(values)
      const res = await api.createWorker(data)
      if (res.code === 0) {
        message.success('新增工人成功')
        setModalVisible(false)
        fetchWorkers()
      } else {
        message.error(res.message || '新增失败')
      }
    } catch (err: any) {
      message.error(err.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewDetail = (id: number) => {
    navigate(`/workers/${id}`)
  }

  const healthStatusMap: Record<string, { color: string; text: string }> = {
    green: { color: 'success', text: '绿色' },
    yellow: { color: 'warning', text: '黄色' },
    red: { color: 'error', text: '红色' },
  }

  const getTradeNames = (tradeIds: number[]) => {
    return tradeIds
      .map(id => trades.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  const uploadProps: UploadProps = {
    beforeUpload: () => {
      return false
    },
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '住址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '工种',
      key: 'trades',
      render: (_: unknown, record: WorkerListItem) => getTradeNames(record.trade_ids || []),
      width: 150,
    },
    {
      title: '证书数',
      dataIndex: 'certificate_count',
      key: 'certificate_count',
      width: 90,
      render: (count: number) => count || 0,
    },
    {
      title: '培训数',
      dataIndex: 'training_count',
      key: 'training_count',
      width: 90,
      render: (count: number) => count || 0,
    },
    {
      title: '评价数',
      dataIndex: 'review_count',
      key: 'review_count',
      width: 90,
      render: (count: number) => count || 0,
    },
    {
      title: '健康码状态',
      dataIndex: 'health_status',
      key: 'health_status',
      width: 120,
      render: (status: string) => {
        const info = healthStatusMap[status] || healthStatusMap.green
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '履约评分',
      dataIndex: 'performance_score',
      key: 'performance_score',
      width: 150,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: WorkerListItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>工人管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增工人
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            placeholder="选择工种"
            allowClear
            style={{ width: '100%' }}
            value={tradeId}
            onChange={handleTradeChange}
          >
            {trades.map(trade => (
              <Option key={trade.id} value={trade.id}>
                {trade.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="选择健康状态"
            allowClear
            style={{ width: '100%' }}
            value={healthStatus}
            onChange={handleHealthChange}
          >
            <Option value="green">绿色</Option>
            <Option value="yellow">黄色</Option>
            <Option value="red">红色</Option>
          </Select>
        </Col>
        <Col span={12}>
          <Input.Search
            placeholder="搜索姓名、手机号、住址"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
          />
        </Col>
      </Row>

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
        <Table
          columns={columns}
          dataSource={workers}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Spin>

      <Modal
        title="新增工人"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="提交"
        cancelText="取消"
        confirmLoading={submitting}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Divider orientation="left">基本信息</Divider>

          {healthAlertVisible && (
            <Alert
              message="健康风险提示"
              description="红码人员存在健康风险，建议暂缓建档"
              type="error"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id_card"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { len: 18, message: '身份证号为18位' },
                ]}
              >
                <Input placeholder="请输入身份证号" maxLength={18} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="age"
                label="年龄"
                rules={[{ required: true, message: '请输入年龄' }]}
              >
                <InputNumber min={16} max={70} placeholder="年龄" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" maxLength={11} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="住址"
            rules={[{ required: true, message: '请输入住址' }]}
          >
            <Input placeholder="请输入住址" />
          </Form.Item>

          <Form.Item
            name="trade_ids"
            label="工种"
            rules={[{ required: true, message: '请选择工种' }]}
          >
            <Select mode="multiple" placeholder="请选择工种" style={{ width: '100%' }}>
              {trades.map(trade => (
                <Option key={trade.id} value={trade.id}>
                  {trade.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="health_status"
            label="健康状态"
            rules={[{ required: true, message: '请选择健康状态' }]}
          >
            <Select placeholder="请选择健康状态" onChange={handleHealthStatusChange}>
              <Option value="green">绿码</Option>
              <Option value="yellow">黄码</Option>
              <Option value="red">红码</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">健康信息</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="health_code_source"
                label="健康码来源"
              >
                <Select placeholder="请选择健康码来源">
                  <Option value="yueshengshi">粤省事</Option>
                  <Option value="alipay">支付宝</Option>
                  <Option value="national">国家政务平台</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="health_code_updated_at"
                label="健康码更新时间"
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nucleic_acid_status"
                label="核酸检测状态"
              >
                <Select placeholder="请选择核酸检测状态">
                  <Option value="negative">阴性</Option>
                  <Option value="positive">阳性</Option>
                  <Option value="untested">未检测</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vaccination_status"
                label="疫苗接种情况"
              >
                <Select placeholder="请选择疫苗接种情况">
                  <Option value="unvaccinated">未接种</Option>
                  <Option value="one_dose">一针</Option>
                  <Option value="two_doses">二针</Option>
                  <Option value="three_doses">三针</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">技能证书</Divider>

          <Form.List name="skill_certificates">
            {(fields, { add, remove }) => (
              <>
                <List
                  dataSource={fields}
                  renderItem={(field) => (
                    <Card
                      size="small"
                      style={{ marginBottom: 12 }}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          删除
                        </Button>
                      }
                      title={`证书 ${field.name + 1}`}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'certificate_type']}
                            label="证书类型"
                            rules={[{ required: true, message: '请输入证书类型' }]}
                          >
                            <Input placeholder="如：电工证、焊工证" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'certificate_number']}
                            label="证书编号"
                            rules={[{ required: true, message: '请输入证书编号' }]}
                          >
                            <Input placeholder="请输入证书编号" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'issuing_authority']}
                            label="发证机关"
                          >
                            <Input placeholder="请输入发证机关" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'ocr_result']}
                            label="OCR识别结果"
                          >
                            <Select placeholder="选择OCR状态">
                              <Option value="已识别">已识别</Option>
                              <Option value="待上传">待上传</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'issue_date']}
                            label="发证日期"
                          >
                            <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'expiry_date']}
                            label="有效期至"
                          >
                            <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name={[field.name, 'verified']}
                        label="上传证书"
                        valuePropName="checked"
                      >
                        <Upload {...uploadProps}>
                          <Button icon={<UploadOutlined />}>
                            {form.getFieldValue(['skill_certificates', field.name, 'ocr_result']) === '已识别' ? (
                              <span><CheckCircleOutlined style={{ color: '#52c41a' }} /> 已识别</span>
                            ) : (
                              '点击上传'
                            )}
                          </Button>
                        </Upload>
                      </Form.Item>
                    </Card>
                  )}
                />
                <Button
                  type="dashed"
                  onClick={() => add({ ocr_result: '待上传', verified: false })}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 24 }}
                >
                  添加证书
                </Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left">培训记录</Divider>

          <Form.List name="safety_trainings">
            {(fields, { add, remove }) => (
              <>
                <List
                  dataSource={fields}
                  renderItem={(field) => (
                    <Card
                      size="small"
                      style={{ marginBottom: 12 }}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          删除
                        </Button>
                      }
                      title={`培训记录 ${field.name + 1}`}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'training_name']}
                            label="培训名称"
                            rules={[{ required: true, message: '请输入培训名称' }]}
                          >
                            <Input placeholder="如：安全生产培训" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'training_date']}
                            label="培训日期"
                          >
                            <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name={[field.name, 'training_hours']}
                            label="培训时长(小时)"
                          >
                            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入时长" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[field.name, 'exam_score']}
                            label="考试成绩"
                          >
                            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入分数" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[field.name, 'passed']}
                            label="是否通过"
                          >
                            <Select placeholder="请选择">
                              <Option value={true}>通过</Option>
                              <Option value={false}>未通过</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  )}
                />
                <Button
                  type="dashed"
                  onClick={() => add({ passed: false })}
                  block
                  icon={<PlusOutlined />}
                >
                  添加培训记录
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}
