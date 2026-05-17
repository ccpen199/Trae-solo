<template>
  <div class="page-container">
    <div class="page-header">
      <div class="title">门店查询</div>
    </div>
    <div class="content">
      <div v-for="store in storeList" :key="store.id" class="store-card">
        <h3>{{ store.name }}</h3>
        <p>{{ store.address }}</p>
        <p>{{ store.phone }}</p>
        <p>{{ store.business_hours }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'

const storeList = ref([])

onMounted(async () => {
  const res = await request.get('/home/stores')
  storeList.value = res.data
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px 20px;
}

.page-header .title {
  font-size: 24px;
  font-weight: bold;
}

.content {
  padding: 16px;
}

.store-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.store-card h3 {
  margin: 0 0 8px 0;
  font-size: 17px;
  color: #333;
}

.store-card p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
}
</style>
