import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useAppStore } from '../../store'
import BalanceCard from '../../components/BalanceCard'
import DeviceCard from '../../components/DeviceCard'
import './index.scss'

export default function Index() {
  const { userInfo, recentDevices, myDevices, fetchUserInfo, fetchMyDevices } = useAppStore()

  useDidShow(() => {
    fetchUserInfo()
    fetchMyDevices()
  })

  const handleScanWater = () => {
    Taro.navigateTo({ url: '/pages/scan/scan' })
  }

  const handleBluetoothWater = () => {
    Taro.navigateTo({ url: '/pages/bluetooth/bluetooth' })
  }

  const handleNearbyDevices = () => {
    Taro.showToast({ title: '搜索附近设备中...', icon: 'none' })
  }

  const handleDeviceClick = (deviceId: string) => {
    Taro.navigateTo({
      url: `/pages/scan/scan?deviceId=${deviceId}`
    })
  }

  const mockRecentDevices = recentDevices.length > 0 ? recentDevices : [
    {
      id: 'dev-001',
      name: '1号楼A区直饮机',
      mac: 'A4:CF:12:34:56:78',
      location: '1号宿舍楼1层大厅',
      status: 'online' as const,
      type: 'normal'
    },
    {
      id: 'dev-002',
      name: '图书馆3层饮水机',
      mac: 'B5:DD:98:76:54:32',
      location: '图书馆3楼东区',
      status: 'online' as const,
      type: 'warm'
    }
  ]

  const mockMyDevices = myDevices.length > 0 ? myDevices : [
    {
      id: 'dev-003',
      name: '教学楼主楼饮水机',
      mac: 'C6:EE:11:22:33:44',
      location: '教学楼1层大厅',
      status: 'online' as const,
      type: 'hot'
    },
    {
      id: 'dev-004',
      name: '食堂门口饮水机',
      mac: 'D7:FF:55:66:77:88',
      location: '第一食堂门口',
      status: 'offline' as const,
      type: 'normal'
    }
  ]

  return (
    <View className='index-page'>
      <ScrollView className='index-page__scroll' scrollY>
        <View className='index-page__section'>
          <BalanceCard />
        </View>

        <View className='index-page__section'>
          <View className='index-page__section-header'>
            <Text className='index-page__section-title'>快捷取水</Text>
          </View>
          <View className='quick-actions'>
            <View className='quick-actions__item' onClick={handleScanWater}>
              <View className='quick-actions__icon quick-actions__icon--blue'>
                <Text className='quick-actions__icon-text'>📷</Text>
              </View>
              <Text className='quick-actions__label'>扫码取水</Text>
            </View>
            <View className='quick-actions__item' onClick={handleBluetoothWater}>
              <View className='quick-actions__icon quick-actions__icon--cyan'>
                <Text className='quick-actions__icon-text'>📶</Text>
              </View>
              <Text className='quick-actions__label'>蓝牙取水</Text>
            </View>
            <View className='quick-actions__item' onClick={handleNearbyDevices}>
              <View className='quick-actions__icon quick-actions__icon--orange'>
                <Text className='quick-actions__icon-text'>📍</Text>
              </View>
              <Text className='quick-actions__label'>附近设备</Text>
            </View>
          </View>
        </View>

        <View className='index-page__section'>
          <View className='index-page__section-header'>
            <Text className='index-page__section-title'>最近使用</Text>
            <Text className='index-page__section-more'>查看全部 →</Text>
          </View>
          <ScrollView className='recent-scroll' scrollX showScrollbar={false}>
            <View className='recent-scroll__inner'>
              {mockRecentDevices.map((device) => (
                <View key={device.id} className='recent-scroll__item'>
                  <DeviceCard
                    device={device}
                    type='recent'
                    onClick={() => handleDeviceClick(device.id)}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className='index-page__section'>
          <View className='index-page__section-header'>
            <Text className='index-page__section-title'>我的设备</Text>
            <View className='index-page__section-badge'>{mockMyDevices.length}</View>
          </View>
          <View>
            {mockMyDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                showBindStatus
                onClick={() => handleDeviceClick(device.id)}
              />
            ))}
            {mockMyDevices.length === 0 && (
              <View className='empty-state'>
                <Text className='empty-state__icon'>📱</Text>
                <Text className='empty-state__text'>暂无绑定设备</Text>
                <Text className='empty-state__desc'>扫码或搜索添加设备</Text>
              </View>
            )}
          </View>
        </View>

        <View className='index-page__safe-bottom' />
      </ScrollView>
    </View>
  )
}
