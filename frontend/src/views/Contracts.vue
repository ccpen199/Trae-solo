<template>
  <div class="contracts">
    <div class="page-header">
      <h2 class="page-title">合同管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 新建合同
      </el-button>
    </div>

    <el-card class="card-shadow">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="待备案" value="pending_approval" />
            <el-option label="村集体已批" value="village_approved" />
            <el-option label="生效中" value="active" />
            <el-option label="已终止" value="terminated" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" style="margin-top: 20px">
      <el-table :data="contracts" style="width: 100%">
        <el-table-column prop="contract_no" label="合同编号" width="140" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            {{ typeMap[row.type] }}
          </template>
        </el-table-column>
        <el-table-column prop="lessor_name" label="出租方" width="100" />
        <el-table-column prop="lessee_name" label="承租方" width="120" />
        <el-table-column prop="area" label="面积(亩)" width="90" />
        <el-table-column prop="price" label="单价" width="90" />
        <el-table-column prop="total_amount" label="总金额" width="110" />
        <el-table-column prop="start_date" label="开始日期" width="110" />
        <el-table-column prop="end_date" label="结束日期" width="110" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="$router.push(`/contracts/${row.id}`)">查看</el-button>
            <el-dropdown v-if="row.status === 'draft'" @command="(cmd) => handleAction(cmd, row)">
              <el-button size="small" type="primary">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="approve">村集体备案</el-dropdown-item>
                  <el-dropdown-item command="sign">签署合同</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" type="danger" @click="terminateContract(row)" v-if="row.status === 'active'">终止</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新建合同" width="700px">
      <el-form :model="formData" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同编号">
              <el-input v-model="formData.contract_no" placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="流转类型">
              <el-select v-model="formData.type">
                <el-option label="出租" value="lease" />
                <el-option label="转包" value="sublease" />
                <el-option label="入股" value="share" />
                <el-option label="托管" value="trust" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出租方">
              <el-input v-model="formData.lessor_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="承租方">
              <el-input v-model="formData.lessee_name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="面积(亩)">
              <el-input-number v-model="formData.area" :min="0" :precision="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价(元/亩/年)">
              <el-input-number v-model="formData.price" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期限(年)">
              <el-input-number v-model="formData.term" :min="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用途">
              <el-input v-model="formData.usage" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker v-model="formData.start_date" type="date" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker v-model="formData.end_date" type="date" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveContract">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../utils/request'

const contracts = ref([])
const showAddDialog = ref(false)

const typeMap = {
  lease: '出租',
  sublease: '转包',
  share: '入股',
  trust: '托管'
}

const searchForm = reactive({
  status: ''
})

const formData = reactive({
  contract_no: '',
  type: 'lease',
  lessor_name: '',
  lessee_name: '',
  area: 0,
  price: 0,
  term: 5,
  start_date: '',
  end_date: '',
  usage: '',
  total_amount: 0
})

const statusType = (status) => {
  const map = { draft: 'info', pending_approval: 'warning', village_approved: 'primary', active: 'success', terminated: 'danger' }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = { draft: '草稿', pending_approval: '待备案', village_approved: '村集体已批', active: '生效中', terminated: '已终止' }
  return map[status] || status
}

const loadData = async () => {
  try {
    const res = await api.get('/contracts', searchForm)
    contracts.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const resetSearch = () => {
  searchForm.status = ''
  loadData()
}

const saveContract = async () => {
  try {
    formData.contract_no = formData.contract_no || `HT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    formData.total_amount = formData.area * formData.price * formData.term
    await api.post('/contracts', formData)
    ElMessage.success('创建成功')
    showAddDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  }
}

const handleAction = async (cmd, row) => {
  try {
    if (cmd === 'approve') {
      await api.put(`/contracts/${row.id}/approve-village`)
      ElMessage.success('村集体备案成功')
    } else if (cmd === 'sign') {
      await api.put(`/contracts/${row.id}/sign`)
      ElMessage.success('合同签署成功')
    }
    loadData()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const terminateContract = async (row) => {
  try {
    await ElMessageBox.confirm('确定要终止该合同吗？', '提示', { type: 'warning' })
    await api.put(`/contracts/${row.id}/terminate`)
    ElMessage.success('合同已终止')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(loadData)
</script>

<style scoped>
.search-form {
  display: flex;
  flex-wrap: wrap;
}
</style>
