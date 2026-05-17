<template>
  <div class="page-container">
    <van-nav-bar title="频道管理" left-arrow @click-left="$router.back()" />

    <div class="page-content channels-content" v-loading="loading">
      <div class="section-title">我的频道</div>
      <div class="channels-list">
        <div
          class="channel-item"
          v-for="channel in myChannels"
          :key="channel.id"
          :style="{ order: channel.user_sort_order }"
        >
          <div class="channel-name">{{ channel.name }}</div>
          <div class="channel-actions">
            <van-icon name="minus" size="18" @click="leaveChannel(channel.id)" />
          </div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 24px;">推荐频道</div>
      <div class="channels-list">
        <div
          class="channel-item"
          v-for="channel in availableChannels"
          :key="channel.id"
        >
          <div class="channel-name">{{ channel.name }}</div>
          <div class="channel-actions">
            <van-icon name="plus" size="18" @click="joinChannel(channel.id)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { communityApi } from '@/api'

const loading = ref(false)
const myChannels = ref([])
const availableChannels = ref([])

const loadChannels = async () => {
  loading.value = true
  try {
    const res = await communityApi.getMyChannels()
    myChannels.value = res.data?.myChannels || []
    availableChannels.value = res.data?.availableChannels || []
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const joinChannel = async (channelId) => {
  try {
    await communityApi.joinChannel(channelId)
    showToast('加入成功')
    loadChannels()
  } catch (e) {}
}

const leaveChannel = async (channelId) => {
  showToast('频道功能开发中')
}

onMounted(() => {
  loadChannels()
})
</script>

<style lang="less" scoped>
.channels-content {
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.channels-list {
  .channel-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;

    .channel-name {
      font-size: 15px;
      color: #333;
    }

    .channel-actions {
      color: #8b5a2b;
    }
  }
}
</style>
