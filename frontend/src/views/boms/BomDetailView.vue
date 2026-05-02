<template>
  <div class="bom-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>
              <router-link to="/boms">BOM管理</router-link>
            </el-breadcrumb-item>
            <el-breadcrumb-item>BOM详情</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </template>
      <div class="bom-info">
        <h2>BOM详情</h2>
        <p>BOM详情页面</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

onMounted(() => {
  console.log('BomDetailView mounted')
})
</script>

<style scoped>
.bom-detail-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .bom-info {
    padding: 20px;
  }
}
</style>
