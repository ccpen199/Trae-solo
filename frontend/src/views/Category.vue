<template>
  <div class="category-page">
    <div class="header">
      <h1>商品分类</h1>
    </div>
    
    <div class="category-list">
      <div 
        v-for="cat in categories" 
        :key="cat.id"
        class="category-item"
      >
        <div class="category-icon" :style="{ background: cat.color }">
          <el-icon :size="20">{{ cat.icon }}</el-icon>
        </div>
        <span class="category-name">{{ cat.name }}</span>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from '@/components/TabBar.vue'

const categories = ref([
  { id: 1, name: '机油', icon: 'Oil', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, name: '轮胎', icon: 'Promotion', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 3, name: '刹车片', icon: 'Tools', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 4, name: '空调滤芯', icon: 'Aim', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 5, name: '空气滤芯', icon: 'WindPower', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 6, name: '火花塞', icon: 'Lightning', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 7, name: '蓄电池', icon: 'Connection', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 8, name: '雨刷', icon: 'Watermelon', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
])
</script>

<style scoped>
.category-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 70px;
}

.header {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.header h1 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.category-list {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
}

.category-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
}

.category-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 8px;
}

.category-name {
  font-size: 13px;
  color: #333;
}
</style>
