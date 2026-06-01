<template>
  <div class="page-container">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="page-title">合同管理</h1>
        <p class="page-subtitle">管理项目相关合同</p>
      </div>
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon>
        新增合同
      </el-button>
    </div>

    <div class="card">
      <el-table :data="contracts" border stripe>
        <el-table-column prop="contract_no" label="合同编号" width="130" />
        <el-table-column prop="name" label="合同名称" min-width="200" />
        <el-table-column prop="party_a" label="甲方" width="120" />
        <el-table-column prop="party_b" label="乙方" width="120" />
        <el-table-column prop="amount" label="合同金额" width="140">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 600;">¥{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sign_date" label="签订日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '执行中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="新增合同" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="所属项目">
          <el-select v-model="form.project_id" style="width: 100%;">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="合同编号">
          <el-input v-model="form.contract_no" />
        </el-form-item>
        <el-form-item label="合同名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="甲方">
          <el-input v-model="form.party_a" />
        </el-form-item>
        <el-form-item label="乙方">
          <el-input v-model="form.party_b" />
        </el-form-item>
        <el-form-item label="合同金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="签订日期">
          <el-date-picker v-model="form.sign_date" type="date" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitContract">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getContracts, createContract, getProjects } from '../api'
import { Plus } from '@element-plus/icons-vue'

const contracts = ref([])
const projects = ref([])
const dialogVisible = ref(false)

const form = ref({
  project_id: null,
  contract_no: '',
  name: '',
  party_a: '',
  party_b: '',
  amount: 0,
  sign_date: ''
})

const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const loadData = async () => {
  try {
    const [res, projRes] = await Promise.all([
      getContracts(),
      getProjects()
    ])
    contracts.value = res.data
    projects.value = projRes.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const openDialog = () => {
  form.value = {
    project_id: projects.value[0]?.id,
    contract_no: 'HT' + Date.now().toString().slice(-6),
    name: '',
    party_a: '',
    party_b: '',
    amount: 0,
    sign_date: ''
  }
  dialogVisible.value = true
}

const submitContract = async () => {
  try {
    await createContract(form.value)
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
