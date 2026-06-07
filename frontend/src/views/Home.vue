<template>
  <div class="home-page">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <div>
              <h2>欢迎回来，{{ userStore.userInfo?.realName || userStore.userInfo?.username }}！</h2>
              <p>今天是 {{ currentDate }}，祝您办事顺利</p>
            </div>
            <div class="quick-actions">
              <el-button type="primary" size="large" @click="$router.push('/items')">
                <el-icon><Search /></el-icon>
                查找服务事项
              </el-button>
              <el-button size="large" @click="$router.push('/applications')">
                <el-icon><Document /></el-icon>
                查看我的办件
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon blue">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ profileData.applicationCount || 0 }}</div>
            <div class="stat-label">我的办件</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon green">
            <el-icon :size="28"><Postcard /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ profileData.certificateCount || 0 }}</div>
            <div class="stat-label">电子证照</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon orange">
            <el-icon :size="28"><Stamp /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ sealCount }}</div>
            <div class="stat-label">电子印章</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon purple">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ profileData.police_verified ? '已实名' : '未实名' }}</div>
            <div class="stat-label">{{ userStore.userType === 'legal' ? '企业认证' : '公安实名' }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热门服务事项</span>
              <el-button type="primary" link @click="$router.push('/items')">查看全部</el-button>
            </div>
          </template>
          <div class="hot-items">
            <div 
              v-for="item in hotItems" 
              :key="item.id" 
              class="hot-item"
              @click="$router.push(`/items/${item.id}`)"
            >
              <div class="item-icon">
                <el-icon><Service /></el-icon>
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-dept">{{ item.department }}</div>
              </div>
              <el-tag type="success">{{ item.processing_time }}工作日</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近办件</span>
              <el-button type="primary" link @click="$router.push('/applications')">查看全部</el-button>
            </div>
          </template>
          <div v-if="recentApps.length > 0" class="recent-apps">
            <div v-for="app in recentApps" :key="app.id" class="recent-app">
              <div class="app-info">
                <div class="app-name">{{ app.item_name }}</div>
                <div class="app-time">{{ app.created_at }}</div>
              </div>
              <el-tag :type="getStatusType(app.status)">{{ getStatusText(app.status) }}</el-tag>
            </div>
          </div>
          <el-empty v-else description="暂无办件记录" :image-size="100" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import api from '@/utils/api';
import dayjs from 'dayjs';

const userStore = useUserStore();
const profileData = ref<any>({});
const hotItems = ref<any[]>([]);
const recentApps = ref<any[]>([]);
const sealCount = ref(0);

const currentDate = dayjs().format('YYYY年MM月DD日 dddd');

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  };
  return map[status] || 'info';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  };
  return map[status] || status;
};

const loadData = async () => {
  try {
    const profileRes = await api.get('/users/profile');
    if (profileRes.code === 200) {
      profileData.value = profileRes.data;
    }

    const itemsRes = await api.get('/items?pageSize=5');
    if (itemsRes.code === 200) {
      hotItems.value = itemsRes.data.list;
    }

    const appsRes = await api.get('/applications?pageSize=5');
    if (appsRes.code === 200) {
      recentApps.value = appsRes.data.list;
    }

    const sealsRes = await api.get('/seals');
    if (sealsRes.code === 200) {
      sealCount.value = sealsRes.data.length;
    }
  } catch (error) {
    console.error('加载数据失败', error);
  }
};

onMounted(() => {
  userStore.restoreUserInfo();
  loadData();
});
</script>

<style scoped>
.home-page {
  padding-bottom: 24px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
}

.welcome-content p {
  margin: 0;
  color: #64748b;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
}

.stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
.stat-icon.green { background: linear-gradient(135deg, #10b981, #34d399); }
.stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }

.stat-content {
  text-align: left;
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.hot-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.hot-item:hover {
  background: #f1f5f9;
}

.item-icon {
  width: 44px;
  height: 44px;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  margin-right: 12px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #1e293b;
}

.item-dept {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.recent-apps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-app {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.app-name {
  font-weight: 500;
  color: #1e293b;
}

.app-time {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}
</style>
