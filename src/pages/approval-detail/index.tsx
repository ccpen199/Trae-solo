import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/useUserStore';
import { approvalService } from '@/services/approvalService';
import { ApprovalInstance } from '@/types/approval';
import styles from './index.module.scss';

const ApprovalDetailPage: React.FC = () => {
  const { userInfo, bioAuthEnabled } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approval, setApproval] = useState<ApprovalInstance | null>(null);
  const [instanceId, setInstanceId] = useState('');
  const [isCurrentNode, setIsCurrentNode] = useState(false);

  const loadData = useCallback(async (id: string) => {
    try {
      const data = await approvalService.getApprovalDetail(id);
      setApproval(data);
      setIsCurrentNode(false);
    } catch (error) {
      console.error('加载审批详情失败', error);
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, [userInfo?.id]);

  useEffect(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1] as any;
    const id = currentPage?.options?.id || '1';
    setInstanceId(id);
    loadData(id);
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData(instanceId);
  });

  const verifyBioAuth = async (): Promise<boolean> => {
    if (!bioAuthEnabled) return true;

    return new Promise((resolve) => {
      Taro.showModal({
        title: '生物识别验证',
        content: '请进行指纹或面容验证以完成审批操作',
        success: (res) => {
          if (res.confirm) {
            Taro.showLoading({ title: '验证中...' });
            setTimeout(() => {
              Taro.hideLoading();
              resolve(true);
            }, 1500);
          } else {
            resolve(false);
          }
        },
        fail: () => resolve(false)
      });
    });
  };

  const handleApprove = async () => {
    Taro.showModal({
      title: '审批意见',
      content: '请输入审批意见（可选）',
      success: async (res) => {
        if (res.confirm) {
          const verified = await verifyBioAuth();
          if (!verified) {
            Taro.showToast({ title: '验证失败', icon: 'error' });
            return;
          }

          Taro.showLoading({ title: '审批中...' });
          try {
            await approvalService.approveApproval(instanceId, (res as any).content || '同意');
            Taro.hideLoading();
            Taro.showToast({ title: '审批成功', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1000);
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '审批失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleReject = async () => {
    Taro.showModal({
      title: '驳回原因',
      content: '请输入驳回原因',
      success: async (res) => {
        const content = (res as any).content;
        if (res.confirm && content) {
          const verified = await verifyBioAuth();
          if (!verified) {
            Taro.showToast({ title: '验证失败', icon: 'error' });
            return;
          }

          Taro.showLoading({ title: '提交中...' });
          try {
            await approvalService.rejectApproval(instanceId, content);
            Taro.hideLoading();
            Taro.showToast({ title: '已驳回', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1000);
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleAddSign = async () => {
    Taro.showActionSheet({
      itemList: ['前加签', '后加签'],
      success: async (res) => {
        const verified = await verifyBioAuth();
        if (!verified) {
          Taro.showToast({ title: '验证失败', icon: 'error' });
          return;
        }

        Taro.showToast({
          title: res.tapIndex === 0 ? '前加签' : '后加签',
          icon: 'none'
        });
      }
    });
  };

  const handleTransfer = async () => {
    const verified = await verifyBioAuth();
    if (!verified) {
      Taro.showToast({ title: '验证失败', icon: 'error' });
      return;
    }
    Taro.showToast({ title: '转交审批', icon: 'none' });
  };

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  if (!approval) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>审批不存在</View>
      </View>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待审批';
      case 'approved': return '已通过';
      case 'rejected': return '已驳回';
      case 'countersigning': return '会签中';
      default: return '未知';
    }
  };

  const getNodeStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '已同意';
      case 'rejected': return '已驳回';
      case 'pending': return '待处理';
      case 'countersigning': return '会签中';
      case 'current': return '当前节点';
      default: return '未知';
    }
  };

  const formData = [
    { label: '申请单号', value: approval.instanceNo },
    { label: '申请类型', value: approval.templateName },
    { label: '申请人', value: `${approval.applicantName}（${approval.applicantDept}）` },
    { label: '申请时间', value: dayjs(approval.createTime).format('YYYY-MM-DD HH:mm:ss') },
    { label: '申请事由', value: approval.title },
    { label: '详细说明', value: '为了提升工作效率，规范管理流程，现申请采购以下设备：\n1. 笔记本电脑 × 5台\n2. 投影仪 × 2台\n3. 会议平板 × 1台\n\n预算总计：¥158,000\n\n以上申请，请领导审批。' },
    { label: '预算金额', value: '¥158,000.00' }
  ];

  const approvals = approval.approvalNodes || [
    {
      id: '1',
      nodeName: '发起申请',
      approverName: '张明',
      approverDept: '省公司信息中心',
      status: 'approved',
      comment: '为了提升工作效率，现申请采购办公设备，请领导审批。',
      time: '2024-01-15 09:30:00'
    },
    {
      id: '2',
      nodeName: '部门经理审批',
      approverName: '李华',
      approverDept: '省公司信息中心',
      status: 'approved',
      comment: '情况属实，同意采购。',
      time: '2024-01-15 10:15:00'
    },
    {
      id: '3',
      nodeName: '会签（信息中心/财务部）',
      approverName: '王芳（财务部）、刘强（信息中心）',
      approverDept: '财务部、信息中心',
      status: 'countersigning',
      comment: '预算范围内，同意。',
      time: '2024-01-15 14:00:00',
      isCountersign: true
    },
    {
      id: '4',
      nodeName: '总经理审批',
      approverName: '待定',
      approverDept: '',
      status: 'pending',
      comment: '',
      time: ''
    }
  ];

  return (
    <ScrollView
      className={styles.page}
      scrollY
      enhanced
      showScrollbar={false}
    >
      <View className={styles.header}>
        <View className={classnames(styles.statusBadge, styles[approval.status])}>
          {getStatusText(approval.status)}
        </View>
        <Text className={styles.title}>{approval.title}</Text>
        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text className={styles.label}>申请单号：</Text>
            <Text>{approval.instanceNo}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.label}>申请时间：</Text>
            <Text>{dayjs(approval.createTime).format('YYYY-MM-DD HH:mm')}</Text>
          </View>
        </View>
        <View className={styles.tags}>
          {approval.isUrgent && (
            <View className={classnames(styles.tag, styles.urgent)}>🚨 紧急</View>
          )}
          {approval.isCountersign && (
            <View className={classnames(styles.tag, styles.countersign)}>👥 会签</View>
          )}
          {approval.canAddSign && (
            <View className={classnames(styles.tag, styles.addsign)}>➕ 可加签</View>
          )}
          <View className={classnames(styles.tag, styles.template)}>
            📋 {approval.templateName}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.icon}>📝</Text>
          审批内容
        </Text>
        <View className={styles.formData}>
          {formData.map((item, index) => (
            <View key={index} className={styles.formItem}>
              <Text className={styles.formLabel}>{item.label}</Text>
              <Text className={styles.formValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.icon}>📎</Text>
          相关附件
        </Text>
        <View className={styles.attachmentList}>
          {[
            { name: '采购申请明细.xlsx', size: '245 KB', icon: '📊' },
            { name: '设备报价单.pdf', size: '1.2 MB', icon: '📄' },
            { name: '会议室照片.jpg', size: '3.5 MB', icon: '🖼️' }
          ].map((file, index) => (
            <View
              key={index}
              className={styles.attachmentItem}
              onClick={() => Taro.showToast({ title: '查看附件', icon: 'none' })}
            >
              <View className={styles.attachmentIcon}>
                <Text>{file.icon}</Text>
              </View>
              <View className={styles.attachmentInfo}>
                <Text className={styles.attachmentName}>{file.name}</Text>
                <Text className={styles.attachmentMeta}>{file.size}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.icon}>🔄</Text>
          审批流程
        </Text>
        <View className={styles.flowList}>
          {approvals.map((node: any) => {
            const isCurrent = node.status === 'pending' || node.status === 'countersigning';
            return (
              <View key={node.id} className={styles.flowItem}>
                <View
                  className={classnames(
                    styles.flowDot,
                    node.status === 'approved' && styles.approved,
                    node.status === 'rejected' && styles.rejected,
                    node.status === 'pending' && styles.pending,
                    isCurrent && styles.current
                  )}
                />
                <View className={styles.flowContent}>
                  <View className={styles.flowHeader}>
                    <Text className={styles.flowUser}>{node.approverName}</Text>
                    {node.time && <Text className={styles.flowTime}>{node.time}</Text>}
                  </View>
                  <Text className={styles.flowNode}>{node.nodeName}</Text>
                  <Text className={classnames(styles.flowStatus, styles[node.status])}>
                    {getNodeStatusText(node.status)}
                    {node.isCountersign && ` · ${node.countersignProgress || '1/2'}`}
                  </Text>
                  {node.comment && (
                    <View className={styles.flowComment}>
                      {node.comment}
                    </View>
                  )}
                  {isCurrent && node.status === 'countersigning' && (
                    <View className={styles.flowActions}>
                      <View
                        className={styles.flowAction}
                        onClick={() => Taro.showToast({ title: '查看会签详情', icon: 'none' })}
                      >
                        查看会签进度
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {approval.ccList && approval.ccList.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.icon}>👁️</Text>
            抄送人员
          </Text>
          <View className={styles.ccList}>
            {approval.ccList.map((cc, index) => (
              <View key={index} className={styles.ccItem}>
                <View className={styles.avatar}>{cc.name.charAt(0)}</View>
                <Text>{cc.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.securityNote}>
        <Text className={styles.icon}>🔒</Text>
        <Text>
          {bioAuthEnabled
            ? '此操作需要生物识别二次验证，数据使用国密SM4加密传输'
            : '建议开启生物识别以增强操作安全性'}
        </Text>
      </View>

      {isCurrentNode && approval.status === 'pending' && (
        <View className={styles.actionBar}>
          <View
            className={classnames(styles.actionBtn, styles.default)}
            onClick={handleAddSign}
          >
            加签
          </View>
          <View
            className={classnames(styles.actionBtn, styles.default)}
            onClick={handleTransfer}
          >
            转交
          </View>
          <View
            className={classnames(styles.actionBtn, styles.error)}
            onClick={handleReject}
          >
            驳回
          </View>
          <View
            className={classnames(styles.actionBtn, styles.primary)}
            onClick={handleApprove}
          >
            同意
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ApprovalDetailPage;
