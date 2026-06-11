<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Medal /></el-icon> 技能培训补贴申领
      </div>
      <el-button type="primary" @click="showApply = true">
        <el-icon><Plus /></el-icon> 新建申请
      </el-button>
    </div>

    <div class="card">
      <div class="section-title">申领记录</div>
      <el-table :data="subsidyList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="application_no" label="申请编号" width="160" />
        <el-table-column prop="training_name" label="培训名称" width="200" />
        <el-table-column prop="training_type" label="培训类型" width="140" />
        <el-table-column prop="trainee_count" label="参训人数" width="100" align="center" />
        <el-table-column label="培训周期" width="220">
          <template #default="{ row }">
            {{ row.training_start_date }} 至 {{ row.training_end_date }}
          </template>
        </el-table-column>
        <el-table-column prop="training_institution" label="培训机构" width="180" />
        <el-table-column prop="apply_amount" label="申请金额(元)" width="140">
          <template #default="{ row }">¥ {{ Number(row.apply_amount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['tag-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">
              <el-icon><View /></el-icon> 详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && subsidyList.length === 0" description="暂无申领记录" />
    </div>

    <el-dialog v-model="showApply" title="技能培训补贴申领" width="650px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="培训名称" prop="training_name">
          <el-input v-model="form.training_name" placeholder="请输入培训名称" />
        </el-form-item>
        <el-form-item label="培训类型" prop="training_type">
          <el-select v-model="form.training_type" placeholder="请选择培训类型" style="width:100%">
            <el-option label="职业技能培训" value="职业技能培训" />
            <el-option label="岗位技能提升培训" value="岗位技能提升培训" />
            <el-option label="创业培训" value="创业培训" />
            <el-option label="安全技能培训" value="安全技能培训" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="参训人数" prop="trainee_count">
          <el-input-number v-model="form.trainee_count" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="起止日期" prop="dateRange">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="培训机构" prop="training_institution">
          <el-input v-model="form.training_institution" placeholder="请输入培训机构名称" />
        </el-form-item>
        <el-form-item label="申请金额(元)" prop="apply_amount">
          <el-input-number v-model="form.apply_amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="申请材料">
          <el-upload
            :auto-upload="false"
            :on-change="handleMaterialChange"
            :on-remove="handleMaterialRemove"
            multiple
          >
            <el-button type="primary" plain>
              <el-icon><Upload /></el-icon> 上传材料
            </el-button>
            <template #tip>
              <div class="el-upload__tip">支持PDF、Word、图片等格式，可上传多个文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelApply">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitApply">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="申领详情" width="600px">
      <el-descriptions :column="1" border v-if="current">
        <el-descriptions-item label="申请编号">{{ current.application_no }}</el-descriptions-item>
        <el-descriptions-item label="培训名称">{{ current.training_name }}</el-descriptions-item>
        <el-descriptions-item label="培训类型">{{ current.training_type }}</el-descriptions-item>
        <el-descriptions-item label="参训人数">{{ current.trainee_count }} 人</el-descriptions-item>
        <el-descriptions-item label="培训周期">{{ current.training_start_date }} 至 {{ current.training_end_date }}</el-descriptions-item>
        <el-descriptions-item label="培训机构">{{ current.training_institution }}</el-descriptions-item>
        <el-descriptions-item label="申请金额">¥ {{ Number(current.apply_amount || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="审批状态">
          <span :class="['tag-badge', statusClass(current.status)]">{{ statusText(current.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ current.created_at }}</el-descriptions-item>
        <el-descriptions-item label="审批意见" v-if="current.review_remark">
          {{ current.review_remark }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const subsidyList = ref([])
const showApply = ref(false)
const showDetail = ref(false)
const current = ref(null)
const formRef = ref(null)
const materials = ref([])
const form = ref({
  training_name: '',
  training_type: '职业技能培训',
  trainee_count: 1,
  dateRange: [],
  training_institution: '',
  apply_amount: 0
})
const rules = {
  training_name: [{ required: true, message: '请输入培训名称', trigger: 'blur' }],
  training_type: [{ required: true, message: '请选择培训类型', trigger: 'change' }],
  trainee_count: [{ required: true, message: '请输入参训人数', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择培训起止日期', trigger: 'change' }],
  training_institution: [{ required: true, message: '请输入培训机构名称', trigger: 'blur' }],
  apply_amount: [{ required: true, message: '请输入申请金额', trigger: 'blur' }]
}

function statusText(s) {
  const map = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[s] || s
}

function statusClass(s) {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[s] || 'gray'
}

function handleMaterialChange(file) {
  materials.value.push({ name: file.name, size: file.size })
}

function handleMaterialRemove(file) {
  const index = materials.value.findIndex(m => m.name === file.name)
  if (index > -1) materials.value.splice(index, 1)
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/enterprise/training-subsidies')
    subsidyList.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    training_name: '',
    training_type: '职业技能培训',
    trainee_count: 1,
    dateRange: [],
    training_institution: '',
    apply_amount: 0
  }
  materials.value = []
  formRef.value?.resetFields()
}

function cancelApply() {
  showApply.value = false
  resetForm()
}

async function submitApply() {
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload = {
      training_name: form.value.training_name,
      training_type: form.value.training_type,
      trainee_count: form.value.trainee_count,
      training_start_date: form.value.dateRange[0],
      training_end_date: form.value.dateRange[1],
      training_institution: form.value.training_institution,
      apply_amount: form.value.apply_amount,
      materials: materials.value
    }
    await api.post('/enterprise/training-subsidies/apply', payload)
    ElMessage.success('培训补贴申请已提交')
    showApply.value = false
    resetForm()
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function viewDetail(row) {
  current.value = row
  showDetail.value = true
}

function goBack() {
  router.push('/enterprise')
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
</style>
