import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      padding: '48px 0 24px',
      marginTop: '64px'
    }}>
      <div className="container">
        <div className="grid grid-4" style={{ marginBottom: '32px' }}>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--primary)',
              marginBottom: '16px'
            }}>
              🎬 CineHub
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              垂直影视文化领域的专业内容服务平台，发现好电影，分享真观点。
            </p>
          </div>

          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              内容
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['电影', '剧集', '影人', '资讯', '片单'].map(item => (
                <li key={item} style={{ marginBottom: '8px' }}>
                  <Link
                    to={`/${item === '电影' ? 'movies' : item === '剧集' ? 'tv' : item === '影人' ? 'people' : item === '资讯' ? 'news' : 'playlists'}`}
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              社区
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['话题讨论', '观影团建', '观点对战', '答题竞猜', '直播'].map(item => (
                <li key={item} style={{ marginBottom: '8px' }}>
                  <Link
                    to={`/${item === '话题讨论' || item === '观影团建' || item === '观点对战' ? 'community' : item === '答题竞猜' ? 'quizzes' : 'live'}`}
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              关于
            </h4>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              API 文档：<br />
              <code style={{
                backgroundColor: 'var(--bg-dark)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                http://127.0.0.1:59024/api/health
              </code>
            </p>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              marginTop: '16px'
            }}>
              端口：前端 49024 / 后端 59024
            </p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          © 2024 CineHub. All data is for demonstration purposes only.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
