import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import OrgTree from '@/components/OrgTree';
import { organizationService } from '@/services/organizationService';
import { Organization, Employee, OrgSyncRecord } from '@/types/organization';
import styles from './index.module.scss';

type ViewMode = 'tree' | 'employee';

const ContactsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orgTree, setOrgTree] = useState<Organization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [syncRecords, setSyncRecords] = useState<OrgSyncRecord[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [treeRes, empRes, syncRes] = await Promise.all([
        organizationService.getOrganizationTree(),
        organizationService.getEmployeeList('1', 1, 20),
        organizationService.getSyncRecords()
      ]);

      setOrgTree(treeRes);
      setEmployees(empRes.list);
      setSyncRecords(syncRes.list.slice(0, 1));
    } catch (error) {
      console.error('加载通讯录数据失败', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData();
  });

  const handleSync = async () => {
    Taro.showLoading({ title: '同步中...' });
    try {
      await organizationService.syncFromHR();
      Taro.showToast({ title: '同步成功', icon: 'success' });
      loadData();
    } catch (error) {
      Taro.showToast({ title: '同步失败', icon: 'error' });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone });
  };

  const handleChat = (employee: Employee) => {
    Taro.navigateTo({ url: `/pages/chat/index?sessionId=${employee.id}` });
  };

  const handleOrgClick = (node: Organization) => {
    Taro.navigateTo({ url: `/pages/organization-detail/index?id=${node.id}` });
  };

  const latestSync = syncRecords[0];

  const filteredEmployees = useMemo(() => {
    if (!searchKeyword) return employees;
    const keyword = searchKeyword.toLowerCase();
    return employees.filter(e =>
      e.name.toLowerCase().includes(keyword) ||
      e.departmentName.toLowerCase().includes(keyword) ||
      e.position.toLowerCase().includes(keyword)
    );
  }, [employees, searchKeyword]);

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchInput}>
          <Text className={styles.icon}>🔍</Text>
          <Input
            className={styles.searchInputField}
            placeholder="搜索部门或同事"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.quickActions}>
        <View
          className={styles.quickAction}
          onClick={() => setViewMode('tree')}
        >
          <Text className={styles.icon}>🏢</Text>
          <Text className={styles.text}>组织架构</Text>
        </View>
        <View
          className={styles.quickAction}
          onClick={() => setViewMode('employee')}
        >
          <Text className={styles.icon}>👥</Text>
          <Text className={styles.text}>全部人员</Text>
        </View>
        <View
          className={styles.quickAction}
          onClick={() => Taro.showToast({ title: '常用联系人', icon: 'none' })}
        >
          <Text className={styles.icon}>⭐</Text>
          <Text className={styles.text}>常用联系</Text>
        </View>
        <View
          className={styles.quickAction}
          onClick={() => Taro.showToast({ title: '我的群组', icon: 'none' })}
        >
          <Text className={styles.icon}>👨‍👩‍👧‍👦</Text>
          <Text className={styles.text}>我的群组</Text>
        </View>
      </View>

      {latestSync && (
        <View className={styles.content}>
          <View className={styles.syncInfo}>
            <View className={`${styles.status} ${latestSync.status}`} />
            <Text className={styles.text}>
              上次同步：{latestSync.syncTime} · 同步{latestSync.status === 'success' ? '成功' : '失败'}
            </Text>
            <View className={styles.syncBtn} onClick={handleSync}>立即同步</View>
          </View>
        </View>
      )}

      <ScrollView
        className={styles.content}
        scrollY
        enhanced
        showScrollbar={false}
      >
        {viewMode === 'tree' ? (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>组织架构</Text>
              <Text className={styles.sectionCount}>共3级组织</Text>
            </View>
            <OrgTree
              data={orgTree}
              onNodeClick={handleOrgClick}
              defaultExpandLevel={1}
            />
          </View>
        ) : (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>全部人员</Text>
              <Text className={styles.sectionCount}>{employees.length}人</Text>
            </View>
            {filteredEmployees.length > 0 ? (
              <View className={styles.employeeList}>
                {filteredEmployees.map(employee => (
                  <View key={employee.id} className={styles.employeeItem}>
                    <View className={styles.employeeAvatar}>
                      {employee.name.charAt(0)}
                    </View>
                    <View className={styles.employeeInfo}>
                      <View className={styles.employeeName}>
                        {employee.name}
                        <View className={employee.status === 'on' ? styles.online : styles.offline} />
                      </View>
                      <View className={styles.employeeMeta}>
                        <Text className={styles.employeeDept}>{employee.departmentName}</Text>
                        <Text className={styles.employeePosition}>{employee.position}</Text>
                        <Text className={styles.employeePhone}>📱 {employee.phone}</Text>
                      </View>
                    </View>
                    <View className={styles.actionBtns}>
                      <View
                        className={`${styles.actionBtn} ${styles.call}`}
                        onClick={() => handleCall(employee.phone)}
                      >
                        📞
                      </View>
                      <View
                        className={`${styles.actionBtn} ${styles.msg}`}
                        onClick={() => handleChat(employee)}
                      >
                        💬
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>暂无人员数据</View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ContactsPage;
