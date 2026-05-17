import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoAPI } from '../api';
import { useToast } from '../components/Toast';

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const videoRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [videoRes, commentsRes] = await Promise.all([
          videoAPI.getDetail(id),
          videoAPI.getComments(id)
        ]);
        
        setVideo(videoRes.data);
        setComments(commentsRes.data || []);
      } catch (err) {
        setError(err.message);
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, showToast]);

  const handleLike = async () => {
    if (!video) return;
    try {
      const res = await videoAPI.toggleLike(id);
      setIsLiked(res.data.liked);
      setVideo(prev => ({ ...prev, like_count: res.data.like_count }));
      showToast(res.data.liked ? '已点赞' : '已取消点赞', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      showToast('请输入评论内容', 'info');
      return;
    }
    
    try {
      setSubmitting(true);
      const res = await videoAPI.addComment(id, commentText.trim());
      setComments(prev => [res.data, ...prev]);
      setVideo(prev => ({ ...prev, comment_count: (prev.comment_count || 0) + 1 }));
      setCommentText('');
      showToast('评论发布成功', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCount = (count) => {
    if (count >= 10000) return (count / 10000).toFixed(1) + 'w';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count?.toString() || '0';
  };

  const handleShare = (platform) => {
    const shareUrl = window.location.href;
    const shareText = video?.title || '精彩视频';
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('链接已复制到剪贴板', 'success');
      }).catch(() => {
        showToast('复制失败，请手动复制', 'error');
      });
    } else {
      showToast(`已分享到${platform}`, 'success');
    }
    setShowSharePanel(false);
  };

  const handleReport = () => {
    if (!reportReason.trim()) {
      showToast('请选择举报原因', 'info');
      return;
    }
    showToast('举报已提交，我们会尽快处理', 'success');
    setShowReportPanel(false);
    setReportReason('');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>⏳</div>
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
        <div style={{ fontSize: '50px', marginBottom: '20px' }}>😔</div>
        <div style={{ color: '#999', marginBottom: '20px' }}>{error || '视频不存在'}</div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px',
            background: '#fe2c55',
            border: 'none',
            borderRadius: '20px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}
        >
          ←
        </button>
        <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
          播放
        </div>
        <div style={{ width: '36px' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '60px' }}>
        <div style={{ position: 'relative', background: '#000' }}>
          <video
            ref={videoRef}
            src={video.video_url}
            poster={video.cover_url}
            controls
            autoPlay
            playsInline
            style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <img
              src={video.avatar}
              alt={video.username}
              style={{ width: '48px', height: '48px', borderRadius: '50%' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                {video.username}
              </div>
              <div style={{ color: '#999', fontSize: '12px' }}>{video.bio || '这个人很懒，什么都没写'}</div>
            </div>
            <button style={{
              padding: '8px 20px',
              background: '#fe2c55',
              border: 'none',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              + 关注
            </button>
          </div>

          <h2 style={{ color: '#fff', fontSize: '18px', margin: '0 0 8px 0' }}>{video.title}</h2>
          <p style={{ color: '#999', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.6' }}>{video.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
            <button
              onClick={handleLike}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '28px' }}>{isLiked ? '❤️' : '🤍'}</span>
              <span style={{ color: isLiked ? '#fe2c55' : '#999', fontSize: '12px' }}>{formatCount(video.like_count)}</span>
            </button>

            <button
              onClick={() => setShowCommentPanel(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '28px' }}>💬</span>
              <span style={{ color: '#999', fontSize: '12px' }}>{formatCount(video.comment_count)}</span>
            </button>

            <button
              onClick={() => setShowSharePanel(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '28px' }}>🔗</span>
              <span style={{ color: '#999', fontSize: '12px' }}>分享</span>
            </button>

            <button
              onClick={() => setShowReportPanel(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '28px' }}>🚩</span>
              <span style={{ color: '#999', fontSize: '12px' }}>举报</span>
            </button>
          </div>

          <div style={{ borderTop: '1px solid #222', paddingTop: '16px' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', margin: '0 0 12px 0' }}>评论 ({video.comment_count || 0})</h3>
            
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                暂无评论，快来抢沙发吧~
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {comments.slice(0, 5).map((comment) => (
                  <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                    <img
                      src={comment.avatar}
                      alt=""
                      style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>{comment.username}</div>
                      <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.5' }}>{comment.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1a1a1a',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderTop: '1px solid #222'
      }}>
        <input
          type="text"
          placeholder="说点什么..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: '#333',
            border: 'none',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSubmitComment}
          disabled={submitting || !commentText.trim()}
          style={{
            padding: '10px 20px',
            background: submitting || !commentText.trim() ? '#666' : '#fe2c55',
            border: 'none',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '14px',
            cursor: submitting || !commentText.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? '发送中' : '发送'}
        </button>
      </div>

      {showCommentPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200
        }} onClick={() => setShowCommentPanel(false)}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '70vh',
              background: '#1a1a1a',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px',
              textAlign: 'center',
              borderBottom: '1px solid #333',
              position: 'relative'
            }}>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>全部评论</span>
              <button
                onClick={() => setShowCommentPanel(false)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {comments.map((comment) => (
                <div key={comment.id} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <img
                    src={comment.avatar}
                    alt=""
                    style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '6px' }}>{comment.username}</div>
                    <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>{comment.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSharePanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200
        }} onClick={() => setShowSharePanel(false)}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#1a1a1a',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>分享到</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
              {['微信', 'QQ', '微博', '复制链接'].map((item, index) => (
                <button
                  key={item}
                  onClick={() => handleShare(item === '复制链接' ? 'copy' : item)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    {['💬', '🐧', '📱', '🔗'][index]}
                  </div>
                  <span style={{ color: '#999', fontSize: '12px' }}>{item}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSharePanel(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#333',
                border: 'none',
                borderRadius: '25px',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {showReportPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200
        }} onClick={() => setShowReportPanel(false)}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#1a1a1a',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>举报视频</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {['色情低俗', '广告营销', '虚假信息', '违法违规', '侵权投诉'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  style={{
                    padding: '12px 16px',
                    background: reportReason === reason ? '#fe2c55' : '#333',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowReportPanel(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#333',
                  border: 'none',
                  borderRadius: '25px',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleReport}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#fe2c55',
                  border: 'none',
                  borderRadius: '25px',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDetail;
