<template>
  <Layout>
    <div class="consultations-page">
      <div class="page-header">
        <h2>我的咨询</h2>
        <el-tabs v-model="activeTab" class="status-tabs" @tab-change="handleTabChange">
          <el-tab-pane label="全部" name=""></el-tab-pane>
          <el-tab-pane label="进行中" name="pending"></el-tab-pane>
          <el-tab-pane label="已完成" name="completed"></el-tab-pane>
        </el-tabs>
      </div>

      <div v-loading="loading" class="consultations-list">
        <el-empty v-if="!loading && consultations.length === 0" description="暂无咨询记录">
          <el-button type="primary" @click="$router.push('/doctors')">去咨询医生</el-button>
        </el-empty>

        <div
          v-for="item in consultations"
          :key="item.id"
          class="consultation-card"
          @click="goToDetail(item.id)"
        >
          <div class="card-left">
            <el-avatar :size="60" class="doctor-avatar">
              {{ item.doctor_name?.charAt(0) || '医' }}
            </el-avatar>
            <div class="consultation-info">
              <div class="doctor-header">
                <span class="doctor-name">{{ item.doctor_name }}</span>
                <el-tag :type="getStatusType(item.status)" size="small" class="status-tag">
                  {{ getStatusText(item.status) }}
                </el-tag>
              </div>
              <div class="doctor-dept">{{ item.department }}</div>
              <div class="consultation-type">
                {{ getTypeText(item.type) }}
              </div>
              <div class="last-message">
                {{ item.question || '暂无描述' }}
              </div>
              <div class="consultation-time">
                {{ formatTime(item.created_at) }}
              </div>
            </div>
          </div>
          <div class="card-right">
            <el-badge v-if="item.unread_count > 0" :value="item.unread_count" class="unread-badge" />
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadConsultations"
        class="pagination"
      />
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue';
import Layout from '../components/Layout.vue';
import request from '../utils/request';

const router = useRouter();
const loading = ref(false);
const consultations = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const activeTab = ref('');

const loadConsultations = async () => {
  loading.value = true;
  try {
    const res = await request.get('/consultations', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        status: activeTab.value || undefined
      }
    });
    if (res.success) {
      consultations.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error('加载咨询列表失败');
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  page.value = 1;
  loadConsultations();
};

const goToDetail = (id) => {
  router.push(`/consultations/${id}`);
};

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    pending: '待回复',
    processing: '咨询中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status] || status;
};

const getTypeText = (type) => {
  const map = {
    image: '图文咨询',
    phone: '电话咨询',
    video: '视频咨询'
  };
  return map[type] || type;
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return date.toLocaleDateString();
};

onMounted(() => {
  loadConsultations();
});
</script>

<style scoped>
.consultations-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
}

.status-tabs {
  border-bottom: 1px solid #e4e7ed;
}

.consultations-list {
  min-height: 400px;
}

.consultation-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
}

.consultation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-left {
  display: flex;
  gap: 16px;
  flex: 1;
}

.doctor-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.consultation-info {
  flex: 1;
}

.doctor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.doctor-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.status-tag {
  margin-left: auto;
}

.doctor-dept {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.consultation-type {
  display: inline-block;
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

.last-message {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 500px;
}

.consultation-time {
  font-size: 12px;
  color: #c0c4cc;
}

.card-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unread-badge {
  margin-right: 8px;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
