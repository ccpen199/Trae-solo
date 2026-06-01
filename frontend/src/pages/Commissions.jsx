import { useState, useEffect } from 'react';
import api from '../services/api';

const Commissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/commissions');
      setCommissions(response.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, stage) => {
    try {
      await api.put(`/commissions/${id}`, { status, stage });
      loadData();
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'first_paid': return '#3498db';
      case 'second_paid': return '#27ae60';
      case 'guarantee_passed': return '#9b59b6';
      case 'completed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待支付';
      case 'first_paid': return '首付款已付';
      case 'second_paid': return '尾款已付';
      case 'guarantee_passed': return '保过期通过';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'first': return '#f39c12';
      case 'second': return '#3498db';
      case 'completed': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStageText = (stage) => {
    switch (stage) {
      case 'first': return '第一阶段';
      case 'second': return '第二阶段';
      case 'completed': return '已完成';
      default: return stage;
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>佣金管理</h1>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>候选人</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>职位 / 客户</th>
              <th style={{ textAlign: 'right', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>总金额</th>
              <th style={{ textAlign: 'right', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>已付金额</th>
              <th style={{ textAlign: 'right', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>未付金额</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>阶段</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>状态</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length > 0 ? (
              commissions.map((comm) => (
                <tr key={comm.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '15px 20px', fontWeight: '500' }}>{comm.candidate_name}</td>
                  <td style={{ padding: '15px 20px' }}>
                    <div>{comm.position_title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{comm.client_name}</div>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: '500' }}>¥{comm.total_amount?.toLocaleString() || '-'}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', color: '#27ae60' }}>¥{comm.paid_amount?.toLocaleString() || 0}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', color: '#e74c3c' }}>¥{comm.unpaid_amount?.toLocaleString() || 0}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: getStageColor(comm.stage),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {getStageText(comm.stage)}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: getStatusColor(comm.status),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {getStatusText(comm.status)}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                    {new Date(comm.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无佣金数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Commissions;
