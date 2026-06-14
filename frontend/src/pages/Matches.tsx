import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Progress,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Space,
  Popconfirm,
} from 'antd'
import { SearchOutlined, CheckOutlined, CloseOutlined, UserAddOutlined } from '@ant-design/icons'
import { api } from '@/api'
import type { JobMatch } from '@/types'

const { Option } = Select

interface MatchListItem extends Omit<JobMatch, 'matchScore' | 'skillMatchScore' | 'locationMatchScore' | 'performanceMatchScore' | 'jobId' | 'workerId' | 'createdAt'> {
  job_id: number
  worker_id: number
  project_name: string
  worker_name: string
  worker_phone: string
  trade_name: string
  daily_wage: number
  match_score: number
  skill_match_score: number
  location_match_score: number
  performance_match_score: number
  created_at: string
}

export default function Matches() {
  const [searchParams] = useSearchParams()
  const isMyView = searchParams.get('filter') === 'my'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [jobId, setJobId] = useState<number | null>(null)
  const [workerId, setWorkerId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    fetchMatches()
  }, [page, jobId, workerId, status, keyword])

  const fetchMatches = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, pageSize }
      if (jobId) params.jobId = jobId
      if (workerId) params.workerId = workerId
      if (status) params.status = status
      if (keyword) params.keyword = keyword

      const res = await api.getMatches(params)
      if (res.code === 0) {
        setMatches(res.data.list || res.data || [])
        setTotal(res.data.total || 0)
      } else {
        setError(res.message || '获取匹配列表失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handleResetFilters = () => {
    setJobId(null)
    setWorkerId(null)
    setStatus(null)
    setKeyword('')
    setPage(1)
  }

  const handleJobIdChange = (value: number | null) => {
    setJobId(value)
    setPage(1)
  }

  const handleWorkerIdChange = (value: number | null) => {
    setWorkerId(value)
    setPage(1)
  }

  const handleStatusChange = (value: string | null) => {
    setStatus(value)
    setPage(1)
  }

  const handleAccept = async (id: number) => {
    try {
      const res = await api.updateMatchStatus(id, 'accepted')
      if (res.code === 0) {
        message.success('已接受')
        fetchMatches()
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err: any) {
      message.error(err.message || '操作失败')
    }
  }

  const handleReject = async (id: number) => {
    try {
      const res = await api.updateMatchStatus(id, 'rejected')
      if (res.code === 0) {
        message.success('已拒绝')
        fetchMatches()
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err: any) {
      message.error(err.message || '操作失败')
    }
  }

  const handleHire = async (id: number) => {
    try {
      const res = await api.updateMatchStatus(id, 'hired')
      if (res.code === 0) {
        message.success('已录用')
        fetchMatches()
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err: any) {
      message.error(err.message || '操作失败')
    }
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待确认' },
    accepted: { color: 'blue', text: '已接受' },
    rejected: { color: 'default', text: '已拒绝' },
    hired: { color: 'green', text: '已录用' },
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '工人姓名',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 120,
    },
    {
      title: '工人电话',
      dataIndex: 'worker_phone',
      key: 'worker_phone',
      width: 130,
    },
    {
      title: '工种',
      dataIndex: 'trade_name',
      key: 'trade_name',
      width: 100,
    },
    {
      title: '日薪',
      dataIndex: 'daily_wage',
      key: 'daily_wage',
      width: 100,
      render: (wage: number) => `¥${wage}`,
    },
    {
      title: '匹配总分',
      dataIndex: 'match_score',
      key: 'match_score',
      width: 150,
      render: (score: number) => (
        <Progress
          percent={Math.round(score)}
          size="small"
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: '技能匹配分',
      dataIndex: 'skill_match_score',
      key: 'skill_match_score',
      width: 110,
      render: (score: number) => `${score?.toFixed(1) || '-'}`,
    },
    {
      title: '位置匹配分',
      dataIndex: 'location_match_score',
      key: 'location_match_score',
      width: 110,
      render: (score: number) => `${score?.toFixed(1) || '-'}`,
    },
    {
      title: '履约匹配分',
      dataIndex: 'performance_match_score',
      key: 'performance_match_score',
      width: 110,
      render: (score: number) => `${score?.toFixed(1) || '-'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const info = statusMap[s] || statusMap.pending
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '匹配时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: MatchListItem) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确认接受"
                description="确定要接受该匹配吗？"
                onConfirm={() => handleAccept(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<CheckOutlined />}>
                  接受
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确认拒绝"
                description="确定要拒绝该匹配吗？"
                onConfirm={() => handleReject(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<CloseOutlined />}>
                  拒绝
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'accepted' && (
            <Popconfirm
              title="确认录用"
              description="确定要录用该工人吗？"
              onConfirm={() => handleHire(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<UserAddOutlined />}>
                录用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>{isMyView ? '我的匹配结果' : '智能匹配管理'}</h2>
          {isMyView && (
            <span style={{ color: '#8c8c8c' }}>集中查看当前账号的推荐、接受、拒绝和录用状态。</span>
          )}
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Input
            placeholder="项目ID"
            allowClear
            type="number"
            style={{ width: '100%' }}
            onChange={(e) => handleJobIdChange(e.target.value ? parseInt(e.target.value) : null)}
          />
        </Col>
        <Col span={5}>
          <Input
            placeholder="工人ID"
            allowClear
            type="number"
            style={{ width: '100%' }}
            onChange={(e) => handleWorkerIdChange(e.target.value ? parseInt(e.target.value) : null)}
          />
        </Col>
        <Col span={5}>
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: '100%' }}
            value={status}
            onChange={handleStatusChange}
          >
            {Object.entries(statusMap).map(([key, value]) => (
              <Option key={key} value={key}>
                {value.text}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={9}>
          <Input.Search
            placeholder="搜索项目名称、工人姓名、工人电话"
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
          />
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Button onClick={handleResetFilters}>重置筛选</Button>
        {isMyView && <Tag color="blue">我的匹配</Tag>}
        {keyword && <Tag color="purple">搜索：{keyword}</Tag>}
        {status && <Tag color="orange">状态：{statusMap[status]?.text || status}</Tag>}
      </Space>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={matches}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Spin>
    </div>
  )
}
