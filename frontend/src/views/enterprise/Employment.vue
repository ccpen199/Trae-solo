<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><User /></el-icon> 用工备案批量导入
      </div>
      <el-button type="primary" @click="showManual = true">
        <el-icon><Plus /></el-icon> 手动录入
      </el-button>
    </div>

    <div class="card">
      <div class="section-title">CSV文件导入</div>
      <el-upload
        drag
        :auto-upload="false"
        :limit="1"
        accept=".csv"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将CSV文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            请上传CSV格式文件，列顺序为：姓名、身份证、手机号、岗位、入职日期、薪资、合同类型
          </div>
        </template>
      </el-upload>
      <div v-if="uploadFile" style="margin-top: 16px; text-align: right;">
        <el-button type="primary" :loading="uploading" @click="uploadCSV">
          <el-icon><Upload /></el-icon> 确认导入
        </el-button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">导入历史记录</div>
      <el-table :data="historyList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="batch_no" label="批次号" width="180" />
        <el-table-column label="导入条数" width="120">
          <template #default="{ row }">
            <span class="tag-badge success">{{ row.count || 0 }} 条</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="导入时间" />
      </el-table>
      <el-empty v-if="!loading && historyList.length === 0" description="暂无导入记录" />
    </div>

    <div class="card">
      <div class="section-title">用工备案列表</div>
      <el-table :data="recordList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="employee_name" label="姓名" width="120" />
        <el-table-column prop="id_card" label="身份证号" width="200" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="position" label="岗位" width="140" />
        <el-table-column prop="start_date" label="入职日期" width="120" />
        <el-table-column prop="salary" label="薪资(元/月)" width="130">
          <template #default="{ row }">¥ {{ Number(row.salary || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="contract_type" label="合同类型" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['tag-badge', row.status === 'active' ? 'success' : 'gray']">
              {{ row.status === 'active' ? '在用' : '离职' }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showManual" title="手动录录用工备案" width="700px">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #6b7280; font-size: 13px;">已录入 {{ manualRecords.length }} 条记录</span>
        <el-button size="small" type="primary" plain @click="addManualRow">
          <el-icon><Plus /></el-icon> 新增一行
        </el-button>
      </div>
      <el-table :data="manualRecords" border style="width: 100%">
        <el-table-column label="姓名" width="110">
          <template #default="{ row, $index }">
            <el-input v-model="row.employee_name" size="small" placeholder="姓名" />
          </template>
        </el-table-column>
        <el-table-column label="身份证" width="170">
          <template #default="{ row }">
            <el-input v-model="row.id_card" size="small" placeholder="身份证号" />
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="120">
          <template #default="{ row }">
            <el-input v-model="row.phone" size="small" placeholder="手机号" />
          </template>
        </el-table-column>
        <el-table-column label="岗位" width="100">
          <template #default="{ row }">
            <el-input v-model="row.position" size="small" placeholder="岗位" />
          </template>
        </el-table-column>
        <el-table-column label="入职日期" width="130">
          <template #default="{ row }">
            <el-date-picker v-model="row.start_date" type="date" size="small" value-format="YYYY-MM-DD" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="薪资" width="100">
          <template #default="{ row }">
            <el-input-number v-model="row.salary" :min="0" size="small" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="合同类型" width="130">
          <template #default="{ row }">
            <el-select v-model="row.contract_type" size="small" style="width:100%">
              <el-option label="固定期限" value="固定期限" />
              <el-option label="无固定期限" value="无固定期限" />
              <el-option label="以完成一定工作任务为期限" value="以完成一定工作任务为期限" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="removeManualRow($index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="cancelManual">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitManual">批量提交</el-button>
      </template>
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
const uploading = ref(false)
const submitting = ref(false)
const uploadFile = ref(null)
const recordList = ref([])
const historyList = ref([])
const showManual = ref(false)
const manualRecords = ref([])

function addManualRow() {
  manualRecords.value.push({
    employee_name: '',
    id_card: '',
    phone: '',
    position: '',
    start_date: '',
    salary: 5000,
    contract_type: '固定期限'
  })
}

function removeManualRow(index) {
  manualRecords.value.splice(index, 1)
}

function cancelManual() {
  showManual.value = false
  manualRecords.value = []
}

function handleFileChange(file) {
  uploadFile.value = file.raw
}

function handleFileRemove() {
  uploadFile.value = null
}

async function uploadCSV() {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择CSV文件')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value)
    const res = await api.post('/enterprise/employment-records/batch-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    ElMessage.success(res.data.message || '导入成功')
    uploadFile.value = null
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '导入失败')
  } finally {
    uploading.value = false
  }
}

async function submitManual() {
  const valid = manualRecords.value.filter(r => r.employee_name && r.id_card)
  if (valid.length === 0) {
    ElMessage.warning('请至少填写一条有效记录（姓名和身份证必填）')
    return
  }
  submitting.value = true
  try {
    const res = await api.post('/enterprise/employment-records/batch-import', { records: valid })
    ElMessage.success(res.data.message || '导入成功')
    showManual.value = false
    manualRecords.value = []
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/enterprise/employment-records')
    const data = res.data.data
    if (data && Array.isArray(data.list)) {
      recordList.value = data.list
      const batchMap = {}
      data.list.forEach(item => {
        if (item.batch_no) {
          if (!batchMap[item.batch_no]) {
            batchMap[item.batch_no] = { batch_no: item.batch_no, count: 0, created_at: item.created_at }
          }
          batchMap[item.batch_no].count++
        }
      })
      historyList.value = Object.values(batchMap).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    } else if (Array.isArray(data)) {
      recordList.value = data
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/enterprise')
}

onMounted(() => {
  addManualRow()
  loadData()
})
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
