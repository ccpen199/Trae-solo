<template>
  <el-container style="height: 100vh">
    <el-aside :width="isCollapse ? '64px' : '200px'" style="background-color: #304156">
      <div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: bold; border-bottom: 1px solid #3a4a5b">
        <el-icon v-if="isCollapse" :size="28"><School /></el-icon>
        <span v-else>领克培训管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/home/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页概览</template>
        </el-menu-item>
        
        <el-sub-menu index="factory">
          <template #title>
            <el-icon><OfficeBuilding /></el-icon>
            <span>主机厂管理</span>
          </template>
          <el-menu-item index="/factory/tasks">内训任务管理</el-menu-item>
          <el-menu-item index="/factory/audit">内训审核管理</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="dealer">
          <template #title>
            <el-icon><Shop /></el-icon>
            <span>经销商管理</span>
          </template>
          <el-menu-item index="/dealer/execution">内训执行列表</el-menu-item>
          <el-menu-item index="/dealer/tasks/create">新建B类任务</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: #fff; border-bottom: 1px solid #e4e7ed; display: flex; align-items: center; justify-content: space-between; padding: 0 20px">
        <div style="display: flex; align-items: center">
          <el-icon
            class="collapse-btn"
            @click="toggleCollapse"
            style="cursor: pointer; font-size: 20px"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" style="margin-left: 20px">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">{{ item.meta?.title || item.name }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div style="display: flex; align-items: center">
          <el-tag type="info" style="margin-right: 10px">当前角色: {{ currentRole }}</el-tag>
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link" style="cursor: pointer">
              <el-avatar :size="32" style="background-color: #409eff">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span style="margin-left: 8px">{{ userName }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="switchFactory">切换为主机厂</el-dropdown-item>
                <el-dropdown-item command="switchDealer">切换为经销商</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main style="background-color: #f5f7fa; padding: 20px; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const isCollapse = ref(false)
const currentRole = ref('主机厂管理员')
const userName = ref('管理员')

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta?.title)
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command) => {
  if (command === 'switchFactory') {
    currentRole.value = '主机厂管理员'
    userName.value = '主机厂管理员'
    ElMessage.success('已切换为主机厂角色')
    router.push('/factory/tasks')
  } else if (command === 'switchDealer') {
    currentRole.value = '杭州领克4S店'
    userName.value = '杭州4S店管理员'
    ElMessage.success('已切换为经销商角色')
    router.push('/dealer/execution')
  }
}
</script>

<style>
.collapse-btn:hover {
  color: #409eff;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
}
</style>
