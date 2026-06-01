<template>
  <div class="page-container">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="page-title">到账管理</h1>
        <p class="page-subtitle">管理项目经费到账记录</p>
      </div>
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon>
        新增到账
      </el-button>
    </div>

    <div class="card">
      <el-table :data="receipts" border stripe>
        <el-table-column prop="receipt_no" label="到账编号" width="130" />
        <el-table-column prop="project_name" label="所属项目" min-width="200" />
        <el-table-column prop="batch_no" label="拨款批次" width="120" />
        <el-table-column prop="amount" label="拨款金额" width="130">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 600;">¥{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="matching_funds" label="配套经费" width="130">
          <template #default="{ row }">
            ¥{{ formatMoney(row.matching_funds) }}
          </template>
        </el-table-column>
        <el-table-column label="合计" width="130">
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: 600;">
              ¥{{ formatMoney((row.amount || 0) + (row.matching_funds || 0)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="receipt_date" label="到账日期" width="120" />
        <el-table-column prop="source" label="资金来源" width="150" />
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="新增到账" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="所属项目">
          <el-select v-model="form.project_id" style="width: 100%;">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="到账编号">
          <el-input v-model="form.receipt_no" />
        </el-form-item>
        <el-form-item label="拨款批次">
          <el-input v-model="form.batch_no" />
        </el-form-item>
        <el-form-item label="拨款金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="配套经费">
          <el-input-number v-model="form.matching_funds" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="到账日期">
          <el-date-picker v-model="form.receipt_date" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="资金来源">
          <el-input v-model="form.source" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReceipt">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFundReceipts, createFundReceipt, getProjects } from '../api'
import { Plus } from '@element-plus/icons-vue'

const receipts = ref([])
const projects = ref([])
const dialogVisible = ref(false)

const form = ref({
  project_id: null,
  receipt_no: '',
  batch_no: '',
  amount: 0,
  matching_funds: 0,
  receipt_date: '',
  source: '',
  remark: ''
})

const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const loadData = async () => {
  try {
    const [res, projRes] = await Promise.all([
      getFundReceipts(),
      getProjects()
    ])
    receipts.value = res.data
    projects.value = projRes.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const openDialog = () => {
  form.value = {
    project_id: projects.value[0]?.id,
    receipt_no: 'DK' + Date.now().toString().slice(-6),
    batch_no: '',
    amount: 0,
    matching_funds: 0,
    receipt_date: '',
    source: '',
    remark: ''
  }
  dialogVisible.value = true
}

const submitReceipt = async () => {
  try {
    await createFundReceipt(form.value)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '创建失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
