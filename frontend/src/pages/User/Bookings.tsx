import React, { useState, useEffect } from 'react'
import { 
  Card, List, Tag, Button, Modal, Form, Input, Select, message, 
  Space, Typography, Descriptions, Empty, Tabs, Table, Pagination
} from 'antd'
import { 
  CalendarOutlined, EnvironmentOutlined, PhoneOutlined, 
  ClockCircleOutlined, CheckCircleOutlined, 
  ExclamationCircleOutlined, SearchOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import dayjs from 'dayjs'
import type { VenueBooking } from '@/types'

const { Title, Text } = Typography
const { TabPane } = Tabs

const BookingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoggedIn, user, bookings, setBookings, addBooking, updateBooking } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<VenueBooking | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filteredBookings, setFilteredBookings] = useState<VenueBooking[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  useEffect(() => {
    if (isLoggedIn && bookings.length === 0) {
      loadBookings()
    }
  }, [isLoggedIn])

  useEffect(() => {
    filterBookings()
  }, [bookings, activeTab, searchKeyword, pagination.current])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const mockBookings: VenueBooking[] = [
        {
          id: 'BK20240101001',
          userId: user?.id || '',
          venueId: '1',
          venueName: '常州市图书馆',
          venueType: 'library',
          date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
          timeSlot: '09:00-11:00',
          status: 'confirmed',
          peopleCount: 2,
          contactName: user?.name || '张三',
          contactPhone: user?.phone || '138****1234',
          purpose: '看书学习',
          createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          venueAddress: '新北区龙城大道1288号',
          venueImage: ''
        },
        {
          id: 'BK20240101002',
          userId: user?.id || '',
          venueId: '2',
          venueName: '常州市体育馆',
          venueType: 'gym',
          date: dayjs().format('YYYY-MM-DD'),
          timeSlot: '14:00-16:00',
          status: 'completed',
          peopleCount: 4,
          contactName: user?.name || '张三',
          contactPhone: user?.phone || '138****1234',
          purpose: '羽毛球运动',
          createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          venueAddress: '天宁区健身路1号',
          venueImage: ''
        },
        {
          id: 'BK20240101003',
          userId: user?.id || '',
          venueId: '3',
          venueName: '常州市博物馆',
          venueType: 'museum',
          date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
          timeSlot: '10:00-12:00',
          status: 'cancelled',
          peopleCount: 3,
          contactName: user?.name || '张三',
          contactPhone: user?.phone || '138****1234',
          purpose: '参观展览',
          createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          cancelReason: '个人原因取消',
          venueAddress: '新北区龙城大道1288号',
          venueImage: ''
        },
        {
          id: 'BK20240101004',
          userId: user?.id || '',
          venueId: '5',
          venueName: '常州市市民广场',
          venueType: 'square',
          date: dayjs().add(5, 'day').format('YYYY-MM-DD'),
          timeSlot: '19:00-21:00',
          status: 'pending',
          peopleCount: 10,
          contactName: user?.name || '张三',
          contactPhone: user?.phone || '138****1234',
          purpose: '社区活动',
          createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          venueAddress: '新北区龙城大道',
          venueImage: ''
        },
        {
          id: 'BK20240101005',
          userId: user?.id || '',
          venueId: '4',
          venueName: '常州市青少年活动中心',
          venueType: 'activity_center',
          date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
          timeSlot: '08:30-10:30',
          status: 'confirmed',
          peopleCount: 1,
          contactName: user?.name || '张三',
          contactPhone: user?.phone || '138****1234',
          purpose: '机器人培训课程',
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          venueAddress: '天宁区竹林西路1号',
          venueImage: ''
        }
      ]
      setBookings(mockBookings)
    } catch (error) {
      message.error('加载预约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = [...bookings]
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.status === activeTab)
    }
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(item => 
        item.venueName.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword)
      )
    }
    
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    setFilteredBookings(filtered.slice(start, end))
    setPagination(p => ({ ...p, total: filtered.length }))
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'warning', text: '待确认' },
      confirmed: { color: 'success', text: '已确认' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'error', text: '已取消' },
      expired: { color: 'default', text: '已过期' }
    }
    const info = statusMap[status] || statusMap.pending
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getVenueTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      gym: '体育场馆',
      library: '图书馆',
      museum: '博物馆',
      activity_center: '活动中心',
      square: '市民广场',
      theatre: '剧院'
    }
    return typeMap[type] || '其他'
  }

  const viewDetail = (booking: VenueBooking) => {
    setCurrentBooking(booking)
    setDetailModal(true)
  }

  const handleCancel = async (bookingId: string) => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消这个预约吗？',
      onOk: async () => {
        try {
          setBookings(bookings.map(b =>
            b.id === bookingId
              ? { ...b, status: 'cancelled', updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
              : b
          ))
          message.success('预约已取消')
        } catch (error) {
          message.error('取消失败，请重试')
        }
      }
    })
  }

  if (!isLoggedIn) {
    navigate('/login')
    return null
  }

  const columns = [
    {
      title: '预约编号',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '场馆名称',
      dataIndex: 'venueName',
      key: 'venueName',
      render: (text: string, record: VenueBooking) => (
        <Space>
          <a onClick={() => navigate('/venues')}>{text}</a>
          <Tag color="blue">{getVenueTypeText(record.venueType)}</Tag>
        </Space>
      )
    },
    {
      title: '预约日期',
      key: 'dateTime',
      width: 200,
      render: (_: any, record: VenueBooking) => (
        <div>
          <div><CalendarOutlined style={{ marginRight: 4 }} />{record.date}</div>
          <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />{record.timeSlot}
          </div>
        </div>
      )
    },
    {
      title: '人数',
      dataIndex: 'peopleCount',
      key: 'peopleCount',
      width: 80,
      render: (count: number) => `${count}人`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: VenueBooking) => (
        <Space>
          <Button type="link" onClick={() => viewDetail(record)}>详情</Button>
          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Button type="link" danger onClick={() => handleCancel(record.id)}>取消</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Card 
        className="card-shadow"
        title={
          <Space>
            <CalendarOutlined />
            <span>我的预约</span>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              共 {bookings.length} 条预约记录
            </Text>
          </Space>
        }
        extra={
          <Input.Search
            placeholder="搜索场馆名称或预约编号"
            allowClear
            style={{ width: 280 }}
            onSearch={(value) => { setSearchKeyword(value); setPagination(p => ({ ...p, current: 1 })); }}
            onChange={(e) => !e.target.value && setSearchKeyword('')}
            prefix={<SearchOutlined />}
          />
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => { setActiveTab(key); setPagination(p => ({ ...p, current: 1 })); }}
          style={{ marginBottom: 16 }}
        >
          <TabPane tab={`全部 (${bookings.length})`} key="all" />
          <TabPane tab={`待确认 (${bookings.filter(b => b.status === 'pending').length})`} key="pending" />
          <TabPane tab={`已确认 (${bookings.filter(b => b.status === 'confirmed').length})`} key="confirmed" />
          <TabPane tab={`已完成 (${bookings.filter(b => b.status === 'completed').length})`} key="completed" />
          <TabPane tab={`已取消 (${bookings.filter(b => b.status === 'cancelled').length})`} key="cancelled" />
        </Tabs>

        {filteredBookings.length === 0 && !loading ? (
          <Empty description="暂无预约记录" />
        ) : (
          <>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredBookings}
              loading={loading}
              pagination={false}
              size="middle"
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total) => `共 ${total} 条`}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        title="预约详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={650}
      >
        {currentBooking && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{currentBooking.venueName}</Title>
              {getStatusTag(currentBooking.status)}
              <Tag>{getVenueTypeText(currentBooking.venueType)}</Tag>
            </Space>

            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="预约编号">{currentBooking.id}</Descriptions.Item>
              <Descriptions.Item label="预约日期">{currentBooking.date}</Descriptions.Item>
              <Descriptions.Item label="预约时段">{currentBooking.timeSlot}</Descriptions.Item>
              <Descriptions.Item label="预约人数">{currentBooking.peopleCount}人</Descriptions.Item>
              <Descriptions.Item label="场馆地址">{currentBooking.venueAddress}</Descriptions.Item>
              <Descriptions.Item label="使用目的">{currentBooking.purpose}</Descriptions.Item>
              <Descriptions.Item label="联系人">{currentBooking.contactName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentBooking.contactPhone}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{currentBooking.createdAt}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{currentBooking.updatedAt}</Descriptions.Item>
            </Descriptions>

            {currentBooking.cancelReason && (
              <Card 
              size="small" 
              style={{ marginBottom: 16, backgroundColor: '#fff2f0', borderColor: '#ffccc7' }}
            >
              <div style={{ color: '#ff4d4f' }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                <strong>取消原因：</strong>{currentBooking.cancelReason}
              </div>
            </Card>
          )}

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                {(currentBooking.status === 'pending' || currentBooking.status === 'confirmed') && (
                  <Button danger onClick={() => handleCancel(currentBooking.id)}>取消预约</Button>
                )}
                <Button type="primary" onClick={() => navigate('/venues')}>再次预约</Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default BookingsPage
