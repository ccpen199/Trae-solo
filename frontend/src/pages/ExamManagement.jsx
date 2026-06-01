import { useState, useEffect } from 'react';
import { examAPI, userAPI } from '../api';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    duration: 60,
    max_screen_switches: 5,
    require_camera: true,
    allow_late_minutes: 0,
    allowed_devices: 'desktop',
    questions: [
      { type: 'single', content: '示例单选题', options: ['选项A', '选项B', '选项C', '选项D'], correct_answer: 'A', score: 10 }
    ]
  });

  useEffect(() => {
    loadExams();
    loadStudents();
  }, []);

  const loadExams = async () => {
    try {
      const response = await examAPI.getExams();
      setExams(response.data.exams);
    } catch (error) {
      console.error('加载考试失败:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await userAPI.getStudents();
      setStudents(response.data.students);
    } catch (error) {
      console.error('加载考生失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await examAPI.createExam(formData);
      setShowModal(false);
      loadExams();
      alert('考试创建成功！');
    } catch (error) {
      alert('创建失败：' + (error.response?.data?.error || error.message));
    }
  };

  const handlePublish = async (id) => {
    if (confirm('确定要发布此考试吗？发布后将无法修改。')) {
      try {
        await examAPI.publishExam(id);
        loadExams();
        alert('考试发布成功！');
      } catch (error) {
        alert('发布失败');
      }
    }
  };

  const handleAssignStudents = async () => {
    try {
      await examAPI.assignStudents(selectedExam.id, selectedStudents);
      setShowAssignModal(false);
      alert('考生分配成功！');
    } catch (error) {
      alert('分配失败');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>考试管理</h1>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + 创建考试
        </button>
      </div>

      <div style={styles.examList}>
        {exams.map(exam => (
          <div key={exam.id} style={styles.examCard}>
            <div style={styles.examHeader}>
              <h3 style={styles.examTitle}>{exam.title}</h3>
              <span style={{
                ...styles.statusBadge,
                background: exam.status === 'draft' ? '#e3f2fd' : exam.status === 'published' ? '#d1fae5' : '#fef3c7',
                color: exam.status === 'draft' ? '#1976d2' : exam.status === 'published' ? '#059669' : '#d97706'
              }}>
                {exam.status === 'draft' ? '草稿' : exam.status === 'published' ? '已发布' : '已结束'}
              </span>
            </div>
            <p style={styles.examDesc}>{exam.description}</p>
            <div style={styles.examMeta}>
              <span>🕒 开始：{new Date(exam.start_time).toLocaleString()}</span>
              <span>⏱️ 时长：{exam.duration}分钟</span>
              <span>👥 考生：{exam.student_count || 0}人</span>
            </div>
            <div style={styles.examActions}>
              {exam.status === 'draft' && (
                <>
                  <button onClick={() => handlePublish(exam.id)} style={styles.actionBtn}>
                    发布
                  </button>
                  <button 
                    onClick={() => { setSelectedExam(exam); setShowAssignModal(true); }} 
                    style={styles.actionBtn}
                  >
                    分配考生
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>创建考试</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>考试名称</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>考试时长(分钟)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label>考试描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>开始时间</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>结束时间</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>最大切屏次数</label>
                  <input
                    type="number"
                    value={formData.max_screen_switches}
                    onChange={e => setFormData({...formData, max_screen_switches: parseInt(e.target.value)})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>允许迟到(分钟)</label>
                  <input
                    type="number"
                    value={formData.allow_late_minutes}
                    onChange={e => setFormData({...formData, allow_late_minutes: parseInt(e.target.value)})}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.require_camera}
                    onChange={e => setFormData({...formData, require_camera: e.target.checked})}
                  />
                  要求开启摄像头
                </label>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  取消
                </button>
                <button type="submit" style={styles.submitBtn}>
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>分配考生 - {selectedExam?.title}</h2>
            <div style={styles.studentList}>
              {students.map(student => (
                <label key={student.id} style={styles.studentItem}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student.id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                      }
                    }}
                  />
                  <span>{student.name} ({student.username})</span>
                </label>
              ))}
            </div>
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setShowAssignModal(false)} style={styles.cancelBtn}>
                取消
              </button>
              <button onClick={handleAssignStudents} style={styles.submitBtn}>
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  },
  examList: {
    display: 'grid',
    gap: '16px'
  },
  examCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },
  examHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  examTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500'
  },
  examDesc: {
    color: '#666',
    marginBottom: '16px',
    fontSize: '14px'
  },
  examMeta: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#888',
    marginBottom: '16px'
  },
  examActions: {
    display: 'flex',
    gap: '10px'
  },
  actionBtn: {
    padding: '8px 16px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#555'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  textarea: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px'
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  studentList: {
    maxHeight: '300px',
    overflow: 'auto',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '12px'
  },
  studentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    cursor: 'pointer'
  }
};

export default ExamManagement;
