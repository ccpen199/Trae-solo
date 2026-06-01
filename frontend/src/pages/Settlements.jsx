import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Select, InputNumber, message, Tag, Space } from 'antd'
import axios from 'axios'

export default function Settlements() {
  const [settlements, setSettlements] = useState([])
  const [pendingTasks, setPendingTasks] = useState([])
  const [freelancers, setFreelancers] = useState([])
  const [projects, setProjects] = useState([])
  const [genVisible, setGenVisible] = useState(false)
  const [adjVisible, setAdjVisible] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const [selectedFreelancer, setSelectedFreelancer] = useState(null)
  const [form] = Form.useForm()
  const [adjForm] = Form.useForm()

  const loadSettlements = () => {
    axios.get('/api/settlements').then(res => setSettlements(res.data))
  }

  useEffect(() => {
    loadSettlements()
    axios.get('/api/users?user_type=freelancer').then(res => setFreelancers(res.data))
    axios.get('/api/projects').then(res => setProjects(res.data))
  }, [])

  const handleFreelancerChange = (id) => {
    setSelectedFreelancer(id)
    axios.get(`/api/settlements/pending-tasks/${id}`).then(res => setPendingTasks(res.data))
  }

  const handleGenerate = () => {
    form.validateFields().then(values => {
      axios.get(`/api/users/${values.freelancer_id}/can-settle`).then(r => {
        if (!r.data.canSettle) {
          message.error(r.data.reason)
          return
        }
        return axios.post('/api/settlements/generate', { ...values, task_ids: values.task_ids.join(',') })
      }).then(() => {
        message.success('结算单生成成功')
        setGenVisible(false)
        loadSettlements()
      }).catch(err => {
        message.error(err.response?.data?.error || '生成失败')
      })
    })
  }

  const handleConfirm = (id) => {
    axios.post(`/api/settlements/${id}/confirm`).then(() => {
      message.success('已确认')
      loadSettlements()
    })
  }

  const handleAdjust = (record) => {
    setSelectedSettlement(record)
    adjForm.setFieldsValue(record)
    setAdjVisible(true)
  }

  const handleSaveAdjust = () => {
    adjForm.validateFields().then(values => {
      axios.put(`/api/settlements/${selectedSettlement.id}/adjust`, values).then(() => {
        message.success('调整成功')
        setAdjVisible(false)
        loadSettlements()
      })
    })
  }

  const columns = [
    { title: '结算单号', dataIndex: 'settlement_no' },
    { title: '自由职业者', dataIndex: 'freelancer_name' },
    { title: '项目', dataIndex: 'project_name' },
    { title: '任务总额', dataIndex: 'total_task_amount' },
    { title: '平台服务费', dataIndex: 'platform_fee' },
    { title: '个税', dataIndex: 'personal_tax' },
    { title: '补贴', dataIndex: 'subsidy' },
    { title: '实发', dataIndex: 'final_amount' },
    { title: '状态', dataIndex: 'status', render: v => ({ draft: <Tag color="orange">草稿</Tag>, confirmed: <Tag color="blue">已确认</Tag>, paid: <Tag color="green">已打款</Tag>, failed: <Tag color="red">失败</Tag> }[v]) },
    { title: '操作', render: (_, r) => (
      <Space>
        {r.status === 'draft' && <Button size="small" type="primary" onClick={() => handleConfirm(r.id)}>确认</Button>}
        {r.status === 'draft' && <Button size="small" onClick={() => handleAdjust(r)}>调整金额</Button>}
      </Space>
    ) }
  ]

  return (
    <div>
      <div className="page-title">结算管理</div>
      <div className="page-card">
        <Button type="primary" onClick={() => setGenVisible(true)} style={{ marginBottom: 16 }}>生成结算单</Button>
        <Table columns={columns} dataSource={settlements} rowKey="id" />
      </div>
      <Modal title="生成结算单" open={genVisible} onOk={handleGenerate} onCancel={() => setGenVisible(false)} width={700}>
        <Form form={form} layout="vertical">
          <Form.Item label="自由职业者" name="freelancer_id">
            <Select onChange={handleFreelancerChange}>
              {freelancers.map(u => <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="项目" name="project_id">
            <Select>
              {projects.map(p => <Select.Option key={p.id} value={p.id}>{p.project_name}</Select.Option>)}
            </Select>
          </Form.Item>
          {selectedFreelancer && pendingTasks.length > 0 && (
            <Form.Item label="选择任务" name="task_ids">
              <Select mode="multiple" style={{ width: '100%' }}>
                {pendingTasks.map(t => <Select.Option key={t.id} value={t.id}>{t.task_no} - {t.total_amount}元</Select.Option>)}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
      <Modal title="调整金额" open={adjVisible} onOk={handleSaveAdjust} onCancel={() => setAdjVisible(false)}>
        <Form form={adjForm} layout="vertical">
          <Form.Item label="平台服务费" name="platform_fee"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="个税" name="personal_tax"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="补贴" name="subsidy"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="扣款" name="deduction"><InputNumber style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
