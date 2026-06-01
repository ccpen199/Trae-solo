import React, { useState, useEffect } from 'react';
import api from '../api';

function CarePlans({ user }) {
  const [plans, setPlans] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [elderlyList, setElderlyList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, tasksRes, elderlyRes] = await Promise.all([
        api.get('/care/plans'),
        api.get('/care/today-tasks'),
        api.get('/elderly')
      ]);
      setPlans(plansRes.data);
      setTodayTasks(tasksRes.data);
      setElderlyList(elderlyRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/care/plans', formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>加载中...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>照护计划</h2>
        {['admin', 'nurse'].includes(user.role) && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 20px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + 创建计划
          </button>
        )}
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>今日待执行任务</h3>
        {todayTasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>暂无任务</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {todayTasks.map((task) => (
              <div key={task.id} style={{
                padding: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                background: task.is_active ? '#fff' : '#f5f5f5'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{task.plan_name}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {task.elderly_name} · {task.room_number}室
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  {task.task_type} · {task.time_points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>老人</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>计划名称</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>类型</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>频率</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>时间点</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{plan.elderly_name}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{plan.plan_name}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{plan.task_type}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{plan.frequency}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{plan.time_points}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    background: plan.is_active ? '#e8f5e9' : '#f5f5f5',
                    color: plan.is_active ? '#2e7d32' : '#999',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {plan.is_active ? '执行中' : '已停用'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '450px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>创建照护计划</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>老人</label>
                <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onChange={(e) => setFormData({ ...formData, elderly_id: e.target.value })} required>
                  <option value="">请选择</option>
                  {elderlyList.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} - {e.room_number}室</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>计划名称</label>
                <input style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>任务类型</label>
                  <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value })} required>
                    <option value="">请选择</option>
                    <option value="翻身">翻身</option>
                    <option value="喂药">喂药</option>
                    <option value="测量">测量</option>
                    <option value="康复">康复</option>
                    <option value="活动">活动</option>
                    <option value="巡房">巡房</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>频率</label>
                  <input style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="如：每日2次"
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} required />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>时间点（逗号分隔）</label>
                <input style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="如：08:00,12:00,18:00"
                  onChange={(e) => setFormData({ ...formData, time_points: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>描述</label>
                <textarea style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                  取消
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '10px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarePlans;
