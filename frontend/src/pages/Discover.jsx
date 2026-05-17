import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { discoverAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

function Discover() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user, isVip } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, booksRes] = await Promise.all([
        discoverAPI.getCourses(),
        discoverAPI.getBooks()
      ]);
      if (coursesRes.data.success) setCourses(coursesRes.data.data || []);
      if (booksRes.data.success) setBooks(booksRes.data.data || []);
    } catch (error) {
      console.error('Load data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (course) => {
    if (course.is_vip && !isVip()) {
      showToast('VIP课程，请先升级会员');
      return;
    }
    showToast('课程详情开发中');
  };

  const handleBookClick = (book) => {
    if (book.is_vip && !isVip()) {
      showToast('VIP书籍，请先升级会员');
      return;
    }
    navigate(`/book/${book.id}`);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('courses')}
        >
          🎓 课程
        </button>
        <button
          className={`btn ${activeTab === 'books' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('books')}
        >
          📚 读书
        </button>
      </div>

      {loading ? (
        <div className="loading-container">加载中...</div>
      ) : activeTab === 'courses' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map((course) => (
            <div
              key={course.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleCourseClick(course)}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: '#f0f5ff',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32
                  }}
                >
                  📖
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ margin: 0 }}>{course.title}</h4>
                    {course.is_vip && (
                      <span style={{ fontSize: 12, color: '#faad14', fontWeight: 600 }}>VIP</span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                    讲师：{course.instructor || '未知'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--primary-color)', fontWeight: 500 }}>
                    {course.price > 0 ? `¥${course.price}` : '免费'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {books.map((book) => (
            <div
              key={book.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleBookClick(book)}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 60,
                    height: 80,
                    backgroundColor: '#f0f5ff',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}
                >
                  📕
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ margin: 0 }}>{book.title}</h4>
                    {book.is_vip && (
                      <span style={{ fontSize: 12, color: '#faad14', fontWeight: 600 }}>VIP</span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                    作者：{book.author || '未知'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    共 {book.chapters || 0} 章
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Discover;
