<template>
  <div class="video-detail-container">
    <van-nav-bar title="" left-text="返回" @click-left="goBack" right-text="分享">
      <template #right>
        <van-icon name="share-o" @click="shareVideo" />
      </template>
    </van-nav-bar>

    <div class="video-player">
      <img :src="video?.cover" class="video-cover" />
      <div class="play-overlay" @click="togglePlay">
        <van-icon name="play" class="play-icon" />
      </div>
    </div>

    <div class="video-info">
      <h2 class="video-title">{{ video?.title }}</h2>
      <div class="video-meta">
        <span class="meta-item">
          <van-icon name="eye-o" />
          {{ formatNumber(video?.views || 0) }}
        </span>
        <span class="meta-item" :class="{ liked: isLiked }">
          <van-icon name="heart" />
          {{ formatNumber((video?.likes || 0) + (isLiked ? 1 : 0)) }}
        </span>
      </div>
    </div>

    <div class="action-bar">
      <van-button 
        class="action-btn like-action" 
        :class="{ liked: isLiked }"
        @click="toggleLike"
      >
        <van-icon name="heart" />
        <span>点赞</span>
      </van-button>
      <van-button class="action-btn" @click="collectVideo">
        <van-icon name="star-o" />
        <span>收藏</span>
      </van-button>
      <van-button class="action-btn" @click="commentVideo">
        <van-icon name="comment-o" />
        <span>评论</span>
      </van-button>
    </div>

    <div class="recipe-section">
      <h3 class="section-title">食材清单</h3>
      <div class="ingredient-list">
        <span 
          v-for="(item, index) in ingredients" 
          :key="index" 
          class="ingredient-tag"
        >
          {{ item }}
        </span>
      </div>
    </div>

    <div class="recipe-section">
      <h3 class="section-title">做法步骤</h3>
      <div class="step-list">
        <div 
          v-for="(step, index) in steps" 
          :key="index" 
          class="step-item"
        >
          <span class="step-number">{{ index + 1 }}</span>
          <p class="step-text">{{ step }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { videos } from '@/data/mockData'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()

const videoId = computed(() => parseInt(route.params.id))
const video = computed(() => videos.find(v => v.id === videoId.value))
const isLiked = ref(false)

const ingredients = ['西红柿 2个', '鸡蛋 3个', '葱花 适量', '盐 少许', '生抽 适量']
const steps = [
  '西红柿洗净切块，鸡蛋打散备用',
  '锅中倒油，油热后倒入鸡蛋液炒至凝固盛出',
  '锅中再倒少许油，放入西红柿块翻炒',
  '加入适量盐和生抽调味',
  '倒入炒好的鸡蛋，翻炒均匀',
  '撒上葱花即可出锅',
]

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const goBack = () => {
  router.back()
}

const togglePlay = () => {
  showToast('播放视频')
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
}

const collectVideo = () => {
  showToast('已收藏')
}

const commentVideo = () => {
  showToast('评论功能')
}

const shareVideo = () => {
  showToast('分享视频')
}

onMounted(() => {})
</script>

<style scoped>
.video-detail-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.video-player {
  position: relative;
  width: 100%;
  height: 220px;
  background: #000;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.play-icon {
  font-size: 48px;
  color: #fff;
}

.video-info {
  background: #fff;
  padding: 16px;
}

.video-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px;
}

.video-meta {
  display: flex;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #999;
}

.meta-item van-icon {
  margin-right: 4px;
}

.meta-item.liked {
  color: #ee0a24;
}

.action-bar {
  display: flex;
  background: #fff;
  padding: 16px;
  margin-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  border: none;
  color: #666;
}

.action-btn span {
  font-size: 12px;
  margin-top: 4px;
}

.like-action.liked {
  color: #ee0a24;
}

.recipe-section {
  background: #fff;
  padding: 16px;
  margin-top: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px;
}

.ingredient-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ingredient-tag {
  display: inline-block;
  background: #f5f5f5;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
}

.step-list {
  padding-left: 8px;
}

.step-item {
  display: flex;
  margin-bottom: 16px;
}

.step-item:last-child {
  margin-bottom: 0;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #ff6b35;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.step-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin: 0;
}
</style>
