import { View, Text } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import {
  formatVolumeWithUnit,
  formatMoneyWithSymbol,
  formatTemperature,
  formatDurationShort
} from '../utils/format'
import './RealTimeWaterDisplay.scss'

interface RealTimeWaterDisplayProps {
  volume: number
  amount: number
  currentTemp: number
  temperature: 'cold' | 'warm' | 'hot'
  startTime: number | null
  pricePerLiter: number
}

const AnimatedNumber = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
  decimals = 2
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
}) => {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValueRef = useRef(0)
  const animationRef = useRef<any>(null)

  useEffect(() => {
    const startValue = prevValueRef.current
    const endValue = value
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * easeProgress
      setDisplayValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  return (
    <Text className='animated-number'>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </Text>
  )
}

export default function RealTimeWaterDisplay({
  volume,
  amount,
  currentTemp,
  temperature,
  startTime,
  pricePerLiter
}: RealTimeWaterDisplayProps) {
  const [elapsed, setElapsed] = useState(0)

  const tempColorMap = {
    cold: '#1890ff',
    warm: '#13c2c2',
    hot: '#fa541c'
  }
  const accentColor = tempColorMap[temperature]

  useEffect(() => {
    if (!startTime) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  const flowRate = elapsed > 0 ? (volume / elapsed * 60).toFixed(1) : '0.0'

  return (
    <View className='realtime-display'>
      <View className='realtime-display__header'>
        <View className='realtime-display__pulse' style={{ background: accentColor }}>
          <View
            className='realtime-display__pulse-ring'
            style={{ borderColor: accentColor }}
          />
          <View
            className='realtime-display__pulse-ring realtime-display__pulse-ring--delay'
            style={{ borderColor: accentColor }}
          />
        </View>
        <Text className='realtime-display__title'>取水进行中</Text>
        <Text className='realtime-display__time'>{formatDurationShort(elapsed)}</Text>
      </View>

      <View className='realtime-display__water-anim'>
        <View className='realtime-display__water'>
          <View
            className='realtime-display__wave'
            style={{ background: `linear-gradient(180deg, ${accentColor}40 0%, ${accentColor} 100%)` }}
          />
          <View
            className='realtime-display__wave realtime-display__wave--2'
            style={{ background: `linear-gradient(180deg, ${accentColor}30 0%, ${accentColor}80 100%)` }}
          />
        </View>
        <View className='realtime-display__stream'>
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              className='realtime-display__drop'
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 0.2}s`,
                background: accentColor
              }}
            />
          ))}
        </View>
      </View>

      <View className='realtime-display__stats'>
        <View className='realtime-display__stat'>
          <View className='realtime-display__stat-label'>
            <Text className='realtime-display__stat-label-icon'>💧</Text>
            <Text>已取水量</Text>
          </View>
          <View className='realtime-display__stat-value' style={{ color: accentColor }}>
            <AnimatedNumber value={volume} suffix='L' decimals={2} />
          </View>
        </View>

        <View className='realtime-display__divider' />

        <View className='realtime-display__stat'>
          <View className='realtime-display__stat-label'>
            <Text className='realtime-display__stat-label-icon'>💰</Text>
            <Text>已扣金额</Text>
          </View>
          <View className='realtime-display__stat-value' style={{ color: '#faad14' }}>
            <AnimatedNumber value={amount} prefix='¥' decimals={2} />
          </View>
        </View>

        <View className='realtime-display__divider' />

        <View className='realtime-display__stat'>
          <View className='realtime-display__stat-label'>
            <Text className='realtime-display__stat-label-icon'>🌡️</Text>
            <Text>当前温度</Text>
          </View>
          <View className='realtime-display__stat-value' style={{ color: '#fa541c' }}>
            <AnimatedNumber value={currentTemp} suffix='°C' decimals={1} />
          </View>
        </View>
      </View>

      <View className='realtime-display__info'>
        <View className='realtime-display__info-item'>
          <Text className='realtime-display__info-label'>单价</Text>
          <Text className='realtime-display__info-value'>{formatMoneyWithSymbol(pricePerLiter)}/L</Text>
        </View>
        <View className='realtime-display__info-item'>
          <Text className='realtime-display__info-label'>流速</Text>
          <Text className='realtime-display__info-value'>{flowRate}L/min</Text>
        </View>
      </View>
    </View>
  )
}
