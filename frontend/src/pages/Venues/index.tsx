import { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Button,
  List,
  Tag,
  Space,
  Row,
  Col,
  DatePicker,
  TimePicker,
  Form,
  InputNumber,
  Result,
  Modal,
  Descriptions,
  Empty,
  Spin,
  App,
  Select,
  Image
} from 'antd'
import {
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import { Venue, VenueBooking } from '@/types'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const mockVenues: Venue[] = [
  {
    id: '1',
    name: '常州市体育馆',
    type: '体育场馆',
    address: '新北区晋陵北路1号',
    description: '常州市综合性体育场馆，拥有篮球馆、羽毛球馆、游泳池等设施，可举办各类体育赛事和活动。',
    capacity: 5000,
    openTime: '06:00',
    closeTime: '22:00',
    facilities: ['篮球场', '羽毛球场', '游泳池', '健身房', '乒乓球室'],
    available: true
  },
  {
    id: '2',
    name: '常州市图书馆',
    type: '文化场馆',
    address: '天宁区和平北路35号',
    description: '常州市大型公共图书馆，藏书丰富，设有阅览室、自习室、多媒体室等，提供图书借阅、数字资源等服务。',
    capacity: 2000,
    openTime: '09:00',
    closeTime: '21:00',
    facilities: ['图书借阅', '自习室', '多媒体室', '报告厅', '少儿阅览室'],
    available: true
  },
  {
    id: '3',
    name: '常州博物馆',
    type: '文化场馆',
    address: '新北区龙城大道1288号',
    description: '国家一级博物馆，收藏有各类文物藏品，展示常州历史文化，设有常设展览和临时展览。',
    capacity: 3000,
    openTime: '09:00',
    closeTime: '17:00',
    facilities: ['历史展厅', '自然展厅', '少儿展厅', '互动体验区', '文创商店'],
    available: true
  },
  {
    id: '4',
    name: '常州市青少年活动中心',
    type: '青少年活动',
    address: '钟楼区茶花路6号',
    description: '青少年校外教育活动场所，提供科技、艺术、体育等各类培训和活动。',
    capacity: 1500,
    openTime: '08:30',
    closeTime: '20:30',
    facilities: ['科技教室', '舞蹈房', '美术室', '音乐厅', '机器人实验室'],
    available: true
  },
  {
    id: '5',
    name: '市民广场',
    type: '户外场地',
    address: '新北区龙城大道',
    description: '常州市中心大型公共广场，适合举办各类大型活动、演出展览等。',
    capacity: 10000,
    openTime: '全天',
    closeTime: '全天',
    facilities: ['露天舞台', '休闲座椅', '音乐喷泉', '停车场'],
    available: true
  },
  {
    id: '6',
    name: '常州大剧院',
    type: '演出场馆',
    address: '新北区晋陵北路2号',
    description: '现代化专业剧院，可举办歌剧、舞剧、话剧、音乐会等各类演出。',
    capacity: 1500,
    openTime: '09:00',
    closeTime: '22:00',
    facilities: ['大剧场', '小剧场', '排练厅', '化妆间', '贵宾室'],
    available: false
  }
]

const timeSlots = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00',
  '18:00-19:00', '19:00-20:00', '20:00-21:00'
]

