<template>
  <div>
    <h2 style="margin-bottom: 20px">数据概览</h2>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">今日订单</div>
          <div class="stat-value">{{ stats.today_orders || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">今日成交额</div>
          <div class="stat-value">¥{{ stats.today_amount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">待处理订单</div>
          <div class="stat-value">{{ stats.pending_orders || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">活跃商户</div>
          <div class="stat-value">{{ stats.active_merchants || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>快捷操作</template>
          <el-button type="primary" @click="$router.push('/order-create')">新建订单</el-button>
          <el-button @click="$router.push('/merchants')">商户管理</el-button>
          <el-button @click="$router.push('/products')">商品管理</el-button>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>系统状态</template>
          <div>活跃商品数: {{ stats.active_products || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const stats = ref({})

onMounted(async () => {
  const res = await axios.get('/api/stats/dashboard')
  stats.value = res.data
})
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-label {
  color: #909399;
  font-size: 14px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-top: 10px;
}
</style>
