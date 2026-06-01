import React, { useState, useEffect } from 'react';
import { enrollmentApi } from '../services/api';

const Enrollments = ({ user }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState({ status: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (user.role === 'parent' && user.children?.length > 0) {
      setSelectedStudent(user.children[0].id);
    } else if (user.role === 'student') {
      setSelectedStudent(user.id);
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const params = { ...filter };
      if (selectedStudent && ['parent', 'student'].includes(user.role)) {
        params.student_id = selectedStudent;
      }
      const response = await enrollmentApi.getAll(params);
      setEnrollments(response.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleDrop = async (enrollmentId) => {
    if (!confirm('确定要退课吗？')) return;
    try {
      await enrollmentApi.drop(enrollmentId, '主动退课');
      alert('退课成功！');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '退课失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      enrolled: { class: 'badge-success', text: '已报名' },
      waitlist: { class: 'badge-warning', text: '候补' },
      dropped: { class: 'badge-danger', text: '已退课' },
      completed: { class: 'badge-primary', text: '已完成' }
    };
    const badge = badges[status] || { class: '', text: status };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>报名记录</h2>

      <div className="card">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {user.role === 'parent' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'inline', marginRight: 10 }}>选择学生：</label>
              <select value={selectedStudent || ''} onChange={(e) => setSelectedStudent(Number(e.target.value))}>
                <option value="">全部</option>
                {user.children?.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'inline', marginRight: 10 }}>状态：</label>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">全部</option>
              <option value="enrolled">已报名</option>
              <option value="waitlist">候补</option>
              <option value="dropped">已退课</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadData}>查询</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>课程名称</th>
            <th>学生姓名</th>
            {['admin', 'teacher'].includes(user.role) && <th>年级</th>}
            <th>授课教师</th>
            <th>上课时间</th>
            <th>费用</th>
            <th>状态</th>
            <th>报名时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map(e => (
            <tr key={e.id}>
              <td>{e.course_name}</td>
              <td>{e.student_name}</td>
              {['admin', 'teacher'].includes(user.role) && <td>{e.grade_name}</td>}
              <td>{e.teacher_name}</td>
              <td>周{['一', '二', '三', '四', '五', '六', '日'][e.day_of_week - 1]} {e.start_time}-{e.end_time}</td>
              <td>¥{e.fee}</td>
              <td>
                {getStatusBadge(e.status)}
                {e.status === 'waitlist' && <span className="badge badge-warning">#{e.waitlist_position}</span>}
              </td>
              <td>{e.enrolled_at || e.created_at}</td>
              <td>
                {['enrolled', 'waitlist'].includes(e.status) && ['parent', 'student'].includes(user.role) && (
                  <button className="btn btn-danger" onClick={() => handleDrop(e.id)}>退课</button>
                )}
              </td>
            </tr>
          ))}
          {enrollments.length === 0 && (
            <tr>
              <td colSpan={['admin', 'teacher'].includes(user.role) ? 9 : 8} style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                暂无报名记录
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Enrollments;
