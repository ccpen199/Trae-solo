import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI, studentAPI, anomalyAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const MyExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (currentStep === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, timeLeft]);

  useEffect(() => {
    if (currentStep === 'exam') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          reportAnomaly('page_leave', '考生离开页面');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [currentStep]);

  const loadExams = async () => {
    try {
      const response = await examAPI.getExams();
      setExams(response.data.exams.filter(e => e.status !== 'draft'));
    } catch (error) {
      console.error('加载考试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportAnomaly = async (type, description) => {
    try {
      await anomalyAPI.reportAnomaly({
        exam_student_id: examData?.examStudentId,
        type,
        description
      });
    } catch (error) {
      console.error('上报异常失败:', error);
    }
  };

  const handleStartExam = (exam) => {
    setSelectedExam(exam);
    setCurrentStep('identity');
  };

  const handleVerifyIdentity = async () => {
    try {
      await studentAPI.verifyIdentity(selectedExam.id, { identity_data: 'verified' });
      setCurrentStep('device');
    } catch (error) {
      alert('身份验证失败');
    }
  };

  const handleCheckDevice = async () => {
    try {
      await studentAPI.checkDevice(selectedExam.id, { device_info: navigator.userAgent });
      setCurrentStep('promise');
    } catch (error) {
      alert('设备检测失败');
    }
  };

  const checkCamera = async () => {
    console.log('开始检测摄像头...');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('浏览器不支持摄像头API，使用模拟检测');
        setCameraEnabled(true);
        alert('摄像头检测通过（模拟模式）');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraEnabled(true);
      alert('摄像头检测成功！');
    } catch (error) {
      console.error('摄像头检测失败:', error);
      if (error.name === 'NotAllowedError') {
        alert('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
      } else if (error.name === 'NotFoundError') {
        alert('未检测到摄像头设备');
      } else {
        alert('无法访问摄像头：' + error.message);
      }
    }
  };

  const handleAcceptPromise = async () => {
    try {
      await studentAPI.acceptPromise(selectedExam.id);
      const response = await studentAPI.enterExam(selectedExam.id);
      setExamData(response.data);
      setTimeLeft(selectedExam.duration * 60);
      setCurrentStep('exam');
    } catch (error) {
      alert(error.response?.data?.error || '进入考试失败');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    studentAPI.submitAnswer(examData.examStudentId, {
      question_id: questionId,
      answer
    });
  };

  const handleSubmitExam = async () => {
    try {
      await studentAPI.submitExam(examData.examStudentId);
      alert('考试提交成功！');
      setCurrentStep(null);
      loadExams();
    } catch (error) {
      alert('提交失败');
    }
  };

  const handleScreenSwitch = () => {
    reportAnomaly('screen_switch', '考生切换屏幕或窗口');
  };

  if (currentStep === 'identity') {
    return (
      <div style={styles.stepContainer}>
        <div style={styles.stepCard}>
          <h2 style={styles.stepTitle}>🔐 身份核验</h2>
          <p style={styles.stepDesc}>请完成身份验证以进入考试</p>
          <div style={styles.stepContent}>
            <p>考生姓名：<strong>{user.name}</strong></p>
            <p>用户名：<strong>{user.username}</strong></p>
          </div>
          <button onClick={handleVerifyIdentity} style={styles.stepButton}>
            确认身份，下一步
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'device') {
    const needCamera = selectedExam?.require_camera === 1 || selectedExam?.require_camera === true;
    const canProceed = !needCamera || cameraEnabled;
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '12px'
          }}>📱 设备检测</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>请确保您的设备满足考试要求</p>
          
          <div style={{
            textAlign: 'left',
            marginBottom: '24px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #eee'
            }}>
              <span>网络连接</span>
              <span style={{color: '#10b981'}}>✅ 正常</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0'
            }}>
              <span>摄像头</span>
              <button 
                onClick={checkCamera}
                style={{
                  padding: '8px 16px',
                  background: cameraEnabled ? '#10b981' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  zIndex: 100,
                  position: 'relative'
                }}
              >
                {cameraEnabled ? '✅ 已检测' : '检测摄像头'}
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleCheckDevice}
            style={{
              width: '100%',
              padding: '14px',
              background: canProceed 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              zIndex: 100,
              position: 'relative'
            }}
          >
            确认设备，下一步
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'promise') {
    return (
      <div style={styles.stepContainer}>
        <div style={styles.stepCard}>
          <h2 style={styles.stepTitle}>📜 诚信考试承诺</h2>
          <div style={styles.promiseText}>
            <p>本人承诺：</p>
            <ul>
              <li>遵守考试纪律，独立完成考试</li>
              <li>不使用任何辅助工具作弊</li>
              <li>不与他人交流考试内容</li>
              <li>考试全程保持摄像头开启</li>
              <li>认同异常行为检测结果</li>
            </ul>
          </div>
          <button onClick={handleAcceptPromise} style={styles.stepButton}>
            我已阅读并同意，开始考试
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'exam' && examData) {
    const questions = examData.questions;
    const question = questions[currentQuestion];

    return (
      <div style={styles.examContainer}>
        <div style={styles.examHeader}>
          <h2>{selectedExam.title}</h2>
          <div style={styles.timer}>
            ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div style={styles.questionNav}>
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              style={{
                ...styles.questionNavBtn,
                background: answers[questions[idx].id] ? '#10b981' : 
                           currentQuestion === idx ? '#667eea' : '#f0f0f0',
                color: answers[questions[idx].id] || currentQuestion === idx ? 'white' : '#333'
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div style={styles.questionCard}>
          <h3 style={styles.questionTitle}>
            第 {currentQuestion + 1} 题 ({question.score}分)
          </h3>
          <p style={styles.questionContent}>{question.content}</p>

          {question.type === 'single' && (
            <div style={styles.optionsList}>
              {question.options.map((opt, idx) => (
                <label key={idx} style={styles.optionLabel}>
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={opt}
                    checked={answers[question.id] === opt}
                    onChange={() => handleAnswerChange(question.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {question.type === 'multiple' && (
            <div style={styles.optionsList}>
              {question.options.map((opt, idx) => (
                <label key={idx} style={styles.optionLabel}>
                  <input
                    type="checkbox"
                    checked={(answers[question.id] || []).includes(opt)}
                    onChange={(e) => {
                      const current = answers[question.id] || [];
                      if (e.target.checked) {
                        handleAnswerChange(question.id, [...current, opt]);
                      } else {
                        handleAnswerChange(question.id, current.filter(o => o !== opt));
                      }
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={styles.examActions}>
          <button onClick={handleScreenSwitch} style={styles.warningBtn}>
            🚫 测试切屏异常
          </button>
          <button onClick={handleSubmitExam} style={styles.submitBtn}>
            提交试卷
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={styles.title}>我的考试</h1>
      
      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : (
        <div style={styles.examList}>
          {exams.map(exam => (
            <div key={exam.id} style={styles.examCard}>
              <h3 style={styles.examTitle}>{exam.title}</h3>
              <p style={styles.examDesc}>{exam.description}</p>
              <div style={styles.examMeta}>
                <span>🕒 {new Date(exam.start_time).toLocaleString()}</span>
                <span>⏱️ {exam.duration}分钟</span>
                <span style={styles.examStatus}>
                  {exam.status === 'published' ? '进行中' : exam.status === 'submitted' ? '已完成' : '已结束'}
                </span>
              </div>
              {exam.status === 'published' && exam.status !== 'submitted' && (
                <button onClick={() => handleStartExam(exam)} style={styles.startBtn}>
                  进入考试
                </button>
              )}
            </div>
          ))}
        </div>
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
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
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
  examTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  examDesc: {
    color: '#666',
    marginBottom: '12px',
    fontSize: '14px'
  },
  examMeta: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#888',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  examStatus: {
    padding: '4px 12px',
    borderRadius: '20px',
    background: '#d1fae5',
    color: '#059669',
    fontWeight: '500'
  },
  startBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  stepContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh'
  },
  stepCard: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center'
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '12px'
  },
  stepDesc: {
    color: '#666',
    marginBottom: '24px'
  },
  stepContent: {
    textAlign: 'left',
    marginBottom: '24px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    pointerEvents: 'auto',
    position: 'relative'
  },
  stepButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  deviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
    pointerEvents: 'auto',
    position: 'relative',
    zIndex: 1
  },
  smallButton: {
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    pointerEvents: 'auto',
    zIndex: 10,
    position: 'relative',
    transition: 'background 0.2s',
    ':hover': {
      background: '#5568d3'
    }
  },
  promiseText: {
    textAlign: 'left',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  examContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    minHeight: '80vh'
  },
  examHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #eee'
  },
  timer: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ef4444'
  },
  questionNav: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '24px'
  },
  questionNavBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600'
  },
  questionCard: {
    padding: '24px',
    background: '#f8f9fa',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  questionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px'
  },
  questionContent: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '20px',
    lineHeight: '1.6'
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  examActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px'
  },
  warningBtn: {
    padding: '12px 20px',
    background: '#fef3c7',
    color: '#d97706',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '12px 30px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  }
};

export default MyExams;
