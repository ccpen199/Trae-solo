<template>
  <div class="performance">
    <div class="page-header">
      <h2 class="page-title">履约管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 添加记录
      </el-button>
    </div>

    <el-card class="card-shadow">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option label="租金支付" value="rent" />
            <el-option label="种植用途" value="crop" />
            <el-option label="土地保护" value="protection" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" style="margin-top: 20px">
      <el-table :data="records" style="width: 100%">
        <el-table-column prop="contract_id" label="合同ID" width="100" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            {{ typeMap[row.type] }}
          </template>
        </el-table-column>
        <el-table-column prop="record_date" label="记录日期" width="120" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'warning'" size="small">
              {{ row.status === 'normal' ? '正常' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加履约记录" width="500px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="合同ID">
          <el-input-number v-model="formData.contract_id" :min="1" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="formData.type">
            <el-option label="租金支付" value="rent" />
            <el-option label="种植用途" value="crop" />
            <el-option label="土地保护" value="protection" />
            <el-option label="纠纷投诉" value="dispute" />
            <el-option label="提前终止" value="termination" />
          </el-select>
        </el-form-item>
        <el-form-item label="记录日期">
          <el-date-picker v-model="formData.record_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="formData.description" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="normal">正常</el-radio>
            <el-radio value="abnormal">异常</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../utils/request'

const records = ref([])
const showAddDialog = ref(false)

const typeMap = {
  rent: '租金支付',
  crop: '种植用途',
  protection: '土地保护',
  dispute: '纠纷投诉',
  termination: '提前终止'
}

const searchForm = reactive({
  type: ''
})

const formData = reactive({
  contract_id: 1,
  type: 'rent',
  record_date: '',
  description: '',
  status: 'normal'
})

const loadData = async () => {
  try {
    const res = await api.get('/performance', searchForm)
    records.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const resetSearch = () => {
  searchForm.type = ''
  loadData()
}

const saveRecord = async () => {
  try {
    await api.post('/performance', formData)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error('保存失败')
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
