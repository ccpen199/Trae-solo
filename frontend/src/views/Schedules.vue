<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">排班校验</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增排班
      </el-button>
    </div>

    <div class="search-bar">
      <el-date-picker v-model="searchDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
      <el-button type="primary" @click="loadSchedules">搜索</el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="schedules" stripe style="width: 100%;">
        <el-table-column prop="schedule_date" label="日期" width="120" />
        <el-table-column prop="shift" label="班次" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.shift }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="position_name" label="岗位" width="120" />
        <el-table-column prop="employee_name" label="员工" width="100" />
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="qualification_check" label="资格校验" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.qualification_check === 'pass'" type="success">通过</el-tag>
            <el-tag v-else-if="row.qualification_check === 'warning'" type="warning">有警告</el-tag>
            <el-tag v-else type="info">未校验</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="check_note" label="校验说明" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" type="primary" @click="checkSchedule(row)">资格校验</el-button>
              <el-button size="small" type="danger" @click="deleteSchedule(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增排班" width="500px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="排班日期">
          <el-date-picker v-model="scheduleForm.schedule_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="scheduleForm.shift" style="width: 100%;">
            <el-option label="早班" value="早班" />
            <el-option label="中班" value="中班" />
            <el-option label="晚班" value="晚班" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="scheduleForm.position_id" style="width: 100%;">
            <el-option v-for="pos in positions" :key="pos.id" :label="pos.position_name" :value="pos.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="员工">
          <el-select v-model="scheduleForm.employee_id" style="width: 100%;">
            <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSchedule">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCheckResult" title="资格校验结果" width="500px">
      <el-result
        :icon="checkResult.checkResult === 'pass' ? 'success' : 'warning'"
        :title="checkResult.checkResult === 'pass' ? '校验通过' : '存在问题'"
        :sub-title="checkResult.checkResult === 'pass' ? '该员工具备上岗资格' : '请处理以下问题后再安排上岗'"
      >
        <template #extra v-if="checkResult.warnings && checkResult.warnings.length > 0">
          <el-alert
            v-for="(warning, idx) in checkResult.warnings"
            :key="idx"
            :title="warning"
            type="warning"
            :closable="false"
            style="margin-bottom: 12px;"
          />
        </template>
      </el-result>
      <template #footer>
        <el-button type="primary" @click="showCheckResult = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authAPI, employeesAPI, positionsAPI } from '@/api'
import dayjs from 'dayjs'

const schedules = ref([])
const employees = ref([])
const positions = ref([])
const showAddDialog = ref(false)
const showCheckResult = ref(false)
const searchDate = ref(dayjs().format('YYYY-MM-DD'))

const scheduleForm = ref({
  schedule_date: dayjs().format('YYYY-MM-DD'),
  shift: '早班',
  position_id: null,
  employee_id: null
})

const checkResult = ref({
  checkResult: '',
  warnings: []
})

const loadSchedules = async () => {
  try {
    const res = await authAPI.schedules({ schedule_date: searchDate.value })
    schedules.value = res.data || []
  } catch (err) {
    ElMessage.error('加载排班列表失败')
  }
}

const loadEmployees = async () => {
  try {
    const res = await employeesAPI.list()
    employees.value = res.data || []
  } catch (err) {
    console.error('加载员工列表失败')
  }
}

const loadPositions = async () => {
  try {
    const res = await positionsAPI.list()
    positions.value = res.data || []
  } catch (err) {
    console.error('加载岗位列表失败')
  }
}

const saveSchedule = async () => {
  try {
    await authAPI.createSchedule(scheduleForm.value)
    ElMessage.success('创建成功')
    showAddDialog.value = false
    loadSchedules()
  } catch (err) {
    ElMessage.error('创建失败')
  }
}

const checkSchedule = async (row) => {
  try {
    const res = await authAPI.checkSchedule(row.id)
    checkResult.value = res.data
    showCheckResult.value = true
    loadSchedules()
  } catch (err) {
    ElMessage.error('校验失败')
  }
}

const deleteSchedule = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该排班吗？', '提示', { type: 'warning' })
    ElMessage.success('删除成功')
    loadSchedules()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadSchedules()
  loadEmployees()
  loadPositions()
})
</script>
