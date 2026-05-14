import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Member = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('columns');
  const [subscribedItems, setSubscribedItems] = useState([]);
  const [showMemberSuccess, setShowMemberSuccess] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const columns = [
    { id: 1, title: '职场进阶指南', desc: '从职场小白到管理层的必修课', price: '¥99', subscribers: '2.3万人', chapters: 48, type: 'column' },
    { id: 2, title: '零基础学Python', desc: '100节课带你入门Python编程', price: '¥199', subscribers: '5.1万人', chapters: 100, type: 'column' },
    { id: 3, title: '投资理财实战课', desc: '基金、股票、理财规划全攻略', price: '¥299', subscribers: '3.8万人', chapters: 60, type: 'column' },
    { id: 4, title: '演讲与口才训练', desc: '提升表达能力，增强自信心', price: '¥69', subscribers: '1.5万人', chapters: 32, type: 'column' },
  ];

  const novels = [
    { id: 101, title: '重生之都市修仙', desc: '都市玄幻爽文，看主角如何逆袭', price: '¥29', readers: '8.7万人', chapters: 365, type: 'novel' },
    { id: 102, title: '穿越古代当王爷', desc: '历史穿越小说，权谋斗争精彩不断', price: '¥39', readers: '12.3万人', chapters: 280, type: 'novel' },
    { id: 103, title: '科幻世界2050', desc: '未来科幻巨作，探索人类未来', price: '¥49', readers: '5.6万人', chapters: 150, type: 'novel' },
  ];

  const courses = [
    { id: 201, title: 'MBA核心课程精选', desc: '顶级商学院课程精华浓缩', price: '¥599', students: '1.2万人', lessons: 24, type: 'course' },
    { id: 202, title: '数据分析实战', desc: 'Excel、Python数据分析全掌握', price: '¥299', students: '3.4万人', lessons: 48, type: 'course' },
  ];

  const getAllItems = () => [...columns, ...novels, ...courses];

  const isSubscribed = (itemId) => subscribedItems.includes(itemId);

  const handleSubscribe = (item) => {
    if (!isSubscribed(item.id)) {
      setSubscribedItems([...subscribedItems, item.id]);
    }
    navigate(`/member/read/${item.id}`, { state: { item } });
  };

  const handleMemberSubscribe = () => {
    setIsMember(true);
    setShowMemberSuccess(true);
  };

  return (
    <div>
      <header className="header">
        <div className="logo">会员</div>
        <nav className="nav-tabs">
          <span 
            className={`nav-tab ${activeTab === 'columns' ? 'active' : ''}`}
            onClick={() => setActiveTab('columns')}
            style={{ cursor: 'pointer' }}
          >
            盐选专栏
          </span>
          <span 
            className={`nav-tab ${activeTab === 'novels' ? 'active' : ''}`}
            onClick={() => setActiveTab('novels')}
            style={{ cursor: 'pointer' }}
          >
            小说
          </span>
          <span 
            className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
            style={{ cursor: 'pointer' }}
          >
            付费知识
          </span>
        </nav>
      </header>

      <main className="content" style={{ paddingBottom: '80px' }}>
        <div className="member-card" onClick={handleMemberSubscribe} style={{ cursor: 'pointer' }}>
          <div className="member-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            盐选会员
            {isMember && <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '10px' }}>已开通</span>}
          </div>
          <p style={{ marginBottom: '16px', opacity: 0.9 }}>畅读全部专栏内容，解锁专属会员权益</p>
          <button 
            className="member-btn"
            onClick={(e) => { e.stopPropagation(); handleMemberSubscribe(); }}
            style={{ opacity: isMember ? 0.7 : 1 }}
          >
            {isMember ? '查看我的会员' : '立即开通'}
          </button>
        </div>

        {showMemberSuccess && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🎉 恭喜开通盐选会员！全部内容免费畅读</span>
            <button 
              onClick={() => setShowMemberSuccess(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#155724' }}
            >
              ×
            </button>
          </div>
        )}

        {subscribedItems.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>我的订阅</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {getAllItems().filter(item => subscribedItems.includes(item.id)).map(item => (
                <div 
                  key={item.id}
                  onClick={() => navigate(`/member/read/${item.id}`, { state: { item } })}
                  style={{
                    padding: '8px 16px',
                    background: '#f0f2f5',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📖 {item.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'columns' && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '24px 0 16px' }}>热门专栏</h2>
            {columns.map((col) => (
              <div 
                key={col.id} 
                className="column-item" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSubscribe(col)}
              >
                <div className="column-cover"></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {col.title}
                    {isSubscribed(col.id) && (
                      <span style={{ fontSize: '12px', color: '#52c41a', background: '#f6ffed', padding: '2px 6px', borderRadius: '4px' }}>
                        已订阅
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{col.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: isMember || isSubscribed(col.id) ? 'var(--text-secondary)' : 'var(--primary-color)', fontWeight: 500 }}>
                      {isMember || isSubscribed(col.id) ? '免费阅读' : col.price}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{col.chapters}节 · {col.subscribers}已订阅</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'novels' && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '24px 0 16px' }}>热门小说</h2>
            {novels.map((novel) => (
              <div 
                key={novel.id} 
                className="column-item" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSubscribe(novel)}
              >
                <div className="column-cover"></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {novel.title}
                    {isSubscribed(novel.id) && (
                      <span style={{ fontSize: '12px', color: '#52c41a', background: '#f6ffed', padding: '2px 6px', borderRadius: '4px' }}>
                        已订阅
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{novel.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: isMember || isSubscribed(novel.id) ? 'var(--text-secondary)' : 'var(--primary-color)', fontWeight: 500 }}>
                      {isMember || isSubscribed(novel.id) ? '免费阅读' : novel.price}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{novel.chapters}章 · {novel.readers}阅读</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'courses' && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '24px 0 16px' }}>精品课程</h2>
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="column-item" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSubscribe(course)}
              >
                <div className="column-cover"></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {course.title}
                    {isSubscribed(course.id) && (
                      <span style={{ fontSize: '12px', color: '#52c41a', background: '#f6ffed', padding: '2px 6px', borderRadius: '4px' }}>
                        已订阅
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{course.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: isMember || isSubscribed(course.id) ? 'var(--text-secondary)' : 'var(--primary-color)', fontWeight: 500 }}>
                      {isMember || isSubscribed(course.id) ? '免费学习' : course.price}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{course.lessons}课时 · {course.students}学习</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Member;
