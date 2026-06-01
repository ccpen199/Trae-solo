import React from 'react'

export default function OnboardingPage({ onComplete }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '80px', marginBottom: '32px' }}>🎬</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>海量影片</h2>
        <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6 }}>热映大片、即将上映、经典佳作，应有尽有</p>
      </div>
      
      <div style={{ padding: '32px' }}>
        <button onClick={() => { localStorage.setItem('hasSeenOnboarding', 'true'); onComplete() }} style={{ width: '100%', padding: '14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>开始体验</button>
      </div>
    </div>
  )
}
        </button>
      </div>
    </div>
  )
}
