<template>
  <div class="activities-page">
    <van-nav-bar title="活动" fixed />

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="我的活动">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh('my')">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad('my')"
          >
            <div v-if="myActivities.length === 0 && !loading" class="empty-state">
              <van-empty description="暂无活动报名" />
            </div>
            <div v-else class="activity-list">
              <div v-for="activity in myActivities" :key="activity.id" class="activity-item" @click="goDetail(activity.id)">
                <van-image :src="activity.coverImage || 'https://picsum.photos/400/200'" class="activity-cover" />
                <div class="activity-info">
                  <h3 class="activity-title">{{ activity.title }}</h3>
                  <p class="activity-desc">{{ activity.description }}</p>
                  <div class="activity-meta">
                    <span><van-icon name="calendar-o" /> {{ formatDate(activity.startTime) }}</span>
                    <span v-if="activity.location"><van-icon name="location-o" /> {{ activity.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </van-list>
        </van-pull-refresh>
      </van-tab>

      <van-tab title="报名进行">
        <van-list>
          <div v-if="activeActivities.length === 0" class="empty-state">
            <van-empty description="暂无活动" />
          </div>
          <div v-else class="activity-list">
            <div v-for="activity in activeActivities" :key="activity.id" class="activity-item" @click="goDetail(activity.id)">
              <van-image :src="activity.coverImage || 'https://picsum.photos/400/200'" class="activity-cover" />
              <div class="activity-info">
                <h3 class="activity-title">{{ activity.title }}</h3>
                <p class="activity-desc">{{ activity.description }}</p>
                <div class="activity-meta">
                  <span><van-icon name="calendar-o" /> {{ formatDate(activity.startTime) }}</span>
                  <span v-if="activity.location"><van-icon name="location-o" /> {{ activity.location }}</span>
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </van-tab>

      <van-tab title="即将开启">
        <van-empty description="敬请期待" />
      </van-tab>

      <van-tab title="往期活动">
        <van-empty description="暂无往期活动" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import type { Activity } from '@/types'

const router = useRouter()

const activeTab = ref(0)
const myActivities = ref<Activity[]>([])
const activeActivities = ref<Activity[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)

const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD HH:mm')
}

const fetchMyActivities = async () => {
  try {
    const res = await request.get('/activities/my', {
      params: { page: page.value, pageSize: 10 }
    })
    if (refreshing.value) {
      myActivities.value = res.data.list
      refreshing.value = false
    } else {
      myActivities.value = [...myActivities.value, ...res.data.list]
    }
    finished.value = myActivities.value.length >= res.data.total
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const fetchActiveActivities = async () => {
  try {
    const res = await request.get('/activities', {
      params: { status: 'active', pageSize: 20 }
    })
    activeActivities.value = res.data.list
  } catch {}
}

const onLoad = (type: string) => {
  if (type === 'my' && !refreshing.value) {
    page.value++
    fetchMyActivities()
  }
}

const onRefresh = (type: string) => {
  if (type === 'my') {
    finished.value = false
    page.value = 1
    fetchMyActivities()
  }
}

const goDetail = (id: number) => {
  router.push(`/activity/${id}`)
}

onMounted(() => {
  fetchMyActivities()
  fetchActiveActivities()
})
</script>

<style scoped>
.activities-page {
  padding-top: 46px;
  padding-bottom: 50px;
}

.activity-list {
  padding: 10px;
}

.activity-item {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.activity-cover {
  width: 100%;
  height: 150px;
}

.activity-info {
  padding: 12px;
}

.activity-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.activity-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.empty-state {
  padding: 50px 0;
}
</style>
