import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store'
import WaterSelector, { TemperatureType } from '../../components/WaterSelector'
import RealTimeWaterDisplay from '../../components/RealTimeWaterDisplay'
import { formatMoneyWithSymbol } from '../../utils/format'
import { deviceApi } from '../../services/deviceApi'
import './scan.scss'

type ScanStatus = 'scanning' | 'device-ready' | 'watering' | 'finished'

export default function Scan() {
  const router = useRouter()
  const { userInfo, setCurrentDevice, setWateringStatus, wateringStatus, updateBalance, resetWateringStatus } = useAppStore()

  const [status, setStatus] = useState<ScanStatus>('scanning')
  const [temperature, setTemperature] = useState<TemperatureType>('cold')
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<{
    id: string
    name: string
    location: string
    mac: string
    pricePerLiter: number
  } | null>(null)
  const [transactionId, setTransactionId] = useState<string>('')

  const updateTimerRef = useRef<any>(null)

  useDidShow(() => {
    const deviceId = router.params?.deviceId
    if (deviceId) {
      simulateDeviceFound(deviceId)
    } else {
      startScanning()
    }
  })

  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current)
      }
    }
  }, [])

  const startScanning = () => {
    setStatus('scanning')
    setTimeout(() => {
      simulateDeviceFound()
    }, 2500)
  }

  const simulateDeviceFound = (mockDeviceId?: string) => {
    const mockDevice = {
      id: mockDeviceId || 'dev-scan-' + Date.now(),
      name: '1号楼A区直饮机',
      location: '1号宿舍楼1层大厅',
      mac: 'A4:CF:12:34:56:78',
      pricePerLiter: 0.2
    }
    setDeviceInfo(mockDevice)
    setCurrentDevice(mockDevice as any)
    setStatus('device-ready')
    Taro.vibrateShort({ type: 'medium' })
  }

  const checkBalance = (): boolean => {
    if (!userInfo) return true
    const minRequired = 5
    if (userInfo.balance < minRequired) {
      setShowRechargeModal(true)
      return false
    }
    return true
  }

  const handleStart = async () => {
    if (!checkBalance() || !deviceInfo) return

    try {
      Taro.showLoading({ title: '正在启动...', mask: true })
      await new Promise(resolve => setTimeout(resolve, 1000))

      const res = {
        data: {
          transactionId: 'TXN' + Date.now(),
          deviceId: deviceInfo.id,
          deviceName: deviceInfo.name,
          pricePerLiter: deviceInfo.pricePerLiter
        }
      }

      setTransactionId(res.data.transactionId)
      setWateringStatus({
        isActive: true,
        deviceId: res.data.deviceId,
        deviceName: res.data.deviceName,
        temperature,
        volume: 0,
        amount: 0,
        currentTemp: temperature === 'hot' ? 90 : temperature === 'warm' ? 40 : 12,
        startTime: Date.now()
      })
      setStatus('watering')

      startRealtimeUpdate(res.data.pricePerLiter)
    } catch (error) {
      console.error('启动失败', error)
      Taro.showToast({ title: '启动失败，请重试', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const startRealtimeUpdate = (pricePerLiter: number) => {
    updateTimerRef.current = setInterval(() => {
      setWateringStatus((prev) => {
        const newVolume = prev.volume + 0.05 + Math.random() * 0.03
        const newAmount = newVolume * pricePerLiter
        let newTemp = prev.currentTemp
        if (temperature === 'cold') {
          newTemp = 8 + Math.random() * 6
        } else if (temperature === 'warm') {
          newTemp = 38 + Math.random() * 8
        } else {
          newTemp = 88 + Math.random() * 8
        }
        return {
          ...prev,
          volume: parseFloat(newVolume.toFixed(3)),
          amount: parseFloat(newAmount.toFixed(2)),
          currentTemp: parseFloat(newTemp.toFixed(1))
        }
      })
    }, 500)
  }

  const handleStop = async () => {
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current)
    }

    try {
      Taro.showLoading({ title: '正在结算...', mask: true })
      await new Promise(resolve => setTimeout(resolve, 800))

      updateBalance(-wateringStatus.amount)
      setWateringStatus({ isActive: false })
      setStatus('finished')
    } catch (error) {
      console.error('停止失败', error)
    } finally {
      Taro.hideLoading()
    }
  }

  const handleGoRecharge = () => {
    setShowRechargeModal(false)
    Taro.navigateTo({ url: '/pages/recharge/recharge' })
  }

  const handleBackHome = () => {
    resetWateringStatus()
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const handleViewBill = () => {
    Taro.navigateTo({ url: `/pages/billDetail/billDetail?id=${transactionId}` })
  }

  const handleRescan = () => {
    resetWateringStatus()
    startScanning()
  }

  return (
    <View className='scan-page'>
      {status === 'scanning' && (
        <View className='scan-camera'>
          <View className='scan-camera__preview'>
            <View className='scan-camera__frame'>
              <View className='scan-camera__corner scan-camera__corner--tl' />
              <View className='scan-camera__corner scan-camera__corner--tr' />
              <View className='scan-camera__corner scan-camera__corner--bl' />
              <View className='scan-camera__corner scan-camera__corner--br' />
              <View className='scan-camera__scan-line' />
            </View>
            <View className='scan-camera__hint'>
              <Text className='scan-camera__hint-text'>将设备二维码放入框内</Text>
            </View>
          </View>
          <View className='scan-camera__actions'>
            <View className='scan-camera__action' onClick={startScanning}>
              <Text className='scan-camera__action-icon'>🔄</Text>
              <Text className='scan-camera__action-text'>重新扫描</Text>
            </View>
            <View className='scan-camera__action' onClick={() => Taro.navigateTo({ url: '/pages/bluetooth/bluetooth' })}>
              <Text className='scan-camera__action-icon'>📶</Text>
              <Text className='scan-camera__action-text'>蓝牙连接</Text>
            </View>
          </View>
          <View className='scan-camera__album'>
            <Button className='scan-camera__album-btn' onClick={() => Taro.showToast({ title: '从相册选择', icon: 'none' })}>
              从相册选择
            </Button>
          </View>
        </View>
      )}

      {status === 'device-ready' && deviceInfo && (
        <View className='device-ready'>
          <View className='device-ready__header'>
            <View className='device-ready__success-icon'>✓</View>
            <Text className='device-ready__title'>设备识别成功</Text>
          </View>

          <View className='device-ready__card card'>
            <View className='device-ready__card-header'>
              <View className='device-ready__device-icon'>
                <Text>💧</Text>
              </View>
              <View className='device-ready__device-info'>
                <Text className='device-ready__device-name'>{deviceInfo.name}</Text>
                <Text className='device-ready__device-location'>📍 {deviceInfo.location}</Text>
              </View>
              <View className='device-ready__device-status device-ready__device-status--online'>
                在线
              </View>
            </View>
            <View className='device-ready__card-meta'>
              <View className='device-ready__meta-item'>
                <Text className='device-ready__meta-label'>设备MAC</Text>
                <Text className='device-ready__meta-value'>{deviceInfo.mac}</Text>
              </View>
              <View className='device-ready__meta-item'>
                <Text className='device-ready__meta-label'>取水单价</Text>
                <Text className='device-ready__meta-value text-primary'>{formatMoneyWithSymbol(deviceInfo.pricePerLiter)}/L</Text>
              </View>
            </View>
          </View>

          <View className='device-ready__section'>
            <Text className='device-ready__section-title'>请选择水温</Text>
            <WaterSelector value={temperature} onChange={setTemperature} />
          </View>

          <View className='device-ready__balance'>
            <Text className='device-ready__balance-label'>当前余额</Text>
            <Text className='device-ready__balance-value text-primary'>
              {formatMoneyWithSymbol(userInfo?.balance ?? 0)}
            </Text>
          </View>

          <View className='device-ready__actions'>
            <Button className='btn-outline device-ready__btn-outline' onClick={handleRescan}>
              重新扫描
            </Button>
            <Button className='btn-primary device-ready__btn-primary' onClick={handleStart}>
              启动取水
            </Button>
          </View>
        </View>
      )}

      {status === 'watering' && deviceInfo && (
        <View className='watering'>
          <View className='watering__device-info'>
            <Text className='watering__device-name'>{deviceInfo.name}</Text>
            <Text className='watering__device-location'>{deviceInfo.location}</Text>
          </View>

          <RealTimeWaterDisplay
            volume={wateringStatus.volume}
            amount={wateringStatus.amount}
            currentTemp={wateringStatus.currentTemp}
            temperature={temperature}
            startTime={wateringStatus.startTime}
            pricePerLiter={deviceInfo.pricePerLiter}
          />

          <View className='watering__balance'>
            <Text className='watering__balance-label'>剩余余额</Text>
            <Text className='watering__balance-value'>
              {formatMoneyWithSymbol(Math.max(0, (userInfo?.balance ?? 0) - wateringStatus.amount))}
            </Text>
          </View>

          <View className='watering__actions'>
            <Button className='btn-danger watering__btn-stop' onClick={handleStop}>
              停止取水
            </Button>
          </View>
        </View>
      )}

      {status === 'finished' && (
        <View className='finished'>
          <View className='finished__card card'>
            <View className='finished__success'>
              <View className='finished__success-icon'>✓</View>
              <Text className='finished__title'>取水完成</Text>
              <Text className='finished__subtitle'>本次取水详情</Text>
            </View>

            <View className='finished__stats'>
              <View className='finished__stat'>
                <Text className='finished__stat-label'>取水量</Text>
                <Text className='finished__stat-value text-primary'>
                  {wateringStatus.volume.toFixed(2)}L
                </Text>
              </View>
              <View className='finished__stat'>
                <Text className='finished__stat-label'>消费金额</Text>
                <Text className='finished__stat-value text-warning'>
                  {formatMoneyWithSymbol(wateringStatus.amount)}
                </Text>
              </View>
              <View className='finished__stat'>
                <Text className='finished__stat-label'>平均温度</Text>
                <Text className='finished__stat-value'>
                  {wateringStatus.currentTemp.toFixed(1)}°C
                </Text>
              </View>
            </View>

            <View className='finished__balance'>
              <Text className='finished__balance-label'>剩余余额</Text>
              <Text className='finished__balance-value'>
                {formatMoneyWithSymbol(userInfo?.balance ?? 0)}
              </Text>
            </View>
          </View>

          <View className='finished__actions'>
            <Button className='btn-outline finished__btn' onClick={handleViewBill}>
              查看电子账单
            </Button>
            <Button className='btn-primary finished__btn' onClick={handleBackHome}>
              返回首页
            </Button>
          </View>
        </View>
      )}

      {showRechargeModal && (
        <View className='modal-overlay' onClick={() => setShowRechargeModal(false)}>
          <View className='modal-content recharge-modal' onClick={e => e.stopPropagation()}>
            <View className='recharge-modal__icon'>⚠️</View>
            <Text className='recharge-modal__title'>余额不足</Text>
            <Text className='recharge-modal__desc'>
              当前余额 {formatMoneyWithSymbol(userInfo?.balance ?? 0)}，不足以启动取水，请先充值
            </Text>
            <View className='recharge-modal__amount'>
              <View className='recharge-modal__amount-item recharge-modal__amount-item--active'>
                <Text className='recharge-modal__amount-num'>¥20</Text>
                <Text className='recharge-modal__amount-bonus'>送¥2</Text>
              </View>
            </View>
            <View className='recharge-modal__actions'>
              <Button
                className='btn-outline recharge-modal__btn recharge-modal__btn-outline'
                onClick={() => setShowRechargeModal(false)}
              >
                取消
              </Button>
              <Button
                className='btn-primary recharge-modal__btn recharge-modal__btn-primary'
                onClick={handleGoRecharge}
              >
                去充值
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
