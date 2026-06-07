<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">预算管理</h2>
      <p class="page-subtitle">智能分配您的婚礼预算</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="card-shadow">
          <template #header>总预算设置</template>
          <el-form :model="budgetForm" label-width="80px">
            <el-form-item label="总预算">
              <el-input-number v-model="budgetForm.total" :min="0" :step="10000" style="width: 100%;" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBudget">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>预算明细</span>
              <el-button type="primary" size="small" @click="showAdd = true">添加</el-button>
            </div>
          </template>
          <el-table :data="budgetItems" style="width: 100%;">
            <el-table-column prop="category" label="分类" />
            <el-table-column prop="name" label="项目" />
            <el-table-column prop="budget_amount" label="预算金额">
              <template #default="{ row }">¥{{ row.budget_amount }}</template>
            </el-table-column>
            <el-table-column prop="percentage" label="占比">
              <template #default="{ row }">{{ row.percentage }}%</template>
            </el-table-column>
            <el-table-column prop="actual_amount" label="实际花费">
              <template #default="{ row }">¥{{ row.actual_amount }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="deleteItem(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAdd" title="添加预算项" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="分类">
          <el-select v-model="addForm.category" style="width: 100%;">
            <el-option label="婚纱摄影" value="婚纱摄影" />
            <el-option label="婚宴酒店" value="婚宴酒店" />
            <el-option label="婚庆服务" value="婚庆服务" />
            <el-option label="婚纱礼服" value="婚纱礼服" />
            <el-option label="珠宝首饰" value="珠宝首饰" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="addForm.name" />
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input-number v-model="addForm.budget_amount" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="占比(%)">
          <el-input-number v-model="addForm.percentage" :min="0" :max="100" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="addItem">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

const budgetForm = reactive({ total: 0 })
const budgetItems = ref([])
const showAdd = ref(false)
const addForm = reactive({
  category: '',
  name: '',
  budget_amount: 0,
  percentage: 0
})

async function loadBudget() {
  try {
    const profileRes = await api.get('/couple/profile')
    budgetForm.total = profileRes.data?.budget_total || 0
    
    const itemsRes = await api.get('/couple/budget')
    budgetItems.value = itemsRes.data
  } catch (e) {
    console.error(e)
  }
}

async function saveBudget() {
  try {
    await api.put('/couple/profile', { budget_total: budgetForm.total })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

async function addItem() {
  try {
    await api.post('/couple/budget', addForm)
    ElMessage.success('添加成功')
    showAdd.value = false
    loadBudget()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

async function deleteItem(id) {
  try {
    await api.delete(`/couple/budget/${id}`)
    ElMessage.success('删除成功')
    loadBudget()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadBudget()
})
</script>
