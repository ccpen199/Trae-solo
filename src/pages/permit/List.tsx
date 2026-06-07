import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  Input,
  message,
  Spin,
  Empty,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  QrcodeOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { getMyPermits, renewPermit } from '@/api/modules/permit'
import type { PermitApplication, PermitStatus } from '@/types'
import Verify from './Verify'

const { RangePicker } = DatePicker
const { Option } = Select

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'expired', label: '已过期' },
]

const vehicleTypeMap: Record<string, string> = {
  small: '小型汽车',
  large: '大型汽车',
  truck: '货车',
  motorcycle: '摩托车',
  other: '其他',
}

const statusColorMap: Record<PermitStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  expired: 'default',
}

const statusTextMap: Record<PermitStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已过期',
  expired: '已过期',
}

export default function List() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PermitApplication[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [searchText, setSearchText] = useState('')
  const [verifyModalVisible, setVerifyModalVisible] = useState(false)
  const [selectedPermit, setSelectedPermit] = useState<PermitApplication | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      }
      if (statusFilter) {
        params.status = statusFilter
      }
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const response = await getMyPermits(params)
      let list = response.list
      if (searchText) {
        list = list.filter((item) =>
          item.plateNumber.includes(searchText.toUpperCase())
        )
      }
      setData(list)
      setTotal(response.total)
    } catch (error: any) {
      message.error(error.message || '获取列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination, statusFilter, dateRange])

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 })
    fetchData()
  }

  const handleReset = () => {
    setStatusFilter('')
    setDateRange(null)
    setSearchText('')
    setPagination({ page: 1, pageSize: 10 })
  }

  const handleRenew = async (id: number) => {
    try {
      await renewPermit(id)
      message.success('续期申请已提交')
      fetchData()
    } catch (error: any) {
      message.error(error.message || '续期失败')
    }
  }

  const handleVerify = (record: PermitApplication) => {
    setSelectedPermit(record)
    setVerifyModalVisible(true)
  }

  const columns: ColumnsType<PermitApplication> = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      width: 120,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '车辆类型',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      width: 100,
      render: (text) => vehicleTypeMap[text] || text,
    },
    {
      title: '进京时段',
      key: 'period',
      width: 220,
      render: (_, record) => (
        <span>
          {record.startDate} 至 {record.endDate}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PermitStatus) => (
        <Tag color={statusColorMap[status]}>{statusTextMap[status]}</Tag>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => text.split('T')[0],
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/permit/detail/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'approved' && (
            <Popconfirm
              title="确定要续期吗？"
              onConfirm={() => handleRenew(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<EditOutlined />}>
                续期
              </Button>
            </Popconfirm>
          )}
          {record.status === 'approved' && (
            <Button
              type="link"
              size="small"
              icon={<QrcodeOutlined />}
              onClick={() => handleVerify(record)}
            >
              核验
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl font-bold text-gray-800">进京证管理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/permit/apply')}
            style={{ backgroundColor: '#0052D9' }}
          >
            新增申请
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">状态：</span>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              allowClear
            >
              {statusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">日期：</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] || null)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="搜索车牌号"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 150 }}
              allowClear
            />
            <Button type="primary" onClick={handleSearch} style={{ backgroundColor: '#0052D9' }}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total,
              onChange: (page, pageSize) => setPagination({ page, pageSize }),
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            locale={{
              emptyText: <Empty description="暂无数据" />,
            }}
            scroll={{ x: 800 }}
          />
        </Spin>
      </Card>

      <Verify
        visible={verifyModalVisible}
        permit={selectedPermit}
        onClose={() => setVerifyModalVisible(false)}
      />
    </div>
  )
}
