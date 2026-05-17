<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()

const loading = ref(true)
const stats = ref({
  users: 0,
  doctors: 0,
  hospitals: 0,
  pets: 0,
  consultations: 0,
  posts: 0
})

const fetchStats = async () => {
  if (!userStore.isLoggedIn || userStore.user.role !== 'admin') return
  try {
    loading.value = true
    const res = await request.get('/admin/stats')
    stats.value = res.data
  } catch (err) {
    console.error('Fetch stats error:', err)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <Layout>
    <div class="admin-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">管理后台</h1>
        </div>

        <div v-if="!userStore.isLoggedIn || userStore.user.role !== 'admin'" class="empty-state">
          <el-empty description="无权限访问">
            <el-button type="primary" @click="$router.push('/home')">返回首页</el-button>
          </el-empty>
        </div>

        <template v-else>
          <el-skeleton v-if="loading" :rows="3" animated />

          <template v-else>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon user">
                  <el-icon><User /></el-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ stats.users }}</span>
                  <span class="stat-label">用户总数</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon doctor">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ stats.doctors }}</span>
                  <span class="stat-label">医生总数</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon hospital">
                  <el-icon><OfficeBuilding /></el-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ stats.hospitals }}</span>
                  <span class="stat-label">合作医院</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon pet">
                  <el-icon><Memo /></el-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ stats.pets }}</span>
                  <span class="stat-label">宠物档案</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon consultation">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ stats.consultations }}</span>
                  <span class="stat-label">问诊记录</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon post">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ stats.posts }}</span>
                  <span class="stat-label">社区帖子</span>
                </div>
              </div>
            </div>

            <div class="admin-actions">
              <h3>快捷管理</h3>
              <div class="action-list">
                <el-button type="primary" size="large">
                  <el-icon><User /></el-icon>
                  用户管理
                </el-button>
                <el-button type="primary" size="large">
                  <el-icon><UserFilled /></el-icon>
                  医生管理
                </el-button>
                <el-button type="primary" size="large">
                  <el-icon><OfficeBuilding /></el-icon>
                  医院管理
                </el-button>
                <el-button type="primary" size="large">
                  <el-icon><ChatDotRound /></el-icon>
                  问诊管理
                </el-button>
                <el-button type="primary" size="large">
                  <el-icon><Document /></el-icon>
                  内容审核
                </el-button>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.admin-page {
  min-height: 80vh;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-icon.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.doctor {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon.hospital {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.stat-icon.pet {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.consultation {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.post {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #909399;
}

.admin-actions {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.admin-actions h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px;
}

.action-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
