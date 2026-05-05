<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon user">
              <el-icon size="36"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.userCount }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon role">
              <el-icon size="36"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.roleCount }}</div>
              <div class="stat-label">角色总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon org">
              <el-icon size="36"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.orgCount }}</div>
              <div class="stat-label">组织总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon log">
              <el-icon size="36"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.logCount }}</div>
              <div class="stat-label">今日操作</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快速入口</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="8">
              <router-link to="/users">
                <div class="quick-item">
                  <div class="quick-icon">
                    <el-icon size="32" color="#409eff"><User /></el-icon>
                  </div>
                  <div class="quick-text">用户管理</div>
                </div>
              </router-link>
            </el-col>
            <el-col :span="8">
              <router-link to="/roles">
                <div class="quick-item">
                  <div class="quick-icon">
                    <el-icon size="32" color="#67c23a"><UserFilled /></el-icon>
                  </div>
                  <div class="quick-text">角色管理</div>
                </div>
              </router-link>
            </el-col>
            <el-col :span="8">
              <router-link to="/logs">
                <div class="quick-item">
                  <div class="quick-icon">
                    <el-icon size="32" color="#e6a23c"><Document /></el-icon>
                  </div>
                  <div class="quick-text">操作日志</div>
                </div>
              </router-link>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统名称">用户权限管理系统</el-descriptions-item>
            <el-descriptions-item label="当前用户">{{ userStore.userInfo?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户角色">
              <el-tag v-for="role in userStore.roles" :key="role.id" size="small" style="margin-right: 4px">
                {{ role.name }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="前端端口">21225</el-descriptions-item>
            <el-descriptions-item label="后端端口">12254</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const stats = reactive({
  userCount: 0,
  roleCount: 0,
  orgCount: 0,
  logCount: 0
})
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.stat-card {
  cursor: pointer;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
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

.stat-icon.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.role {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.org {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.log {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.quick-item:hover {
  background-color: #f5f7fa;
}

.quick-icon {
  margin-bottom: 8px;
}

.quick-text {
  font-size: 14px;
  color: #606266;
}

a {
  text-decoration: none;
}
</style>
