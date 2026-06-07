import { useState, useEffect } from 'react';
import api from '../utils/api';

const Courses = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [exams, setExams] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExam, setShowExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);

  useEffect(() => {
    loadCourses();
    loadEnrollments();
    loadExams();
    loadCertifications();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.get('/courses');
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCourses([]);
    }
  };

  const loadEnrollments = async () => {
    try {
      const data = await api.get('/courses/enrollments?user_id=8');
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setEnrollments([]);
    }
  };

  const loadExams = async () => {
    try {
      const data = await api.get('/courses/certification-exams');
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setExams([]);
    }
  };

  const loadCertifications = async () => {
    try {
      const data = await api.get('/courses/certifications');
      setCertifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCertifications([]);
    }
  };

  const handleEnroll = async (courseId) => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/courses/${courseId}/enroll`, { user_id: 8 });
      setSuccessMsg('报名成功！');
      loadEnrollments();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('报名失败，请重试');
    }
    setLoading(false);
  };

  const viewCourseDetail = async (course) => {
    try {
      const detail = await api.get(`/courses/${course.id}`);
      setSelectedCourse(detail);
      setShowCourseDetail(true);
    } catch (err) {
      setSelectedCourse(course);
      setShowCourseDetail(true);
    }
  };

  const startExam = (exam) => {
    setSelectedExam(exam);
    setExamAnswers({});
    setExamResult(null);
    setShowExam(true);
  };

  const submitExam = async () => {
    if (!selectedExam) return;
    const answers = Object.values(examAnswers);
    setLoading(true);
    try {
      const result = await api.post(`/courses/certification-exams/${selectedExam.id}/attempt`, {
        technician_id: 1,
        answers,
      });
      setExamResult(result);
      loadCertifications();
    } catch (err) {
      setExamResult({ passed: false, score: 0, message: '提交失败' });
    }
    setLoading(false);
  };

  const getDifficultyBadge = (difficulty) => {
    const styles = {
      beginner: { bg: '#dcfce7', color: '#166534', label: '入门' },
      intermediate: { bg: '#fef3c7', color: '#b45309', label: '中级' },
      advanced: { bg: '#fee2e2', color: '#dc2626', label: '高级' },
    };
    const s = styles[difficulty] || styles.beginner;
    return <span style={{ padding: '4px 10px', backgroundColor: s.bg, color: s.color, borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>{s.label}</span>;
  };

  const isEnrolled = (courseId) => {
    return enrollments.some(e => e.course_id === courseId);
  };

  const getEnrollment = (courseId) => {
    return enrollments.find(e => e.course_id === courseId);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#5a5c69' }}>
            📚 兄弟学院
          </h1>
          <p style={{ margin: 0, color: '#858796', fontSize: '14px' }}>
            微课学习 · 进度跟踪 · 技能认证考试
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
          { key: 'courses', label: '课程列表' },
          { key: 'mycourses', label: '我的学习' },
          { key: 'exams', label: '认证考试' },
          { key: 'certs', label: '我的证书' },
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

      {activeTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ backgroundColor: '#4e73df', padding: '40px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '48px' }}>📖</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  {getDifficultyBadge(course.difficulty)}
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>⏱️ {course.duration_minutes}分钟</span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{course.title}</h3>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>{course.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>📂 {course.category || '未分类'}</span>
                  {isEnrolled(course.id) ? (
                    <button
                      onClick={() => viewCourseDetail(course)}
                      style={{ padding: '8px 20px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                      继续学习
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={loading}
                      style={{ padding: '8px 20px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                      立即报名
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mycourses' && (
        <div>
          {enrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>📚</span>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>还没有报名任何课程，快去课程列表看看吧！</p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fc' }}>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>课程名称</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>难度</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>学习进度</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>报名时间</th>
                    <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => {
                    const course = courses.find(c => c.id === enrollment.course_id);
                    return (
                      <tr key={enrollment.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                        <td style={{ padding: '14px', fontWeight: '500', color: '#5a5c69' }}>{course?.title || '未知课程'}</td>
                        <td style={{ padding: '14px' }}>{course ? getDifficultyBadge(course.difficulty) : '-'}</td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  backgroundColor: enrollment.progress_percent >= 100 ? '#1cc88a' : '#4e73df',
                                  borderRadius: '4px',
                                  width: `${enrollment.progress_percent || 0}%`,
                                  transition: 'width 0.3s',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', minWidth: '45px' }}>
                              {enrollment.progress_percent || 0}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px', fontSize: '13px', color: '#858796' }}>
                          {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString('zh-CN') : '-'}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <button
                            onClick={() => viewCourseDetail(course || { id: enrollment.course_id })}
                            style={{ padding: '6px 16px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          >
                            继续学习
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exams' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {exams.map((exam) => (
            <div key={exam.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{exam.cert_name}</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>📝 {Array.isArray(exam.questions) ? exam.questions.length : 5} 道题</p>
                </div>
                <span style={{ fontSize: '32px' }}>📋</span>
              </div>
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>及格分数：{exam.passing_score || 60}分</p>
              </div>
              <button
                onClick={() => startExam(exam)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#4e73df',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                开始考试
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'certs' && (
        <div>
          {certifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🏆</span>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>暂无认证证书，快去参加考试获得认证吧！</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '2px solid #fbbf24',
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '48px' }}>🏆</span>
                  </div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 'bold', color: '#78350f', textAlign: 'center' }}>
                    {cert.cert_name}
                  </h3>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#78350f' }}>
                      <strong>考试成绩：</strong>{cert.exam_score || 85}分
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
                      <strong>颁发日期：</strong>{cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('zh-CN') : '-'}
                    </p>
                  </div>
                  <p style={{ textAlign: 'center', margin: 0, fontSize: '12px', color: '#92400e' }}>
                    证书编号：CERT-{String(cert.id).padStart(6, '0')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCourseDetail && selectedCourse && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#5a5c69' }}>{selectedCourse.title}</h2>
              <button onClick={() => { setShowCourseDetail(false); setSelectedCourse(null); }} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div style={{ backgroundColor: '#f8f9fc', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
              <p style={{ margin: 0, color: '#5a5c69', fontSize: '14px', lineHeight: '1.7' }}>{selectedCourse.description || '暂无课程描述'}</p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                {getDifficultyBadge(selectedCourse.difficulty)}
                <span style={{ fontSize: '13px', color: '#6b7280' }}>⏱️ {selectedCourse.duration_minutes}分钟</span>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#5a5c69' }}>📖 课程章节</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(selectedCourse.lessons || []).length > 0 ? (
                (selectedCourse.lessons || []).map((lesson, i) => (
                  <div key={lesson.id || i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    backgroundColor: '#f8f9fc',
                    borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>
                        {lesson.content_type === 'video' ? '🎬' : lesson.content_type === 'interactive' ? '🎮' : '📄'}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontWeight: '500', color: '#5a5c69', fontSize: '14px' }}>
                          {i + 1}. {lesson.title}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>{lesson.duration_minutes}分钟</p>
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>可学习</span>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>暂无章节数据</p>
              )}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => { setShowCourseDetail(false); setSuccessMsg('学习进度已更新！'); setTimeout(() => setSuccessMsg(''), 3000); }}
                style={{ padding: '12px 32px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}
              >
                更新学习进度
              </button>
            </div>
          </div>
        </div>
      )}

      {showExam && selectedExam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#5a5c69' }}>📋 {selectedExam.cert_name}</h2>
              {!examResult && <button onClick={() => { setShowExam(false); setSelectedExam(null); }} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#6b7280' }}>×</button>}
            </div>

            {examResult ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <span style={{ fontSize: '80px', display: 'block', marginBottom: '20px' }}>
                  {examResult.passed ? '🎉' : '😔'}
                </span>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 'bold', color: examResult.passed ? '#166534' : '#dc2626' }}>
                  {examResult.passed ? '恭喜通过！' : '未通过，再接再厉！'}
                </h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#5a5c69' }}>
                  得分：<strong style={{ fontSize: '28px' }}>{examResult.score || 0}</strong> 分
                </p>
                {examResult.passed && (
                  <p style={{ margin: '0 0 24px 0', color: '#166534', backgroundColor: '#dcfce7', padding: '12px', borderRadius: '8px' }}>
                    🏆 认证证书已颁发至您的账户！
                  </p>
                )}
                <button
                  onClick={() => { setShowExam(false); setSelectedExam(null); setExamResult(null); }}
                  style={{ padding: '12px 32px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}
                >
                  关闭
                </button>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: '#fef3c7', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#b45309' }}>
                    ⚠️ 及格分数：{selectedExam.passing_score || 60}分 | 题目数量：{Array.isArray(selectedExam.questions) ? selectedExam.questions.length : 5}题
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {(Array.isArray(selectedExam.questions) ? selectedExam.questions : []).map((q, i) => (
                    <div key={i} style={{ padding: '20px', backgroundColor: '#f8f9fc', borderRadius: '10px' }}>
                      <p style={{ margin: '0 0 16px 0', fontWeight: '500', color: '#1f2937', fontSize: '15px' }}>
                        {i + 1}. {q.q || `问题 ${i + 1}`}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(q.options || []).map((opt, j) => (
                          <label
                            key={j}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '12px 16px',
                              backgroundColor: examAnswers[i] === j ? '#dbeafe' : 'white',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: examAnswers[i] === j ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                            }}
                          >
                            <input
                              type="radio"
                              name={`q-${i}`}
                              checked={examAnswers[i] === j}
                              onChange={() => setExamAnswers({ ...examAnswers, [i]: j })}
                            />
                            <span style={{ color: '#4b5563', fontSize: '14px' }}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <button
                    onClick={submitExam}
                    disabled={loading}
                    style={{
                      padding: '12px 36px',
                      backgroundColor: '#1cc88a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? '提交中...' : '提交试卷'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
