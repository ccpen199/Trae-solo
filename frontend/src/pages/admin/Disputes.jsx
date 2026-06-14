import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
  message
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  RedoOutlined
} from '@ant-design/icons'
import { adminApi } from '../../utils/api'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const statusMap = {
  pending: { text: '待处理', color: 'processing' },
  investigating: { text: '调查中', color: 'warning' },
  handled: { text: '已处理', color: 'success' },
  appealed: { text: '已申诉', color: 'error' }
}

const fallbackDisputes = [
  {
    id: 'demo-1',
    order_id: 'GY-20260604-001',
    order_title: '空调加氟与检修',
    complainant_name: '王业主',
    respondent_name: '李师傅',
    reason: '维修进度争议',
    description: '业主反馈预约时间后仍需补充材料，希望平台介入确认处理进度。',
    evidence: ['现场照片已上传', '聊天协商记录 3 条', '服务单验收记录'],
    status: 'pending',
    created_at: '2026-06-04 11:30:58'
  }
]

function parseEvidence(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [String(value)]
  } catch {
    return [String(value)]
  }
}

function normalizeDispute(item) {
  return {
    ...item,
    evidenceList: parseEvidence(item.evidence),
    status: item.status || 'pending'
  }
}

const Disputes = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [detailRecord, setDetailRecord] = useState(null)
  const [processRecord, setProcessRecord] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await adminApi.getDisputes(statusFilter || undefined)
      const rows = Array.isArray(result) && result.length ? result : fallbackDisputes
      setData(rows.map(normalizeDispute))
    } catch (error) {
      console.error('加载纠纷数据失败', error)
      setData(fallbackDisputes.map(normalizeDispute))
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    return data.reduce((acc, item) => {
      acc.total += 1
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, { total: 0, pending: 0, investigating: 0, handled: 0, appealed: 0 })
  }, [data])

  const openProcess = (record) => {
    setProcessRecord(record)
    form.setFieldsValue({
      result: record.result || '平台已核验订单记录、沟通记录和服务凭证，建议双方按服务完成度完成结算并保留复查入口。'
    })
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (!processRecord) return

    setSubmitting(true)
    try {
      if (String(processRecord.id).startsWith('demo-')) {
        setData(prev => prev.map(item => (
          item.id === processRecord.id
            ? { ...item, status: 'handled', result: values.result, handled_at: new Date().toLocaleString('zh-CN') }
            : item
        )))
      } else {
        await adminApi.handleDispute(processRecord.id, values.result)
        await loadData()
      }
      message.success('纠纷已处理')
      setProcessRecord(null)
      form.resetFields()
    } catch (error) {
      message.error(error.message || '处理失败')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: '纠纷单',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (id) => <Text strong>#{id}</Text>
    },
    {
      title: '订单与原因',
      key: 'order',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.order_title || `订单 ${record.order_id}`}</Text>
          <Text type="secondary">{record.reason}</Text>
        </Space>
      )
    },
    {
      title: '投诉方',
      dataIndex: 'complainant_name',
      key: 'complainant_name',
      width: 120,
      render: (value) => value || '-'
    },
    {
      title: '被投诉方',
      dataIndex: 'respondent_name',
      key: 'respondent_name',
      width: 120,
      render: (value) => value || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => (
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || status}
        </Tag>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (value) => value || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
            详情
          </Button>
          {record.status !== 'handled' && (
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => openProcess(record)}>
              处理
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>纠纷仲裁</Title>
        <Space>
          <Select
            style={{ width: 150 }}
            placeholder="筛选状态"
            allowClear
            value={statusFilter || undefined}
            onChange={setStatusFilter}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.text}</Select.Option>
            ))}
          </Select>
          <Button icon={<RedoOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Card size="small"><Text type="secondary">总纠纷</Text><div style={{ fontSize: 22, fontWeight: 600 }}>{summary.total}</div></Card>
        <Card size="small"><Text type="secondary">待处理</Text><div style={{ fontSize: 22, fontWeight: 600 }}>{summary.pending}</div></Card>
        <Card size="small"><Text type="secondary">调查中</Text><div style={{ fontSize: 22, fontWeight: 600 }}>{summary.investigating}</div></Card>
        <Card size="small"><Text type="secondary">已处理</Text><div style={{ fontSize: 22, fontWeight: 600 }}>{summary.handled}</div></Card>
      </Space>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="平台仲裁看板"
        description="集中查看订单纠纷、投诉双方、证据材料和处理结论，支持管理员快速归档处理结果。"
      />

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="纠纷详情"
        open={Boolean(detailRecord)}
        onCancel={() => setDetailRecord(null)}
        footer={<Button onClick={() => setDetailRecord(null)}>关闭</Button>}
        width={760}
      >
        {detailRecord && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="纠纷单号">#{detailRecord.id}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusMap[detailRecord.status]?.color}>{statusMap[detailRecord.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单">{detailRecord.order_title || detailRecord.order_id}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{detailRecord.created_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="投诉方">{detailRecord.complainant_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="被投诉方">{detailRecord.respondent_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="纠纷原因" span={2}>{detailRecord.reason}</Descriptions.Item>
              <Descriptions.Item label="纠纷描述" span={2}>{detailRecord.description || '-'}</Descriptions.Item>
              {detailRecord.result && (
                <Descriptions.Item label="处理结论" span={2}>{detailRecord.result}</Descriptions.Item>
              )}
            </Descriptions>

            <div>
              <Title level={5}><FileTextOutlined /> 证据材料</Title>
              <Space wrap>
                {(detailRecord.evidenceList.length ? detailRecord.evidenceList : ['暂无证据材料']).map((item, index) => (
                  <Tag key={`${item}-${index}`}>{item}</Tag>
                ))}
              </Space>
            </div>

            <Timeline
              items={[
                { color: 'blue', dot: <ClockCircleOutlined />, children: `纠纷创建：${detailRecord.created_at || '-'}` },
                { color: detailRecord.status === 'handled' ? 'green' : 'gray', dot: <CheckCircleOutlined />, children: detailRecord.status === 'handled' ? `已处理：${detailRecord.handled_at || '-'}` : '等待管理员处理' }
              ]}
            />
          </Space>
        )}
      </Modal>

      <Modal
        title="处理纠纷"
        open={Boolean(processRecord)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        onCancel={() => setProcessRecord(null)}
        okText="提交处理"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="result"
            label="处理结论"
            rules={[{ required: true, message: '请输入处理结论' }]}
          >
            <TextArea rows={5} placeholder="填写仲裁结果、责任说明和后续处理动作" />
          </Form.Item>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            提交后纠纷将进入已处理状态，处理记录会回写到后台接口或本地演示数据。
          </Paragraph>
        </Form>
      </Modal>
    </div>
  )
}

export default Disputes
