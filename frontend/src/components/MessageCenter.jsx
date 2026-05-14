import React, { useState } from 'react'
import useStore from '../store'
import './MessageCenter.css'

const MessageCenter = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('system')
  const user = useStore(state => state.user)

  const messages = [
    { id: 1, type: 'system', title: '欢迎来到精品自营', content: '新人专享福利，首单立减50元优惠券已发放到您的账户', time: '刚刚', read: false },
    { id: 2, type: 'order', title: '订单支付成功', content: '您的订单 20260510123456 支付成功，我们将尽快为您发货', time: '2小时前', read: false },
    { id: 3, type: 'promotion', title: '限时优惠来袭', content: '限时购频道超多好物，低至5折起，快来抢购吧', time: '昨天', read: true },
  ]

  const filteredMessages = messages.filter(m => m.type === activeTab || activeTab === 'all')

  if (!user) {
    return (
      <div className="message-center-overlay" onClick={onClose}>
        <div className="message-center" onClick={e => e.stopPropagation()}>
          <div className="message-center-header">
            <h3>消息中心</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="message-center-body">
            <div className="message-empty">
              <p>请先登录查看消息</p>
              <a href="/login" className="btn btn-primary">去登录</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="message-center-overlay" onClick={onClose}>
      <div className="message-center" onClick={e => e.stopPropagation()}>
        <div className="message-center-header">
          <h3>消息中心</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="message-tabs">
          {[
            { key: 'all', label: '全部' },
            { key: 'system', label: '系统通知' },
            { key: 'order', label: '订单消息' },
            { key: 'promotion', label: '促销活动' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`message-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="message-center-body">
          {filteredMessages.length === 0 ? (
            <div className="message-empty">
              <p>暂无消息</p>
            </div>
          ) : (
            <div className="message-list">
              {filteredMessages.map(msg => (
                <div key={msg.id} className={`message-item ${!msg.read ? 'unread' : ''}`}>
                  <div className="message-title">
                    {!msg.read && <span className="unread-dot"></span>}
                    {msg.title}
                  </div>
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageCenter
