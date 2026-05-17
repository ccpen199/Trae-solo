import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import useStore from '../store'

const Splash = () => {
  const navigate = useNavigate()
  const { isOnline, hasSeenGuide } = useStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOnline) {
        navigate('/cloud-library')
      } else if (!hasSeenGuide) {
        navigate('/guide')
      } else {
        navigate('/ad')
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [navigate, isOnline, hasSeenGuide])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        fontSize: '48px', 
        color: '#fff', 
        fontWeight: 'bold',
        marginBottom: 24,
        letterSpacing: '4px'
      }}>
        📚 藏书馆
      </div>
      <Spin size="large" style={{ color: '#fff' }} />
      <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 16 }}>
        免费借阅，海量好书
      </p>
    </div>
  )
}

export default Splash
