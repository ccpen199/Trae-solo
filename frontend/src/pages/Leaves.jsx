import { useState, useEffect } from 'react';
import api from '../utils/api';

function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  
  const [formData, setFormData] = useState({
    student_id: '',
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGuardian = user.role === 'guardian';
  const canApprove = user.role === 'admin' || user.role === 'teacher';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leaveRes, userRes] = await Promise.all([
        api.get('/leaves'),
        api.get('/auth/me')
      ]);
      setLeaves(leaveRes.data);
      
      if (isGuardian && userRes.data.guardianships) {
        setStudents(userRes.data.guardianships.map(g => ({
          id: g.student_id,
          name: g.student_name
        })));
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (leave) => {
    try {
      const res = await api.get(`/leaves/${leave.id}`);
      setSelectedLeave(res.data);
      setShowModal(true);
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', formData);
      setShowCreate(false);
      setFormData({
        student_id: '',
        leave_type: 'sick',
        start_date: '',
        end_date: '',
        reason: ''
      });
      loadData();
      alert('申请已提交');
    } catch (error) {
      alert('提交失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.post(`/leaves/${id}/approve`, { status });
      loadData();
      if (selectedLeave?.id === id) {
        setSelectedLeave(prev => ({ ...prev, status, approved_at: new Date().toISOString() }));
      }
      alert('审批完成');
    } catch (error) {
      alert('审批失败');
    }
  };

  const handleCheckin = async (id) => {
    try {
      await api.post(`/leaves/${id}/checkin`);
      loadData();
      if (selectedLeave?.id === id) {
        setSelectedLeave(prev => ({ ...prev, status: 'completed', check_in_at: new Date().toISOString() }));
      }
      alert('销假完成');
    } catch (error) {
      alert('销假失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', text: '待审批' },
      approved: { class: 'badge-success', text: '已批准' },
      rejected: { class: 'badge-danger', text: '已拒绝' },
      completed: { class: 'badge-secondary', text: '已销假' }
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const getLeaveTypeText = (type) => {
    const types = {
      sick: '病假',
      personal: '事假',
      other: '其他'
    };
    return types[type] || type;
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex flex-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>请假管理</h1>
        {isGuardian && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 申请请假
          </button>
        )}
      </div>

      {leaves.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无请假记录</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>学生</th>
                <th>请假类型</th>
                <th>开始日期</th>
                <th>结束日期</th>
                <th>天数</th>
                <th>状态</th>
                {!isGuardian && <th>申请人</th>}
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => {
                const badge = getStatusBadge(leave.status);
                return (
                  <tr key={leave.id}>
                    <td>{leave.student_name}</td>
                    <td>{getLeaveTypeText(leave.leave_type)}</td>
                    <td>{leave.start_date}</td>
                    <td>{leave.end_date}</td>
                    <td>
                      {leave.days}天
                      {leave.is_long_leave && <span className="badge badge-danger" style={{ marginLeft: '5px' }}>长假</span>}
                    </td>
                    <td><span className={`badge ${badge.class}`}>{badge.text}</span></td>
                    {!isGuardian && <td>{leave.guardian_name}</td>}
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleView(leave)}>
                        查看
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedLeave && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>请假详情</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="grid grid-cols-2">
              <div><strong>学生：</strong>{selectedLeave.student_name}</div>
              <div><strong>学号：</strong>{selectedLeave.student_no}</div>
              <div><strong>班级：</strong>{selectedLeave.class_name}</div>
              <div><strong>请假类型：</strong>{getLeaveTypeText(selectedLeave.leave_type)}</div>
              <div><strong>开始日期：</strong>{selectedLeave.start_date}</div>
              <div><strong>结束日期：</strong>{selectedLeave.end_date}</div>
              <div><strong>天数：</strong>{selectedLeave.days}天</div>
              <div>
                <strong>状态：</strong>
                <span className={`badge ${getStatusBadge(selectedLeave.status).class}`}>
                  {getStatusBadge(selectedLeave.status).text}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <strong>请假原因：</strong>
              <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{selectedLeave.reason}</p>
            </div>
            {selectedLeave.approver_name && (
              <div className="mt-4">
                <strong>审批人：</strong>{selectedLeave.approver_name}
                <span style={{ marginLeft: '20px' }}>
                  <strong>审批时间：</strong>{new Date(selectedLeave.approved_at).toLocaleString()}
                </span>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              {canApprove && selectedLeave.status === 'pending' && (
                <>
                  <button className="btn btn-success" onClick={() => handleApprove(selectedLeave.id, 'approved')}>
                    批准
                  </button>
                  <button className="btn btn-danger" onClick={() => handleApprove(selectedLeave.id, 'rejected')}>
                    拒绝
                  </button>
                </>
              )}
              {canApprove && selectedLeave.status === 'approved' && (
                <button className="btn btn-primary" onClick={() => handleCheckin(selectedLeave.id)}>
                  销假
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>申请请假</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择学生 *</label>
                <select
                  value={formData.student_id}
                  onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                  required
                >
                  <option value="">请选择</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>请假类型 *</label>
                <select
                  value={formData.leave_type}
                  onChange={e => setFormData({ ...formData, leave_type: e.target.value })}
                >
                  <option value="sick">病假</option>
                  <option value="personal">事假</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label>开始日期 *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>结束日期 *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>请假原因 *</label>
                <textarea
                  rows="4"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">提交申请</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaves;
