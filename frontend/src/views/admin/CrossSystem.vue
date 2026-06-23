<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Connection /></el-icon> 跨系统数据融合
      </div>
      <el-button type="primary" :loading="syncing" @click="handleSync">
        <el-icon><Refresh /></el-icon> 一键同步
      </el-button>
    </div>

    <div class="card">
      <div class="section-title">个人档案查询</div>
      <div class="query-bar">
        <el-input v-model="queryIdCard" placeholder="请输入身份证号查询个人档案" style="max-width:360px;" clearable />
        <el-button type="primary" :loading="queryLoading" @click="queryPerson">
          <el-icon><Search /></el-icon> 查询
        </el-button>
      </div>
      <el-descriptions v-if="personResult" :column="2" border style="margin-top:16px;">
        <el-descriptions-item label="姓名">{{ personResult.profile?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证">{{ personResult.profile?.id_card || '-' }}</el-descriptions-item>
        <el-descriptions-item label="社保合同">
          <div v-if="personResult.contracts?.length" v-for="(c, i) in personResult.contracts" :key="i" class="sub-item">
            {{ c.contract_type || '' }} · {{ c.position || '' }} · {{ c.start_date || '' }} ~ {{ c.end_date || '-' }}
            <span :class="['tag-badge', c.status === 'completed' ? 'success' : 'warning']">{{ statusText(c.status) }}</span>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="失业登记">
          <div v-if="personResult.unemployment?.length" v-for="(u, i) in personResult.unemployment" :key="i" class="sub-item">
            {{ u.registration_no || '' }} · <span :class="['tag-badge', u.status === 'approved' ? 'success' : 'warning']">{{ u.status === 'approved' ? '已办结' : (u.status || '待审') }}</span>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="医保局数据" :span="2">
          <div v-if="personResult.medical?.length" v-for="(y, i) in personResult.medical" :key="i" class="sub-item">
            {{ y.data_type || '' }} · <span v-if="y.amount">¥ {{ Number(y.amount).toLocaleString() }}</span> · {{ y.period || '' }}
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="税务局数据" :span="2">
          <div v-if="personResult.tax?.length" v-for="(s, i) in personResult.tax" :key="i" class="sub-item">
            {{ s.data_type || '' }} · <span v-if="s.amount">¥ {{ Number(s.amount).toLocaleString() }}</span> · {{ s.period || '' }}
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="教育厅数据" :span="2">
          <div v-if="personResult.education?.length" v-for="(e, i) in personResult.education" :key="i" class="sub-item">
            {{ e.data_type || '' }} · <span v-if="e.amount">¥ {{ Number(e.amount).toLocaleString() }}</span> · {{ e.period || '' }}
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-if="queryIdCard && !personResult && !queryLoading" description="暂无该人员数据" style="margin-top:16px;" />
    </div>

    <div class="card">
      <div class="section-title">跨系统数据列表</div>
      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="医保局数据" name="medical_insurance" />
        <el-tab-pane label="税务局数据" name="tax_bureau" />
        <el-tab-pane label="教育厅数据" name="education_department" />
      </el-tabs>
      <el-table :data="dataList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="id_card" label="身份证" width="200" />
        <el-table-column prop="data_type" label="数据类型" width="180" />
        <el-table-column label="金额" min-width="150">
          <template #default="{ row }">
            <span v-if="row.amount">¥ {{ Number(row.amount).toLocaleString() }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="period" label="周期" width="140" />
        <el-table-column prop="sync_time" label="同步时间" width="180" />
      </el-table>
      <el-empty v-if="!loading && dataList.length === 0" description="暂无数据，请先点击一键同步" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const loading = ref(false)
const syncing = ref(false)
const queryLoading = ref(false)
const activeTab = ref('medical_insurance')
const dataList = ref([])
const queryIdCard = ref('')
const personResult = ref(null)

function statusText(s) {
  const m = { completed: '已完成', pending: '待签', signed_user: '个人已签', signed_enterprise: '企业已签' }
  return m[s] || s || '-'
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/admin/cross-system/data', { params: { source: activeTab.value } })
    dataList.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  syncing.value = true
  try {
    const res = await api.post('/admin/cross-system/sync')
    ElMessage.success(res.data.message || '数据同步成功')
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '同步失败')
  } finally {
    syncing.value = false
  }
}

async function queryPerson() {
  if (!queryIdCard.value.trim()) {
    ElMessage.warning('请输入身份证号')
    return
  }
  queryLoading.value = true
  personResult.value = null
  try {
    const res = await api.get('/admin/cross-system/query-person', { params: { id_card: queryIdCard.value } })
    personResult.value = res.data.data || null
    if (!personResult.value || !personResult.value.profile) ElMessage.info('未查询到该人员数据')
    else ElMessage.success('查询成功，已聚合该人员全部跨系统数据')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '查询失败')
  } finally {
    queryLoading.value = false
  }
}

function goBack() {
  router.push('/admin')
}

onMounted(loadData)
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}
.back-btn {
  cursor: pointer;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #1d4ed8;
}
.query-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
.sub-item {
  padding: 4px 0;
  font-size: 13px;
  color: #4b5563;
}
</style>
