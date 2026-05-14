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
  Typography
} from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import request from '../../utils/request'

const { Title } = Typography

const Users = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/admin/users', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          keyword: searchText || undefined
        }
      })
      setData(res.data?.list || [])
      setPagination(prev => ({ ...prev, total: res.data?.total || 0 }))
    } catch (err) {
      console.error('Load users error:', err)
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

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="用户数据加载失败，请重试"
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
      width: 80
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '实名认证',
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (val) => (
        val === 1 ? 
          <Tag color="green">已认证</Tag> : 
          <Tag color="orange">未认证</Tag>
      )
    },
    {
      title: '账户余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (val) => `¥${(val || 0).toFixed(2)}`
    },
    {
      title: '冻结押金',
      dataIndex: 'frozen_deposit',
      key: 'frozen_deposit',
      render: (val) => `¥${(val || 0).toFixed(2)}`
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    }
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>用户管理</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索手机号或昵称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            onPressEnter={handleSearch}
            allowClear
          />
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
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  )
}

export default Users
