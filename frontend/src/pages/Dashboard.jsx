import React, { useState, useEffect } from 'react';
import { commonApi, courseApi } from '../services/api';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({});
  const [recentCourses, setRecentCourses] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, coursesRes] = await Promise.all([
        commonApi.getStats(),
        courseApi.getAll({ status: 'published' })
      ]);
      setStats(statsRes.data);
      setRecentCourses(coursesRes.data.slice(0, 5));
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const getStatCards = () => {
    if (user.role === 'admin') {
      return [
        { label: '已发布课程', value: stats.totalCourses },
        { label: '学生总数', value: stats.totalStudents },
        { label: '报名人次', value: stats.totalEnrollments },
        { label: '收费总额', value: `¥${stats.totalRevenue || 0}` },
      ];
    } else if (user.role === 'teacher') {
      return [
        { label: '我的课程', value: stats.myCourses },
        { label: '授课学生', value: stats.totalStudents },
      ];
    } else if (user.role === 'parent') {
      return [
        { label: '我的孩子', value: stats.myChildren },
        { label: '已报课程', value: stats.enrolledCourses },
      ];
    } else {
      return [
        { label: '已报课程', value: stats.enrolledCourses },
      ];
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>首页</h2>
      
      <div className="stat-cards">
        {getStatCards().map((stat, index) => (
          <div key={index} className="stat-card">
            <h3>{stat.label}</h3>
            <div className="value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>最新课程</h3>
        <table>
          <thead>
            <tr>
              <th>课程名称</th>
              <th>授课教师</th>
              <th>上课时间</th>
              <th>费用</th>
              <th>报名情况</th>
            </tr>
          </thead>
          <tbody>
            {recentCourses.map(course => (
              <tr key={course.id}>
                <td>{course.name}</td>
                <td>{course.teacher_name}</td>
                <td>周{['一', '二', '三', '四', '五', '六', '日'][course.day_of_week - 1]} {course.start_time}-{course.end_time}</td>
                <td>¥{course.fee}</td>
                <td>
                  <span className={`badge ${course.enrolled_count >= course.capacity ? 'badge-warning' : 'badge-success'}`}>
                    {course.enrolled_count}/{course.capacity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
