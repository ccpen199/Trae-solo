import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const WelcomePage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home')
    }, 500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="app-container">
      <div className="welcome-page">
        <div className="welcome-logo">Chartistic</div>
        <div className="welcome-subtitle">数据可视化编辑工具</div>
      </div>
    </div>
  )
}

export default WelcomePage
