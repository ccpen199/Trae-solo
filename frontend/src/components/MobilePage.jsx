import React from 'react'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Space, ConfigProvider } from 'antd'
import { useNavigate } from 'react-router-dom'

/**
 * 移动端页面容器组件
 * @param {Object} props
 * @param {string} props.title - 页面标题
 * @param {React.ReactNode} props.children - 页面内容
 * @param {boolean} props.showBack - 是否显示返回按钮
 * @param {React.ReactNode} props.rightExtra - 右侧操作按钮
 * @param {React.ReactNode} props.footer - 底部操作栏
 * @param {Object} props.style - 自定义样式
 * @param {boolean} props.safeArea - 是否适配 iOS 安全区域
 */
const MobilePage = ({
  title,
  children,
  showBack = true,
  rightExtra,
  footer,
  style,
  safeArea = true
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/m/dashboard')
    }
  }

  const headerStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#fff',
    padding: '0 16px',
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f0f0f0',
    paddingTop: safeArea ? 'env(safe-area-inset-top)' : 0
  }

  const contentStyle = {
    flex: 1,
    padding: 16,
    overflowY: 'auto',
    background: '#f5f5f5',
    minHeight: 'calc(100vh - 48px)',
    paddingBottom: footer ? 80 : 16
  }

  const footerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    background: '#fff',
    borderTop: '1px solid #f0f0f0',
    paddingBottom: safeArea ? 'calc(env(safe-area-inset-bottom) + 12px)' : 12,
    zIndex: 100
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8
        }
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          maxWidth: '100vw',
          overflowX: 'hidden',
          ...style
        }}
      >
        <div style={headerStyle}>
          <Space size={12} align="center">
            {showBack && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ padding: 0 }}
              />
            )}
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: '#1f1f1f'
              }}
            >
              {title}
            </span>
          </Space>
          {rightExtra && <div>{rightExtra}</div>}
        </div>

        <div style={contentStyle}>{children}</div>

        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </ConfigProvider>
  )
}

export default MobilePage
