import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, message } from 'antd'
import axios from 'axios'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    axios.get('/api/projects').then(res => setProjects(res.data))
    axios.get('/api/users?user_type=project_owner').then(res => setUsers(res.data))
  }, [])

  const handleSave = () => {
    form.validateFields().then(values => {
      axios.post('/api/projects', values).then(() => {
        message.success('创建成功')
        setVisible(false)
        axios.get('/api/projects').then(res => setProjects(res.data))
      })
    })
  }

  const columns = [
    { title: '项目名称', dataIndex: 'project_name' },
    { title: '项目编号', dataIndex: 'project_code' },
    { title: '项目方', dataIndex: 'owner_name' },
    { title: '状态', dataIndex: 'status', render: v => v === 'active' ? '正常' : '关闭' }
  ]

  return (
    <div>
      <div className="page-title">项目管理</div>
      <div className="page-card">
        <Button type="primary" onClick={() => setVisible(true)} style={{ marginBottom: 16 }}>新建项目</Button>
        <Table columns={columns} dataSource={projects} rowKey="id" />
      </div>
      <Modal title="新建项目" open={visible} onOk={handleSave} onCancel={() => setVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="项目方" name="project_owner_id">
            <Select>
              {users.map(u => <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="项目名称" name="project_name"><Input /></Form.Item>
          <Form.Item label="项目编号" name="project_code"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
