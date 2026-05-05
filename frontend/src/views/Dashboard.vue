<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">数据概览</span>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-total">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total || 0 }}</div>
              <div class="stat-label">总请求数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-success">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.successCount || 0 }}</div>
              <div class="stat-label">成功数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-old">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.oldUserCount || 0 }}</div>
              <div class="stat-label">老用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-new">
              <el-icon :size="32"><UserPlus /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.newUserCount || 0 }}</div>
              <div class="stat-label">新用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="应用名称">{{ systemInfo.appName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="版本号">{{ systemInfo.version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="运行环境">
              <el-tag :type="systemInfo.environment === 'development' ? 'warning' : 'success'">
                {{ systemInfo.environment || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务端口">{{ systemInfo.port || '-' }}</el-descriptions-item>
            <el-descriptions-item label="数据库">{{ systemInfo.database || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前时间">{{ systemInfo.timestamp ? new Date(systemInfo.timestamp).toLocaleString() : '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>业务流程说明</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(step, index) in businessSteps"
              :key="index"
              :timestamp="step.timestamp"
              placement="top"
              :type="step.type"
            >
              <el-card>
                <h4>{{ step.title }}</h4>
                <p style="color: #909399; font-size: 13px;">{{ step.description }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/utils/api'

const stats = ref({})
const systemInfo = ref({})

const businessSteps = [
  {
    title: '1. 准入校验',
    description: '收到加密手机号后，先判断用户是否在指定产品动用过。未动用用户默认准入通过；动用过用户进入风控等级验证。',
    timestamp: '第一步',
    type: 'primary'
  },
  {
    title: '2. 风控等级验证',
    description: '风控等级A、B、C、D、E、Z默认通过，等级为空或获取失败也默认通过。每个风控等级的准入结果都支持配置。',
    timestamp: '第二步',
    type: 'success'
  },
  {
    title: '3. 撞库处理',
    description: '准入通过后，判断用户是否在目标产品动用过。未动用用户进入风控黑名单校验；已动用用户还要判断上一次结清时间是否超过可配置天数。',
    timestamp: '第三步',
    type: 'warning'
  },
  {
    title: '4. 联合注册',
    description: '新用户进入联合注册流程，调用会员中心判断是否已注册；未注册则调用会员中心注册，按结果跳转新老用户下载URL。',
    timestamp: '第四步',
    type: 'danger'
  }
]

const loadData = async () => {
  try {
    const [statsRes, infoRes] = await Promise.all([
      adminApi.getStats(),
      adminApi.getSystemInfo()
    ])
    stats.value = statsRes.data || {}
    systemInfo.value = infoRes.data || {}
  } catch (error) {
    console.error('Load dashboard data failed:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.icon-total {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
}

.icon-success {
  background: linear-gradient(135deg, #67C23A, #85ce61);
}

.icon-old {
  background: linear-gradient(135deg, #E6A23C, #ebb563);
}

.icon-new {
  background: linear-gradient(135deg, #F56C6C, #f78989);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style>
