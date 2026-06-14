import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import classnames from 'classnames';
import { mockOrders, statusColorMap } from '@/data/mockOrders';
import type { Order, OrderStatus } from '@/types';
import { useUserStore } from '@/store/useUserStore';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '待确认' },
  { key: 'servicing', label: '服务中' },
  { key: 'confirmed', label: '待评价' },
  { key: 'completed', label: '已完成' },
];

const OrdersPage: React.FC = () => {
  const { user } = useUserStore();
  const [tab, setTab] = useState('all');

  const myOrders = mockOrders.filter(o => o.buyerId === (user?.id || 'U001'));

  const list = useMemo(() => {
    if (!myOrders.length) return [];
    if (tab === 'all') return myOrders;
    return myOrders.filter(o => o.status === tab);
  }, [tab, myOrders]);

  const getActions = (order: Order): Array<{ key: string; label: string; type: string }> => {
    switch (order.status) {
      case 'pending': return [
        { key: 'cancel', label: '取消订单', type: 'outline' },
        { key: 'pay', label: '立即付款', type: 'primary' },
      ];
      case 'paid': return [
        { key: 'cancel', label: '取消订单', type: 'outline' },
        { key: 'confirm', label: '确认订单', type: 'normal' },
      ];
      case 'confirmed': return [
        { key: 'rate', label: '评价订单', type: 'normal' },
      ];
      case 'servicing': return [
        { key: 'contact', label: '联系商家', type: 'outline' },
        { key: 'progress', label: '查看进度', type: 'normal' },
      ];
      case 'completed': return [
        { key: 'delete', label: '删除订单', type: 'outline' },
        { key: 'rebuy', label: '再来一单', type: 'normal' },
      ];
      default: return [];
    }
  };

  const handleAction = (key: string, order: Order) => {
    const map: Record<string, string> = {
      cancel: '订单取消', pay: '支付功能开发中', confirm: '已确认订单', rate: '评价功能',
      contact: '联系中', progress: '查看进度', delete: '订单已删除', rebuy: '已加入购物车',
    };
    Taro.showToast({ title: map[key] || '操作成功', icon: key === 'delete' ? 'none' : 'success' });
    console.log('[Order] Action:', key, order.id);
  };

  return (
    <PageContainer>
      <ScrollView scrollX className={styles.tabs} enableFlex showScrollbar={false}>
        {tabs.map(t => (
          <View
            key={t.key}
            className={classnames(styles.tab, tab === t.key && styles.active)}
            onClick={() => setTab(t.key)}
          >
            <Text>{t.label}</Text>
          </View>
        ))}
      </ScrollView>

      {list.length === 0 ? (
        <EmptyState title="暂无订单" subTitle="去逛逛发现好物吧" icon="📦" />
      ) : (
        list.map(o => (
          <View key={o.id} className={styles.orderCard}>
            <View className={styles.header}>
              <View className={styles.shop}>
                <Text style={{ fontSize: 30 }}>🏪</Text>
                <Text className={styles.shopName}>{o.providerName || '社区服务店'}</Text>
              </View>
              <View className={styles.status} style={{ color: statusColorMap[o.status as OrderStatus]?.color || '#86909C' }}>
                <StatusBadge type={statusColorMap[o.status as OrderStatus]?.badge || 'gray'}>
                  {statusColorMap[o.status as OrderStatus]?.label || o.status}
                </StatusBadge>
              </View>
            </View>

            <View className={styles.items}>
              {o.items.map((it, i) => (
                <View key={i} className={styles.item}>
                  <Image className={styles.img} src={it.image || `https://picsum.photos/id/${20 + i}/300/300`} mode="aspectFill" />
                  <View className={styles.info}>
                    <Text className={styles.name}>{it.name}</Text>
                    <Text className={styles.spec}>{it.spec || '默认规格'}</Text>
                    <View className={styles.bottom}>
                      <Text className={styles.price}>¥{it.price.toFixed(2)}</Text>
                      <Text className={styles.count}>×{it.quantity}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View className={styles.footer}>
              <View className={styles.summary}>
                <Text className={styles.totalCount}>共{o.items.reduce((s, i) => s + i.quantity, 0)}件商品</Text>
                <View className={styles.totalAmount}>
                  <Text>合计：</Text>
                  <Text className={styles.num}>¥{o.totalAmount.toFixed(2)}</Text>
                </View>
              </View>
              <View className={styles.actions}>
                {getActions(o).map(a => (
                  <View
                    key={a.key}
                    className={`${styles.btn} ${styles[a.type]}`}
                    onClick={() => handleAction(a.key, o)}
                  >
                    <Text>{a.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))
      )}
    </PageContainer>
  );
};

export default OrdersPage;
