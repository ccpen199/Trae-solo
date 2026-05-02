<template>
  <div class="home-container">
    <el-container>
      <el-header class="header">
        <div class="logo">
          <h1>农产品溯源系统</h1>
        </div>
      </el-header>
      <el-main class="main">
        <el-row :gutter="20">
          <el-col :span="24" class="hero">
            <el-card shadow="hover" class="hero-card">
              <template #header>
                <div class="hero-title">
                  <h2>从产地到餐桌的全程可追溯</h2>
                </div>
              </template>
              <div class="hero-content">
                <p>农产品溯源系统实现了从种植、检测、流通到消费的完整追踪链路，确保食品安全。</p>
                <div class="role-cards">
                  <el-card
                    v-for="role in roles"
                    :key="role.key"
                    shadow="hover"
                    class="role-card"
                    @click="navigateToRole(role.key)"
                  >
                    <template #header>
                      <div class="role-header">
                        <el-icon :size="32"><component :is="role.icon" /></el-icon>
                        <h3>{{ role.name }}</h3>
                      </div>
                    </template>
                    <p>{{ role.description }}</p>
                  </el-card>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" class="features">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="feature-header">
                  <el-icon :size="24"><Edit /></el-icon>
                  <h3>农事作业记录</h3>
                </div>
              </template>
              <p>即时拍照存证，记录地理位置和时间戳，确保农事操作可追溯。</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="feature-header">
                  <el-icon :size="24"><Filter /></el-icon>
                  <h3>质量检测</h3>
                </div>
              </template>
              <p>实验室检测数据自动比对国标阈值，确保农产品质量安全。</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="feature-header">
                  <el-icon :size="24"><Monitor /></el-icon>
                  <h3>流通追踪</h3>
                </div>
              </template>
              <p>扫码交接，记录温湿度，实现物流环节的全程监控。</p>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
      <el-footer class="footer">
        <p>© 2026 农产品溯源系统 - 从产地到餐桌的安全保障</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  UserFilled,
  Tools,
  Van,
  User,
  Warning,
  Edit,
  Filter,
  Monitor
} from '@element-plus/icons-vue'

const router = useRouter()

const roles = [
  {
    key: 'farmer',
    name: '产地端',
    description: '管理农事作业、批次创建和农产品信息',
    icon: UserFilled
  },
  {
    key: 'quality',
    name: '质检端',
    description: '进行农残检测、国标比对和质量评估',
    icon: Tools
  },
  {
    key: 'flow',
    name: '流通端',
    description: '管理仓储物流、扫码交接和环境记录',
    icon: Van
  },
  {
    key: 'consumer',
    name: '消费端',
    description: '扫码溯源、查看全景地图和质量信息',
    icon: User
  },
  {
    key: 'recall',
    name: '召回管理',
    description: '处理质量召回、定位终端流向',
    icon: Warning
  }
]

const navigateToRole = (role) => {
  router.push(`/${role}/dashboard`)
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
}

.header {
  background-color: #409EFF;
  color: white;
  text-align: center;
  line-height: 60px;
  height: 60px;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.main {
  padding: 20px;
}

.hero {
  margin-bottom: 30px;
}

.hero-card {
  border-radius: 12px;
  overflow: hidden;
}

.hero-title {
  text-align: center;
  margin-bottom: 20px;
}

.hero-title h2 {
  font-size: 28px;
  color: #303133;
  margin: 0;
}

.hero-content p {
  text-align: center;
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
  line-height: 1.5;
}

.role-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.role-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.role-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.role-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.role-card p {
  color: #606266;
  line-height: 1.4;
  margin-top: 10px;
}

.features {
  margin-top: 30px;
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.footer {
  background-color: #f5f7fa;
  text-align: center;
  padding: 20px;
  margin-top: 40px;
  border-top: 1px solid #ebeef5;
}

.footer p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}
</style>
