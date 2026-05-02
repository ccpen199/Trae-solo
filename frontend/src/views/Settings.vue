<template>
  <div class="settings-page">
    <div class="page-header mb-4">
      <h2 class="page-title">系统设置</h2>
      <p class="page-subtitle">管理个人信息和系统配置</p>
    </div>

    <el-row :gutter="24">
      <el-col :span="16">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header-title">
              <el-icon><User /></el-icon>
              个人信息
            </div>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">
              {{ userStore.user?.username || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="姓名">
              {{ userStore.user?.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="getRoleTagType(userStore.user?.role)">
                {{ getRoleLabel(userStore.user?.role) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ userStore.user?.email || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ userStore.user?.phone || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag type="success">
                {{ userStore.user?.status === 'active' ? '正常' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="mb-4">
          <template #header>
            <div class="card-header-title">
              <el-icon><Key /></el-icon>
              权限说明
            </div>
          </template>
          
          <div class="permissions-info">
            <el-alert
              :title="getRoleTitle(userStore.user?.role)"
              :type="getRoleAlertType(userStore.user?.role)"
              :closable="false"
              class="mb-4"
            >
              <template #default>
                {{ getRoleDescription(userStore.user?.role) }}
              </template>
            </el-alert>

            <el-table :data="permissionsTable" stripe border>
              <el-table-column prop="feature" label="功能模块" width="150" />
              <el-table-column prop="view" label="查看" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.view" style="color: #67c23a"><CircleCheck /></el-icon>
                  <el-icon v-else style="color: #c0c4cc"><CircleClose /></el-icon>
                </template>
              </el-table-column>
              <el-table-column prop="create" label="创建" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.create" style="color: #67c23a"><CircleCheck /></el-icon>
                  <el-icon v-else style="color: #c0c4cc"><CircleClose /></el-icon>
                </template>
              </el-table-column>
              <el-table-column prop="edit" label="编辑" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.edit" style="color: #67c23a"><CircleCheck /></el-icon>
                  <el-icon v-else style="color: #c0c4cc"><CircleClose /></el-icon>
                </template>
              </el-table-column>
              <el-table-column prop="delete" label="删除" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.delete" style="color: #67c23a"><CircleCheck /></el-icon>
                  <el-icon v-else style="color: #c0c4cc"><CircleClose /></el-icon>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header-title">
              <el-icon><InfoFilled /></el-icon>
              系统信息
            </div>
          </template>
          
          <div class="system-info">
            <div class="info-item">
              <span class="info-label">系统版本</span>
              <span class="info-value">1.0.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">后端端口</span>
              <span class="info-value">11621</span>
            </div>
            <div class="info-item">
              <span class="info-label">前端端口</span>
              <span class="info-value">11622</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据库</span>
              <span class="info-value">SQLite</span>
            </div>
            <div class="info-item">
              <span class="info-label">前端框架</span>
              <span class="info-value">Vue 3 + Vite</span>
            </div>
            <div class="info-item">
              <span class="info-label">后端框架</span>
              <span class="info-value">Express.js</span>
            </div>
          </div>
        </el-card>

        <el-card class="mb-4">
          <template #header>
            <div class="card-header-title">
              <el-icon><UserFilled /></el-icon>
              预设账号
            </div>
          </template>
          
          <div class="preset-accounts">
            <div
              v-for="account in presetAccounts"
              :key="account.username"
              class="account-item"
            >
              <div class="account-header">
                <div class="user-avatar" :style="{ background: account.color }">
                  {{ account.name.charAt(0) }}
                </div>
                <div class="account-info">
                  <div class="account-name">{{ account.name }}</div>
                  <div class="account-role">{{ account.roleLabel }}</div>
                </div>
              </div>
              <div class="account-creds">
                <span class="cred-label">账号：</span>
                <span class="cred-value">{{ account.username }}</span>
              </div>
              <div class="account-creds">
                <span class="cred-label">密码：</span>
                <span class="cred-value">123456</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <div class="card-header-title">
              <el-icon><Operation /></el-icon>
              快捷操作
            </div>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" @click="goToDashboard" block>
              <el-icon><Odometer /></el-icon>
              返回工作台
            </el-button>
            <el-button type="warning" @click="refreshUserData" block>
              <el-icon><Refresh /></el-icon>
              刷新用户信息
            </el-button>
            <el-button type="danger" @click="handleLogout" block>
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const presetAccounts = [
  { username: 'pm1', name: '张经理', role: 'project_manager', roleLabel: '项目经理', color: '#409eff' },
  { username: 'dev1', name: '李开发', role: 'member', roleLabel: '开发成员', color: '#67c23a' },
  { username: 'dev2', name: '王开发', role: 'member', roleLabel: '开发成员', color: '#67c23a' },
  { username: 'tester1', name: '赵测试', role: 'tester', roleLabel: '测试人员', color: '#e6a23c' },
  { username: 'customer1', name: '钱客户', role: 'customer', roleLabel: '客户代表', color: '#909399' },
  { username: 'manager1', name: '孙总监', role: 'management', roleLabel: '管理层', color: '#f56c6c' }
]

const getRoleLabel = (role) => {
  const labels = {
    project_manager: '项目经理',
    member: '开发成员',
    tester: '测试人员',
    customer: '客户代表',
    management: '管理层'
  }
  return labels[role] || role
}

const getRoleTagType = (role) => {
  const types = {
    project_manager: 'primary',
    member: 'success',
    tester: 'warning',
    customer: 'info',
    management: 'danger'
  }
  return types[role] || 'info'
}

const getRoleTitle = (role) => {
  const titles = {
    project_manager: '项目经理权限',
    member: '开发成员权限',
    tester: '测试人员权限',
    customer: '客户代表权限',
    management: '管理层权限'
  }
  return titles[role] || '未知权限'
}

const getRoleAlertType = (role) => {
  const types = {
    project_manager: 'primary',
    member: 'success',
    tester: 'warning',
    customer: 'info',
    management: 'danger'
  }
  return types[role] || 'info'
}

const getRoleDescription = (role) => {
  const descriptions = {
    project_manager: '拥有项目全生命周期管理权限，包括项目立项、任务拆解、状态流转、成员管理等。',
    member: '可执行分配的任务，更新任务状态，查看相关项目信息，发表评论。',
    tester: '负责测试任务的执行，提交缺陷报告，参与验收流程。',
    customer: '可查看项目进度、交付物，参与验收环节，提供反馈意见。',
    management: '拥有全局视图权限，可查看所有项目状态、统计报表、异常追踪等。'
  }
  return descriptions[role] || '暂无说明'
}

const permissionsTable = computed(() => {
  const role = userStore.user?.role
  const isPM = role === 'project_manager'
  const isMember = role === 'member'
  const isTester = role === 'tester'
  const isCustomer = role === 'customer'
  const isManagement = role === 'management'

  const canEdit = isPM || isMember
  const canCreate = isPM
  const canDelete = isPM

  return [
    {
      feature: '项目管理',
      view: true,
      create: canCreate,
      edit: isPM,
      delete: canDelete
    },
    {
      feature: '任务管理',
      view: true,
      create: canEdit,
      edit: canEdit,
      delete: isPM
    },
    {
      feature: '看板操作',
      view: true,
      create: false,
      edit: canEdit,
      delete: false
    },
    {
      feature: '甘特图',
      view: true,
      create: false,
      edit: false,
      delete: false
    },
    {
      feature: '状态流转',
      view: true,
      create: false,
      edit: isPM,
      delete: false
    },
    {
      feature: '异常处理',
      view: isPM || isManagement,
      create: false,
      edit: isPM,
      delete: false
    },
    {
      feature: '统计报表',
      view: isPM || isManagement,
      create: false,
      edit: false,
      delete: false
    }
  ]
})

const goToDashboard = () => {
  router.push('/dashboard')
}

const refreshUserData = async () => {
  try {
    await userStore.fetchUserInfo()
    ElMessage.success('用户信息已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
  ElMessage.success('已退出登录')
}
</script>

<style scoped>
.settings-page {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.permissions-info {
  margin-top: 16px;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-size: 13px;
}

.info-value {
  color: #303133;
  font-weight: 500;
  font-size: 13px;
}

.preset-accounts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.2s;
}

.account-item:hover {
  background: #ecf5ff;
}

.account-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.account-info {
  flex: 1;
}

.account-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.account-role {
  font-size: 12px;
  color: #909399;
}

.account-creds {
  font-size: 12px;
  margin-bottom: 4px;
}

.cred-label {
  color: #909399;
}

.cred-value {
  color: #409eff;
  font-family: monospace;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
