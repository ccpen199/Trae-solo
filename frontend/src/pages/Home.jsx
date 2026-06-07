import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, List, Tag, Statistic, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  FileTextOutlined,
  DollarOutlined,
  ToolOutlined,
  ShoppingOutlined,
  SafetyOutlined,
  BarChartOutlined,
  BellOutlined,
  ArrowRightOutlined,
  FireOutlined,
  WarningOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import useUserStore from '../store/userStore'
import { billingAPI, workOrderAPI, safetyAPI } from '../api'
import dayjs from 'dayjs'

function Home() {
  const navigate = useNavigate()
  const { user, profile, meter } = useUserStore()
  const [unpaidSummary, setUnpaidSummary] = useState(null)
  const [myOrders, setMyOrders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [anomalies, setAnomalies] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [unpaid, orders, notifs, anom] = await Promise.all([
        billingAPI.getUnpaidSummary().catch(() => ({ unpaid_count: 0, unpaid_total: 0 })),
        workOrderAPI.getMyOrders({ pageSize: 5 }).catch(() => ({ list: [] })),
        safetyAPI.getNotifications({ unread_only: 'true', pageSize: 5 }).catch(() => ({ list: [] })),
        safetyAPI.getMyAnomalies({ status: 'notified', pageSize: 3 }).catch(() => ({ list: [] }))
      ])
      setUnpaidSummary(unpaid)
      setMyOrders(orders.list || [])
      setNotifications(notifs.list || [])
      setAnomalies(anom.list || [])
    } catch (err) {
      console.error('加载首页数据失败:', err)
    }
  }

  const menuItems = [
    { key: '/meter-reading', icon: <FileTextOutlined />, label: '燃气报数', color: '#1890ff' },
    { key: '/billing', icon: <DollarOutlined />, label: '在线缴费', color: '#52c41a' },
    { key: '/work-order/create', icon: <ToolOutlined />, label: '报装报修', color: '#fa8c16' },
    { key: '/mall', icon: <ShoppingOutlined />, label: '生活服务', color: '#eb2f96' },
    { key: '/safety', icon: <SafetyOutlined />, label: '安全知识', color: '#f5222d' },
    { key: '/usage-stats', icon: <BarChartOutlined />, label: '用量分析', color: '#722ed1' },
    { key: '/auto-pay', icon: <DollarOutlined />, label: '代扣签约', color: '#13c2c2' },
    { key: '/profile', icon: <BellOutlined />, label: '个人中心', color: '#faad14' }
  ]

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'orange', text: '待处理' },
      assigned: { color: 'blue', text: '已派单' },
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' }
    }
    return map[status] || { color: 'default', text: status }
  }

  const getTypeText = (type) => {
    const map = { install: '报装', repair: '报修', inspect: '安检', complaint: '投诉' }
    return map[type] || type
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <FireOutlined style={{ color: '#f5222d', marginRight: 8 }} />
          您好，{user?.real_name}，欢迎使用燃气智能服务
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          今天是 {dayjs().format('YYYY年MM月DD日')}，祝您用气安全愉快
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <div className="stat-label">待缴费账单</div>
            <div className="stat-value">{unpaidSummary?.unpaid_count || 0}</div>
            {unpaidSummary?.latest_bill && (
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {unpaidSummary.latest_bill.billing_cycle}期 ¥{unpaidSummary.latest_bill.pay_amount?.toFixed(2)}
              </div>
            )}
            <Button 
              type="primary" 
              ghost 
              size="small" 
              style={{ marginTop: 12, color: 'white', borderColor: 'white' }}
              onClick={() => navigate('/billing')}
            >
              立即缴费 <ArrowRightOutlined />
            </Button>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card orange">
            <div className="stat-label">未缴费总额</div>
            <div className="stat-value">¥{unpaidSummary?.unpaid_total?.toFixed(2) || '0.00'}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
              {profile?.auto_pay ? '✓ 已开通自动代扣' : '未开通自动代扣'}
            </div>
            <Button 
              type="primary" 
              ghost 
              size="small" 
              style={{ marginTop: 12, color: 'white', borderColor: 'white' }}
              onClick={() => navigate('/auto-pay')}
            >
              代扣管理 <ArrowRightOutlined />
            </Button>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card green">
            <div className="stat-label">进行中工单</div>
            <div className="stat-value">{myOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
              表具编号：{meter?.meter_no || '未绑定'}
            </div>
            <Button 
              type="primary" 
              ghost 
              size="small" 
              style={{ marginTop: 12, color: 'white', borderColor: 'white' }}
              onClick={() => navigate('/work-order')}
            >
              查看工单 <ArrowRightOutlined />
            </Button>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card blue">
            <div className="stat-label">用气异常预警</div>
            <div className="stat-value">{anomalies.length}</div>
            {anomalies.length > 0 ? (
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
                <WarningOutlined style={{ marginRight: 4 }} />
                {anomalies[0].anomaly_type === 'sudden_increase' ? '用量突增' : '用量异常'}
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
                用气情况正常，继续保持
              </div>
            )}
            <Button 
              type="primary" 
              ghost 
              size="small" 
              style={{ marginTop: 12, color: 'white', borderColor: 'white' }}
              onClick={() => navigate('/usage-stats')}
            >
              用量分析 <ArrowRightOutlined />
            </Button>
          </div>
        </Col>
      </Row>

      <div className="section-card">
        <div className="section-title">
          <span>快捷服务</span>
        </div>
        <div className="grid-menu">
          {menuItems.map(item => (
            <div 
              key={item.key} 
              className="grid-menu-item"
              onClick={() => navigate(item.key)}
            >
              <div className="grid-menu-icon" style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="grid-menu-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card 
            title={
              <div className="section-title" style={{ margin: 0 }}>
                <ToolOutlined style={{ color: '#fa8c16' }} />
                我的工单
              </div>
            }
            extra={<Button type="link" onClick={() => navigate('/work-order')}>查看全部</Button>}
            className="card-shadow"
          >
            {myOrders.length > 0 ? (
              <List
                dataSource={myOrders}
                renderItem={(item) => (
                  <List.Item 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/work-order/${item.id}`)}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getTypeText(item.type)}：{item.title}
                          <Tag color={getStatusTag(item.status).color}>
                            {getStatusTag(item.status).text}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#999' }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                          {item.assignee_name && ` · 处理人：${item.assignee_name}`}
                        </div>
                      }
                    />
                    <ArrowRightOutlined style={{ color: '#ccc' }} />
                  </List.Item>
                )}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                暂无工单记录
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card 
            title={
              <div className="section-title" style={{ margin: 0 }}>
                <BellOutlined style={{ color: '#1890ff' }} />
                消息通知
              </div>
            }
            className="card-shadow"
          >
            {notifications.length > 0 ? (
              <List
                size="small"
                dataSource={notifications}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.title}
                      description={
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {item.content} · {dayjs(item.created_at).format('MM-DD HH:mm')}
                        </div>
                      }
                    />
                    {!item.read && <Tag color="red">未读</Tag>}
                  </List.Item>
                )}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                暂无新消息
              </div>
            )}
          </Card>

          {anomalies.length > 0 && (
            <Card 
              title={
                <div className="section-title" style={{ margin: '16px 0 0 0' }}>
                  <WarningOutlined style={{ color: '#f5222d' }} />
                  异常预警
                </div>
              }
              className="card-shadow"
              style={{ marginTop: 16 }}
            >
              {anomalies.map((item, idx) => (
                <div key={idx} className="list-item-card" onClick={() => navigate('/usage-stats')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        <Tag color="orange">
                          {item.anomaly_type === 'sudden_increase' ? '用量突增' :
                           item.anomaly_type === 'sudden_decrease' ? '用量骤降' :
                           item.anomaly_type === 'zero_usage' ? '零用量' : '异常模式'}
                        </Tag>
                        {dayjs(item.detected_date).format('YYYY-MM-DD')} 检测到异常
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        当前用量：{item.current_usage} m³，预期：{item.expected_usage?.toFixed(1)} m³，
                        偏离 {item.deviation_percent?.toFixed(1)}%
                      </div>
                    </div>
                    <ArrowRightOutlined style={{ color: '#ccc' }} />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </Col>
      </Row>

      <div className="section-card" style={{ marginTop: 16 }}>
        <div className="section-title">
          <SafetyOutlined style={{ color: '#f5222d' }} />
          安全用气提示
        </div>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <div className="guide-step">
              <span className="guide-step-number">1</span>
              使用燃气时请保持通风，有人照看
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="guide-step">
              <span className="guide-step-number">2</span>
              用完燃气请关闭灶前阀和灶具阀
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="guide-step">
              <span className="guide-step-number">3</span>
              定期检查胶管，老化请及时更换
            </div>
          </Col>
        </Row>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/safety')}>
            查看完整安全知识
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Home
