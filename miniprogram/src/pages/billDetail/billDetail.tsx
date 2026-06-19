import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import {
  formatMoneyWithSymbol,
  formatVolumeWithUnit,
  formatTemperature,
  formatDateTime,
  formatDuration,
  getTemperatureName,
  getTemperatureColor
} from '../../utils/format'
import './billDetail.scss'

interface BillDetailData {
  orderNo: string
  deviceName: string
  deviceLocation: string
  temperature: 'cold' | 'warm' | 'hot'
  volume: number
  amount: number
  avgTemp: number
  pricePerLiter: number
  startTime: string
  endTime: string
  duration: number
  feeDetails: { item: string; value: string }[]
  signatureTime: string
}

const mockBillDetail = (id: string): BillDetailData => ({
  orderNo: 'TX20260619123456789',
  deviceName: '1号楼A区直饮机',
  deviceLocation: '1号宿舍楼1层大厅东侧',
  temperature: 'cold',
  volume: 2.35,
  amount: 0.47,
  avgTemp: 12.5,
  pricePerLiter: 0.2,
  startTime: '2026-06-19 12:30:15',
  endTime: '2026-06-19 12:31:45',
  duration: 90,
  feeDetails: [
    { item: '基础用水量', value: '2.00L' },
    { item: '超出基础量', value: '0.35L' },
    { item: '单价(冷水)', value: '¥0.20/L' },
    { item: '金额小计', value: '¥0.47' },
    { item: '优惠减免', value: '-¥0.00' }
  ],
  signatureTime: '2026-06-19 12:31:45'
})

