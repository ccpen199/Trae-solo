import React, { useState } from 'react'
import { message, Modal } from 'antd'
import {
  PoweroffOutlined,
  PlusOutlined,
  MinusOutlined,
  SoundOutlined,
  MutedOutlined,
  UpOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { sendIRCommand } from '../api/devices.js'
import { logOperation } from '../api/operationLog.js'
import androidBridge from '../utils/androidIRBridge.js'
import { getIRCode } from '../utils/irCodeLibrary.js'

const buttonConfigs = {
  tv: [
    { key: 'power', label: '电源', icon: <PoweroffOutlined />, className: 'power' },
    { key: 'volume_up', label: '音量+', icon: <SoundOutlined />, subLabel: '+' },
    { key: 'channel_up', label: '频道+', icon: <UpOutlined /> },
    { key: 'mute', label: '静音', icon: <MutedOutlined /> },
    { key: 'ok', label: '确定', icon: 'OK' },
    { key: 'volume_down', label: '音量-', icon: <SoundOutlined />, subLabel: '-' },
    { key: 'channel_down', label: '频道-', icon: <DownOutlined /> },
    { key: 'input', label: '输入源', icon: 'INPUT' },
    { key: 'menu', label: '菜单', icon: 'MENU' }
  ],
  ac: [
    { key: 'power', label: '电源', icon: <PoweroffOutlined />, className: 'power' },
    { key: 'temp_up', label: '温度+', icon: <PlusOutlined /> },
    { key: 'mode_cool', label: '制冷', icon: '❄' },
    { key: 'fan_low', label: '低风', icon: '🌬' },
    { key: 'mode_auto', label: '自动', icon: '🔄' },
    { key: 'temp_down', label: '温度-', icon: <MinusOutlined /> },
    { key: 'mode_heat', label: '制热', icon: '☀' },
    { key: 'fan_high', label: '强风', icon: '💨' },
    { key: 'swing', label: '摆风', icon: '↕' }
  ],
  projector: [
    { key: 'power', label: '电源', icon: <PoweroffOutlined />, className: 'power' },
    { key: 'input_hdmi', label: 'HDMI', icon: 'HDMI' },
    { key: 'menu', label: '菜单', icon: <LeftOutlined /> },
    { key: 'ok', label: '确定', icon: 'OK' },
    { key: 'back', label: '返回', icon: <RightOutlined /> },
    { key: 'volume_up', label: '音量+', icon: <PlusOutlined /> },
    { key: 'volume_down', label: '音量-', icon: <MinusOutlined /> },
    { key: 'mute', label: '静音', icon: <MutedOutlined /> },
    { key: 'source', label: '信号源', icon: '📺' }
  ],
  light: [
    { key: 'power', label: '电源', icon: <PoweroffOutlined />, className: 'power' },
    { key: 'brightness_up', label: '亮度+', icon: <PlusOutlined /> },
    { key: 'color_warm', label: '暖光', icon: '🌅' },
    { key: 'brightness_down', label: '亮度-', icon: <MinusOutlined /> },
    { key: 'color_cool', label: '冷光', icon: '❄' },
    { key: 'scene_movie', label: '观影', icon: '🎬' }
  ]
}

function RemoteControl({ device, onLearnCommand }) {
  const [isPowerOn, setIsPowerOn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [learningModal, setLearningModal] = useState(false)
  const [learningCommand, setLearningCommand] = useState('')

  const deviceType = device?.type || 'tv'
  const buttons = buttonConfigs[deviceType] || buttonConfigs.tv

  const handleButtonClick = async (button) => {
    if (loading) return

    setLoading(true)
    try {
      const irCode = getIRCode(deviceType, button.key)

      let result
      if (navigator.userAgent.includes('Android')) {
        result = await androidBridge.sendIRCode(device.id, button.key, irCode?.code)
      } else {
        result = await sendIRCommand(device.id, button.key, { irCode: irCode?.code })
      }

      if (result.success || result.pending) {
        if (button.key === 'power') {
          setIsPowerOn(!isPowerOn)
        }
        if (result.pending) {
          message.info('指令已缓存，将在网络恢复后发送')
        } else {
          message.success(`${button.label} 指令已发送`)
        }
        logOperation('ir_command', { deviceId: device.id, command: button.key, success: true })
      } else {
        message.error('指令发送失败')
        logOperation('ir_command', { deviceId: device.id, command: button.key, success: false })
      }
    } catch (error) {
      message.error(`指令发送失败: ${error.message}`)
      logOperation('ir_command', { deviceId: device.id, command: button.key, success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleLearn = (button) => {
    setLearningCommand(button.key)
    setLearningModal(true)
    onLearnCommand?.(button.key)
  }

  const getStatusText = () => {
    if (!isPowerOn) return '待机中'
    switch (deviceType) {
      case 'tv': return '24°C | HDMI1'
      case 'ac': return '制冷 24°C'
      case 'projector': return '播放中'
      case 'light': return '亮度 80%'
      default: return '运行中'
    }
  }

  return (
    <div className="remote-control">
      <div className="remote-display">
        <div className="device-name">{device?.name || '未知设备'}</div>
        <div className="status">{getStatusText()}</div>
      </div>
      <div className="remote-buttons">
        {buttons.map(button => (
          <button
            key={button.key}
            className={`remote-btn ${button.className || ''}`}
            onClick={() => handleButtonClick(button)}
            onContextMenu={(e) => {
              e.preventDefault()
              handleLearn(button)
            }}
            disabled={loading}
            title={`${button.label} (右键学习)`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              {button.icon}
              {button.subLabel && <span style={{ fontSize: '10px' }}>{button.subLabel}</span>}
            </div>
          </button>
        ))}
        <button
          className="remote-btn learning"
          onClick={() => onLearnCommand?.('custom')}
        >
          <ThunderboltOutlined style={{ marginRight: '8px' }} />
          学习新指令
        </button>
      </div>

      <Modal
        title="学习红外指令"
        open={learningModal}
        onCancel={() => setLearningModal(false)}
        footer={null}
      >
        <p>正在学习指令: <strong>{learningCommand}</strong></p>
        <p>请将原遥控器对准红外接收器，按下对应按钮...</p>
      </Modal>
    </div>
  )
}

export default RemoteControl
