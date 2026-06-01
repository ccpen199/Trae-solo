import React, { useState, useEffect } from 'react';
import api from '../api';

function FamilyView({ user }) {
  const [elderlyList, setElderlyList] = useState([]);
  const [selectedElderly, setSelectedElderly] = useState(null);
  const [familyData, setFamilyData] = useState({
    elderly: null,
    careRecords: [],
    medications: [],
    incidents: [],
    fees: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('care');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadElderlyList();
  }, []);

  const loadElderlyList = async () => {
    try {
      setError(null);
      const res = await api.get('/elderly');
      const list = Array.isArray(res.data) ? res.data : [];
      setElderlyList(list);
      if (list.length > 0) {
        setSelectedElderly(list[0].id);
        loadFamilyData(list[0].id);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyData = async (elderlyId) => {
    try {
      setError(null);
      const res = await api.get(`/dashboard/family/${elderlyId}`);
      const data = res.data || {};
      setFamilyData({
        elderly: data.elderly || null,
        careRecords: Array.isArray(data.careRecords) ? data.careRecords : [],
        medications: Array.isArray(data.medications) ? data.medications : [],
        incidents: Array.isArray(data.incidents) ? data.incidents : [],
        fees: Array.isArray(data.fees) ? data.fees : []
      });
    } catch (err) {
      console.error('加载家属视图数据失败:', err);
      setError('加载详情数据失败');
    }
  };

  const handleElderlyChange = (elderlyId) => {
    setSelectedElderly(parseInt(elderlyId));
    loadFamilyData(parseInt(elderlyId));
  };

  if (loading) return <div style={{ padding: '2rem', color: '#333' }}>加载中...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>家属视图</h2>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c33', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {elderlyList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧</div>
          <p style={{ color: '#666' }}>您还没有绑定的老人信息</p>
          <p style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>请联系养老院管理员进行绑定</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: '#666', marginRight: '12px' }}>选择查看的老人：</label>
            <select
              value={selectedElderly || ''}
              onChange={(e) => handleElderlyChange(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            >
              {elderlyList.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {familyData.elderly && (
            <>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: familyData.elderly.gender === '男' ? '#2196f3' : '#e91e63',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '36px'
                  }}>
                    {familyData.elderly.gender === '男' ? '👴' : '👵'}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{familyData.elderly.name}</h3>
                    <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.8' }}>
                      <div>房间：{familyData.elderly.room_number}室 {familyData.elderly.bed_number}床</div>
                      <div>护理等级：{familyData.elderly.care_level}</div>
                      <div>健康状况：{familyData.elderly.health_status || '良好'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                  {[
                    { key: 'care', label: '照护记录' },
                    { key: 'meds', label: '用药信息' },
                    { key: 'incidents', label: '异常事件' },
                    { key: 'fees', label: '费用账单' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        padding: '14px 24px',
                        border: 'none',
                        background: activeTab === tab.key ? '#f5f5f5' : 'transparent',
                        color: activeTab === tab.key ? '#2196f3' : '#666',
                        cursor: 'pointer',
                        borderBottom: activeTab === tab.key ? '2px solid #2196f3' : '2px solid transparent',
                        fontSize: '14px',
                        fontWeight: activeTab === tab.key ? 'bold' : 'normal'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '20px', minHeight: '300px' }}>
                  {activeTab === 'care' && (
                    <div>
                      {familyData.careRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无照护记录</div>
                      ) : (
                        familyData.careRecords.slice(0, 20).map((record, index) => (
                          <div key={record.id || index} style={{
                            padding: '12px 0',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <div>
                              <strong style={{ color: '#333' }}>{record.task_type}</strong>
                              <span style={{ marginLeft: '12px', fontSize: '13px', color: '#666' }}>
                                执行人：{record.executor_name || '系统'}
                              </span>
                              {record.notes && <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{record.notes}</div>}
                            </div>
                            <span style={{ fontSize: '12px', color: '#999' }}>
                              {new Date(record.executed_at).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'meds' && (
                    <div>
                      {familyData.medications.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无用药信息</div>
                      ) : (
                        familyData.medications.map((med, index) => (
                          <div key={med.id || index} style={{
                            padding: '16px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            marginBottom: '12px',
                            background: '#fafafa'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: '#333' }}>💊 {med.medication_name || med.name}</strong>
                              <span style={{ fontSize: '12px', color: '#4caf50', background: '#e8f5e9', padding: '2px 8px', borderRadius: '4px' }}>生效中</span>
                            </div>
                            <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                              {med.dosage} · {med.frequency}
                            </div>
                            {med.notes && (
                              <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>备注：{med.notes}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'incidents' && (
                    <div>
                      {familyData.incidents.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无异常事件记录</div>
                      ) : (
                        familyData.incidents.map((incident, index) => (
                          <div key={incident.id || index} style={{
                            padding: '12px 0',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <div>
                              <span style={{
                                padding: '2px 8px',
                                background: incident.severity === '轻微' ? '#e8f5e9' : '#ffebee',
                                color: incident.severity === '轻微' ? '#2e7d32' : '#c62828',
                                borderRadius: '4px',
                                fontSize: '12px',
                                marginRight: '8px'
                              }}>
                                {incident.severity}
                              </span>
                              <strong style={{ color: '#333' }}>{incident.incident_type}</strong>
                              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{incident.description}</div>
                            </div>
                            <span style={{ fontSize: '12px', color: '#999' }}>
                              {new Date(incident.occurred_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'fees' && (
                    <div>
                      {familyData.fees.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无费用记录</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f5f5f5' }}>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>账单月份</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>总金额</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>已缴</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>状态</th>
                            </tr>
                          </thead>
                          <tbody>
                            {familyData.fees.map((fee, index) => (
                              <tr key={fee.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{fee.billing_month}</td>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>¥{fee.total_amount.toFixed(2)}</td>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>¥{fee.paid_amount.toFixed(2)}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    background: fee.payment_status === '已缴费' ? '#e8f5e9' : '#fff3e0',
                                    color: fee.payment_status === '已缴费' ? '#2e7d32' : '#e65100',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}>
                                    {fee.payment_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default FamilyView;
