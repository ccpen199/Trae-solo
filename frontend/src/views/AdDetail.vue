<template>
  <div class="ad-detail-page">
    <van-nav-bar title="广告详情" left-arrow @click-left="goBack" />
    
    <div class="ad-content">
      <img :src="adData.image" class="ad-image" />
      <div class="ad-info">
        <h2 class="ad-title">{{ adData.title }}</h2>
        <van-button type="primary" round block @click="goToTarget">
          查看详情
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const adData = ref({
  image: '',
  title: '广告详情',
  link: ''
})

const goBack = () => {
  router.back()
}

const goToTarget = () => {
  if (adData.value.link) {
    router.push(adData.value.link)
  }
}

onMounted(() => {
  // 从路由参数或其他方式获取广告数据
})
</script>

<style scoped>
.ad-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.ad-content {
  background: #fff;
}

.ad-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.ad-info {
  padding: 20px;
}

.ad-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px;
}
</style>
