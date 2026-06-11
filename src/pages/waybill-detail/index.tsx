import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { waybillService } from '@/services/waybill';
import { taskService } from '@/services/task';
import { logOperation } from '@/utils/logger';
import { formatPhoneDisplay, formatIdCardDisplay } from '@/utils/validator';
import type { Waybill, OperationLog, WaybillStatus } from '@/types/waybill';
import { WAYBILL_STATUS_MAP, WAYBILL_TYPE_MAP } from '@/types/waybill';

const STATUS_ICONS: Record<WaybillStatus, string> = {
  pending_pickup: '📦',
  picked_up: '✅',
  in_transit: '🚚',
  pending_delivery: '📍',
  delivering: '🏃',
  delivered: '🎉',
  station_received: '🏪',
  exception: '⚠️',
  archived: '📁'
};

const WaybillDetailPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUserStore();

  const [waybillNo, setWaybillNo] = useState('');
  const [waybill, setWaybill] = useState<Waybill | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const waybillFromRouter = router.params.waybillNo;
    if (waybillFromRouter) {
      setWaybillNo(decodeURIComponent(waybillFromRouter));
    }
  }, [router.params.waybillNo]);

  const loadData = useCallback(async () => {
    if (!waybillNo) return;

    setLoading(true);
    try {
      const data = await waybillService.getWaybillByNo(waybillNo);
      setWaybill(data);

      if (user && data) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'waybill',
          action: 'view_detail',
          targetType: 'waybill',
          targetId: waybillNo,
          targetName: '运单详情查看',
          status: 'success',
          complianceLevel: 'normal',
          retentionDays: 90
        });
      }
    } catch (e) {
      console.error('[WaybillDetail] 加载数据失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [waybillNo, user]);

  useEffect(() => {
    if (waybillNo) {
      loadData();
    }
  }, [loadData, waybillNo]);

  useDidShow(() => {
    if (waybillNo) {
      loadData();
    }
  });

  const handleCall = (phone: string, name: string) => {
    if (!user) return;

    Taro.makePhoneCall({
      phoneNumber: phone,
      complete: async () => {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'waybill',
          action: 'call_contact',
          targetType: 'waybill',
          targetId: waybillNo,
          targetName: `联系${name}`,
          status: 'success',
          complianceLevel: 'normal',
          retentionDays: 90,
          requestParams: { phone: formatPhoneDisplay(phone), contactName: name }
        });
      }
    });
  };

  const handleAction = async (action: string) => {
    if (!user || !waybill || actionLoading) return;

    setActionLoading(action);
    try {
      let success = false;

      switch (action) {
        case 'sign':
          success = await waybillService.confirmSign(waybillNo, user.id, user.name);
          break;
        case 'station':
          success = await waybillService.scanStation(
            waybillNo,
            user.id,
            user.name,
            'station_001',
            '朝阳路营业点'
          );
          break;
        case 'exception':
          Taro.navigateTo({
            url: `/pages/exception-report/index?waybillNo=${encodeURIComponent(waybillNo)}`
          });
          return;
        case 'archive':
          success = await taskService.archiveWaybill(waybillNo, 'normal', user.id, user.name) !== null;
          break;
        default:
          break;
      }

      if (success) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'waybill',
          action,
          targetType: 'waybill',
          targetId: waybillNo,
          targetName: `运单${action}操作`,
          status: 'success',
          complianceLevel: action === 'archive' ? 'critical' : 'sensitive',
          retentionDays: action === 'archive' ? 365 : 90,
          requireLocation: action !== 'archive'
        });

        loadData();
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '操作失败';
      console.error('[WaybillDetail] 操作失败:', e);

      if (user) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'waybill',
          action,
          targetType: 'waybill',
          targetId: waybillNo,
          status: 'failed',
          errorMessage: errorMsg,
          complianceLevel: 'sensitive',
          retentionDays: 90
        });
      }

      Taro.showToast({ title: errorMsg, icon: 'none' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleNavigate = () => {
    if (!waybill?.receiver.longitude || !waybill?.receiver.latitude) {
      Taro.showToast({ title: '暂无导航信息', icon: 'none' });
      return;
    }

    Taro.openLocation({
      latitude: waybill.receiver.latitude,
      longitude: waybill.receiver.longitude,
      name: waybill.receiver.name,
      address: waybill.receiver.detailAddress
    });
  };

  const getOperationLogs = (): OperationLog[] => {
    if (!waybill) return [];

    const logs: OperationLog[] = [...waybill.operationLogs];

    if (waybill.createTime) {
      logs.unshift({
        id: 'log_create',
        waybillNo: waybill.waybillNo,
        operatorId: 'system',
        operatorName: '系统',
        operation: '运单创建',
        operationType: 'scan',
        timestamp: waybill.createTime
      });
    }

    if (waybill.actualPickupTime) {
      logs.push({
        id: 'log_pickup',
        waybillNo: waybill.waybillNo,
        operatorId: waybill.courierId || 'system',
        operatorName: waybill.courierName || '快递员',
        operation: '已揽收',
        operationType: 'pickup',
        timestamp: waybill.actualPickupTime
      });
    }

    if (waybill.actualDeliveryTime) {
      logs.push({
        id: 'log_delivery',
        waybillNo: waybill.waybillNo,
        operatorId: waybill.courierId || 'system',
        operatorName: waybill.courierName || '快递员',
        operation: '已签收',
        operationType: 'sign',
        timestamp: waybill.actualDeliveryTime
      });
    }

    if (waybill.archiveTime) {
      logs.push({
        id: 'log_archive',
        waybillNo: waybill.waybillNo,
        operatorId: 'system',
        operatorName: '系统',
        operation: '已归档',
        operationType: 'archive',
        timestamp: waybill.archiveTime
      });
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  };

  const getAvailableActions = () => {
    if (!waybill) return [];

    const actions = [];
    const status = waybill.status;

    if (status === 'delivering') {
      actions.push({ key: 'sign', label: '✅ 签收', type: 'primary' });
      actions.push({ key: 'station', label: '🏪 驿站代收', type: 'secondary' });
    }

    if (status !== 'delivered' && status !== 'archived' && status !== 'exception') {
      actions.push({ key: 'exception', label: '⚠️ 异常上报', type: 'warning' });
    }

    if (status === 'delivered' && !waybill.archived) {
      actions.push({ key: 'archive', label: '📁 归档', type: 'primary' });
    }

    return actions;
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return '-';
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };

  const getTypeTagClass = (type: string): string => {
    const classMap: Record<string, string> = {
      fragile: styles.fragile,
      valuable: styles.valuable,
      perishable: styles.perishable
    };
    return classMap[type] || '';
  };

  if (!waybillNo) {
    return (
      <View className={styles.page}>
        <View className={styles.empty}>
          <Text className={styles.icon}>📦</Text>
          <Text className={styles.text}>请传入运单号</Text>
        </View>
      </View>
    );
  }

  const logs = getOperationLogs();
  const actions = getAvailableActions();

  return (
    <View className={styles.page}>
      {waybill && (
        <View className={styles.header}>
          <Text className={styles.waybillNo}>{waybill.waybillNo}</Text>
          <View className={styles.statusBadge}>
            <Text className={styles.icon}>{STATUS_ICONS[waybill.status]}</Text>
            <Text>{WAYBILL_STATUS_MAP[waybill.status]}</Text>
          </View>
        </View>
      )}

      <ScrollView
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {loading ? (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        ) : waybill ? (
          <>
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>收寄信息</Text>
              <View className={styles.contactCard}>
                <View className={styles.avatar}>
                  <Text>寄</Text>
                </View>
                <View className={styles.info}>
                  <View className={styles.nameRow}>
                    <Text className={styles.name}>{waybill.sender.name}</Text>
                    <Text className={styles.phone}>{formatPhoneDisplay(waybill.sender.phone)}</Text>
                  </View>
                  <Text className={styles.address}>{waybill.sender.detailAddress}</Text>
                </View>
                <View className={styles.actions}>
                  <View
                    className={styles.actionBtn}
                    onClick={() => handleCall(waybill.sender.phone, waybill.sender.name)}
                  >
                    <Text>📞</Text>
                  </View>
                </View>
              </View>
              <View className={styles.contactCard}>
                <View className={styles.avatar}>
                  <Text>收</Text>
                </View>
                <View className={styles.info}>
                  <View className={styles.nameRow}>
                    <Text className={styles.name}>{waybill.receiver.name}</Text>
                    <Text className={styles.phone}>{formatPhoneDisplay(waybill.receiver.phone)}</Text>
                    {waybill.status === 'delivered' && waybill.electronicSignature && (
                      <Text className={styles.tag}>已签收</Text>
                    )}
                  </View>
                  <Text className={styles.address}>{waybill.receiver.detailAddress}</Text>
                </View>
                <View className={styles.actions}>
                  <View
                    className={styles.actionBtn}
                    onClick={() => handleCall(waybill.receiver.phone, waybill.receiver.name)}
                  >
                    <Text>📞</Text>
                  </View>
                  <View className={styles.actionBtn} onClick={handleNavigate}>
                    <Text>🧭</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>物品信息</Text>
              <View className={styles.goodsGrid}>
                <View className={styles.goodsItem}>
                  <Text className={styles.label}>物品名称</Text>
                  <Text className={styles.value}>{waybill.goodsDescription}</Text>
                </View>
                <View className={styles.goodsItem}>
                  <Text className={styles.label}>物品类型</Text>
                  <Text className={styles.value}>{WAYBILL_TYPE_MAP[waybill.type]}</Text>
                </View>
                <View className={styles.goodsItem}>
                  <Text className={styles.label}>重量</Text>
                  <Text className={styles.value}>{waybill.weight} kg</Text>
                </View>
                <View className={styles.goodsItem}>
                  <Text className={styles.label}>运费</Text>
                  <Text className={styles.value}>¥{waybill.freight}</Text>
                </View>
                {waybill.length && waybill.width && waybill.height && (
                  <>
                    <View className={styles.goodsItem}>
                      <Text className={styles.label}>尺寸</Text>
                      <Text className={styles.value}>
                        {waybill.length}×{waybill.width}×{waybill.height} cm
                      </Text>
                    </View>
                  </>
                )}
                {waybill.goodsValue && (
                  <View className={styles.goodsItem}>
                    <Text className={styles.label}>声明价值</Text>
                    <Text className={classnames(styles.value, waybill.goodsValue > 5000 ? styles.danger : waybill.goodsValue > 1000 ? styles.warning : '')}>
                      ¥{waybill.goodsValue}
                    </Text>
                  </View>
                )}
              </View>
              <View className={styles.tagsRow}>
                <Text className={classnames(styles.tag, getTypeTagClass(waybill.type))}>
                  {WAYBILL_TYPE_MAP[waybill.type]}
                </Text>
                <Text className={styles.tag}>
                  {waybill.paymentMethod === 'sender_pay' ? '寄付' : waybill.paymentMethod === 'receiver_pay' ? '到付' : '月结'}
                </Text>
                {waybill.evidenceHash && (
                  <Text className={styles.tag}>已存证</Text>
                )}
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>时效信息</Text>
              <View className={styles.infoRow}>
                <Text className={styles.label}>预计揽收</Text>
                <Text className={styles.value}>{formatTime(waybill.expectedPickupTime)}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>实际揽收</Text>
                <Text className={styles.value}>{formatTime(waybill.actualPickupTime)}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>预计送达</Text>
                <Text className={styles.value}>{formatTime(waybill.expectedDeliveryTime)}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>实际送达</Text>
                <Text className={classnames(styles.value, styles.highlight)}>
                  {formatTime(waybill.actualDeliveryTime)}
                </Text>
              </View>
              {waybill.courierName && (
                <View className={styles.infoRow}>
                  <Text className={styles.label}>负责快递员</Text>
                  <Text className={styles.value}>{waybill.courierName}</Text>
                </View>
              )}
              {waybill.stationName && (
                <View className={styles.infoRow}>
                  <Text className={styles.label}>所属站点</Text>
                  <Text className={styles.value}>{waybill.stationName}</Text>
                </View>
              )}
            </View>

            {waybill.electronicSignature && (
              <View className={styles.section}>
                <Text className={styles.sectionTitle}>签收信息</Text>
                <View className={styles.signatureSection}>
                  <View className={styles.signatureInfo}>
                    <Text className={styles.icon}>✍️</Text>
                    <View className={styles.info}>
                      <Text className={styles.name}>
                        {waybill.electronicSignature.signerName}
                        {' '}
                        ({formatIdCardDisplay(waybill.electronicSignature.signerIdCard)})
                      </Text>
                      <Text className={styles.time}>
                        签收时间：{formatTime(waybill.electronicSignature.timestamp)}
                      </Text>
                      {waybill.electronicSignature.location && (
                        <Text className={styles.time}>
                          签收地点：{waybill.electronicSignature.location}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>操作日志</Text>
              {logs.length > 0 ? (
                <View className={styles.timeline}>
                  {logs.map((log, index) => (
                    <View key={log.id} className={styles.timelineItem}>
                      <View className={classnames(styles.dot, index === 0 && styles.active)} />
                      <View className={styles.content}>
                        <Text className={styles.title}>{log.operation}</Text>
                        <Text className={styles.operator}>操作人：{log.operatorName}</Text>
                        <Text className={styles.time}>{formatTime(log.timestamp)}</Text>
                        {log.remark && (
                          <Text className={styles.remark}>{log.remark}</Text>
                        )}
                        {log.location && (
                          <Text className={styles.location}>
                            📍 {log.location}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className={styles.empty}>
                  <Text className={styles.icon}>📋</Text>
                  <Text className={styles.text}>暂无操作日志</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View className={styles.empty}>
            <Text className={styles.icon}>❓</Text>
            <Text className={styles.text}>未找到该运单信息</Text>
          </View>
        )}
      </ScrollView>

      {waybill && actions.length > 0 && (
        <View className={styles.bottomActionBar}>
          {actions.map((action, index) => (
            <View
              key={action.key}
              className={classnames(
                styles.actionBtn,
                styles[action.type as keyof typeof styles],
                actionLoading === action.key && styles.disabled
              )}
              onClick={() => handleAction(action.key)}
            >
              <Text>{actionLoading === action.key ? '处理中...' : action.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default WaybillDetailPage;
