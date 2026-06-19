import { View, Text, Image } from '@tarojs/components'
import type { DeviceInfo } from '../store'
import './DeviceCard.scss'

interface DeviceCardProps {
  device: DeviceInfo
  type?: 'recent' | 'normal' | 'bound'
  onClick?: () => void
  showBindStatus?: boolean
}

export default function DeviceCard({
  device,
  type = 'normal',
  onClick,
  showBindStatus = false
}: DeviceCardProps) {
  const statusMap = {
    online: { text: '在线', color: '#52c41a', bg: '#f6ffed' },
    offline: { text: '离线', color: '#ff4d4f', bg: '#fff1f0' }
  }
  const status = statusMap[device.status]

  const typeTagMap = {
    hot: { text: '热水机', color: '#fa541c' },
    warm: { text: '温水机', color: '#13c2c2' },
    cold: { text: '冷水机', color: '#1890ff' },
    normal: { text: '直饮机', color: '#722ed1' }
  }
  const typeTag = typeTagMap[device.type as keyof typeof typeTagMap] || typeTagMap.normal

  return (
    <View className={`device-card device-card--${type}`} onClick={onClick}>
      <View className='device-card__icon-wrap'>
        <Image
          className='device-card__icon'
          src='https://img.icons8.com/color/96/water-dispenser.png'
          mode='aspectFit'
        />
        {showBindStatus && (
          <View className='device-card__bind-tag'>已绑定</View>
        )}
      </View>

      <View className='device-card__content'>
        <View className='device-card__header'>
          <Text className='device-card__name'>{device.name}</Text>
          <View
            className='device-card__status'
            style={{ color: status.color, background: status.bg }}
          >
            {status.text}
          </View>
        </View>

        <View className='device-card__meta'>
          <View className='device-card__meta-item'>
            <Text className='device-card__meta-icon'>📍</Text>
            <Text className='device-card__meta-text'>{device.location}</Text>
          </View>
          <View className='device-card__meta-item'>
            <Text className='device-card__meta-icon'>📶</Text>
            <Text className='device-card__meta-text'>{device.mac}</Text>
          </View>
        </View>

        <View className='device-card__footer'>
          <View
            className='device-card__type-tag'
            style={{ color: typeTag.color, background: `${typeTag.color}15` }}
          >
            {typeTag.text}
          </View>
          {type === 'recent' && (
            <View className='device-card__action'>
              <Text className='device-card__action-text'>立即取水</Text>
              <Text className='device-card__action-arrow'>→</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
