import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { common } from './api'
import './index.css'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/CustomerList'
import CustomerDetail from './pages/CustomerDetail'
import TodoList from './pages/TodoList'

function App() {
  const [currentUser, setCurrentUser] = useState({ id: 1, username: 'manager', name: '张经理', role: 'manager' })
  const [users, setUsers] = useState([])
  const [todos, setTodos] = useState([])

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      loadTodos()
    }
  }, [currentUser])

  async function loadUsers() {
    const data = await common.getUsers()
    setUsers(data)
  }

  async function loadTodos() {
    const data = await common.getTodos(currentUser.id)
    setTodos(data)
  }

  const roleNames = {
    manager: '客户经理',
    specialist: '资料专员',
    reviewer: '初审人员',
    director: '审批主管'
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <h1>🏠 房贷资料流转系统</h1>
          <div className="header-right">
            <select 
              className="user-select"
              value={currentUser?.id}
              onChange={(e) => setCurrentUser(users.find(u => u.id == e.target.value))}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} - {roleNames[u.role]}</option>
              ))}
            </select>
            <span className="todo-badge">待办: {todos.length}</span>
          </div>
        </header>
        
        <nav className="nav">
          <Link to="/" className="nav-link">📊 工作台</Link>
          <Link to="/customers" className="nav-link">👥 客户管理</Link>
          <Link to="/todos" className="nav-link">📋 待办事项</Link>
        </nav>

        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard currentUser={currentUser} />} />
            <Route path="/customers" element={<CustomerList currentUser={currentUser} />} />
            <Route path="/customers/:id" element={<CustomerDetail currentUser={currentUser} onUpdate={loadTodos} />} />
            <Route path="/todos" element={<TodoList currentUser={currentUser} onUpdate={loadTodos} todos={todos} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