export default function BillDetail() {
  const router = useRouter()
  const [bill, setBill] = useState<BillDetailData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const id = router.params?.id || 'default'
    setBill(mockBillDetail(id))
  }, [router.params?.id])

  const handleShareBill = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  const handleSaveImage = async () => {
    setIsGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  if (!bill) {
    return (
      <View className='bill-loading'>
        <View className='bill-loading__spinner' />
        <Text className='bill-loading__text'>加载中...</Text>
      </View>
    )
  }

  const tempColor = getTemperatureColor(bill.temperature)
  const tempName = getTemperatureName(bill.temperature)

  return (
    <ScrollView className='bill-detail-page' scrollY>
      <View className='bill-paper'>
        <View className='bill-paper__hole bill-paper__hole--left' />
        <View className='bill-paper__hole bill-paper__hole--right' />

        <View className='bill-header'>
          <View className='bill-header__logo'>
            <Text className='bill-header__logo-icon'>💧</Text>
            <Text className='bill-header__logo-text'>智慧取水</Text>
          </View>
          <View className='bill-header__title-wrap'>
            <Text className='bill-header__title'>电子账单</Text>
            <Text className='bill-header__subtitle'>Electronic Receipt</Text>
          </View>
          <View className='bill-header__status'>
            <View className='bill-header__status-dot' />
            <Text className='bill-header__status-text'>交易成功</Text>
          </View>
        </View>

        <View className='bill-info'>
          <View className='bill-info__row'>
            <Text className='bill-info__label'>交易编号</Text>
            <Text className='bill-info__value bill-info__value--mono'>{bill.orderNo}</Text>
          </View>
          <View className='bill-info__row'>
            <Text className='bill-info__label'>交易时间</Text>
            <Text className='bill-info__value'>{bill.endTime}</Text>
          </View>
        </View>

        <View className='bill-summary'>
          <View className='bill-summary__left'>
            <View
              className='bill-summary__icon'
              style={{ backgroundColor: `${tempColor}15` }}
            >
              <Text style={{ color: tempColor }}>
                {bill.temperature === 'cold' ? '❄️' : bill.temperature === 'warm' ? '💧' : '🔥'}
              </Text>
            </View>
            <View className='bill-summary__info'>
              <Text className='bill-summary__device'>{bill.deviceName}</Text>
              <Text className='bill-summary__location'>📍 {bill.deviceLocation}</Text>
            </View>
          </View>
          <View className='bill-summary__right'>
            <View
              className='bill-summary__temp-tag'
              style={{ backgroundColor: `${tempColor}15`, color: tempColor }}
            >
              {tempName}
            </View>
          </View>
        </View>

        <View className='bill-stats'>
          <View className='bill-stat'>
            <Text className='bill-stat__label'>取水量</Text>
            <Text className='bill-stat__value bill-stat__value--water'>
              {formatVolumeWithUnit(bill.volume)}
            </Text>
          </View>
          <View className='bill-stat__divider' />
          <View className='bill-stat'>
            <Text className='bill-stat__label'>平均温度</Text>
            <Text className='bill-stat__value bill-stat__value--temp'>
              {formatTemperature(bill.avgTemp)}
            </Text>
          </View>
          <View className='bill-stat__divider' />
          <View className='bill-stat'>
            <Text className='bill-stat__label'>取水时长</Text>
            <Text className='bill-stat__value bill-stat__value--time'>
              {formatDuration(bill.duration)}
            </Text>
          </View>
        </View>

        <View className='bill-section'>
          <Text className='bill-section__title'>费用明细</Text>
          <View className='bill-fee-list'>
            {bill.feeDetails.map((fee, index) => (
              <View key={index} className='bill-fee-item'>
                <Text className='bill-fee-item__label'>{fee.item}</Text>
                <Text
                  className={`bill-fee-item__value ${
                    fee.item === '优惠减免' ? 'bill-fee-item__value--discount' : ''
                  }`}
                >
                  {fee.value}
                </Text>
              </View>
            ))}
          </View>
          <View className='bill-total'>
            <Text className='bill-total__label'>应付金额</Text>
            <Text className='bill-total__value'>{formatMoneyWithSymbol(bill.amount)}</Text>
          </View>
        </View>

        <View className='bill-time-range'>
          <View className='bill-time-range__item'>
            <View className='bill-time-range__dot bill-time-range__dot--start' />
            <View className='bill-time-range__info'>
              <Text className='bill-time-range__label'>开始时间</Text>
              <Text className='bill-time-range__value'>{bill.startTime}</Text>
            </View>
          </View>
          <View className='bill-time-range__line' />
          <View className='bill-time-range__item'>
            <View className='bill-time-range__dot bill-time-range__dot--end' />
            <View className='bill-time-range__info'>
              <Text className='bill-time-range__label'>结束时间</Text>
              <Text className='bill-time-range__value'>{bill.endTime}</Text>
            </View>
          </View>
        </View>

        <View className='bill-signature'>
          <View className='bill-signature__seal'>
            <View className='bill-signature__seal-inner'>
              <Text className='bill-signature__seal-title'>智慧取水</Text>
              <Text className='bill-signature__seal-sub'>电子签章</Text>
              <View className='bill-signature__star'>★</View>
              <Text className='bill-signature__seal-date'>
                {bill.signatureTime.split(' ')[0]}
              </Text>
            </View>
          </View>
          <View className='bill-signature__info'>
            <View className='bill-signature__row'>
              <Text className='bill-signature__label'>签章时间</Text>
              <Text className='bill-signature__value'>{bill.signatureTime}</Text>
            </View>
            <View className='bill-signature__row'>
              <Text className='bill-signature__label'>电子签名</Text>
              <Text className='bill-signature__value bill-signature__value--mono'>
                SHA256:8a3f...e72d
              </Text>
            </View>
          </View>
        </View>

        <View className='bill-footer'>
          <View className='bill-footer__qr' />
          <View className='bill-footer__text'>
            <Text className='bill-footer__title'>本单据由系统自动生成</Text>
            <Text className='bill-footer__desc'>
              扫描二维码或登录小程序验证真伪
            </Text>
          </View>
        </View>

        <View className='bill-cutting-line'>
          {[...Array(20)].map((_, i) => (
            <View key={i} className='bill-cutting-line__dash' />
          ))}
        </View>

        <View className='bill-thanks'>
          <Text className='bill-thanks__text'>感谢您的使用，祝您生活愉快！</Text>
          <Text className='bill-thanks__water'>💧 健康饮水，智慧生活 💧</Text>
        </View>
      </View>

      <View className='bill-detail-actions'>
        <Button
          className='btn-outline bill-detail-actions__btn'
          onClick={handleShareBill}
        >
          分享账单
        </Button>
        <Button
          className={`btn-primary bill-detail-actions__btn ${isGenerating ? 'btn-disabled' : ''}`}
          onClick={handleSaveImage}
          disabled={isGenerating}
        >
          {isGenerating ? '生成中...' : '保存图片'}
        </Button>
      </View>

      <View className='bill-detail__bottom-space' />
    </ScrollView>
  )
}
