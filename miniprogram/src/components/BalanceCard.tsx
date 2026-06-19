import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../store'
import { formatMoneyWithSymbol } from '../utils/format'
import './BalanceCard.scss'

interface BalanceCardProps {
  showWarning?: boolean
  onRecharge?: () => void
}

export default function BalanceCard({ showWarning = true, onRecharge }: BalanceCardProps) {
  const { userInfo } = useAppStore()
  const balance = userInfo?.balance ?? 0
  const warning = userInfo?.balanceWarning ?? 5

  const isWarning = balance < warning
  const nickname = userInfo?.nickname || '未登录'
  const avatar = userInfo?.avatar || 'https://img.icons8.com/color/96/user-male-circle--v1.png'

  const handleRecharge = () => {
    if (onRecharge) {
      onRecharge()
    } else {
      Taro.navigateTo({ url: '/pages/recharge/recharge' })
    }
  }

  return (
    <View className='balance-card'>
      <View className='balance-card__bg' />
      <View className='balance-card__header'>
        <View className='balance-card__user'>
          <Image className='balance-card__avatar' src={avatar} mode='aspectFill' />
          <View className='balance-card__info'>
            <Text className='balance-card__name'>{nickname}</Text>
            <Text className='balance-card__label'>账户余额</Text>
          </View>
        </View>
        <View
          className='balance-card__recharge'
          onClick={handleRecharge}
        >
          <Text className='balance-card__recharge-text'>充值</Text>
        </View>
      </View>

      <View className='balance-card__amount'>
        <Text className='balance-card__symbol'>¥</Text>
        <Text className='balance-card__value'>{formatMoneyWithSymbol(balance).slice(1)}</Text>
      </View>

      {showWarning && isWarning && (
        <View className='balance-card__warning'>
          <Text className='balance-card__warning-icon'>⚠️</Text>
          <Text className='balance-card__warning-text'>
            余额低于预警值 ¥{warning}，建议及时充值
          </Text>
        </View>
      )}

      <View className='balance-card__footer'>
        <View className='balance-card__item'>
          <Text className='balance-card__item-value'>{userInfo?.studentId || '--'}</Text>
          <Text className='balance-card__item-label'>学号</Text>
        </View>
        <View className='balance-card__divider' />
        <View className='balance-card__item'>
          <Text className='balance-card__item-value'>¥{warning}</Text>
          <Text className='balance-card__item-label'>预警金额</Text>
        </View>
        <View className='balance-card__divider' />
        <View className='balance-card__item'>
          <Text className='balance-card__item-value'>--</Text>
          <Text className='balance-card__item-label'>累计消费</Text>
        </View>
      </View>
    </View>
  )
}
