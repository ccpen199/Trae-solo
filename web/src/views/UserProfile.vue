<template>
  <div class="user-profile-page">
    <div class="container">
      <el-skeleton :loading="loading" animated>
        <template #default>
          <div class="profile-header">
            <div class="profile-info">
              <el-avatar :size="120" class="user-avatar">
                <img v-if="user.avatar" :src="user.avatar" />
                <el-icon v-else size="60"><User /></el-icon>
              </el-avatar>
              <div class="user-details">
                <h1 class="user-name">{{ user.nickname || user.username }}</h1>
                <p class="user-username">@{{ user.username }}</p>
                <p class="user-bio" v-if="user.bio">{{ user.bio }}</p>
                <div class="user-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ user.resourceCount || 0 }}</span>
                    <span class="stat-label">资源</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ user.favoriteCount || 0 }}</span>
                    <span class="stat-label">收藏</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ user.groupCount || 0 }}</span>
                    <span class="stat-label">小组</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ user.friendCount || 0 }}</span>
                    <span class="stat-label">好友</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="profile-actions" v-if="isOwnProfile">
              <el-button type="primary" @click="$router.push('/profile')">
                编辑资料
              </el-button>
            </div>
          </div>

          <div class="profile-content">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="发布的资源" name="resources">
                <div class="resources-list">
                  <div
                    v-for="resource in resources"
                    :key="resource.id"
                    class="resource-item"
                    @click="$router.push(`/resources/${resource.id}`)"
                  >
                    <h3 class="resource-title">{{ resource.title }}</h3>
                    <p class="resource-desc">{{ resource.description || '暂无描述' }}</p>
                    <div class="resource-meta">
                      <span>{{ formatTime(resource.createdAt) }}</span>
                      <span class="stats">
                        <span><el-icon><View /></el-icon> {{ resource.viewCount }}</span>
                        <span><el-icon><Star /></el-icon> {{ resource.favoriteCount }}</span>
                      </span>
                    </div>
                  </div>
                  <el-empty v-if="!resourcesLoading && resources.length === 0" description="暂无资源" />
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getUserById, getUserResources } from '@/api'
import { User, View, Star } from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const resourcesLoading = ref(false)
const activeTab = ref('resources')
const user = ref({})
const resources = ref([])

const isOwnProfile = computed(() => {
  return userStore.isLoggedIn && userStore.user?.id === route.params.id
})

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleDateString('zh-CN')
}

const fetchUser = async () => {
  loading.value = true
  try {
    const res = await getUserById(route.params.id)
    user.value = res.data?.user || {}
  } catch (e) {
    console.error('Fetch user error:', e)
  } finally {
    loading.value = false
  }
}

const fetchResources = async () => {
  resourcesLoading.value = true
  try {
    const res = await getUserResources(route.params.id, { page: 1, limit: 20 })
    resources.value = res.data?.resources || []
  } catch (e) {
    console.error('Fetch resources error:', e)
  } finally {
    resourcesLoading.value = false
  }
}

onMounted(() => {
  fetchUser()
  fetchResources()
})
</script>

<style scoped>
.user-profile-page {
  min-height: calc(100vh - 64px);
  padding: 40px 0;
  background: #f5f7fa;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.profile-header {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.profile-info {
  display: flex;
  gap: 32px;
}

.user-avatar {
  background: #f5f7fa;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.user-username {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.user-bio {
  font-size: 14px;
  color: #606266;
  margin-bottom: 20px;
}

.user-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.profile-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-item {
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid #e4e7ed;
}

.resource-item:hover {
  background: #f9fafc;
}

.resource-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.resource-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.stats {
  display: flex;
  gap: 16px;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