const Venues = () => {
  const navigate = useNavigate()
  const { notification } = App.useApp()
  const { isLoggedIn, userInfo, addBooking } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [bookingResult, setBookingResult] = useState<VenueBooking | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [form] = Form.useForm()

  useEffect(() => {
    loadVenues()
  }, [])

  useEffect(() => {
    filterVenues()
  }, [venues, searchKeyword, filterType])

  const loadVenues = () => {
    setLoading(true)
    setTimeout(() => {
      setVenues(mockVenues)
      setFilteredVenues(mockVenues)
      setLoading(false)
    }, 500)
  }

  const filterVenues = () => {
    let result = [...venues]
    if (filterType !== 'all') {
      result = result.filter((v) => v.type === filterType)
    }
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(keyword) ||
          v.address.toLowerCase().includes(keyword) ||
          v.description.toLowerCase().includes(keyword)
      )
    }
    setFilteredVenues(result)
  }

  const handleBooking = async () => {
    try {
      const values = await form.validateFields()
      if (!isLoggedIn) {
        navigate('/login')
        return
      }

      const booking: VenueBooking = {
        id: `booking${Date.now()}`,
        venueId: selectedVenue!.id,
        venueName: selectedVenue!.name,
        userId: userInfo!.id,
        userName: userInfo!.name,
        date: dayjs(values.date).format('YYYY-MM-DD'),
        timeSlot: values.timeSlot,
        peopleCount: values.peopleCount,
        phone: values.phone,
        status: 'confirmed',
        createdAt: dayjs().toISOString()
      }

      addBooking(booking)
      setBookingResult(booking)
      setShowBookingModal(false)
      setShowResult(true)

      notification.success({
        message: '预约成功',
        description: `您已成功预约${selectedVenue!.name}，请按时前往`,
        placement: 'topRight'
      })
    } catch (error) {
      console.error('预约失败:', error)
    }
  }

  const disabledDate = (current: any) => {
    return current && current < dayjs().startOf('day')
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>
              <CalendarOutlined style={{ color: '#1890ff', marginRight: 12 }} />
              场馆预约
            </h1>
            <p style={{ color: '#8c8c8c', marginTop: 8, marginBottom: 0 }}>
              预约常州市各类公共场馆，享受便捷的公共服务
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadVenues}>
              刷新
            </Button>
          </Space>
        </div>

        {showResult && bookingResult ? (
          <Card className="card-shadow">
            <Result
              status="success"
              title="预约成功"
              subTitle="您的场馆预约已成功提交，请按时前往。预约记录可在个人中心查看。"
              extra={[
                <Button type="primary" key="view" onClick={() => navigate('/user/bookings')}>
                  查看我的预约
                </Button>,
                <Button key="continue" onClick={() => {
                  setShowResult(false)
                  setSelectedVenue(null)
                }}>
                  继续预约
                </Button>
              ]}
            />
            <Card title="预约详情" style={{ marginTop: 24 }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="场馆名称">{bookingResult.venueName}</Descriptions.Item>
                <Descriptions.Item label="预约日期">{bookingResult.date}</Descriptions.Item>
                <Descriptions.Item label="预约时段">{bookingResult.timeSlot}</Descriptions.Item>
                <Descriptions.Item label="预约人数">{bookingResult.peopleCount} 人</Descriptions.Item>
                <Descriptions.Item label="联系电话">{bookingResult.phone}</Descriptions.Item>
                <Descriptions.Item label="预约状态">
                  <Tag color="green">已确认</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Card>
        ) : (
          <>
            <Card className="card-shadow" style={{ marginBottom: 16 }}>
              <Row gutter={24} align="middle">
                <Col span={12}>
                  <Input
                    placeholder="搜索场馆名称、地址..."
                    allowClear
                    size="large"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    prefix={<SearchOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Select
                    placeholder="场馆类型"
                    size="large"
                    style={{ width: '100%' }}
                    value={filterType}
                    onChange={setFilterType}
                    allowClear
                  >
                    <Option value="all">全部类型</Option>
                    <Option value="体育场馆">体育场馆</Option>
                    <Option value="文化场馆">文化场馆</Option>
                    <Option value="演出场馆">演出场馆</Option>
                    <Option value="青少年活动">青少年活动</Option>
                    <Option value="户外场地">户外场地</Option>
                  </Select>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <span style={{ color: '#8c8c8c' }}>共 {filteredVenues.length} 个场馆</span>
                </Col>
              </Row>
            </Card>

            <Row gutter={24}>
              <Col span={selectedVenue ? 12 : 24}>
                <Card className="card-shadow" title="场馆列表">
                  {filteredVenues.length > 0 ? (
                    <List
                      dataSource={filteredVenues}
                      renderItem={(venue) => (
                        <List.Item
                          className="hover-card"
                          onClick={() => setSelectedVenue(venue)}
                          style={{
                            cursor: 'pointer',
                            padding: '16px 0',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <span style={{ fontWeight: 500, fontSize: 16 }}>{venue.name}</span>
                                <Tag color="blue">{venue.type}</Tag>
                                {!venue.available && <Tag color="red">暂不可用</Tag>}
                              </Space>
                            }
                            description={
                              <div>
                                <p style={{ color: '#595959', margin: '4px 0 8px' }}>{venue.description}</p>
                                <Space size={16} style={{ color: '#8c8c8c', fontSize: 12 }}>
                                  <span>
                                    <EnvironmentOutlined /> {venue.address}
                                  </span>
                                  <span>
                                    <CalendarOutlined /> {venue.openTime}-{venue.closeTime}
                                  </span>
                                  <span>
                                    <UserOutlined /> 容量 {venue.capacity} 人
                                  </span>
                                </Space>
                              </div>
                            }
                          />
                          <Button
                            type="primary"
                            disabled={!venue.available}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isLoggedIn) {
                                navigate('/login')
                                return
                              }
                              setSelectedVenue(venue)
                              setShowBookingModal(true)
                            }}
                          >
                            立即预约
                          </Button>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="未找到相关场馆" />
                  )}
                </Card>
              </Col>

              {selectedVenue && (
                <Col span={12}>
                  <Card
                    className="card-shadow"
                    title={selectedVenue.name}
                    extra={
                      <Space>
                        <Button
                          type="primary"
                          disabled={!selectedVenue.available}
                          onClick={() => {
                            if (!isLoggedIn) {
                              navigate('/login')
                              return
                            }
                            setShowBookingModal(true)
                          }}
                        >
                          立即预约
                        </Button>
                        <Button type="text" onClick={() => setSelectedVenue(null)}>
                          关闭
                        </Button>
                      </Space>
                    }
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div style={{ height: 200, background: 'linear-gradient(135deg, #e6f7ff, #bae7ff)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontSize: 48 }}>
                        <CalendarOutlined />
                      </div>

                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="场馆类型">{selectedVenue.type}</Descriptions.Item>
                        <Descriptions.Item label="场馆地址">{selectedVenue.address}</Descriptions.Item>
                        <Descriptions.Item label="开放时间">{selectedVenue.openTime} - {selectedVenue.closeTime}</Descriptions.Item>
                        <Descriptions.Item label="容纳人数">{selectedVenue.capacity} 人</Descriptions.Item>
                      </Descriptions>

                      <p style={{ color: '#595959', lineHeight: 1.8, margin: 0 }}>
                        {selectedVenue.description}
                      </p>

                      <Card size="small" title="场馆设施">
                        <Space wrap>
                          {selectedVenue.facilities.map((f, idx) => (
                            <Tag key={idx} color="blue">{f}</Tag>
                          ))}
                        </Space>
                      </Card>
                    </Space>
                  </Card>
                </Col>
              )}
            </Row>
          </>
        )}
      </div>

      <Modal
        title={`预约 ${selectedVenue?.name}`}
        open={showBookingModal}
        onOk={handleBooking}
        onCancel={() => setShowBookingModal(false)}
        okText="确认预约"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        {selectedVenue && (
          <Form form={form} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="date"
                  label="预约日期"
                  rules={[{ required: true, message: '请选择预约日期' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    disabledDate={disabledDate}
                    placeholder="选择日期"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="timeSlot"
                  label="预约时段"
                  rules={[{ required: true, message: '请选择预约时段' }]}
                >
                  <Select placeholder="选择时段">
                    {timeSlots.map((slot) => (
                      <Option key={slot} value={slot}>{slot}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="peopleCount"
                  label="预约人数"
                  rules={[{ required: true, message: '请输入预约人数' }]}
                >
                  <InputNumber
                    min={1}
                    max={selectedVenue.capacity}
                    style={{ width: '100%' }}
                    placeholder="请输入人数"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="联系电话"
                  initialValue={userInfo?.phone}
                  rules={[
                    { required: true, message: '请输入联系电话' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                  ]}
                >
                  <Input placeholder="请输入手机号" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="remark" label="备注说明">
              <Input.TextArea rows={3} placeholder="其他需要说明的情况（选填）" maxLength={200} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default Venues
