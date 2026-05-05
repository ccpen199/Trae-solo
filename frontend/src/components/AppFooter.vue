<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>关于我们</h4>
          <p>标准化套餐系统</p>
          <p>为您提供一站式家装解决方案</p>
          <p>让装修更简单、更透明</p>
        </div>
        <div class="footer-section">
          <h4>快速链接</h4>
          <p><router-link to="/packages">套餐列表</router-link></p>
          <p><router-link to="/accessories">配件商城</router-link></p>
          <p><router-link to="/cart">购物车</router-link></p>
        </div>
        <div class="footer-section">
          <h4>帮助中心</h4>
          <p>常见问题</p>
          <p>支付方式</p>
          <p>售后服务</p>
        </div>
        <div class="footer-section">
          <h4>联系我们</h4>
          <p><el-icon><Phone /></el-icon> 400-888-8888</p>
          <p><el-icon><Message /></el-icon> service@example.com</p>
          <p><el-icon><Location /></el-icon> 北京市朝阳区服务中心</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2024 标准化套餐系统 XM-12223. All Rights Reserved.</p>
        <p>项目端口: 后端 12223 | 前端 22230</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer-section a {
  color: #909399;
}

.footer-section a:hover {
  color: #667eea;
}
</style>
