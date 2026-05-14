
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RidePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>←</button>
        <span style={styles.title}>我的行程</span>
        <div></div>
      </div>

      <div style={styles.statusCard}>
        <div style={styles.statusIcon}>🚗</div>
        <div style={styles.statusTitle}>正在找车...</div>
        <div style={styles.statusDesc}>请耐心等待，正在为您匹配附近的司机</div>
      </div>

      <div style={styles.rideInfo}>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>起点</div>
          <div style={styles.infoValue}>当前位置</div>
        </div>
        <div style={styles.infoDivider}></div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>终点</div>
          <div style={styles.infoValue}>目的地</div>
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.cancelBtn}>取消订单</button>
        <button style={styles.contactBtn}>联系客服</button>
      </div>

      <div style={styles.paymentSection}>
        <h3 style={styles.sectionTitle}>支付方式</h3>
        <div style={styles.paymentOption}>
          <span>微信支付</span>
          <span style={styles.checkmark}>✓</span>
        </div>
        <div style={styles.paymentOption}>
          <span>支付宝</span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  backBtn: {
    background: 'none',
    fontSize: '24px',
    padding: '0'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold' as const
  },
  statusCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    margin: '16px',
    padding: '32px',
    borderRadius: '16px',
    color: '#fff',
    textAlign: 'center' as const
  },
  statusIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  statusTitle: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    marginBottom: '8px'
  },
  statusDesc: {
    fontSize: '14px',
    opacity: 0.9
  },
  rideInfo: {
    background: '#fff',
    margin: '0 16px 16px',
    padding: '20px',
    borderRadius: '12px'
  },
  infoItem: {
    padding: '8px 0'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '4px'
  },
  infoValue: {
    fontSize: '16px',
    color: '#333'
  },
  infoDivider: {
    height: '1px',
    background: '#eee',
    margin: '8px 0'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    padding: '0 16px 16px'
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    background: '#fff',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px'
  },
  contactBtn: {
    flex: 1,
    padding: '14px',
    background: '#ff6600',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '16px'
  },
  paymentSection: {
    background: '#fff',
    margin: '16px',
    padding: '20px',
    borderRadius: '12px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: '16px'
  },
  paymentOption: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
    fontSize: '16px'
  },
  checkmark: {
    color: '#ff6600',
    fontWeight: 'bold' as const
  }
};
