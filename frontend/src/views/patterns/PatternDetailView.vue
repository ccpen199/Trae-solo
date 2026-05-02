<template>
  <div class="pattern-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>
              <router-link to="/patterns">打版管理</router-link>
            </el-breadcrumb-item>
            <el-breadcrumb-item>版单详情</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </template>
      <div class="pattern-info">
        <h2>版单详情</h2>
        <p>版单详情页面</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

onMounted(() => {
  console.log('PatternDetailView mounted')
})
</script>

<style scoped>
.pattern-detail-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .pattern-info {
    padding: 20px;
  }
}
</style>
