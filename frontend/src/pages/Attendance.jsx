import React, { useState, useEffect } from 'react';
import { courseApi, attendanceApi, commonApi, enrollmentApi } from '../services/api';

const Attendance = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);

  useEffect(() => {
    if (['admin', 'teacher'].includes(user.role)) {
      loadCourses();
    } else if (user.role === 'parent' && user.children?.length > 0) {
      setSelectedStudent(user.children[0].id);
      loadStudentAttendance(user.children[0].id);
    } else if (user.role === 'student') {
      setSelectedStudent(user.id);
      loadStudentAttendance(user.id);
    }
  }, [user]);

  const loadCourses = async () => {
    try {
      const params = { status: 'published' };
      if (user.role === 'teacher') {
        params.teacher_id = user.id;
      }
      const response = await courseApi.getAll(params);
      setCourses(response.data);
    } catch (err) {
      console.error('加载课程失败', err);
    }
  };

  const loadAttendance = async () => {
    if (!selectedCourse || !selectedDate) return;
    try {
      const [attendanceRes, enrollmentsRes] = await Promise.all([
        attendanceApi.getByCourse(selectedCourse, selectedDate),
        enrollmentApi.getAll({ course_id: selectedCourse, status: 'enrolled' })
      ]);
      
      setAttendanceRecords(attendanceRes.data);
      
      const enrolled = enrollmentsRes.data.map(e => ({
        id: e.student_id,
        name: e.student_name,
        grade_name: e.grade_name,
        enrollment_id: e.id
      }));
      setEnrolledStudents(enrolled);
    } catch (err) {
      console.error('加载签到记录失败', err);
    }
  };

  const loadStudentAttendance = async (studentId) => {
    try {
      const response = await attendanceApi.getByStudent(studentId);
      setStudentAttendance(response.data);
    } catch (err) {
      console.error('加载签到记录失败', err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => {
      const existing = prev.find(r => r.student_id === studentId);
      if (existing) {
        return prev.map(r => r.student_id === studentId ? { ...r, status } : r);
      }
      return [...prev, { student_id: studentId, status, notes: '' }];
    });
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceRecords(prev => {
      const existing = prev.find(r => r.student_id === studentId);
      if (existing) {
        return prev.map(r => r.student_id === studentId ? { ...r, notes } : r);
      }
      return [...prev, { student_id: studentId, status: 'present', notes }];
    });
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedDate) return;
    
    const records = attendanceRecords.map(r => ({
      student_id: r.student_id,
      status: r.status,
      notes: r.notes || ''
    }));

    try {
      await attendanceApi.saveBatch(selectedCourse, selectedDate, records);
      alert('保存成功！');
      loadAttendance();
    } catch (err) {
      alert(err.response?.data?.error || '保存失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: { class: 'badge-success', text: '出勤' },
      absent: { class: 'badge-danger', text: '缺勤' },
      late: { class: 'badge-warning', text: '迟到' },
      excused: { class: 'badge-primary', text: '请假' }
    };
    const badge = badges[status] || { class: '', text: status };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const getStudentStatus = (studentId) => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record?.status || 'present';
  };

  const getStudentNotes = (studentId) => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record?.notes || '';
  };

  if (['parent', 'student'].includes(user.role)) {
    return (
      <div>
        <h2 style={{ marginBottom: 20 }}>我的签到</h2>

        {user.role === 'parent' && (
          <div className="card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'inline', marginRight: 10 }}>选择学生：</label>
              <select 
                value={selectedStudent || ''} 
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedStudent(id);
                  loadStudentAttendance(id);
                }}
              >
                {user.children?.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>签到统计</h3>
          <div style={{ display: 'flex', gap: 20 }}>
            <div className="stat-card" style={{ flex: 1 }}>
              <h3>出勤</h3>
              <div className="value" style={{ color: '#52c41a' }}>
                {studentAttendance.filter(a => a.status === 'present').length}
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <h3>缺勤</h3>
              <div className="value" style={{ color: '#ff4d4f' }}>
                {studentAttendance.filter(a => a.status === 'absent').length}
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <h3>迟到</h3>
              <div className="value" style={{ color: '#faad14' }}>
                {studentAttendance.filter(a => a.status === 'late').length}
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <h3>请假</h3>
              <div className="value" style={{ color: '#1890ff' }}>
                {studentAttendance.filter(a => a.status === 'excused').length}
              </div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>课程名称</th>
              <th>日期</th>
              <th>状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {studentAttendance.map(a => (
              <tr key={a.id}>
                <td>{a.course_name}</td>
                <td>{a.date}</td>
                <td>{getStatusBadge(a.status)}</td>
                <td>{a.notes || '-'}</td>
              </tr>
            ))}
            {studentAttendance.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                  暂无签到记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>签到管理</h2>

      <div className="card">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'inline', marginRight: 10 }}>选择课程：</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">请选择课程</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.teacher_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'inline', marginRight: 10 }}>选择日期：</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={loadAttendance} disabled={!selectedCourse}>
            查询
          </button>
          {selectedCourse && (
            <button className="btn btn-success" onClick={handleSave}>
              保存签到
            </button>
          )}
        </div>
      </div>

      {selectedCourse && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>签到列表 - {selectedDate}</h3>
          
          {enrolledStudents.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>该课程暂无报名学生</p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <span><span className="badge badge-success">出勤</span> {enrolledStudents.filter(s => getStudentStatus(s.id) === 'present').length}人</span>
                <span><span className="badge badge-danger">缺勤</span> {enrolledStudents.filter(s => getStudentStatus(s.id) === 'absent').length}人</span>
                <span><span className="badge badge-warning">迟到</span> {enrolledStudents.filter(s => getStudentStatus(s.id) === 'late').length}人</span>
                <span><span className="badge badge-primary">请假</span> {enrolledStudents.filter(s => getStudentStatus(s.id) === 'excused').length}人</span>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>学生姓名</th>
                    <th>年级</th>
                    <th>签到状态</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.grade_name}</td>
                      <td>
                        <select
                          value={getStudentStatus(student.id)}
                          onChange={(e) => handleStatusChange(student.id, e.target.value)}
                        >
                          <option value="present">出勤</option>
                          <option value="absent">缺勤</option>
                          <option value="late">迟到</option>
                          <option value="excused">请假</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={getStudentNotes(student.id)}
                          placeholder="备注"
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
