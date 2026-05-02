<template>
  <div class="dashboard">
    <el-card shadow="hover" class="welcome-card">
      <template #header>
        <div class="card-header">
          <h3>流通中心</h3>
        </div>
      </template>
      <div class="welcome-content">
        <p>这里是农产品流通管理中心，您可以在此查看和处理流通任务。</p>
      </div>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Van /></el-icon>
            <div class="stat-info">
              <h4>在途批次</h4>
              <p class="stat-number">{{ stats.inTransit || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Box /></el-icon>
            <div class="stat-info">
              <h4>已入库</h4>
              <p class="stat-number">{{ stats.inWarehouse || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Shop /></el-icon>
            <div class="stat-info">
              <h4>已销售</h4>
              <p class="stat-number">{{ stats.sold || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Van, Box, Shop } from '@element-plus/icons-vue'

const stats = ref({
  inTransit: 0,
  inWarehouse: 0,
  sold: 0
})

onMounted(async () => {
  stats.value = {
    inTransit: 8,
    inWarehouse: 15,
    sold: 20
  }
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.welcome-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.welcome-content p {
  font-size: 16px;
  color: #606266;
  line-height: 1.5;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  color: #409EFF;
}

.stat-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  font-weight: normal;
}

.stat-number {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
</style>
