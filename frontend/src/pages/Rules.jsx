import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, Switch, message } from 'antd'
import axios from 'axios'

export default function Rules() {
  const [rules, setRules] = useState([])
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    axios.get('/api/rules').then(res => setRules(res.data))
  }, [])

  const handleCreate = () => {
    form.validateFields().then(values => {
      axios.post('/api/rules', { ...values, is_active: 1 }).then(() => {
        message.success('规则创建成功')
        setVisible(false)
        axios.get('/api/rules').then(res => setRules(res.data))
      })
    })
  }

  const handleToggle = (id) => {
    axios.put(`/api/rules/${id}/toggle`).then(() => {
      message.success('状态已更新')
      axios.get('/api/rules').then(res => setRules(res.data))
    })
  }

  const columns = [
    { title: '规则名称', dataIndex: 'rule_name' },
    { title: '类型', dataIndex: 'rule_type', render: v => ({ platform_fee: '平台服务费', tax: '个税', subsidy: '补贴', deduction: '扣款' }[v]) },
    { title: '计算方式', dataIndex: 'calculation_type', render: v => v === 'percentage' ? '百分比' : '固定金额' },
    { title: '值', dataIndex: 'value' },
    { title: '最小值', dataIndex: 'min_value' },
    { title: '最大值', dataIndex: 'max_value' },
    { title: '启用', dataIndex: 'is_active', render: (v, r) => <Switch checked={v === 1} onChange={() => handleToggle(r.id)} /> }
  ]

  return (
    <div>
      <div className="page-title">规则配置</div>
      <div className="page-card">
        <Button type="primary" onClick={() => setVisible(true)} style={{ marginBottom: 16 }}>新建规则</Button>
        <Table columns={columns} dataSource={rules} rowKey="id" />
      </div>
      <Modal title="新建规则" open={visible} onOk={handleCreate} onCancel={() => setVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="规则名称" name="rule_name"><Input /></Form.Item>
          <Form.Item label="规则类型" name="rule_type">
            <Select>
              <Select.Option value="platform_fee">平台服务费</Select.Option>
              <Select.Option value="tax">个税</Select.Option>
              <Select.Option value="subsidy">补贴</Select.Option>
              <Select.Option value="deduction">扣款</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="计算方式" name="calculation_type">
            <Select>
              <Select.Option value="percentage">百分比</Select.Option>
              <Select.Option value="fixed">固定金额</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="值" name="value"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="最小值" name="min_value"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="最大值" name="max_value"><InputNumber style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
