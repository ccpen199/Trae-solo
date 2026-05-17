<template>
  <div class="page-container">
    <van-nav-bar title="我的关注" left-arrow @click-left="$router.back()" />

    <div class="page-content users-content" v-loading="loading">
      <div class="error-state" v-if="error">
        <p>加载失败</p>
        <van-button type="primary" size="small" class="retry-btn" @click="loadData">重试</van-button>
      </div>

      <div class="empty-state" v-else-if="!loading && users.length === 0">
        <div class="empty-icon">👥</div>
        <p>暂无关注</p>
      </div>

      <div v-else class="users-list">
        <div
          class="user-item"
          v-for="user in users"
          :key="user.id"
          @click="$router.push(`/user/${user.id}`)"
        >
          <van-avatar size="48" />
          <div class="user-info">
            <div class="username">{{ user.username }}</div>
            <div class="user-bio">{{ user.bio || '这个人很懒' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '@/api'

const loading = ref(false)
const error = ref(false)
const users = ref([])

const loadData = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await userApi.getFollowing({})
    users.value = res.data || []
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="less" scoped>
.users-content {
  padding: 12px;
}

.users-list {
  .user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;

    .user-info {
      flex: 1;

      .username {
        font-size: 15px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }

      .user-bio {
        font-size: 12px;
        color: #666;
      }
    }
  }
}
</style>
