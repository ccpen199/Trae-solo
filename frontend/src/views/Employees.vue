<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">员工档案</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增员工
      </el-button>
    </div>

    <div class="search-bar">
      <el-select v-model="searchForm.department" placeholder="部门" clearable style="width: 180px;">
        <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
      </el-select>
      <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 150px;">
        <el-option label="在职" value="active" />
        <el-option label="离职" value="inactive" />
      </el-select>
      <el-button type="primary" @click="loadEmployees">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="employees" stripe style="width: 100%;">
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position_name" label="岗位" width="120" />
        <el-table-column prop="skill_level" label="技能等级" width="100">
          <template #default="{ row }">
            <el-tag type="primary">Lv.{{ row.skill_level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="forbidden_post" label="禁岗" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.forbidden_post" type="danger">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="$router.push(`/employees/${row.id}`)">查看</el-button>
              <el-button size="small" type="primary" @click="editEmployee(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteEmployee(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" :title="editingEmployee ? '编辑员工' : '新增员工'" width="600px">
      <el-form :model="employeeForm" label-width="100px">
        <el-form-item label="工号">
          <el-input v-model="employeeForm.employee_no" :disabled="!!editingEmployee" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="employeeForm.name" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="employeeForm.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="employeeForm.department" style="width: 100%;">
            <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="employeeForm.position_id" style="width: 100%;">
            <el-option v-for="pos in positions" :key="pos.id" :label="pos.position_name" :value="pos.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="技能等级">
          <el-select v-model="employeeForm.skill_level" style="width: 100%;">
            <el-option v-for="n in 5" :key="n" :label="`Lv.${n}`" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="employeeForm.status">
            <el-radio value="active">在职</el-radio>
            <el-radio value="inactive">离职</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="禁岗状态">
          <el-input v-model="employeeForm.forbidden_post" placeholder="无禁岗则留空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEmployee">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { employeesAPI, positionsAPI } from '@/api'

const employees = ref([])
const positions = ref([])
const departments = ref(['生产部', '设备部', '物流部', '质量部', '安全部', '人事部'])
const showAddDialog = ref(false)
const editingEmployee = ref(null)

const searchForm = ref({
  department: '',
  status: ''
})

const employeeForm = ref({
  employee_no: '',
  name: '',
  gender: '男',
  department: '',
  position_id: null,
  skill_level: 1,
  status: 'active',
  forbidden_post: ''
})

const loadEmployees = async () => {
  try {
    const res = await employeesAPI.list(searchForm.value)
    employees.value = res.data || []
  } catch (err) {
    ElMessage.error('加载员工列表失败')
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

const resetSearch = () => {
  searchForm.value = { department: '', status: '' }
  loadEmployees()
}

const editEmployee = (row) => {
  editingEmployee.value = row
  employeeForm.value = { ...row }
  showAddDialog.value = true
}

const saveEmployee = async () => {
  try {
    if (editingEmployee.value) {
      await employeesAPI.update(editingEmployee.value.id, employeeForm.value)
      ElMessage.success('更新成功')
    } else {
      await employeesAPI.create(employeeForm.value)
      ElMessage.success('创建成功')
    }
    showAddDialog.value = false
    loadEmployees()
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

const deleteEmployee = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该员工吗？', '提示', { type: 'warning' })
    await employeesAPI.delete(row.id)
    ElMessage.success('删除成功')
    loadEmployees()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadEmployees()
  loadPositions()
})
</script>
