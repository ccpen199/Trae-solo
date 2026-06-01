<template>
  <div class="window-index">
    <div class="card">
      <div class="card-header">
        <h2>窗口受理端</h2>
      </div>
      <div class="card-body">
        <div class="action-grid">
          <div class="action-card" @click="go('/window/applications')">
            <div class="action-icon blue">📋</div>
            <h4>申请列表</h4>
            <p>查看和受理群众申请</p>
          </div>
          <div class="action-card" @click="go('/citizen/apply')">
            <div class="action-icon green">➕</div>
            <h4>新建申请</h4>
            <p>为群众办理新申请</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const go = (path) => router.push(path)
</script>

<style scoped>
.window-index {
  padding: 20px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}
.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}
.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}
.card-body {
  padding: 30px;
}
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 600px;
}
.action-card {
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}
.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.action-icon {
  font-size: 48px;
  margin-bottom: 15px;
}
.blue { color: #409eff; }
.green { color: #67c23a; }
.action-card h4 {
  margin: 15px 0 10px 0;
  font-size: 18px;
  color: #303133;
}
.action-card p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}
</style>
