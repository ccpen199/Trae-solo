import React from 'react';
import { View, Text } from '@tarojs/components';
import type { Matter } from '@/types/matter';
import { formatDate, maskIdCard } from '@/utils/format';
import styles from './index.module.scss';

interface MatterItemProps {
  matter: Matter;
  onClick?: (matter: Matter) => void;
  showActions?: boolean;
}

const MatterItem: React.FC<MatterItemProps> = ({ matter, onClick, showActions = true }) => {
  const handleClick = () => {
    onClick?.(matter);
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      reviewing: '审核中',
      material_required: '待补材料',
      payment_required: '待缴费',
      approved: '已通过',
      rejected: '已驳回',
      completed: '已完成',
      cancelled: '已撤销'
    };
    return map[status] || status;
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      draft: 'gray',
      submitted: 'blue',
      reviewing: 'blue',
      material_required: 'warning',
      payment_required: 'warning',
      approved: 'success',
      rejected: 'error',
      completed: 'success',
      cancelled: 'gray'
    };
    return styles[`status${map[status]?.charAt(0).toUpperCase() + map[status]?.slice(1)}`] || styles.statusGray;
  };

  const currentNode = matter.approvalNodes?.find(n => n.status === 'current') || 
                      matter.approvalNodes?.filter(n => n.status === 'completed').slice(-1)[0];

  return (
    <View className={styles.item} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{matter.matterName}</Text>
          <View className={`${styles.status} ${getStatusClass(matter.status)}`}>
            {getStatusText(matter.status)}
          </View>
        </View>
        <Text className={styles.code}>办件编号：{matter.matterCode}</Text>
      </View>

      {matter.isCrossProvince && (
        <View className={styles.crossProvince}>
          <Text className={styles.crossText}>长三角跨省通办 · {matter.sourceProvince}→{matter.targetProvince}</Text>
        </View>
      )}

      {currentNode && (
        <View className={styles.progress}>
          <View className={styles.progressDot} />
          <View className={styles.progressContent}>
            <Text className={styles.progressNode}>{currentNode.nodeName}</Text>
            {currentNode.message && (
              <Text className={styles.progressMsg}>{currentNode.message}</Text>
            )}
            <Text className={styles.progressTime}>{formatDate(currentNode.startTime)}</Text>
          </View>
        </View>
      )}

      <View className={styles.footer}>
        <View className={styles.infoRow}>
          <Text className={styles.info}>提交时间：{formatDate(matter.submitTime)}</Text>
        </View>
        {showActions && (
          <View className={styles.actions}>
            {matter.status === 'draft' && (
              <View className={styles.actionBtn}>继续办理</View>
            )}
            {matter.status === 'material_required' && (
              <View className={styles.actionBtnPrimary}>补充材料</View>
            )}
            {matter.status === 'payment_required' && (
              <View className={styles.actionBtnPrimary}>立即缴费</View>
            )}
            {(matter.status === 'submitted' || matter.status === 'reviewing') && (
              <View className={styles.actionBtn}>查看进度</View>
            )}
            {matter.status === 'completed' && !matter.evaluated && (
              <View className={styles.actionBtn}>评价</View>
            )}
            {matter.status === 'completed' && (
              <View className={styles.actionBtnPrimary}>查看结果</View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default MatterItem;
