import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { userService } from '@/services/userService';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { userInfo, devices, bioAuthEnabled, updateBioAuth, logout, loadFromStorage } = useUserStore();
  const deviceInfo = devices[0];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const stats = {
    approval: 128,
    message: 256,
    document: 64,
    login: 30
  };

  const loadData = useCallback(async () => {
    try {
      loadFromStorage();
    } catch (error) {
      console.error('加载个人数据失败', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, [loadFromStorage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData();
  });

  const handleBioAuthToggle = async () => {
    if (!bioAuthEnabled) {
      Taro.showModal({
        title: '开启生物识别',
        content: '开启后可使用指纹或面容进行敏感操作二次验证',
        success: async (res) => {
          if (res.confirm) {
            try {
              await userService.updateBioAuth(true);
              updateBioAuth(true);
              Taro.showToast({ title: '已开启生物识别', icon: 'success' });
            } catch (error) {
              Taro.showToast({ title: '开启失败', icon: 'error' });
            }
          }
        }
      });
    } else {
      try {
        await userService.updateBioAuth(false);
        updateBioAuth(false);
        Taro.showToast({ title: '已关闭生物识别', icon: 'success' });
      } catch (error) {
        Taro.showToast({ title: '关闭失败', icon: 'error' });
      }
    }
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.reLaunch({ url: '/pages/login/index' });
        }
      }
    });
  };

  const menuGroups = [
    {
      title: '常用功能',
      items: [
        { icon: '📋', title: '我的审批', subtitle: '查看我发起和审批的流程', color: 'primary', badge: 5, path: '/pages/message/index' },
        { icon: '📁', title: '我的文档', subtitle: '64份文档', color: 'green', path: '/pages/document-detail/index' },
        { icon: '⭐', title: '我的收藏', subtitle: '收藏的应用和文档', color: 'orange' },
        { icon: '📊', title: '数据报表', subtitle: '个人工作数据统计', color: 'purple' }
      ]
    },
    {
      title: '安全设置',
      items: [
        { icon: '🔐', title: '生物识别', subtitle: '指纹/面容二次验证', color: 'red', switch: true, value: bioAuthEnabled, action: handleBioAuthToggle },
        { icon: '🛡️', title: '安全中心', subtitle: '账号安全、登录记录', color: 'cyan', path: '/pages/security/index' },
        { icon: '📱', title: '设备管理', subtitle: '已登录设备管理', color: 'gray' },
        { icon: '🔑', title: '修改密码', subtitle: '定期修改密码更安全', color: 'orange' }
      ]
    },
    {
      title: '系统设置',
      items: [
        { icon: '⚙️', title: '通用设置', subtitle: '消息通知、语言等', color: 'gray' },
        { icon: '📦', title: '离线包管理', subtitle: '管理离线应用缓存', color: 'green', path: '/pages/offline/index' },
        { icon: 'ℹ️', title: '关于我们', subtitle: '版本 v2.1.0', color: 'cyan' },
        { icon: '💬', title: '意见反馈', subtitle: '帮助我们做得更好', color: 'purple' }
      ]
    }
  ];

  const handleMenuClick = (item: any) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      Taro.navigateTo({ url: item.path });
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  return (
    <ScrollView
      className={styles.page}
      scrollY
      enhanced
      showScrollbar={false}
    >
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            {userInfo?.avatar ? (
              <Image src={userInfo.avatar} mode="aspectFill" />
            ) : (
              <Text className={styles.avatarText}>{userInfo?.name?.charAt(0) || '用'}</Text>
            )}
          </View>
          <View className={styles.userDetail}>
            <Text className={styles.userName}>
              {userInfo?.name || '用户'}
              <Text className={styles.verified}>✅</Text>
            </Text>
            <Text className={styles.userDept}>{userInfo?.departmentName || '省公司信息中心'}</Text>
            <Text className={styles.userPosition}>{userInfo?.position || '信息中心主任'}</Text>
          </View>
        </View>

        <View className={styles.userStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.approval}</Text>
            <Text className={styles.statLabel}>审批</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.message}</Text>
            <Text className={styles.statLabel}>消息</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.document}</Text>
            <Text className={styles.statLabel}>文档</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.login}</Text>
            <Text className={styles.statLabel}>连续登录</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.securityBanner}>
          <Text className={styles.icon}>🔔</Text>
          <View className={styles.content}>
            <Text className={styles.title}>检测到新设备登录</Text>
            <Text className={styles.desc}>iPhone 14 Pro · 北京市 · 2小时前</Text>
          </View>
          <View
            className={styles.btn}
            onClick={() => Taro.navigateTo({ url: '/pages/security/index' })}
          >
            查看
          </View>
        </View>

        {menuGroups.map((group, groupIndex) => (
          <View key={groupIndex} className={styles.section}>
            <Text className={styles.sectionTitle}>{group.title}</Text>
            <View className={styles.menuList}>
              {group.items.map((item, itemIndex) => (
                <View
                  key={itemIndex}
                  className={styles.menuItem}
                  onClick={() => handleMenuClick(item)}
                >
                  <View className={`${styles.menuIcon} ${styles[item.color]}`}>
                    <Text>{item.icon}</Text>
                  </View>
                  <View className={styles.menuContent}>
                    <Text className={styles.menuTitle}>{item.title}</Text>
                    <Text className={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View className={styles.menuExtra}>
                    {item.badge && item.badge > 0 && (
                      <View className={styles.menuBadge}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </View>
                    )}
                    {item.switch ? (
                      <View className={styles.switchContainer}>
                        <View
                          className={classnames(styles.switch, item.value && styles.active)}
                          onClick={(e) => { e.stopPropagation(); item.action?.(); }}
                        />
                      </View>
                    ) : (
                      <Text className={styles.menuArrow}>›</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {deviceInfo && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>当前设备</Text>
            <View className={styles.deviceInfo}>
              <Text className={styles.deviceTitle}>{deviceInfo.deviceName}</Text>
              <View className={styles.deviceItem}>
                <Text className={styles.deviceLabel}>设备型号</Text>
                <Text className={styles.deviceValue}>{deviceInfo.model}</Text>
              </View>
              <View className={styles.deviceItem}>
                <Text className={styles.deviceLabel}>操作系统</Text>
                <Text className={styles.deviceValue}>{deviceInfo.system} {deviceInfo.systemVersion}</Text>
              </View>
              <View className={styles.deviceItem}>
                <Text className={styles.deviceLabel}>设备ID</Text>
                <Text className={styles.deviceValue}>{deviceInfo.deviceId.slice(0, 8)}...</Text>
              </View>
              <View className={styles.deviceItem}>
                <Text className={styles.deviceLabel}>IP地址</Text>
                <Text className={styles.deviceValue}>{deviceInfo.ipAddress}</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.logoutBtn} onClick={handleLogout}>
          退出登录
        </View>

        <View className={styles.copyright}>
          © 2024 移动办公中台 v2.1.0 · 技术支持：信息中心
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
