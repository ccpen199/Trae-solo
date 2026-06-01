<template>
  <div class="exceptions">
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" @change="loadExceptions">
        <el-radio-button value="all">全部异常</el-radio-button>
        <el-radio-button value="pending">待处理</el-radio-button>
        <el-radio-button value="handled">已处理</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="filteredExceptions" style="width: 100%">
      <el-table-column prop="type" label="异常类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getTypeTag(row.type)" size="small">{{ getTypeText(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="course_title" label="相关课程" show-overflow-tooltip />
      <el-table-column prop="user_name" label="相关人员" width="100" />
      <el-table-column prop="description" label="异常描述" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'pending' ? 'warning' : 'success'" size="small">
            {{ row.status === 'pending' ? '待处理' : '已处理' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="handler_name" label="处理人" width="100" />
      <el-table-column prop="handling_result" label="处理结果" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button 
            v-if="row.status === 'pending'" 
            type="primary" 
            link 
            size="small"
            @click="handleException(row)"
          >
            处理
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="处理异常" width="500px">
      <el-form label-width="80px">
        <el-form-item label="异常类型">
          <el-tag :type="getTypeTag(currentException?.type)" size="small">
            {{ getTypeText(currentException?.type) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="异常描述">
          <span>{{ currentException?.description }}</span>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input 
            v-model="handlingResult" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入处理结果"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandling" :loading="submitting">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const exceptions = ref([])
const statusFilter = ref('all')
const dialogVisible = ref(false)
const currentException = ref(null)
const handlingResult = ref('')
const submitting = ref(false)

const filteredExceptions = computed(() => {
  if (statusFilter.value === 'all') return exceptions.value
  return exceptions.value.filter(e => e.status === statusFilter.value)
})

async function loadExceptions() {
  try {
    exceptions.value = await api.get('/admin/exceptions')
  } catch (e) {}
}

function handleException(row) {
  currentException.value = row
  handlingResult.value = ''
  dialogVisible.value = true
}

async function submitHandling() {
  if (!handlingResult.value.trim()) {
    return ElMessage.warning('请输入处理结果')
  }
  
  submitting.value = true
  try {
    await api.post(`/admin/exceptions/${currentException.value.id}/handle`, {
      handling_result: handlingResult.value
    })
    ElMessage.success('处理成功')
    dialogVisible.value = false
    loadExceptions()
  } catch (error) {
    ElMessage.error('处理失败')
  } finally {
    submitting.value = false
  }
}

function getTypeText(type) {
  const texts = {
    late: '签到迟到',
    absent: '缺席',
    proxy: '代签到',
    interrupt: '直播中断',
    replay_unavailable: '回放不可用',
    retake: '考试重考'
  }
  return texts[type] || type
}

function getTypeTag(type) {
  const tags = {
    late: 'warning',
    absent: 'danger',
    proxy: 'danger',
    interrupt: 'warning',
    replay_unavailable: 'info',
    retake: 'info'
  }
  return tags[type] || 'info'
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(loadExceptions)
</script>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
}
</style>
