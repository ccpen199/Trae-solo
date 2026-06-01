<template>
  <div class="admin-exceptions">
    <el-card>
      <template #header>
        <span>异常订单仲裁</span>
      </template>
      <el-table :data="exceptions" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="reporter_name" label="上报人" width="100" />
        <el-table-column prop="type" label="异常类型" width="120">
          <template #default="{ row }">{{ getTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'pending' ? 'warning' : 'success'">
              {{ row.status === 'pending' ? '待处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="上报时间" width="160" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="handleException(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="handleVisible" title="处理异常" width="500px">
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="handleForm.result">
            <el-radio label="支持货主">支持货主</el-radio>
            <el-radio label="支持司机">支持司机</el-radio>
            <el-radio label="双方协调">双方协调</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="handleForm.note" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { exceptionAPI } from '@/api'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const exceptions = ref([])
const loading = ref(false)
const handleVisible = ref(false)
const currentException = ref(null)
const handleForm = ref({ result: '', note: '' })

const loadExceptions = async () => {
  loading.value = true
  const res = await exceptionAPI.list()
  if (res.success) {
    exceptions.value = res.data
  }
  loading.value = false
}

const getTypeText = (type) => {
  const texts = { refuse: '拒载', detour: '绕路', damage: '货损', other: '其他' }
  return texts[type] || type
}

const handleException = (row) => {
  currentException.value = row
  handleForm.value = { result: '', note: '' }
  handleVisible.value = true
}

const submitHandle = async () => {
  if (!handleForm.value.result) {
    ElMessage.warning('请选择处理结果')
    return
  }
  const res = await exceptionAPI.handle(currentException.value.id, {
    handler_id: user.id,
    result: handleForm.value.result + ' - ' + handleForm.value.note
  })
  if (res.success) {
    ElMessage.success('处理成功')
    handleVisible.value = false
    loadExceptions()
  }
}

onMounted(() => {
  loadExceptions()
})
</script>
