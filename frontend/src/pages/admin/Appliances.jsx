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
  Image
} from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import request from '../../utils/request'

const { Title } = Typography
const { Option } = Select

const Appliances = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [categories, setCategories] = useState([])

  const statusMap = {
    'available': { color: 'green', text: '可租' },
    'rented': { color: 'orange', text: '已租出' },
    'maintenance': { color: 'red', text: '维护中' }
  }

  const conditionMap = {
    'new': '全新',
    'like_new': '9成新',
    'good': '8成新',
    'fair': '7成新'
  }

  const loadCategories = async () => {
    try {
      const res = await request.get('/home/categories')
      setCategories(res.data || [])
    } catch (err) {
      console.error('Load categories error:', err)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/admin/appliances', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          keyword: searchText || undefined,
          category_id: categoryId || undefined,
          status: status || undefined
        }
      })
      setData(res.data?.list || [])
      setPagination(prev => ({ ...prev, total: res.data?.total || 0 }))
    } catch (err) {
      console.error('Load appliances error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadData()
  }, [pagination.current, pagination.pageSize])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    setTimeout(loadData, 0)
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="家电数据加载失败，请重试"
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
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (val) => (
        val ? (
          <Image
            width={50}
            height={50}
            src={val}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : '-'
      )
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name'
    },
    {
      title: '新旧程度',
      dataIndex: 'condition',
      key: 'condition',
      render: (val) => conditionMap[val] || val
    },
    {
      title: '月租金',
      dataIndex: 'monthly_rent',
      key: 'monthly_rent',
      render: (val) => `¥${(val || 0).toFixed(2)}`
    },
    {
      title: '押金',
      dataIndex: 'deposit',
      key: 'deposit',
      render: (val) => `¥${(val || 0).toFixed(2)}`
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (val) => val?.substring(0, 15) || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => {
        const s = statusMap[val] || { color: 'default', text: val }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    }
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>家电管理</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索家电名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 180 }}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            placeholder="分类"
            value={categoryId || undefined}
            onChange={(val) => setCategoryId(val)}
            style={{ width: 140 }}
            allowClear
          >
            {categories.map(cat => (
              <Option key={cat.id} value={cat.id}>{cat.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            value={status || undefined}
            onChange={(val) => setStatus(val)}
            style={{ width: 120 }}
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
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}

export default Appliances
