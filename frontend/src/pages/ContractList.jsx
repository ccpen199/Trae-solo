import React, { useEffect, useState } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, InputNumber, Descriptions, message, Select } from 'antd'
import { EyeOutlined, CheckCircleOutlined, PlusOutlined, LinkOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { getContracts, createContract, getConsultations, getLawyers } from '../api.js'
import dayjs from 'dayjs'

const ContractList = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()
  const [consultations, setConsultations] = useState([])
  const [lawyers, setLawyers] = useState([])
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [ctRes, cRes, lRes] = await Promise.all([getContracts(), getConsultations(), getLawyers()])
      setList(ctRes.data)
      setConsultations(cRes.data.filter(c => c.status === 'matched'))
      setLawyers(lRes.data)
    } catch (e) {
      console.error('Contract load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (values) => {
    try {
      await createContract(values)
      message.success('合约创建成功，电子签章链已生成')
      setCreateOpen(false)
      form.resetFields()
      load()
    } catch (e) {
      message.error('创建失败')
    }
  }

  const statusLabels = { draft: '草稿', active: '生效中', signed: '已签署', terminated: '已终止' }
  const statusColors = { draft: 'gray', active: 'green', signed: 'blue', terminated: 'red' }

  const filtered = list.filter(c => !statusFilter || c.status === statusFilter)

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: '客户', dataIndex: 'client_name', width: 100 },
    { title: '律师', dataIndex: 'lawyer_name', width: 100 },
    { title: '咨询ID', dataIndex: 'consultation_id', width: 80, render: v => `#${v}` },
    {
      title: '小时费率', dataIndex: 'hourly_rate', width: 110,
      render: v => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{v}/小时</span>
    },
    {
      title: '委托范围', dataIndex: 'scope',
      render: v => <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: v => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
    },
    {
      title: '电子签章', dataIndex: 'signature_chain', width: 100,
      render: v => v
        ? <Tag color="green" icon={<CheckCircleOutlined />}>已存证</Tag>
        : <Tag color="orange">待签署</Tag>
    },
    { title: '创建时间', dataIndex: 'created_at', width: 140, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', width: 80,
      render: (_, r) => <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
    }
  ]

  return (
    <div>
      <Card
        title={<Space><SafetyCertificateOutlined /> 服务合约管理</Space>}
        extra={
          <Space>
            <Select placeholder="状态筛选" style={{ width: 120 }} allowClear value={statusFilter || undefined} onChange={setStatusFilter}>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="active">生效中</Select.Option>
              <Select.Option value="signed">已签署</Select.Option>
              <Select.Option value="terminated">已终止</Select.Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>创建合约</Button>
          </Space>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 份合约` }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="📝 创建服务合约"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="consultation_id" label="关联咨询" rules={[{ required: true, message: '请选择关联咨询' }]}>
            <Select placeholder="请选择已匹配的咨询请求">
              {consultations.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  #{c.id} {c.title} ({c.case_code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="lawyer_id" label="签约律师" rules={[{ required: true, message: '请选择律师' }]}>
            <Select placeholder="请选择签约律师">
              {lawyers.map(l => (
                <Select.Option key={l.id} value={l.id}>
                  {l.name} - {l.specialties?.map(s => s.category).join(', ')} - 胜诉率{Math.round(l.win_rate * 100)}%
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="client_name" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}>
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item name="hourly_rate" label="小时费率（元/小时）" rules={[{ required: true, message: '请输入小时费率' }]}>
            <InputNumber style={{ width: '100%' }} min={100} max={5000} step={100} placeholder="如：500" />
          </Form.Item>
          <Form.Item name="scope" label="委托范围界定" rules={[{ required: true, message: '请输入委托范围' }]}>
            <Input.TextArea rows={3} placeholder="请详细描述委托代理的法律事务范围" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建合约并生成签章链</Button>
              <Button onClick={() => setCreateOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="📄 合约详情"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
        width={700}
      >
        {detail && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="合约ID">#{detail.id}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[detail.status]}>{statusLabels[detail.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户">{detail.client_name}</Descriptions.Item>
              <Descriptions.Item label="律师">{detail.lawyer_name}</Descriptions.Item>
              <Descriptions.Item label="关联咨询">#{detail.consultation_id}</Descriptions.Item>
              <Descriptions.Item label="小时费率">
                <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{detail.hourly_rate}/小时</span>
              </Descriptions.Item>
              <Descriptions.Item label="委托范围" span={2}>{detail.scope}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="电子签章">
                {detail.signature_chain
                  ? <Tag color="green" icon={<CheckCircleOutlined />}>区块链存证</Tag>
                  : <Tag color="orange">未签署</Tag>}
              </Descriptions.Item>
            </Descriptions>
            {detail.signature_chain && (
              <Card size="small" title={<Space><LinkOutlined /> 电子签章链</Space>} style={{ marginTop: 16 }} type="inner">
                <pre style={{ fontSize: 11, maxHeight: 150, overflow: 'auto', background: '#fafafa', padding: 12, borderRadius: 4 }}>
                  {JSON.stringify(JSON.parse(detail.signature_chain), null, 2)}
                </pre>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ContractList
