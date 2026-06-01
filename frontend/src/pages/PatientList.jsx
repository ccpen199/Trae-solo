import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Modal, Form, Input, Select, message, Typography, Tag, Tabs } from 'antd'
import { PlusOutlined, EyeOutlined, ArrowRightOutlined, UserAddOutlined } from '@ant-design/icons'
import { patientAPI, patientPathwayAPI, pathwayAPI } from '../api'

const { Title } = Typography
const { Option } = Select

function PatientList() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [patientPathways, setPatientPathways] = useState([])
  const [pathways, setPathways] = useState([])
  const [loading, setLoading] = useState(false)
  const [patientModalVisible, setPatientModalVisible] = useState(false)
  const [pathwayModalVisible, setPathwayModalVisible] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientForm] = Form.useForm()
  const [pathwayForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [patientData, pathwayData, publishedPathways] = await Promise.all([
        patientAPI.getAll(),
        patientPathwayAPI.getAll(),
        pathwayAPI.getAll('published')
      ])
      setPatients(patientData)
      setPatientPathways(pathwayData)
      setPathways(publishedPathways)
    } catch (error) {
      message.error('加载数据失败')
    }
    setLoading(false)
  }

  const handleCreatePatient = async (values) => {
    try {
      await patientAPI.create(values)
      message.success('创建患者成功')
      setPatientModalVisible(false)
      patientForm.resetFields()
      loadData()
    } catch (error) {
      message.error('创建患者失败')
    }
  }

  const handleAssignPathway = async (values) => {
    try {
      const patientId = selectedPatient?.id || values.patient_id
      if (!patientId) {
        message.error('请选择患者')
        return
      }
      await patientPathwayAPI.create({
        patient_id: patientId,
        pathway_id: values.pathway_id,
        risk_factors: values.risk_factors,
        concurrent_medications: values.concurrent_medications,
        created_by: 'system'
      })
      message.success('患者入径成功')
      setPathwayModalVisible(false)
      setSelectedPatient(null)
      pathwayForm.resetFields()
      loadData()
    } catch (error) {
      message.error('入径失败')
    }
  }

  const openAssignPathway = (patient) => {
    setSelectedPatient(patient)
    setPathwayModalVisible(true)
  }

  const patientColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    { title: '病历号', dataIndex: 'medical_record_no', key: 'medical_record_no' },
    { title: '诊断', dataIndex: 'diagnosis', key: 'diagnosis' },
    { title: '过敏史', dataIndex: 'allergy_history', key: 'allergy_history' },
    { title: '肝功能', dataIndex: 'liver_function', key: 'liver_function' },
    { title: '肾功能', dataIndex: 'kidney_function', key: 'kidney_function' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<ArrowRightOutlined />} onClick={() => openAssignPathway(record)}>
            分配路径
          </Button>
        </Space>
      ),
    },
  ]

  const pathwayColumns = [
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '病历号', dataIndex: 'medical_record_no', key: 'medical_record_no' },
    { title: '路径名称', dataIndex: 'pathway_name', key: 'pathway_name' },
    { title: '疾病', dataIndex: 'disease', key: 'disease' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '进行中' : '已结束'}</Tag>,
    },
    { title: '开始时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/patient-pathways/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'patients',
      label: '患者列表',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: '#666' }}>选择患者后点击「分配路径」将患者加入用药路径</div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPatientModalVisible(true)}>
              新建患者
            </Button>
          </div>
          <Table
            columns={patientColumns}
            dataSource={patients}
            rowKey="id"
            loading={loading}
            className="card-shadow"
          />
        </>
      )
    },
    {
      key: 'pathways',
      label: '在径患者',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: '#666' }}>查看和管理正在进行中的用药路径</div>
            <Button icon={<UserAddOutlined />} onClick={() => setPathwayModalVisible(true)}>
              新增入径
            </Button>
          </div>
          <Table
            columns={pathwayColumns}
            dataSource={patientPathways}
            rowKey="id"
            loading={loading}
            className="card-shadow"
          />
        </>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} className="page-header">患者路径管理</Title>

      <Tabs defaultActiveKey="patients" items={tabItems} />

      <Modal
        title="新建患者"
        open={patientModalVisible}
        onCancel={() => setPatientModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={patientForm} layout="vertical" onFinish={handleCreatePatient}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select placeholder="请选择性别">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
          <Form.Item name="age" label="年龄">
            <Input type="number" placeholder="请输入年龄" />
          </Form.Item>
          <Form.Item name="medical_record_no" label="病历号" rules={[{ required: true }]}>
            <Input placeholder="请输入病历号" />
          </Form.Item>
          <Form.Item name="diagnosis" label="诊断">
            <Input placeholder="请输入诊断" />
          </Form.Item>
          <Form.Item name="allergy_history" label="过敏史">
            <Input.TextArea rows={2} placeholder="请输入过敏史" />
          </Form.Item>
          <Form.Item name="liver_function" label="肝功能">
            <Select placeholder="请选择肝功能">
              <Option value="正常">正常</Option>
              <Option value="轻度异常">轻度异常</Option>
              <Option value="中度异常">中度异常</Option>
              <Option value="重度异常">重度异常</Option>
            </Select>
          </Form.Item>
          <Form.Item name="kidney_function" label="肾功能">
            <Select placeholder="请选择肾功能">
              <Option value="正常">正常</Option>
              <Option value="轻度异常">轻度异常</Option>
              <Option value="中度异常">中度异常</Option>
              <Option value="重度异常">重度异常</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setPatientModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedPatient ? `为 ${selectedPatient.name} 分配用药路径` : '患者入径'}
        open={pathwayModalVisible}
        onCancel={() => {
          setPathwayModalVisible(false)
          setSelectedPatient(null)
          pathwayForm.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form form={pathwayForm} layout="vertical" onFinish={handleAssignPathway}>
          {!selectedPatient && (
            <Form.Item name="patient_id" label="选择患者" rules={[{ required: true }]}>
              <Select placeholder="请选择患者" onChange={(val) => {
                const patient = patients.find(p => p.id === val)
                setSelectedPatient(patient)
              }}>
                {patients.map(p => (
                  <Option key={p.id} value={p.id}>{p.name} - {p.diagnosis}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="pathway_id" label="选择路径" rules={[{ required: true }]}>
            <Select placeholder="请选择用药路径">
              {pathways.map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.version})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="risk_factors" label="风险因素">
            <Input.TextArea rows={2} placeholder="请输入风险因素" />
          </Form.Item>
          <Form.Item name="concurrent_medications" label="合并用药">
            <Input.TextArea rows={2} placeholder="请输入合并用药" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认入径</Button>
              <Button onClick={() => {
                setPathwayModalVisible(false)
                setSelectedPatient(null)
                pathwayForm.resetFields()
              }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PatientList
