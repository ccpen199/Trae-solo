<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #304156">
      <div class="logo">
        <h3>科研经费管理</h3>
      </div>
      <el-menu
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        :default-active="$route.path"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <span>项目档案</span>
        </el-menu-item>
        <el-menu-item index="/budget">
          <el-icon><Money /></el-icon>
          <span>预算执行</span>
        </el-menu-item>
        <el-menu-item index="/reimbursements">
          <el-icon><Document /></el-icon>
          <span>报销管理</span>
        </el-menu-item>
        <el-menu-item index="/purchases">
          <el-icon><ShoppingCart /></el-icon>
          <span>采购管理</span>
        </el-menu-item>
        <el-menu-item index="/contracts">
          <el-icon><Postcard /></el-icon>
          <span>合同管理</span>
        </el-menu-item>
        <el-menu-item index="/fund-receipts">
          <el-icon><Wallet /></el-icon>
          <span>到账管理</span>
        </el-menu-item>
        <el-menu-item index="/completions">
          <el-icon><Checked /></el-icon>
          <span>结题审计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 18px; font-weight: 600;">科研项目经费管理系统</span>
        <el-dropdown @command="handleSwitchUser">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ userName }} ({{ userRoleLabel }})
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item 
                v-for="user in users" 
                :key="user.id" 
                :command="user"
                :disabled="user.id === currentUser.id"
              >
                {{ user.name }} ({{ roleLabels[user.role] }})
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main style="background-color: #f5f7fa; overflow: auto;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { DataAnalysis, Folder, Money, Document, ShoppingCart, Postcard, Wallet, Checked, User } from '@element-plus/icons-vue'
import { useUser } from '../store/user'
import { ElMessage } from 'element-plus'

const { users, currentUser, userName, userRoleLabel, switchUser, roleLabels } = useUser()

const handleSwitchUser = (user) => {
  switchUser(user)
  ElMessage.success(`已切换到 ${user.name} (${roleLabels[user.role]})`)
}
</script>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-bottom: 1px solid #1f2d3d;
}

.logo h3 {
  font-size: 16px;
  margin: 0;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
