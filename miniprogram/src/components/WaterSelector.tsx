import { View, Text } from '@tarojs/components'
import './WaterSelector.scss'

export type TemperatureType = 'cold' | 'warm' | 'hot'

interface WaterSelectorProps {
  value: TemperatureType
  onChange: (value: TemperatureType) => void
  disabled?: boolean
}

export default function WaterSelector({ value, onChange, disabled = false }: WaterSelectorProps) {
  const options: {
    key: TemperatureType
    name: string
    icon: string
    color: string
    tempRange: string
    desc: string
  }[] = [
    {
      key: 'cold',
      name: '冷水',
      icon: '❄️',
      color: '#1890ff',
      tempRange: '5 - 15°C',
      desc: '清凉解渴'
    },
    {
      key: 'warm',
      name: '温水',
      icon: '💧',
      color: '#13c2c2',
      tempRange: '35 - 45°C',
      desc: '温和宜人'
    },
    {
      key: 'hot',
      name: '热水',
      icon: '🔥',
      color: '#fa541c',
      tempRange: '85 - 100°C',
      desc: '冲调佳品'
    }
  ]

  return (
    <View className='water-selector'>
      {options.map((option) => {
        const isActive = value === option.key
        return (
          <View
            key={option.key}
            className={`water-selector__item ${isActive ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
            style={{
              borderColor: isActive ? option.color : '#e8e8e8',
              background: isActive ? `${option.color}10` : '#ffffff'
            }}
            onClick={() => !disabled && onChange(option.key)}
          >
            <View
              className='water-selector__icon'
              style={{ background: `${option.color}15` }}
            >
              <Text className='water-selector__icon-text'>{option.icon}</Text>
            </View>
            <Text
              className='water-selector__name'
              style={{ color: isActive ? option.color : '#333333' }}
            >
              {option.name}
            </Text>
            <Text className='water-selector__range'>{option.tempRange}</Text>
            <Text className='water-selector__desc'>{option.desc}</Text>
            {isActive && (
              <View
                className='water-selector__check'
                style={{ background: option.color }}
              >
                <Text className='water-selector__check-text'>✓</Text>
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}
