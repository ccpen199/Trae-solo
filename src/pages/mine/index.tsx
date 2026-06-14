import React, { useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import { useUserStore } from '@/store/useUserStore';
import { roleNames } from '@/utils/auth';
import { mockNotifications, mockKpiList, mockAlerts } from '@/data/mockKpi';
import { mockOrders } from '@/data/mockOrders';
import { mockTickets } from '@/data/mockTickets';

const MinePage: React.FC = () => {
  const { user } = useUserStore();
  const role = user?.role || 'resident';
  const currentProperty = user?.properties.find((p) => p.id === user?.currentPropertyId);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  const pendingAlerts = mockAlerts.filter((a) => !a.resolved).length;

  const stats = useMemo(() => {
    if (role === 'property' || role === 'committee') {
      return [
        { num: mockTickets.length, label: '总工单' },
        { num: mockTickets.filter((t) => t.status === 'processing').length, label: '处理中' },
        { num: mockKpiList[0].completionRate + '%', label: '完结率' },
        { num: mockKpiList[0].satisfaction, label: '满意度' },
      ];
    }
    const mineOrders = mockOrders.filter((o) => o.buyerId === 'U001');
    const mineTickets = mockTickets.filter((t) => t.submitterId === 'U001');
    return [
      { num: mineOrders.length, label: '订单' },
      { num: mineOrders.filter((o) => ['pending', 'paid', 'confirmed', 'servicing'].includes(o.status)).length, label: '进行中' },
      { num: mineTickets.length, label: '工单' },
      { num: mockTickets.filter((t) => t.submitterId === 'U001' && t.status === 'completed' && !t.satisfaction).length, label: '待评价' },
    ];
  }, [role]);

  const goto = (url: string, tabbar = false) => {
    if (tabbar) Taro.switchTab({ url });
    else Taro.navigateTo({ url });
  };

  const residentMenus = [
    { group: '我的资产', items: [
      { icon: '🏠', label: '房产管理', extra: currentProperty?.address.slice(6) || '未绑定', url: '/pages/property/index' },
      { icon: '👥', label: '住户成员', extra: `${currentProperty?.members.length || 0}人`, url: '/pages/property/index' },
      { icon: '🔐', label: '门禁授权', extra: `${user?.properties.length || 0}处房产`, url: '/pages/access/index' },
    ]},
    { group: '我的服务', items: [
      { icon: '📦', label: '我的订单', extra: `${mockOrders.filter(o => o.buyerId === 'U001').length}笔`, url: '/pages/orders/index' },
      { icon: '🛒', label: '购物车', extra: '', url: '/pages/cart/index' },
      { icon: '⭐', label: '我的收藏', extra: '', url: '' },
      { icon: '💰', label: '我的钱包', extra: '', url: '' },
    ]},
    { group: '其他', items: [
      { icon: '🔔', label: '消息通知', badge: unreadCount, url: '/pages/notifications/index' },
      { icon: '👤', label: '切换角色', extra: roleNames[role], url: '/pages/role-switch/index' },
      { icon: '❓', label: '帮助中心', extra: '', url: '/pages/help/index' },
      { icon: '⚙️', label: '设置', extra: '', url: '/pages/settings/index' },
    ]},
  ];

  const propertyMenus = [
    { group: '工作台', items: [
      { icon: '📊', label: 'KPI数据看板', extra: '本周', url: '/pages/kpi/index' },
      { icon: '📡', label: '设备监控', badge: pendingAlerts, url: '/pages/devices/index' },
      { icon: '📋', label: '工单管理', extra: `${mockTickets.length}条`, url: '/pages/tickets/index', tabbar: true },
      { icon: '🏢', label: '服务商入驻审核', badge: 1, url: '/pages/provider-apply/index' },
    ]},
    { group: '社区运营', items: [
      { icon: '📣', label: '公告发布', extra: '', url: '' },
      { icon: '📊', label: '分佣结算', extra: '', url: '' },
      { icon: '👥', label: '住户管理', extra: '', url: '' },
    ]},
    { group: '其他', items: [
      { icon: '🔔', label: '告警消息', badge: pendingAlerts, url: '/pages/devices/index' },
      { icon: '👤', label: '切换角色', extra: roleNames[role], url: '/pages/role-switch/index' },
      { icon: '⚙️', label: '设置', extra: '', url: '/pages/settings/index' },
    ]},
  ];

  const committeeMenus = [
    { group: '业委会工作', items: [
      { icon: '📊', label: '物业KPI监督', extra: '本周', url: '/pages/kpi/index' },
      { icon: '📣', label: '公告审核', extra: '', url: '' },
      { icon: '🗳️', label: '业主投票', extra: '', url: '' },
      { icon: '💡', label: '建议汇总', extra: '', url: '/pages/tickets/index', tabbar: true },
    ]},
    { group: '其他', items: [
      { icon: '🔔', label: '消息中心', badge: unreadCount, url: '/pages/notifications/index' },
      { icon: '👤', label: '切换角色', extra: roleNames[role], url: '/pages/role-switch/index' },
      { icon: '⚙️', label: '设置', extra: '', url: '/pages/settings/index' },
    ]},
  ];

  const menus = role === 'property' ? propertyMenus : role === 'committee' ? committeeMenus : residentMenus;
  const kpi = mockKpiList[0];

  return (
    <PageContainer>
      <View className={styles.profileHeader}>
        <View className={styles.row} onClick={() => goto('/pages/role-switch/index')}>
          <Image className={styles.avatar} src={user?.avatar || 'https://picsum.photos/id/64/200/200'} mode="aspectFill" />
          <View className={styles.info}>
            <View className={styles.name}>
              <Text>{user?.name || '业主用户'}</Text>
            </View>
            <Text className={styles.phone}>{user?.phone || '未绑定手机'}</Text>
            <View className={styles.roleBadge}>
              <View className={styles.dot} />
              <Text>{roleNames[role]}身份 · {currentProperty?.building || '阳光花园'}</Text>
            </View>
          </View>
          <Text className={styles.arrow}>›</Text>
        </View>

        <View className={styles.stats}>
          {stats.map((s, i) => (
            <View key={i} className={styles.item}>
              <Text className={styles.num}>{s.num}</Text>
              <Text className={styles.label}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {(role === 'property' || role === 'committee') && (
        <View className={styles.kpiCard} onClick={() => goto('/pages/kpi/index')}>
          <View className={styles.head}>
            <View className={styles.title}>
              <Text>📈</Text>
              <Text>物业运营看板</Text>
            </View>
            <View className={styles.period}><Text>{kpi.period}</Text></View>
          </View>
          <View className={styles.metrics}>
            <View className={styles.metric}>
              <Text className={styles.label}>平均响应时长</Text>
              <View className={styles.value}>
                <Text className={styles.num}>{kpi.avgResponseMinutes}</Text>
                <Text className={styles.unit}>分钟</Text>
              </View>
              <View className={styles.bar}><View className={styles.fill} style={{ width: '72%' }} /></View>
            </View>
            <View className={styles.metric}>
              <Text className={styles.label}>工单完结率</Text>
              <View className={styles.value}>
                <Text className={styles.num}>{kpi.completionRate}</Text>
                <Text className={styles.unit}>%</Text>
              </View>
              <View className={styles.bar}><View className={styles.fill} style={{ width: kpi.completionRate + '%' }} /></View>
            </View>
            <View className={styles.metric}>
              <Text className={styles.label}>业主满意度</Text>
              <View className={styles.value}>
                <Text className={styles.num}>{kpi.satisfaction}</Text>
                <Text className={styles.unit}>分/5</Text>
              </View>
              <View className={styles.bar}><View className={styles.fill} style={{ width: (kpi.satisfaction * 20) + '%' }} /></View>
            </View>
            <View className={styles.metric}>
              <Text className={styles.label}>按期办结率</Text>
              <View className={styles.value}>
                <Text className={styles.num}>{kpi.onTimeRate}</Text>
                <Text className={styles.unit}>%</Text>
              </View>
              <View className={styles.bar}><View className={styles.fill} style={{ width: kpi.onTimeRate + '%' }} /></View>
            </View>
          </View>
        </View>
      )}

      {menus.map((group, gi) => (
        <View key={gi} className={styles.menuList}>
          <Text className={styles.groupTitle}>{group.group}</Text>
          {group.items.map((it, ii) => (
            <View
              key={ii}
              className={styles.item}
              onClick={() => {
                if (!it.url) Taro.showToast({ title: '功能开发中', icon: 'none' });
                else goto(it.url, (it as any).tabbar);
              }}
            >
              <View className={styles.iconBox}><Text>{it.icon}</Text></View>
              <Text className={styles.label}>{it.label}</Text>
              {it.badge && <View className={styles.badge}><Text>{it.badge}</Text></View>}
              {it.extra && <Text className={styles.extra}>{it.extra}</Text>}
              <Text className={styles.arrow}>›</Text>
            </View>
          ))}
        </View>
      ))}
    </PageContainer>
  );
};

export default MinePage;
