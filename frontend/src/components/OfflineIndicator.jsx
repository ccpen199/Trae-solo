import React from 'react'
import { Tag } from 'antd'
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons'
import { getNetworkStatus } from '../utils/networkDetection.js'

function OfflineIndicator() {
  const status = getNetworkStatus()

  if (status === 'online') {
    return (
      <Tag color="success" icon={<WifiOutlined />}>
        在线
      </Tag>
    )
  }

  if (status === 'weak') {
    return (
      <Tag color="warning" icon={<WifiOutlined />}>
        弱网
      </Tag>
    )
  }

  return (
    <Tag color="error" icon={<DisconnectOutlined />}>
      离线
    </Tag>
  )
}

export default OfflineIndicator
