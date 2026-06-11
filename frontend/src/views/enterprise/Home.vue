<template>
  <div class="enterprise-home">
    <div class="header-bar">
      <div class="user-info">
        <div class="avatar">
          <el-icon :size="28"><OfficeBuilding /></el-icon>
        </div>
        <div class="user-detail">
          <div class="user-name">{{ enterprise.name || '企业用户' }}</div>
          <div class="user-id">{{ enterprise.credit_code || '' }}</div>
        </div>
      </div>
      <el-button type="danger" plain size="small" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon> 退出
      </el-button>
    </div>

    <div class="page-container">
      <div class="page-title">
        <el-icon><HomeFilled /></el-icon> 企业服务中心
      </div>

      <div class="card">
        <div class="section-title">企业基本信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="企业名称">{{ enterprise.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="统一信用代码">{{ enterprise.credit_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="法定代表人">{{ enterprise.legal_person || '-' }}</el-descriptions-item>
          <el-descriptions-item label="员工人数">{{ enterprise.employee_count || 0 }} 人</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="grid-stats">
        <div class="stat-card">
          <div class="label">在用工数</div>
          <div class="value">{{ stats.employment }}</div>
        </div>
        <div class="stat-card green">
          <div class="label">工资专户数</div>
          <div class="value">{{ stats.wageAccounts }}</div>
        </div>
        <div class="stat-card orange">
          <div class="label">培训补贴申请</div>
          <div class="value">{{ stats.subsidies }}</div>
        </div>
        <div class="stat-card purple">
          <div class="label">待签章合同</div>
          <div class="value">{{ stats.contracts }}</div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">核心业务办理</div>
        <div class="service-grid">
          <div class="service-card" @click="go('/enterprise/employment')">
            <div class="icon"><el-icon><User /></el-icon></div>
            <div class="title">用工备案批量导入</div>
            <div class="desc">CSV上传 · 批量录入</div>
          </div>
          <div class="service-card" @click="go('/enterprise/subsidy')">
            <div class="icon" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #047857;">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="title">技能培训补贴申领</div>
            <div class="desc">在线申报 · 材料上传</div>
          </div>
          <div class="service-card" @click="go('/enterprise/wage')">
            <div class="icon" style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #b45309;">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="title">农民工工资专户监管</div>
            <div class="desc">专户管理 · 工资发放</div>
          </div>
          <div class="service-card" @click="go('/enterprise/contracts')">
            <div class="icon" style="background: linear-gradient(135deg, #ede9fe, #ddd6fe); color: #6d28d9;">
              <el-icon><EditPen /></el-icon>
            </div>
            <div class="title">劳动合同电子签章</div>
            <div class="desc">在线签章 · 批量管理</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store/auth'
import api from '../../store/auth'

const router = useRouter()
const auth = useAuthStore()
const enterprise = ref({})
const stats = ref({ employment: 0, wageAccounts: 0, subsidies: 0, contracts: 0 })

async function loadData() {
  try {
    const res = await api.get('/enterprise/info')
    enterprise.value = res.data.data || {}
  } catch (_) {}
  try {
    const [e, w, s, c] = await Promise.all([
      api.get('/enterprise/employment-records'),
      api.get('/enterprise/wage-accounts'),
      api.get('/enterprise/training-subsidies'),
      api.get('/enterprise/contracts/pending')
    ])
    stats.value = {
      employment: e.data.data?.total || e.data.data?.length || 0,
      wageAccounts: w.data.data?.length || 0,
      subsidies: s.data.data?.length || 0,
      contracts: c.data.data?.length || 0
    }
  } catch (_) {}
}

function go(path) {
  router.push(path)
}

function handleLogout() {
  auth.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

onMounted(loadData)
</script>

<style scoped>
.enterprise-home {
  min-height: 100vh;
  background: #f5f7fa;
}
.header-bar {
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%);
  padding: 24px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-name {
  font-size: 18px;
  font-weight: 600;
}
.user-id {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #1d4ed8;
}
</style>
