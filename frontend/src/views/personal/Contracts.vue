<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Document /></el-icon> 电子劳动合同
      </div>
      <el-button type="primary" @click="showCreate = true">
        <el-icon><Plus /></el-icon> 新建合同
      </el-button>
    </div>

    <div class="card">
      <div class="section-title">我的合同列表</div>
      <el-table :data="contracts" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="contract_no" label="合同编号" width="180" />
        <el-table-column prop="contract_type" label="合同类型" width="120" />
        <el-table-column prop="position" label="岗位" width="140" />
        <el-table-column prop="salary" label="薪资(元)" width="120">
          <template #default="{ row }">¥ {{ Number(row.salary || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <span :class="['tag-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">
              <el-icon><View /></el-icon> 查看
            </el-button>
            <el-button size="small" type="success" link :disabled="row.status !== 'pending'" @click="signContract(row)">
              <el-icon><EditPen /></el-icon> 电子签章
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && contracts.length === 0" description="暂无合同记录" />
    </div>

    <el-dialog v-model="showCreate" title="创建新劳动合同" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="合同类型" prop="contract_type">
          <el-select v-model="form.contract_type" placeholder="请选择合同类型" style="width:100%">
            <el-option label="固定期限" value="固定期限" />
            <el-option label="无固定期限" value="无固定期限" />
            <el-option label="以完成一定工作任务为期限" value="以完成一定工作任务为期限" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker v-model="form.start_date" type="date" placeholder="选择开始日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker v-model="form.end_date" type="date" placeholder="选择结束日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="岗位" prop="position">
          <el-input v-model="form.position" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="薪资(元)" prop="salary">
          <el-input-number v-model="form.salary" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="工作地点" prop="work_place">
          <el-input v-model="form.work_place" placeholder="请输入工作地点" />
        </el-form-item>
        <el-form-item label="合同内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="合同详细内容（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">提交并签署</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="合同详情" width="600px">
      <el-descriptions :column="1" border v-if="current">
        <el-descriptions-item label="合同编号">{{ current.contract_no }}</el-descriptions-item>
        <el-descriptions-item label="合同类型">{{ current.contract_type }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ current.position }}</el-descriptions-item>
        <el-descriptions-item label="薪资">¥ {{ Number(current.salary || 0).toLocaleString() }} / 月</el-descriptions-item>
        <el-descriptions-item label="工作地点">{{ current.work_place }}</el-descriptions-item>
        <el-descriptions-item label="合同期限">{{ current.start_date }} 至 {{ current.end_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="['tag-badge', statusClass(current.status)]">{{ statusText(current.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="用户签署时间">{{ current.user_sign_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业签署时间">{{ current.enterprise_sign_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同内容" v-if="current.content">
          <div style="white-space: pre-wrap;">{{ current.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const contracts = ref([])
const showCreate = ref(false)
const showDetail = ref(false)
const current = ref(null)
const formRef = ref(null)
const form = ref({
  contract_type: '固定期限',
  start_date: '',
  end_date: '',
  position: '',
  salary: 5000,
  work_place: '江西省',
  content: ''
})
const rules = {
  contract_type: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  position: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  salary: [{ required: true, message: '请输入薪资', trigger: 'blur' }],
  work_place: [{ required: true, message: '请输入工作地点', trigger: 'blur' }]
}

function statusText(s) {
  const map = { pending: '待签', signed_user: '用户已签', signed_enterprise: '企业已签', completed: '已完成' }
  return map[s] || s
}
function statusClass(s) {
  const map = { pending: 'warning', signed_user: 'info', signed_enterprise: 'info', completed: 'success' }
  return map[s] || 'gray'
}

async function loadContracts() {
  loading.value = true
  try {
    const res = await api.get('/personal/contracts')
    contracts.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  await formRef.value.validate()
  submitting.value = true
  try {
    await api.post('/personal/contracts/create', form.value)
    ElMessage.success('合同已创建并完成用户电子签章，等待企业签章')
    showCreate.value = false
    formRef.value?.resetFields()
    form.value = { contract_type: '固定期限', start_date: '', end_date: '', position: '', salary: 5000, work_place: '江西省', content: '' }
    loadContracts()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

async function signContract(row) {
  try {
    await ElMessageBox.confirm('确认进行电子签章？签署后不可撤销。', '电子签章确认', { type: 'warning' })
    await api.post(`/personal/contracts/sign/${row.id}`)
    ElMessage.success('电子签章成功')
    loadContracts()
  } catch (_) {}
}

function viewDetail(row) {
  current.value = row
  showDetail.value = true
}

function goBack() {
  router.push('/personal')
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
