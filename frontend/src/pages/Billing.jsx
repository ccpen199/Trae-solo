import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, List, Tag, Table, Modal, message, Radio, Select } from 'antd'
import {
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { billingAPI } from '../api'
import useUserStore from '../store/userStore'
import dayjs from 'dayjs'

function Billing() {
  const { profile } = useUserStore()
  const [bills, setBills] = useState([])
  const [unpaidSummary, setUnpaidSummary] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [activeTab, setActiveTab] = useState('unpaid')
  const [payModal, setPayModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [payMethod, setPayMethod] = useState('wechat')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      let status
      if (activeTab === 'unpaid') status = 'unpaid'
      else if (activeTab === 'all') status = undefined
      else status = 'paid'
      
      let billsData = { list: [] }
      let summary = null
      let history = { list: [] }
      
      try {
        billsData = await billingAPI.getMyBills({ status, pageSize: 20 })
        console.log('账单API返回:', billsData)
      } catch (err) {
        console.error('加载账单失败:', err)
      }
      
      try {
        summary = await billingAPI.getUnpaidSummary()
        console.log('账单汇总API返回:', summary)
      } catch (err) {
        console.error('加载账单汇总失败:', err)
      }
      
      try {
        history = await billingAPI.getPaymentHistory({ pageSize: 10 })
        console.log('缴费历史API返回:', history)
      } catch (err) {
        console.error('加载缴费历史失败:', err)
      }
      
      setBills(billsData.list || billsData.data || [])
      setUnpaidSummary(summary)
      setPaymentHistory(history.list || history.data || [])
    } catch (err) {
      console.error('加载数据失败:', err)
      message.error('加载账单失败')
    }
  }

  const handlePay = (bill) => {
    setSelectedBill(bill)
    setPayModal(true)
  }

  const handleConfirmPay = async () => {
    if (!selectedBill) return
    setLoading(true)
    try {
      await billingAPI.payBill(selectedBill.id, { pay_method: payMethod })
      message.success('支付成功')
      setPayModal(false)
      setSelectedBill(null)
      loadData()
    } catch (err) {
      console.error('支付失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status) => {
    const map = {
      unpaid: { color: 'orange', text: '待缴费' },
      paid: { color: 'green', text: '已缴费' },
      partial: { color: 'blue', text: '部分缴费' },
      overdue: { color: 'red', text: '已逾期' }
    }
    return map[status] || { color: 'default', text: status }
  }

  const columns = [
    {
      title: '账期',
      dataIndex: 'billing_cycle',
      key: 'billing_cycle',
      render: (val) => <span>{val}</span>
    },
    {
      title: '气费用量',
      key: 'usage',
      render: (_, record) => (
        <span>{record.gas_usage} m³ × ¥{record.unit_price}/m³</span>
      )
    },
    {
      title: '本金',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => <span>¥{val.toFixed(2)}</span>
    },
    {
      title: '违约金',
      dataIndex: 'late_fee',
      key: 'late_fee',
      render: (val) => <span style={{ color: val > 0 ? '#f5222d' : '#666' }}>¥{(val || 0).toFixed(2)}</span>
    },
    {
      title: '优惠',
      dataIndex: 'discount',
      key: 'discount',
      render: (val) => <span style={{ color: '#52c41a' }}>-¥{(val || 0).toFixed(2)}</span>
    },
    {
      title: '应缴金额',
      dataIndex: 'pay_amount',
      key: 'pay_amount',
      render: (val) => <span style={{ fontSize: 16, fontWeight: 600, color: '#f5222d' }}>¥{val.toFixed(2)}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => <Tag color={getStatusTag(val).color}>{getStatusTag(val).text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.status !== 'paid' && (
          <Button type="primary" size="small" onClick={() => handlePay(record)}>
            立即缴费
          </Button>
        )
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          在线缴费
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          查看燃气账单，支持在线支付和自动代扣
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <div className="stat-card">
            <div className="stat-label">待缴费账单</div>
            <div className="stat-value">{unpaidSummary?.unpaid_count || 0}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
              待缴总额：¥{unpaidSummary?.unpaid_total?.toFixed(2) || '0.00'}
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <div className="stat-card orange">
            <div className="stat-label">本月气费</div>
            <div className="stat-value">¥{bills[0]?.pay_amount?.toFixed(2) || '0.00'}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
              用气量：{bills[0]?.gas_usage || 0} m³
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <div className="stat-card green">
            <div className="stat-label">代扣状态</div>
            <div className="stat-value">
              {profile?.auto_pay ? '已开通' : '未开通'}
            </div>
            <Button 
              type="primary" 
              ghost 
              size="small" 
              style={{ marginTop: 8, color: 'white', borderColor: 'white' }}
              onClick={() => window.location.href = '/auto-pay'}
            >
              代扣管理 <ArrowRightOutlined />
            </Button>
          </div>
        </Col>
      </Row>

      <Card 
        className="card-shadow"
        tabList={[
          { key: 'unpaid', tab: '待缴费' },
          { key: 'all', tab: '全部账单' },
          { key: 'history', tab: '缴费记录' }
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'history' ? (
          <List
            dataSource={paymentHistory}
            renderItem={(item) => (
              <div className="list-item-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {item.billing_cycle} 期燃气费
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      <CreditCardOutlined style={{ marginRight: 4 }} />
                      {item.pay_method === 'auto_pay' ? '自动代扣' :
                       item.pay_method === 'wechat' ? '微信支付' :
                       item.pay_method === 'alipay' ? '支付宝' : '在线支付'}
                      <span style={{ margin: '0 8px' }}>·</span>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {dayjs(item.pay_time).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                      -¥{item.pay_amount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      用气 {item.gas_usage} m³
                    </div>
                  </div>
                </div>
              </div>
            )}
            locale={{ emptyText: '暂无缴费记录' }}
          />
        ) : (
          <Table
            dataSource={bills}
            columns={columns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '暂无账单记录' }}
          />
        )}
      </Card>

      <div className="section-card" style={{ marginTop: 16 }}>
        <div className="section-title">
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          缴费说明
        </div>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <div className="guide-step">
              <span className="guide-step-number">1</span>
              支持微信、支付宝、银行卡支付
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="guide-step">
              <span className="guide-step-number">2</span>
              开通代扣可实现每月自动扣费
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="guide-step">
              <span className="guide-step-number">3</span>
              缴费成功后10分钟内到账
            </div>
          </Col>
        </Row>
      </div>

      <Modal
        title="确认支付"
        open={payModal}
        onOk={handleConfirmPay}
        onCancel={() => setPayModal(false)}
        okText="确认支付"
        cancelText="取消"
        confirmLoading={loading}
        width={480}
      >
        {selectedBill && (
          <div>
            <div style={{ background: '#f5f7fa', padding: 20, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
                  {selectedBill.billing_cycle} 期燃气费
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#f5222d' }}>
                  ¥{selectedBill.pay_amount.toFixed(2)}
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>用气量</span>
                  <span>{selectedBill.gas_usage} m³ × ¥{selectedBill.unit_price}/m³</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>本金</span>
                  <span>¥{selectedBill.total_amount.toFixed(2)}</span>
                </div>
                {selectedBill.late_fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#f5222d' }}>
                    <span>违约金</span>
                    <span>+¥{selectedBill.late_fee.toFixed(2)}</span>
                  </div>
                )}
                {selectedBill.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#52c41a' }}>
                    <span>优惠</span>
                    <span>-¥{selectedBill.discount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>选择支付方式</div>
              <Radio.Group value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <Radio.Button value="wechat" style={{ width: '33%', textAlign: 'center' }}>
                  💚 微信支付
                </Radio.Button>
                <Radio.Button value="alipay" style={{ width: '33%', textAlign: 'center' }}>
                  💙 支付宝
                </Radio.Button>
                <Radio.Button value="bank" style={{ width: '34%', textAlign: 'center' }}>
                  💳 银行卡
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Billing
