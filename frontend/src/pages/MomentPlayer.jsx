import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request, { showToast } from '../utils/request';
import useAuthStore from '../store/authStore';
import { addToHistory } from '../utils/history';
import { addToFavorites, removeFromFavorites, isFavorite } from '../utils/favorites';

function MomentPlayer() {
  const { momentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [moment, setMoment] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  const fetchMoment = async () => {
    try {
      const res = await request.get('/moments/world');
      if (res?.success) {
        const found = res.data?.find(m => m.id === parseInt(momentId));
        const momentData = found || res.data?.[0] || null;
        setMoment(momentData);
        
        if (momentData) {
          addToHistory({
            id: momentData.id,
            type: 'moment',
            title: momentData.description || '随拍作品',
            desc: momentData.nickname || '多闪用户',
            cover: momentData.media_url
          });
          setFavorited(isFavorite(momentData.id, 'moment'));
        }
      }
    } catch (e) {
      console.error('获取随拍失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await request.get(`/moments/${momentId}/comments`);
      if (res?.success) {
        setComments(res.data || []);
      }
    } catch (e) {
      console.error('获取评论失败');
    }
  };

  useEffect(() => {
    fetchMoment();
  }, [momentId]);

  useEffect(() => {
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const likeMoment = async () => {
    if (!moment) return;
    
    try {
      const res = await request.post(`/moments/${moment.id}/like`);
      if (res?.success) {
        setMoment(prev => ({
          ...prev,
          likes_count: res.data.likes_count,
          is_liked: res.data.is_liked
        }));
      }
    } catch (e) {
      showToast('操作失败');
    }
  };

  const toggleFavorite = () => {
    if (!moment) return;
    
    if (favorited) {
      removeFromFavorites(moment.id, 'moment');
      setFavorited(false);
      showToast('已取消收藏');
    } else {
      const success = addToFavorites({
        id: moment.id,
        type: 'moment',
        title: moment.description || '随拍作品',
        desc: moment.nickname || '多闪用户',
        cover: moment.media_url
      });
      if (success) {
        setFavorited(true);
        showToast('收藏成功');
      }
    }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;

    try {
      const res = await request.post(`/moments/${momentId}/comments`, {
        content: comment.trim()
      });
      if (res?.success) {
        showToast('评论成功');
        setComment('');
        fetchComments();
        setMoment(prev => ({
          ...prev,
          comments_count: (prev?.comments_count || 0) + 1
        }));
      }
    } catch (e) {
      showToast('评论失败');
    }
  };

  const handleSwipe = (e) => {
    if (e.type === 'touchstart') return;
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderTopColor: '#fff' }} />
      </div>
    );
  }

  if (!moment) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        随拍不存在
      </div>
    );
  }

  return (
    <div 
      style={{ height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}
      onClick={handleSwipe}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.3)' }}>
          <div style={{ height: '100%', background: '#fff', width: `${progress}%`, transition: 'width 0.1s' }}></div>
        </div>
        <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div 
            style={{ cursor: 'pointer', color: '#fff', fontSize: 20 }}
            onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          >
            ←
          </div>
          <div style={{ color: '#fff', fontSize: 14 }}>随拍</div>
          <div 
            style={{ cursor: 'pointer', color: '#fff', fontSize: 18 }}
            onClick={(e) => { e.stopPropagation(); showToast('举报功能'); }}
          >
            ⋮
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {moment.type === 1 ? (
          <video
            ref={videoRef}
            src={moment.media_url}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={moment.media_url || 'https://picsum.photos/400/700'}
            alt="moment"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        <div style={{
          position: 'absolute',
          right: 16,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24
        }}>
          <div onClick={(e) => { e.stopPropagation(); likeMoment(); }} style={{ cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>{moment.is_liked ? '❤️' : '🤍'}</div>
            <div style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{moment.likes_count || 0}</div>
          </div>
          
          <div onClick={(e) => { e.stopPropagation(); toggleFavorite(); }} style={{ cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>{favorited ? '💝' : '🤍'}</div>
            <div style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>收藏</div>
          </div>
          
          <div onClick={(e) => { e.stopPropagation(); setShowComments(true); fetchComments(); }} style={{ cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>💬</div>
            <div style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{moment.comments_count || 0}</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>↗️</div>
            <div style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>分享</div>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          left: 16,
          right: 80,
          bottom: 120,
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <img
              src={moment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${moment.user_id}`}
              alt="user"
              style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12, border: '2px solid #fff' }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{moment.nickname || '多闪用户'}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{moment.views_count || 0} 次浏览</div>
            </div>
          </div>
          
          {moment.description && (
            <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>
              {moment.description}
            </div>
          )}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 20,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 12
        }}>
          ↓ 下滑退出
        </div>
      </div>

      {showComments && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100
          }}
          onClick={() => setShowComments(false)}
        >
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontWeight: 600 }}>评论 ({comments.length})</div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                  暂无评论，快来抢沙发吧
                </div>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', marginBottom: 16 }}>
                    <img
                      src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`}
                      alt="user"
                      style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 12 }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nickname}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{c.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <input
                type="text"
                className="input"
                placeholder="说点什么..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ flex: 1 }}
                maxLength={100}
              />
              <button
                className="btn btn-primary"
                onClick={submitComment}
                disabled={!comment.trim()}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MomentPlayer;
