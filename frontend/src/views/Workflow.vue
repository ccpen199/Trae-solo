<template>
  <div class="workflow-page">
    <h2>流程处理</h2>
    <p class="page-desc">处理资产领用、折旧、盘点等流程</p>
    
    <div class="workflow-cards">
      <div class="workflow-card">
        <div class="card-icon">📦</div>
        <h3>待领用资产</h3>
        <p>确认领用新资产</p>
        <router-link to="/assets?status=PENDING_RECEIVE" class="card-link">
          查看列表 →
        </router-link>
      </div>
      
      <div class="workflow-card">
        <div class="card-icon">📊</div>
        <h3>待折旧资产</h3>
        <p>计算和审批折旧</p>
        <router-link to="/assets?status=PENDING_DEPRECIATION" class="card-link">
          查看列表 →
        </router-link>
      </div>
      
      <div class="workflow-card">
        <div class="card-icon">📋</div>
        <h3>待盘点资产</h3>
        <p>扫码或人工盘点</p>
        <router-link to="/inventory" class="card-link">
          前往盘点 →
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.workflow-page {
  padding: 20px;
}

.workflow-page h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-desc {
  color: #888;
  margin-bottom: 24px;
}

.workflow-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.workflow-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.workflow-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.workflow-card p {
  color: #888;
  margin-bottom: 16px;
}

.card-link {
  color: #667eea;
  font-size: 14px;
}
</style>
