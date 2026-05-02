<template>
  <div class="dashboard">
    <el-card shadow="hover" class="welcome-card">
      <template #header>
        <div class="card-header">
          <h3>质检中心</h3>
        </div>
      </template>
      <div class="welcome-content">
        <p>这里是农产品质量检测管理中心，您可以在此查看和处理质检任务。</p>
      </div>
    </el-card>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Filter /></el-icon>
            <div class="stat-info">
              <h4>待检测</h4>
              <p class="stat-number">{{ stats.pendingInspections || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Check /></el-icon>
            <div class="stat-info">
              <h4>检测合格</h4>
              <p class="stat-number">{{ stats.passedInspections || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Close /></el-icon>
            <div class="stat-info">
              <h4>检测不合格</h4>
              <p class="stat-number">{{ stats.failedInspections || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Filter, Check, Close } from '@element-plus/icons-vue'

const stats = ref({
  pendingInspections: 0,
  passedInspections: 0,
  failedInspections: 0
})

onMounted(async () => {
  // 模拟数据
  stats.value = {
    pendingInspections: 5,
    passedInspections: 12,
    failedInspections: 2
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
