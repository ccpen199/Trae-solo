import './App.css'

function App() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#1890ff' }}>✅ 仓库租赁管理系统</h1>
      <p>前端服务运行正常！</p>
      <p>访问地址: http://127.0.0.1:48952/</p>
      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f7fa', borderRadius: '8px' }}>
        <h3>系统功能：</h3>
        <ul>
          <li>数据概览 Dashboard</li>
          <li>仓库资源管理</li>
          <li>客户管理</li>
          <li>客户询价与智能匹配</li>
          <li>合同管理</li>
          <li>租金账单管理</li>
          <li>数据报表</li>
        </ul>
      </div>
    </div>
  )
}

export default App
