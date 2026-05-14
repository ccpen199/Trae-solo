<template>
  <footer class="footer">
    <div class="footer-content">
      <p>© {{ currentYear }} 美团民宿活动模块 | 让旅行更有意义</p>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue'

const currentYear = ref(new Date().getFullYear())
</script>

<style scoped>
.footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 15px 0;
  position: fixed;
  bottom: 0;
  width: 100%;
}

.footer-content {
  font-size: 14px;
  opacity: 0.8;
}
</style>