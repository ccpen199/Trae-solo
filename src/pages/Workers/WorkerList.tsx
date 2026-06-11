import { useState } from 'react'
import { Table, Card, Input, Select, Tag, Button, Space, Row, Col, Progress, Tooltip, Badge } from 'antd'
import { SearchOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons'
import { workerProfiles } from '@/mock/data'
import type { WorkerProfile, WorkerLevel } from '@/types'
import { useNavigate } from 'react-router-dom'

const levelColorMap: Record<WorkerLevel, string> = {
  L1: 'green',
  L2: 'blue',
  L3: 'orange',
  L4: 'red',
}

const statusColorMap: Record<WorkerProfile['status'], string> = {
  active: 'green',
  suspended: 'red',
  recertifying: 'orange',
  inactive: 'default',
}

const statusLabelMap: Record<WorkerProfile['status'], string> = {
  active: '在岗',
  suspended: '停岗',
  recertifying: '复培中',
  inactive: '离岗',
}

const identityBadgeMap: Record<string, { status: 'success' | 'processing' | 'error'; text: string }> = {
  verified: { status: 'success', text: '已核验' },
  pending: { status: 'processing', text: '待核验' },
  rejected: { status: 'error', text: '已驳回' },
}

const medicalTagMap: Record<string, { color: string; text: string }> = {
  verified: { color: 'green', text: '已验证' },
  ocr_processed: { color: 'blue', text: '已识别' },
  uploaded: { color: 'orange', text: '待识别' },
  none: { color: 'default', text: '未上传' },
}

const categoryOptions = [
  { label: '月嫂', value: '月嫂' },
  { label: '育儿嫂', value: '育儿嫂' },
  { label: '保洁', value: '保洁' },
  { label: '养老护理', value: '养老护理' },
  { label: '钟点工', value: '钟点工' },
  { label: '家电清洗', value: '家电清洗' },
]

const WorkerList: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [identityFilter, setIdentityFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const filteredData = workerProfiles.filter((worker) => {
    if (searchText) {
      const text = searchText.toLowerCase()
      if (!worker.name.toLowerCase().includes(text) && !worker.phone.includes(text)) {
        return false
      }
    }
    if (levelFilter && worker.level !== levelFilter) return false
    if (statusFilter && worker.status !== statusFilter) return false
    if (identityFilter && worker.identity.status !== identityFilter) return false
    if (categoryFilter && !worker.serviceCategories.includes(categoryFilter)) return false
    return true
  })

  const handleReset = () => {
    setSearchText('')
    setLevelFilter('')
    setStatusFilter('')
    setIdentityFilter('')
    setCategoryFilter('')
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1677ff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {name.charAt(0)}
          </div>
          {name}
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '技能等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: WorkerLevel) => (
        <Tag color={levelColorMap[level]}>{level}</Tag>
      ),
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '服务半径',
      dataIndex: 'serviceRadius',
      key: 'serviceRadius',
      render: (radius: number) => `${radius} km`,
    },
    {
      title: '身份核验',
      key: 'identity',
      render: (_: unknown, record: WorkerProfile) => {
        const badge = identityBadgeMap[record.identity.status]
        return <Badge status={badge.status} text={badge.text} />
      },
    },
    {
      title: '体检状态',
      key: 'medical',
      render: (_: unknown, record: WorkerProfile) => {
        const tag = medicalTagMap[record.medical.status]
        return <Tag color={tag.color}>{tag.text}</Tag>
      },
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Tooltip title={`${rating} / 5.0`}>
          <Progress
            percent={Math.round((rating / 5) * 100)}
            format={() => rating.toFixed(1)}
            steps={5}
            size="small"
            strokeColor="#1677ff"
          />
        </Tooltip>
      ),
    },
    {
      title: '工单数',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: WorkerProfile['status']) => (
        <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: WorkerProfile) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/workers/${record.id}`)}
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
            <FilterOutlined style={{ marginRight: 8, color: '#999' }} />
            <span style={{ fontWeight: 500 }}>筛选条件</span>
          </Col>
          <Col flex="auto">
            <Row gutter={16}>
              <Col span={5}>
                <Input
                  placeholder="姓名/手机号"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={3}>
                <Select
                  placeholder="技能等级"
                  value={levelFilter || undefined}
                  onChange={(val) => setLevelFilter(val ?? '')}
                  allowClear
                  style={{ width: '100%' }}
                  options={[
                    { label: 'L1', value: 'L1' },
                    { label: 'L2', value: 'L2' },
                    { label: 'L3', value: 'L3' },
                    { label: 'L4', value: 'L4' },
                  ]}
                />
              </Col>
              <Col span={3}>
                <Select
                  placeholder="服务状态"
                  value={statusFilter || undefined}
                  onChange={(val) => setStatusFilter(val ?? '')}
                  allowClear
                  style={{ width: '100%' }}
                  options={[
                    { label: '在岗', value: 'active' },
                    { label: '停岗', value: 'suspended' },
                    { label: '复培中', value: 'recertifying' },
                    { label: '离岗', value: 'inactive' },
                  ]}
                />
              </Col>
              <Col span={3}>
                <Select
                  placeholder="身份核验"
                  value={identityFilter || undefined}
                  onChange={(val) => setIdentityFilter(val ?? '')}
                  allowClear
                  style={{ width: '100%' }}
                  options={[
                    { label: '已核验', value: 'verified' },
                    { label: '待核验', value: 'pending' },
                    { label: '已驳回', value: 'rejected' },
                  ]}
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="服务类目"
                  value={categoryFilter || undefined}
                  onChange={(val) => setCategoryFilter(val ?? '')}
                  allowClear
                  style={{ width: '100%' }}
                  options={categoryOptions}
                />
              </Col>
              <Col>
                <Button onClick={handleReset}>重置</Button>
              </Col>
            </Row>
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

export default WorkerList
