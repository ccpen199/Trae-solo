import { View, Text, Switch, Button, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { useAppStore } from '../../store'
import DeviceCard from '../../components/DeviceCard'
import { formatMoneyWithSymbol } from '../../utils/format'
import './profile.scss'

const mockBoundDevices = [
  {
    id: 'dev-001',
    name: '1号楼A区直饮机',
    mac: 'A4:CF:12:34:56:78',
    location: '1号宿舍楼1层大厅',
    status: 'online' as const,
    type: 'normal'
  },
  {
    id: 'dev-003',
    name: '教学楼主楼饮水机',
    mac: 'C6:EE:11:22:33:44',
    location: '教学楼1层大厅',
    status: 'online' as const,
    type: 'hot'
  }
]

export default function Profile() {
  const { userInfo, myDevices, fetchUserInfo } = useAppStore()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningAmount, setWarningAmount] = useState<string>('5')
  const [warningEnabled, setWarningEnabled] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackContent, setFeedbackContent] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useDidShow(() => {
    fetchUserInfo()
  })

  const nickname = userInfo?.nickname || '张同学'
  const avatar = userInfo?.avatar || 'https://img.icons8.com/color/96/user-male-circle--v1.png'
  const studentId = userInfo?.studentId || '2023010001'
  const phone = userInfo?.phone || '138****8888'
  const balance = userInfo?.balance ?? 128.50
  const boundDevices = myDevices.length > 0 ? myDevices : mockBoundDevices

  const handleRecharge = () => {
    Taro.navigateTo({ url: '/pages/recharge/recharge' })
  }

  const handleViewBills = () => {
    Taro.switchTab({ url: '/pages/bills/bills' })
  }

  const handleEditProfile = () => {
    Taro.showToast({ title: '编辑个人信息', icon: 'none' })
  }

  const handleWarningToggle = (value: boolean) => {
    setWarningEnabled(value)
    if (value) {
      setShowWarningModal(true)
    }
  }

  const handleWarningAmountClick = () => {
    setWarningAmount(String(userInfo?.balanceWarning || 5))
    setShowWarningModal(true)
  }

  const handleSaveWarning = () => {
    const amount = parseFloat(warningAmount) || 5
    Taro.showToast({ title: `预警金额已设为¥${amount}`, icon: 'success' })
    setShowWarningModal(false)
  }

  const handleUnbindDevice = (deviceId: string) => {
    Taro.showModal({
      title: '确认解绑',
      content: '确定要解绑该设备吗？解绑后需重新绑定才能使用',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '设备已解绑', icon: 'success' })
        }
      }
    })
  }

  const handleBindDevice = () => {
    Taro.showActionSheet({
      itemList: ['扫码绑定', '搜索附近设备', '输入设备编号绑定'],
      success: (res) => {
        const actions = [
          () => Taro.navigateTo({ url: '/pages/scan/scan' }),
          () => Taro.showToast({ title: '搜索附近设备中...', icon: 'none' }),
          () => Taro.showToast({ title: '输入设备编号', icon: 'none' })
        ]
        actions[res.tapIndex]?.()
      }
    })
  }

  const handleFeedbackClick = () => {
    setShowFeedback(true)
  }

  const handleSubmitFeedback = () => {
    if (!feedbackContent.trim()) {
      Taro.showToast({ title: '请输入反馈内容', icon: 'none' })
      return
    }
    Taro.showToast({ title: '反馈已提交，感谢您的建议', icon: 'success' })
    setShowFeedback(false)
    setFeedbackContent('')
  }

  const handleSettings = () => {
    Taro.showToast({ title: '设置页面开发中', icon: 'none' })
  }

  const handleAbout = () => {
    Taro.showModal({
      title: '关于智慧取水',
      content: '版本：v1.0.0\n智慧取水学生端小程序\n让饮水更智能、更便捷',
      showCancel: false,
      confirmText: '知道了'
    })
  }

  const handleClearCache = () => {
    Taro.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？此操作不会影响您的账户信息',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorageSync()
          Taro.showToast({ title: '缓存已清除', icon: 'success' })
        }
      }
    })
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    Taro.removeStorageSync('token')
    setShowLogoutConfirm(false)
    Taro.showToast({ title: '已退出登录', icon: 'success' })
  }

  return (
    <View className='profile-page'>
      <View className='profile-header'>
        <View className='profile-header__bg' />
        <View className='profile-header__bg-circle' />
        <View className='profile-header__content'>
          <View className='profile-header__user'>
            <Image className='profile-header__avatar' src={avatar} mode='aspectFill' />
            <View className='profile-header__info'>
              <Text className='profile-header__nickname'>{nickname}</Text>
              <View className='profile-header__meta'>
                <Text className='profile-header__student-id'>学号：{studentId}</Text>
                <Text className='profile-header__phone'>{phone}</Text>
              </View>
            </View>
            <View className='profile-header__edit' onClick={handleEditProfile}>
              <Text className='profile-header__edit-icon'>✏️</Text>
            </View>
          </View>

          <View className='profile-header__balance'>
            <View className='profile-header__balance-card'>
              <View className='profile-header__balance-main'>
                <View>
                  <Text className='profile-header__balance-label'>账户余额</Text>
                  <View className='profile-header__balance-amount'>
                    <Text className='profile-header__balance-symbol'>¥</Text>
                    <Text className='profile-header__balance-value'>
                      {formatMoneyWithSymbol(balance).slice(1)}
                    </Text>
                  </View>
                </View>
                <Button
                  className='profile-header__recharge-btn'
                  onClick={handleRecharge}
                >
                  充值
                </Button>
              </View>
              <View className='profile-header__balance-footer'>
                <View className='profile-header__quick-action' onClick={handleViewBills}>
                  <Text className='profile-header__quick-icon'>📄</Text>
                  <Text className='profile-header__quick-text'>账单明细</Text>
                </View>
                <View className='profile-header__quick-divider' />
                <View className='profile-header__quick-action' onClick={handleRecharge}>
                  <Text className='profile-header__quick-icon'>💳</Text>
                  <Text className='profile-header__quick-text'>充值记录</Text>
                </View>
                <View className='profile-header__quick-divider' />
                <View className='profile-header__quick-action'>
                  <Text className='profile-header__quick-icon'>📊</Text>
                  <Text className='profile-header__quick-text'>统计分析</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className='profile-content'>
        <View className='profile-section'>
          <View className='profile-section__header'>
            <Text className='profile-section__title'>余额预警设置</Text>
            <Switch
              checked={warningEnabled}
              onChange={(e) => handleWarningToggle(e.detail.value)}
              color='#1890ff'
            />
          </View>
          {warningEnabled && (
            <View className='warning-setting' onClick={handleWarningAmountClick}>
              <Text className='warning-setting__label'>当余额低于</Text>
              <View className='warning-setting__amount'>
                <Text className='warning-setting__amount-value'>¥{warningAmount}</Text>
                <Text className='warning-setting__arrow'>›</Text>
              </View>
            </View>
          )}
        </View>

        <View className='profile-section'>
          <View className='profile-section__header'>
            <Text className='profile-section__title'>已绑定设备</Text>
            <View className='profile-section__extra'>
              <Text className='profile-section__count'>{boundDevices.length}</Text>
              <View className='profile-section__add' onClick={handleBindDevice}>
                <Text className='profile-section__add-icon'>+</Text>
                <Text className='profile-section__add-text'>绑定</Text>
              </View>
            </View>
          </View>

          {boundDevices.length === 0 ? (
            <View className='profile-empty'>
              <Text className='profile-empty__icon'>📱</Text>
              <Text className='profile-empty__text'>暂无绑定设备</Text>
              <Text className='profile-empty__desc'>点击右上角绑定您的常用设备</Text>
            </View>
          ) : (
            <View>
              {boundDevices.map((device) => (
                <View key={device.id} className='profile-device'>
                  <DeviceCard device={device} showBindStatus />
                  <View className='profile-device__actions'>
                    <Button
                      className='profile-device__unbind'
                      onClick={() => handleUnbindDevice(device.id)}
                    >
                      解绑
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className='profile-section'>
          <Text className='profile-section__title'>通用设置</Text>
          <View className='menu-list'>
            <View className='menu-item' onClick={handleFeedbackClick}>
              <View className='menu-item__icon menu-item__icon--feedback'>
                <Text>💬</Text>
              </View>
              <Text className='menu-item__label'>意见反馈</Text>
              <Text className='menu-item__arrow'>›</Text>
            </View>
            <View className='menu-item' onClick={handleSettings}>
              <View className='menu-item__icon menu-item__icon--settings'>
                <Text>⚙️</Text>
              </View>
              <Text className='menu-item__label'>应用设置</Text>
              <Text className='menu-item__arrow'>›</Text>
            </View>
            <View className='menu-item' onClick={handleClearCache}>
              <View className='menu-item__icon menu-item__icon--cache'>
                <Text>🗑️</Text>
              </View>
              <Text className='menu-item__label'>清除缓存</Text>
              <View className='menu-item__value'>
                <Text className='menu-item__cache-size'>2.3MB</Text>
                <Text className='menu-item__arrow'>›</Text>
              </View>
            </View>
            <View className='menu-item' onClick={handleAbout}>
              <View className='menu-item__icon menu-item__icon--about'>
                <Text>ℹ️</Text>
              </View>
              <Text className='menu-item__label'>关于我们</Text>
              <View className='menu-item__value'>
                <Text className='menu-item__version'>v1.0.0</Text>
                <Text className='menu-item__arrow'>›</Text>
              </View>
            </View>
          </View>
        </View>

        <View className='profile-section'>
          <Button className='profile-logout-btn' onClick={handleLogout}>
            退出登录
          </Button>
        </View>

        <View className='profile-footer'>
          <Text className='profile-footer__text'>智慧取水 v1.0.0</Text>
          <Text className='profile-footer__text'>让饮水更智能、更健康</Text>
        </View>
      </View>

      {showWarningModal && (
        <View className='modal-overlay' onClick={() => setShowWarningModal(false)}>
          <View className='modal-content warning-modal' onClick={(e) => e.stopPropagation()}>
            <Text className='warning-modal__title'>设置余额预警</Text>
            <Text className='warning-modal__desc'>当账户余额低于该值时，将在首页显示预警提示</Text>
            <View className='warning-modal__input-wrap'>
              <Text className='warning-modal__input-symbol'>¥</Text>
              <Input
                className='warning-modal__input'
                type='digit'
                value={warningAmount}
                onInput={(e) => setWarningAmount(e.detail.value)}
                placeholder='请输入预警金额'
              />
            </View>
            <View className='warning-modal__quick-options'>
              {[5, 10, 20, 50].map((amount) => (
                <View
                  key={amount}
                  className={`warning-modal__quick-option ${
                    parseFloat(warningAmount) === amount ? 'is-active' : ''
                  }`}
                  onClick={() => setWarningAmount(String(amount))}
                >
                  ¥{amount}
                </View>
              ))}
            </View>
            <View className='warning-modal__actions'>
              <Button
                className='btn-outline warning-modal__btn warning-modal__btn-outline'
                onClick={() => setShowWarningModal(false)}
              >
                取消
              </Button>
              <Button
                className='btn-primary warning-modal__btn warning-modal__btn-primary'
                onClick={handleSaveWarning}
              >
                确定
              </Button>
            </View>
          </View>
        </View>
      )}

      {showFeedback && (
        <View className='modal-overlay' onClick={() => setShowFeedback(false)}>
          <View className='modal-content feedback-modal' onClick={(e) => e.stopPropagation()}>
            <Text className='feedback-modal__title'>意见反馈</Text>
            <Text className='feedback-modal__desc'>您的建议是我们前进的动力</Text>
            <Textarea
              className='feedback-modal__textarea'
              placeholder='请输入您遇到的问题或宝贵建议...'
              value={feedbackContent}
              onInput={(e) => setFeedbackContent(e.detail.value)}
              maxlength={500}
            />
            <Text className='feedback-modal__count'>{feedbackContent.length}/500</Text>
            <View className='feedback-modal__actions'>
              <Button
                className='btn-outline feedback-modal__btn feedback-modal__btn-outline'
                onClick={() => setShowFeedback(false)}
              >
                取消
              </Button>
              <Button
                className={`btn-primary feedback-modal__btn feedback-modal__btn-primary ${
                  !feedbackContent.trim() ? 'btn-disabled' : ''
                }`}
                onClick={handleSubmitFeedback}
                disabled={!feedbackContent.trim()}
              >
                提交
              </Button>
            </View>
          </View>
        </View>
      )}

      {showLogoutConfirm && (
        <View className='modal-overlay' onClick={() => setShowLogoutConfirm(false)}>
          <View className='modal-content logout-modal' onClick={(e) => e.stopPropagation()}>
            <View className='logout-modal__icon'>🚪</View>
            <Text className='logout-modal__title'>确认退出登录？</Text>
            <Text className='logout-modal__desc'>退出后需要重新登录才能使用取水功能</Text>
            <View className='logout-modal__actions'>
              <Button
                className='btn-outline logout-modal__btn logout-modal__btn-outline'
                onClick={() => setShowLogoutConfirm(false)}
              >
                取消
              </Button>
              <Button
                className='btn-danger logout-modal__btn logout-modal__btn-danger'
                onClick={confirmLogout}
              >
                确认退出
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
