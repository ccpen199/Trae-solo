import React, { Suspense } from 'react'
import { Spin, Alert, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

const PageLoader = () => (
  <div className="loading-container" style={{ minHeight: '100vh' }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

export const PageError = ({ error, onRetry }) => (
  <div className="error-container" style={{ minHeight: '100vh' }}>
    <Alert
      message="加载失败"
      description={error?.message || '页面加载失败，请重试'}
      type="error"
      showIcon
      action={
        onRetry && (
          <Button 
            size="small" 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={onRetry}
          >
            重试
          </Button>
        )
      }
    />
  </div>
)

export const PageEmpty = ({ description = '暂无数据', icon = null }) => (
  <div className="empty-container">
    {icon || <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: 16 }}>📭</div>}
    <p style={{ color: '#999' }}>{description}</p>
  </div>
)

export const withSuspense = (Component) => (props) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
)

export default PageLoader
