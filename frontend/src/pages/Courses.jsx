import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseApi, enrollmentApi, commonApi } from '../services/api';

const Courses = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [children, setChildren] = useState([]);
  const [filter, setFilter] = useState({ status: 'published' });

  useEffect(() => {
    loadData();
    if (user.role === 'parent' && user.children) {
      setChildren(user.children);
      if (user.children.length > 0) {
        setSelectedStudent(user.children[0].id);
      }
    } else if (user.role === 'student') {
      setSelectedStudent(user.id);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        courseApi.getAll(filter),
        enrollmentApi.getAll()
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const getEnrollmentStatus = (courseId) => {
    if (!selectedStudent) return null;
    return enrollments.find(e => e.student_id === selectedStudent && e.course_id === courseId);
  };

  const handleEnroll = async (courseId) => {
    if (!selectedStudent) {
      alert('请先选择学生');
      return;
    }
    try {
      await enrollmentApi.enroll({ student_id: selectedStudent, course_id: courseId });
      alert('报名成功！');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '报名失败');
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

  const handlePublish = async (courseId) => {
    try {
      await courseApi.publish(courseId);
      alert('发布成功！');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '发布失败');
    }
  };

  const handleDelete = async (courseId) => {
    if (!confirm('确定要删除此课程吗？')) return;
    try {
      await courseApi.delete(courseId);
      alert('删除成功！');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{['admin', 'teacher'].includes(user.role) ? '课程管理' : '课程列表'}</h2>
        {user.role === 'admin' && (
          <Link to="/courses/new" className="btn btn-primary">创建课程</Link>
        )}
      </div>

      {(user.role === 'parent' || user.role === 'student') && (
        <div className="card">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {user.role === 'parent' && (
              <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
                <label style={{ display: 'inline', marginRight: 10 }}>选择学生：</label>
                <select value={selectedStudent || ''} onChange={(e) => setSelectedStudent(Number(e.target.value))}>
                  <option value="">请选择</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.name} ({child.grade_name})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {['admin', 'teacher'].includes(user.role) && (
        <div className="card">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'inline', marginRight: 10 }}>状态：</label>
              <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                <option value="">全部</option>
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <button className="btn" onClick={loadData}>查询</button>
          </div>
        </div>
      )}

      <div className="grid">
        {courses.map(course => {
          const enrollment = getEnrollmentStatus(course.id);
          const isFull = course.enrolled_count >= course.capacity;
          
          return (
            <div key={course.id} className="course-card">
              <div className="course-card-header">
                <h3>{course.name}</h3>
                <span className="badge badge-success">{course.teacher_name}</span>
              </div>
              <div className="course-card-body">
                <p><strong>时间：</strong>周{['一', '二', '三', '四', '五', '六', '日'][course.day_of_week - 1]} {course.start_time}-{course.end_time}</p>
                <p><strong>教室：</strong>{course.classroom_name}</p>
                <p><strong>费用：</strong>¥{course.fee}</p>
                <p><strong>人数：</strong>
                  <span className={`badge ${isFull ? 'badge-warning' : 'badge-success'}`}>
                    {course.enrolled_count}/{course.capacity}
                  </span>
                  {course.waitlist_count > 0 && (
                    <span className="badge badge-warning">候补 {course.waitlist_count}</span>
                  )}
                </p>
                <p><strong>状态：</strong>
                  <span className={`badge ${course.status === 'published' ? 'badge-success' : 'badge-primary'}`}>
                    {course.status === 'published' ? '已发布' : course.status === 'draft' ? '草稿' : course.status}
                  </span>
                </p>
                
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <Link to={`/courses/${course.id}`} className="btn">详情</Link>
                  
                  {['parent', 'student'].includes(user.role) && course.status === 'published' && (
                    <>
                      {enrollment ? (
                        <>
                          <span className={`badge ${enrollment.status === 'enrolled' ? 'badge-success' : enrollment.status === 'waitlist' ? 'badge-warning' : 'badge-danger'}`}>
                            {enrollment.status === 'enrolled' ? '已报名' : enrollment.status === 'waitlist' ? `候补 #${enrollment.waitlist_position || '-'}` : enrollment.status === 'dropped' ? '已退课' : enrollment.status}
                          </span>
                          {['enrolled', 'waitlist'].includes(enrollment.status) && (
                            <button className="btn btn-danger" onClick={() => handleDrop(enrollment.id)}>退课</button>
                          )}
                        </>
                      ) : (
                        <button 
                          className={`btn ${isFull ? '' : 'btn-primary'}`} 
                          onClick={() => handleEnroll(course.id)}
                          disabled={!selectedStudent}
                        >
                          {isFull ? '加入候补' : '立即报名'}
                        </button>
                      )}
                    </>
                  )}

                  {user.role === 'admin' && course.status === 'draft' && (
                    <button className="btn btn-success" onClick={() => handlePublish(course.id)}>发布</button>
                  )}
                  
                  {user.role === 'admin' && (
                    <>
                      <Link to={`/courses/${course.id}/edit`} className="btn">编辑</Link>
                      {course.status === 'draft' && (
                        <button className="btn btn-danger" onClick={() => handleDelete(course.id)}>删除</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Courses;
