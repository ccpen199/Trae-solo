<template>
  <div class="disputes">
    <div class="page-header">
      <h2 class="page-title">纠纷处理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 提交纠纷
      </el-button>
    </div>

    <el-card class="card-shadow">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" style="margin-top: 20px">
      <el-table :data="disputes" style="width: 100%">
        <el-table-column prop="complainant_name" label="投诉人" width="120" />
        <el-table-column prop="respondent_name" label="被投诉方" width="120" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'pending' ? 'warning' : 'success'">
              {{ row.status === 'pending' ? '待处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handle_result" label="处理结果" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleDispute(row)" v-if="row.status === 'pending'">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="提交纠纷" width="500px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="投诉人">
          <el-input v-model="formData.complainant_name" />
        </el-form-item>
        <el-form-item label="被投诉方">
          <el-input v-model="formData.respondent_name" />
        </el-form-item>
        <el-form-item label="纠纷类型">
          <el-select v-model="formData.type">
            <el-option label="租金纠纷" value="rent" />
            <el-option label="用途纠纷" value="usage" />
            <el-option label="土地损坏" value="damage" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="formData.description" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDispute">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showHandleDialog" title="处理纠纷" width="500px">
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="处理结果">
          <el-input type="textarea" v-model="handleForm.handle_result" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">提交处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../utils/request'

const disputes = ref([])
const showAddDialog = ref(false)
const showHandleDialog = ref(false)
const currentDispute = ref(null)

const searchForm = reactive({
  status: ''
})

const formData = reactive({
  complainant_name: '',
  respondent_name: '',
  type: 'rent',
  description: ''
})

const handleForm = reactive({
  handle_result: ''
})

const loadData = async () => {
  try {
    const res = await api.get('/disputes', searchForm)
    disputes.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const resetSearch = () => {
  searchForm.status = ''
  loadData()
}

const saveDispute = async () => {
  try {
    await api.post('/disputes', formData)
    ElMessage.success('提交成功')
    showAddDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

const handleDispute = (row) => {
  currentDispute.value = row
  handleForm.handle_result = ''
  showHandleDialog.value = true
}

const submitHandle = async () => {
  try {
    await api.put(`/disputes/${currentDispute.value.id}/handle`, {
      handler_id: 4,
      handle_result: handleForm.handle_result
    })
    ElMessage.success('处理完成')
    showHandleDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error('提交失败')
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
