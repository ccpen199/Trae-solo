import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Row, Col, Statistic, Tabs, message, Space, Modal } from 'antd';
import { ReloadOutlined, CreditCardOutlined, QrcodeOutlined, CheckCircleOutlined, LoginOutlined, HistoryOutlined, GiftOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMyCards, getQRCode, recharge, scanGate } from '../api/card';

const { Option } = Select;

const QRCode = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [rechargeModal, setRechargeModal] = useState(false);
  const [rechargeType, setRechargeType] = useState('balance');
  const [rechargeAmount, setRechargeAmount] = useState(50);
  const [rechargeTimes, setRechargeTimes] = useState(10);
  const [gateModal, setGateModal] = useState(false);
  const [gateType, setGateType] = useState('in');
  const [gateStation, setGateStation] = useState('天府广场');
  const [gateResult, setGateResult] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('tft_user'));

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const loadCards = async () => {
    if (!localStorage.getItem('tft_user') || !localStorage.getItem('tft_token')) {
      setIsLoggedIn(false);
      setCards([]);
      setSelectedCard(null);
      setQrData(null);
      return;
    }
    setIsLoggedIn(true);
    try {
      const res = await getMyCards();
      setCards(Array.isArray(res) ? res : []);
      if (res && res.length > 0) {
        setSelectedCard(res[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadQRCode = async () => {
    if (!selectedCard) return;
    try {
      setLoading(true);
      const res = await getQRCode(selectedCard.id);
      setQrData(res);
      setCountdown(60);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCard) {
      loadQRCode();
    }
  }, [selectedCard]);

  const handleRecharge = async () => {
    if (!selectedCard) return;
    try {
      setLoading(true);
      await recharge({
        card_id: selectedCard.id,
        recharge_type: rechargeType,
        amount: rechargeType === 'balance' ? rechargeAmount : rechargeTimes * 2,
        times: rechargeType === 'times' ? rechargeTimes : 0,
        payment_method: 'unionpay'
      });
      message.success('充值成功');
      setRechargeModal(false);
      loadCards();
      loadQRCode();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanGate = async () => {
    if (!qrData) return;
    try {
      setLoading(true);
      const res = await scanGate({
        qr_token: qrData.qr_token,
        station: gateStation,
        gate_type: gateType,
        transport_type: 'metro'
      });
      setGateResult(res);
      setGateModal(false);
      message.success(gateType === 'in' ? '进站成功' : '出站成功');
      loadCards();
      loadQRCode();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cardTypeMap = {
    normal: { label: '普通卡', className: '' },
    student: { label: '学生卡', className: 'card-gradient-student' },
    elderly: { label: '老年卡', className: 'card-gradient-elderly' }
  };

  const qrTabs = [
    { key: 'qr', label: '乘车码', icon: <QrcodeOutlined /> },
    { key: 'nfc', label: 'NFC碰一碰', icon: <CreditCardOutlined /> }
  ];

  if (!isLoggedIn) {
    return (
      <div className="page-container">
        <Card bordered={false} style={{ textAlign: 'center', padding: 48 }}>
          <LoginOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>请先登录后使用乘车码</h2>
          <p style={{ color: '#8c8c8c', marginBottom: 24 }}>登录后可查看已绑定卡片、刷新乘车码并模拟过闸。</p>
          <Button type="primary" onClick={() => navigate('/login')}>用户登录</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} title="我的卡片">
            {cards.length > 0 ? (
              <Select
                style={{ width: '100%', marginBottom: 24 }}
                value={selectedCard?.id}
                onChange={(val) => {
                  const card = cards.find(c => c.id === val);
                  setSelectedCard(card);
                }}
              >
                {cards.map(card => (
                  <Option key={card.id} value={card.id}>
                    {card.card_no} - {cardTypeMap[card.card_type]?.label || '普通卡'}
                  </Option>
                ))}
              </Select>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无卡片，请先在"我的卡片"中申请
              </div>
            )}

            {selectedCard && (
              <div className={`card-gradient ${cardTypeMap[selectedCard.card_type]?.className || ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ opacity: 0.8, fontSize: 12 }}>天府通 · {cardTypeMap[selectedCard.card_type]?.label || '普通卡'}</div>
                    <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{selectedCard.card_no}</div>
                  </div>
                  <div style={{ fontSize: 24 }}>🚌</div>
                </div>
                <Row gutter={24} style={{ marginTop: 24 }}>
                  <Col span={8}>
                    <Statistic title="电子钱包余额" value={selectedCard.balance} prefix="¥" valueStyle={{ color: 'white' }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="次卡次数" value={selectedCard.times_count} suffix="次" valueStyle={{ color: 'white' }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="卡状态" value={selectedCard.card_status === 'active' ? '正常' : '停用'} valueStyle={{ color: 'white' }} />
                  </Col>
                </Row>
              </div>
            )}

            {selectedCard && (
              <Card bordered={false} style={{ marginTop: 24, padding: '12px 0' }}>
                <Row gutter={16} style={{ textAlign: 'center' }}>
                  <Col span={6}>
                    <Button
                      type="text"
                      icon={<CreditCardOutlined style={{ fontSize: 24 }} />}
                      onClick={() => navigate('/my-cards?tab=channels')}
                      style={{ width: '100%', height: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 13 }}>充值</span>
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button
                      type="text"
                      icon={<HistoryOutlined style={{ fontSize: 24 }} />}
                      onClick={() => navigate('/my-cards?tab=transactions')}
                      style={{ width: '100%', height: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 13 }}>交易记录</span>
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button
                      type="text"
                      icon={<GiftOutlined style={{ fontSize: 24 }} />}
                      onClick={() => navigate('/points-mall')}
                      style={{ width: '100%', height: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 13 }}>积分商城</span>
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button
                      type="text"
                      icon={<ShoppingOutlined style={{ fontSize: 24 }} />}
                      onClick={() => navigate('/life-service')}
                      style={{ width: '100%', height: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 13 }}>生活服务</span>
                    </Button>
                  </Col>
                </Row>
              </Card>
            )}

            <Space style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}>
              <Button type="primary" onClick={() => setRechargeModal(true)}>充值</Button>
              <Button onClick={() => setGateModal(true)}>模拟扫码过闸</Button>
              <Button icon={<ReloadOutlined />} onClick={loadQRCode} loading={loading}>刷新二维码</Button>
            </Space>

            <Card bordered={false} style={{ marginTop: 24 }} title="乘车码">
              <Tabs centered items={qrTabs} />
              <div className="qr-code-container">
                {qrData ? (
                  <div style={{ textAlign: 'center' }}>
                    <div className="qr-code-display">
                      <QrcodeOutlined style={{ fontSize: 80, color: '#1890ff' }} />
                      <div style={{ fontSize: 11, marginTop: 8, wordBreak: 'break-all' }}>
                        {qrData.qr_token.slice(0, 48)}
                      </div>
                    </div>
                    <div style={{ marginTop: 16, fontSize: 14 }}>
                      将二维码靠近闸机扫码区
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                      二维码 {countdown} 秒后自动刷新
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      支持：地铁 / 公交 / 有轨电车 / 市域铁路
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    {selectedCard ? (selectedCard.balance < 2 && selectedCard.times_count < 1 ? '余额不足，请先充值' : '点击刷新获取二维码') : '请先选择卡片'}
                  </div>
                )}
              </div>
            </Card>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="支付方式" bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💳 银联支付</span>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                </div>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💰 数字人民币</span>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                </div>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🏦 银行II类户</span>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                </div>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💵 电子钱包</span>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                </div>
              </Space>
            </div>
          </Card>

          <Card title="使用须知" bordered={false}>
            <div style={{ fontSize: 13, lineHeight: 2, color: '#666' }}>
              <p>1. 请将二维码对准闸机扫码区，保持约5cm距离</p>
              <p>2. 二维码每60秒自动刷新，请勿截图保存</p>
              <p>3. 余额不足时请先充值，确保顺利通行</p>
              <p>4. 支持一码通行：地铁、公交、有轨电车、市域铁路</p>
              <p>5. NFC虚拟卡请将手机背面靠近闸机感应区</p>
              <p>6. 如需发票，请在交易记录中申请</p>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="充值"
        open={rechargeModal}
        onOk={handleRecharge}
        onCancel={() => setRechargeModal(false)}
        confirmLoading={loading}
      >
        <Tabs activeKey={rechargeType} onChange={setRechargeType} centered items={[
          { key: 'balance', label: '电子钱包' },
          { key: 'times', label: '次卡充值' }
        ]} />
        {rechargeType === 'balance' ? (
          <div style={{ padding: '24px 0' }}>
            <div style={{ marginBottom: 16 }}>选择充值金额</div>
            <Row gutter={[8, 8]}>
              {[20, 50, 100, 200, 500].map(amount => (
                <Col span={8} key={amount}>
                  <div 
                    onClick={() => setRechargeAmount(amount)}
                    style={{
                      padding: '16px 0',
                      textAlign: 'center',
                      border: rechargeAmount === amount ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: rechargeAmount === amount ? '#e6f7ff' : 'white'
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 500 }}>¥{amount}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        ) : (
          <div style={{ padding: '24px 0' }}>
            <div style={{ marginBottom: 16 }}>选择充值次数（2元/次）</div>
            <Row gutter={[8, 8]}>
              {[10, 20, 30, 50, 100].map(times => (
                <Col span={8} key={times}>
                  <div 
                    onClick={() => setRechargeTimes(times)}
                    style={{
                      padding: '16px 0',
                      textAlign: 'center',
                      border: rechargeTimes === times ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: rechargeTimes === times ? '#e6f7ff' : 'white'
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 500 }}>{times}次</div>
                    <div style={{ color: '#888', fontSize: 12 }}>¥{times * 2}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>

      <Modal
        title="模拟扫码过闸"
        open={gateModal}
        onOk={handleScanGate}
        onCancel={() => setGateModal(false)}
        confirmLoading={loading}
      >
        <div style={{ padding: '24px 0' }}>
          <div style={{ marginBottom: 16 }}>过闸类型</div>
          <Row gutter={[8, 8]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <div 
                onClick={() => setGateType('in')}
                style={{
                  padding: '16px 0',
                  textAlign: 'center',
                  border: gateType === 'in' ? '2px solid #52c41a' : '1px solid #d9d9d9',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: gateType === 'in' ? '#f6ffed' : 'white'
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🚇</div>
                <div>进站</div>
              </div>
            </Col>
            <Col span={12}>
              <div 
                onClick={() => setGateType('out')}
                style={{
                  padding: '16px 0',
                  textAlign: 'center',
                  border: gateType === 'out' ? '2px solid #fa8c16' : '1px solid #d9d9d9',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: gateType === 'out' ? '#fff7e6' : 'white'
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🏁</div>
                <div>出站</div>
              </div>
            </Col>
          </Row>
          <div style={{ marginBottom: 8 }}>站点</div>
          <Select style={{ width: '100%' }} value={gateStation} onChange={setGateStation}>
            {['天府广场', '春熙路', '火车北站', '犀浦', '天府三街', '孵化园'].map(s => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </div>
      </Modal>

      {gateResult && (
        <Modal
          title={gateType === 'in' ? '进站成功' : '出站成功'}
          open={!!gateResult}
          onOk={() => setGateResult(null)}
          onCancel={() => setGateResult(null)}
          footer={[
            <Button key="back" onClick={() => setGateResult(null)}>
              关闭
            </Button>,
            <Button
              key="points"
              type="primary"
              icon={<GiftOutlined />}
              onClick={() => {
                setGateResult(null);
                navigate('/points-mall');
              }}
            >
              查看积分
            </Button>
          ]}
        >
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}>
              <CheckCircleOutlined />
            </div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              {gateType === 'in' ? `${gateResult.station_in} 进站成功` : `${gateResult.station_out} 出站成功`}
            </div>
            {gateResult.fare !== undefined && (
              <div style={{ color: '#666' }}>
                <p>票价：¥{gateResult.fare}</p>
                <p>实付：{gateResult.actual_paid}</p>
                <p>余额：¥{gateResult.balance_after}</p>
                <p>获得积分：+{gateResult.points_earned}</p>
              </div>
            )}
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              交易单号：{gateResult.transaction_no}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default QRCode;
