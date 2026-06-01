import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '../api.js';

export default function Verification() {
  const [activeTab, setActiveTab] = useState('equipment');
  const [equipment, setEquipment] = useState([]);
  const [training, setTraining] = useState([]);
  const [audits, setAudits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTrainingForm, setShowTrainingForm] = useState(false);

  const [auditForm, setAuditForm] = useState({ audit_no: '', audit_date: '', auditor: '', department: '', findings: '' });
  const [taskForm, setTaskForm] = useState({ audit_id: '', description: '', responsible_id: '', deadline: '' });
  const [trainingForm, setTrainingForm] = useState({ user_id: '', training_name: '', training_date: '', trainer: '', certificate_no: '', expiry_date: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const equipData = await apiGet('/equipment');
    const trainingData = await apiGet('/training-records');
    const auditsData = await apiGet('/internal-audits');
    const tasksData = await apiGet('/corrective-tasks');
    const usersData = await apiGet('/users');
    setEquipment(equipData);
    setTraining(trainingData);
    setAudits(auditsData);
    setTasks(tasksData);
    setUsers(usersData);
  }

  async function handleAuditSubmit(e) {
    e.preventDefault();
    await apiPost('/internal-audits', auditForm);
    setAuditForm({ audit_no: '', audit_date: '', auditor: '', department: '', findings: '' });
    setShowAuditForm(false);
    loadData();
  }

  async function handleTaskSubmit(e) {
    e.preventDefault();
    await apiPost('/corrective-tasks', taskForm);
    setTaskForm({ audit_id: '', description: '', responsible_id: '', deadline: '' });
    setShowTaskForm(false);
    loadData();
  }

  async function handleTrainingSubmit(e) {
    e.preventDefault();
    await apiPost('/training-records', trainingForm);
    setTrainingForm({ user_id: '', training_name: '', training_date: '', trainer: '', certificate_no: '', expiry_date: '' });
    setShowTrainingForm(false);
    loadData();
  }

  async function completeTask(id) {
    await apiPatch(`/corrective-tasks/${id}`, { status: 'completed' });
    loadData();
  }

  function isCalibrationExpired(date) {
    return new Date(date) < new Date();
  }

  function isCalibrationSoon(date) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return new Date(date) < nextWeek;
  }

  return (
    <div>
      <div className="header">
        <h1>验证与内审</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>设备校准</div>
        <div className={`tab ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>人员培训</div>
        <div className={`tab ${activeTab === 'audits' ? 'active' : ''}`} onClick={() => setActiveTab('audits')}>内部审核</div>
        <div className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>整改任务</div>
      </div>

      {activeTab === 'equipment' && (
        <div className="card">
          <h2>设备校准记录</h2>
          <table>
            <thead>
              <tr>
                <th>设备编码</th>
                <th>设备名称</th>
                <th>位置</th>
                <th>上次校准</th>
                <th>下次校准</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(e => (
                <tr key={e.id} style={isCalibrationExpired(e.next_calibration_date) ? { background: '#f8d7da' } : isCalibrationSoon(e.next_calibration_date) ? { background: '#fff3cd' } : {}}>
                  <td>{e.code}</td>
                  <td>{e.name}</td>
                  <td>{e.location}</td>
                  <td>{e.last_calibration_date}</td>
                  <td>{e.next_calibration_date}</td>
                  <td>
                    {isCalibrationExpired(e.next_calibration_date) ? (
                      <span className="badge badge-danger">已过期</span>
                    ) : isCalibrationSoon(e.next_calibration_date) ? (
                      <span className="badge badge-warning">即将到期</span>
                    ) : (
                      <span className="badge badge-success">正常</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'training' && (
        <div className="card">
          <div className="button-group" style={{ marginBottom: '15px' }}>
            <button className="btn btn-primary" onClick={() => setShowTrainingForm(!showTrainingForm)}>
              {showTrainingForm ? '取消' : '+ 添加培训记录'}
            </button>
          </div>

          {showTrainingForm && (
            <form onSubmit={handleTrainingSubmit} style={{ marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>参训人员</label>
                  <select required value={trainingForm.user_id} onChange={e => setTrainingForm({ ...trainingForm, user_id: e.target.value })}>
                    <option value="">-- 选择人员 --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>培训名称</label>
                  <input required value={trainingForm.training_name} onChange={e => setTrainingForm({ ...trainingForm, training_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>培训日期</label>
                  <input type="date" required value={trainingForm.training_date} onChange={e => setTrainingForm({ ...trainingForm, training_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>讲师</label>
                  <input value={trainingForm.trainer} onChange={e => setTrainingForm({ ...trainingForm, trainer: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>证书编号</label>
                  <input value={trainingForm.certificate_no} onChange={e => setTrainingForm({ ...trainingForm, certificate_no: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>有效期至</label>
                  <input type="date" value={trainingForm.expiry_date} onChange={e => setTrainingForm({ ...trainingForm, expiry_date: e.target.value })} />
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-success">保存</button>
              </div>
            </form>
          )}

          <table>
            <thead>
              <tr>
                <th>人员</th>
                <th>培训名称</th>
                <th>培训日期</th>
                <th>讲师</th>
                <th>证书编号</th>
                <th>有效期</th>
              </tr>
            </thead>
            <tbody>
              {training.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>暂无培训记录</td></tr>
              ) : training.map(t => (
                <tr key={t.id}>
                  <td>{t.user_name}</td>
                  <td>{t.training_name}</td>
                  <td>{t.training_date}</td>
                  <td>{t.trainer || '-'}</td>
                  <td>{t.certificate_no || '-'}</td>
                  <td>{t.expiry_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audits' && (
        <div className="card">
          <div className="button-group" style={{ marginBottom: '15px' }}>
            <button className="btn btn-primary" onClick={() => setShowAuditForm(!showAuditForm)}>
              {showAuditForm ? '取消' : '+ 创建内审记录'}
            </button>
          </div>

          {showAuditForm && (
            <form onSubmit={handleAuditSubmit} style={{ marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>审核编号</label>
                  <input required value={auditForm.audit_no} onChange={e => setAuditForm({ ...auditForm, audit_no: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>审核日期</label>
                  <input type="date" required value={auditForm.audit_date} onChange={e => setAuditForm({ ...auditForm, audit_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>审核员</label>
                  <input required value={auditForm.auditor} onChange={e => setAuditForm({ ...auditForm, auditor: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>部门</label>
                  <input value={auditForm.department} onChange={e => setAuditForm({ ...auditForm, department: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>审核发现</label>
                <textarea rows="3" value={auditForm.findings} onChange={e => setAuditForm({ ...auditForm, findings: e.target.value })} />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-success">保存</button>
              </div>
            </form>
          )}

          <table>
            <thead>
              <tr>
                <th>审核编号</th>
                <th>审核日期</th>
                <th>审核员</th>
                <th>部门</th>
                <th>审核发现</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>暂无内审记录</td></tr>
              ) : audits.map(a => (
                <tr key={a.id}>
                  <td>{a.audit_no}</td>
                  <td>{a.audit_date}</td>
                  <td>{a.auditor}</td>
                  <td>{a.department || '-'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.findings || '-'}</td>
                  <td>
                    <span className={`badge ${a.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {a.status === 'completed' ? '已完成' : '进行中'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="card">
          <div className="button-group" style={{ marginBottom: '15px' }}>
            <button className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
              {showTaskForm ? '取消' : '+ 创建整改任务'}
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleTaskSubmit} style={{ marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>关联审核</label>
                  <select value={taskForm.audit_id} onChange={e => setTaskForm({ ...taskForm, audit_id: e.target.value })}>
                    <option value="">-- 无关联 --</option>
                    {audits.map(a => (
                      <option key={a.id} value={a.id}>{a.audit_no}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>责任人</label>
                  <select required value={taskForm.responsible_id} onChange={e => setTaskForm({ ...taskForm, responsible_id: e.target.value })}>
                    <option value="">-- 选择责任人 --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>截止日期</label>
                  <input type="date" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>任务描述</label>
                <textarea required rows="2" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-success">创建</button>
              </div>
            </form>
          )}

          <table>
            <thead>
              <tr>
                <th>创建时间</th>
                <th>关联审核</th>
                <th>任务描述</th>
                <th>责任人</th>
                <th>截止日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>暂无整改任务</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id} style={t.status === 'pending' ? { background: '#fff3cd' } : {}}>
                  <td>{t.created_at}</td>
                  <td>{t.audit_no || '-'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</td>
                  <td>{t.responsible_name}</td>
                  <td>{t.deadline || '-'}</td>
                  <td>
                    <span className={`badge ${t.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status === 'completed' ? '已完成' : '待处理'}
                    </span>
                  </td>
                  <td>
                    {t.status === 'pending' && (
                      <button className="btn btn-success btn-sm" onClick={() => completeTask(t.id)}>完成</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
