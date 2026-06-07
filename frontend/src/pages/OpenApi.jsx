import { useState } from 'react'
import {
  Card,
  Tag,
  Table,
  Typography,
  Input,
  Select,
  Button,
  Space,
  DatePicker,
  message,
} from 'antd'
import { CopyOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../utils/request'

const { Paragraph, Text } = Typography

const endpoints = [
  {
    key: 'toll-stats',
    method: 'GET',
    path: '/open/toll-stats',
    title: '通行数据统计',
    description: '获取通行数据按日统计汇总',
    params: [
      { name: 'startDate', type: 'string', required: true, desc: '开始日期 (YYYY-MM-DD)' },
      { name: 'endDate', type: 'string', required: true, desc: '结束日期 (YYYY-MM-DD)' },
    ],
    headers: [
      { name: 'x-api-key', required: true, desc: '开放API密钥' },
    ],
    responseExample: JSON.stringify(
      {
        code: 200,
        data: [
          {
            date: '2026-01-15',
            total_passes: 128450,
            total_fee: 3562800.5,
            avg_fee: 27.74,
          },
        ],
      },
      null,
      2
    ),
  },
  {
    key: 'traffic-flow',
    method: 'GET',
    path: '/open/traffic-flow',
    title: '交通流量分析',
    description: '按门架/收费站/路段维度分析流量',
    params: [
      { name: 'startDate', type: 'string', required: true, desc: '开始日期 (YYYY-MM-DD)' },
      { name: 'endDate', type: 'string', required: true, desc: '结束日期 (YYYY-MM-DD)' },
    ],
    headers: [],
    responseExample: JSON.stringify(
      {
        code: 200,
        data: [
          {
            dimension: 'gantry',
            name: 'G001-济南西',
            flow_count: 28450,
            peak_hour: '08:00-09:00',
            peak_flow: 3200,
          },
        ],
      },
      null,
      2
    ),
  },
  {
    key: 'anomaly-summary',
    method: 'GET',
    path: '/open/anomaly-summary',
    title: '异常事件汇总',
    description: '获取异常事件分布与处理率统计',
    params: [
      { name: 'startDate', type: 'string', required: true, desc: '开始日期 (YYYY-MM-DD)' },
      { name: 'endDate', type: 'string', required: true, desc: '结束日期 (YYYY-MM-DD)' },
    ],
    headers: [],
    responseExample: JSON.stringify(
      {
        code: 200,
        data: {
          total_anomalies: 1250,
          resolved_rate: 0.87,
          by_type: {
            deduction_failed: 450,
            path_missing: 520,
            duplicate_billing: 280,
          },
        },
      },
      null,
      2
    ),
  },
]

const endpointOptions = endpoints.map((ep) => ({
  value: ep.key,
  label: `${ep.method} ${ep.path} - ${ep.title}`,
}))

function EndpointCard({ ep }) {
  const paramColumns = [
    { title: '参数名', dataIndex: 'name', key: 'name', width: 140 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      width: 60,
      render: (val) => (val ? <Tag color="red">是</Tag> : <Tag>否</Tag>),
    },
    { title: '说明', dataIndex: 'desc', key: 'desc' },
  ]

  return (
    <Card
      title={
        <Space>
          <Tag color="blue">{ep.method}</Tag>
          <Text strong>{ep.path}</Text>
          <Text type="secondary">— {ep.title}</Text>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <p style={{ marginTop: 0, marginBottom: 16 }}>{ep.description}</p>

      {ep.headers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>请求头</Text>
          <div style={{ marginTop: 8 }}>
            {ep.headers.map((h) => (
              <div key={h.name}>
                <Tag color="orange">{h.name}</Tag>
                <Text type="secondary">{h.desc}</Text>
                {h.required && <Tag color="red" style={{ marginLeft: 4 }}>必填</Tag>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Text strong>查询参数</Text>
        <Table
          rowKey="name"
          columns={paramColumns}
          dataSource={ep.params}
          pagination={false}
          size="small"
          style={{ marginTop: 8 }}
        />
      </div>

      <div>
        <Text strong>响应示例</Text>
        <Paragraph>
          <pre
            style={{
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 6,
              overflow: 'auto',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <code>{ep.responseExample}</code>
          </pre>
        </Paragraph>
      </div>
    </Card>
  )
}

export default function OpenApi() {
  const [apiKey] = useState('etc_open_api_key_2026')
  const [selectedEp, setSelectedEp] = useState('toll-stats')
  const [testStartDate, setTestStartDate] = useState(() => dayjs('2026-01-01'))
  const [testEndDate, setTestEndDate] = useState(() => dayjs('2026-12-31'))
  const [testLoading, setTestLoading] = useState(false)
  const [testResponse, setTestResponse] = useState('')

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      message.success('API Key 已复制到剪贴板')
    })
  }

  const handleTestRequest = async () => {
    if (!selectedEp) {
      message.warning('请选择接口')
      return
    }
    const ep = endpoints.find((e) => e.key === selectedEp)
    if (!ep) return

    setTestLoading(true)
    setTestResponse('')
    try {
      const params = {}
      if (testStartDate) params.startDate = testStartDate.format('YYYY-MM-DD')
      if (testEndDate) params.endDate = testEndDate.format('YYYY-MM-DD')
      const res = await request.get(ep.path, {
        params,
        headers: { 'x-api-key': apiKey },
      })
      setTestResponse(JSON.stringify(res.data, null, 2))
    } catch (err) {
      setTestResponse(
        JSON.stringify(
          {
            error: true,
            status: err.response?.status,
            message: err.response?.data?.message || err.message,
          },
          null,
          2
        )
      )
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>数据开放API</h2>

      <Card title="API 密钥" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">
              地市交通局合作伙伴可通过此密钥访问开放数据接口，请妥善保管。
            </Text>
          </div>
          <Space.Compact style={{ maxWidth: 480 }}>
            <Input
              value={apiKey}
              readOnly
              style={{ width: '100%' }}
            />
            <Button icon={<CopyOutlined />} onClick={handleCopyKey} />
          </Space.Compact>
        </Space>
      </Card>

      {endpoints.map((ep) => (
        <EndpointCard key={ep.key} ep={ep} />
      ))}

      <Card title="接口测试" style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Select
              placeholder="选择接口"
              value={selectedEp}
              onChange={setSelectedEp}
              options={endpointOptions}
              style={{ width: 400 }}
            />
            <DatePicker
              placeholder="开始日期"
              value={testStartDate}
              onChange={setTestStartDate}
            />
            <DatePicker
              placeholder="结束日期"
              value={testEndDate}
              onChange={setTestEndDate}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleTestRequest}
              loading={testLoading}
            >
              发送请求
            </Button>
          </Space>
          {testResponse && (
            <pre
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 6,
                overflow: 'auto',
                fontSize: 13,
                lineHeight: 1.5,
                maxHeight: 400,
              }}
            >
              <code>{testResponse}</code>
            </pre>
          )}
        </Space>
      </Card>
    </div>
  )
}
