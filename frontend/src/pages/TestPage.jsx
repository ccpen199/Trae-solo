import React from 'react';

const TestPage = () => {
  return (
    <div style={{ padding: 40, background: 'white', minHeight: '100vh' }}>
      <h1>测试页面</h1>
      <p>如果能看到这个页面，说明React基本功能正常。</p>
      <button 
        onClick={() => alert('点击有效!')}
        style={{ padding: '10px 20px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        测试按钮
      </button>
    </div>
  );
};

export default TestPage;
