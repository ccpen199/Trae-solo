console.log('main.jsx 开始执行');

import React from 'react'
import ReactDOM from 'react-dom/client'
console.log('React 导入成功');

const rootElement = document.getElementById('root');
console.log('root 元素:', rootElement);

if (rootElement) {
  const reactStatus = document.getElementById('react-status');
  if (reactStatus) {
    reactStatus.style.display = 'flex';
  }
  
  ReactDOM.createRoot(rootElement).render(
    <div style={{
      maxWidth: '600px',
      margin: '20px auto',
      padding: '30px',
      background: '#dbeafe',
      borderRadius: '16px',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#1d4ed8', marginBottom: '16px' }}>🎉 React 渲染成功！</h2>
      <p style={{ color: '#374151' }}>现在开始逐步恢复完整的旅行僧应用</p>
    </div>
  )
  console.log('React 渲染完成');
} else {
  console.error('未找到 root 元素');
}
