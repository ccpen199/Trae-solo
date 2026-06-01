import { useState, useEffect } from 'react';
import { examAPI, anomalyAPI } from '../api';

const Proctor = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await examAPI.getExams();
      setExams(response.data.exams.filter(e => e.status !== 'draft'));
    } catch (error) {
      console.error('加载考试失败:', error);
    }
  };

  const loadExamDetails = async (exam) => {
    setSelectedExam(exam);
    try {
      const [anomaliesRes, statsRes, studentsRes] = await Promise.all([
        anomalyAPI.getAnomalies({ exam_id: exam.id }),
        anomalyAPI.getStats(exam.id),
        examAPI.getExamStudents(exam.id)
      ]);
      setAnomalies(anomaliesRes.data.anomalies);
      setStats(statsRes.data);
      setStudents(studentsRes.data.students);
    } catch (error) {
      console.error('加载详情失败:', error);
    }
  };

  const handleHandleAnomaly = async (anomalyId) => {
    const note = prompt('请输入处理备注：');
    if (note !== null) {
      try {
        await anomalyAPI.handleAnomaly(anomalyId, note);
        loadExamDetails(selectedExam);
        alert('处理成功！');
      } catch (error) {
        alert('处理失败');
      }
    }
  };

  const anomalyTypeLabels = {
    screen_switch: '切屏',
    page_leave: '离开页面',
    network_disconnect: '网络中断',
    abnormal_submit: '异常提交',
    suspicious_behavior: '可疑行为',
    camera_failure: '摄像头失败',
    late_entry: '迟到',
    multiple_login: '重复登录'
  };

  return (
    <div>
      <h1 style={styles.title}>监考台</h1>
      
      <div style={styles.examList}>
        <h3 style={styles.subtitle}>选择考试</h3>
        <div style={styles.examGrid}>
          {exams.map(exam => (
            <div
              key={exam.id}
              onClick={() => loadExamDetails(exam)}
              style={{
                ...styles.examCard,
                borderColor: selectedExam?.id === exam.id ? '#667eea' : '#eee'
              }}
            >
              <h4 style={styles.examTitle}>{exam.title}</h4>
              <p style={styles.examMeta}>
                {new Date(exam.start_time).toLocaleString()}
              </p>
              <span style={{
                ...styles.statusBadge,
                background: exam.status === 'published' ? '#d1fae5' : '#fef3c7',
                color: exam.status === 'published' ? '#059669' : '#d97706'
              }}>
                {exam.status === 'published' ? '进行中' : '已结束'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedExam && (
        <>
          {stats && (
            <div style={styles.statsSection}>
              <h3 style={styles.subtitle}>异常统计</h3>
              <div style={styles.statsGrid}>
                {stats.stats.map((stat, idx) => (
                  <div key={idx} style={styles.statCard}>
                    <div style={styles.statLabel}>{anomalyTypeLabels[stat.type] || stat.type}</div>
                    <div style={styles.statValue}>{stat.count}</div>
                    <div style={styles.statUn}>未处理: {stat.unhandled_count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.topRiskStudents?.length > 0 && (
            <div style={styles.riskSection}>
              <h3 style={styles.subtitle}>高风险考生</h3>
              <div style={styles.riskList}>
                {stats.topRiskStudents.map((student, idx) => (
                  <div key={idx} style={styles.riskItem}>
                    <span style={styles.riskName}>{student.name}</span>
                    <span style={{
                      ...styles.riskScore,
                      background: student.total_risk > 30 ? '#fee' : '#fef3c7',
                      color: student.total_risk > 30 ? '#dc2626' : '#d97706'
                    }}>
                      风险分: {student.total_risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.anomalySection}>
            <h3 style={styles.subtitle}>异常记录 ({anomalies.length})</h3>
            <div style={styles.anomalyList}>
              {anomalies.map(anomaly => (
                <div key={anomaly.id} style={styles.anomalyCard}>
                  <div style={styles.anomalyHeader}>
                    <span style={{
                      ...styles.anomalyType,
                      background: anomaly.handled ? '#d1fae5' : '#fee',
                      color: anomaly.handled ? '#059669' : '#dc2626'
                    }}>
                      {anomalyTypeLabels[anomaly.type] || anomaly.type}
                    </span>
                    <span style={styles.anomalyTime}>
                      {new Date(anomaly.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.anomalyContent}>
                    <p><strong>考生：</strong>{anomaly.student_name}</p>
                    <p><strong>描述：</strong>{anomaly.description}</p>
                    <p><strong>风险分：</strong>{anomaly.risk_score}</p>
                    {anomaly.handled && (
                      <p><strong>处理人：</strong>{anomaly.handled_by_name}</p>
                    )}
                    {anomaly.handled_note && (
                      <p><strong>处理备注：</strong>{anomaly.handled_note}</p>
                    )}
                  </div>
                  {!anomaly.handled && (
                    <button
                      onClick={() => handleHandleAnomaly(anomaly.id)}
                      style={styles.handleBtn}
                    >
                      处理异常
                    </button>
                  )}
                </div>
              ))}
              {anomalies.length === 0 && (
                <div style={styles.emptyState}>暂无异常记录</div>
              )}
            </div>
          </div>

          <div style={styles.studentSection}>
            <h3 style={styles.subtitle}>考生状态 ({students.length})</h3>
            <div style={styles.studentGrid}>
              {students.map(student => (
                <div key={student.id} style={styles.studentCard}>
                  <div style={styles.studentName}>{student.name}</div>
                  <div style={styles.studentStatus}>
                    状态: {student.status === 'verified' ? '已验证' : 
                           student.status === 'in_progress' ? '考试中' :
                           student.status === 'submitted' ? '已交卷' : student.status}
                  </div>
                  <div style={styles.studentStats}>
                    <span>答题: {student.answered_count || 0}</span>
                    <span>异常: {student.anomaly_count || 0}</span>
                  </div>
                  {student.score !== null && (
                    <div style={styles.studentScore}>得分: {student.score}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px'
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px'
  },
  examList: {
    marginBottom: '30px'
  },
  examGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px'
  },
  examCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    cursor: 'pointer',
    border: '2px solid #eee',
    transition: 'all 0.2s'
  },
  examTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  examMeta: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '12px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block'
  },
  statsSection: {
    marginBottom: '30px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  statUn: {
    fontSize: '12px',
    color: '#ef4444'
  },
  riskSection: {
    marginBottom: '30px'
  },
  riskList: {
    display: 'grid',
    gap: '12px'
  },
  riskItem: {
    background: 'white',
    padding: '16px 20px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  riskName: {
    fontWeight: '600',
    color: '#333'
  },
  riskScore: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '14px'
  },
  anomalySection: {
    marginBottom: '30px'
  },
  anomalyList: {
    display: 'grid',
    gap: '16px'
  },
  anomalyCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px'
  },
  anomalyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  anomalyType: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  anomalyTime: {
    fontSize: '12px',
    color: '#888'
  },
  anomalyContent: {
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.8'
  },
  handleBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
    background: 'white',
    borderRadius: '12px'
  },
  studentSection: {
    marginBottom: '30px'
  },
  studentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px'
  },
  studentCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px'
  },
  studentName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  studentStatus: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px'
  },
  studentStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px'
  },
  studentScore: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#10b981'
  }
};

export default Proctor;
