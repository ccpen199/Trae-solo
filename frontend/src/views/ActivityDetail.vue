<template>
  <div class="activity-detail-page">
    <van-nav-bar title="活动详情" left-arrow @click-left="goBack" />

    <van-loading v-if="loading" class="loading" />
    <div v-else-if="activity" class="content">
      <van-image :src="activity.coverImage || 'https://picsum.photos/800/400'" class="activity-cover" />
      
      <h1 class="activity-title">{{ activity.title }}</h1>
      
      <div class="activity-meta">
        <div class="meta-item">
          <van-icon name="calendar-o" />
          <span>{{ formatDate(activity.startTime) }} - {{ formatDate(activity.endTime) }}</span>
        </div>
        <div v-if="activity.location" class="meta-item">
          <van-icon name="location-o" />
          <span>{{ activity.location }}</span>
        </div>
        <div class="meta-item">
          <van-icon name="user-o" />
          <span>{{ activity.registrationCount || 0 }} 人已报名</span>
        </div>
      </div>

      <div class="activity-description">
        <h3>活动介绍</h3>
        <p>{{ activity.description }}</p>
      </div>

      <div class="register-section">
        <van-button
          v-if="!activity.isRegistered"
          type="primary"
          block
          size="large"
          @click="register"
          :loading="registerLoading"
        >
          立即报名
        </van-button>
        <van-tag v-else type="success" size="large">已报名</van-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import type { Activity } from '@/types'

const router = useRouter()
const route = useRoute()

const activity = ref<Activity | null>(null)
const loading = ref(true)
const registerLoading = ref(false)

const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD HH:mm')
}

const fetchActivity = async () => {
  try {
    const res = await request.get(`/activities/${route.params.id}`)
    activity.value = res.data
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const register = async () => {
  if (!activity.value) return
  registerLoading.value = true
  try {
    await request.post(`/activities/${activity.value.id}/register`)
    activity.value.isRegistered = true
    showToast('报名成功')
  } catch {
  } finally {
    registerLoading.value = false
  }
}

onMounted(() => {
  fetchActivity()
})
</script>

<style scoped>
.activity-detail-page {
  padding-bottom: 30px;
}

.loading {
  padding: 50px 0;
  text-align: center;
}

.content {
  padding: 15px;
}

.activity-cover {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.activity-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  line-height: 1.4;
}

.activity-meta {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-item .van-icon {
  margin-right: 8px;
  color: #999;
}

.activity-description {
  margin-bottom: 30px;
}

.activity-description h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

.activity-description p {
  font-size: 14px;
  line-height: 1.8;
  color: #666;
}

.register-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  padding: 15px;
  background: #fff;
  border-top: 1px solid #eee;
}
</style>
