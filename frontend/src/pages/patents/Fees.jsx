import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function PatentFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setUpcoming] = useState({ upcomingCount: 0, overdueCount: 0 });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await api.get('/patents/fees/reminders');
      setFees(response.data.data);
      setUpcoming({ upcomingCount: response.data.upcomingCount, overdueCount: response.data.overdueCount });
    } catch (err) {
      console.error('Failed to fetch fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id) => {
    if (!confirm('确认该年费已缴纳？')) return;
    try {
      await api.post(`/patents/fees/${id}/pay`);
      alert('缴费状态已更新！');
      fetchFees();
    } catch (err) {
      alert('操作失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const getDaysUntil = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getUrgencyColor = (dueDate, status) => {
    if (status === 'paid') return '#52c41a';
    const days = getDaysUntil(dueDate);
    if (days < 0) return '#f5222d';
    if (days <= 7) return '#f5222d';
    if (days <= 30) return '#faad14';
    return '#1890ff';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.alertBanner}>
        {stats.overdueCount > 0 && (
          <div style={{ ...styles.alertItem, background: '#fff1f0', borderColor: '#ffa39e' }}>
            <span style={{ fontSize: '24px' }}>🔴</span>
            <div>
              <div style={{ fontWeight: '600', color: '#f5222d' }}>{stats.overdueCount} 项年费已逾期</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>请立即处理，避免专利权失效</div>
            </div>
          </div>
        )}
        {stats.upcomingCount > 0 && (
          <div style={{ ...styles.alertItem, background: '#fffbe6', borderColor: '#ffe58f' }}>
            <span style={{ fontSize: '24px' }}>🟡</span>
            <div>
              <div style={{ fontWeight: '600', color: '#d48806' }}>{stats.upcomingCount} 项年费30日内到期</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>请及时安排缴费</div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>💳 年费提醒列表</h3>
        <div style={styles.feeList}>
          {fees.map((fee) => {
            const days = getDaysUntil(fee.due_date);
            return (
              <div key={fee.id} style={styles.feeItem}>
                <div style={{
                  width: '8px',
                  height: '100%',
                  background: getUrgencyColor(fee.due_date, fee.status),
                  borderRadius: '4px',
                  position: 'absolute',
                  left: 0,
                  top: 0
                }}></div>
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                    {fee.patent_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                    {fee.patent_number} · {fee.patent_type === 'invention' ? '发明专利' : fee.patent_type === 'utility' ? '实用新型' : '外观设计'}
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#8c8c8c' }}>费用类型：</span>{fee.fee_type}
                    </div>
                    <div>
                      <span style={{ color: '#8c8c8c' }}>应缴金额：</span>
                      <span style={{ color: '#fa8c16', fontWeight: '500' }}>¥{fee.amount?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ color: '#8c8c8c' }}>截止日期：</span>
                      <span style={{ color: getUrgencyColor(fee.due_date, fee.status), fontWeight: '500' }}>
                        {fee.due_date}
                        {fee.status !== 'paid' && days >= 0 && ` (${days}天后)`}
                        {fee.status !== 'paid' && days < 0 && ` (已逾期${-days}天)`}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {fee.status === 'paid' ? (
                    <span style={{ ...styles.badge, background: '#f6ffed', color: '#52c41a', border: '1px solid #b7eb8f' }}>
                      ✓ 已缴纳
                    </span>
                  ) : (
                    <button style={styles.payBtn} onClick={() => handlePay(fee.id)}>
                      确认缴费
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {fees.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
              🎉 暂无待缴年费
            </div>
          )}
        </div>
      </div>

      <div style={styles.tipsCard}>
        <h4 style={{ margin: '0 0 12px 0' }}>📌 年费缴纳说明</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#595959', fontSize: '13px', lineHeight: '2' }}>
          <li>专利年费需在每年申请日前缴纳，逾期6个月内可补缴（产生滞纳金）</li>
          <li>逾期超过6个月未缴的，专利权将终止</li>
          <li>系统提前90天自动提醒，可设置短信/邮件通知</li>
          <li>年费金额随专利年度递增，具体以国知局最新标准为准</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  alertBanner: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' },
  alertItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '10px', border: '1px solid' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600' },
  feeList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  feeItem: { display: 'flex', alignItems: 'center', padding: '16px 16px 16px 20px', background: '#fafafa', borderRadius: '10px', position: 'relative', overflow: 'hidden' },
  badge: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  payBtn: { padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  tipsCard: { background: '#f6ffed', borderRadius: '12px', padding: '20px 24px', border: '1px solid #b7eb8f' }
};
