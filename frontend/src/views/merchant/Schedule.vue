<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">档期管理</h2>
        <p class="page-subtitle">管理您的可预约时间</p>
      </div>
      <el-button type="primary" @click="showAdd = true">添加档期</el-button>
    </div>

    <el-card class="card-shadow">
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        placeholder="选择月份"
        style="margin-bottom: 20px;"
        @change="loadSchedules"
      />
      
      <el-table :data="schedules" style="width: 100%;">
        <el-table-column prop="date" label="日期" width="150" />
        <el-table-column prop="time_slots" label="时间段">
          <template #default="{ row }">
            <el-tag v-for="slot in row.time_slots" :key="slot" size="small" style="margin-right: 6px;">
              {{ slot }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_booked" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_booked ? 'danger' : 'success'">
              {{ row.is_booked ? '已预约' : '可预约' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="editSchedule(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="deleteSchedule(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAdd" :title="isEdit ? '编辑档期' : '添加档期'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="日期">
          <el-date-picker v-model="form.date" type="date" style="width: 100%;" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-select v-model="form.time_slots" multiple style="width: 100%;">
            <el-option label="上午 9:00-12:00" value="上午 9:00-12:00" />
            <el-option label="下午 14:00-17:00" value="下午 14:00-17:00" />
            <el-option label="晚上 18:00-21:00" value="晚上 18:00-21:00" />
            <el-option label="全天" value="全天" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="saveSchedule">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const selectedMonth = ref(new Date())
const schedules = ref([])
const showAdd = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const form = reactive({
  date: '',
  time_slots: []
})

async function loadSchedules() {
  try {
    const start = dayjs(selectedMonth.value).startOf('month').format('YYYY-MM-DD')
    const end = dayjs(selectedMonth.value).endOf('month').format('YYYY-MM-DD')
    const res = await api.get('/merchant/schedules', { params: { start_date: start, end_date: end } })
    schedules.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function editSchedule(row) {
  isEdit.value = true
  editingId.value = row.id
  form.date = row.date
  form.time_slots = row.time_slots
  showAdd.value = true
}

async function saveSchedule() {
  try {
    if (isEdit.value) {
      await api.put(`/merchant/schedules/${editingId.value}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/merchant/schedules', form)
      ElMessage.success('添加成功')
    }
    showAdd.value = false
    loadSchedules()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
}

async function deleteSchedule(id) {
  try {
    await ElMessageBox.confirm('确定删除此档期吗？', '提示', { type: 'warning' })
    await api.delete(`/merchant/schedules/${id}`)
    ElMessage.success('删除成功')
    loadSchedules()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadSchedules()
})
</script>
