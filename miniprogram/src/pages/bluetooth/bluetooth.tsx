import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store'
import WaterSelector, { TemperatureType } from '../../components/WaterSelector'
import RealTimeWaterDisplay from '../../components/RealTimeWaterDisplay'
import { formatMoneyWithSymbol } from '../../utils/format'
import './bluetooth.scss'

interface BluetoothDevice {
  id: string
  name: string
  mac: string
  rssi: number
  status: 'new' | 'connecting' | 'connected' | 'failed'
}

type BluetoothStatus = 'searching' | 'list' | 'connecting' | 'device-ready' | 'watering' | 'finished'

const mockDevicesData = [
  { name: '1号楼A区直饮机', mac: 'A4:CF:12:34:56:78', rssi: -45 },
  { name: '1号楼B区饮水机', mac: 'B5:DD:98:76:54:32', rssi: -62 },
  { name: '2号楼直饮机01', mac: 'C6:EE:11:22:33:44', rssi: -78 },
  { name: '图书馆3层水机', mac: 'D7:FF:55:66:77:88', rssi: -85 },
  { name: '食堂门口饮水机', mac: 'E8:AA:22:33:44:55', rssi: -92 }
]

export default function Bluetooth() {
  const { userInfo, setCurrentDevice, setWateringStatus, wateringStatus, updateBalance, resetWateringStatus } = useAppStore()

  const [status, setStatus] = useState<BluetoothStatus>('searching')
  const [devices, setDevices] = useState<BluetoothDevice[]>([])
  const [searchProgress, setSearchProgress] = useState(0)
  const [connectProgress, setConnectProgress] = useState(0)
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null)
  const [temperature, setTemperature] = useState<TemperatureType>('cold')
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [transactionId, setTransactionId] = useState<string>('')

  const searchTimerRef = useRef<any>(null)
  const connectTimerRef = useRef<any>(null)
  const updateTimerRef = useRef<any>(null)

  const pricePerLiter = 0.2

  useDidShow(() => {
    startSearching()
  })

  useEffect(() => {
    return () => {
      clearAllTimers()
    }
  }, [])

  const clearAllTimers = () => {
    if (searchTimerRef.current) clearInterval(searchTimerRef.current)
    if (connectTimerRef.current) clearInterval(connectTimerRef.current)
    if (updateTimerRef.current) clearInterval(updateTimerRef.current)
  }

  const startSearching = () => {
    clearAllTimers()
    setStatus('searching')
    setDevices([])
    setSearchProgress(0)

    let count = 0
    const deviceIndex = { current: 0 }

    searchTimerRef.current = setInterval(() => {
      setSearchProgress((prev) => {
        const next = prev + 2 + Math.random() * 5
        if (next >= 100) {
          clearInterval(searchTimerRef.current)
          setTimeout(() => {
            setStatus('list')
          }, 500)
          return 100
        }
        return next
      })

      count++
      if (count % 15 === 0 && deviceIndex.current < mockDevicesData.length) {
        const mockDev = mockDevicesData[deviceIndex.current]
        const newDevice: BluetoothDevice = {
          id: 'bt-' + Date.now() + '-' + deviceIndex.current,
          name: mockDev.name,
          mac: mockDev.mac,
          rssi: mockDev.rssi + Math.floor(Math.random() * 10 - 5),
          status: 'new'
        }
        setDevices((prev) => [...prev, newDevice])
        deviceIndex.current++
        Taro.vibrateShort({ type: 'light' })
      }
    }, 100)
  }

  const handleConnect = (device: BluetoothDevice) => {
    setSelectedDevice(device)
    setStatus('connecting')
    setConnectProgress(0)
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, status: 'connecting' } : d))
    )

    let progress = 0
    const steps = ['正在握手', '交换密钥', '验证设备', '建立连接']
    let stepIndex = 0

    connectTimerRef.current = setInterval(() => {
      progress += 4 + Math.random() * 6
      stepIndex = Math.min(Math.floor(progress / 25), 3)

      setConnectProgress(Math.min(progress, 100))

      if (progress >= 100) {
        clearInterval(connectTimerRef.current)
        Taro.vibrateShort({ type: 'medium' })
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, status: 'connected' } : d))
        )
        setCurrentDevice({
          id: device.id,
          name: device.name,
          mac: device.mac,
          location: '蓝牙直连',
          status: 'online',
          type: 'normal'
        })
        setTimeout(() => {
          setStatus('device-ready')
        }, 600)
      }
    }, 150)
  }

  const getSignalLevel = (rssi: number) => {
    if (rssi >= -55) return { level: 4, text: '极佳', color: '#52c41a' }
    if (rssi >= -70) return { level: 3, text: '良好', color: '#1890ff' }
    if (rssi >= -80) return { level: 2, text: '一般', color: '#faad14' }
    return { level: 1, text: '较弱', color: '#ff4d4f' }
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
    if (!checkBalance() || !selectedDevice) return

    try {
      Taro.showLoading({ title: '正在启动...', mask: true })
      await new Promise(resolve => setTimeout(resolve, 1000))

      const txnId = 'BTX' + Date.now()
      setTransactionId(txnId)

      setWateringStatus({
        isActive: true,
        deviceId: selectedDevice.id,
        deviceName: selectedDevice.name,
        temperature,
        volume: 0,
        amount: 0,
        currentTemp: temperature === 'hot' ? 90 : temperature === 'warm' ? 40 : 12,
        startTime: Date.now()
      })
      setStatus('watering')
      startRealtimeUpdate()
    } catch (error) {
      Taro.showToast({ title: '启动失败，请重试', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const startRealtimeUpdate = () => {
    updateTimerRef.current = setInterval(() => {
      setWateringStatus((prev) => {
        const newVolume = prev.volume + 0.04 + Math.random() * 0.03
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
      console.error(error)
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

  return (
    <View className='bluetooth-page'>
      {status === 'searching' && (
        <View className='bt-searching'>
          <View className='bt-searching__radar'>
            <View className='bt-searching__core'>
              <Text className='bt-searching__icon'>📶</Text>
            </View>
            <View className='bt-searching__wave' />
            <View className='bt-searching__wave bt-searching__wave--2' />
            <View className='bt-searching__wave bt-searching__wave--3' />
          </View>

          <Text className='bt-searching__title'>正在搜索蓝牙设备...</Text>
          <Text className='bt-searching__subtitle'>请确保设备已打开蓝牙功能</Text>

          <View className='bt-searching__progress'>
            <View
              className='bt-searching__progress-bar'
              style={{ width: `${searchProgress}%` }}
            />
          </View>
          <Text className='bt-searching__progress-text'>{Math.floor(searchProgress)}%</Text>

          <View className='bt-searching__devices-count'>
            <Text className='bt-searching__devices-num'>{devices.length}</Text>
            <Text className='bt-searching__devices-label'>已发现设备</Text>
          </View>

          <View className='bt-searching__tips'>
            <View className='bt-searching__tip-item'>
              <Text className='bt-searching__tip-icon'>1</Text>
              <Text className='bt-searching__tip-text'>确保设备处于开启状态</Text>
            </View>
            <View className='bt-searching__tip-item'>
              <Text className='bt-searching__tip-icon'>2</Text>
              <Text className='bt-searching__tip-text'>手机与设备距离不超过10米</Text>
            </View>
            <View className='bt-searching__tip-item'>
              <Text className='bt-searching__tip-icon'>3</Text>
              <Text className='bt-searching__tip-text'>点击设备名称即可连接</Text>
            </View>
          </View>
        </View>
      )}

      {status === 'list' && (
        <View className='bt-list'>
          <View className='bt-list__header'>
            <Text className='bt-list__title'>搜索结果</Text>
            <Text className='bt-list__count'>共发现 {devices.length} 个设备</Text>
          </View>

          <View className='bt-list__refresh' onClick={startSearching}>
            <Text className='bt-list__refresh-icon'>🔄</Text>
            <Text className='bt-list__refresh-text'>重新搜索</Text>
          </View>

          <View className='bt-list__content'>
            {devices.length === 0 ? (
              <View className='bt-list__empty'>
                <Text className='bt-list__empty-icon'>📡</Text>
                <Text className='bt-list__empty-text'>未发现蓝牙设备</Text>
                <Text className='bt-list__empty-desc'>请检查设备是否已开启蓝牙</Text>
              </View>
            ) : (
              devices.map((device) => {
                const signal = getSignalLevel(device.rssi)
                return (
                  <View key={device.id} className='bt-device' onClick={() => handleConnect(device)}>
                    <View className='bt-device__icon'>
                      <Text>💧</Text>
                    </View>
                    <View className='bt-device__info'>
                      <Text className='bt-device__name'>{device.name}</Text>
                      <Text className='bt-device__mac'>MAC: {device.mac}</Text>
                    </View>
                    <View className='bt-device__signal'>
                      <View className='bt-device__signal-bars'>
                        {[1, 2, 3, 4].map((i) => (
                          <View
                            key={i}
                            className={`bt-device__signal-bar ${i <= signal.level ? 'is-active' : ''}`}
                            style={{ backgroundColor: i <= signal.level ? signal.color : '#e8e8e8' }}
                          />
                        ))}
                      </View>
                      <Text className='bt-device__signal-text' style={{ color: signal.color }}>
                        {signal.text}
                      </Text>
                      <Text className='bt-device__rssi'>{device.rssi}dBm</Text>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        </View>
      )}

      {status === 'connecting' && selectedDevice && (
        <View className='bt-connecting'>
          <View className='bt-connecting__circle'>
            <View className='bt-connecting__spinner' />
            <Text className='bt-connecting__icon'>📡</Text>
          </View>
          <Text className='bt-connecting__title'>正在连接设备</Text>
          <Text className='bt-connecting__device'>{selectedDevice.name}</Text>
          <View className='bt-connecting__progress'>
            <View
              className='bt-connecting__progress-bar'
              style={{ width: `${connectProgress}%` }}
            />
          </View>
          <Text className='bt-connecting__step'>
            {['正在握手', '交换密钥', '验证设备', '建立连接'][Math.min(Math.floor(connectProgress / 25), 3)]}
          </Text>
          <Text className='bt-connecting__percent'>{Math.floor(connectProgress)}%</Text>
        </View>
      )}

      {status === 'device-ready' && selectedDevice && (
        <View className='device-ready'>
          <View className='device-ready__header'>
            <View className='device-ready__success-icon' style={{ background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)' }}>
              ✓
            </View>
            <Text className='device-ready__title'>蓝牙连接成功</Text>
          </View>

          <View className='device-ready__card card'>
            <View className='device-ready__card-header'>
              <View className='device-ready__device-icon' style={{ background: 'linear-gradient(135deg, #e6fffb 0%, #87e8de 100%)' }}>
                <Text>📶</Text>
              </View>
              <View className='device-ready__device-info'>
                <Text className='device-ready__device-name'>{selectedDevice.name}</Text>
                <Text className='device-ready__device-location'>🔗 蓝牙直连 - {selectedDevice.mac}</Text>
              </View>
              <View className='device-ready__device-status device-ready__device-status--online'>已连接</View>
            </View>
            <View className='device-ready__card-meta'>
              <View className='device-ready__meta-item'>
                <Text className='device-ready__meta-label'>信号强度</Text>
                <Text className='device-ready__meta-value text-success'>
                  {getSignalLevel(selectedDevice.rssi).text}
                </Text>
              </View>
              <View className='device-ready__meta-item'>
                <Text className='device-ready__meta-label'>取水单价</Text>
                <Text className='device-ready__meta-value text-primary'>{formatMoneyWithSymbol(pricePerLiter)}/L</Text>
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
            <Button className='btn-outline device-ready__btn-outline' onClick={startSearching}>
              重新搜索
            </Button>
            <Button className='btn-primary device-ready__btn-primary' onClick={handleStart}>
              启动取水
            </Button>
          </View>
        </View>
      )}

      {status === 'watering' && selectedDevice && (
        <View className='watering'>
          <View className='watering__device-info'>
            <Text className='watering__device-name'>{selectedDevice.name}</Text>
            <Text className='watering__device-location'>蓝牙连接 · {selectedDevice.mac}</Text>
          </View>

          <RealTimeWaterDisplay
            volume={wateringStatus.volume}
            amount={wateringStatus.amount}
            currentTemp={wateringStatus.currentTemp}
            temperature={temperature}
            startTime={wateringStatus.startTime}
            pricePerLiter={pricePerLiter}
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
              <Text className='finished__subtitle'>蓝牙取水结束</Text>
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
