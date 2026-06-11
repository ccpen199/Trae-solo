<template>
  <div class="personal-home">
    <div class="header-bar">
      <div class="user-info">
        <div class="avatar">
          <el-icon :size="28"><UserFilled /></el-icon>
        </div>
        <div class="user-detail">
          <div class="user-name">{{ profile.name || '用户' }}</div>
          <div class="user-id">{{ profile.id_card || '' }}</div>
        </div>
      </div>
      <el-button type="danger" plain size="small" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon> 退出
      </el-button>
    </div>

    <div class="page-container">
      <div class="page-title">
        <el-icon><HomeFilled /></el-icon> 个人服务中心
      </div>

      <div class="grid-stats">
        <div class="stat-card">
          <div class="label">我的合同</div>
          <div class="value">{{ stats.contracts }}</div>
        </div>
        <div class="stat-card green">
          <div class="label">失业登记</div>
          <div class="value">{{ stats.unemployment }}</div>
        </div>
        <div class="stat-card orange">
          <div class="label">职称申报</div>
          <div class="value">{{ stats.titles }}</div>
        </div>
        <div class="stat-card purple">
          <div class="label">争议调解</div>
          <div class="value">{{ stats.disputes }}</div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">核心业务办理</div>
        <div class="service-grid">
          <div class="service-card" @click="go('/personal/contracts')">
            <div class="icon"><el-icon><Document /></el-icon></div>
            <div class="title">电子劳动合同</div>
            <div class="desc">在线签署 · 电子签章</div>
          </div>
          <div class="service-card" @click="go('/personal/unemployment')">
            <div class="icon"><el-icon><Tickets /></el-icon></div>
            <div class="title">失业登记</div>
            <div class="desc">一键办结 · 快速办理</div>
          </div>
          <div class="service-card" @click="go('/personal/title')">
            <div class="icon"><el-icon><Medal /></el-icon></div>
            <div class="title">职称申报</div>
            <div class="desc">材料预审 · 在线申报</div>
          </div>
          <div class="service-card" @click="go('/personal/dispute')">
            <div class="icon"><el-icon><ScaleToBalance /></el-icon></div>
            <div class="title">劳动争议调解</div>
            <div class="desc">在线申请 · 公正调解</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">政策计算器</div>
        <div class="service-grid">
          <div class="service-card" @click="go('/personal/policy')">
            <div class="icon" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #047857;">
              <el-icon><Calculator /></el-icon>
            </div>
            <div class="title">社保补缴试算</div>
            <div class="desc">个人/企业缴费明细</div>
          </div>
          <div class="service-card" @click="go('/personal/policy')">
            <div class="icon" style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #b45309;">
              <el-icon><Money /></el-icon>
            </div>
            <div class="title">创业担保贷款</div>
            <div class="desc">额度模拟 · 利率计算</div>
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
const profile = ref({})
const stats = ref({ contracts: 0, unemployment: 0, titles: 0, disputes: 0 })

async function loadData() {
  try {
    const res = await api.get('/personal/profile')
    profile.value = res.data.data || {}
  } catch (_) {}
  try {
    const [c, u, t, d] = await Promise.all([
      api.get('/personal/contracts'),
      api.get('/personal/unemployment'),
      api.get('/personal/title-applications'),
      api.get('/personal/labor-disputes')
    ])
    stats.value = {
      contracts: c.data.data?.length || 0,
      unemployment: u.data.data?.filter(i => i.status === 'approved').length || 0,
      titles: t.data.data?.length || 0,
      disputes: d.data.data?.length || 0
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
.personal-home {
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
