import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { ApprovalNode } from '@/types';
import styles from './index.module.scss';

interface ProgressNodesProps {
  nodes: ApprovalNode[];
  currentStep: number;
}

const ProgressNodes: React.FC<ProgressNodesProps> = ({ nodes, currentStep }) => {
  return (
    <View className={styles.wrapper}>
      {nodes.map((node, idx) => {
        const isActive = idx + 1 <= currentStep;
        const isCurrent = idx + 1 === currentStep && node.status !== 'approved';
        const isRejected = node.status === 'rejected';
        return (
          <View
            key={node.id}
            className={classnames(styles.node, isActive && styles.active)}
          >
            <View className={styles.lineWrap}>
              <View className={classnames(
                styles.circle,
                isActive && !isRejected && styles.circleActive,
                isCurrent && styles.circleCurrent,
                isRejected && styles.circleRejected
              )}>
                {isRejected ? (
                  <Text className={styles.rejectIcon}>✕</Text>
                ) : node.status === 'approved' ? (
                  <Text className={styles.checkIcon}>✓</Text>
                ) : (
                  <Text className={styles.level}>{node.level}</Text>
                )}
              </View>
              {idx < nodes.length - 1 && (
                <View className={classnames(
                  styles.line,
                  node.status === 'approved' && styles.lineActive,
                  isRejected && styles.lineRejected
                )} />
              )}
            </View>
            <View className={styles.content}>
              <View className={styles.header}>
                <Text className={classnames(
                  styles.name,
                  isCurrent && styles.nameCurrent,
                  isRejected && styles.nameRejected
                )}>{node.name}</Text>
                <View className={classnames(
                  styles.statusTag,
                  node.status === 'approved' && styles.statusApproved,
                  node.status === 'processing' && styles.statusProcessing,
                  node.status === 'pending' && styles.statusPending,
                  isRejected && styles.statusRejected
                )}>
                  {node.status === 'approved' ? '已完成' :
                   node.status === 'processing' ? '处理中' :
                   isRejected ? '已驳回' : '待处理'}
                </View>
              </View>
              <Text className={styles.role}>
                {node.role}{node.assignee ? ` · ${node.assignee}` : ''}
              </Text>
              {node.comment && (
                <View className={styles.comment}>
                  <Text className={styles.commentText}>{node.comment}</Text>
                </View>
              )}
              {node.operatedAt && (
                <Text className={styles.time}>{node.operatedAt}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default ProgressNodes;
