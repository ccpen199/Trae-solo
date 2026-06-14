import React, { useState, useEffect } from 'react';
import { liveAPI } from '../api/index.js';

const Live = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreams = async () => {
      try {
        const res = await liveAPI.getLiveStreams({ limit: 20 });
        setStreams(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStreams();
  }, []);

  const liveStreams = streams.filter(s => s.status === 'live');
  const upcomingStreams = streams.filter(s => s.status === 'upcoming');
  const pastStreams = streams.filter(s => s.status === 'ended');

  return (
    <div className="container section">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <h1 className="section-title" style={{ margin: 0 }}>直播</h1>
        <button className="btn btn-primary">+ 发起直播</button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          {liveStreams.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2 className="section-title" style={{ fontSize: '24px' }}>
                🔴 正在直播 ({liveStreams.length})
              </h2>
              <div className="grid grid-3">
                {liveStreams.map(stream => (
                  <div key={stream.id} className="card" style={{ cursor: 'pointer' }}>
                    <div style={{
                      position: 'relative',
                      aspectRatio: '16/9',
                      backgroundColor: '#000',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={stream.thumbnail_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=live%20stream%20cinematic%20movie&image_size=landscape_16_9'}
                        alt={stream.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'var(--error)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          animation: 'pulse 1s infinite'
                        }}></span>
                        LIVE
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        👥 {stream.viewer_count || 0} 人观看
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>{stream.title}</h4>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: 'var(--text-secondary)'
                      }}>
                        <span>🎤 {stream.host_username || stream.host_id}</span>
                        {stream.is_copyright_verified ? (
                          <span className="badge badge-positive">✓ 版权已校验</span>
                        ) : (
                          <span className="badge badge-neutral">版权待校验</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {upcomingStreams.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2 className="section-title" style={{ fontSize: '24px' }}>
                📅 即将开播 ({upcomingStreams.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingStreams.map(stream => (
                  <div
                    key={stream.id}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '18px' }}>{stream.title}</h4>
                      <div style={{
                        display: 'flex',
                        gap: '24px',
                        fontSize: '13px',
                        color: 'var(--text-muted)'
                      }}>
                        <span>🎤 {stream.host_username || stream.host_id}</span>
                        <span>📅 {new Date(stream.start_time).toLocaleString('zh-CN')}</span>
                        <span>🔔 {stream.reminder_count || 0} 人预约</span>
                      </div>
                    </div>
                    <button className="btn btn-secondary">预约提醒</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pastStreams.length > 0 && (
            <section>
              <h2 className="section-title" style={{ fontSize: '24px' }}>
                📹 精彩回放 ({pastStreams.length})
              </h2>
              <div className="grid grid-4">
                {pastStreams.map(stream => (
                  <div key={stream.id} className="card" style={{ cursor: 'pointer' }}>
                    <div style={{
                      position: 'relative',
                      aspectRatio: '16/9',
                      backgroundColor: '#000',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={stream.thumbnail_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20discussion%20panel&image_size=landscape_16_9'}
                        alt={stream.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.3)'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>
                          ▶
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {stream.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {streams.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📺</div>
              <h3>暂无直播</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                成为第一个发起直播的人吧！
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Live;
