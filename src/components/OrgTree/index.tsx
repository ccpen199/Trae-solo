import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Organization } from '@/types/organization';

interface OrgTreeProps {
  data: Organization[];
  onNodeClick?: (node: Organization) => void;
  defaultExpandLevel?: number;
}

const OrgTree: React.FC<OrgTreeProps> = ({ data, onNodeClick, defaultExpandLevel = 2 }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const getLevel = (node: Organization, nodes: Organization[], level: number = 0): number => {
    for (const n of nodes) {
      if (n.id === node.id) return level;
      if (n.children) {
        const found = getLevel(node, n.children, level + 1);
        if (found !== -1) return found;
      }
    }
    return -1;
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return '#0EA663';
      case 'syncing': return '#FF7A00';
      case 'failed': return '#E74C3C';
      default: return '#86909C';
    }
  };

  const getSyncStatusText = (status: string) => {
    switch (status) {
      case 'synced': return '已同步';
      case 'syncing': return '同步中';
      case 'failed': return '同步失败';
      default: return '未知';
    }
  };

  const renderNode = (node: Organization, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isDefaultExpanded = level < defaultExpandLevel;
    const shouldExpand = isExpanded || isDefaultExpanded;

    return (
      <View key={node.id}>
        <View
          className={classnames(styles.treeNode, level === 0 && styles.rootNode)}
          onClick={() => onNodeClick?.(node)}
        >
          <View className={styles.nodeContent} style={{ paddingLeft: `${level * 32 + 16}rpx` }}>
            {hasChildren && (
              <Text
                className={classnames(styles.expandIcon, shouldExpand && styles.expanded)}
                onClick={() => toggleExpand(node.id)}
              >
                ▶
              </Text>
            )}
            {!hasChildren && <View className={styles.placeholder} />}

            <View className={styles.nodeIcon}>
              <Text className={styles.levelIcon}>
                {node.level === 'province' ? '🏢' : node.level === 'city' ? '🏬' : '👥'}
              </Text>
            </View>

            <View className={styles.nodeInfo}>
              <View className={styles.nodeHeader}>
                <Text className={styles.nodeName}>{node.name}</Text>
                <View
                  className={styles.syncStatus}
                  style={{ backgroundColor: getSyncStatusColor(node.syncStatus) + '20', color: getSyncStatusColor(node.syncStatus) }}
                >
                  {getSyncStatusText(node.syncStatus)}
                </View>
              </View>
              <View className={styles.nodeMeta}>
                <Text className={styles.nodeCode}>{node.code}</Text>
                <Text className={styles.nodeCount}>{node.memberCount}人</Text>
                <Text className={styles.nodeLeader}>负责人：{node.leaderName}</Text>
              </View>
            </View>
          </View>
        </View>

        {hasChildren && shouldExpand && (
          <View className={styles.childrenContainer}>
            {node.children!.map(child => renderNode(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={styles.treeContainer}>
      {data.map(node => renderNode(node))}
    </View>
  );
};

export default OrgTree;
