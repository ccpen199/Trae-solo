<template>
  <div>
    <h2 style="margin-bottom: 20px;">通知中心</h2>
    
    <el-card>
      <template #header>
        <div class="table-header">
          <el-tabs v-model="activeTab" @tab-click="handleTabChange">
            <el-tab-pane label="全部通知" name="all" />
            <el-tab-pane label="未读通知" name="unread" />
            <el-tab-pane label="已读通知" name="read" />
          </el-tabs>
          <div>
            <el-button type="primary" size="small" @click="markAllAsRead">
              全部标记已读
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="notifications" v-loading="loading" stripe>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getNotificationTypeTag(row.type)" size="small">
              {{ getNotificationTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip />
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'" size="small">
              {{ row.priority === 'high' ? '高' : row.priority === 'medium' ? '中' : '低' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'info' : 'success'" size="small">
              {{ row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发送时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
            <template v-if="!row.isRead">
              <el-button type="primary" link size="small" @click="markAsRead(row)">标为已读</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <el-dialog v-model="showDetailDialog" title="通知详情" width="600px">
      <el-descriptions :column="2" border v-if="currentNotification">
        <el-descriptions-item label="通知类型">
          <el-tag :type="getNotificationTypeTag(currentNotification.type)" size="small">
            {{ getNotificationTypeName(currentNotification.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="currentNotification.priority === 'high' ? 'danger' : currentNotification.priority === 'medium' ? 'warning' : 'info'" size="small">
            {{ currentNotification.priority === 'high' ? '高' : currentNotification.priority === 'medium' ? '中' : '低' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ currentNotification.title }}</el-descriptions-item>
        <el-descriptions-item label="发送时间">{{ formatTime(currentNotification.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentNotification.isRead ? 'info' : 'success'" size="small">
            {{ currentNotification.isRead ? '已读' : '未读' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <div style="background: #f5f7fa; padding: 20px; border-radius: 4px;">
        <h4 style="margin-bottom: 10px;">通知内容：</h4>
        <p>{{ currentNotification.content }}</p>
      </div>
      <template v-if="currentNotification?.relatedLink">
        <el-divider />
        <div style="text-align: center;">
          <el-button type="primary" @click="goToRelated">查看相关内容</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import dayjs from 'dayjs';

const loading = ref(false);
const showDetailDialog = ref(false);
const currentNotification = ref(null);
const activeTab = ref('all');

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const notifications = ref([]);

const getNotificationTypeTag = (type) => {
  const tags = {
    system: 'info',
    violation: 'danger',
    inspection: 'warning',
    rectification: 'primary',
    compliance: 'success',
    report: 'info',
  };
  return tags[type] || 'info';
};

const getNotificationTypeName = (type) => {
  const names = {
    system: '系统通知',
    violation: '超标预警',
    inspection: '核查通知',
    rectification: '整改通知',
    compliance: '合规通知',
    report: '报告通知',
  };
  return names[type] || type;
};

const formatTime = (time) => {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

const loadNotifications = async () => {
  loading.value = true;
  try {
    const params = {
      isRead: activeTab.value === 'unread' ? false : activeTab.value === 'read' ? true : undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: '-createdAt',
    };
    const res = await request({
      url: '/notifications',
      method: 'get',
      params,
    });
    notifications.value = res.data || [];
    pagination.total = res.total || notifications.value.length;
  } catch (error) {
    console.error('加载通知列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  pagination.page = 1;
  loadNotifications();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  loadNotifications();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  loadNotifications();
};

const viewDetail = async (row) => {
  currentNotification.value = row;
  showDetailDialog.value = true;
  
  if (!row.isRead) {
    try {
      await request({
        url: `/notifications/${row.id}/read`,
        method: 'put',
      });
      row.isRead = true;
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }
};

const markAsRead = async (row) => {
  try {
    await request({
      url: `/notifications/${row.id}/read`,
      method: 'put',
    });
    row.isRead = true;
    ElMessage.success('标记已读成功');
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await request({
      url: '/notifications/read-all',
      method: 'put',
    });
    notifications.value.forEach(n => n.isRead = true);
    ElMessage.success('全部标记已读成功');
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

const goToRelated = () => {
  showDetailDialog.value = false;
  ElMessage.info('正在跳转...');
};

onMounted(() => {
  loadNotifications();
});
</script>
