import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space } from 'antd'
import { RightOutlined, CheckOutlined } from '@ant-design/icons'
import useStore from '../store'

const Guide = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const { setHasSeenGuide } = useStore()

  const guideSteps = [
    {
      title: '海量图书',
      description: '汇聚百万册优质图书，免费借阅，想读就读',
      icon: '📖',
      color: '#1890ff'
    },
    {
      title: '极致阅读',
      description: '多种阅读模式，智能排版，给你最舒适的阅读体验',
      icon: '👁️',
      color: '#52c41a'
    },
    {
      title: '云端同步',
      description: '阅读进度、笔记、书签自动同步，随时随地继续阅读',
      icon: '☁️',
      color: '#faad14'
    },
    {
      title: '会员特权',
      description: '开通VIP，解锁更多精彩内容和专属特权',
      icon: '👑',
      color: '#eb2f96'
    }
  ]

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSkip()
    }
  }

  const handleSkip = () => {
    setHasSeenGuide(true)
    navigate('/ad')
  }

  const step = guideSteps[currentStep]

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(135deg, ${step.color}20 0%, #fff 100%)`,
      padding: '40px 24px'
    }}>
      <div style={{ textAlign: 'right' }}>
        <Button type="text" onClick={handleSkip} style={{ color: step.color }}>
          跳过
        </Button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '120px', marginBottom: 40 }}>
          {step.icon}
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: 16, color: step.color }}>
          {step.title}
        </h1>
        <p style={{ fontSize: '16px', color: '#666', textAlign: 'center', maxWidth: '80%' }}>
          {step.description}
        </p>
      </div>

      <div style={{ paddingBottom: 40 }}>
        <Space style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          {guideSteps.map((_, index) => (
            <div
              key={index}
              style={{
                width: currentStep === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: currentStep === index ? step.color : '#d9d9d9',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </Space>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            shape="round"
            icon={currentStep === guideSteps.length - 1 ? <CheckOutlined /> : <RightOutlined />}
            onClick={handleNext}
            style={{
              width: 200,
              height: 48,
              fontSize: 16,
              background: step.color,
              borderColor: step.color
            }}
          >
            {currentStep === guideSteps.length - 1 ? '开始使用' : '下一步'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Guide
