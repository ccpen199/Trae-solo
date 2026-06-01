import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseApi, enrollmentApi } from '../services/api';

const CourseDetail = ({ user }) => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [courseRes, enrollmentsRes] = await Promise.all([
        courseApi.get(id),
        enrollmentApi.getAll({ course_id: id })
      ]);
      setCourse(courseRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!course) return <div>课程不存在</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{course.name}</h2>
        <Link to="/courses" className="btn">返回列表</Link>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>课程信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div>
            <p><strong>授课教师：</strong>{course.teacher_name}</p>
            <p><strong>上课时间：</strong>周{['一', '二', '三', '四', '五', '六', '日'][course.day_of_week - 1]} {course.start_time}-{course.end_time}</p>
            <p><strong>教室：</strong>{course.classroom_name}</p>
            <p><strong>课程费用：</strong>¥{course.fee}</p>
          </div>
          <div>
            <p><strong>招生人数：</strong>{course.capacity}人</p>
            <p><strong>已报名：</strong>{course.enrolled_count}人</p>
            <p><strong>候补人数：</strong>{course.waitlist_count}人</p>
            <p><strong>课程状态：</strong>
              <span className={`badge ${course.status === 'published' ? 'badge-success' : 'badge-primary'}`}>
                {course.status === 'published' ? '已发布' : course.status === 'draft' ? '草稿' : course.status}
              </span>
            </p>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <p><strong>课程描述：</strong></p>
          <p style={{ color: '#666' }}>{course.description || '暂无描述'}</p>
        </div>
        <div style={{ marginTop: 16 }}>
          <p><strong>报名条件：</strong></p>
          <p style={{ color: '#666' }}>{course.requirements || '无特殊要求'}</p>
        </div>
        <div style={{ marginTop: 16 }}>
          <p><strong>退费规则：</strong></p>
          <p style={{ color: '#666' }}>{course.refund_rule || '开课前可申请退费'}</p>
        </div>
      </div>

      {['admin', 'teacher'].includes(user.role) && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>报名学生</h3>
          <table>
            <thead>
              <tr>
                <th>学生姓名</th>
                <th>年级</th>
                <th>报名状态</th>
                <th>候补位置</th>
                <th>报名时间</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(enrollment => (
                <tr key={enrollment.id}>
                  <td>{enrollment.student_name}</td>
                  <td>{enrollment.grade_name}</td>
                  <td>
                    <span className={`badge ${enrollment.status === 'enrolled' ? 'badge-success' : enrollment.status === 'waitlist' ? 'badge-warning' : 'badge-danger'}`}>
                      {enrollment.status === 'enrolled' ? '已报名' : enrollment.status === 'waitlist' ? '候补' : enrollment.status}
                    </span>
                  </td>
                  <td>{enrollment.waitlist_position || '-'}</td>
                  <td>{enrollment.enrolled_at || enrollment.created_at}</td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>暂无报名记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
