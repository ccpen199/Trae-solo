import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, MapPin, Users, Sparkles,
  Video, Image, Mic
} from 'lucide-react';
import api from '../utils/api';
import useStore from '../store';

function CreateLive() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('北京');
  const [beautyLevel, setBeautyLevel] = useState(50);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const categories = [
    { id: 'talent', name: '才艺', icon: '🎤' },
    { id: 'game', name: '游戏', icon: '🎮' },
    { id: 'chat', name: '聊天', icon: '💬' },
    { id: 'music', name: '音乐', icon: '🎵' },
    { id: 'dance', name: '舞蹈', icon: '💃' },
    { id: 'other', name: '其他', icon: '📱' }
  ];

  const handleStartLive = async () => {
    if (!title.trim()) {
      alert('请输入直播标题');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/live', {
        title,
        category: categories.find(c => c.id === category)?.name || '',
        location
      });

      if (response.data.success) {
        setShowShareModal(true);
        setTimeout(() => {
          navigate(`/live-room/${response.data.data.id}`);
        }, 2000);
      }
    } catch (err) {
      alert('创建直播间失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{
        background: 'white',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} color="#333" />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>开启直播</h1>
        <div style={{ width: 24 }} />
      </header>

      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        height: '300px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Camera size={60} style={{ opacity: 0.5, marginBottom: 12 }} />
          <p>点击开始直播</p>
        </div>

        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 12
        }}>
          <button style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Video size={18} color="white" />
          </button>
          <button style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Image size={18} color="white" />
          </button>
          <button style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Mic size={18} color="white" />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#333', marginBottom: 8 }}>
            直播标题
          </label>
          <input
            type="text"
            placeholder="输入吸引观众的标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #eee',
              borderRadius: 12,
              fontSize: 14,
              outline: 'none'
            }}
          />
          <p style={{ textAlign: 'right', fontSize: 12, color: '#999', marginTop: 4 }}>
            {title.length}/30
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#333', marginBottom: 8 }}>
            直播分类
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10
          }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: '12px 8px',
                  border: category === cat.id ? 'none' : '1px solid #eee',
                  borderRadius: 12,
                  background: category === cat.id ? '#ff4757' : 'white',
                  color: category === cat.id ? 'white' : '#333',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span style={{ fontSize: 12 }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#333', marginBottom: 8 }}>
            <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            位置信息
          </label>
          <input
            type="text"
            placeholder="选择位置"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #eee',
              borderRadius: 12,
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#333', marginBottom: 8 }}>
            <Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            美颜程度: {beautyLevel}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={beautyLevel}
            onChange={(e) => setBeautyLevel(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#333', marginBottom: 8 }}>
            <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            邀请好友
          </label>
          <div style={{
            display: 'flex',
            gap: 12,
            padding: '12px',
            background: 'white',
            borderRadius: 12,
            border: '1px solid #eee'
          }}>
            <button style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: '#07c160',
              color: 'white',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              微信
            </button>
            <button style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: '#12b7f5',
              color: 'white',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              QQ
            </button>
            <button style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: '#ff4757',
              color: 'white',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              映客
            </button>
          </div>
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px',
        background: 'white',
        borderTop: '1px solid #eee'
      }}>
        <button
          onClick={handleStartLive}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
            color: 'white',
            border: 'none',
            borderRadius: 25,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '创建中...' : '开始直播'}
        </button>
      </div>

      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '30px 40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 50, marginBottom: 16 }}>✅</div>
            <h3 style={{ margin: '0 0 8px' }}>直播间创建成功</h3>
            <p style={{ color: '#666', margin: 0 }}>正在进入直播间...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateLive;
