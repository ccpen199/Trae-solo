import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const MemberRead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item;

  const [currentChapter, setCurrentChapter] = useState(1);
  const [showCatalog, setShowCatalog] = useState(false);

  if (!item) {
    return (
      <div className="content" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <p>内容不存在</p>
        <button 
          onClick={() => navigate('/member')}
          style={{ marginTop: '16px', padding: '8px 20px', border: 'none', borderRadius: '4px', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}
        >
          返回会员页
        </button>
      </div>
    );
  }

  const typeText = item.type === 'novel' ? '小说' : item.type === 'course' ? '课程' : '专栏';
  const totalChapters = item.chapters || item.lessons || 20;

  const chapters = Array.from({ length: Math.min(totalChapters, 20) }, (_, i) => ({
    id: i + 1,
    title: `${typeText === '课程' ? '第' : ''}${i + 1}${typeText === '课程' ? '课' : '章'}：${item.title.slice(0, 10)}...`,
    isFree: i < 3
  }));

  const sampleContent = `
    这是《${item.title}》的第${currentChapter}章内容。
    \n\n
    ${item.desc}
    \n\n
    在这一章中，我们将深入探讨${item.title}的核心内容。通过学习本章，你将掌握以下要点：
    \n\n
    1. 理解${item.title}的基础概念和核心原理
    \n
    2. 掌握实际应用中的关键技巧
    \n
    3. 学会如何避免常见的错误和陷阱
    \n
    4. 通过案例学习加深理解
    \n\n
    让我们开始今天的学习之旅。首先，我们需要了解${item.title}的历史背景和发展过程。这将帮助我们更好地理解为什么这些知识如此重要，以及它们是如何演变到今天这个样子的。
    \n\n
    接下来，我们将深入探讨核心概念。这些概念是理解整个体系的基础，务必认真掌握。每一个概念都配有详细的解释和示例，帮助你更好地理解和应用。
    \n\n
    最后，我们将通过一个综合案例来结束本章的学习。这个案例将涵盖本章所学的所有内容，帮助你将理论知识应用到实际场景中。
  `;

  return (
    <div>
      <header className="header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 500 }}>{item.title}</div>
        <button 
          onClick={() => setShowCatalog(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--primary-color)' }}
        >
          目录
        </button>
      </header>

      <main className="content" style={{ paddingBottom: '80px', lineHeight: 1.8 }}>
        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            {chapters[currentChapter - 1]?.title || `第${currentChapter}章`}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {typeText} · {currentChapter}/{totalChapters}
          </p>
        </div>

        <div style={{ whiteSpace: 'pre-wrap', fontSize: '16px', color: 'var(--text-primary)' }}>
          {sampleContent}
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setCurrentChapter(Math.max(1, currentChapter - 1))}
            disabled={currentChapter === 1}
            style={{
              padding: '8px 20px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: currentChapter === 1 ? '#f5f5f5' : 'white',
              cursor: currentChapter === 1 ? 'not-allowed' : 'pointer',
              color: currentChapter === 1 ? '#ccc' : 'var(--text-primary)'
            }}
          >
            上一章
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {currentChapter} / {totalChapters}
          </span>
          <button
            onClick={() => setCurrentChapter(Math.min(totalChapters, currentChapter + 1))}
            disabled={currentChapter === totalChapters}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '4px',
              background: currentChapter === totalChapters ? '#f5f5f5' : 'var(--primary-color)',
              cursor: currentChapter === totalChapters ? 'not-allowed' : 'pointer',
              color: currentChapter === totalChapters ? '#ccc' : 'white'
            }}
          >
            下一章
          </button>
        </div>
      </main>

      {showCatalog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000
        }} onClick={() => setShowCatalog(false)}>
          <div 
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '300px',
              maxWidth: '80%',
              background: 'white',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 500 }}>目录</h3>
              <button 
                onClick={() => setShowCatalog(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div>
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() => {
                    setCurrentChapter(chapter.id);
                    setShowCatalog(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: chapter.id === currentChapter ? '#f0f7ff' : 'transparent',
                    borderBottom: '1px solid #f5f5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ 
                    color: chapter.id === currentChapter ? 'var(--primary-color)' : 'var(--text-primary)',
                    fontWeight: chapter.id === currentChapter ? 500 : 400
                  }}>
                    {chapter.title}
                  </span>
                  {chapter.isFree && (
                    <span style={{ fontSize: '12px', color: '#52c41a', background: '#f6ffed', padding: '2px 6px', borderRadius: '4px' }}>
                      免费
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default MemberRead;
