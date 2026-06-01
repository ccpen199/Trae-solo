import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [selectedRole, setSelectedRole] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { id: 'staff', name: '客房员工', desc: '布草发放、回收、新增报损', icon: '👷' },
    { id: 'manager', name: '部门经理', desc: '报损审批、供应商结算', icon: '👔' },
    { id: 'admin', name: '系统管理员', desc: '全部功能权限', icon: '👑' },
  ]

  function handleLogin(roleId) {
    if (login(roleId)) {
      navigate('/')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🏨 布草洗涤管理系统</h1>
          <p>请选择您的身份登录</p>
        </div>
        <div className="role-list">
          {roles.map(role => (
            <div
              key={role.id}
              className={`role-item ${selectedRole === role.id ? 'selected' : ''}`}
              onClick={() => handleLogin(role.id)}
            >
              <span className="role-icon">{role.icon}</span>
              <div className="role-info">
                <div className="role-name">{role.name}</div>
                <div className="role-desc">{role.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Login
