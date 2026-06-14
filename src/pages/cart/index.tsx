import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import { mockCart } from '@/data/mockOrders';
import type { CartItem } from '@/types';

const CartPage: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>(mockCart);
  const [selected, setSelected] = useState<Set<string>>(new Set(mockCart.map(c => c.id)));

  const toggleSelect = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const changeQty = (id: string, delta: number) => {
    setItems(items.map(i =>
      i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const { total, count } = useMemo(() => {
    let total = 0, count = 0;
    items.forEach(i => {
      if (selected.has(i.id)) {
        total += i.price * i.quantity;
        count += i.quantity;
      }
    });
    return { total, count };
  }, [items, selected]);

  return (
    <PageContainer>
      {items.length === 0 ? (
        <EmptyState title="购物车空空如也" subTitle="去选购心仪的商品吧" icon="🛒" />
      ) : (
        items.map(item => (
          <View key={item.id} className={styles.cartItem}>
            <View
              className={classnames(styles.check, selected.has(item.id) && styles.active)}
              onClick={() => toggleSelect(item.id)}
            >
              {selected.has(item.id) && <Text style={{ fontSize: 24, fontWeight: 'bold' }}>✓</Text>}
            </View>
            <Image className={styles.img} src={item.image || `https://picsum.photos/id/${50 + parseInt(item.id.slice(1))}/300/300`} mode="aspectFill" />
            <View className={styles.info}>
              <Text className={styles.name}>{item.name}</Text>
              <Text className={styles.spec}>{item.spec || '默认规格'}</Text>
              <View className={styles.bottom}>
                <Text className={styles.price}>¥{item.price.toFixed(2)}</Text>
                <View className={styles.qty}>
                  <View className={styles.qBtn} onClick={() => changeQty(item.id, -1)}><Text>−</Text></View>
                  <Text className={styles.qNum}>{item.quantity}</Text>
                  <View className={styles.qBtn} onClick={() => changeQty(item.id, 1)}><Text>+</Text></View>
                </View>
              </View>
            </View>
          </View>
        ))
      )}
      <View style={{ height: '200rpx' }} />
      <View className={styles.settleBar}>
        <View className={styles.checkAll} onClick={toggleAll}>
          <View className={classnames(styles.check, selected.size === items.length && items.length > 0 && styles.active)}>
            {selected.size === items.length && items.length > 0 && <Text style={{ fontSize: 24, fontWeight: 'bold' }}>✓</Text>}
          </View>
          <Text className={styles.label}>全选</Text>
        </View>
        <View className={styles.spacer} />
        <View className={styles.summary}>
          <View className={styles.amount}>
            <Text>合计：</Text>
            <Text className={styles.num}>¥{total.toFixed(2)}</Text>
          </View>
          <View className={styles.count}><Text>已选 {count} 件</Text></View>
        </View>
        <View
          className={styles.btn}
          onClick={() => {
            if (count === 0) { Taro.showToast({ title: '请选择商品', icon: 'none' }); return; }
            Taro.showToast({ title: '下单功能开发中', icon: 'none' });
          }}
        >
          <Text>结算</Text>
        </View>
      </View>
    </PageContainer>
  );
};

export default CartPage;
