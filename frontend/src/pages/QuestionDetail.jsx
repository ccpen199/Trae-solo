import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../store/auth'
import LoginModal from '../components/LoginModal'
import { useToast } from '../components/Toast'

const QuestionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [answerContent, setAnswerContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    fetchQuestion()
    fetchAnswers()
  }, [id])

  const fetchQuestion = async () => {
    try {
      const res = await client.get(`/questions/${id}`)
      if (res.data.success) {
        setQuestion(res.data.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || '加载失败')
    }
  }

  const fetchAnswers = async () => {
    try {
      const res = await client.get(`/answers/question/${id}`)
      if (res.data.success) {
        setAnswers(res.data.data.list)
      }
    } catch (err) {
      console.error('加载回答失败', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowQuestion = async () => {
    if (!user) {
      setShowLogin(true)
      return
    }
    try {
      const res = await client.post(`/questions/${id}/follow`)
      if (res.data.success) {
        setQuestion(prev => ({
          ...prev,
          is_followed: res.data.data.is_followed,
          follow_count: prev.follow_count + (res.data.data.is_followed ? 1 : -1)
        }))
        showToast(res.data.message, 'success')
      }
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  const handleLike = async (answerId) => {
    if (!user) {
      setShowLogin(true)
      return
    }
    try {
      const res = await client.post(`/answers/${answerId}/like`)
      if (res.data.success) {
        setAnswers(prev => prev.map(a =>
          a.id === answerId
            ? { ...a, is_liked: res.data.data.is_liked, like_count: res.data.data.like_count }
            : a
        ))
      }
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  const handleFavorite = async (answerId) => {
    if (!user) {
      setShowLogin(true)
      return
    }
    try {
      const res = await client.post(`/answers/${answerId}/favorite`)
      if (res.data.success) {
        setAnswers(prev => prev.map(a =>
          a.id === answerId
            ? { ...a, is_favorited: res.data.data.is_favorited }
            : a
        ))
        showToast(res.data.message, 'success')
      }
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  const handleSubmitAnswer = async () => {
    if (!user) {
      setShowLogin(true)
      return
    }
    if (!answerContent.trim()) {
      showToast('请输入回答内容', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await client.post('/answers', {
        question_id: id,
        content: answerContent
      })
      if (res.data.success) {
        showToast('回答发布成功', 'success')
        setAnswerContent('')
        fetchAnswers()
      }
    } catch (err) {
      showToast(err.response?.data?.message || '发布失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = (answerId) => {
    const shareUrl = `${window.location.origin}/question/${id}?answer=${answerId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('链接已复制到剪贴板', 'success')
    }).catch(() => {
      showToast('复制失败，请手动复制链接', 'error')
    })
  }

  const handleComment = (answerId) => {
    showToast('评论功能开发中，敬请期待！', 'info')
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error || '问题不存在'}</p>
        <button style={styles.retryBtn} onClick={() => navigate(-1)}>返回</button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 style={styles.title}>问题详情</h1>
      </div>

      <div style={styles.questionCard}>
        <h2 style={styles.questionTitle}>{question.title}</h2>
        {question.content && <p style={styles.questionContent}>{question.content}</p>}
        
        <div style={styles.questionMeta}>
          <div style={styles.authorInfo}>
            <img
              src={question.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${question.user_id}`}
              alt="avatar"
              style={styles.avatar}
            />
            <span style={styles.authorName}>{question.nickname || '匿名用户'}</span>
          </div>
          <button
            style={{
              ...styles.followBtn,
              ...(question.is_followed ? styles.followed : {})
            }}
            onClick={handleFollowQuestion}
          >
            {question.is_followed ? '已关注' : '+ 关注问题'}
          </button>
        </div>

        <div style={styles.questionStats}>
          <span style={styles.stat}>👁 {question.view_count || 0} 浏览</span>
          <span style={styles.stat}>⭐ {question.follow_count || 0} 关注</span>
          <span style={styles.stat}>💬 {question.answer_count || 0} 回答</span>
        </div>
      </div>

      <div style={styles.answerSection}>
        <h3 style={styles.sectionTitle}>写回答</h3>
        <textarea
          style={styles.answerInput}
          value={answerContent}
          onChange={e => setAnswerContent(e.target.value)}
          placeholder="分享你的见解..."
          rows={4}
        />
        <button
          style={styles.submitBtn}
          onClick={handleSubmitAnswer}
          disabled={submitting}
        >
          {submitting ? '发布中...' : '发布回答'}
        </button>
      </div>

      <div style={styles.answersSection}>
        <h3 style={styles.sectionTitle}>{answers.length} 个回答</h3>
        
        {answers.length === 0 ? (
          <div style={styles.emptyAnswers}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyText}>暂无回答，快来抢沙发吧！</p>
          </div>
        ) : (
          <div style={styles.answersList}>
            {answers.map((answer, index) => (
              <div
                key={answer.id}
                style={{
                  ...styles.answerCard,
                  ...(index < 3 ? styles.topAnswer : {})
                }}
              >
                <div style={styles.answerHeader}>
                  <img
                    src={answer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${answer.user_id}`}
                    alt="avatar"
                    style={styles.answerAvatar}
                  />
                  <div style={styles.answerAuthorInfo}>
                    <span style={styles.answerAuthor}>{answer.nickname || '匿名用户'}</span>
                    <span style={styles.answerTime}>
                      {new Date(answer.created_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  {index < 3 && <span style={styles.topBadge}>优质回答</span>}
                </div>
                
                <div style={styles.answerContent}>
                  {answer.content.split('\n').map((line, i) => (
                    <p key={i} style={styles.answerParagraph}>{line}</p>
                  ))}
                </div>

                <div style={styles.answerActions}>
                  <button
                    style={{
                      ...styles.actionBtn,
                      ...(answer.is_liked ? styles.actionActive : {})
                    }}
                    onClick={() => handleLike(answer.id)}
                  >
                    👍 {answer.like_count || 0}
                  </button>
                  <button
                    style={{
                      ...styles.actionBtn,
                      ...(answer.is_favorited ? styles.actionActive : {})
                    }}
                    onClick={() => handleFavorite(answer.id)}
                  >
                    ⭐ 收藏
                  </button>
                  <button style={styles.actionBtn} onClick={() => handleShare(answer.id)}>📤 分享</button>
                  <button style={styles.actionBtn} onClick={() => handleComment(answer.id)}>💬 评论</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '16px',
    paddingBottom: '40px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  backBtn: {
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '20px',
    cursor: 'pointer'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e0e0e0',
    borderTopColor: '#007AFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px'
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  errorText: {
    color: '#666',
    marginBottom: '20px',
    fontSize: '14px'
  },
  retryBtn: {
    padding: '10px 24px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  questionCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  questionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 12px',
    color: '#333',
    lineHeight: '1.4'
  },
  questionContent: {
    fontSize: '15px',
    color: '#666',
    margin: '0 0 16px',
    lineHeight: '1.6'
  },
  questionMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0'
  },
  authorName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  followBtn: {
    padding: '8px 16px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  followed: {
    backgroundColor: '#f5f5f5',
    color: '#666'
  },
  questionStats: {
    display: 'flex',
    gap: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0'
  },
  stat: {
    fontSize: '13px',
    color: '#999'
  },
  answerSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px'
  },
  answerInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none',
    outline: 'none',
    marginBottom: '12px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  submitBtn: {
    padding: '10px 24px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  answersSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px'
  },
  emptyAnswers: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  emptyText: {
    color: '#999',
    fontSize: '14px'
  },
  answersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  answerCard: {
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px'
  },
  topAnswer: {
    backgroundColor: '#f0f8ff',
    border: '1px solid #e0f0ff'
  },
  answerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px'
  },
  answerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0'
  },
  answerAuthorInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  answerAuthor: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  answerTime: {
    fontSize: '12px',
    color: '#999'
  },
  topBadge: {
    padding: '4px 8px',
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: '10px',
    fontSize: '11px'
  },
  answerContent: {
    marginBottom: '12px'
  },
  answerParagraph: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.7',
    margin: '0 0 8px'
  },
  answerActions: {
    display: 'flex',
    gap: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0'
  },
  actionBtn: {
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
    borderRadius: '4px'
  },
  actionActive: {
    color: '#007AFF'
  }
}

export default QuestionDetail
