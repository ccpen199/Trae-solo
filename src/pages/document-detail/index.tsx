import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import Watermark from '@/components/Watermark';
import { documentService } from '@/services/documentService';
import { Document, DocumentVersion, WatermarkConfig } from '@/types/document';
import styles from './index.module.scss';

const DocumentDetailPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [documentId, setDocumentId] = useState('');

  const watermarkConfig: WatermarkConfig = {
    enabled: true,
    text: '张明 · 2024-01-15 · 内部机密',
    color: '#1E5AA8',
    fontSize: 14,
    opacity: 0.15,
    angle: -30,
    density: 'normal'
  };

  const loadData = useCallback(async (id: string) => {
    try {
      const [docRes, versionRes] = await Promise.all([
        documentService.getDocumentDetail(id),
        documentService.getDocumentVersions(id)
      ]);

      setDocument(docRes);
      setVersions(versionRes);
    } catch (error) {
      console.error('加载文档详情失败', error);
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1] as any;
    const id = currentPage?.options?.id || '1';
    setDocumentId(id);
    loadData(id);
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData(documentId);
  });

  const handleEdit = () => {
    Taro.showToast({ title: '进入编辑模式', icon: 'none' });
  };

  const handleDownload = () => {
    Taro.showLoading({ title: '下载中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '下载成功', icon: 'success' });
    }, 1500);
  };

  const handleShare = () => {
    Taro.showActionSheet({
      itemList: ['分享给同事', '生成分享链接', '发送到聊天'],
      success: (res) => {
        Taro.showToast({
          title: ['分享给同事', '链接已复制', '已发送'][res.tapIndex],
          icon: 'none'
        });
      }
    });
  };

  const handleVersionRestore = (version: DocumentVersion) => {
    Taro.showModal({
      title: '恢复版本',
      content: `确定要恢复到"${version.name}"版本吗？当前内容会被覆盖。`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '恢复中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '恢复成功', icon: 'success' });
            loadData(documentId);
          }, 1000);
        }
      }
    });
  };

  const handleAddCollaborator = () => {
    Taro.showToast({ title: '添加协作者', icon: 'none' });
  };

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  if (!document) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>文档不存在</View>
      </View>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'edit': return '可编辑';
      case 'view': return '仅查看';
      case 'owner': return '所有者';
      default: return permission;
    }
  };

  const activities = [
    {
      user: '张明',
      action: '创建了文档',
      time: '2024-01-10 09:30:00',
      detail: '创建了新文档《2024年信息化建设规划》'
    },
    {
      user: '李华',
      action: '编辑了文档',
      time: '2024-01-11 14:20:00',
      detail: '修改了第三章内容'
    },
    {
      user: '王芳',
      action: '添加了评论',
      time: '2024-01-12 10:15:00',
      detail: '建议补充预算明细部分'
    },
    {
      user: '张明',
      action: '更新了版本',
      time: '2024-01-13 16:45:00',
      detail: '更新至 v1.2 版本'
    }
  ];

  return (
    <View className={styles.page}>
      <Watermark config={watermarkConfig} visible={true} />

      <View className={styles.header}>
        <Text className={styles.title}>{document.name}</Text>
        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text className={styles.icon}>📁</Text>
            <Text>{document.type.toUpperCase()}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.icon}>📊</Text>
            <Text>{formatSize(document.size)}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.icon}>👁️</Text>
            <Text>{document.viewCount} 次浏览</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.icon}>👥</Text>
            <Text>{document.collaborators?.length || 0} 位协作者</Text>
          </View>
        </View>
        <View className={styles.tags}>
          {document.isConfidential && (
            <View className={classnames(styles.tag, styles.confidential)}>🔒 机密</View>
          )}
          <View className={classnames(styles.tag, styles.internal)}>内部文档</View>
          {document.tags?.map((tag, index) => (
            <View key={index} className={classnames(styles.tag, styles.public)}>
              {tag}
            </View>
          ))}
        </View>
      </View>

      {document.watermark?.enabled && (
        <View className={styles.watermarkNotice}>
          <Text className={styles.icon}>💧</Text>
          <Text>本文档已启用防盗水印，禁止截屏和外传</Text>
        </View>
      )}

      <ScrollView
        scrollY
        enhanced
        showScrollbar={false}
      >
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.icon}>📄</Text>
            文档预览
            <Text className={styles.action} onClick={handleEdit}>
              ✏️ 编辑
            </Text>
          </Text>
          <View className={styles.contentPreview}>
            <View className={styles.previewContent}>
              <h1>2024年信息化建设规划</h1>
              <h2>一、建设背景</h2>
              <p>
                随着公司业务的快速发展，现有信息化系统已无法满足日常办公需求。
                为提升工作效率，规范管理流程，特制定本信息化建设规划。
              </p>
              <h2>二、建设目标</h2>
              <p>1. 实现办公流程全面数字化</p>
              <p>2. 搭建统一移动办公中台</p>
              <p>3. 完成各业务系统集成对接</p>
              <p>4. 建立完善的数据安全保障体系</p>
              <h2>三、建设内容</h2>
              <h3>3.1 移动办公中台建设</h3>
              <p>
                搭建基于微服务架构的统一移动办公中台，支持iOS、Android、小程序等多端接入，
                提供组织架构、即时通讯、审批流、文档管理等核心能力。
              </p>
              <h3>3.2 系统集成对接</h3>
              <p>完成与OA、ERP、HR、财务、安监等系统的对接，实现单点登录和数据互通。</p>
              <h3>3.3 安全保障体系</h3>
              <p>
                采用国密SM4加密算法，实现端到端加密传输。建立生物识别二次验证机制，
                确保敏感操作安全可控。
              </p>
              <h2>四、预算规划</h2>
              <p>本次信息化建设总预算约500万元，分两期投入。</p>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.icon}>📋</Text>
            版本历史
            <Text className={styles.action} onClick={() => Taro.showToast({ title: '查看全部', icon: 'none' })}>
              查看全部 →
            </Text>
          </Text>
          <View className={styles.versionList}>
            {versions.map(version => (
              <View
                key={version.id}
                className={styles.versionItem}
                onClick={() => handleVersionRestore(version)}
              >
                <View className={styles.versionInfo}>
                  <Text className={styles.versionName}>
                    {version.name}
                    {version.isCurrent && <Text className={styles.currentVersion}>当前版本</Text>}
                  </Text>
                  <Text className={styles.versionMeta}>
                    {version.creatorName} · {dayjs(version.createTime).format('YYYY-MM-DD HH:mm')} · {formatSize(version.size)}
                  </Text>
                  {version.changeLog && (
                    <Text className={styles.versionMeta} style={{ marginTop: 4 }}>
                      📝 {version.changeLog}
                    </Text>
                  )}
                </View>
                <Text className={styles.action}>↩️ 恢复</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.icon}>👥</Text>
            协作者
            <Text className={styles.action} onClick={handleAddCollaborator}>
              ➕ 添加
            </Text>
          </Text>
          <View className={styles.collaboratorList}>
            {document.collaborators?.map(collab => (
              <View key={collab.userId} className={styles.collaboratorItem}>
                <View className={styles.collaboratorAvatar}>
                  {collab.userName.charAt(0)}
                </View>
                <View className={styles.collaboratorInfo}>
                  <Text className={styles.collaboratorName}>
                    {collab.userName}
                    <Text className={classnames(styles.permissionTag, styles[collab.permission])}>
                      {getPermissionLabel(collab.permission)}
                    </Text>
                  </Text>
                  <Text className={styles.collaboratorRole}>
                    {collab.role} · {collab.department}
                  </Text>
                </View>
                <Text className={styles.action}>⋮</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.icon}>📊</Text>
            动态记录
          </Text>
          <View className={styles.activityList}>
            {activities.map((activity, index) => (
              <View key={index} className={styles.activityItem}>
                <View className={styles.activityDot} />
                <View className={styles.activityContent}>
                  <View className={styles.activityHeader}>
                    <Text className={styles.activityUser}>{activity.user}</Text>
                    <Text className={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <Text className={styles.activityAction}>
                    <Text className={styles.type}>{activity.action}</Text>
                  </Text>
                  <Text className={styles.activityDetail}>{activity.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.securityNote}>
          <Text className={styles.icon}>🔒</Text>
          <Text>文档内容使用国密SM4加密存储，水印追踪溯源，保障文档安全</Text>
        </View>
      </ScrollView>

      <View className={styles.actionBar}>
        <View className={styles.actionBtn} onClick={handleDownload}>
          <Text className={styles.icon}>⬇️</Text>
          <Text className={styles.text}>下载</Text>
        </View>
        <View className={styles.actionBtn} onClick={handleShare}>
          <Text className={styles.icon}>📤</Text>
          <Text className={styles.text}>分享</Text>
        </View>
        <View className={styles.actionBtn} onClick={() => Taro.showToast({ title: '收藏成功', icon: 'success' })}>
          <Text className={styles.icon}>⭐</Text>
          <Text className={styles.text}>收藏</Text>
        </View>
        <View className={classnames(styles.actionBtn, styles.primary)} onClick={handleEdit}>
          <Text className={styles.icon}>✏️</Text>
          <Text className={styles.text}>编辑</Text>
        </View>
      </View>
    </View>
  );
};

export default DocumentDetailPage;
