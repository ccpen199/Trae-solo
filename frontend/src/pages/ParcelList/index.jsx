import React, { useState, useEffect } from 'react'
import { Tabs, Table, Tag, Select, Input, Button, Card, Space, Spin, message } from 'antd'
import { SearchOutlined, ReloadOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import { getMyParcels, getFamilyParcels } from '../../api/parcels'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

const { Search } = Input
const { Option } = Select

function ParcelList() {
  const [activeTab, setActiveTab] = useState('mine')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchParcels()
  }, [activeTab, statusFilter])

  const fetchParcels = async () => {
    setLoading(true)
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const result = activeTab === 'mine' 
        ? await getMyParcels(params)
        : await getFamilyParcels(params)
      
      setData(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      message.error('获取包裹列表失败')
      console.error('Fetch parcels error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'transit': 'blue',
      'delivered': 'green',
      'anomaly': 'red',
      'pickup': 'purple'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      'pending': '待揽收',
      'transit': '运输中',
      'delivered': '已签收',
      'anomaly': '异常',
      'pickup': '待取件'
    }
    return texts[status] || status
  }

  const columns = [
    {
      title: '运单号',
      dataIndex: 'tracking_no',
      key: 'tracking_no',
      render: (text) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/trace/${text}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '包裹描述',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '快递包裹',
    },
    {
      title: '收件人',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => navigate(`/trace/${record.tracking_no}`)}>
            溯源
          </Button>
          {record.status === 'pickup' && (
            <Button type="link" onClick={() => navigate('/pickup')}>
              取件
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const filteredData = data.filter(item => 
    item.tracking_no?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.receiver_name?.includes(searchText) ||
    item.description?.includes(searchText)
  )

  const tabItems = [
    {
      key: 'mine',
      label: (
        <span>
          <UserOutlined /> 我的包裹
        </span>
      ),
    },
    {
      key: 'family',
      label: (
        <span>
          <TeamOutlined /> 亲友包裹
        </span>
      ),
    },
  ]

  return (
    <div className="page-container">
      <h2 className="page-title">我的包裹</h2>
      
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarExtraContent={
            <Space>
              <Select
                defaultValue="all"
                style={{ width: 120 }}
                onChange={setStatusFilter}
              >
                <Option value="all">全部状态</Option>
                <Option value="pending">待揽收</Option>
                <Option value="transit">运输中</Option>
                <Option value="pickup">待取件</Option>
                <Option value="delivered">已签收</Option>
                <Option value="anomaly">异常</Option>
              </Select>
              <Search
                placeholder="搜索运单号/收件人"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={(value) => setSearchText(value)}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchParcels}
              >
                刷新
              </Button>
            </Space>
          }
        />

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="tracking_no"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  )
}

export default ParcelList
