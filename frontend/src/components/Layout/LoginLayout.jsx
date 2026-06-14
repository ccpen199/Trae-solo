import { Outlet } from 'react-router-dom';

const LoginLayout = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex' }}>
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #1E6FDB 0%, #0F4C9E 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 48,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 300,
              height: 300,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480 }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: '#fff',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 32px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
            >
              <span style={{ color: '#1E6FDB', fontSize: 40, fontWeight: 'bold' }}>政</span>
            </div>

            <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 700, marginBottom: 16 }}>
              政务服务平台
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 18, lineHeight: 1.8, margin: 0 }}>
              让数据多跑路，让群众少跑腿
              <br />
              一站式政务服务，便捷高效为民
            </p>

            <div
              style={{
                marginTop: 48,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
              }}
            >
              {[
                { icon: '🛡️', title: '安全可靠', desc: '数据加密传输' },
                { icon: '⚡', title: '高效便捷', desc: '7x24小时服务' },
                { icon: '🎯', title: '精准服务', desc: '智能化办理' },
              ].map((item, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            width: 560,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 64,
          }}
        >
          <Outlet />
        </div>
      </div>

      <div
        style={{
          height: 48,
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: 13,
        }}
      >
        政务服务平台 ©{new Date().getFullYear()} 版权所有 | 技术支持：政务信息化中心
      </div>
    </div>
  );
};

export default LoginLayout;
