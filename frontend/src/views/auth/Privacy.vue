<template>
  <div class="page-container">
    <van-nav-bar title="隐私政策" left-arrow @click-left="$router.back()" />
    <div class="page-content privacy-content" v-loading="loading">
      <div class="content" v-if="policy" v-html="policy"></div>
      <div class="error-state" v-else-if="error">
        <p>加载失败</p>
        <van-button type="primary" size="small" class="retry-btn" @click="loadPolicy">重试</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { authApi } from '@/api'

const loading = ref(false)
const error = ref(false)
const policy = ref('')

const loadPolicy = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await authApi.getPrivacyPolicy()
    policy.value = res.data?.content || ''
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPolicy()
})
</script>

<style lang="less" scoped>
.privacy-content {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.content {
  line-height: 1.8;
  color: #333;

  h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }

  h1 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  p {
    margin-bottom: 12px;
  }
}
</style>
