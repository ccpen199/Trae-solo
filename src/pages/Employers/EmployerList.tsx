import { useState } from 'react'
import { Table, Card, Input, Select, Tag, Button, Space, Row, Col, Progress, Tooltip } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { employerProfiles } from '@/mock/data'
import type { EmployerProfile } from '@/types'
import { useNavigate } from 'react-router-dom'

const creditLevelOptions = [
  { label: '全部', value: 'all' },
  { label: 'A+', value: 'A+' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
]

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '正常', value: 'active' },
  { label: '受限', value: 'restricted' },
  { label: '黑名单', value: 'blacklisted' },
]

const creditLevelTagColor: Record<string, string> = {
  'A+': 'green',
  A: 'blue',
  B: 'geekblue',
  C: 'orange',
  D: 'red',
}

const statusTagColor: Record<string, string> = {
  active: 'green',
  restricted: 'orange',
  blacklisted: 'red',
}

const statusLabel: Record<string, string> = {
  active: '正常',
  restricted: '受限',
  blacklisted: '黑名单',
}

const getCreditScoreColor = (score: number): string => {
  if (score >= 90) return '#52c41a'
  if (score >= 70) return '#1677ff'
  if (score >= 50) return '#fa8c16'
  return '#ff4d4f'
}

const EmployerList: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [creditLevel, setCreditLevel] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')

  const filteredData = employerProfiles.filter((item: EmployerProfile) => {
    const matchSearch =
      !searchText ||
      item.name.includes(searchText) ||
      item.phone.includes(searchText)
    const matchLevel = creditLevel === 'all' || item.creditLevel === creditLevel
    const matchStatus = status === 'all' || item.status === status
    return matchSearch && matchLevel && matchStatus
  })

  const handleReset = () => {
    setSearchText('')
    setCreditLevel('all')
    setStatus('all')
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '信用分',
      dataIndex: 'creditScore',
      key: 'creditScore',
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={getCreditScoreColor(score)}
          format={(val) => `${val}`}
        />
      ),
    },
    {
      title: '信用等级',
      dataIndex: 'creditLevel',
      key: 'creditLevel',
      render: (level: string) => (
        <Tag color={creditLevelTagColor[level]}>{level}</Tag>
      ),
    },
    {
      title: '总工单',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
    },
    {
      title: '完成工单',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
    },
    {
      title: '纠纷率',
      dataIndex: 'disputeRate',
      key: 'disputeRate',
      render: (rate: number) => {
        const percent = (rate * 100).toFixed(2)
        const isHigh = rate * 100 > 5
        return (
          <span style={{ color: isHigh ? '#ff4d4f' : undefined }}>
            {percent}%
          </span>
        )
      },
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={statusTagColor[s]}>{statusLabel[s]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: EmployerProfile) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/employers/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Input
              placeholder="姓名/手机号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              value={creditLevel}
              onChange={setCreditLevel}
              options={creditLevelOptions}
              style={{ width: 120 }}
              placeholder="信用等级"
            />
          </Col>
          <Col>
            <Select
              value={status}
              onChange={setStatus}
              options={statusOptions}
              style={{ width: 120 }}
              placeholder="状态"
            />
          </Col>
          <Col>
            <Button onClick={handleReset}>重置</Button>
          </Col>
        </Row>
      </Card>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default EmployerList
