import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/useUserStore';
import { userService } from '@/services/userService';
import { generateSM4Key } from '@/utils/sm4';
import styles from './index.module.scss';

interface SecuritySetting {
  id: string;
  icon: string;
  iconClass: string;
  name: string;
  desc: string;
  enabled: boolean;
  hasSwitch: boolean;
  badge?: {
    text: string;
    type: 'active' | 'inactive' | 'sm4';
  };
}

interface SecurityLog {
  id: string;
  icon: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  desc: string;
  time: string;
  ip: string;
  status: 'success' | 'blocked' | 'warning';
  statusText: string;
}

const SecurityPage: React.FC = () => {
  const { userInfo, devices, updateBioAuth } = useUserStore();
  const deviceInfo = devices[0];
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [securityScore, setSecurityScore] = useState(92);
  const [securityLevel, setSecurityLevel] = useState('优秀');
  const [currentSm4Key, setCurrentSm4Key] = useState<string>('');
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  const [settings, setSettings] = useState<SecuritySetting[]>([
    {
      id: 'bioAuth',
      icon: '👆',
      iconClass: 'bio',
      name: '生物识别登录',
      desc: '使用指纹/面部识别快速登录',
      enabled: true,
      hasSwitch: true,
      badge: { text: '已启用', type: 'active' }
    },
    {
      id: 'sensitiveBio',
      icon: '🔐',
      iconClass: 'bio',
      name: '敏感操作二次验证',
      desc: '支付、审批等敏感操作需生物识别',
      enabled: true,
      hasSwitch: true,
      badge: { text: '已启用', type: 'active' }
    },
    {
      id: 'sm4Encrypt',
      icon: '🔒',
      iconClass: 'encrypt',
      name: '国密SM4加密',
      desc: '全链路数据传输加密',
      enabled: true,
      hasSwitch: false,
      badge: { text: 'SM4-ECB', type: 'sm4' }
    },
    {
      id: 'deviceLock',
      icon: '📱',
      iconClass: 'device',
      name: '设备绑定',
      desc: '仅信任设备可登录账号',
      enabled: true,
      hasSwitch: true,
      badge: { text: '已绑定', type: 'active' }
    },
    {
      id: 'ssoAutoLogin',
      icon: '🔑',
      iconClass: 'sso',
      name: '单点登录SSO',
      desc: '一次登录，多系统通行',
      enabled: true,
      hasSwitch: true,
      badge: { text: '已启用', type: 'active' }
    },
    {
      id: 'sandbox',
      icon: '🛡️',
      iconClass: 'sandbox',
      name: '安全沙箱',
      desc: 'H5应用运行隔离环境',
      enabled: true,
      hasSwitch: true,
      badge: { text: '已启用', type: 'active' }
    },
    {
      id: 'autoLock',
      icon: '⏰',
      iconClass: 'lock',
      name: '自动锁定',
      desc: '5分钟无操作自动锁定应用',
      enabled: true,
      hasSwitch: true
    },
    {
      id: 'loginMonitor',
      icon: '👁️',
      iconClass: 'monitor',
      name: '登录监控',
      desc: '异常登录行为实时告警',
      enabled: true,
      hasSwitch: true,
      badge: { text: '已启用', type: 'active' }
    }
  ]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const newKey = generateSM4Key();
      setCurrentSm4Key(newKey.substring(0, 8) + '...');

      const mockLogs: SecurityLog[] = [
        {
          id: '1',
          icon: '✅',
          type: 'success',
          title: '生物识别登录成功',
          desc: '使用指纹识别登录系统',
          time: dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
          ip: '10.0.0.123',
          status: 'success',
          statusText: '成功'
        },
        {
          id: '2',
          icon: '⚠️',
          type: 'warning',
          title: '异常登录尝试',
          desc: '检测到陌生设备尝试登录，已拦截',
          time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          ip: '219.150.xxx.xxx',
          status: 'blocked',
          statusText: '已拦截'
        },
        {
          id: '3',
          icon: '🔐',
          type: 'info',
          title: '审批操作二次验证',
          desc: '审批"采购申请-2024001"完成生物识别验证',
          time: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          ip: '10.0.0.123',
          status: 'success',
          statusText: '验证通过'
        },
        {
          id: '4',
          icon: '🔑',
          type: 'success',
          title: 'SSO单点登录',
          desc: '通过SSO令牌访问ERP系统',
          time: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          ip: '10.0.0.123',
          status: 'success',
          statusText: '成功'
        },
        {
          id: '5',
          icon: '❌',
          type: 'error',
          title: '密码验证失败',
          desc: '连续5次密码输入错误，账号临时锁定',
          time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          ip: '10.0.0.145',
          status: 'blocked',
          statusText: '已锁定'
        },
        {
          id: '6',
          icon: '🔄',
          type: 'info',
          title: 'SM4密钥轮换',
          desc: '系统自动完成通信密钥轮换',
          time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          ip: '系统',
          status: 'success',
          statusText: '完成'
        }
      ];
      setSecurityLogs(mockLogs);

      const enabledCount = settings.filter(s => s.enabled).length;
      const score = Math.min(100, Math.round((enabledCount / settings.length) * 100));
      setSecurityScore(score);
      setSecurityLevel(score >= 90 ? '优秀' : score >= 70 ? '良好' : score >= 60 ? '一般' : '较差');

    } catch (error) {
      console.error('加载安全数据失败', error);
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, [settings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData();
  });

  const handleSwitchToggle = async (setting: SecuritySetting) => {
    if (!setting.hasSwitch) return;

    if (setting.id === 'bioAuth' || setting.id === 'sensitiveBio') {
      try {
        Taro.showLoading({ title: '验证中...' });
        const result = await Taro.checkIsSupportSoterAuthentication();
        console.log('支持的生物识别:', result);
        
        const authResult = await Taro.startSoterAuthentication({
          requestAuthModes: ['fingerPrint', 'facial'],
          challenge: JSON.stringify({
            userId: userInfo?.id,
            timestamp: Date.now(),
            operation: setting.id === 'bioAuth' ? '开关生物识别登录' : '开关敏感操作验证'
          }),
          authContent: '请验证身份以修改安全设置'
        });
        
        console.log('生物识别结果:', authResult);
        Taro.hideLoading();
      } catch (error) {
        Taro.hideLoading();
        Taro.showToast({ title: '验证失败，请重试', icon: 'error' });
        return;
      }
    }

    try {
      const newValue = !setting.enabled;
      
      if (setting.id === 'bioAuth') {
        await updateBioAuth(newValue);
      }

      if (setting.id === 'sensitiveBio' && !newValue) {
        Taro.showModal({
          title: '安全提示',
          content: '关闭敏感操作二次验证将降低账户安全性，确定要关闭吗？',
          success: async (res) => {
            if (res.confirm) {
              await userService.updateSecuritySetting(setting.id, newValue);
              updateSetting(setting.id, newValue);
            }
          }
        });
        return;
      }

      await userService.updateSecuritySetting(setting.id, newValue);
      updateSetting(setting.id, newValue);
      
      Taro.showToast({ 
        title: `${setting.name}已${newValue ? '开启' : '关闭'}`, 
        icon: 'success' 
      });
    } catch (error) {
      Taro.showToast({ title: '设置失败', icon: 'error' });
    }
  };

  const updateSetting = (id: string, enabled: boolean) => {
    setSettings(prev => prev.map(s => 
      s.id === id 
        ? { ...s, enabled, badge: enabled ? { text: '已启用', type: 'active' as const } : { text: '已关闭', type: 'inactive' as const } }
        : s
    ));

    const enabledCount = settings.filter(s => s.id === id ? enabled : s.enabled).length;
    const score = Math.min(100, Math.round((enabledCount / settings.length) * 100));
    setSecurityScore(score);
    setSecurityLevel(score >= 90 ? '优秀' : score >= 70 ? '良好' : score >= 60 ? '一般' : '较差');
  };

  const handleSettingClick = (setting: SecuritySetting) => {
    if (setting.hasSwitch) {
      handleSwitchToggle(setting);
      return;
    }

    if (setting.id === 'sm4Encrypt') {
      Taro.showModal({
        title: '国密SM4加密',
        content: `加密模式：ECB\n密钥长度：128位\n算法标准：GM/T 0007-2012\n当前密钥：${currentSm4Key}\n\n所有网络请求和本地存储敏感数据均使用SM4算法加密，确保数据传输和存储安全。`,
        showCancel: false,
        confirmText: '知道了'
      });
    } else if (setting.id === 'ssoAutoLogin') {
      Taro.navigateTo({ url: '/pages/admin/index' });
    } else {
      Taro.showToast({ title: `进入${setting.name}设置`, icon: 'none' });
    }
  };

  const handleRotateKey = () => {
    Taro.showModal({
      title: '密钥轮换',
      content: '确定要立即轮换SM4加密密钥吗？轮换后所有现有连接将重新建立。',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '轮换中...' });
          await new Promise(resolve => setTimeout(resolve, 1500));
          const newKey = generateSM4Key();
          setCurrentSm4Key(newKey.substring(0, 8) + '...');
          Taro.hideLoading();
          Taro.showToast({ title: '密钥轮换成功', icon: 'success' });
        }
      }
    });
  };

  const handleDeviceInfo = () => {
    Taro.showModal({
      title: '设备信息',
      content: `设备名称：${deviceInfo?.deviceName || 'iPhone 15'}\n设备型号：${deviceInfo?.model || 'iPhone15,3'}\n系统版本：${deviceInfo?.systemVersion || 'iOS 17.2'}\n设备ID：${deviceInfo?.deviceId?.substring(0, 16) || '8F7A2B3C-...'}\nIP地址：10.0.0.123\n\n此设备已绑定您的账号，如非本人操作请立即冻结账号。`,
      showCancel: true,
      cancelText: '冻结账号',
      confirmText: '知道了',
      success: (res) => {
        if (res.cancel) {
          Taro.showModal({
            title: '冻结账号',
            content: '确定要冻结此账号吗？冻结后所有设备将被强制下线。',
            success: (res2) => {
              if (res2.confirm) {
                Taro.showToast({ title: '账号已冻结', icon: 'success' });
              }
            }
          });
        }
      }
    });
  };

  const handleLogClick = (log: SecurityLog) => {
    Taro.showModal({
      title: log.title,
      content: `描述：${log.desc}\n时间：${log.time}\nIP：${log.ip}\n状态：${log.statusText}`,
      showCancel: false
    });
  };

  const handlePasswordChange = () => {
    Taro.showActionSheet({
      itemList: ['修改登录密码', '找回密码', '手势密码设置'],
      success: (res) => {
        const tips = ['修改密码', '找回密码', '手势密码'];
        Taro.showToast({ title: tips[res.tapIndex], icon: 'none' });
      }
    });
  };

  const filteredLogs = () => {
    if (activeTab === 'all') return securityLogs;
    return securityLogs.filter(log => log.type === activeTab);
  };

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>加载中...</View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView
        scrollY
        enhanced
        showScrollbar={false}
      >
        <View className={styles.securityScore}>
          <View className={styles.scoreHeader}>
            <View className={styles.scoreTitle}>
              <Text className={styles.scoreIcon}>🛡️</Text>
              <Text>安全评分</Text>
            </View>
            <View className={styles.scoreLevel}>{securityLevel}</View>
          </View>
          
          <View className={styles.scoreValue}>
            <Text className={styles.scoreNumber}>{securityScore}</Text>
            <Text className={styles.scoreLabel}>您的账户安全状态{securityLevel}</Text>
          </View>
          
          <View className={styles.scoreItems}>
            <View className={styles.scoreItem}>
              <Text className={styles.scoreItemValue}>{settings.filter(s => s.enabled).length}</Text>
              <Text className={styles.scoreItemLabel}>已启用</Text>
            </View>
            <View className={styles.scoreItem}>
              <Text className={styles.scoreItemValue}>{settings.length - settings.filter(s => s.enabled).length}</Text>
              <Text className={styles.scoreItemLabel}>待优化</Text>
            </View>
            <View className={styles.scoreItem}>
              <Text className={styles.scoreItemValue}>30</Text>
              <Text className={styles.scoreItemLabel}>安全事件</Text>
            </View>
          </View>
        </View>

        <View className={styles.encryptBanner} onClick={handleRotateKey}>
          <Text className={styles.encryptIcon}>🔐</Text>
          <View className={styles.encryptInfo}>
            <View className={styles.encryptTitle}>
              <Text>国密SM4加密</Text>
              <View className={classnames(styles.settingBadge, styles.sm4)}>SM4-ECB</View>
            </View>
            <Text className={styles.encryptDesc}>全链路数据传输已加密 · 点击立即轮换密钥</Text>
          </View>
          <View className={styles.encryptKey}>
            {currentSm4Key}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>⚙️</Text>
              <Text>安全设置</Text>
            </View>
          </View>
          
          <View className={styles.settingList}>
            {settings.map(setting => (
              <View
                key={setting.id}
                className={styles.settingItem}
                onClick={() => handleSettingClick(setting)}
              >
                <View className={classnames(styles.settingIcon, styles[setting.iconClass])}>
                  <Text>{setting.icon}</Text>
                </View>
                <View className={styles.settingInfo}>
                  <View className={styles.settingName}>
                    <Text>{setting.name}</Text>
                    {setting.badge && (
                      <View className={classnames(styles.settingBadge, styles[setting.badge.type])}>
                        {setting.badge.text}
                      </View>
                    )}
                  </View>
                  <Text className={styles.settingDesc}>{setting.desc}</Text>
                </View>
                <View className={styles.settingAction}>
                  {setting.hasSwitch ? (
                    <View
                      className={classnames(styles.switch, setting.enabled && styles.active)}
                    >
                      <View className={styles.switchHandle} />
                    </View>
                  ) : (
                    <Text className={styles.settingArrow}>›</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📱</Text>
              <Text>当前设备</Text>
            </View>
            <Text className={styles.sectionMore} onClick={handleDeviceInfo}>
              详情 →
            </Text>
          </View>
          
          <View className={styles.deviceInfo}>
            <View className={styles.deviceInfoRow}>
              <Text className={styles.deviceInfoLabel}>设备名称</Text>
              <Text className={styles.deviceInfoValue}>{deviceInfo?.deviceName || 'iPhone 15'}</Text>
            </View>
            <View className={styles.deviceInfoRow}>
              <Text className={styles.deviceInfoLabel}>设备型号</Text>
              <Text className={styles.deviceInfoValue}>{deviceInfo?.model || 'iPhone15,3'}</Text>
            </View>
            <View className={styles.deviceInfoRow}>
              <Text className={styles.deviceInfoLabel}>系统版本</Text>
              <Text className={styles.deviceInfoValue}>{deviceInfo?.systemVersion || 'iOS 17.2'}</Text>
            </View>
            <View className={styles.deviceInfoRow}>
              <Text className={styles.deviceInfoLabel}>绑定状态</Text>
              <Text className={styles.deviceInfoValue} style={{ color: '#10B981' }}>已信任 · 主设备</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📋</Text>
              <Text>安全日志</Text>
            </View>
            <Text
              className={styles.sectionMore}
              onClick={() => Taro.showToast({ title: '查看全部', icon: 'none' })}
            >
              全部 →
            </Text>
          </View>

          <View className={styles.tabs}>
            {[
              { key: 'all', label: '全部' },
              { key: 'success', label: '成功' },
              { key: 'warning', label: '警告' },
              { key: 'error', label: '异常' }
            ].map(tab => (
              <View
                key={tab.key}
                className={classnames(styles.tab, activeTab === tab.key && styles.active)}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </View>
            ))}
          </View>

          <View className={styles.securityLogList}>
            {filteredLogs().map(log => (
              <View
                key={log.id}
                className={styles.securityLogItem}
                onClick={() => handleLogClick(log)}
              >
                <View className={classnames(styles.securityLogIcon, styles[log.type])}>
                  <Text>{log.icon}</Text>
                </View>
                <View className={styles.securityLogContent}>
                  <Text className={styles.securityLogTitle}>{log.title}</Text>
                  <Text className={styles.securityLogDesc}>{log.desc}</Text>
                  <View className={styles.securityLogMeta}>
                    <Text>{dayjs(log.time).format('MM-DD HH:mm')}</Text>
                    <Text>IP: {log.ip}</Text>
                    <View className={classnames(styles.securityLogStatus, styles[log.status])}>
                      {log.statusText}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section} style={{ marginBottom: 40 }}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>🔑</Text>
              <Text>密码与账户</Text>
            </View>
          </View>
          
          <View className={styles.settingList}>
            <View
              className={styles.settingItem}
              onClick={handlePasswordChange}
            >
              <View className={classnames(styles.settingIcon, styles.password)}>
                <Text>🔒</Text>
              </View>
              <View className={styles.settingInfo}>
                <Text className={styles.settingName}>修改登录密码</Text>
                <Text className={styles.settingDesc}>上次修改：30天前</Text>
              </View>
              <Text className={styles.settingArrow}>›</Text>
            </View>
            <View
              className={styles.settingItem}
              onClick={() => Taro.showToast({ title: '手势密码', icon: 'none' })}
            >
              <View className={classnames(styles.settingIcon, styles.lock)}>
                <Text>✋</Text>
              </View>
              <View className={styles.settingInfo}>
                <Text className={styles.settingName}>
                  手势密码
                  <View className={classnames(styles.settingBadge, styles.active)}>已设置</View>
                </Text>
                <Text className={styles.settingDesc}>应用启动时验证</Text>
              </View>
              <Text className={styles.settingArrow}>›</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SecurityPage;
