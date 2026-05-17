import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Button, 
  List, 
  Tag, 
  message,
  Statistic,
  Row,
  Col,
  Divider
} from 'antd'
import {
  CrownOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  RocketOutlined,
  StarOutlined
} from '@ant-design/icons'
import useStore from '../store'

const VIP = () => {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useStore()
  const [selectedPlan, setSelectedPlan] = useState('year')

  const plans = [
    {
      key: 'month',
      name: '月卡',
      price: 19.9,
      originalPrice: 29.9,
      description: '按月订阅',
      tag: null
    },
    {
      key: 'quarter',
      name: '季卡',
      price: 49.9,
      originalPrice: 89.7,
      description: '按季度订阅',
      tag: '推荐'
    },
    {
      key: 'year',
      name: '年卡',
      price: 168,
      originalPrice: 358.8,
      description: '按年订阅',
      tag: '超值'
    }
  ]

  const benefits = [
    {
      icon: <BookOutlined />,
      title: '全站免费阅读',
      description: '百万书籍，不限量阅读'
    },
    {
      icon: <RocketOutlined />,
      title: '无广告打扰',
      description: '纯净阅读体验'
    },
    {
      icon: <StarOutlined />,
      title: '专属书库',
      description: 'VIP精选书籍抢先看'
    },
    {
      icon: <CloudOutlined />,
      title: '无限云空间',
      description: '书籍永久保存'
    },
    {
      icon: <FileTextOutlined />,
      title: '导出笔记',
      description: '支持多种格式导出'
    },
    {
      icon: <GiftOutlined />,
      title: '专属礼包',
      description: '每月会员福利'
    }
  ]

  const handleSubscribe = () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    message.success(`已选择${plans.find(p => p.key === selectedPlan)?.name}，支付功能开发中...`)
  }

  return (
    <div className="page-content" style={{ paddingBottom: 100 }}>
      <div style={{
        background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
        margin: '-16px -16px 24px',
        padding: '40px 24px',
        textAlign: 'center',
        color: '#fff'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          <CrownOutlined />
        </div>
        <h1 style={{ color: '#fff', fontSize: 28, marginBottom: 8 }}>VIP会员</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>解锁全部阅读特权</p>
        
        {user?.is_vip && (
          <Tag color="gold" style={{ marginTop: 16 }}>
            您已是尊贵的VIP会员
          </Tag>
        )}
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16, textAlign: 'center' }}>会员权益</h3>
        <Row gutter={[16, 16]}>
          {benefits.map((item, index) => (
            <Col span={12} key={index}>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                background: '#fafafa',
                borderRadius: 8
              }}>
                <div style={{ fontSize: 24, color: '#faad14', marginBottom: 8 }}>
                  {item.icon}
                </div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{item.description}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16, textAlign: 'center' }}>选择套餐</h3>
        <Row gutter={12}>
          {plans.map(plan => (
            <Col span={8} key={plan.key}>
              <Card
                size="small"
                hoverable
                onClick={() => setSelectedPlan(plan.key)}
                style={{
                  borderColor: selectedPlan === plan.key ? '#faad14' : '#d9d9d9',
                  borderWidth: selectedPlan === plan.key ? 2 : 1,
                  textAlign: 'center'
                }}
              >
                {plan.tag && (
                  <Tag color="orange" style={{ marginBottom: 8 }}>{plan.tag}</Tag>
                )}
                <div style={{ fontWeight: 500, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                    ¥{plan.price}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>
                  ¥{plan.originalPrice}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {plan.description}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card size="small">
        <h3 style={{ marginBottom: 16, textAlign: 'center' }}>常见问题</h3>
        <List
          dataSource={[
            { q: 'VIP会员可以看什么书？', a: 'VIP会员可以免费阅读全站所有书籍，包括付费书籍。' },
            { q: '可以退款吗？', a: '购买后7天内未使用任何VIP权益，可以申请全额退款。' },
            { q: '会员到期后书籍还能看吗？', a: '会员到期后，已加入云书馆的VIP书籍将无法阅读，需要重新开通会员。' },
            { q: '如何领取每月礼包？', a: '每月1日自动发放到您的账户，可在会员中心查看。' }
          ]}
          renderItem={item => (
            <List.Item>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Q: {item.q}</div>
                <div style={{ color: '#666', fontSize: 14 }}>A: {item.a}</div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        background: '#fff',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        zIndex: 100
      }}>
        <Row gutter={12} align="middle">
          <Col flex={1}>
            <div>
              <span style={{ color: '#faad14', fontSize: 24, fontWeight: 'bold' }}>
                ¥{plans.find(p => p.key === selectedPlan)?.price}
              </span>
              <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                /{plans.find(p => p.key === selectedPlan)?.name.replace('卡', '')}
              </span>
            </div>
          </Col>
          <Col>
            <Button 
              type="primary" 
              size="large"
              style={{ 
                background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
                border: 'none',
                minWidth: 150
              }}
              onClick={handleSubscribe}
            >
              立即开通
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default VIP
