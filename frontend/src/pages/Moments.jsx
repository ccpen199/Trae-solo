import React, { useState, useEffect } from 'react';
import {
  Heart, MessageCircle, Share2, UserPlus, Camera, Mic, Image, FileText } from 'lucide-react';
import api from '../utils/api';
import useStore from '../store';

function Moments() {
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [moments, setMoments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchMoments = async () => {
      try {
        const response = await api.get('/moments');
        if (response.data.success) {
          setMoments(response.data.data || []);
        }
      } catch (err) {
        console.error('加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchMoments();
  }, []);

  const handleLike = async (momentId, isLiked) => {
    if (!user) return;
    // Optimistic update
    setMoments(prev => prev.map(m =>
      m.id === momentId
        ? { ...m, likes: isLiked ? m.likes - 1 : m.likes + 1 }
        : m
    ));
  };

  const handleCreateMoment = async () => {
    if (!newContent.trim()) return;
    
    try {
      const response = await api.post('/moments', { content: newContent });
      if (response.data.success) {
        setMoments(prev => [response.data.data, ...prev]);
        setNewContent('');
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('发布失败');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <p style={{ color: '#999' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <header style={{
        background: 'white',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid #eee'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>动态</h1>
        
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: 16,
          borderBottom: '1px solid #eee',
          marginBottom: -16,
          paddingBottom: 16
        }}>
          {['all', 'follow', 'nearby'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: 14,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#ff4757' : '#666',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                borderBottom: activeTab === tab ? '2px solid #ff4757' : 'none'
              }}
            >
              {tab === 'all' ? '全部' : tab === 'follow' ? '关注' : '附近'}
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {moments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <p>暂无动态</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>发布第一条动态吧</p>
          </div>
        ) : (
          moments.map((moment) => (
            <div key={moment.id} style={{
              background: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                      {moment?.nickname || '用户'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#999' }}>
                      {moment?.location || '未知位置'}
                    </p>
                  </div>
                </div>
                <button style={{
                  padding: '4px 12px',
                  background: '#ff4757',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <UserPlus size={12} />
                  关注
                </button>
              </div>

              {moment?.content && (
                <p style={{ fontSize: 14, color: '#333', marginBottom: 12 }}>
                  {moment.content}
                </p>
              )}

              {moment?.topic && (
                <span style={{
                  fontSize: 12,
                  color: '#ff4757',
                  background: '#fff5f5',
                  padding: '4px 10px',
                  borderRadius: 12,
                  display: 'inline-block',
                  marginBottom: 12
                }}>
                  #{moment.topic}
                </span>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid #f5f5f5'
              }}>
                <button
                  onClick={() => handleLike(moment.id, false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    border: 'none',
                    background: 'none',
                    color: '#666',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  <Heart size={16} />
                  {moment?.likes || 0}
                </button>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  border: 'none',
                  background: 'none',
                  color: '#666',
                  fontSize: 13,
                  cursor: 'pointer'
                }}>
                  <MessageCircle size={16} />
                  {moment?.comments || 0}
                </button>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  border: 'none',
                  background: 'none',
                  color: '#666',
                  fontSize: 13,
                  cursor: 'pointer'
                }}>
                  <Share2 size={16} />
                  {moment?.shares || 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255,71,87,0.4)'
        }}
      >
        <Camera size={24} color="white" />
      </button>

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            color: 'white'
          }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: 14, cursor: 'pointer' }}
            >
              取消
            </button>
            <span style={{ fontWeight: 600 }}>发布动态</span>
            <button
              onClick={handleCreateMoment}
              disabled={!newContent.trim()}
              style={{
                background: '#ff4757',
                color: 'white',
                border: 'none',
                padding: '6px 16px',
                borderRadius: 16,
                fontSize: 14,
                cursor: 'pointer',
                opacity: newContent.trim() ? 1 : 0.5
              }}
            >
              发布
            </button>
          </div>

          <div style={{ flex: 1, padding: '16px', background: 'white', borderRadius: '20px 20px 0 0' }}>
            <textarea
              placeholder="分享你的想法..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{
                width: '100%',
                height: 150,
                border: 'none',
                outline: 'none',
                fontSize: 16,
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
              <button style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#666'
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Image size={24} />
                </div>
                <span style={{ fontSize: 12 }}>图片</span>
              </button>

              <button style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#666'
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Camera size={24} />
                </div>
                <span style={{ fontSize: 12 }}>视频</span>
              </button>

              <button style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#666'
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Mic size={24} />
                </div>
                <span style={{ fontSize: 12 }}>语音</span>
              </button>

              <button style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#666'
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={24} />
                </div>
                <span style={{ fontSize: 12 }}>话题</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Moments;
