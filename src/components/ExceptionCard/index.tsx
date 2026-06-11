import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import type { ExceptionRecord } from '@/types/exception';
import { EXCEPTION_TYPE_MAP, EXCEPTION_STATUS_MAP, EXCEPTION_SEVERITY_MAP } from '@/types/exception';
import { formatWaybillNoDisplay } from '@/utils/validator';

interface ExceptionCardProps {
  exception: ExceptionRecord;
  onAction?: (exception: ExceptionRecord, action: string) => void;
  showActions?: boolean;
}

const ExceptionCard: React.FC<ExceptionCardProps> = ({ exception, onAction, showActions = true }) => {
  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'error';
    if (severity === 'high') return 'warning';
    if (severity === 'medium') return 'primary';
    return 'default';
  };

  const getStatusColor = (status: string) => {
    if (status === 'resolved' || status === 'closed') return 'success';
    if (status === 'processing') return 'primary';
    return 'warning';
  };

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/exception-report/index?id=${exception.id}&waybillNo=${exception.waybillNo}&view=true`
    }).catch(e => console.error('[ExceptionCard] 跳转失败:', e));
  };

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(exception, action);
    }
  };

  const isOvertime = exception.deadline && Date.now() > exception.deadline;

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.left}>
          <View className={classnames(styles.severityTag, styles[`severity${getSeverityColor(exception.severity).charAt(0).toUpperCase() + getSeverityColor(exception.severity).slice(1)}`])}>
            <Text className={styles.severityText}>{EXCEPTION_SEVERITY_MAP[exception.severity]}</Text>
          </View>
          <Text className={styles.waybillNo}>{formatWaybillNoDisplay(exception.waybillNo)}</Text>
        </View>
        <View className={classnames(styles.statusTag, styles[`status${getStatusColor(exception.status).charAt(0).toUpperCase() + getStatusColor(exception.status).slice(1)}`])}>
          <Text className={styles.statusText}>{EXCEPTION_STATUS_MAP[exception.status]}</Text>
        </View>
      </View>

      <View className={styles.typeRow}>
        <View className={styles.typeTag}>
          <Text className={styles.typeText}>{EXCEPTION_TYPE_MAP[exception.exceptionType]}</Text>
        </View>
        {isOvertime && (
          <View className={styles.overtimeTag}>
            <Text className={styles.overtimeText}>已超时</Text>
          </View>
        )}
        {exception.photos.length > 0 && (
          <View className={styles.photoTag}>
            <Text className={styles.photoText}>📷 {exception.photos.length}张</Text>
          </View>
        )}
      </View>

      <View className={styles.description}>
        <Text className={styles.descriptionText}>{exception.description}</Text>
      </View>

      {exception.photos.length > 0 && (
        <View className={styles.photos}>
          {exception.photos.slice(0, 3).map(photo => (
            <Image
              key={photo.id}
              src={photo.url}
              mode="aspectFill"
              className={styles.photo}
              onClick={(e) => {
                e.stopPropagation();
                Taro.previewImage({
                  urls: exception.photos.map(p => p.url),
                  current: photo.url
                });
              }}
            />
          ))}
          {exception.photos.length > 3 && (
            <View className={styles.morePhoto}>
              <Text className={styles.moreText}>+{exception.photos.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.footer}>
        <View className={styles.reporter}>
          <Text className={styles.reporterName}>{exception.reporterName}</Text>
          <Text className={styles.reportTime}>
            {dayjs(exception.reportTime).format('MM-DD HH:mm')}
          </Text>
        </View>
        {showActions && exception.status !== 'resolved' && exception.status !== 'closed' && (
          <View className={styles.actions}>
            <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={(e) => handleAction('contact', e)}>
              联系客服
            </Button>
            <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={(e) => handleAction('update', e)}>
              更新进度
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

export default ExceptionCard;
