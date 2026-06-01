import React from 'react'

export default function SplashScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: 'white' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>hiyou</h1>
      <p style={{ fontSize: '16px', opacity: 0.9 }}>发现好电影，遇见好时光</p>
    </div>
  )
}
