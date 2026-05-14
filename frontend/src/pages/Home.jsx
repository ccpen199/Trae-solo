import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { topicAPI, questionAPI, articleAPI } from '../api/endpoints'
import { Card, AsyncStatus, Avatar, Tag } from '../components/Common'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function HomePage() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [topics, setTopics] = useState([])
  const [questions, setQuestions] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const sort = activeTab === 'hot' ? 'hot' : 'latest'
      const [topicsRes, questionsRes, articlesRes] = await Promise.all([
        topicAPI.getAll(),
        questionAPI.getList({ limit: 10, sort, topic_id: selectedTopic }),
        articleAPI.getList({ limit: 6, sort, topic_id: selectedTopic })
      ])
      if (topicsRes.data?.success) setTopics(topicsRes.data.data)
      if (questionsRes.data?.success) setQuestions(questionsRes.data.data.list || [])
      if (articlesRes.data?.success) setArticles(articlesRes.data.data.list || [])
    } catch (err) {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedTopic, activeTab])

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedTopic(null)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              background: selectedTopic === null ? '#3b82f6' : '#f3f4f6',
              color: selectedTopic === null ? '#fff' : '#4b5563',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            全部
          </button>
          {topics.map(topic => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '20px',
                background: selectedTopic === topic.id ? '#3b82f6' : '#f3f4f6',
                color: selectedTopic === topic.id ? '#fff' : '#4b5563',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>

      <AsyncStatus loading={loading} error={error} empty={!loading && questions.length === 0 && articles.length === 0} onRetry={loadData}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              {[
                { key: 'all', label: '最新' },
                { key: 'hot', label: '热门' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '12px 0',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                    fontWeight: activeTab === tab.key ? '600' : '400',
                    borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                    marginBottom: '-1px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {questions.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>热门文章</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {articles.map(a => (
                  <Link
                    key={a.id}
                    to={`/article/${a.id}`}
                    style={{
                      textDecoration: 'none',
                      color: '#374151',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{a.title}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {dayjs(a.created_at).fromNow()} · {a.view_count} 阅读
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>PMCAFF</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                面向市场、产品和运营从业者的学习交流与求职社区。
              </p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {topics.slice(0, 4).map(t => (
                  <Tag key={t.id}>{t.name}</Tag>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </AsyncStatus>
    </div>
  )
}

function QuestionCard({ question }) {
  return (
    <Link to={`/question/${question.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Avatar url={question.avatar} name={question.nickname} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', color: '#1f2937', lineHeight: '1.4' }}>
              {question.title}
            </h3>
            {question.topic_name && (
              <Tag color="#8b5cf6">{question.topic_name}</Tag>
            )}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: '#9ca3af', flexWrap: 'wrap' }}>
              <span>{question.nickname}</span>
              <span>{dayjs(question.created_at).fromNow()}</span>
              <span>👁 {question.view_count}</span>
              <span>💬 {question.answer_count}</span>
              <span>❤️ {question.like_count}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export function QuestionListPage() {
  const [questions, setQuestions] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [sort, setSort] = useState('latest')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async (resetPage = true) => {
    setLoading(true)
    setError(false)
    try {
      const params = {
        page: resetPage ? 1 : page,
        limit: 20,
        sort,
        ...(selectedTopic && { topic_id: selectedTopic }),
        ...(keyword && { keyword })
      }
      const res = await questionAPI.getList(params)
      if (res.data?.success) {
        setQuestions(res.data.data.list || [])
        setTotal(res.data.data.total || 0)
        if (resetPage) setPage(1)
      }
    } catch (err) {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    topicAPI.getAll().then(res => {
      if (res.data?.success) setTopics(res.data.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedTopic, sort])

  const handleSearch = (e) => {
    e.preventDefault()
    loadData()
  }

  return (
    <div>
      <Card style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索问题..."
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            搜索
          </button>
        </form>
      </Card>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedTopic(null)}
          style={getTopicButtonStyle(selectedTopic === null)}
        >
          全部
        </button>
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t.id)}
            style={getTopicButtonStyle(selectedTopic === t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
        {[
          { key: 'latest', label: '最新' },
          { key: 'hot', label: '热门' },
          { key: 'most_answers', label: '最多回答' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key)}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: sort === tab.key ? '#3b82f6' : '#6b7280',
              fontWeight: sort === tab.key ? '600' : '400',
              borderBottom: sort === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AsyncStatus loading={loading} error={error} empty={!loading && questions.length === 0} onRetry={() => loadData()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.map(q => <QuestionCard key={q.id} question={q} />)}
        </div>

        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '8px' }}>
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); loadData(false) }}
              disabled={page === 1}
              style={paginationButtonStyle(page === 1)}
            >
              上一页
            </button>
            <span style={{ padding: '8px 16px', color: '#6b7280' }}>
              第 {page} 页 / 共 {Math.ceil(total / 20)} 页
            </span>
            <button
              onClick={() => { setPage(p => p + 1); loadData(false) }}
              disabled={page >= Math.ceil(total / 20)}
              style={paginationButtonStyle(page >= Math.ceil(total / 20))}
            >
              下一页
            </button>
          </div>
        )}
      </AsyncStatus>
    </div>
  )
}

export function ArticleListPage() {
  const [articles, setArticles] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [sort, setSort] = useState('latest')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const params = {
        limit: 20,
        sort,
        ...(selectedTopic && { topic_id: selectedTopic }),
        ...(keyword && { keyword })
      }
      const res = await articleAPI.getList(params)
      if (res.data?.success) setArticles(res.data.data.list || [])
    } catch (err) {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    topicAPI.getAll().then(res => {
      if (res.data?.success) setTopics(res.data.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedTopic, sort])

  const handleSearch = (e) => {
    e.preventDefault()
    loadData()
  }

  return (
    <div>
      <Card style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索文章..."
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            搜索
          </button>
        </form>
      </Card>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedTopic(null)} style={getTopicButtonStyle(selectedTopic === null)}>全部</button>
        {topics.map(t => (
          <button key={t.id} onClick={() => setSelectedTopic(t.id)} style={getTopicButtonStyle(selectedTopic === t.id)}>
            {t.name}
          </button>
        ))}
      </div>

      <AsyncStatus loading={loading} error={error} empty={!loading && articles.length === 0} onRetry={loadData}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {articles.map(a => (
            <Link key={a.id} to={`/article/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card style={{ padding: '16px', height: '100%' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px', color: '#1f2937', lineHeight: '1.4' }}>
                  {a.title}
                </h3>
                {a.excerpt && (
                  <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.excerpt}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af' }}>
                  <span>{a.nickname}</span>
                  <span>{dayjs(a.created_at).fromNow()}</span>
                  <span>👁 {a.view_count}</span>
                  <span>❤️ {a.like_count}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </AsyncStatus>
    </div>
  )
}

function getTopicButtonStyle(active) {
  return {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '20px',
    background: active ? '#3b82f6' : '#f3f4f6',
    color: active ? '#fff' : '#4b5563',
    cursor: 'pointer',
    fontSize: '14px'
  }
}

function paginationButtonStyle(disabled) {
  return {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    color: '#4b5563',
    fontSize: '14px'
  }
}
