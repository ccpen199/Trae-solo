<template>
  <div class="overview" v-if="!loading">
    <h2 class="page-title">数据概览</h2>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon user-icon">
            <el-icon><user /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.users || 0 }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon question-icon">
            <el-icon><help-filled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.questions || 0 }}</div>
            <div class="stat-label">总问题数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon article-icon">
            <el-icon><document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.articles || 0 }}</div>
            <div class="stat-label">总文章数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon report-icon">
            <el-icon><warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingReports || 0 }}</div>
            <div class="stat-label">待处理举报</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <div class="content-card">
          <div class="card-header">
            <h3>最新问题</h3>
            <el-button type="primary" link @click="goToQuestions">查看全部</el-button>
          </div>
          <div class="content-list">
            <div class="content-item" v-for="item in latestQuestions" :key="item.id">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <el-empty v-if="latestQuestions.length === 0" description="暂无数据" />
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="content-card">
          <div class="card-header">
            <h3>最新文章</h3>
            <el-button type="primary" link @click="goToArticles">查看全部</el-button>
          </div>
          <div class="content-list">
            <div class="content-item" v-for="item in latestArticles" :key="item.id">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <el-empty v-if="latestArticles.length === 0" description="暂无数据" />
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="24">
        <div class="content-card">
          <div class="card-header">
            <h3>最新举报</h3>
            <el-button type="primary" link @click="goToReports">查看全部</el-button>
          </div>
          <el-table :data="latestReports" v-if="latestReports.length > 0" style="width: 100%">
            <el-table-column prop="reporter_username" label="举报人" width="120" />
            <el-table-column prop="target_type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.target_type === 'question' ? 'primary' : 'success'" size="small">
                  {{ scope.row.target_type === 'question' ? '问题' : '文章' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" width="150" />
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无数据" />
        </div>
      </el-col>
    </el-row>
  </div>

  <div v-if="loading" class="loading-container">
    <el-skeleton :count="5" animated />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { User, HelpFilled, Document, Warning } from '@element-plus/icons-vue';
import { adminApi } from '@/api';

const router = useRouter();

const loading = ref(true);
const stats = ref({});
const latestQuestions = ref([]);
const latestArticles = ref([]);
const latestReports = ref([]);

const loadStats = async () => {
  try {
    const response = await adminApi.getStats();
    if (response.data?.success) {
      const data = response.data.data || {};
      stats.value = data.stats || {};
      latestQuestions.value = data.latestQuestions || [];
      latestArticles.value = data.latestArticles || [];
      latestReports.value = data.latestReports || [];
    }
  } catch (err) {
    console.error('Load stats error:', err);
  } finally {
    loading.value = false;
  }
};

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'resolved': 'success',
    'rejected': 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    'pending': '待处理',
    'resolved': '已解决',
    'rejected': '已驳回'
  };
  return map[status] || status;
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString();
};

const goToQuestions = () => {
  router.push('/questions');
};

const goToArticles = () => {
  router.push('/articles');
};

const goToReports = () => {
  router.push('/admin/reports');
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.overview {
  padding: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 20px 0;
  color: #303133;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.question-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.article-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.report-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.content-row {
  margin-bottom: 20px;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: #303133;
}

.content-list {
  min-height: 200px;
}

.content-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.content-item:last-child {
  border-bottom: none;
}

.item-title {
  flex: 1;
  color: #303133;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.item-time {
  color: #909399;
  font-size: 13px;
  flex-shrink: 0;
}

.loading-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
</style>
