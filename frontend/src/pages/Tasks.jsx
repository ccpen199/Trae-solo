import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, message, Upload, Tabs } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import axios from 'axios'

const { TabPane } = Tabs

export default function Tasks() {
  const [batches, setBatches] = useState([])
  const [tasks, setTasks] = useState([])
  const [errors, setErrors] = useState([])
  const [batchVisible, setBatchVisible] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [projects, setProjects] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    axios.get('/api/tasks/batches').then(res => setBatches(res.data))
    axios.get('/api/tasks').then(res => setTasks(res.data))
    axios.get('/api/projects').then(res => setProjects(res.data))
  }, [])

  const handleCreateBatch = () => {
    form.validateFields().then(values => {
      axios.post('/api/tasks/batches', values).then(() => {
        message.success('批次创建成功')
        setBatchVisible(false)
        axios.get('/api/tasks/batches').then(res => setBatches(res.data))
      })
    })
  }

  const handleUpload = (options) => {
    const { file, onSuccess, onError } = options
    const formData = new FormData()
    formData.append('file', file)
    axios.post(`/api/tasks/import/${selectedBatch}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => {
      message.success(`导入成功：${res.data.success}条，失败：${res.data.failed}条`)
      if (res.data.errors.length > 0) {
        setErrors(res.data.errors)
      }
      axios.get('/api/tasks').then(res => setTasks(res.data))
      onSuccess?.()
    }).catch(onError)
  }

  const handleAccept = (id) => {
    axios.post(`/api/tasks/${id}/accept`).then(() => {
      message.success('验收通过')
      axios.get('/api/tasks').then(res => setTasks(res.data))
    })
  }

  const handleReject = (id) => {
    axios.post(`/api/tasks/${id}/reject`, { rejection_reason: '不达标' }).then(() => {
      message.success('已驳回')
      axios.get('/api/tasks').then(res => setTasks(res.data))
    })
  }

  const taskColumns = [
    { title: '任务编号', dataIndex: 'task_no' },
    { title: '项目', dataIndex: 'project_name' },
    { title: '批次', dataIndex: 'batch_name' },
    { title: '自由职业者', dataIndex: 'freelancer_name' },
    { title: '单价', dataIndex: 'unit_price' },
    { title: '数量', dataIndex: 'quantity' },
    { title: '总额', dataIndex: 'total_amount' },
    { title: '状态', dataIndex: 'acceptance_status', render: v => ({ pending: <Tag color="orange">待验收</Tag>, approved: <Tag color="green">已通过</Tag>, rejected: <Tag color="red">已驳回</Tag> }[v]) },
    { title: '操作', render: (_, r) => r.acceptance_status === 'pending' && (
      <>
        <Button size="small" type="primary" onClick={() => handleAccept(r.id)}>通过</Button>
        <Button size="small" danger onClick={() => handleReject(r.id)}>驳回</Button>
      </>
    ) }
  ]

  return (
    <div>
      <div className="page-title">任务管理</div>
      <div className="page-card">
        <Tabs defaultActiveKey="tasks">
          <TabPane tab="任务列表" key="tasks">
            <Table columns={taskColumns} dataSource={tasks} rowKey="id" />
          </TabPane>
          <TabPane tab="任务批次" key="batches">
            <Button type="primary" onClick={() => setBatchVisible(true)} style={{ marginBottom: 16 }}>新建批次</Button>
            <Button onClick={() => setSelectedBatch(batches[0]?.id)} style={{ marginLeft: 8, marginBottom: 16 }} disabled={!batches.length}>选择批次导入</Button>
            <Table dataSource={batches} rowKey="id">
              <Table.Column title="批次号" dataIndex="batch_no" />
              <Table.Column title="批次名" dataIndex="batch_name" />
              <Table.Column title="项目" dataIndex="project_name" />
              <Table.Column title="任务数" dataIndex="total_tasks" />
              <Table.Column title="状态" dataIndex="status" />
            </Table>
          </TabPane>
          {errors.length > 0 && <TabPane tab="导入错误" key="errors">
            <Table dataSource={errors} rowKey="rowNumber">
              <Table.Column title="行号" dataIndex="rowNumber" />
              <Table.Column title="错误" dataIndex="error" />
            </Table>
          </TabPane>}
        </Tabs>
      </div>
      <Modal title="新建批次" open={batchVisible} onOk={handleCreateBatch} onCancel={() => setBatchVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="项目" name="project_id">
            <Select>
              {projects.map(p => <Select.Option key={p.id} value={p.id}>{p.project_name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="批次名称" name="batch_name"><Input /></Form.Item>
        </Form>
      </Modal>
      <Modal title="导入任务" open={!!selectedBatch} onOk={() => setSelectedBatch(null)} onCancel={() => setSelectedBatch(null)}>
        <Upload customRequest={handleUpload} accept=".csv">
          <Button icon={<UploadOutlined />}>选择CSV文件</Button>
        </Upload>
      </Modal>
    </div>
  )
}
