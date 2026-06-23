import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { useRouter, usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { organizationService } from '@/services/organizationService';
import { Organization, Employee, OrgSyncRecord, OrgLevel } from '@/types/organization';
import { useUserStore } from '@/store/useUserStore';
import styles from './index.module.scss';

const levelNames: Record<OrgLevel, string> = {
  province: '省公司',
  city: '市公司',
  team: '班组'
};

const levelIcons: Record<OrgLevel, string> = {
  province: '🏛️',
  city: '🏢',
  team: '👥'
};

const statusNames: Record<string, string> = {
  on: '在线',
  off: '离线',
  busy: '忙碌'
};

const OrganizationDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;
  const { checkPermission } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orgDetail, setOrgDetail] = useState<Organization | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [syncRecords, setSyncRecords] = useState<OrgSyncRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [breadcrumb, setBreadcrumb] = useState<Organization[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const [org, empRes, syncRes] = await Promise.all([
        organizationService.getOrgDetail(id),
        organizationService.getOrgEmployees(id, 1, 50),
        organizationService.getSyncRecords(1, 5)
      ]);

      setOrgDetail(org);
      setEmployees(empRes.list);
      setSyncRecords(syncRes.list);
      
      const path = await buildBreadcrumb(org);
      setBreadcrumb(path);
      
      Taro.setNavigationBarTitle({ title: org.name });
    } catch (error) {
      console.error('加载组织详情失败', error);
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, [id]);

  const buildBreadcrumb = async (org: Organization): Promise<Organization[]> => {
    const path: Organization[] = [org];
    
    if (org.parentId) {
      try {
        const parent = await organizationService.getOrgDetail(org.parentId);
        const parentPath = await buildBreadcrumb(parent);
        return [...parentPath, org];
      } catch (e) {
        return path;
      }
    }
    
    return path;
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData();
  });

  const filteredEmployees = useMemo(() => {
    switch (activeFilter) {
      case 'online':
        return employees.filter(e => e.status === 'on');
      case 'leader':
        return employees.filter(e => e.isLeader);
      case 'offline':
        return employees.filter(e => e.status === 'off');
      default:
        return employees;
    }
  }, [employees, activeFilter]);

  const canManageSync = useMemo(() => {
    return checkPermission('org:sync');
  }, [checkPermission]);

  const handleCall = (phone: string) => {
    Taro.showActionSheet({
      itemList: [`拨打 ${phone}`, '发送短信', '复制号码'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            Taro.makePhoneCall({ phoneNumber: phone });
            break;
          case 1:
            Taro.showToast({ title: '短信功能开发中', icon: 'none' });
            break;
          case 2:
            Taro.setClipboardData({ data: phone });
            Taro.showToast({ title: '号码已复制', icon: 'success' });
            break;
        }
      }
    });
  };

  const handleChat = (employee: Employee) => {
    Taro.navigateTo({
      url: `/pages/chat/index?userId=${employee.id}&userName=${encodeURIComponent(employee.name)}`
    });
  };

  const handleSubOrgClick = (subOrg: Organization) => {
    Taro.navigateTo({
      url: `/pages/organization-detail/index?id=${subOrg.id}`
    });
  };

  const handleSync = async () => {
    Taro.showModal({
      title: '同步组织数据',
      content: '确定要从HR系统同步组织数据吗？',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '同步中...' });
          try {
            await organizationService.triggerSync('incremental');
            Taro.hideLoading();
            Taro.showToast({ title: '同步成功', icon: 'success' });
            loadData();
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '同步失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleBreadcrumbClick = (org: Organization, index: number) => {
    if (index === breadcrumb.length - 1) return;
    
    Taro.redirectTo({
      url: `/pages/organization-detail/index?id=${org.id}`
    });
  };

  const handleEmployeeClick = (employee: Employee) => {
    Taro.showActionSheet({
      itemList: [
        `拨打 ${employee.phone}`,
        '发送消息',
        '查看详情'
      ],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            Taro.makePhoneCall({ phoneNumber: employee.phone });
            break;
          case 1:
            handleChat(employee);
            break;
          case 2:
            Taro.showToast({ title: '详情功能开发中', icon: 'none' });
            break;
        }
      }
    });
  };

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>加载中...</View>
      </View>
    );
  }

  if (!orgDetail) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>组织不存在</View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView
        scrollY
        enhanced
        showScrollbar={false}
      >
        <View className={styles.breadcrumb}>
          {breadcrumb.map((org, index) => (
            <React.Fragment key={org.id}>
              {index > 0 && (
                <Text className={styles.breadcrumbSeparator}>/</Text>
              )}
              <View
                className={classnames(
                  styles.breadcrumbItem,
                  index === breadcrumb.length - 1 && styles.current
                )}
                onClick={() => handleBreadcrumbClick(org, index)}
              >
                <Text>{org.name}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View className={styles.headerCard}>
          <View className={styles.orgInfo}>
            <View className={classnames(styles.orgIcon, styles[orgDetail.level])}>
              <Text>{levelIcons[orgDetail.level]}</Text>
            </View>
            <View className={styles.orgBasic}>
              <Text className={styles.orgName}>{orgDetail.name}</Text>
              <View className={styles.orgMeta}>
                <View className={classnames(styles.orgLevelTag, styles[orgDetail.level])}>
                  {levelNames[orgDetail.level]}
                </View>
                <Text className={styles.orgCode}>编码：{orgDetail.code}</Text>
                <View className={classnames(styles.syncStatus, styles[orgDetail.syncStatus])}>
                  <Text>●</Text>
                  <Text>
                    {orgDetail.syncStatus === 'synced' && '已同步'}
                    {orgDetail.syncStatus === 'syncing' && '同步中'}
                    {orgDetail.syncStatus === 'failed' && '同步失败'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{orgDetail.children?.length || 0}</Text>
              <Text className={styles.statLabel}>下属组织</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{orgDetail.memberCount}</Text>
              <Text className={styles.statLabel}>成员数量</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{employees.filter(e => e.isLeader).length}</Text>
              <Text className={styles.statLabel}>管理人员</Text>
            </View>
          </View>
        </View>

        <View className={styles.leaderSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>组织负责人</Text>
          </View>
          
          {orgDetail.leaderId && employees.find(e => e.id === orgDetail.leaderId) ? (
            <View className={styles.leaderCard}>
              <View className={styles.leaderAvatar}>
                <Text>{orgDetail.leaderName?.charAt(0) || '负'}</Text>
                <View className={classnames(
                  styles.leaderStatus,
                  styles[employees.find(e => e.id === orgDetail.leaderId)?.status || 'off']
                )} />
              </View>
              <View className={styles.leaderInfo}>
                <Text className={styles.leaderName}>{orgDetail.leaderName}</Text>
                <Text className={styles.leaderPosition}>
                  {employees.find(e => e.id === orgDetail.leaderId)?.position || '负责人'}
                </Text>
                <View className={styles.leaderContact}>
                  <Text className={styles.contactTag}>
                    {statusNames[employees.find(e => e.id === orgDetail.leaderId)?.status || 'off']}
                  </Text>
                  <Text className={styles.contactTag}>
                    工号：{employees.find(e => e.id === orgDetail.leaderId)?.workNo || '-'}
                  </Text>
                </View>
              </View>
              <View className={styles.leaderActions}>
                <View
                  className={classnames(styles.actionBtn, styles.call)}
                  onClick={() => handleCall(
                    employees.find(e => e.id === orgDetail.leaderId)?.phone || ''
                  )}
                >
                  <Text>📞</Text>
                </View>
                <View
                  className={classnames(styles.actionBtn, styles.chat)}
                  onClick={() => {
                    const leader = employees.find(e => e.id === orgDetail.leaderId);
                    if (leader) handleChat(leader);
                  }}
                >
                  <Text>💬</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className={styles.emptyState}>暂无负责人信息</View>
          )}
        </View>

        {orgDetail.children && orgDetail.children.length > 0 && (
          <View className={styles.subOrgSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                下属组织 ({orgDetail.children.length})
              </Text>
            </View>
            
            <View className={styles.subOrgList}>
              {orgDetail.children.map(subOrg => (
                <View
                  key={subOrg.id}
                  className={styles.subOrgItem}
                  onClick={() => handleSubOrgClick(subOrg)}
                >
                  <View className={classnames(styles.subOrgIcon, styles[subOrg.level])}>
                    <Text>{levelIcons[subOrg.level]}</Text>
                  </View>
                  <View className={styles.subOrgInfo}>
                    <Text className={styles.subOrgName}>{subOrg.name}</Text>
                    <Text className={styles.subOrgMeta}>
                      {levelNames[subOrg.level]} · {subOrg.memberCount}人 · 
                      负责人：{subOrg.leaderName}
                    </Text>
                  </View>
                  <Text className={styles.subOrgArrow}>›</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.membersSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              成员列表 ({filteredEmployees.length}/{employees.length})
            </Text>
          </View>
          
          <View className={styles.membersFilter}>
            {[
              { key: 'all', label: '全部' },
              { key: 'online', label: '在线' },
              { key: 'leader', label: '负责人' },
              { key: 'offline', label: '离线' }
            ].map(filter => (
              <View
                key={filter.key}
                className={classnames(
                  styles.filterTag,
                  activeFilter === filter.key && styles.active
                )}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </View>
            ))}
          </View>
          
          {filteredEmployees.length > 0 ? (
            <View className={styles.membersList}>
              {filteredEmployees.map(employee => (
                <View
                  key={employee.id}
                  className={styles.memberItem}
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <View className={styles.memberAvatar}>
                    <Text>{employee.name.charAt(0)}</Text>
                    <View className={classnames(
                      styles.memberStatus,
                      styles[employee.status]
                    )} />
                  </View>
                  <View className={styles.memberInfo}>
                    <View className={styles.memberName}>
                      <Text>{employee.name}</Text>
                      {employee.isLeader && (
                        <View className={styles.leaderBadge}>负责人</View>
                      )}
                    </View>
                    <Text className={styles.memberPosition}>
                      {employee.position} · {statusNames[employee.status]}
                    </Text>
                  </View>
                  <View className={styles.memberActions}>
                    <View
                      className={styles.memberActionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(employee.phone);
                      }}
                    >
                      <Text>📞</Text>
                    </View>
                    <View
                      className={styles.memberActionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChat(employee);
                      }}
                    >
                      <Text>💬</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>暂无成员数据</View>
          )}
        </View>

        {canManageSync && (
          <View className={styles.syncSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>HR系统同步</Text>
              <Text
                className={styles.sectionMore}
                onClick={() => Taro.showToast({ title: '查看全部记录', icon: 'none' })}
              >
                全部记录 →
              </Text>
            </View>
            
            <View className={styles.syncInfo}>
              <View className={styles.syncInfoLeft}>
                <Text className={styles.syncTime}>
                  最后同步：{dayjs(orgDetail.lastSyncTime).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
                <Text className={styles.syncCount}>
                  本次同步：新增 0 人，更新 {employees.length} 人，删除 0 人
                </Text>
              </View>
              <View className={styles.syncBtn} onClick={handleSync}>
                <Text>🔄</Text>
                <Text>立即同步</Text>
              </View>
            </View>
            
            <View className={styles.syncRecords}>
              {syncRecords.map(record => (
                <View key={record.id} className={styles.syncRecordItem}>
                  <View className={classnames(
                    styles.syncRecordIcon,
                    styles[record.status]
                  )}>
                    <Text>{record.status === 'success' ? '✅' : '❌'}</Text>
                  </View>
                  <View className={styles.syncRecordInfo}>
                    <Text className={styles.syncRecordTitle}>
                      {record.syncType === 'full' ? '全量同步' : '增量同步'} · {record.operator}
                    </Text>
                    <Text className={styles.syncRecordMeta}>
                      {dayjs(record.syncTime).format('YYYY-MM-DD HH:mm')} · 
                      新增{record.addCount} 更新{record.updateCount} 删除{record.deleteCount}
                    </Text>
                  </View>
                  <View className={classnames(
                    styles.syncRecordStatus,
                    styles[record.status]
                  )}>
                    {record.status === 'success' ? '成功' : '失败'}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OrganizationDetailPage;
