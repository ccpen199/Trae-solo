<template>
  <el-footer class="app-footer">
    <div class="footer-content">
      <div class="footer-links">
        <a href="/">首页</a>
        <a href="/questions">提问</a>
        <a href="/articles">文章</a>
        <a href="mailto:support@pmcaff.com">联系我们</a>
      </div>
      <div class="copyright">
        © 2026 PMcaff - 产品经理社区内容平台
      </div>
    </div>
  </el-footer>
</template>

<script setup>
</script>

<style scoped>
.app-footer {
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding: 20px 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: #606266;
  font-size: 14px;
}

.footer-links a:hover {
  color: #409eff;
}

.copyright {
  color: #909399;
  font-size: 12px;
}
</style>
