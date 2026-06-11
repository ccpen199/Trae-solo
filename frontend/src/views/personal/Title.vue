<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Medal /></el-icon> 职称申报材料在线预审
      </div>
      <el-button type="primary" @click="showApply = true">
        <el-icon><Plus /></el-icon> 新建申报
      </el-button>
    </div>

    <div class="card">
      <div class="section-title">我的申报列表</div>
      <el-table :data="applications" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="application_no" label="申报编号" width="180" />
        <el-table-column prop="current_title" label="现有职称" width="120" />
        <el-table-column prop="apply_title" label="申报职称" width="120" />
        <el-table-column prop="apply_category" label="申报类别" width="120" />
        <el-table-column prop="education" label="学历" width="100" />
        <el-table-column prop="work_years" label="工作年限" width="100">
          <template #default="{ row }">{{ row.work_years }} 年</template>
        </el-table-column>
        <el-table-column prop="review_status" label="预审状态" width="120">
          <template #default="{ row }">
            <span :class="['tag-badge', reviewStatusClass(row.review_status)]">{{ reviewStatusText(row.review_status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申报时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">
              <el-icon><View /></el-icon> 查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && applications.length === 0" description="暂无申报记录" />
    </div>

    <el-dialog v-model="showApply" title="职称申报申请表" width="640px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="现有职称" prop="current_title">
              <el-select v-model="form.current_title" placeholder="请选择现有职称" style="width:100%">
                <el-option label="无" value="无" />
                <el-option label="初级" value="初级" />
                <el-option label="中级" value="中级" />
                <el-option label="副高级" value="副高级" />
                <el-option label="正高级" value="正高级" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申报职称" prop="apply_title">
              <el-select v-model="form.apply_title" placeholder="请选择申报职称" style="width:100%">
                <el-option label="初级" value="初级" />
                <el-option label="中级" value="中级" />
                <el-option label="副高级" value="副高级" />
                <el-option label="正高级" value="正高级" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申报类别" prop="apply_category">
              <el-select v-model="form.apply_category" placeholder="请选择申报类别" style="width:100%">
                <el-option label="工程技术" value="工程技术" />
                <el-option label="教育教学" value="教育教学" />
                <el-option label="医疗卫生" value="医疗卫生" />
                <el-option label="经济管理" value="经济管理" />
                <el-option label="农业技术" value="农业技术" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高学历" prop="education">
              <el-select v-model="form.education" placeholder="请选择最高学历" style="width:100%">
                <el-option label="中专" value="中专" />
                <el-option label="大专" value="大专" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="工作年限" prop="work_years">
          <el-input-number v-model="form.work_years" :min="0" :max="60" style="width:200px" />
          <span style="margin-left:8px;">年</span>
        </el-form-item>
        <el-form-item label="申报材料">
          <div class="material-upload">
            <div v-for="(mat, idx) in form.materials" :key="idx" class="material-item">
              <el-input v-model="mat.name" placeholder="材料名称" style="width:180px; margin-right:8px;" />
              <el-input v-model="mat.url" placeholder="材料链接/说明" style="flex:1;" />
              <el-button type="danger" link style="margin-left:8px;" @click="removeMaterial(idx)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain @click="addMaterial">
              <el-icon><Plus /></el-icon> 添加材料
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApply = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">提交预审</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="申报详情" width="600px">
      <el-descriptions :column="1" border v-if="current">
        <el-descriptions-item label="申报编号">{{ current.application_no }}</el-descriptions-item>
        <el-descriptions-item label="现有职称">{{ current.current_title }}</el-descriptions-item>
        <el-descriptions-item label="申报职称">{{ current.apply_title }}</el-descriptions-item>
        <el-descriptions-item label="申报类别">{{ current.apply_category }}</el-descriptions-item>
        <el-descriptions-item label="最高学历">{{ current.education }}</el-descriptions-item>
        <el-descriptions-item label="工作年限">{{ current.work_years }} 年</el-descriptions-item>
        <el-descriptions-item label="预审状态">
          <span :class="['tag-badge', reviewStatusClass(current.review_status)]">{{ reviewStatusText(current.review_status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="预审意见" v-if="current.review_comment">{{ current.review_comment }}</el-descriptions-item>
        <el-descriptions-item label="申报材料" v-if="current.materials">
          <div v-for="(mat, idx) in parseMaterials(current.materials)" :key="idx" class="mat-detail">
            <el-icon style="margin-right:4px;"><Paperclip /></el-icon>
            <span>{{ mat.name }}</span>
            <span v-if="mat.url" style="color:#1d4ed8; margin-left:8px;">{{ mat.url }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="申报时间">{{ current.created_at }}</el-descriptions-item>
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
const applications = ref([])
const showApply = ref(false)
const showDetail = ref(false)
const current = ref(null)
const formRef = ref(null)
const form = ref({
  current_title: '',
  apply_title: '',
  apply_category: '',
  education: '',
  work_years: 5,
  materials: [{ name: '', url: '' }]
})
const rules = {
  current_title: [{ required: true, message: '请选择现有职称', trigger: 'change' }],
  apply_title: [{ required: true, message: '请选择申报职称', trigger: 'change' }],
  apply_category: [{ required: true, message: '请选择申报类别', trigger: 'change' }],
  education: [{ required: true, message: '请选择最高学历', trigger: 'change' }],
  work_years: [{ required: true, message: '请输入工作年限', trigger: 'blur' }]
}

function reviewStatusText(s) {
  const map = { pending: '待审', approved: '通过', rejected: '驳回' }
  return map[s] || s
}
function reviewStatusClass(s) {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[s] || 'gray'
}
function parseMaterials(m) {
  try { return typeof m === 'string' ? JSON.parse(m) : (m || []) } catch { return [] }
}

async function loadApplications() {
  loading.value = true
  try {
    const res = await api.get('/personal/title-applications')
    applications.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function addMaterial() {
  form.value.materials.push({ name: '', url: '' })
}
function removeMaterial(idx) {
  if (form.value.materials.length > 1) form.value.materials.splice(idx, 1)
}

async function submitForm() {
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload = { ...form.value, materials: form.value.materials.filter(m => m.name) }
    await api.post('/personal/title-applications/submit', payload)
    ElMessage.success('材料已提交，等待预审')
    showApply.value = false
    formRef.value?.resetFields()
    form.value = { current_title: '', apply_title: '', apply_category: '', education: '', work_years: 5, materials: [{ name: '', url: '' }] }
    loadApplications()
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
  router.push('/personal')
}

onMounted(loadApplications)
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
.material-upload {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.material-item {
  display: flex;
  align-items: center;
  width: 100%;
}
.mat-detail {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}
</style>
