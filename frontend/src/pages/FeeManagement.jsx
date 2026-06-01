import React, { useState, useEffect } from 'react';
import api from '../api';

const statusColors = {
  '待缴费': '#ff9800',
  '部分缴费': '#2196f3',
  '已缴费': '#4caf50',
  '欠费': '#f44336'
};

function FeeManagement({ user }) {
  const [records, setRecords] = useState([]);
  const [packages, setPackages] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsRes, packagesRes, arrearsRes] = await Promise.all([
        api.get('/fees/records'),
        api.get('/fees/packages'),
        ['admin', 'nurse'].includes(user.role) ? api.get('/fees/arrears').catch(() => ({ data: [] })) : { data: [] }
      ]);
      setRecords(recordsRes.data);
      setPackages(packagesRes.data);
      setArrears(arrearsRes.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>加载中...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>费用管理</h2>

      {arrears.length > 0 && (
        <div style={{
          background: '#ffebee',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ef9a9a'
        }}>
          <div style={{ fontWeight: 'bold', color: '#c62828', marginBottom: '12px' }}>
            ⚠️ 欠费提醒 ({arrears.length}项)
          </div>
          {arrears.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              background: 'white',
              borderRadius: '6px',
              marginBottom: '8px'
            }}>
              <div>
                <strong>{item.elderly_name}</strong>
                <span style={{ marginLeft: '12px', fontSize: '13px', color: '#666' }}>
                  {item.billing_month} · 欠费 ¥{(item.total_amount - item.paid_amount).toFixed(2)}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#f44336' }}>
                到期: {item.due_date}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>费用套餐</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {packages.map((pkg) => (
            <div key={pkg.id} style={{
              padding: '16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>{pkg.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#666' }}>基础费用</span>
                <span>¥{pkg.base_fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#666' }}>护理费用</span>
                <span>¥{pkg.care_fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                <span style={{ color: '#666' }}>餐饮费用</span>
                <span>¥{pkg.meal_fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                <span>总计</span>
                <span style={{ color: '#f44336' }}>¥{(pkg.base_fee + pkg.care_fee + pkg.meal_fee).toFixed(2)}</span>
              </div>
              {pkg.description && (
                <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>{pkg.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <h3 style={{ margin: '20px 20px 16px 20px', fontSize: '16px' }}>缴费记录</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>老人</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>账单月份</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>总金额</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>已缴</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>状态</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>到期日</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{record.elderly_name}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{record.billing_month}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>¥{record.total_amount.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>¥{record.paid_amount.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    background: statusColors[record.payment_status] + '20',
                    color: statusColors[record.payment_status],
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {record.payment_status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{record.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FeeManagement;
