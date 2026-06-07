import { useState, useEffect } from 'react';
import api from '../utils/api';

const MentorApprentice = () => {
  const [activeTab, setActiveTab] = useState('pairs');
  const [pairs, setPairs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    mentor_apprentice_id: '',
    title: '',
    description: '',
  });

  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [guideText, setGuideText] = useState('');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadPairs();
    loadTasks();
  }, []);

  const loadPairs = async () => {
    setLoading(true);
    try {
      const data = await api.get('/mentor/pairs');
      setPairs(data);
    } catch (err) {
      setError('加载师徒对列表失败');
    }
    setLoading(false);
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.get('/mentor/tasks');
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateTask = async () => {
    if (!newTask.mentor_apprentice_id || !newTask.title.trim()) {
      setError('请填写完整任务信息');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/mentor/tasks', newTask);
      setSuccessMsg('任务发布成功！');
      setShowTaskForm(false);
      setNewTask({ mentor_apprentice_id: '', title: '', description: '' });
      loadTasks();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('发布失败，请重试');
    }
    setLoading(false);
  };

  const handleAcceptTask = async (taskId) => {
    setLoading(true);
    try {
      await api.put(`/mentor/tasks/${taskId}/accept`, { apprentice_id: 4 });
      setSuccessMsg('接单成功！');
      loadTasks();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('接单失败');
    }
    setLoading(false);
  };

  const handleSubmitGuidance = async (taskId) => {
    if (!guideText.trim()) {
      setError('请填写指导内容');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/mentor/tasks/${taskId}/guide`, { mentor_guidance: guideText });
      setSuccessMsg('指导已提交！');
      loadTasks();
      setGuideText('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('提交失败');
    }
    setLoading(false);
  };

  const handleCompleteTask = async (taskId) => {
    if (!feedback.trim()) {
      setError('请填写评价内容');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/mentor/tasks/${taskId}/complete`, { rating, feedback });
      setSuccessMsg('任务已完成！');
      loadTasks();
      setShowTaskDetail(false);
      setSelectedTask(null);
      setFeedback('');
      setRating(5);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('提交失败');
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: { bg: '#dbeafe', color: '#1d4ed8', label: '已发布' },
      accepted: { bg: '#fef3c7', color: '#b45309', label: '已接单' },
      in_progress: { bg: '#fce7f3', color: '#be185d', label: '进行中' },
      completed: { bg: '#dcfce7', color: '#166534', label: '已完成' },
    };
    const s = styles[status] || styles.published;
    return <span style={{ padding: '4px 12px', backgroundColor: s.bg, color: s.color, borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{s.label}</span>;
  };

  const viewTaskDetail = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    setGuideText(task.mentor_guidance || '');
    setFeedback('');
  };

  const renderTaskTimeline = (task) => {
    const steps = [];
    steps.push({
      label: '师傅发布任务',
      time: task.created_at,
      done: true,
      icon: '📋',
      person: task.mentor_name || '师傅',
      detail: task.title
    });

    if (task.status === 'accepted' || task.status === 'in_progress' || task.status === 'completed') {
      steps.push({
        label: '徒弟接单',
        time: task.accepted_at,
        done: true,
        icon: '✋',
        person: task.apprentice_name || '徒弟',
        detail: '确认接受任务'
      });
    } else if (task.status === 'published') {
      steps.push({
        label: '等待徒弟接单',
        time: null,
        done: false,
        icon: '⏳',
        person: task.apprentice_name || '待指定徒弟',
        detail: ''
      });
    }

    if (task.status === 'in_progress' || task.status === 'completed') {
      steps.push({
        label: '师傅远程指导',
        time: task.updated_at,
        done: true,
        icon: '💬',
        person: task.mentor_name || '师傅',
        detail: task.mentor_guidance ? (task.mentor_guidance.length > 40 ? task.mentor_guidance.substring(0, 40) + '...' : task.mentor_guidance) : ''
      });
    } else if (task.status === 'accepted') {
      steps.push({
        label: '等待师傅指导',
        time: null,
        done: false,
        icon: '⏳',
        person: task.mentor_name || '师傅',
        detail: ''
      });
    }

    if (task.status === 'completed') {
      steps.push({
        label: '完工确认与评价',
        time: task.completed_at,
        done: true,
        icon: '⭐',
        person: task.apprentice_name || '徒弟',
        detail: task.rating ? `${task.rating}分 · ${task.feedback || ''}` : ''
      });
    } else if (task.status === 'in_progress') {
      steps.push({
        label: '等待完工确认',
        time: null,
        done: false,
        icon: '⏳',
        person: task.apprentice_name || '徒弟',
        detail: ''
      });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: step.done ? '#4e73df' : '#e5e7eb',
                color: step.done ? 'white' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 'bold', flexShrink: 0
              }}>
                {step.icon}
              </span>
              {idx < steps.length - 1 && (
                <div style={{ width: '2px', height: '24px', backgroundColor: step.done ? '#4e73df' : '#e5e7eb' }} />
              )}
            </div>
            <div style={{ paddingBottom: '14px', flex: 1 }}>
              <div style={{ fontWeight: '600', color: step.done ? '#5a5c69' : '#9ca3af', fontSize: '14px' }}>
                {step.label}
                {step.person && <span style={{ color: '#4e73df', marginLeft: '6px', fontWeight: '500' }}>· {step.person}</span>}
              </div>
              {step.time && (
                <div style={{ fontSize: '12px', color: '#858796', marginTop: '2px' }}>
                  {new Date(step.time).toLocaleString('zh-CN')}
                </div>
              )}
              {step.detail && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {step.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#5a5c69' }}>
            👨‍🏫 师徒结对管理
          </h1>
          <p style={{ margin: 0, color: '#858796', fontSize: '14px' }}>
            任务发布 → 徒弟接单 → 师傅指导 → 完工评价
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 20px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 20px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px' }}>
          ✅ {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e3e6f0' }}>
        {[
          { key: 'pairs', label: '师徒配对' },
          { key: 'tasks', label: '任务管理' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '14px 28px',
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#4e73df' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#5a5c69',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'pairs' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e3e6f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#5a5c69' }}>📋 师徒配对列表</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fc' }}>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>配对ID</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>师傅</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>徒弟</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>状态</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {pairs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#858796' }}>
                    暂无师徒配对数据
                  </td>
                </tr>
              ) : (
                pairs.map((pair) => (
                  <tr key={pair.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                    <td style={{ padding: '14px', fontWeight: '600', color: '#5a5c69' }}>#{pair.id}</td>
                    <td style={{ padding: '14px', color: '#5a5c69' }}>
                      <span style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                        👨‍🔧 {pair.mentor_name || '高级技师'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: '#5a5c69' }}>
                      <span style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                        👷 {pair.apprentice_name || '学徒'}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '4px 12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                        {pair.status === 'active' ? '进行中' : '已结束'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontSize: '13px', color: '#858796' }}>
                      {pair.created_at ? new Date(pair.created_at).toLocaleString('zh-CN') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#5a5c69' }}>📝 任务列表</h2>
            <button
              onClick={() => setShowTaskForm(true)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#4e73df',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
              }}
            >
              + 发布新任务
            </button>
          </div>

          {showTaskForm && (
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px', border: '2px solid #4e73df' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#4e73df' }}>📋 发布新任务</h3>
                <button onClick={() => setShowTaskForm(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>选择师徒配对 *</label>
                  <select
                    value={newTask.mentor_apprentice_id}
                    onChange={(e) => setNewTask({ ...newTask, mentor_apprentice_id: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">请选择...</option>
                    {pairs.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - 师傅: {p.mentor_name || '技师'} / 徒弟: {p.apprentice_name || '学徒'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>任务标题 *</label>
                  <input
                    type="text"
                    placeholder="如：发动机异响诊断"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>任务描述</label>
                  <textarea
                    placeholder="详细描述任务要求..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={4}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={handleCreateTask}
                  disabled={loading}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#4e73df',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? '发布中...' : '发布任务'}
                </button>
                <button
                  onClick={() => setShowTaskForm(false)}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fc' }}>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>任务ID</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>任务标题</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>师傅</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>徒弟</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>状态</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>评价</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>创建时间</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#858796' }}>暂无任务数据</td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                      <td style={{ padding: '14px', fontWeight: '600', color: '#5a5c69' }}>#{task.id}</td>
                      <td style={{ padding: '14px', color: '#5a5c69', maxWidth: '200px' }}>{task.title}</td>
                      <td style={{ padding: '14px', color: '#5a5c69', fontSize: '13px' }}>
                        <span style={{ padding: '3px 8px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '10px', fontSize: '12px' }}>
                          {task.mentor_name || '师傅'}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#5a5c69', fontSize: '13px' }}>
                        <span style={{ padding: '3px 8px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '10px', fontSize: '12px' }}>
                          {task.apprentice_name || '待指定'}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>{getStatusBadge(task.status)}</td>
                      <td style={{ padding: '14px', color: '#5a5c69' }}>
                        {task.rating ? (
                          <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                            {'⭐'.repeat(task.rating)} {task.rating}分
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '14px', fontSize: '13px', color: '#858796' }}>
                        {task.created_at ? new Date(task.created_at).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <button
                          onClick={() => viewTaskDetail(task)}
                          style={{ padding: '6px 16px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTaskDetail && selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#5a5c69' }}>
                任务详情 #{selectedTask.id}
                <span style={{ marginLeft: '12px' }}>{getStatusBadge(selectedTask.status)}</span>
              </h2>
              <button onClick={() => { setShowTaskDetail(false); setSelectedTask(null); }} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div style={{ backgroundColor: '#f8f9fc', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#5a5c69' }}>📋 任务信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', color: '#5a5c69' }}>
                <div><strong>任务标题：</strong>{selectedTask.title}</div>
                <div><strong>当前状态：</strong>{getStatusBadge(selectedTask.status)}</div>
                <div><strong>师傅：</strong><span style={{ color: '#1d4ed8', fontWeight: '500' }}>{selectedTask.mentor_name || '师傅'}</span></div>
                <div><strong>徒弟：</strong><span style={{ color: '#b45309', fontWeight: '500' }}>{selectedTask.apprentice_name || '待指定'}</span></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>任务描述：</strong>{selectedTask.description || '-'}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8f9fc', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#5a5c69' }}>⏱️ 任务流转时间线</h3>
              {renderTaskTimeline(selectedTask)}
            </div>

            {selectedTask.mentor_guidance && (selectedTask.status === 'in_progress' || selectedTask.status === 'completed') && (
              <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1d4ed8' }}>💬 师傅远程指导内容</h4>
                <p style={{ margin: 0, color: '#5a5c69', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedTask.mentor_guidance}</p>
              </div>
            )}

            {selectedTask.status === 'published' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, color: '#b45309', fontWeight: '500' }}>📌 任务已发布，等待徒弟接单</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#858796' }}>
                      发布人：{selectedTask.mentor_name || '师傅'} · 发布时间：{selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleString('zh-CN') : '-'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptTask(selectedTask.id)}
                    disabled={loading}
                    style={{ padding: '10px 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                  >
                    {loading ? '处理中...' : '徒弟接单'}
                  </button>
                </div>
              </div>
            )}

            {selectedTask.status === 'accepted' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, color: '#b45309', fontWeight: '500' }}>
                    ✋ 徒弟 {selectedTask.apprentice_name || ''} 已接单
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#858796' }}>
                    接单时间：{selectedTask.accepted_at ? new Date(selectedTask.accepted_at).toLocaleString('zh-CN') : '-'}
                  </p>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: '#5a5c69' }}>💬 师傅远程指导</h3>
                <textarea
                  placeholder="请输入指导内容..."
                  value={guideText}
                  onChange={(e) => setGuideText(e.target.value)}
                  rows={5}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleSubmitGuidance(selectedTask.id)}
                    disabled={loading}
                    style={{ padding: '10px 24px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                  >
                    提交指导
                  </button>
                </div>
              </div>
            )}

            {selectedTask.status === 'in_progress' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#fce7f3', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#be185d' }}>📝 师傅指导内容：</h4>
                  <p style={{ margin: 0, color: '#831843', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedTask.mentor_guidance || guideText || '-'}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#858796' }}>
                    指导人：{selectedTask.mentor_name || '师傅'} · 时间：{selectedTask.updated_at ? new Date(selectedTask.updated_at).toLocaleString('zh-CN') : '-'}
                  </p>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: '#5a5c69' }}>✅ 完工评价</h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>评分：</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setRating(s)}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: rating >= s ? '#f59e0b' : '#f3f4f6',
                          color: rating >= s ? 'white' : '#4b5563',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: '600',
                        }}
                      >
                        {s} ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>评价内容：</label>
                  <textarea
                    placeholder="请填写任务完成评价..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleCompleteTask(selectedTask.id)}
                    disabled={loading}
                    style={{ padding: '10px 24px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                  >
                    完成任务
                  </button>
                </div>
              </div>
            )}

            {selectedTask.status === 'completed' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#dcfce7', padding: '20px', borderRadius: '10px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#166534' }}>⭐ 最终评价</h4>
                  <p style={{ margin: '0 0 8px 0', color: '#d97706', fontSize: '18px', fontWeight: 'bold' }}>
                    {'⭐'.repeat(selectedTask.rating || 5)} {selectedTask.rating || 5}分
                  </p>
                  <p style={{ margin: '0 0 4px 0', color: '#14532d', fontSize: '14px' }}>{selectedTask.feedback || '-'}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#858796' }}>
                    评价人：{selectedTask.apprentice_name || '徒弟'} · 完成时间：{selectedTask.completed_at ? new Date(selectedTask.completed_at).toLocaleString('zh-CN') : '-'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorApprentice;
