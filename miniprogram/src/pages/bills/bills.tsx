import { View, Text, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import {
  formatMoneyWithSymbol,
  formatVolumeWithUnit,
  formatDateTimeFriendly,
  getMonthOptions,
  getTemperatureName,
  getTemperatureColor
} from '../../utils/format'
import type { TransactionItem } from '../../services/paymentApi'
import './bills.scss'

const mockTransactions: TransactionItem[] = [
  {
    id: 'txn-001',
    orderNo: 'TX20260619123456789',
    deviceId: 'dev-001',
    deviceName: '1号楼A区直饮机',
    temperature: 'cold',
    volume: 2.35,
    amount: 0.47,
    avgTemp: 12.5,
    pricePerLiter: 0.2,
    startTime: '2026-06-19 12:30:00',
    endTime: '2026-06-19 12:31:45',
    status: 'success'
  },
  {
    id: 'txn-002',
    orderNo: 'TX20260618091523456',
    deviceId: 'dev-002',
    deviceName: '图书馆3层饮水机',
    temperature: 'warm',
    volume: 1.80,
    amount: 0.45,
    avgTemp: 42.3,
    pricePerLiter: 0.25,
    startTime: '2026-06-18 09:15:00',
    endTime: '2026-06-18 09:16:30',
    status: 'success'
  },
  {
    id: 'txn-003',
    orderNo: 'TX20260617204512345',
    deviceId: 'dev-003',
    deviceName: '教学楼主楼饮水机',
    temperature: 'hot',
    volume: 0.85,
    amount: 0.26,
    avgTemp: 92.1,
    pricePerLiter: 0.3,
    startTime: '2026-06-17 20:45:00',
    endTime: '2026-06-17 20:46:10',
    status: 'success'
  },
  {
    id: 'txn-004',
    orderNo: 'TX20260616082034567',
    deviceId: 'dev-001',
    deviceName: '1号楼A区直饮机',
    temperature: 'cold',
    volume: 3.20,
    amount: 0.64,
    avgTemp: 10.8,
    pricePerLiter: 0.2,
    startTime: '2026-06-16 08:20:00',
    endTime: '2026-06-16 08:22:15',
    status: 'success'
  },
  {
    id: 'txn-005',
    orderNo: 'TX20260615141056789',
    deviceId: 'dev-002',
    deviceName: '图书馆3层饮水机',
    temperature: 'warm',
    volume: 2.10,
    amount: 0.53,
    avgTemp: 40.5,
    pricePerLiter: 0.25,
    startTime: '2026-06-15 14:10:00',
    endTime: '2026-06-15 14:11:40',
    status: 'success'
  }
]

const monthOptions = getMonthOptions()

export default function Bills() {
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value)
  const [transactions] = useState<TransactionItem[]>(mockTransactions)

  useDidShow(() => {})

  const monthlyVolume = transactions.reduce((sum, t) => sum + t.volume, 0)
  const monthlyAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  const cumulativeVolume = monthlyVolume * 8.5

  const handleMonthChange = (e: any) => {
    setSelectedMonth(monthOptions[e.detail.value].value)
  }

  const handleItemClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/billDetail/billDetail?id=${id}` })
  }

  const currentMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || ''

  return (
    <View className='bills-page'>
      <View className='bills-header'>
        <View className='bills-header__bg' />
        <View className='bills-header__content'>
          <View className='bills-header__top'>
            <Text className='bills-header__title'>消费账单</Text>
            <View className='bills-header__month-selector'>
              <Picker
                mode='selector'
                range={monthOptions.map(m => m.label)}
                onChange={handleMonthChange}
              >
                <View className='bills-header__month-picker'>
                  <Text className='bills-header__month-text'>{currentMonthLabel}</Text>
                  <Text className='bills-header__month-arrow'>▼</Text>
                </View>
              </Picker>
            </View>
          </View>

          <View className='stats-cards'>
            <View className='stat-card'>
              <View className='stat-card__icon stat-card__icon--water'>
                <Text>💧</Text>
              </View>
              <Text className='stat-card__label'>本月用水</Text>
              <Text className='stat-card__value stat-card__value--blue'>
                {monthlyVolume.toFixed(1)}
                <Text className='stat-card__unit'>L</Text>
              </Text>
            </View>
            <View className='stat-card'>
              <View className='stat-card__icon stat-card__icon--money'>
                <Text>💰</Text>
              </View>
              <Text className='stat-card__label'>本月消费</Text>
              <Text className='stat-card__value stat-card__value--orange'>
                ¥{monthlyAmount.toFixed(2)}
              </Text>
            </View>
            <View className='stat-card'>
              <View className='stat-card__icon stat-card__icon--chart'>
                <Text>📊</Text>
              </View>
              <Text className='stat-card__label'>累计取水</Text>
              <Text className='stat-card__value stat-card__value--green'>
                {cumulativeVolume.toFixed(0)}
                <Text className='stat-card__unit'>L</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className='bills-content'>
        <View className='bills-list-header'>
          <Text className='bills-list-header__title'>账单明细</Text>
          <Text className='bills-list-header__count'>共{transactions.length}笔</Text>
        </View>

        {transactions.length === 0 ? (
          <View className='bills-empty'>
            <Text className='bills-empty__icon'>📄</Text>
            <Text className='bills-empty__text'>暂无账单记录</Text>
            <Text className='bills-empty__desc'>本月还没有取水消费</Text>
          </View>
        ) : (
          <View className='bills-list'>
            {transactions.map((item) => (
              <View
                key={item.id}
                className='bill-item'
                onClick={() => handleItemClick(item.id)}
              >
                <View className='bill-item__left'>
                  <View
                    className='bill-item__icon'
                    style={{ backgroundColor: `${getTemperatureColor(item.temperature)}15` }}
                  >
                    <Text
                      className='bill-item__icon-text'
                      style={{ color: getTemperatureColor(item.temperature) }}
                    >
                      {item.temperature === 'cold' ? '❄️' : item.temperature === 'warm' ? '💧' : '🔥'}
                    </Text>
                  </View>
                  <View className='bill-item__info'>
                    <Text className='bill-item__device'>{item.deviceName}</Text>
                    <View className='bill-item__meta'>
                      <Text
                        className='bill-item__temp-tag'
                        style={{
                          backgroundColor: `${getTemperatureColor(item.temperature)}15`,
                          color: getTemperatureColor(item.temperature)
                        }}
                      >
                        {getTemperatureName(item.temperature)}
                      </Text>
                      <Text className='bill-item__time'>
                        {formatDateTimeFriendly(item.startTime)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className='bill-item__right'>
                  <Text className='bill-item__volume'>
                    {formatVolumeWithUnit(item.volume)}
                  </Text>
                  <Text className='bill-item__amount'>
                    -{formatMoneyWithSymbol(item.amount)}
                  </Text>
                </View>
                <View className='bill-item__arrow'>
                  <Text>›</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className='bills-footer-tip'>
          <Text className='bills-footer-tip__text'>- 仅展示最近12个月的账单 -</Text>
        </View>
      </View>
    </View>
  )
}
