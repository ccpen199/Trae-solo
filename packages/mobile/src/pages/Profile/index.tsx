import { NavBar, Avatar, List, Space, Card, Tag, Button } from 'antd-mobile'
import { UserOutline, SetOutline, CollectMoneyOutline, ClockCircleOutline, HeartOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import './index.css'

function Profile() {
  const navigate = useNavigate()

  const userInfo = {
    nickname: '新能源车主',
    phone: '138****8888',
    level: '黄金会员',
    balance: 128.50,
    points: 2580,
    coupons: 5
  }

  const menuItems = [
    { icon: <ClockCircleOutline />, label: '充电订单', path: '/orders' },
    { icon: <CollectMoneyOutline />, label: '我的钱包', path: '/wallet' },
    { icon: <HeartOutline />, label: '收藏站点', path: '/favorites' },
    { icon: <SetOutline />, label: '设置', path: '/settings' }
  ]

  const businessItems = [
    { icon: <span style={{ fontSize: 18 }}>🔋</span>, label: 'VIN+车牌认证', path: '/v2g', desc: '即插即充无感认证' },
    { icon: <span style={{ fontSize: 18 }}>⚡</span>, label: 'V2G充放电策略', path: '/v2g', desc: '削峰填谷收益' },
    { icon: <span style={{ fontSize: 18 }}>🛣️</span>, label: 'AI路径规划', path: '/route', desc: '多目的地+电价排序' },
    { icon: <span style={{ fontSize: 18 }}>💬</span>, label: '车友社区', path: '/community', desc: '经验分享互助' },
    { icon: <span style={{ fontSize: 18 }}>📊</span>, label: '运营后台', path: 'http://localhost:5174', desc: '分账收益管理' },
  ]

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="profile-page">
      <NavBar back={null}>个人中心</NavBar>

      <div className="user-header-card">
        <div className="user-info">
          <Avatar className="user-avatar">
            <UserOutline />
          </Avatar>
          <div className="user-detail">
            <div className="user-nickname">
              {userInfo.nickname}
              <Tag color="warning" className="level-tag">{userInfo.level}</Tag>
            </div>
            <div className="user-phone">{userInfo.phone}</div>
          </div>
        </div>

        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-value">¥{userInfo.balance}</span>
            <span className="stat-label">余额</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userInfo.points}</span>
            <span className="stat-label">积分</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userInfo.coupons}</span>
            <span className="stat-label">优惠券</span>
          </div>
        </div>
      </div>

      <Space direction="vertical" block className="menu-section">
        <Card>
          <List>
            {menuItems.map((item, index) => (
              <List.Item
                key={index}
                prefix={item.icon}
                onClick={() => item.path && navigate(item.path)}
              >
                {item.label}
              </List.Item>
            ))}
          </List>
        </Card>

        <Card>
          <List>
            <List.Item prefix={<SetOutline />}>
              车辆管理
            </List.Item>
            <List.Item prefix={<SetOutline />}>
              消息通知
            </List.Item>
            <List.Item prefix={<SetOutline />}>
              帮助与反馈
            </List.Item>
            <List.Item prefix={<SetOutline />}>
              关于我们
            </List.Item>
          </List>
        </Card>

        <div className="logout-section">
          <Button block color="danger" onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </Space>
    </div>
  )
}

export default Profile
