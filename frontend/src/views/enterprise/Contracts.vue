<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><EditPen /></el-icon> 企业劳动合同签章
      </div>
      <div>
        <el-radio-group v-model="activeTab" size="default">
          <el-radio-button label="pending">待签章</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="card">
      <div class="section-title">{{ activeTab === 'pending' ? '待签章合同列表' : '已完成合同列表' }}</div>
      <el-table :data="displayList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="contract_no" label="合同编号" width="180" />
        <el-table-column prop="employee_name" label="员工姓名" width="120" />
        <el-table-column prop="contract_type" label="合同类型" width="140" />
        <el-table-column prop="position" label="岗位" width="140" />
        <el-table-column prop="salary" label="薪资(元/月)" width="130">
          <template #default="{ row }">¥ {{ Number(row.salary || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column prop="status" label="状态" width="130">
          <template #default="{ row }">
            <span :class="['tag-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">
              <el-icon><View /></el-icon> 查看
            </el-button>
            <el-button
              size="small"
              type="success"
              link
              :disabled="row.enterprise_sign_status === 1"
              @click="signContract(row)"
            >
              <el-icon><EditPen /></el-icon> 电子签章
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && displayList.length === 0" description="暂无合同记录" />
    </div>

    <el-dialog v-model="showDetail" title="合同详情" width="650px">
      <el-descriptions :column="1" border v-if="current">
        <el-descriptions-item label="合同编号">{{ current.contract_no }}</el-descriptions-item>
        <el-descriptions-item label="员工姓名">{{ current.employee_name }}</el-descriptions-item>
        <el-descriptions-item label="员工身份证">{{ current.id_card }}</el-descriptions-item>
        <el-descriptions-item label="合同类型">{{ current.contract_type }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ current.position }}</el-descriptions-item>
        <el-descriptions-item label="薪资">¥ {{ Number(current.salary || 0).toLocaleString() }} / 月</el-descriptions-item>
        <el-descriptions-item label="工作地点">{{ current.work_place }}</el-descriptions-item>
        <el-descriptions-item label="合同期限">{{ current.start_date }} 至 {{ current.end_date }}</el-descriptions-item>
        <el-descriptions-item label="合同状态">
          <span :class="['tag-badge', statusClass(current.status)]">{{ statusText(current.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="用户签署状态">
          <span :class="['tag-badge', current.user_sign_status === 1 ? 'success' : 'warning']">
            {{ current.user_sign_status === 1 ? '已签署' : '待签署' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="企业签署状态">
          <span :class="['tag-badge', current.enterprise_sign_status === 1 ? 'success' : 'warning']">
            {{ current.enterprise_sign_status === 1 ? '已签署' : '待签署' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="用户签署时间">{{ current.user_sign_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业签署时间">{{ current.enterprise_sign_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同内容" v-if="current.content">
          <div style="white-space: pre-wrap;">{{ current.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button
          type="primary"
          :loading="signing"
          :disabled="current && current.enterprise_sign_status === 1"
          @click="signContract(current)"
        >
          <el-icon><EditPen /></el-icon> 企业电子签章
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const loading = ref(false)
const signing = ref(false)
const contracts = ref([])
const activeTab = ref('pending')
const showDetail = ref(false)
const current = ref(null)

const displayList = computed(() => {
  if (activeTab.value === 'pending') {
    return contracts.value.filter(c => c.enterprise_sign_status !== 1)
  }
  return contracts.value.filter(c => c.enterprise_sign_status === 1)
})

function statusText(s) {
  const map = {
    pending: '待签署',
    signed_user: '用户已签',
    signed_enterprise: '企业已签',
    completed: '已完成'
  }
  return map[s] || s
}

function statusClass(s) {
  const map = {
    pending: 'warning',
    signed_user: 'info',
    signed_enterprise: 'info',
    completed: 'success'
  }
  return map[s] || 'gray'
}

async function loadContracts() {
  loading.value = true
  try {
    const res = await api.get('/enterprise/contracts/pending')
    contracts.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function signContract(row) {
  try {
    await ElMessageBox.confirm('确认进行企业电子签章？签署后不可撤销。', '电子签章确认', { type: 'warning' })
    signing.value = true
    await api.post(`/enterprise/contracts/sign/${row.id}`)
    ElMessage.success('企业电子签章成功')
    showDetail.value = false
    loadContracts()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '签章失败')
    }
  } finally {
    signing.value = false
  }
}

function viewDetail(row) {
  current.value = row
  showDetail.value = true
}

function goBack() {
  router.push('/enterprise')
}

onMounted(loadContracts)
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
</style>
