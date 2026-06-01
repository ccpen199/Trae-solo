import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message } from 'antd'
import axios from 'axios'

const { Option } = Select

export default function Users() {
  const [users, setUsers] = useState([])
  const [visible, setVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()

  const loadUsers = () => {
    axios.get('/api/users').then(res => setUsers(res.data))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleEdit = (user) => {
    setEditingUser(user)
    form.setFieldsValue(user)
    setVisible(true)
  }

  const handleSave = () => {
    form.validateFields().then(values => {
      axios.put(`/api/users/${editingUser.id}`, values).then(() => {
        message.success('保存成功')
        setVisible(false)
        loadUsers()
      })
    })
  }

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'name' },
    { title: '手机', dataIndex: 'phone' },
    { title: '类型', dataIndex: 'user_type', render: v => ({ operator: '运营', project_owner: '项目方', freelancer: '自由职业者', finance: '财务', tax: '税务' }[v]) },
    { title: '实名', dataIndex: 'id_card_verified', render: v => v ? <Tag color="green">已认证</Tag> : <Tag color="red">未认证</Tag> },
    { title: '协议', dataIndex: 'agreement_status', render: v => ({ pending: <Tag color="orange">待审核</Tag>, approved: <Tag color="green">已通过</Tag>, rejected: <Tag color="red">已拒绝</Tag> }[v]) },
    { title: '风险', dataIndex: 'risk_status', render: v => ({ normal: <Tag color="green">正常</Tag>, warning: <Tag color="orange">预警</Tag>, blocked: <Tag color="red">阻断</Tag> }[v]) },
    { title: '操作', render: (_, r) => <Button size="small" onClick={() => handleEdit(r)}>编辑</Button> }
  ]

  return (
    <div>
      <div className="page-title">人员管理</div>
      <div className="page-card">
        <Table columns={columns} dataSource={users} rowKey="id" />
      </div>
      <Modal title="编辑用户" open={visible} onOk={handleSave} onCancel={() => setVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name"><Input /></Form.Item>
          <Form.Item label="手机" name="phone"><Input /></Form.Item>
          <Form.Item label="身份证" name="id_card"><Input /></Form.Item>
          <Form.Item label="实名验证" name="id_card_verified"><Select><Option value={1}>已验证</Option><Option value={0}>未验证</Option></Select></Form.Item>
          <Form.Item label="协议状态" name="agreement_status"><Select><Option value="pending">待审核</Option><Option value="approved">已通过</Option><Option value="rejected">已拒绝</Option></Select></Form.Item>
          <Form.Item label="银行" name="bank_name"><Input /></Form.Item>
          <Form.Item label="账号" name="bank_account"><Input /></Form.Item>
          <Form.Item label="税务身份" name="tax_identity"><Select><Option value="natural_person">自然人</Option><Option value="individual_business">个体工商户</Option></Select></Form.Item>
          <Form.Item label="风险状态" name="risk_status"><Select><Option value="normal">正常</Option><Option value="warning">预警</Option><Option value="blocked">阻断</Option></Select></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
