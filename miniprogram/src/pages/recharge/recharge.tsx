import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAppStore } from '../../store'
import { formatMoneyWithSymbol } from '../../utils/format'
import './recharge.scss'

const rechargeOptions = [
  { amount: 10, bonus: 0, popular: false },
  { amount: 20, bonus: 2, popular: false },
  { amount: 50, bonus: 8, popular: true },
  { amount: 100, bonus: 20, popular: false },
  { amount: 200, bonus: 50, popular: false }
]

type PageStatus = 'select' | 'paying' | 'success' | 'failed'

export default function Recharge() {
  const { userInfo, updateBalance } = useAppStore()

  const [selectedAmount, setSelectedAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [showCustom, setShowCustom] = useState<boolean>(false)
  const [status, setStatus] = useState<PageStatus>('select')
  const [payResult, setPayResult] = useState<{
    amount: number
    bonus: number
    orderId: string
  } | null>(null)

  const currentBalance = userInfo?.balance ?? 0

  const getBonus = (amount: number): number => {
    const option = rechargeOptions.find(o => o.amount === amount)
    return option?.bonus ?? Math.floor(amount * 0.15)
  }

  const finalAmount = showCustom ? parseFloat(customAmount) || 0 : selectedAmount
  const bonus = getBonus(finalAmount)
  const totalReceive = finalAmount + bonus

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount)
    setShowCustom(false)
  }

  const handleCustomClick = () => {
    setShowCustom(true)
  }

  const handleCustomInput = (e: any) => {
    const value = e.detail.value.replace(/[^\d.]/g, '')
    setCustomAmount(value)
  }

  const handleConfirmPay = async () => {
    if (finalAmount <= 0) {
      Taro.showToast({ title: '请选择充值金额', icon: 'none' })
      return
    }

    try {
      setStatus('paying')
      Taro.showLoading({ title: '正在跳转支付...', mask: true })

      await new Promise(resolve => setTimeout(resolve, 1500))
      Taro.hideLoading()

      const mockSuccess = Math.random() > 0.1

      if (mockSuccess) {
        updateBalance(finalAmount + bonus)
        setPayResult({
          amount: finalAmount,
          bonus,
          orderId: 'RC' + Date.now()
        })
        setStatus('success')
        Taro.vibrateShort({ type: 'medium' })
      } else {
        setStatus('failed')
      }
    } catch (error) {
      Taro.hideLoading()
      setStatus('failed')
    }
  }

  const handleRetry = () => {
    setStatus('select')
  }

  const handleBackHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const handleContinueRecharge = () => {
    setStatus('select')
    setPayResult(null)
  }

  return (
    <View className='recharge-page'>
      {status === 'select' && (
        <>
          <View className='recharge-header'>
            <View className='recharge-header__card'>
              <Text className='recharge-header__label'>当前余额</Text>
              <View className='recharge-header__amount'>
                <Text className='recharge-header__symbol'>¥</Text>
                <Text className='recharge-header__value'>
                  {formatMoneyWithSymbol(currentBalance).slice(1)}
                </Text>
              </View>
              <View className='recharge-header__tip'>
                <Text className='recharge-header__tip-icon'>💡</Text>
                <Text className='recharge-header__tip-text'>充值金额越多，赠送比例越高</Text>
              </View>
            </View>
          </View>

          <View className='recharge-content'>
            <View className='recharge-section'>
              <Text className='recharge-section__title'>选择充值金额</Text>
              <View className='recharge-options'>
                {rechargeOptions.map((option) => (
                  <View
                    key={option.amount}
                    className={`recharge-option ${
                      !showCustom && selectedAmount === option.amount ? 'is-active' : ''
                    }`}
                    onClick={() => handleSelectAmount(option.amount)}
                  >
                    {option.popular && (
                      <View className='recharge-option__badge'>推荐</View>
                    )}
                    <Text className='recharge-option__amount'>¥{option.amount}</Text>
                    {option.bonus > 0 && (
                      <Text className='recharge-option__bonus'>赠¥{option.bonus}</Text>
                    )}
                    {!showCustom && selectedAmount === option.amount && (
                      <View className='recharge-option__check'>✓</View>
                    )}
                  </View>
                ))}
                <View
                  className={`recharge-option recharge-option--custom ${
                    showCustom ? 'is-active' : ''
                  }`}
                  onClick={handleCustomClick}
                >
                  <Text className='recharge-option__amount'>自定义</Text>
                  <Text className='recharge-option__bonus'>最高赠30%</Text>
                </View>
              </View>

              {showCustom && (
                <View className='recharge-custom'>
                  <Text className='recharge-custom__label'>输入金额</Text>
                  <View className='recharge-custom__input-wrap'>
                    <Text className='recharge-custom__symbol'>¥</Text>
                    <Input
                      className='recharge-custom__input'
                      type='digit'
                      placeholder='请输入充值金额'
                      value={customAmount}
                      onInput={handleCustomInput}
                      focus={showCustom}
                    />
                  </View>
                  {finalAmount > 0 && (
                    <Text className='recharge-custom__hint'>
                      预计赠送 ¥{bonus}，共到账 {formatMoneyWithSymbol(totalReceive)}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View className='recharge-section'>
              <Text className='recharge-section__title'>充值优惠</Text>
              <View className='recharge-bonuses'>
                <View className='recharge-bonuses__item'>
                  <View className='recharge-bonuses__icon'>🎁</View>
                  <View className='recharge-bonuses__info'>
                    <Text className='recharge-bonuses__title'>新用户首充优惠</Text>
                    <Text className='recharge-bonuses__desc'>首次充值额外赠送10%</Text>
                  </View>
                </View>
                <View className='recharge-bonuses__item'>
                  <View className='recharge-bonuses__icon'>💰</View>
                  <View className='recharge-bonuses__info'>
                    <Text className='recharge-bonuses__title'>阶梯赠送</Text>
                    <Text className='recharge-bonuses__desc'>充值越多，赠送比例越高</Text>
                  </View>
                </View>
                <View className='recharge-bonuses__item'>
                  <View className='recharge-bonuses__icon'>🏆</View>
                  <View className='recharge-bonuses__info'>
                    <Text className='recharge-bonuses__title'>充值排行榜</Text>
                    <Text className='recharge-bonuses__desc'>每月排行赢取额外奖励</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className='recharge-section'>
              <Text className='recharge-section__title'>支付方式</Text>
              <View className='payment-methods'>
                <View className='payment-method payment-method--active'>
                  <View className='payment-method__icon payment-method__icon--alipay'>
                    <Text>支</Text>
                  </View>
                  <View className='payment-method__info'>
                    <Text className='payment-method__name'>支付宝H5支付</Text>
                    <Text className='payment-method__desc'>推荐使用，安全快捷</Text>
                  </View>
                  <View className='payment-method__radio'>✓</View>
                </View>
              </View>
            </View>
          </View>

          <View className='recharge-footer'>
            <View className='recharge-footer__summary'>
              <Text className='recharge-footer__label'>实付金额：</Text>
              <Text className='recharge-footer__amount'>{formatMoneyWithSymbol(finalAmount)}</Text>
              {bonus > 0 && (
                <Text className='recharge-footer__bonus'>
                  赠送{formatMoneyWithSymbol(bonus)}
                </Text>
              )}
            </View>
            <Button
              className={`btn-primary recharge-footer__btn ${
                finalAmount <= 0 ? 'btn-disabled' : ''
              }`}
              onClick={handleConfirmPay}
              disabled={finalAmount <= 0}
            >
              {finalAmount > 0 ? `确认充值 ${formatMoneyWithSymbol(finalAmount)}` : '请选择充值金额'}
            </Button>
          </View>
        </>
      )}

      {status === 'paying' && (
        <View className='paying'>
          <View className='paying__spinner'></View>
          <Text className='paying__title'>正在跳转支付宝...</Text>
          <Text className='paying__desc'>请在支付宝页面完成支付</Text>
          <View className='paying__amount'>
            <Text className='paying__amount-label'>支付金额</Text>
            <Text className='paying__amount-value'>{formatMoneyWithSymbol(finalAmount)}</Text>
          </View>
          <Button className='btn-outline paying__cancel' onClick={handleRetry}>
            支付遇到问题？
          </Button>
        </View>
      )}

      {status === 'success' && payResult && (
        <View className='pay-result pay-result--success'>
          <View className='pay-result__icon'>✓</View>
          <Text className='pay-result__title'>充值成功</Text>
          <Text className='pay-result__subtitle'>
            订单号：{payResult.orderId}
          </Text>

          <View className='pay-result__card'>
            <View className='pay-result__row'>
              <Text className='pay-result__label'>支付金额</Text>
              <Text className='pay-result__value'>{formatMoneyWithSymbol(payResult.amount)}</Text>
            </View>
            <View className='pay-result__row'>
              <Text className='pay-result__label'>赠送金额</Text>
              <Text className='pay-result__value pay-result__value--bonus'>
                +{formatMoneyWithSymbol(payResult.bonus)}
              </Text>
            </View>
            <View className='pay-result__divider' />
            <View className='pay-result__row'>
              <Text className='pay-result__label pay-result__label--bold'>到账金额</Text>
              <Text className='pay-result__value pay-result__value--total'>
                {formatMoneyWithSymbol(payResult.amount + payResult.bonus)}
              </Text>
            </View>
            <View className='pay-result__row'>
              <Text className='pay-result__label'>当前余额</Text>
              <Text className='pay-result__value pay-result__value--balance'>
                {formatMoneyWithSymbol(currentBalance)}
              </Text>
            </View>
          </View>

          <View className='pay-result__actions'>
            <Button className='btn-outline pay-result__btn' onClick={handleContinueRecharge}>
              继续充值
            </Button>
            <Button className='btn-primary pay-result__btn' onClick={handleBackHome}>
              返回首页
            </Button>
          </View>
        </View>
      )}

      {status === 'failed' && (
        <View className='pay-result pay-result--failed'>
          <View className='pay-result__icon pay-result__icon--failed'>✕</View>
          <Text className='pay-result__title pay-result__title--failed'>支付失败</Text>
          <Text className='pay-result__subtitle'>
            可能原因：网络异常、余额不足、订单超时等
          </Text>

          <View className='pay-result__tips'>
            <View className='pay-result__tip-item'>
              <Text className='pay-result__tip-icon'>1</Text>
              <Text className='pay-result__tip-text'>检查支付宝账户余额是否充足</Text>
            </View>
            <View className='pay-result__tip-item'>
              <Text className='pay-result__tip-icon'>2</Text>
              <Text className='pay-result__tip-text'>确认网络连接是否正常</Text>
            </View>
            <View className='pay-result__tip-item'>
              <Text className='pay-result__tip-icon'>3</Text>
              <Text className='pay-result__tip-text'>重新发起支付或更换支付方式</Text>
            </View>
          </View>

          <View className='pay-result__actions'>
            <Button className='btn-outline pay-result__btn' onClick={handleBackHome}>
              返回首页
            </Button>
            <Button className='btn-primary pay-result__btn' onClick={handleRetry}>
              重新支付
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
