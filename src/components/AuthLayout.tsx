import { ReactNode } from 'react';
import { Building2, Shield, Clock, CheckCircle } from 'lucide-react';
import { CITY_NAMES, CITIES, CityCode } from 'shared/types';

interface AuthLayoutProps {
  children: ReactNode;
}

const cityHighlights: Record<CityCode, string[]> = {
  BJ: ['公积金比例12%', '医保个人账户', '养老待遇优'],
  SH: ['社保基数高', '医疗资源丰富', '人才补贴多'],
  GZ: ['灵活就业便利', '医保跨省结算', '入户政策宽'],
  SZ: ['创新人才补贴', '公积金贷款高', '社保费率优'],
  HZ: ['数字经济领先', '人才政策优厚', '社保服务高效'],
  TJ: ['滨海新区优惠', '社保基数合理', '养老保障完善'],
};

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}
      className="auth-layout"
    >
      <div
        className="auth-left-panel"
        style={{
          width: '50%',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #3B82F6 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <svg
          className="auth-waves"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40%',
            opacity: 0.15,
            pointerEvents: 'none',
          }}
        >
          <path
            fill="#ffffff"
            d="M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,181.3C672,203,768,213,864,192C960,171,1056,117,1152,112C1248,107,1344,149,1392,170.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <path
            fill="#ffffff"
            d="M0,256L48,240C96,224,192,192,288,197.3C384,203,480,245,576,250.7C672,256,768,224,864,208C960,192,1056,192,1152,208C1248,224,1344,256,1392,272L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            style={{ opacity: 0.5 }}
          />
        </svg>

        <div
          className="auth-geometric-1"
          style={{
            position: 'absolute',
            top: '10%',
            right: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="auth-geometric-2"
          style={{
            position: 'absolute',
            top: '50%',
            left: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Building2 size={28} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: '"Noto Serif SC", serif',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.2,
                }}
              >
                社保通
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                Social Insurance Platform
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 48 }}>
            <h1
              style={{
                fontFamily: '"Noto Serif SC", serif',
                fontSize: 40,
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                marginBottom: 16,
                lineHeight: 1.3,
              }}
            >
              覆盖六地合规代缴
              <br />
              实时测算一键办理
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.7 }}>
              政务级安全保障 · 全流程数字化服务 · 覆盖北京、上海、广州、深圳、杭州、天津六大城市
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {CITIES.map((city, index) => (
              <div
                key={city}
                className="auth-city-card"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 12,
                  padding: '16px 14px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.5s ease ${index * 0.08}s both`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Building2 size={14} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
                    {CITY_NAMES[city]}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {cityHighlights[city].map((highlight, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.75)',
                      }}
                    >
                      <CheckCircle size={10} color="#86EFAC" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={18} color="#86EFAC" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>政务级安全</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>数据加密传输</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={18} color="#93C5FD" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>实时办理</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>7x24小时服务</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            © 2024 社保通 · 政务社保公积金代缴服务平台 · 京ICP备XXXXXXXX号
          </div>
        </div>
      </div>

      <div
        className="auth-right-panel"
        style={{
          width: '50%',
          minHeight: '100vh',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          {children}
          <div
            className="auth-copyright-mobile"
            style={{
              textAlign: 'center',
              marginTop: 32,
              fontSize: 12,
              color: '#94A3B8',
              display: 'none',
            }}
          >
            © 2024 社保通 · 政务社保公积金代缴服务平台
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-city-card:hover {
          background: rgba(255,255,255,0.14) !important;
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.25) !important;
        }

        @media (max-width: 960px) {
          .auth-layout {
            flex-direction: column !important;
          }
          .auth-left-panel {
            width: 100% !important;
            min-height: auto !important;
            padding: 40px 24px !important;
          }
          .auth-right-panel {
            width: 100% !important;
            min-height: auto !important;
            padding: 32px 24px !important;
          }
          .auth-waves {
            display: none;
          }
          .auth-copyright-mobile {
            display: block !important;
          }
          .auth-left-panel > div:last-child > div:last-child {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .auth-left-panel > div:first-child > div:nth-child(3) {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .auth-left-panel > div:first-child h1 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default AuthLayout;
