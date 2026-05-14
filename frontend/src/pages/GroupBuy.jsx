import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Share2, MessageCircle } from 'lucide-react'
import api from '../utils/api'
import { showToast } from '../utils/toast'

function GroupBuy() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [groupBuy, setGroupBuy] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchGroupBuy()
  }, [id])
  
  const fetchGroupBuy = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/order/group-buy/${id}/share`)
      setGroupBuy(response)
    } catch (error) {
      console.error('Failed to fetch group buy:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleJoin = () => {
    if (!groupBuy?.group_buy?.product_id) {
      showToast('拼团信息有误')
      return
    }
    
    localStorage.setItem('joinGroupBuyId', groupBuy.group_buy.id)
    localStorage.setItem('checkoutData', JSON.stringify({
      items: [{
        product_id: groupBuy.group_buy.product_id,
        quantity: 1,
        price: groupBuy.group_buy.group_price,
        name: groupBuy.group_buy.name,
        images: groupBuy.group_buy.images
      }]
    }))
    
    navigate('/checkout')
  }
  
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(groupBuy?.share_content || '')
      showToast('分享内容已复制')
    } else {
      showToast(groupBuy?.share_content || '快来一起拼团吧！')
    }
  }
  
  if (loading) {
    return <div className="loading">加载中...</div>
  }
  
  if (!groupBuy?.group_buy) {
    return <div className="empty">拼团不存在</div>
  }
  
  const gb = groupBuy.group_buy
  const remaining = gb.min_members - gb.current_members
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: 80 }}>
      <div className="header">
        <div className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={22} />
        </div>
        <div className="header-title">拼团详情</div>
      </div>
      
      <div className="group-buy-card">
        <div className="group-buy-header">
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
            {gb.status === 'succeeded' ? '拼团成功！' : gb.status === 'failed' ? '拼团失败' : '拼团进行中'}
          </div>
          <div className="group-buy-price">¥{gb.group_price?.toFixed(2)}</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4, textDecoration: 'line-through' }}>
            原价 ¥{gb.original_price?.toFixed(2)}
          </div>
        </div>
        
        <div className="group-buy-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={gb.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
              alt={gb.name}
              style={{ width: 80, height: 80, borderRadius: 8 }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{gb.name}</h3>
              <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
                团长: {gb.leader_name}
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff9f9', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Users size={18} color="#ff4d4f" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                还差 {remaining} 人成团
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="group-buy-members">
                {gb.members?.map((member, idx) => (
                  <img
                    key={idx}
                    src={member.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar&image_size=square'}
                    alt={member.nickname}
                    className="group-buy-member"
                  />
                ))}
              </div>
              <span style={{ color: '#999', fontSize: 13 }}>
                {gb.current_members}/{gb.min_members} 人
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="group-buy-card">
        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>分享给好友</h4>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
          {groupBuy.share_content}
        </p>
      </div>
      
      <div className="checkout-bottom">
        <button
          className="btn-share"
          style={{ flex: 1, marginRight: 12 }}
          onClick={handleShare}
        >
          <Share2 size={20} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
          分享
        </button>
        {gb.status === 'active' && (
          <button
            className="btn-join-group"
            style={{ flex: 1 }}
            onClick={handleJoin}
          >
            参与拼团
          </button>
        )}
      </div>
    </div>
  )
}

export default GroupBuy
