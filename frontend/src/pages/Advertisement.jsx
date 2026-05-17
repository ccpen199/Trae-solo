import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { bookApi } from '../api'

const Advertisement = () => {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)
  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const data = await bookApi.getAdvertisements()
        if (data?.advertisements && data.advertisements.length > 0) {
          setAd(data.advertisements[0])
        }
      } catch (error) {
        console.error('获取广告失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAd()
  }, [])

  useEffect(() => {
    if (loading) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading])

  useEffect(() => {
    if (countdown === 0 && !loading) {
      handleSkip()
    }
  }, [countdown, loading])

  const handleSkip = () => {
    navigate('/home')
  }

  const handleAdClick = () => {
    if (ad?.link) {
      window.open(ad.link, '_blank')
    }
  }

  const defaultAd = {
    title: '限时VIP特惠',
    image: 'https://picsum.photos/seed/library-ad/800/1200',
    description: '开通VIP会员，畅享全站图书免费阅读'
  }

  const displayAd = ad || defaultAd

  return (
    <div style={{
      height: '100vh',
      position: 'relative',
      background: '#fff',
      overflow: 'hidden'
    }}>
      <div 
        onClick={handleAdClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 40
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: 300,
          aspectRatio: '3/4',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 32,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
          <img 
            src={displayAd.image} 
            alt={displayAd.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          {displayAd.title}
        </h2>
        <p style={{ color: '#666', textAlign: 'center' }}>
          {displayAd.description}
        </p>
      </div>

      <Button
        type="default"
        size="large"
        shape="round"
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: 40,
          right: 24,
          minWidth: 100,
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          border: 'none'
        }}
      >
        跳过 {countdown}s
      </Button>
    </div>
  )
}

export default Advertisement
