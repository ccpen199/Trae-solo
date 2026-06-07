import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Space, Tag, message, Tooltip, Statistic, Divider, Modal } from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { seatsAPI, eventsAPI, pricingAPI } from '../api';
import dayjs from 'dayjs';

function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatMap, setSeatMap] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadEvent();
    loadSeats();
    loadStrategies();
  }, [id]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(c => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const loadEvent = async () => {
    try {
      const res = await eventsAPI.detail(id);
      setEvent(res.event);
    } catch (err) {
      message.error('加载活动信息失败');
    }
  };

  const loadSeats = async () => {
    try {
      const res = await seatsAPI.getByEvent(id);
      setSeats(res.seats || []);
      setSeatMap(res.seatMap);
    } catch (err) {
      message.error('加载座位图失败');
    }
  };

  const loadStrategies = async () => {
    try {
      const res = await pricingAPI.getByEvent(id);
      setStrategies(res.strategies?.filter(s => s.isApplicable) || []);
      if (res.strategies?.length > 0) {
        setSelectedStrategy(res.strategies[0]);
      }
    } catch (err) {
      console.error('加载票价策略失败', err);
    }
  };

  const handleSeatClick = async (seat) => {
    if (seat.status === 'sold' || seat.isLocked) {
      return;
    }

    const isSelected = selectedSeats.some(s => s.id === seat.id);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
      return;
    }

    if (selectedSeats.length >= 6) {
      message.warning('最多选择6个座位');
      return;
    }

    setSelectedSeats([...selectedSeats, seat]);
  };

  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) {
      message.warning('请先选择座位');
      return;
    }

    try {
      await seatsAPI.lock(selectedSeats.map(s => s.id));
      setCountdown(600);
      message.success('座位已锁定，请在10分钟内完成支付');
      setShowConfirm(true);
    } catch (err) {
      message.error(err.response?.data?.error || '锁定座位失败');
      loadSeats();
    }
  };

  const handleConfirm = () => {
    const data = {
      eventId: id,
      seatIds: selectedSeats.map(s => s.id),
      strategyId: selectedStrategy?.id
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(data));
    navigate('/checkout');
  };

  const getSeatStatus = (seat) => {
    if (seat.status === 'sold') return 'sold';
    if (seat.isLocked) return 'locked';
    if (selectedSeats.some(s => s.id === seat.id)) return 'selected';
    return 'available';
  };

  const groupSeatsByRow = () => {
    const groups = {};
    seats.forEach(seat => {
      if (!groups[seat.row]) {
        groups[seat.row] = [];
      }
      groups[seat.row].push(seat);
    });
    return groups;
  };

  const groupedSeats = groupSeatsByRow();
  const rows = Object.keys(groupedSeats).sort();

  const calculateTotal = () => {
    const basePrice = selectedStrategy?.base_price || 0;
    const discount = selectedStrategy?.discount_value || 0;
    const finalPrice = selectedStrategy?.discount_type === 'percentage' 
      ? basePrice * (1 - discount / 100) 
      : basePrice;
    return {
      base: selectedSeats.length * basePrice,
      final: selectedSeats.length * finalPrice,
      discount: selectedSeats.length * (basePrice - finalPrice)
    };
  };

  const totals = calculateTotal();

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/event/${id}`)}>
          返回活动详情
        </Button>
        <h2 style={{ margin: 0 }}>选择座位</h2>
      </Space>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title={seatMap?.name || '座位图'}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ background: 'linear-gradient(90deg, #1890ff, #722ed1)', color: '#fff', padding: '8px 24px', borderRadius: '0 0 50% 50%', display: 'inline-block', fontWeight: 600 }}>
                舞台 / SCREEN
              </div>
            </div>

            <Space direction="vertical" size="middle" style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              {rows.map(row => (
                <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Tag color="blue" style={{ width: 40, textAlign: 'center' }}>{row}排</Tag>
                  <Space size={4} wrap style={{ justifyContent: 'center' }}>
                    {groupedSeats[row].sort((a, b) => a.seat_number - b.seat_number).map(seat => {
                      const status = getSeatStatus(seat);
                      return (
                        <Tooltip key={seat.id} title={`${row}排${seat.seat_number}座 - ${status === 'sold' ? '已售' : status === 'locked' ? '已锁定' : status === 'selected' ? '已选' : '可选'}`}>
                          <div
                            className={`seat seat-${status}`}
                            onClick={() => handleSeatClick(seat)}
                          >
                            {seat.seat_number}
                          </div>
                        </Tooltip>
                      );
                    })}
                  </Space>
                </div>
              ))}
            </Space>

            <Divider />

            <Space size="large" style={{ justifyContent: 'center', display: 'flex' }}>
              <Space><div className="seat seat-available" style={{ width: 24, height: 24, fontSize: 8 }}>选</div><span>可选</span></Space>
              <Space><div className="seat seat-selected" style={{ width: 24, height: 24, fontSize: 8 }}>选</div><span>已选</span></Space>
              <Space><div className="seat seat-locked" style={{ width: 24, height: 24, fontSize: 8 }}>锁</div><span>锁定中</span></Space>
              <Space><div className="seat seat-sold" style={{ width: 24, height: 24, fontSize: 8 }}>售</div><span>已售</span></Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ position: 'sticky', top: 80 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <h3 style={{ marginBottom: 8 }}>{event?.title}</h3>
                <Space style={{ color: '#666', fontSize: 12 }}>
                  <span>{dayjs(event?.start_time).format('YYYY-MM-DD HH:mm')}</span>
                  <span>|</span>
                  <span>{event?.venue}</span>
                </Space>
              </div>

              <div>
                <h4 style={{ marginBottom: 12 }}>票价策略</h4>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {strategies.map(strategy => (
                    <div
                      key={strategy.id}
                      onClick={() => setSelectedStrategy(strategy)}
                      style={{
                        padding: 12,
                        border: `2px solid ${selectedStrategy?.id === strategy.id ? '#1890ff' : '#e8e8e8'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: selectedStrategy?.id === strategy.id ? '#e6f7ff' : '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{strategy.name}</span>
                        <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                          ¥{strategy.discount_value ? Math.round(strategy.base_price * (1 - strategy.discount_value / 100)) : strategy.base_price}
                        </span>
                      </div>
                      {strategy.description && (
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{strategy.description}</div>
                      )}
                    </div>
                  ))}
                </Space>
              </div>

              <div>
                <h4 style={{ marginBottom: 12 }}>已选座位 ({selectedSeats.length}/6)</h4>
                {selectedSeats.length > 0 ? (
                  <Space wrap size="small">
                    {selectedSeats.map(seat => (
                      <Tag key={seat.id} closable onClose={() => setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id))}>
                        {seat.row}排{seat.seat_number}座
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <p style={{ color: '#999' }}>请在左侧座位图中选择座位</p>
                )}
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <Statistic title="合计" value={totals.final} prefix="¥" precision={2} valueStyle={{ color: '#ff4d4f' }} />
              
              {totals.discount > 0 && (
                <div style={{ fontSize: 12, color: '#52c41a' }}>
                  已优惠 ¥{totals.discount.toFixed(2)}
                </div>
              )}

              {countdown > 0 && (
                <div style={{ textAlign: 'center', padding: 12, background: '#fff7e6', borderRadius: 8 }}>
                  <ClockCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                  <span style={{ color: '#fa8c16' }}>座位锁定中：{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                icon={<ShoppingCartOutlined />}
                onClick={countdown > 0 ? handleConfirm : handleLockSeats}
                disabled={selectedSeats.length === 0}
                style={{ height: 48, fontSize: 16 }}
              >
                {countdown > 0 ? '确认购票' : '确认选座'}
              </Button>

              <Space style={{ fontSize: 12, color: '#999', justifyContent: 'center', width: '100%' }}>
                <InfoCircleOutlined />
                <span>座位锁定10分钟，超时自动释放</span>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SeatSelection;
