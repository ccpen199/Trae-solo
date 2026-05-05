<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="32"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.sites }}</div>
              <div class="stat-label">站点总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="32"><Menu /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.categories }}</div>
              <div class="stat-label">栏目总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.contents }}</div>
              <div class="stat-label">内容总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.users }}</div>
              <div class="stat-label">管理员数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>快捷入口</span>
          </template>
          <div class="quick-actions">
            <router-link to="/sites" class="quick-item">
              <el-icon size="36" color="#409EFF"><OfficeBuilding /></el-icon>
              <span>站点管理</span>
            </router-link>
            <router-link to="/categories" class="quick-item">
              <el-icon size="36" color="#67C23A"><Menu /></el-icon>
              <span>栏目管理</span>
            </router-link>
            <router-link to="/contents" class="quick-item">
              <el-icon size="36" color="#E6A23C"><Document /></el-icon>
              <span>内容管理</span>
            </router-link>
            <router-link to="/users" class="quick-item">
              <el-icon size="36" color="#909399"><User /></el-icon>
              <span>用户管理</span>
            </router-link>
            <router-link to="/roles" class="quick-item">
              <el-icon size="36" color="#F56C6C"><UserFilled /></el-icon>
              <span>角色管理</span>
            </router-link>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>系统信息</span>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="当前用户">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</el-descriptions-item>
            <el-descriptions-item label="用户角色">
              <el-tag v-for="role in userStore.userInfo?.roles" :key="role.id" size="small" style="margin-right: 5px">
                {{ role.name }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="超级管理员">
              <el-tag :type="userStore.isSuperAdmin ? 'success' : 'info'" size="small">
                {{ userStore.isSuperAdmin ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="登录时间">
              {{ new Date().toLocaleString() }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { request } from '@/utils/request'

const userStore = useUserStore()

const stats = reactive({
  sites: 0,
  categories: 0,
  contents: 0,
  users: 0
})

async function loadStats() {
  try {
    const [sites, users] = await Promise.all([
      request.get('/sites').catch(() => []),
      request.get('/users').catch(() => [])
    ])
    stats.sites = Array.isArray(sites) ? sites.length : 0
    stats.users = Array.isArray(users) ? users.length : 0
  } catch (e) {
    console.log('统计数据加载失败')
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    
    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
  
  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    
    .quick-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 30px;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      text-decoration: none;
      color: #606266;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409EFF;
        color: #409EFF;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      }
      
      span {
        font-size: 14px;
      }
    }
  }
}
</style>
