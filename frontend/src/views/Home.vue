<template>
  <div class="home">
    <div class="card">
      <h2>Welcome to Material Reuse System</h2>
      <p>政务材料复用系统</p>
      <div class="links">
        <button @click="go('/citizen')">群众端</button>
        <button @click="go('/window')">窗口端</button>
        <button @click="go('/approver')">审批端</button>
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
.home {
  padding: 20px;
}
.card {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  text-align: center;
}
.card h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #303133;
}
.card p {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}
.links {
  display: flex;
  gap: 15px;
  justify-content: center;
}
.links button {
  padding: 12px 30px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}
.links button:hover {
  background: #66b1ff;
}
</style>
