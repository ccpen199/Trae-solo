import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Gift, MessageCircle, Share2,
  Users, Send, X, UserPlus, MoreHorizontal
} from 'lucide-react';
import api from '../utils/api';
import useStore from '../store';

function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [comments, setComments] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [viewerCount, setViewerCount] = useState(100);
  const [likeCount, setLikeCount] = useState(0);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/live/${id}`);
        if (response.data.success) {
          setRoom(response.data.data.room);
          setComments(response.data.data.comments || []);
          setGifts(response.data.data.gifts || []);
          setLikeCount(response.data.data.room?.likes || 0);
        }
      } catch (err) {
        setError('加载直播间失败');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();

    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = async () => {
    if (!inputMessage.trim() || !user) return;
    
    try {
      const response = await api.post('/live/comment', {
        room_id: id,
        content: inputMessage
      });
      if (response.data.success) {
        setComments(prev => [...prev, response.data.data]);
        setInputMessage('');
      }
    } catch (err) {
      console.error('发送失败');
    }
  };

  const handleSendGift = async (gift) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await api.post('/live/gift', { room_id: id, gift_id: gift.id });
      setLikeCount(prev => prev + 1);
      setShowGiftPanel(false);
    } catch (err) {
      console.error('送礼失败');
    }
  };

  const handleLike = () => {
    setLikeCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}>
        <p style={{ color: 'white' }}>加载中...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: 'white'
      }}>
        <p>{error || '直播间不存在'}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 20,
            padding: '10px 24px',
            background: '#ff4757',
            color: 'white',
            border: 'none',
            borderRadius: 20
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: showGiftPanel ? 250 : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: 20 }}>📹</div>
          <p>直播画面区域</p>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '50px 16px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} color="white" />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0,0,0,0.5)',
          padding: '6px 12px',
          borderRadius: 20
        }}>
          <Users size={14} color="white" />
          <span style={{ color: 'white', fontSize: 13 }}>{viewerCount}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Share2 size={18} color="white" />
          </button>
          <button style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <MoreHorizontal size={18} color="white" />
          </button>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 100,
        left: 16,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(0,0,0,0.5)',
        padding: '6px 12px',
        borderRadius: 20
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff4757' }} />
        <div>
          <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>
            {room?.nickname || '主播'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>
            {room?.title || '正在直播'}
          </p>
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

      <div style={{
        position: 'absolute',
        left: 16,
        bottom: showGiftPanel ? 260 : 80,
        right: 80,
        maxHeight: 200,
        overflowY: 'auto',
        paddingRight: 8
      }}>
        {comments.slice(-10).map((comment, index) => (
          <div key={index} style={{
            marginBottom: 8,
            background: 'rgba(0,0,0,0.4)',
            padding: '8px 12px',
            borderRadius: 12,
            maxWidth: '80%'
          }}>
            <span style={{ color: '#ff6b81', fontSize: 13, fontWeight: 600 }}>
              {comment?.nickname || '用户'}
            </span>
            <span style={{ color: 'white', fontSize: 13, marginLeft: 8 }}>
              {comment?.content || ''}
            </span>
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>

      <div style={{
        position: 'absolute',
        right: 16,
        bottom: showGiftPanel ? 260 : 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'center'
      }}>
        <button
          onClick={handleLike}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Heart size={22} color="#ff4757" fill="#ff4757" />
          <span style={{ color: 'white', fontSize: 10, marginTop: 2 }}>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowGiftPanel(true)}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Gift size={22} color="#ffd700" />
        </button>

        <button style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}>
          <MessageCircle size={22} color="white" />
        </button>
      </div>

      {!showGiftPanel && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 25,
            padding: '10px 16px'
          }}>
            <input
              type="text"
              placeholder="说点什么..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: 14
              }}
            />
            <button
              onClick={handleSendComment}
              disabled={!inputMessage.trim()}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: inputMessage.trim() ? '#ff4757' : 'rgba(255,255,255,0.2)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      )}

      {showGiftPanel && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
          maxHeight: 250,
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>礼物</h3>
            <button
              onClick={() => setShowGiftPanel(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 16
          }}>
            {gifts.map((gift) => (
              <button
                key={gift.id}
                onClick={() => handleSendGift(gift)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 12,
                  border: '1px solid #eee',
                  borderRadius: 12,
                  background: gift.is_vip ? 'linear-gradient(135deg, #ffd700, #ffed4e)' : 'white',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 28 }}>{gift.icon}</span>
                <span style={{ fontSize: 12, marginTop: 4, color: '#333' }}>{gift.name}</span>
                <span style={{ fontSize: 11, color: '#ff4757', marginTop: 2 }}>{gift.price}币</span>
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: '#f5f5f5',
            borderRadius: 10
          }}>
            <span style={{ fontSize: 13, color: '#666' }}>
              余额: {user?.coins || 0} 映币
            </span>
            <button
              style={{
                padding: '6px 16px',
                background: '#ff4757',
                color: 'white',
                border: 'none',
                borderRadius: 15,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              充值
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default LiveRoom;
