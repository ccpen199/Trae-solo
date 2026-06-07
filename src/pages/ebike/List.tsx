import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Tag,
  Card,
  message,
  Spin,
  Empty,
  Input,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getMyEbikes } from '@/api/modules/ebike'
import type { EbikeRegistration } from '@/types'

const { RangePicker } = DatePicker

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待审核', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
}

export default function EbikeList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EbikeRegistration[]>([])
  const [status, setStatus] = useState<string>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [plateNumber, setPlateNumber] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        page: 1,
        pageSize: 20,
      }
      if (status) params.status = status
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const response = await getMyEbikes(params)
      setData(response.list)
    } catch (error) {
      message.error('获取列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [status, dateRange])

  const columns: ColumnsType<EbikeRegistration> = [
    {
      title: '车牌号',
      dataIndex: 'id',
      key: 'plateNumber',
      render: (_, record) => (
        <span className="font-mono font-semibold text-[#0052D9]">
          京{String(record.id).padStart(6, '0')}
        </span>
      ),
    },
    {
      title: '车架号',
      dataIndex: 'frameNumber',
      key: 'frameNumber',
      ellipsis: true,
      render: (text) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '品牌型号',
      key: 'brandModel',
      render: (_, record) => (
        <span>
          {record.brand} {record.model}
        </span>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
    },
    {
      title: '登记状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/ebike/detail/${record.id}`)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title={
          <div className="flex items-center gap-2">
            <ThunderboltOutlined className="text-[#722ED1]" />
            <span>电动车登记</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/ebike/register')}
          >
            新增登记
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <Space>
            <span className="text-gray-600">状态：</span>
            <Select
              placeholder="全部状态"
              style={{ width: 120 }}
              allowClear
              value={status}
              onChange={setStatus}
              options={[
                { value: 'pending', label: '待审核' },
                { value: 'approved', label: '已通过' },
                { value: 'rejected', label: '已驳回' },
              ]}
            />
          </Space>
          <Space>
            <span className="text-gray-600">日期：</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
          </Space>
          <Space>
            <span className="text-gray-600">车牌号：</span>
            <Input
              placeholder="搜索车牌号"
              prefix={<SearchOutlined />}
              style={{ width: 180 }}
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              onPressEnter={fetchData}
            />
          </Space>
          <Button onClick={fetchData}>查询</Button>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            locale={{
              emptyText: <Empty description="暂无登记记录" />,
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Spin>
      </Card>
    </div>
  )
}
