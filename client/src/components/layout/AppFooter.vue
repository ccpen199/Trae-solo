<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-section">
          <div class="logo">
            <el-icon :size="28" color="#409eff">
              <ChatDotRound />
            </el-icon>
            <span class="logo-text">QA Community</span>
          </div>
          <p class="description">
            连接专家与提问者的知识共享平台<br />
            让每一个问题都能得到专业的回答
          </p>
          <div class="social-links">
            <a href="#" class="social-link">
              <el-icon><ChatDotRound /></el-icon>
            </a>
            <a href="#" class="social-link">
              <el-icon><User /></el-icon>
            </a>
            <a href="#" class="social-link">
              <el-icon><Share /></el-icon>
            </a>
          </div>
        </div>

        <div class="footer-section">
          <h4>产品</h4>
          <ul class="footer-links">
            <li><router-link to="/questions">问题广场</router-link></li>
            <li><router-link to="/knowledge">知识库</router-link></li>
            <li><router-link to="/ask">我要提问</router-link></li>
            <li><a href="#">成为专家</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>关于我们</h4>
          <ul class="footer-links">
            <li><a href="#">关于平台</a></li>
            <li><a href="#">团队介绍</a></li>
            <li><a href="#">联系我们</a></li>
            <li><a href="#">加入我们</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>帮助</h4>
          <ul class="footer-links">
            <li><a href="#">使用指南</a></li>
            <li><a href="#">常见问题</a></li>
            <li><a href="#">隐私政策</a></li>
            <li><a href="#">服务条款</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="bottom-content">
          <div class="copyright">
            &copy; 2024 QA Community. All rights reserved.
          </div>
          <div class="tech-info">
            <span>Powered by Expert-Matching & Knowledge-Graph</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.app-footer {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #a0aec0;
  padding-top: 40px;
  margin-top: auto;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-section {
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .logo-text {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    }
  }

  .description {
    font-size: 13px;
    line-height: 1.8;
    color: #a0aec0;
    margin-bottom: 20px;
  }

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 20px;
  }

  .footer-links {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      margin-bottom: 12px;

      a, :deep(.router-link-active) {
        color: #a0aec0;
        text-decoration: none;
        font-size: 13px;
        transition: color 0.3s;

        &:hover {
          color: #409eff;
        }
      }
    }
  }
}

.social-links {
  display: flex;
  gap: 12px;

  .social-link {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a0aec0;
    transition: all 0.3s;

    &:hover {
      background: #409eff;
      color: #fff;
    }
  }
}

.footer-bottom {
  padding: 20px 0;
}

.bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #718096;
}

.copyright {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tech-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 968px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .bottom-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
