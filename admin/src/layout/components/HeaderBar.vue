<template>
  <div class="header-bar">
    <div class="header-left">
      <el-icon class="collapse-btn" @click="$emit('toggle-collapse')">
        <component :is="collapse ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>

    <div class="header-center">
      <el-tag type="success" effect="plain" round size="small">
        <el-icon><CircleCheck /></el-icon> 系统运行正常
      </el-tag>
      <el-tag type="info" effect="plain" round size="small" style="margin-left: 8px;">
        <el-icon><Clock /></el-icon> {{ currentTime }}
      </el-tag>
    </div>

    <div class="header-right">
      <el-tooltip content="搜索">
        <el-icon class="header-icon" @click="showSearch = true">
          <Search />
        </el-icon>
      </el-tooltip>

      <el-tooltip content="通知中心">
        <el-badge :value="8" :max="99" class="notification-badge">
          <el-icon class="header-icon"><Bell /></el-icon>
        </el-badge>
      </el-tooltip>

      <el-tooltip content="全屏">
        <el-icon class="header-icon" @click="toggleFullscreen">
          <component :is="isFullscreen ? 'Aim' : 'FullScreen'" />
        </el-icon>
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
          <div class="user-detail">
            <span class="user-name">{{ userStore.userInfo?.realName || '管理员' }}</span>
            <span class="user-role">{{ userStore.userInfo?.roleName || '超级管理员' }} · {{ userStore.userInfo?.department?.split(' · ')[1] || '平台管理处' }}</span>
          </div>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon> 个人中心
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon> 修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-dialog v-model="showSearch" title="全局搜索" width="600px" top="15vh" :show-close="true">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索服务、政策、市民、工单..."
        size="large"
        clearable
        @keyup.enter="doSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
        <template #append>
          <el-button @click="doSearch" type="primary">搜索</el-button>
        </template>
      </el-input>
      <div style="margin-top: 16px;" v-if="searchResults.length > 0">
        <el-result v-if="searchResults.length === 0" icon="info" title="暂无搜索结果" />
        <el-table v-else :data="searchResults" size="small">
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="title" label="内容" />
          <el-table-column label="操作" width="120">
            <template #default>
              <el-button type="primary" link>查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'

defineProps<{ collapse: boolean }>()
const emit = defineEmits<{ (e: 'toggle-collapse'): void }>()

const userStore = useUserStore()
const currentTime = ref('')
const isFullscreen = ref(false)
const showSearch = ref(false)
const searchKeyword = ref('')
const searchResults = ref<any[]>([])

let timer: any

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => clearInterval(timer))

function updateTime() {
  const d = new Date()
  currentTime.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

async function handleCommand(cmd: string) {
  switch (cmd) {
    case 'profile': ElMessage.info('个人中心开发中'); break
    case 'password': ElMessage.info('修改密码开发中'); break
    case 'logout':
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
      await userStore.logout()
      ElMessage.success('已退出登录')
      break
  }
}

function doSearch() {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  searchResults.value = [
    { type: '办事服务', title: `社保参保证明打印 - 匹配关键词：${searchKeyword.value}` },
    { type: '政策文件', title: `郑州市${searchKeyword.value}相关政策（2025版）` },
    { type: '督办工单', title: `WO-2025${Date.now().toString().slice(-8)} - 关于${searchKeyword.value}的差评投诉` }
  ]
  ElMessage.success(`搜索完成，找到 ${searchResults.value.length} 条结果`)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.header-bar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left .collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: $text-regular;
  padding: 6px;
  border-radius: 4px;
  &:hover { background: $border-extra-light; color: $primary-color; }
}

.header-center { display: flex; align-items: center; }

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;

  .header-icon {
    font-size: 18px;
    cursor: pointer;
    padding: 8px;
    color: $text-regular;
    border-radius: 4px;
    &:hover { background: $border-extra-light; color: $primary-color; }
  }
}

.notification-badge :deep(.el-badge__content) { transform: scale(0.8) translateX(50%); }

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  margin-left: 8px;
  border-left: 1px solid $border-lighter;
  cursor: pointer;

  &:hover { background: $border-extra-light; border-radius: 6px; border-left-color: transparent; margin-left: 8px; padding-left: 12px; }

  .user-detail {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
    .user-name { font-size: 13px; font-weight: 600; color: $text-primary; }
    .user-role { font-size: 11px; color: $text-secondary; }
  }
}
</style>
