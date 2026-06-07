import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Select,
  DatePicker,
  Space,
  Table,
  Tag,
  message,
  Spin,
  Empty
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getMyViolations, getViolationTypes } from '@/api/modules/violation'
import type { ViolationReport } from '@/types'

const { RangePicker } = DatePicker

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待审核', color: 'orange' },
  valid: { text: '已采纳', color: 'green' },
  invalid: { text: '未采纳', color: 'red' }
}

const violationTypeMap: Record<string, string> = {
  red_light: '闯红灯',
  parking: '违停',
  lane_change: '压线',
  reverse: '逆行',
  speeding: '超速',
  other: '其他'
}

export default function ViolationList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ViolationReport[]>([])
  const [total, setTotal] = useState(0)
  const [types, setTypes] = useState<Array<{ code: string; name: string }>>([])
  const [filters, setFilters] = useState({
    status: '',
    violationType: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize
      }
      if (filters.status) params.status = filters.status
      if (filters.violationType) params.violationType = filters.violationType
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate

      const res = await getMyViolations(params)
      setData(res.list)
      setTotal(res.total)
    } catch (error: any) {
      message.error(error.message || '获取列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchTypes = async () => {
    try {
      const res = await getViolationTypes()
      setTypes(res)
    } catch (error: any) {
      message.error(error.message || '获取违法类型失败')
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  useEffect(() => {
    fetchData()
  }, [pagination, filters])

  const columns: ColumnsType<ViolationReport> = [
    {
      title: '违法类型',
      dataIndex: 'violationType',
      key: 'violationType',
      render: (type: string) => (
        <Space>
          <CameraOutlined className="text-blue-500" />
          <span>{violationTypeMap[type] || type}</span>
        </Space>
      )
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (location: string) => (
        <Space>
          <EnvironmentOutlined className="text-gray-400" />
          <span>{location || '未知位置'}</span>
        </Space>
      )
    },
    {
      title: '违法时间',
      dataIndex: 'violationTime',
      key: 'violationTime',
      render: (time: string) => (
        <Space>
          <ClockCircleOutlined className="text-gray-400" />
          <span>{dayjs(time).format('YYYY-MM-DD HH:mm')}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '举报时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/violation/detail/${record.id}`)}
        >
          查看详情
        </Button>
      )
    }
  ]

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchData()
  }

  const handleReset = () => {
    setFilters({
      status: '',
      violationType: '',
      startDate: '',
      endDate: ''
    })
    setPagination({ ...pagination, current: 1 })
  }

  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      })
    } else {
      setFilters({
        ...filters,
        startDate: '',
        endDate: ''
      })
    }
  }

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">违法随手拍</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/violation/report')}
          >
            新增举报
          </Button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <Space wrap size="middle">
            <Select
              placeholder="选择状态"
              style={{ width: 150 }}
              allowClear
              value={filters.status || undefined}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
            >
              <Select.Option value="pending">待审核</Select.Option>
              <Select.Option value="valid">已采纳</Select.Option>
              <Select.Option value="invalid">未采纳</Select.Option>
            </Select>

            <Select
              placeholder="违法类型"
              style={{ width: 150 }}
              allowClear
              value={filters.violationType || undefined}
              onChange={(value) => setFilters({ ...filters, violationType: value || '' })}
            >
              {types.map((type) => (
                <Select.Option key={type.code} value={type.code}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>

            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={handleDateChange}
            />

            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>

            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          {data.length > 0 ? (
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) =>
                  setPagination({ current: page, pageSize })
              }}
            />
          ) : (
            <Empty
              description={loading ? '' : '暂无举报记录'}
              className="py-12"
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}
