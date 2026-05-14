<template>
  <div class="operator-dashboard">
    <div class="sidebar">
      <div class="logo">运营管理</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/operator/stats">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/operator/reviews">
          <el-icon><DocumentChecked /></el-icon>
          <span>内容审核</span>
          <el-badge v-if="pendingReviewCount > 0" :value="pendingReviewCount" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/operator/reports">
          <el-icon><Warning /></el-icon>
          <span>举报处理</span>
          <el-badge v-if="pendingReportCount > 0" :value="pendingReportCount" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/operator/blacklist">
          <el-icon><Lock /></el-icon>
          <span>敏感词管理</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { DataAnalysis, DocumentChecked, Warning, Lock } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const stats = ref({})

const activeMenu = computed(() => route.path)

const pendingReviewCount = computed(() => stats.value.pending_reviews || 0)
const pendingReportCount = computed(() => stats.value.pending_reports || 0)

async function loadStats() {
  try {
    const res = await api.get('/operator/stats')
    if (res.success) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.operator-dashboard {
  display: flex;
  min-height: calc(100vh - 60px);
}

.sidebar {
  width: 200px;
  background: #304156;
  flex-shrink: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #1f2d3d;
}

.main-content {
  flex: 1;
  padding: 30px;
  background: #f5f7fa;
  min-width: 0;
  overflow: auto;
}

.menu-badge {
  margin-left: 8px;
}
</style>
