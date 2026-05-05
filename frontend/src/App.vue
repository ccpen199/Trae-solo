<template>
  <div class="app-container">
    <el-header class="site-header">
      <div class="header-content">
        <div class="logo" @click="router.push('/')">
          <el-icon :size="32" color="#409EFF"><Education /></el-icon>
          <span class="logo-text">智汇教育</span>
        </div>
        <el-menu
          :default-active="currentRoute"
          class="nav-menu"
          mode="horizontal"
          :router="true"
          background-color="transparent"
          text-color="#303133"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/courses">课程中心</el-menu-item>
          <el-menu-item index="/resources">资源下载</el-menu-item>
          <el-menu-item index="/questions">问答社区</el-menu-item>
          <el-menu-item index="/tests">在线测试</el-menu-item>
          <el-menu-item index="/jobs">就业服务</el-menu-item>
        </el-menu>
        <div class="user-actions">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="36" class="user-avatar">
                  <template v-if="userStore.user?.avatar">
                    <img :src="userStore.user.avatar" />
                  </template>
                  <template v-else>
                    <el-icon><User /></el-icon>
                  </template>
                </el-avatar>
                <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="router.push('/login')">登录</el-button>
            <el-button @click="router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>
    <main class="main-content">
      <router-view />
    </main>
    <el-footer class="site-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>关于智汇教育</h4>
          <p>智汇教育是一个综合性在线学习平台，为学生、在职人员、教师和程序员提供课程学习、资料下载、问答交流、在线测试和就业服务。</p>
        </div>
        <div class="footer-section">
          <h4>快速链接</h4>
          <ul>
            <li><router-link to="/courses">课程中心</router-link></li>
            <li><router-link to="/resources">资源下载</router-link></li>
            <li><router-link to="/questions">问答社区</router-link></li>
            <li><router-link to="/tests">在线测试</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>联系我们</h4>
          <p>邮箱: support@zhihui.com</p>
          <p>电话: 400-123-4567</p>
          <p>工作时间: 周一至周五 9:00-18:00</p>
        </div>
      </div>
      <div class="copyright">
        <p>&copy; 2024 智汇教育 版权所有 | 在线学习平台</p>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentRoute = computed(() => route.path)

onMounted(() => {
  userStore.initStore()
})

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    userStore.logout()
    router.push('/')
  }
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 64px !important;

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 20px;
  }

  .logo {
    display: flex;
    align-items: center;
    cursor: pointer;

    .logo-text {
      font-size: 22px;
      font-weight: 600;
      color: #303133;
      margin-left: 8px;
    }
  }

  .nav-menu {
    border-bottom: none;

    .el-menu-item {
      border-bottom: none !important;
      font-size: 15px;
    }
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      gap: 8px;

      .username {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

.main-content {
  flex: 1;
  background: #f5f7fa;
}

.site-footer {
  background: #303133;
  color: #909399;
  padding: 40px 0 20px;

  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-around;
    padding: 0 20px;
    flex-wrap: wrap;
    gap: 30px;
  }

  .footer-section {
    flex: 1;
    min-width: 250px;

    h4 {
      color: #fff;
      margin-bottom: 16px;
      font-size: 16px;
    }

    p {
      line-height: 1.8;
      font-size: 14px;
    }

    ul {
      list-style: none;

      li {
        margin-bottom: 10px;

        a {
          color: #909399;
          text-decoration: none;
          font-size: 14px;

          &:hover {
            color: #409EFF;
          }
        }
      }
    }
  }

  .copyright {
    text-align: center;
    padding-top: 20px;
    margin-top: 30px;
    border-top: 1px solid #444;
    font-size: 13px;
  }
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.el-card {
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}
</style>
