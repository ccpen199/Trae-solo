import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { coursesAPI } from '../api/client'
import Loading from '../components/Loading'
import Empty from '../components/Empty'

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    category: '',
    age_group: '',
    is_rehabilitation: false
  })

  useEffect(() => {
    fetchCourses()
  }, [filters])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (filters.category) params.category = filters.category
      if (filters.age_group) params.age_group = filters.age_group
      if (filters.is_rehabilitation) params.is_rehabilitation = true

      const result = await coursesAPI.getAll(params)
      setCourses(result.data || [])
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchCourses}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 22 }}>📚 课程列表</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`button ${filters.is_rehabilitation ? '' : 'button-outline'}`}
            style={{ fontSize: 12, padding: '8px 12px' }}
            onClick={() => setFilters(f => ({ ...f, is_rehabilitation: !f.is_rehabilitation }))}
          >
            🏥 运动康复
          </button>
          <button
            className={filters.category === '燃脂' ? 'button' : 'button button-outline'}
            style={{ fontSize: 12, padding: '8px 12px' }}
            onClick={() => setFilters(f => ({ ...f, category: f.category === '燃脂' ? '' : '燃脂' }))}
          >
            🔥 燃脂
          </button>
          <button
            className={filters.category === '瑜伽' ? 'button' : 'button button-outline'}
            style={{ fontSize: 12, padding: '8px 12px' }}
            onClick={() => setFilters(f => ({ ...f, category: f.category === '瑜伽' ? '' : '瑜伽' }))}
          >
            🧘 瑜伽
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {['teen', 'adult', 'elderly'].map(age => (
            <button
              key={age}
              className={filters.age_group === age ? 'button' : 'button button-outline'}
              style={{ fontSize: 12, padding: '8px 12px' }}
              onClick={() => setFilters(f => ({ ...f, age_group: f.age_group === age ? '' : age }))}
            >
              {age === 'teen' ? '👦 青少年' : age === 'adult' ? '👨 成人' : '👴 中老年'}
            </button>
          ))}
        </div>
      </div>

      {courses.length === 0 ? (
        <Empty message="暂无符合条件的课程" />
      ) : (
        courses.map(course => (
          <Link
            key={course.id}
            to={`/courses/${course.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>{course.title}</h3>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{course.description}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {course.is_rehabilitation && (
                      <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                        运动医学
                      </span>
                    )}
                    <span style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                      ⏱ {course.duration}分钟
                    </span>
                    <span style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                      🔥 {course.calories_per_minute}/分钟
                    </span>
                  </div>
                </div>
                {course.is_rehabilitation && course.medical_guidance && (
                  <div style={{ marginLeft: 12, fontSize: 20 }}>⚠️</div>
                )}
              </div>
              {course.medical_guidance && (
                <div style={{ marginTop: 12, padding: 8, background: '#fff3cd', borderRadius: 6, fontSize: 12, color: '#856404' }}>
                  📋 医学指导：{course.medical_guidance}
                </div>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
