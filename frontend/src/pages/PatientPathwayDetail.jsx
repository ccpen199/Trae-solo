import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Descriptions, Button, Space, Table, Modal, Form, Input, Select, message, Typography, Card, Tag, Row, Col, Alert, Checkbox } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons'
import { patientPathwayAPI, orderAPI, adverseEventAPI, efficacyFeedbackAPI } from '../api'

const { Title } = Typography
const { Option } = Select

function PatientPathwayDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patientPathway, setPatientPathway] = useState(null)
  const [orders, setOrders] = useState([])
  const [events, setEvents] = useState([])
  const [feedback, setFeedback] = useState([])
  const [orderModalVisible, setOrderModalVisible] = useState(false)
  const [eventModalVisible, setEventModalVisible] = useState(false)
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [isOffPathway, setIsOffPathway] = useState(false)
  const [orderForm] = Form.useForm()
  const [eventForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [pathwayData, orderData, eventData, feedbackData] = await Promise.all([
        patientPathwayAPI.getById(id),
        orderAPI.getAll({ patient_pathway_id: id }),
        adverseEventAPI.getAll(),
        efficacyFeedbackAPI.getAll()
      ])
      setPatientPathway(pathwayData)
      setOrders(orderData)
      setEvents(eventData.filter(e => e.patient_pathway_id === parseInt(id)))
      setFeedback(feedbackData.filter(f => f.patient_pathway_id === parseInt(id)))
    } catch (error) {
      message.error('加载数据失败')
    }
  }

  const handleCreateOrder = async (values) => {
    try {
      await orderAPI.create({
        patient_pathway_id: id,
        is_off_pathway: isOffPathway,
        ...values
      })
      message.success('创建医嘱成功')
      setOrderModalVisible(false)
      orderForm.resetFields()
      setIsOffPathway(false)
      loadData()
    } catch (error) {
      message.error('创建医嘱失败')
    }
  }

  const handleCreateEvent = async (values) => {
    try {
      await adverseEventAPI.create({
        patient_pathway_id: id,
        ...values
      })
      message.success('记录不良反应成功')
      setEventModalVisible(false)
      eventForm.resetFields()
      loadData()
    } catch (error) {
      message.error('记录不良反应失败')
    }
  }

  const handleCreateFeedback = async (values) => {
    try {
      await efficacyFeedbackAPI.create({
        patient_pathway_id: id,
        ...values
      })
      message.success('记录疗效反馈成功')
      setFeedbackModalVisible(false)
      feedbackForm.resetFields()
      loadData()
    } catch (error) {
      message.error('记录疗效反馈失败')
    }
  }

  const checkRisks = () => {
    const risks = []
    if (patientPathway?.allergy_history && patientPathway.allergy_history !== '无药物过敏史') {
      risks.push({ type: 'warning', message: `过敏史: ${patientPathway.allergy_history}` })
    }
    if (patientPathway?.liver_function && patientPathway.liver_function !== '正常') {
      risks.push({ type: 'warning', message: `肝功能异常: ${patientPathway.liver_function}` })
    }
    if (patientPathway?.kidney_function && patientPathway.kidney_function !== '正常') {
      risks.push({ type: 'danger', message: `肾功能异常: ${patientPathway.kidney_function}` })
    }
    if (patientPathway?.risk_factors) {
      risks.push({ type: 'warning', message: `风险因素: ${patientPathway.risk_factors}` })
    }
    return risks
  }

  const orderColumns = [
    { title: '药品名称', dataIndex: 'drug_name', key: 'drug_name' },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
    { title: '频次', dataIndex: 'frequency', key: 'frequency' },
    {
      title: '超路径',
      dataIndex: 'is_off_pathway',
      key: 'is_off_pathway',
      render: (v) => v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
    },
    {
      title: '审核状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (s) => {
        const colorMap = { pending: 'orange', approved: 'green', rejected: 'red' }
        const textMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
        return <Tag color={colorMap[s]}>{textMap[s]}</Tag>
      },
    },
    { title: '医生', dataIndex: 'doctor_name', key: 'doctor_name' },
    { title: '药师意见', dataIndex: 'pharmacist_comment', key: 'pharmacist_comment' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ]

  const eventColumns = [
    { title: '事件类型', dataIndex: 'event_type', key: 'event_type' },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (s) => {
        const colorMap = { mild: 'green', moderate: 'orange', severe: 'red' }
        const textMap = { mild: '轻度', moderate: '中度', severe: '重度' }
        return <Tag color={colorMap[s]}>{textMap[s]}</Tag>
      },
    },
    { title: '关联药品', dataIndex: 'drug_name', key: 'drug_name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '结局', dataIndex: 'outcome', key: 'outcome' },
    { title: '上报人', dataIndex: 'reporter', key: 'reporter' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' },
  ]

  const feedbackColumns = [
    { title: '反馈类型', dataIndex: 'feedback_type', key: 'feedback_type' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '疗效结局', dataIndex: 'outcome', key: 'outcome' },
    { title: '记录人', dataIndex: 'created_by', key: 'created_by' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' },
  ]

  if (!patientPathway) return <div style={{ padding: 24 }}>加载中...</div>

  const risks = checkRisks()

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} style={{ marginBottom: 16 }}>
          返回列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>患者路径详情</Title>
      </div>

      {risks.length > 0 && (
        <Card className="card-shadow" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <WarningOutlined style={{ color: '#fa8c16', fontSize: 20, marginRight: 8 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>风险提示</span>
          </div>
          {risks.map((risk, idx) => (
            <div key={idx} className={risk.type === 'danger' ? 'risk-danger' : 'risk-warning'}>
              {risk.message}
            </div>
          ))}
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="患者信息" className="card-shadow">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="姓名">{patientPathway.patient_name}</Descriptions.Item>
              <Descriptions.Item label="性别">{patientPathway.gender}</Descriptions.Item>
              <Descriptions.Item label="年龄">{patientPathway.age}岁</Descriptions.Item>
              <Descriptions.Item label="病历号">{patientPathway.medical_record_no}</Descriptions.Item>
              <Descriptions.Item label="诊断">{patientPathway.diagnosis}</Descriptions.Item>
              <Descriptions.Item label="过敏史">{patientPathway.allergy_history}</Descriptions.Item>
              <Descriptions.Item label="肝功能">{patientPathway.liver_function}</Descriptions.Item>
              <Descriptions.Item label="肾功能">{patientPathway.kidney_function}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="路径信息" className="card-shadow">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="路径名称">{patientPathway.pathway_name}</Descriptions.Item>
              <Descriptions.Item label="疾病">{patientPathway.disease}</Descriptions.Item>
              <Descriptions.Item label="分期">{patientPathway.stage}</Descriptions.Item>
              <Descriptions.Item label="版本">{patientPathway.version}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={patientPathway.status === 'active' ? 'green' : 'default'}>
                  {patientPathway.status === 'active' ? '进行中' : '已结束'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="合并用药">{patientPathway.concurrent_medications || '-'}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{patientPathway.created_at}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card
        className="card-shadow"
        style={{ marginBottom: 24 }}
        title="路径推荐药品"
      >
        <Table
          columns={[
            { title: '药品名称', dataIndex: 'drug_name', key: 'drug_name' },
            { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
            { title: '频次', dataIndex: 'frequency', key: 'frequency' },
            { title: '疗程', dataIndex: 'duration', key: 'duration' },
            { title: '禁忌', dataIndex: 'contraindications', key: 'contraindications' },
            { title: '备注', dataIndex: 'notes', key: 'notes' },
          ]}
          dataSource={patientPathway.pathway_drugs}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <Card
        className="card-shadow"
        style={{ marginBottom: 24 }}
        title="医嘱记录"
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setOrderModalVisible(true)}>
            开立医嘱
          </Button>
        }
      >
        <Table
          columns={orderColumns}
          dataSource={orders}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            className="card-shadow"
            title="不良反应记录"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setEventModalVisible(true)}>
                上报
              </Button>
            }
          >
            <Table
              columns={eventColumns}
              dataSource={events}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            className="card-shadow"
            title="疗效反馈"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setFeedbackModalVisible(true)}>
                记录
              </Button>
            }
          >
            <Table
              columns={feedbackColumns}
              dataSource={feedback}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="开立医嘱"
        open={orderModalVisible}
        onCancel={() => { setOrderModalVisible(false); setIsOffPathway(false); }}
        footer={null}
        width={600}
      >
        <Form form={orderForm} layout="vertical" onFinish={handleCreateOrder}>
          <Form.Item>
            <Checkbox checked={isOffPathway} onChange={(e) => setIsOffPathway(e.target.checked)}>
              超路径用药（需要备注说明）
            </Checkbox>
          </Form.Item>
          <Form.Item name="drug_name" label="药品名称" rules={[{ required: true }]}>
            <Select placeholder="请选择或输入药品">
              {patientPathway.pathway_drugs?.map(d => (
                <Option key={d.id} value={d.drug_name}>{d.drug_name} ({d.dosage}, {d.frequency})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dosage" label="剂量" rules={[{ required: true }]}>
            <Input placeholder="例如: 0.625g" />
          </Form.Item>
          <Form.Item name="frequency" label="频次" rules={[{ required: true }]}>
            <Input placeholder="例如: q8h" />
          </Form.Item>
          <Form.Item name="duration" label="疗程">
            <Input placeholder="例如: 7天" />
          </Form.Item>
          {isOffPathway && (
            <Form.Item name="doctor_note" label="超路径说明" rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder="请说明超路径原因" />
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => { setOrderModalVisible(false); setIsOffPathway(false); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上报不良反应"
        open={eventModalVisible}
        onCancel={() => setEventModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={eventForm} layout="vertical" onFinish={handleCreateEvent}>
          <Form.Item name="event_type" label="事件类型" rules={[{ required: true }]}>
            <Select placeholder="请选择">
              <Option value="过敏反应">过敏反应</Option>
              <Option value="胃肠道反应">胃肠道反应</Option>
              <Option value="肝肾功能异常">肝肾功能异常</Option>
              <Option value="血液系统异常">血液系统异常</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
            <Select placeholder="请选择">
              <Option value="mild">轻度</Option>
              <Option value="moderate">中度</Option>
              <Option value="severe">重度</Option>
            </Select>
          </Form.Item>
          <Form.Item name="drug_name" label="关联药品">
            <Input placeholder="请输入关联药品" />
          </Form.Item>
          <Form.Item name="description" label="事件描述" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请详细描述不良反应" />
          </Form.Item>
          <Form.Item name="outcome" label="结局">
            <Select placeholder="请选择">
              <Option value="好转">好转</Option>
              <Option value="痊愈">痊愈</Option>
              <Option value="未愈">未愈</Option>
              <Option value="死亡">死亡</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reporter" label="上报人">
            <Input placeholder="请输入上报人" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setEventModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="记录疗效反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={handleCreateFeedback}>
          <Form.Item name="feedback_type" label="反馈类型">
            <Select placeholder="请选择">
              <Option value="症状改善">症状改善</Option>
              <Option value="实验室指标改善">实验室指标改善</Option>
              <Option value="治疗效果不佳">治疗效果不佳</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="反馈描述" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请详细描述疗效情况" />
          </Form.Item>
          <Form.Item name="outcome" label="疗效结局">
            <Select placeholder="请选择">
              <Option value="治愈">治愈</Option>
              <Option value="显效">显效</Option>
              <Option value="有效">有效</Option>
              <Option value="无效">无效</Option>
              <Option value="恶化">恶化</Option>
            </Select>
          </Form.Item>
          <Form.Item name="created_by" label="记录人">
            <Input placeholder="请输入记录人" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setFeedbackModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PatientPathwayDetail
