import { useNavigate } from 'react-router-dom'
import { Package, ChevronRight, Settings, Heart, MapPin, Wallet, Star, LogOut, UserPlus, Store } from 'lucide-react'
import useStore from '../store/useStore'
import { showToast } from '../utils/toast'

function Profile() {
  const navigate = useNavigate()
  const user = useStore((state) => state.user)
  const logout = useStore((state) => state.logout)
  
  const handleLogout = () => {
    logout()
    showToast('已退出登录')
    navigate('/login', { replace: true })
  }
  
  const menuItems = [
    { icon: Heart, label: '我的收藏', onClick: () => showToast('功能开发中') },
    { icon: MapPin, label: '收货地址', onClick: () => showToast('功能开发中') },
    { icon: Wallet, label: '我的钱包', onClick: () => showToast('功能开发中') },
    { icon: UserPlus, label: '邀请好友', onClick: () => showToast('功能开发中') },
    { icon: Star, label: '我的评价', onClick: () => showToast('功能开发中') },
    { icon: Store, label: '成为店主', onClick: async () => {
      try {
        const api = (await import('../utils/api')).default
        await api.post('/user/become-shop-owner')
        showToast('恭喜成为店主！')
        window.location.reload()
      } catch (error) {
        showToast('操作失败')
      }
    }},
    { icon: Settings, label: '设置', onClick: () => showToast('功能开发中') }
  ]
  
  const orderQuickItems = [
    { label: '待支付', icon: '💳', status: 'pending' },
    { label: '待发货', icon: '📦', status: 'paid' },
    { label: '待收货', icon: '🚚', status: 'shipped' },
    { label: '待评价', icon: '⭐', status: 'completed' },
    { label: '退换/售后', icon: '🔄', status: null }
  ]
  
  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src={user?.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar&image_size=square'}
          alt="avatar"
          className="profile-avatar"
        />
        <div className="profile-info">
          <div className="profile-nickname">{user?.nickname || '用户'}</div>
          <div className="profile-level">
            {user?.is_shop_owner ? '🏪 店主' : user?.level === 'member' ? '👤 会员' : '👤 普通用户'}
          </div>
        </div>
      </div>
      
      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-value">{user?.points || 0}</div>
          <div className="profile-stat-label">积分</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value">0</div>
          <div className="profile-stat-label">优惠券</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value">0</div>
          <div className="profile-stat-label">收藏</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value">0</div>
          <div className="profile-stat-label">足迹</div>
        </div>
      </div>
      
      <div className="order-entry">
        <div className="order-entry-header" onClick={() => navigate('/orders')}>
          <h4>我的订单</h4>
          <div className="view-all">
            全部订单
            <ChevronRight size={16} />
          </div>
        </div>
        <div className="order-entry-items">
          {orderQuickItems.map((item, idx) => (
            <div
              key={idx}
              className="order-entry-item"
              onClick={() => item.status ? navigate(`/orders?status=${item.status}`) : showToast('功能开发中')}
            >
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="menu-list">
        {menuItems.map((item, idx) => (
          <div key={idx} className="menu-item" onClick={item.onClick}>
            <item.icon size={22} color="#666" />
            <span>{item.label}</span>
            <ChevronRight size={18} color="#999" />
          </div>
        ))}
      </div>
      
      {user?.role === 'admin' && (
        <div className="menu-list">
          <div className="menu-item" onClick={() => navigate('/admin')}>
            <Package size={22} color="#666" />
            <span>管理后台</span>
            <ChevronRight size={18} color="#999" />
          </div>
        </div>
      )}
      
      <div className="menu-list">
        <div className="menu-item" onClick={handleLogout}>
          <LogOut size={22} color="#ff4d4f" />
          <span style={{ color: '#ff4d4f' }}>退出登录</span>
        </div>
      </div>
    </div>
  )
}

export default Profile
