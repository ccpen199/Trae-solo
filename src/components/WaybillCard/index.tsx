import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import type { PickupTask, DeliveryTask } from '@/types/waybill';
import { WAYBILL_TYPE_MAP, WAYBILL_STATUS_MAP } from '@/types/waybill';
import { formatWaybillNoDisplay, formatPhoneDisplay } from '@/utils/validator';

interface WaybillCardProps {
  task: PickupTask | DeliveryTask;
  type: 'pickup' | 'delivery';
  onAction?: (task: PickupTask | DeliveryTask, action: string) => void;
  showActions?: boolean;
}

const WaybillCard: React.FC<WaybillCardProps> = ({ task, type, onAction, showActions = true }) => {
  const isPickup = type === 'pickup';
  const contact = isPickup ? (task as PickupTask).sender : (task as DeliveryTask).receiver;
  const statusMap = isPickup
    ? { pending: '待接单', accepted: '已接单', picked_up: '已揽收', cancelled: '已取消' }
    : { pending: '待派送', delivering: '派送中', delivered: '已签收', station: '驿站代收', exception: '异常' };

  const getStatusColor = (status: string) => {
    if (status === 'picked_up' || status === 'delivered' || status === 'station') return 'success';
    if (status === 'delivering' || status === 'accepted') return 'primary';
    if (status === 'exception') return 'error';
    return 'default';
  };

  const getTimeText = () => {
    const timeField = isPickup ? 'expectedPickupTime' : 'expectedDeliveryTime';
    const time = (task as any)[timeField];
    if (!time) return '';
    const diff = time - Date.now();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (diff < 0) return { text: '已超时', urgent: true };
    if (diff < 3600000) return { text: `剩余 ${minutes}分钟`, urgent: true };
    if (diff < 7200000) return { text: `剩余 ${hours}小时${minutes}分钟`, urgent: true };
    return { text: `预计 ${dayjs(time).format('HH:mm')}`, urgent: false };
  };

  const timeInfo = getTimeText();

  const handleCardClick = () => {
    Taro.navigateTo({
      url: `/pages/waybill-detail/index?waybillNo=${task.waybillNo}&type=${type}`
    }).catch(e => console.error('[WaybillCard] 跳转失败:', e));
  };

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(task, action);
    }
  };

  return (
    <View className={styles.card} onClick={handleCardClick}>
      <View className={styles.header}>
        <View className={styles.left}>
          <View className={classnames(styles.typeTag, isPickup ? styles.pickup : styles.delivery)}>
            <Text className={styles.typeText}>{isPickup ? '揽' : '派'}</Text>
          </View>
          <Text className={styles.waybillNo}>{formatWaybillNoDisplay(task.waybillNo)}</Text>
          <View className={classnames(styles.statusTag, styles[`status${getStatusColor(task.status).charAt(0).toUpperCase() + getStatusColor(task.status).slice(1)}`])}>
            <Text className={styles.statusText}>{statusMap[task.status as keyof typeof statusMap]}</Text>
          </View>
        </View>
        {'priority' in task && task.priority !== 'normal' && (
          <View className={classnames(styles.priorityTag, task.priority === 'urgent' ? styles.urgent : styles.vip)}>
            <Text className={styles.priorityText}>{task.priority === 'urgent' ? '急' : 'VIP'}</Text>
          </View>
        )}
      </View>

      <View className={styles.info}>
        <View className={styles.row}>
          <Text className={styles.label}>收件人:</Text>
          <Text className={styles.value}>
            {contact.name} {formatPhoneDisplay(contact.phone)}
          </Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>地址:</Text>
          <Text className={styles.address}>{contact.detailAddress || contact.address}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>物品:</Text>
          <Text className={styles.value}>{task.goodsDescription}</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <View className={classnames(styles.timeInfo, timeInfo?.urgent && styles.timeUrgent)}>
          <Text className={styles.timeIcon}>⏰</Text>
          <Text className={styles.timeText}>{timeInfo?.text}</Text>
        </View>
        {showActions && task.status !== 'picked_up' && task.status !== 'delivered' && (
          <View className={styles.actions}>
            {isPickup && task.status === 'pending' && (
              <>
                <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={(e) => handleAction('accept', e)}>
                  接单
                </Button>
                <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={(e) => handleAction('pickup', e)}>
                  扫码揽收
                </Button>
              </>
            )}
            {isPickup && task.status === 'accepted' && (
              <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={(e) => handleAction('pickup', e)}>
                扫码揽收
              </Button>
            )}
            {!isPickup && task.status === 'pending' && (
              <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={(e) => handleAction('start', e)}>
                开始派送
              </Button>
            )}
            {!isPickup && task.status === 'delivering' && (
              <>
                <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={(e) => handleAction('station', e)}>
                  驿站签收
                </Button>
                <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={(e) => handleAction('sign', e)}>
                  确认签收
                </Button>
              </>
            )}
          </View>
        )}
      </View>

      {timeInfo?.urgent && task.status !== 'picked_up' && task.status !== 'delivered' && (
        <View className={styles.urgentBar}>
          <Text className={styles.urgentText}>即将超时，请尽快处理</Text>
        </View>
      )}
    </View>
  );
};

export default WaybillCard;
