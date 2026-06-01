import React, { useState, useEffect } from 'react';
import { enrollmentApi, attendanceApi } from '../services/api';

const Schedule = ({ user }) => {
  const [schedule, setSchedule] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [loading, setLoading] = useState(false);

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  const weekDates = getWeekDates(currentWeekStart);
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  useEffect(() => {
    if (user.role === 'parent' && user.children?.length > 0) {
      setSelectedStudent(user.children[0].id);
    } else if (user.role === 'student') {
      setSelectedStudent(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      loadData();
    }
  }, [selectedStudent, currentWeekStart]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scheduleRes, attendanceRes] = await Promise.all([
        enrollmentApi.getSchedule(selectedStudent),
        attendanceApi.getByStudent(selectedStudent)
      ]);
      setSchedule(scheduleRes.data);
      setAttendance(attendanceRes.data);
    } catch (err) {
      console.error('加载课表失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (courseId, dateStr) => {
    const record = attendance.find(a => a.course_id === courseId && a.date === dateStr);
    if (!record) return null;
    
    const statusMap = {
      present: { text: '出勤', class: 'badge-success' },
      absent: { text: '缺勤', class: 'badge-danger' },
      late: { text: '迟到', class: 'badge-warning' },
      excused: { text: '请假', class: 'badge-primary' }
    };
    return statusMap[record.status] || { text: record.status, class: '' };
  };

  const getCoursesByDay = (day) => {
    return schedule.filter(c => c.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>我的课表</h2>

      {user.role === 'parent' && (
        <div className="card">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'inline', marginRight: 10 }}>选择学生：</label>
            <select 
              value={selectedStudent || ''} 
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedStudent(id);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button className="btn" onClick={prevWeek}>◀ 上一周</button>
          <h3>
            {formatDate(weekDates[0])} ~ {formatDate(weekDates[6])}
          </h3>
          <button className="btn" onClick={nextWeek}>下一周 ▶</button>
        </div>

        <div className="schedule-grid">
          <div className="schedule-header">时间</div>
          {weekDates.map((date, index) => (
            <div key={index} className="schedule-header">
              <div>{weekDays[index]}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{formatDate(date).slice(5)}</div>
            </div>
          ))}
          
          {[0, 1, 2, 3, 4].map(row => (
            <React.Fragment key={row}>
              <div className="schedule-cell">第{row + 1}节</div>
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const courses = getCoursesByDay(day);
                const course = courses[row];
                const dateStr = formatDate(weekDates[day - 1]);
                const attendanceStatus = course ? getAttendanceStatus(course.id, dateStr) : null;
                
                return (
                  <div key={day} className={`schedule-cell ${course ? 'course' : ''}`}>
                    {course && (
                      <div>
                        <div style={{ fontWeight: 600 }}>{course.name}</div>
                        <div style={{ fontSize: 11 }}>{course.start_time}-{course.end_time}</div>
                        <div style={{ fontSize: 10 }}>{course.classroom_name}</div>
                        {attendanceStatus && (
                          <div>
                            <span className={`badge ${attendanceStatus.class}`} style={{ marginTop: 4 }}>
                              {attendanceStatus.text}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>本周签到统计</h3>
        <div style={{ display: 'flex', gap: 20 }}>
          <div className="stat-card" style={{ flex: 1 }}>
            <h3>出勤</h3>
            <div className="value" style={{ color: '#52c41a' }}>
              {attendance.filter(a => a.status === 'present').length}
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <h3>缺勤</h3>
            <div className="value" style={{ color: '#ff4d4f' }}>
              {attendance.filter(a => a.status === 'absent').length}
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <h3>迟到</h3>
            <div className="value" style={{ color: '#faad14' }}>
              {attendance.filter(a => a.status === 'late').length}
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <h3>请假</h3>
            <div className="value" style={{ color: '#1890ff' }}>
              {attendance.filter(a => a.status === 'excused').length}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>课程列表</h3>
        <table>
          <thead>
            <tr>
              <th>课程名称</th>
              <th>授课教师</th>
              <th>上课时间</th>
              <th>教室</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map(course => (
              <tr key={course.id}>
                <td>{course.name}</td>
                <td>{course.teacher_name}</td>
                <td>{weekDays[course.day_of_week - 1]} {course.start_time}-{course.end_time}</td>
                <td>{course.classroom_name}</td>
              </tr>
            ))}
            {schedule.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                  暂无课程
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedule;
