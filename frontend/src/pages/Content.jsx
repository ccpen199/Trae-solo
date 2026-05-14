import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { topicAPI, questionAPI, answerAPI, articleAPI, commentAPI } from '../api/endpoints'
import { useAuth } from '../store/auth'
import { Card, Button, Textarea, Input, Avatar, AsyncStatus, LoadingSpinner, Tag } from '../components/Common'
import { showToast } from '../api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const QUESTION_TEMPLATES = [
  '如何优化产品的用户留存？',
  '产品PRD文档应该包含哪些核心内容？',
  '如何设计一个优秀的用户激励体系？',
  '竞品分析应该从哪些维度入手？',
  '如何快速了解一个陌生的行业？'
]

export function AskQuestionPage() {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topicId, setTopicId] = useState(null)
  const [topics, setTopics] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const res = await questionAPI.getDraft()
        if (res.data?.success && res.data.data) {
          const draft = res.data.data
          if (draft.title) setTitle(draft.title)
          if (draft.content) setContent(draft.content)
          if (draft.topic_id) setTopicId(draft.topic_id)
        }
      } catch (err) {}
    }
    loadDraft()
    topicAPI.getAll().then(res => {
      if (res.data?.success) setTopics(res.data.data)
    }).catch(() => {})
  }, [])

  const saveDraft = async () => {
    if (!title && !content) return
    setSavingDraft(true)
    try {
      await questionAPI.saveDraft({ title, content, topic_id: topicId })
      showToast('草稿已保存', 'success')
    } catch (err) {}
    setSavingDraft(false)
  }

  const handleBack = async () => {
    if (title || content) {
      await saveDraft()
    }
    if (step === 2) {
      setStep(1)
    } else {
      navigate(-1)
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!title || title.length < 5) {
        showToast('标题至少需要5个字符', 'error')
        return
      }
      await saveDraft()
      setStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!title) {
      showToast('请输入问题标题', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await questionAPI.create({ title, content, topic_id: topicId })
      if (res.data?.success) {
        showToast('发布成功', 'success')
        navigate(`/question/${res.data.data.id}`)
      }
    } catch (err) {}
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={handleBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginRight: '16px' }}
          >
            ← 返回
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
            {step === 1 ? '提出问题' : '补充问题描述'}
          </h2>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                问题标题 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入你的问题，例如：如何提升产品的用户转化率？"
                  style={{ fontSize: '16px', padding: '14px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {showTemplates ? '收起范例' : '查看范例'}
                </button>
              </div>
              {showTemplates && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>点击使用以下范例：</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {QUESTION_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => { setTitle(tpl); setShowTemplates(false) }}
                        style={{
                          padding: '6px 12px',
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>问题描述（选填）</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="详细描述你的问题背景、遇到的困难等..."
                rows={6}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>选择主题</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setTopicId(null)}
                  style={getTopicSelectStyle(topicId === null)}
                >
                  不选
                </button>
                {topics.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTopicId(t.id)}
                    style={getTopicSelectStyle(topicId === t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={saveDraft} disabled={savingDraft}>
                {savingDraft ? '保存中...' : '保存草稿'}
              </Button>
              <Button onClick={handleNext} disabled={!title || title.length < 5}>
                下一步
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>问题标题</p>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>{title}</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>详细描述</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="详细描述你的问题背景、具体场景、你已经尝试过的方法等..."
                rows={10}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary" onClick={handleBack}>
                上一步
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? '发布中...' : '发布问题'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function getTopicSelectStyle(selected) {
  return {
    padding: '8px 16px',
    border: selected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
    borderRadius: '6px',
    background: selected ? '#eff6ff' : '#fff',
    color: selected ? '#3b82f6' : '#4b5563',
    cursor: 'pointer',
    fontSize: '14px'
  }
}

export function QuestionDetailPage() {
  const { id } = useParams()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [answerContent, setAnswerContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await questionAPI.getById(id)
      if (res.data?.success) {
        setQuestion(res.data.data)
        setAnswers(res.data.data.answers || [])
      }
    } catch (err) {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleFollow = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const res = await questionAPI.follow(id)
      if (res.data?.success) {
        setQuestion(q => ({
          ...q,
          is_followed: res.data.data.followed,
          follow_count: res.data.data.followed ? q.follow_count + 1 : q.follow_count - 1
        }))
      }
    } catch (err) {}
  }

  const handleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await questionAPI.like(id)
      setQuestion(q => ({
        ...q,
        like_count: (question?.is_followed ? q.like_count - 1 : q.like_count + 1)
      }))
    } catch (err) {}
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast('链接已复制', 'success')
    } else {
      showToast('复制失败，请手动复制', 'error')
    }
  }

  const handleSubmitAnswer = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!answerContent.trim()) {
      showToast('请输入回答内容', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await answerAPI.create({ question_id: id, content: answerContent })
      if (res.data?.success) {
        setAnswers([res.data.data, ...answers])
        setAnswerContent('')
        setQuestion(q => ({ ...q, answer_count: q.answer_count + 1 }))
        showToast('回答成功', 'success')
      }
    } catch (err) {}
    setSubmitting(false)
  }

  const handleAnswerLike = async (answerId) => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await answerAPI.like(answerId)
    } catch (err) {}
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <AsyncStatus loading={loading} error={error} empty={!loading && !question} onRetry={loadData}>
        {question && (
          <>
            <Card style={{ padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <Avatar url={question.avatar} name={question.nickname} size={44} />
                <div>
                  <p style={{ fontWeight: '500', color: '#1f2937' }}>{question.nickname}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>{dayjs(question.created_at).fromNow()}</p>
                </div>
                {question.topic_name && <Tag color="#8b5cf6">{question.topic_name}</Tag>}
              </div>

              <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px', color: '#1f2937', lineHeight: '1.5' }}>
                {question.title}
              </h1>

              {question.content && (
                <div style={{ 
                  color: '#374151', 
                  lineHeight: '1.8', 
                  marginBottom: '20px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {question.content}
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                gap: '24px', 
                paddingTop: '16px', 
                borderTop: '1px solid #f3f4f6',
                flexWrap: 'wrap'
              }}>
                <button onClick={handleFollow} style={actionButtonStyle(question.is_followed)}>
                  {question.is_followed ? '✅ 已关注' : '👁 关注'}
                  <span style={{ marginLeft: '4px', fontSize: '13px' }}>({question.follow_count})</span>
                </button>
                <button onClick={handleLike} style={actionButtonStyle(false)}>
                  ❤️ 点赞
                  <span style={{ marginLeft: '4px', fontSize: '13px' }}>({question.like_count})</span>
                </button>
                <button onClick={handleShare} style={actionButtonStyle(false)}>
                  🔗 分享
                </button>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>👁 {question.view_count} 浏览</span>
              </div>
            </Card>

            <Card style={{ padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                写下你的回答 ({question.answer_count})
              </h3>
              <Textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="分享你的见解和经验..."
                rows={4}
              />
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleSubmitAnswer} disabled={submitting || !answerContent.trim()}>
                  {submitting ? '提交中...' : '提交回答'}
                </Button>
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {answers.length === 0 ? (
                <Card style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af' }}>暂无回答，快来抢沙发吧~</p>
                </Card>
              ) : (
                answers.map(answer => (
                  <Card key={answer.id} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <Avatar url={answer.avatar} name={answer.nickname} size={36} />
                      <div>
                        <p style={{ fontWeight: '500' }}>{answer.nickname}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {dayjs(answer.created_at).fromNow()}
                          {answer.is_accepted && <Tag color="#22c55e" style={{ marginLeft: '8px' }}>采纳</Tag>}
                        </p>
                      </div>
                    </div>
                    <div style={{ color: '#374151', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                      {answer.content}
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <button
                        onClick={() => handleAnswerLike(answer.id)}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ❤️ {answer.like_count}
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </AsyncStatus>
    </div>
  )
}

function actionButtonStyle(active) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: active ? '#3b82f6' : '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 0'
  }
}

export function ArticleDetailPage() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await articleAPI.getById(id)
      if (res.data?.success) {
        setArticle(res.data.data)
        setComments(res.data.data.comments || [])
      }
    } catch (err) {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const res = await articleAPI.like(id)
      if (res.data?.success) {
        setArticle(a => ({
          ...a,
          is_liked: res.data.data.liked,
          like_count: res.data.data.liked ? a.like_count + 1 : a.like_count - 1
        }))
      }
    } catch (err) {}
  }

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const res = await articleAPI.favorite(id)
      if (res.data?.success) {
        setArticle(a => ({
          ...a,
          is_favorited: res.data.data.favorited,
          favorite_count: res.data.data.favorited ? a.favorite_count + 1 : a.favorite_count - 1
        }))
        showToast(res.data.data.favorited ? '已收藏' : '已取消收藏', 'success')
      }
    } catch (err) {}
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast('链接已复制', 'success')
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!commentContent.trim()) {
      showToast('请输入评论内容', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await commentAPI.create({ target_type: 'article', target_id: id, content: commentContent })
      if (res.data?.success) {
        setComments([res.data.data, ...comments])
        setCommentContent('')
        setArticle(a => ({ ...a, comment_count: a.comment_count + 1 }))
        showToast('评论成功', 'success')
      }
    } catch (err) {}
    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <AsyncStatus loading={loading} error={error} empty={!loading && !article} onRetry={loadData}>
        {article && (
          <>
            <Card style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                <Avatar url={article.avatar} name={article.nickname} size={44} />
                <div>
                  <p style={{ fontWeight: '500' }}>{article.nickname}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>{dayjs(article.created_at).fromNow()}</p>
                </div>
                {article.topic_name && <Tag color="#10b981">{article.topic_name}</Tag>}
              </div>

              <h1 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '24px', lineHeight: '1.5' }}>
                {article.title}
              </h1>

              <div style={{ 
                color: '#374151', 
                lineHeight: '1.8', 
                fontSize: '16px',
                whiteSpace: 'pre-wrap'
              }}>
                {article.content}
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '24px', 
                paddingTop: '20px', 
                marginTop: '24px',
                borderTop: '1px solid #f3f4f6',
                flexWrap: 'wrap'
              }}>
                <button onClick={handleLike} style={actionButtonStyle(article.is_liked)}>
                  {article.is_liked ? '❤️ 已喜欢' : '🤍 喜欢'}
                  <span style={{ marginLeft: '4px', fontSize: '13px' }}>({article.like_count})</span>
                </button>
                <button onClick={handleFavorite} style={actionButtonStyle(article.is_favorited)}>
                  {article.is_favorited ? '⭐ 已收藏' : '☆ 收藏'}
                  <span style={{ marginLeft: '4px', fontSize: '13px' }}>({article.favorite_count})</span>
                </button>
                <button onClick={handleShare} style={actionButtonStyle(false)}>
                  🔗 分享
                </button>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>👁 {article.view_count} 阅读</span>
              </div>
            </Card>

            <Card style={{ padding: '24px', marginTop: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                发表评论
              </h3>
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
              />
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleSubmitComment} disabled={submitting || !commentContent.trim()}>
                  {submitting ? '提交中...' : '发表评论'}
                </Button>
              </div>
            </Card>

            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                评论 ({article.comment_count})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comments.length === 0 ? (
                  <Card style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#9ca3af' }}>暂无评论</p>
                  </Card>
                ) : (
                  comments.map(comment => (
                    <Card key={comment.id} style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Avatar url={comment.avatar} name={comment.nickname} size={32} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>{comment.nickname}</span>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                              {dayjs(comment.created_at).fromNow()}
                            </span>
                          </div>
                          <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '14px' }}>{comment.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </AsyncStatus>
    </div>
  )
}
