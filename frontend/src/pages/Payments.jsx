import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Tabs } from 'antd'
import axios from 'axios'

const { TabPane } = Tabs

export default function Payments() {
  const [batches, setBatches] = useState([])
  const [payments, setPayments] = useState([])
  const [settlements, setSettlements] = useState([])
  const [batchVisible, setBatchVisible] = useState(false)
  const [form] = Form.useForm()

  const loadData = () => {
    axios.get('/api/payments/batches').then(res => setBatches(res.data))
    axios.get('/api/payments').then(res => setPayments(res.data))
    axios.get('/api/settlements').then(res => setSettlements(res.data.filter(s => s.status === 'confirmed')))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateBatch = () => {
    form.validateFields().then(values => {
      axios.post('/api/payments/batches', { ...values, settlement_ids: values.settlement_ids.join(',') }).then(() => {
        message.success('打款批次创建成功')
        setBatchVisible(false)
        loadData()
      })
    })
  }

  const handleSuccess = (id) => {
    axios.post(`/api/payments/${id}/process`, { success: true }).then(() => {
      message.success('打款成功')
      loadData()
    })
  }

  const handleFail = (id) => {
    axios.post(`/api/payments/${id}/process`, { success: false }).then(() => {
      message.success('已标记失败')
      loadData()
    })
  }

  const handleRetry = (id) => {
    axios.post(`/api/payments/${id}/retry`).then(() => {
      message.success('已发起重试')
      loadData()
    })
  }

  const paymentColumns = [
    { title: '付款批次', dataIndex: 'batch_no' },
    { title: '结算单号', dataIndex: 'settlement_no' },
    { title: '收款人', dataIndex: 'freelancer_name' },
    { title: '金额', dataIndex: 'amount' },
    { title: '状态', dataIndex: 'status', render: v => ({ pending: <Tag color="orange">待处理</Tag>, success: <Tag color="green">成功</Tag>, failed: <Tag color="red">失败</Tag>, retrying: <Tag color="blue">重试中</Tag> }[v]) },
    { title: '失败原因', dataIndex: 'fail_reason' },
    { title: '重试次数', dataIndex: 'retry_count' },
    { title: '操作', render: (_, r) => r.status === 'pending' && (
      <Space>
        <Button size="small" type="primary" onClick={() => handleSuccess(r.id)}>成功</Button>
        <Button size="small" danger onClick={() => handleFail(r.id)}>失败</Button>
      </Space>
    ) }
  ]

  return (
    <div>
      <div className="page-title">打款管理</div>
      <div className="page-card">
        <Tabs defaultActiveKey="payments">
          <TabPane tab="打款记录" key="payments">
            <Table columns={paymentColumns} dataSource={payments} rowKey="id" />
          </TabPane>
          <TabPane tab="打款批次" key="batches">
            <Button type="primary" onClick={() => setBatchVisible(true)} style={{ marginBottom: 16 }}>创建打款批次</Button>
            <Table dataSource={batches} rowKey="id">
              <Table.Column title="批次号" dataIndex="batch_no" />
              <Table.Column title="批次名" dataIndex="batch_name" />
              <Table.Column title="总数" dataIndex="total_count" />
              <Table.Column title="总额" dataIndex="total_amount" />
              <Table.Column title="成功数" dataIndex="success_count" />
              <Table.Column title="失败数" dataIndex="fail_count" />
              <Table.Column title="状态" dataIndex="status" />
            </Table>
          </TabPane>
        </Tabs>
      </div>
      <Modal title="创建打款批次" open={batchVisible} onOk={handleCreateBatch} onCancel={() => setBatchVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item label="批次名称" name="batch_name"><Input /></Form.Item>
          <Form.Item label="选择结算单" name="settlement_ids">
            <Select mode="multiple" style={{ width: '100%' }}>
              {settlements.map(s => <Select.Option key={s.id} value={s.id}>{s.settlement_no} - {s.final_amount}元 - {s.freelancer_name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
