import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CampDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');
  const [camp, setCamp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ day_number: 1, title: '', content: '', materials: '', checkin_rule: '' });
  const [groupForm, setGroupForm] = useState({ name: '', teacher_id: '' });
  const [enrollForm, setEnrollForm] = useState({ user_id: '', group_id: '' });

  useEffect(() => {
    loadCamp();
    loadTasks();
    loadGroups();
    loadEnrollments();
    loadUsers();
  }, [id]);

  const loadCamp = async () => {
    const res = await axios.get(`/api/camps/${id}`);
    setCamp(res.data);
  };

  const loadTasks = async () => {
    const res = await axios.get(`/api/camps/${id}/tasks`);
    setTasks(res.data);
  };

  const loadGroups = async () => {
    const res = await axios.get(`/api/camps/${id}/groups`);
    setGroups(res.data);
  };

  const loadEnrollments = async () => {
    const res = await axios.get(`/api/camps/${id}/enrollments`);
    setEnrollments(res.data);
  };

  const loadUsers = async () => {
    const res = await axios.get('/api/users');
    setUsers(res.data);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    await axios.post(`/api/camps/${id}/tasks`, taskForm);
    setShowTaskModal(false);
    setTaskForm({ day_number: tasks.length + 1, title: '', content: '', materials: '', checkin_rule: '' });
    loadTasks();
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    await axios.post(`/api/camps/${id}/groups`, groupForm);
    setShowGroupModal(false);
    setGroupForm({ name: '', teacher_id: '' });
    loadGroups();
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    await axios.post(`/api/camps/${id}/enroll`, enrollForm);
    setShowEnrollModal(false);
    setEnrollForm({ user_id: '', group_id: '' });
    loadEnrollments();
  };

  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');
  const enrolledIds = new Set(enrollments.map(e => e.user_id));
  const availableStudents = students.filter(s => !enrolledIds.has(s.id));

  if (!camp) return <div className="card"><p>加载中...</p></div>;

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <button className="btn btn-outline" onClick={() => navigate('/camps')}>← 返回</button>
          <span style={{ marginLeft: 16, fontSize: 20, fontWeight: 600 }}>{camp.name}</span>
        </div>
        <div className="flex gap-2">
          {activeTab === 'tasks' && <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ 添加任务</button>}
          {activeTab === 'groups' && <button className="btn btn-primary" onClick={() => setShowGroupModal(true)}>+ 新建分组</button>}
          {activeTab === 'students' && <button className="btn btn-primary" onClick={() => setShowEnrollModal(true)}>+ 添加学员</button>}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>每日任务</button>
        <button className={`tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>分组管理</button>
        <button className={`tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>学员列表</button>
      </div>

      {activeTab === 'tasks' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>第几天</th>
                <th>任务标题</th>
                <th>打卡要求</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>第 {task.day_number} 天</td>
                  <td>{task.title}</td>
                  <td>{task.checkin_rule || '-'}</td>
                  <td>
                    <button className="btn btn-outline btn-sm">编辑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <p className="text-center text-gray" style={{ padding: 40 }}>暂无任务配置</p>}
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="grid">
          {groups.map(group => (
            <div key={group.id} className="card">
              <h3>{group.name}</h3>
              <p className="text-sm text-gray" style={{ marginTop: 8 }}>班主任: {group.teacher_name || '未分配'}</p>
              <p className="text-sm" style={{ marginTop: 4 }}>学员数: {group.student_count || 0}</p>
            </div>
          ))}
          {groups.length === 0 && <p className="text-center text-gray" style={{ padding: 40, gridColumn: '1/-1' }}>暂无分组</p>}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>学员</th>
                <th>手机号</th>
                <th>分组</th>
                <th>积分</th>
                <th>连续打卡</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(e => (
                <tr key={e.id}>
                  <td>{e.user_name}</td>
                  <td>{e.phone}</td>
                  <td>{e.group_name || '-'}</td>
                  <td>{e.points || 0}</td>
                  <td>{e.streak || 0} 天</td>
                  <td><span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {e.status === 'active' ? '活跃' : e.status === 'dropped' ? '掉队' : '暂停'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {enrollments.length === 0 && <p className="text-center text-gray" style={{ padding: 40 }}>暂无学员</p>}
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>添加每日任务</h2><button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button></div>
            <form onSubmit={handleAddTask}>
              <div className="form-row">
                <div className="form-group"><label>第几天</label><input type="number" required value={taskForm.day_number} onChange={(e) => setTaskForm({ ...taskForm, day_number: parseInt(e.target.value) })} /></div>
                <div className="form-group"><label>任务标题</label><input required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>任务内容</label><textarea rows={4} value={taskForm.content} onChange={(e) => setTaskForm({ ...taskForm, content: e.target.value })} /></div>
              <div className="form-group"><label>打卡要求</label><input value={taskForm.checkin_rule} onChange={(e) => setTaskForm({ ...taskForm, checkin_rule: e.target.value })} /></div>
              <div className="flex gap-2"><button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowTaskModal(false)}>取消</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }}>添加</button></div>
            </form>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>新建分组</h2><button className="modal-close" onClick={() => setShowGroupModal(false)}>×</button></div>
            <form onSubmit={handleAddGroup}>
              <div className="form-group"><label>分组名称</label><input required value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} /></div>
              <div className="form-group"><label>班主任</label><select value={groupForm.teacher_id} onChange={(e) => setGroupForm({ ...groupForm, teacher_id: e.target.value })}><option value="">请选择</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div className="flex gap-2"><button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowGroupModal(false)}>取消</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }}>创建</button></div>
            </form>
          </div>
        </div>
      )}

      {showEnrollModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>添加学员</h2><button className="modal-close" onClick={() => setShowEnrollModal(false)}>×</button></div>
            <form onSubmit={handleEnroll}>
              <div className="form-group"><label>选择学员</label><select required value={enrollForm.user_id} onChange={(e) => setEnrollForm({ ...enrollForm, user_id: e.target.value })}><option value="">请选择</option>{availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{availableStudents.length === 0 && <p className="text-sm text-gray mt-2">所有学员都已加入</p>}</div>
              <div className="form-group"><label>选择分组</label><select value={enrollForm.group_id} onChange={(e) => setEnrollForm({ ...enrollForm, group_id: e.target.value })}><option value="">不分组</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              <div className="flex gap-2"><button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowEnrollModal(false)}>取消</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={availableStudents.length === 0}>添加</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampDetail;
