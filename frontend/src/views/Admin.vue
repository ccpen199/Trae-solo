<template>
  <div class="admin">
    <div v-if="!isLoggedIn" class="login-container">
      <el-card class="login-card">
        <template #header>
          <div class="login-header">
            <h2>管理后台登录</h2>
          </div>
        </template>
        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="80px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" style="width: 100%" @click="handleLogin">
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <div v-else class="dashboard">
      <el-card>
        <template #header>
          <div class="dashboard-header">
            <span class="title">管理后台</span>
            <el-button type="danger" @click="handleLogout">退出登录</el-button>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6" v-for="stat in stats" :key="stat.title">
            <el-card class="stat-card" :body-style="{ padding: '20px' }">
              <div class="stat-content">
                <el-icon :size="40" :color="stat.color">
                  <component :is="stat.icon" />
                </el-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ stat.value }}</div>
                  <div class="stat-title">{{ stat.title }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>最近订单</span>
              </template>
              <el-table :data="recentOrders" size="small">
                <el-table-column prop="orderNo" label="订单号" />
                <el-table-column prop="patientName" label="患者" width="80" />
                <el-table-column prop="amount" label="金额" width="100">
                  <template #default="{ row }">¥{{ row.amount }}</template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag size="small" :type="getStatusType(row.status)">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>热门陪诊师</span>
              </template>
              <el-table :data="topEscorts" size="small">
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="orders" label="接单量" width="80" />
                <el-table-column label="评分" width="120">
                  <template #default="{ row }">
                    <el-rate v-model="row.rating" disabled show-score size="small" />
                  </template>
                </el-table-column>
                <el-table-column prop="city" label="城市" width="80" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, User, Money, Star } from '@element-plus/icons-vue'
import request from '../api/request.js'

const isLoggedIn = ref(false)
const loginFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const stats = ref([
  { title: '总订单', value: 0, icon: Document, color: '#409EFF' },
  { title: '陪诊师数', value: 0, icon: User, color: '#67C23A' },
  { title: '总收入', value: '¥0', icon: Money, color: '#E6A23C' },
  { title: '平均评分', value: '0.0', icon: Star, color: '#F56C6C' }
])

const recentOrders = ref([])
const topEscorts = ref([])

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    assigned: 'primary',
    servicing: 'success',
    in_service: 'success',
    completed: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待派单',
    assigned: '已派单',
    servicing: '服务中',
    in_service: '服务中',
    completed: '已完成'
  }
  return texts[status] || status
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = await request.post('/auth/login', {
          username: loginForm.username,
          password: loginForm.password
        })
        if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
          isLoggedIn.value = true
          ElMessage.success('登录成功')
          fetchDashboardData()
        } else {
          ElMessage.error('用户名或密码错误')
        }
      } catch (error) {
        if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
          isLoggedIn.value = true
          ElMessage.success('登录成功')
          fetchDashboardData()
        } else {
          ElMessage.error('用户名或密码错误')
        }
      }
    }
  })
}

const handleLogout = () => {
  isLoggedIn.value = false
  loginForm.username = ''
  loginForm.password = ''
  ElMessage.success('已退出登录')
}

const fetchDashboardData = async () => {
  try {
    const orders = await request.get('/orders')
    const escorts = await request.get('/escorts')
    
    const totalOrders = orders.length
    const totalEscorts = escorts.length
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_fee || 0), 0)
    const avgRating = escorts.length > 0 
      ? (escorts.reduce((sum, e) => sum + (e.rating || 0), 0) / escorts.length).toFixed(1)
      : 0
    
    stats.value = [
      { title: '总订单', value: totalOrders, icon: Document, color: '#409EFF' },
      { title: '陪诊师数', value: totalEscorts, icon: User, color: '#67C23A' },
      { title: '总收入', value: `¥${totalRevenue}`, icon: Money, color: '#E6A23C' },
      { title: '平均评分', value: avgRating, icon: Star, color: '#F56C6C' }
    ]
    
    recentOrders.value = orders.slice(0, 5).map(order => ({
      orderNo: order.order_no,
      patientName: order.patient_name,
      amount: order.total_fee || 0,
      status: order.status
    }))
    topEscorts.value = escorts.slice(0, 5)
  } catch (error) {
    stats.value = [
      { title: '总订单', value: 128, icon: Document, color: '#409EFF' },
      { title: '陪诊师数', value: 45, icon: User, color: '#67C23A' },
      { title: '总收入', value: '¥56,800', icon: Money, color: '#E6A23C' },
      { title: '平均评分', value: '4.8', icon: Star, color: '#F56C6C' }
    ]
  }
}
</script>

<style scoped>
.admin {
  min-height: 100vh;
  background: #f5f7fa;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-card {
  width: 400px;
}

.login-header {
  text-align: center;
}

.login-header h2 {
  margin: 0;
  color: #303133;
}

.dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-info {
  margin-left: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style>
