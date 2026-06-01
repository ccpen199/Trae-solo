import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Button, Card, Spin, message, Tag } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import { getScheduleDetail, createOrder } from '../services/api'
import dayjs from 'dayjs'

function SeatSelect() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadScheduleDetail()
  }, [id])

  const loadScheduleDetail = async () => {
    setLoading(true)
    try {
      const res = await getScheduleDetail(id)
      setSchedule(res.data)
      setSeats(res.data.seats || [])
    } catch (err) {
      message.error('加载场次信息失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSeatClick = (seat) => {
    if (seat.is_sold) {
      return
    }
    
    const isSelected = selectedSeats.some(s => s.id === seat.id)
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id))
    } else {
      setSelectedSeats([...selectedSeats, seat])
    }
  }

  const handleSubmitOrder = async () => {
    if (selectedSeats.length === 0) {
      message.warning('请至少选择一个座位')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    setSubmitting(true)
    try {
      const res = await createOrder({
        schedule_id: id,
        seats: selectedSeats,
      })
      message.success('订单创建成功')
      navigate(`/order/${res.data.id}`)
    } catch (err) {
      message.error(err.response?.data?.message || '创建订单失败')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const getSeatClass = (seat) => {
    if (seat.is_sold) {
      return 'seat seat-sold'
    }
    if (selectedSeats.some(s => s.id === seat.id)) {
      return 'seat seat-selected'
    }
    return 'seat seat-available'
  }

  if (loading || !schedule) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  const totalPrice = schedule.price * selectedSeats.length

  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.row_num
    if (!acc[row]) {
      acc[row] = []
    }
    acc[row].push(seat)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <Row justify="space-between" align="middle">
            <Col>
              <h1 style={{ color: 'white', marginBottom: '10px' }}>{schedule.movie_title}</h1>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                {dayjs(schedule.start_time).format('YYYY年M月D日 HH:mm')} / {schedule.hall_name} / {schedule.language}
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '30px' }}>
        <Card title="选择座位" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="seat seat-available" style={{ width: '20px', height: '20px', margin: '0' }} />
              <span>可选</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="seat seat-selected" style={{ width: '20px', height: '20px', margin: '0' }} />
              <span>已选</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="seat seat-sold" style={{ width: '20px', height: '20px', margin: '0' }} />
              <span>已售</span>
            </div>
          </div>

          <div className="screen">银幕</div>

          <div className="seat-grid">
            {Object.entries(seatsByRow).map(([rowNum, rowSeats]) => (
              <div key={rowNum} className="seat-row">
                <span style={{ width: '30px', textAlign: 'right', marginRight: '10px', color: '#999' }}>
                  {rowNum}
                </span>
                {rowSeats
                  .sort((a, b) => a.col_num - b.col_num)
                  .map(seat => (
                    <div
                      key={seat.id}
                      className={getSeatClass(seat)}
                      onClick={() => handleSeatClick(seat)}
                      title={seat.seat_code}
                    >
                      {seat.col_num}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <div style={{ marginBottom: '10px' }}>
                <span>已选座位：</span>
                {selectedSeats.length > 0 ? (
                  selectedSeats.map(seat => (
                    <Tag key={seat.id} color="red" style={{ marginRight: '5px' }}>
                      {seat.seat_code}
                    </Tag>
                  ))
                ) : (
                  <span style={{ color: '#999' }}>请选择座位</span>
                )}
              </div>
              <div className="price-tag" style={{ fontSize: '24px' }}>
                总计：¥{totalPrice}
              </div>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleSubmitOrder}
                loading={submitting}
                disabled={selectedSeats.length === 0}
                style={{
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  border: 'none',
                  padding: '0 40px',
                  height: '50px',
                  fontSize: '16px',
                }}
              >
                确认选座
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  )
}

export default SeatSelect
