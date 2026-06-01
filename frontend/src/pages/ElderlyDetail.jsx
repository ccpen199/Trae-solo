import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function ElderlyDetail({ user }) {
  const { id } = useParams();
  const [elderly, setElderly] = useState(null);
  const [careRecords, setCareRecords] = useState([]);
  const [carePlans, setCarePlans] = useState([]);
  const [medications, setMedications] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [elderlyRes, recordsRes, plansRes, medsRes] = await Promise.all([
        api.get(`/elderly/${id}`),
        api.get(`/care/records/elderly/${id}`),
        api.get(`/care/plans/elderly/${id}`),
        api.get(`/medication/orders/elderly/${id}`)
      ]);
      setElderly(elderlyRes.data);
      setCareRecords(recordsRes.data);
      setCarePlans(plansRes.data);
      setMedications(medsRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({});

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      await api.post('/care/records', {
        elderly_id: id,
        ...recordForm
      });
      setShowRecordModal(false);
      loadData();
    } catch (err) {
      alert('添加失败');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>加载中...</div>;
  if (!elderly) return <div style={{ padding: '2rem' }}>老人不存在</div>;

  const tabs = [
    { key: 'basic', label: '基本信息' },
    { key: 'plans', label: '照护计划' },
    { key: 'records', label: '护理记录' },
    { key: 'meds', label: '用药医嘱' },
    { key: 'contacts', label: '紧急联系人' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>{elderly.name}</h2>
          <p style={{ color: '#666', marginTop: '4px' }}>{elderly.room_number}室 {elderly.bed_number}床 · {elderly.care_level}</p>
        </div>
        {['admin', 'nurse', 'caregiver'].includes(user.role) && (
          <button
            onClick={() => setShowRecordModal(true)}
            style={{
              padding: '10px 20px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + 记录护理
          </button>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          {tabs.map((tab) => (
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
                fontSize: '14px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'basic' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div><strong>性别：</strong>{elderly.gender}</div>
              <div><strong>出生日期：</strong>{elderly.birth_date || '-'}</div>
              <div><strong>身份证号：</strong>{elderly.id_card || '-'}</div>
              <div><strong>入住日期：</strong>{elderly.admission_date || '-'}</div>
              <div><strong>健康状况：</strong>{elderly.health_status || '-'}</div>
              <div><strong>过敏史：</strong>{elderly.allergy_history || '无'}</div>
              <div><strong>饮食类型：</strong>{elderly.diet_type || '普通饮食'}</div>
              <div><strong>护理等级：</strong>{elderly.care_level}</div>
              <div style={{ gridColumn: '1/-1' }}><strong>合同编号：</strong>{elderly.contract_number || '-'}</div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div>
              {carePlans.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无照护计划</div>
              ) : (
                carePlans.map((plan) => (
                  <div key={plan.id} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{plan.plan_name}</strong>
                        <span style={{ marginLeft: '12px', fontSize: '13px', color: '#666' }}>{plan.task_type}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: plan.is_active ? '#4caf50' : '#999' }}>
                        {plan.is_active ? '✓ 执行中' : '已停用'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      {plan.frequency} · {plan.time_points}
                    </div>
                    {plan.description && (
                      <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{plan.description}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              {careRecords.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无护理记录</div>
              ) : (
                careRecords.map((record) => (
                  <div key={record.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <strong>{record.task_type}</strong>
                        <span style={{ marginLeft: '12px', fontSize: '13px', color: '#666' }}>
                          执行人：{record.executor_name}
                        </span>
                      </span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        {new Date(record.executed_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    {record.notes && <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{record.notes}</div>}
                    {record.abnormality && (
                      <div style={{ fontSize: '13px', color: '#f44336', marginTop: '4px' }}>异常：{record.abnormality}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'meds' && (
            <div>
              {medications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无用药医嘱</div>
              ) : (
                medications.map((med) => (
                  <div key={med.id} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>💊 {med.medication_name}</strong>
                      <span style={{ fontSize: '12px', color: med.is_active ? '#4caf50' : '#999' }}>
                        {med.is_active ? '✓ 生效中' : '已停用'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      {med.dosage} · {med.frequency} · {med.administration_route || '口服'}
                    </div>
                    {med.notes && <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>备注：{med.notes}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div>
              {!elderly.contacts || elderly.contacts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无联系人</div>
              ) : (
                elderly.contacts.map((contact) => (
                  <div key={contact.id} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{contact.name}</strong>
                      {contact.is_emergency && (
                        <span style={{ fontSize: '12px', padding: '2px 8px', background: '#ffebee', color: '#f44336', borderRadius: '4px' }}>
                          紧急联系人
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      {contact.relationship} · {contact.phone}
                    </div>
                    {contact.address && <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{contact.address}</div>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showRecordModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>记录护理</h3>
            <form onSubmit={handleAddRecord}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>任务类型</label>
                <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onChange={(e) => setRecordForm({ ...recordForm, task_type: e.target.value })} required>
                  <option value="">请选择</option>
                  <option value="翻身">翻身</option>
                  <option value="喂药">喂药</option>
                  <option value="测量">测量</option>
                  <option value="康复">康复</option>
                  <option value="活动">活动</option>
                  <option value="巡房">巡房</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>记录内容</label>
                <textarea style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  placeholder="请输入护理记录内容..." />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>异常说明（如有）</label>
                <input style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onChange={(e) => setRecordForm({ ...recordForm, abnormality: e.target.value })}
                  placeholder="异常情况说明" />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowRecordModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                  取消
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ElderlyDetail;
