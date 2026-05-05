<template>
  <div class="page-container">
    <div class="page-header">
      <h2>员工管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增员工
      </el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="姓名/员工号/电话" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="在职" :value="1" />
            <el-option label="离职" :value="2" />
            <el-option label="休假" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.departmentId" placeholder="全部部门" clearable style="width: 120px">
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table 
      :data="tableData" 
      v-loading="loading" 
      border
      :row-class-name="getRowClassName"
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="employeeNo" label="员工编号" width="150" align="center">
        <template #default="{ row }">
          <span class="employee-no">{{ row.employeeNo }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" width="100" align="center">
        <template #default="{ row }">
          <div class="name-cell">
            <el-avatar :size="32" :style="{ backgroundColor: getAvatarColor(row.gender) }">
              {{ row.name.charAt(0) }}
            </el-avatar>
            <span style="margin-left: 8px; font-weight: 500">{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="gender" label="性别" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.gender === 1 ? '' : 'danger'" effect="plain" size="small">
            {{ row.gender === 1 ? '男' : '女' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="联系电话" width="120" align="center" />
      <el-table-column prop="department.name" label="所属部门" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="info" effect="plain" size="small">
            {{ row.department?.name || '未分配' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="position" label="职位" width="100" align="center" />
      <el-table-column prop="employeeType" label="员工类型" width="100" align="center">
        <template #default="{ row }">
          <div class="type-badge" :class="'type-' + row.employeeType">
            <el-icon v-if="row.employeeType === 1"><Star /></el-icon>
            <el-icon v-else-if="row.employeeType === 2"><Coffee /></el-icon>
            <el-icon v-else><Clock /></el-icon>
            <span>{{ row.employeeType === 1 ? '正式工' : row.employeeType === 2 ? '实习生' : '临时工' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <div class="status-badge" :class="'status-' + row.status">
            <el-icon v-if="row.status === 1"><CircleCheck /></el-icon>
            <el-icon v-else-if="row.status === 2"><CircleClose /></el-icon>
            <el-icon v-else><Moon /></el-icon>
            <span>{{ row.status === 1 ? '在职' : row.status === 2 ? '离职' : '休假' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="entryDate" label="入职日期" width="110" align="center" />
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleView(row)" title="查看详情">
            <el-icon><View /></el-icon>
            详情
          </el-button>
          <el-button type="warning" size="small" link @click="handleEdit(row)" title="编辑">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-dropdown @command="(cmd) => handleQuickAction(cmd, row)" trigger="click">
            <el-button type="primary" size="small" plain>
              <el-icon><MoreFilled /></el-icon>
              更多
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="status-1" :disabled="row.status === 1">
                  <el-icon><CircleCheck /></el-icon>
                  设为在职
                </el-dropdown-item>
                <el-dropdown-item command="status-2" :disabled="row.status === 2">
                  <el-icon><CircleClose /></el-icon>
                  设为离职
                </el-dropdown-item>
                <el-dropdown-item command="status-3" :disabled="row.status === 3">
                  <el-icon><Moon /></el-icon>
                  设为休假
                </el-dropdown-item>
                <el-dropdown-item divided command="delete" style="color: #f56c6c">
                  <el-icon><Delete /></el-icon>
                  删除员工
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="pagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadEmployees"
      @current-change="loadEmployees"
      style="margin-top: 20px; justify-content: flex-end"
    />
  </div>

  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio :value="1">男</el-radio>
              <el-radio :value="2">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电话">
            <el-input v-model="form.phone" placeholder="请输入电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身份证号">
            <el-input v-model="form.idCard" placeholder="请输入身份证号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出生日期">
            <el-date-picker v-model="form.birthDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属部门">
            <el-select v-model="form.departmentId" placeholder="请选择部门" style="width: 100%">
              <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职位">
            <el-input v-model="form.position" placeholder="请输入职位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="员工类型">
            <el-select v-model="form.employeeType" placeholder="请选择类型" style="width: 100%">
              <el-option label="正式工" :value="1" />
              <el-option label="实习生" :value="2" />
              <el-option label="临时工" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="入职日期">
            <el-date-picker v-model="form.entryDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="住址">
            <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入住址" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { employeeApi, departmentApi } from '@/api'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const departments = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const searchForm = reactive({
  keyword: '',
  status: null,
  departmentId: null,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const form = reactive({
  name: '',
  gender: 1,
  phone: '',
  email: '',
  idCard: '',
  birthDate: null,
  address: '',
  departmentId: null,
  position: '',
  employeeType: 1,
  entryDate: null,
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
}

const dialogTitle = computed(() => isEdit.value ? '编辑员工' : '新增员工')

const getRowClassName = ({ row }) => {
  if (row.status === 2) return 'row-resigned'
  if (row.status === 3) return 'row-vacation'
  return ''
}

const getAvatarColor = (gender) => {
  return gender === 1 ? '#409EFF' : '#f56c6c'
}

const loadEmployees = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm,
    }
    const res = await employeeApi.list(params)
    if (res.success) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    console.error('Load employees error:', error)
  } finally {
    loading.value = false
  }
}

const loadDepartments = async () => {
  try {
    const res = await departmentApi.list()
    if (res.success) {
      departments.value = res.data
    }
  } catch (error) {
    console.error('Load departments error:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadEmployees()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = null
  searchForm.departmentId = null
  pagination.page = 1
  loadEmployees()
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, {
    name: '',
    gender: 1,
    phone: '',
    email: '',
    idCard: '',
    birthDate: null,
    address: '',
    departmentId: null,
    position: '',
    employeeType: 1,
    entryDate: null,
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    gender: row.gender,
    phone: row.phone || '',
    email: row.email || '',
    idCard: row.idCard || '',
    birthDate: row.birthDate,
    address: row.address || '',
    departmentId: row.departmentId,
    position: row.position || '',
    employeeType: row.employeeType,
    entryDate: row.entryDate,
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  router.push(`/employees/${row.id}`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该员工吗？删除后无法恢复。', '确认删除', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    })
    const res = await employeeApi.delete(row.id)
    if (res.success) {
      ElMessage.success(res.message)
      loadEmployees()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete employee error:', error)
    }
  }
}

const handleQuickAction = async (command, row) => {
  if (command === 'delete') {
    handleDelete(row)
  } else if (command.startsWith('status-')) {
    const status = parseInt(command.split('-')[1])
    const statusText = { 1: '在职', 2: '离职', 3: '休假' }
    try {
      await ElMessageBox.confirm(`确定要将员工【${row.name}】状态变更为"${statusText[status]}"吗？`, '状态变更', {
        type: 'warning',
      })
      const res = await employeeApi.updateStatus(row.id, { status })
      if (res.success) {
        ElMessage.success(res.message)
        loadEmployees()
      } else {
        ElMessage.error(res.message)
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Change status error:', error)
      }
    }
  }
}

const handleSubmit = async () => {
  try {
    let res
    if (isEdit.value) {
      res = await employeeApi.update(editingId.value, form)
    } else {
      res = await employeeApi.create(form)
    }
    if (res.success) {
      ElMessage.success(res.message)
      dialogVisible.value = false
      loadEmployees()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    console.error('Submit error:', error)
  }
}

onMounted(() => {
  loadDepartments()
  loadEmployees()
})

onActivated(() => {
  loadDepartments()
})
</script>

<style scoped>
.name-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.employee-no {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #409eff;
  font-weight: 600;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  gap: 4px;
}

.type-badge.type-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.type-badge.type-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.type-badge.type-3 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  gap: 4px;
}

.status-badge.status-1 {
  background: #e6f7e6;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-badge.status-2 {
  background: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

.status-badge.status-3 {
  background: #fffbe6;
  color: #faad14;
  border: 1px solid #ffe58f;
}

:deep(.el-table .row-resigned) {
  background-color: #fff1f0 !important;
}

:deep(.el-table .row-resigned:hover > td) {
  background-color: #ffccc7 !important;
}

:deep(.el-table .row-vacation) {
  background-color: #fffbe6 !important;
}

:deep(.el-table .row-vacation:hover > td) {
  background-color: #ffe58f !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped.row-resigned td) {
  background-color: #fff1f0 !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped.row-resigned:hover > td) {
  background-color: #ffccc7 !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped.row-vacation td) {
  background-color: #fffbe6 !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped.row-vacation:hover > td) {
  background-color: #ffe58f !important;
}
</style>
