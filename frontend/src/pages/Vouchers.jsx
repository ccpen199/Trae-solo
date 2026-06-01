import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, message } from 'antd'
import axios from 'axios'

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([])
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    axios.get('/api/vouchers').then(res => setVouchers(res.data))
    axios.get('/api/users?user_type=freelancer').then(res => setUsers(res.data))
    axios.get('/api/projects').then(res => setProjects(res.data))
  }, [])

  const handleCreate = () => {
    form.validateFields().then(values => {
      axios.post('/api/vouchers', values).then(() => {
        message.success('凭证创建成功')
        setVisible(false)
        axios.get('/api/vouchers').then(res => setVouchers(res.data))
      })
    })
  }

  const columns = [
    { title: '凭证号', dataIndex: 'voucher_no' },
    { title: '类型', dataIndex: 'voucher_type', render: v => ({ payment: '付款凭证', tax: '税务凭证', service: '服务凭证' }[v]) },
    { title: '关联ID', dataIndex: 'related_id' },
    { title: '自由职业者', dataIndex: 'freelancer_name' },
    { title: '项目', dataIndex: 'project_name' },
    { title: '文件', dataIndex: 'file_path' }
  ]

  return (
    <div>
      <div className="page-title">凭证管理</div>
      <div className="page-card">
        <Button type="primary" onClick={() => setVisible(true)} style={{ marginBottom: 16 }}>创建凭证</Button>
        <Table columns={columns} dataSource={vouchers} rowKey="id" />
      </div>
      <Modal title="创建凭证" open={visible} onOk={handleCreate} onCancel={() => setVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="凭证类型" name="voucher_type">
            <Select>
              <Select.Option value="payment">付款凭证</Select.Option>
              <Select.Option value="tax">税务凭证</Select.Option>
              <Select.Option value="service">服务凭证</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="关联ID" name="related_id"><Input /></Form.Item>
          <Form.Item label="自由职业者" name="freelancer_id">
            <Select allowClear>
              {users.map(u => <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="项目" name="project_id">
            <Select allowClear>
              {projects.map(p => <Select.Option key={p.id} value={p.id}>{p.project_name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
