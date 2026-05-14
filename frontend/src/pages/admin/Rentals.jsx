import { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Input, 
  Space, 
  Spin, 
  Result,
  Select,
  Typography,
  Modal,
  Descriptions
} from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import request from '../../utils/request'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

const Rentals = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [status, setStatus] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailData, setDetailData] = useState(null)

  const statusMap = {
    'pending': { color: 'orange', text: '待确认' },
    'active': { color: 'green', text: '进行中' },
    'completed': { color: 'blue', text: '已完成' },
    'cancelled': { color: 'red', text: '已取消' },
    'sublet': { color: 'purple', text: '已转租' }
  }

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/admin/rentals', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          keyword: searchText || undefined,
          status: status || undefined
        }
      })
      setData(res.data?.list || [])
      setPagination(prev => ({ ...prev, total: res.data?.total || 0 }))
    } catch (err) {
      console.error('Load rentals error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    setTimeout(loadData, 0)
  }

  const showDetail = async (id) => {
    try {
      const res = await request.get(`/rental/${id}`)
      setDetailData(res.data)
      setDetailVisible(true)
    } catch (err) {
      console.error('Load detail error:', err)
    }
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="订单数据加载失败，请重试"
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>
            重新加载
          </Button>
        }
      />
    )
  }

  const columns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '家电名称',
      dataIndex: ['appliance', 'name'],
      key: 'appliance_name',
      render: (_, record) => record.appliance?.name || '-'
    },
    {
      title: '用户手机号',
      dataIndex: ['user', 'phone'],
      key: 'user_phone',
      render: (_, record) => record.user?.phone || '-'
    },
    {
      title: '租期',
      key: 'period',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.start_date).format('YYYY-MM-DD')}</div>
          <div>~ {dayjs(record.end_date).format('YYYY-MM-DD')}</div>
        </div>
      )
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => `¥${(val || 0).toFixed(2)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => {
        const s = statusMap[val] || { color: 'default', text: val }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record.id)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>订单管理</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索订单ID或家电名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            placeholder="订单状态"
            value={status || undefined}
            onChange={(val) => setStatus(val)}
            style={{ width: 140 }}
            allowClear
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize, total: pagination.total })
            },
            onShowSizeChange: (page, pageSize) => {
              setPagination({ current: 1, pageSize, total: pagination.total })
            }
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {detailData && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单ID">{detailData.id}</Descriptions.Item>
            <Descriptions.Item label="家电名称">{detailData.appliance?.name}</Descriptions.Item>
            <Descriptions.Item label="用户">{detailData.user?.phone}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{detailData.start_date}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{detailData.end_date}</Descriptions.Item>
            <Descriptions.Item label="月租金">¥{(detailData.monthly_rent || 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="总金额">¥{(detailData.total_amount || 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="押金">¥{(detailData.deposit || 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {statusMap[detailData.status]?.text || detailData.status}
            </Descriptions.Item>
            <Descriptions.Item label="付款方式">{detailData.payment_type === 'one_time' ? '一次性付清' : '月付'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{detailData.created_at}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default Rentals
