<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 15px">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2>员工详情</h2>
      </div>
      <div style="display: flex; gap: 10px">
        <el-dropdown>
          <el-button type="warning">
            <el-icon><Edit /></el-icon>
            状态变更
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="changeStatus(1)">设为在职</el-dropdown-item>
              <el-dropdown-item @click="changeStatus(2)">设为离职</el-dropdown-item>
              <el-dropdown-item @click="changeStatus(3)">设为休假</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑信息
        </el-button>
      </div>
    </div>

    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="员工编号">{{ employee.employeeNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ employee.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ employee.gender === 1 ? '男' : '女' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="employee.status === 1 ? 'success' : employee.status === 2 ? 'danger' : 'warning'">
            {{ employee.status === 1 ? '在职' : employee.status === 2 ? '离职' : '休假' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="电话">{{ employee.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ employee.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ employee.idCard || '-' }}</el-descriptions-item>
        <el-descriptions-item label="出生日期">{{ employee.birthDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ employee.department?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{ employee.position || '-' }}</el-descriptions-item>
        <el-descriptions-item label="员工类型">
          <el-tag :type="employee.employeeType === 1 ? 'primary' : employee.employeeType === 2 ? 'warning' : 'info'" size="small">
            {{ employee.employeeType === 1 ? '正式工' : employee.employeeType === 2 ? '实习生' : '临时工' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ employee.entryDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="住址" :span="4">{{ employee.address || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-tabs v-model="activeTab" style="margin-top: 20px">
      <el-tab-pane label="教育经历" name="education">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" size="small" @click="handleAddDetail('education')">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
          </div>
          <el-table :data="details.educations" stripe size="small">
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="major" label="专业" />
            <el-table-column prop="degree" label="学历" />
            <el-table-column prop="startDate" label="开始日期" width="120" />
            <el-table-column prop="endDate" label="结束日期" width="120" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteDetail('education', row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="工作经验" name="work">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" size="small" @click="handleAddDetail('work')">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
          </div>
          <el-table :data="details.workExperiences" stripe size="small">
            <el-table-column prop="company" label="公司" />
            <el-table-column prop="position" label="职位" />
            <el-table-column prop="department" label="部门" />
            <el-table-column prop="startDate" label="开始日期" width="120" />
            <el-table-column prop="endDate" label="结束日期" width="120" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteDetail('workExperience', row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="项目经验" name="project">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" size="small" @click="handleAddDetail('project')">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
          </div>
          <el-table :data="details.projectExperiences" stripe size="small">
            <el-table-column prop="projectName" label="项目名称" />
            <el-table-column prop="role" label="担任角色" />
            <el-table-column prop="techStack" label="技术栈" />
            <el-table-column prop="startDate" label="开始日期" width="120" />
            <el-table-column prop="endDate" label="结束日期" width="120" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteDetail('projectExperience', row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="培训记录" name="training">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" size="small" @click="handleAddDetail('training')">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
          </div>
          <el-table :data="details.trainingRecords" stripe size="small">
            <el-table-column prop="trainingName" label="培训名称" />
            <el-table-column prop="trainingType" label="培训类型" />
            <el-table-column prop="organization" label="培训机构" />
            <el-table-column prop="duration" label="时长(小时)" width="100" />
            <el-table-column prop="result" label="结果" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteDetail('trainingRecord', row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="家庭成员" name="family">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" size="small" @click="handleAddDetail('family')">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
          </div>
          <el-table :data="details.familyMembers" stripe size="small">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="relation" label="关系" />
            <el-table-column prop="gender" label="性别">
              <template #default="{ row }">
                {{ row.gender === 1 ? '男' : '女' }}
              </template>
            </el-table-column>
            <el-table-column prop="birthDate" label="出生日期" width="120" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column prop="workUnit" label="工作单位" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteDetail('familyMember', row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>

  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
    <el-form :model="detailForm" label-width="100px">
      <template v-if="currentTabType === 'education'">
        <el-form-item label="学校">
          <el-input v-model="detailForm.school" placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="detailForm.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="学历">
          <el-input v-model="detailForm.degree" placeholder="请输入学历" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="detailForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="detailForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </template>

      <template v-if="currentTabType === 'work'">
        <el-form-item label="公司">
          <el-input v-model="detailForm.company" placeholder="请输入公司名称" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="detailForm.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="detailForm.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="detailForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="detailForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="工作描述">
          <el-input v-model="detailForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </template>

      <template v-if="currentTabType === 'project'">
        <el-form-item label="项目名称">
          <el-input v-model="detailForm.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="担任角色">
          <el-input v-model="detailForm.role" placeholder="请输入担任角色" />
        </el-form-item>
        <el-form-item label="技术栈">
          <el-input v-model="detailForm.techStack" placeholder="请输入技术栈" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="detailForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="detailForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="detailForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </template>

      <template v-if="currentTabType === 'training'">
        <el-form-item label="培训名称">
          <el-input v-model="detailForm.trainingName" placeholder="请输入培训名称" />
        </el-form-item>
        <el-form-item label="培训类型">
          <el-input v-model="detailForm.trainingType" placeholder="请输入培训类型" />
        </el-form-item>
        <el-form-item label="培训机构">
          <el-input v-model="detailForm.organization" placeholder="请输入培训机构" />
        </el-form-item>
        <el-form-item label="时长(小时)">
          <el-input-number v-model="detailForm.duration" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="detailForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="detailForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="培训结果">
          <el-input v-model="detailForm.result" placeholder="请输入培训结果" />
        </el-form-item>
        <el-form-item label="证书">
          <el-input v-model="detailForm.certificate" placeholder="请输入证书名称" />
        </el-form-item>
      </template>

      <template v-if="currentTabType === 'family'">
        <el-form-item label="姓名">
          <el-input v-model="detailForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="关系">
          <el-input v-model="detailForm.relation" placeholder="请输入关系" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="detailForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker v-model="detailForm.birthDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="detailForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="工作单位">
          <el-input v-model="detailForm.workUnit" placeholder="请输入工作单位" />
        </el-form-item>
        <el-form-item label="住址">
          <el-input v-model="detailForm.address" placeholder="请输入住址" />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmitDetail">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="editDialogVisible" title="编辑员工信息" width="600px">
    <el-form :model="editForm" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓名">
            <el-input v-model="editForm.name" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别">
            <el-radio-group v-model="editForm.gender">
              <el-radio :value="1">男</el-radio>
              <el-radio :value="2">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电话">
            <el-input v-model="editForm.phone" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱">
            <el-input v-model="editForm.email" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门">
            <el-select v-model="editForm.departmentId" placeholder="请选择部门" style="width: 100%">
              <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职位">
            <el-input v-model="editForm.position" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="员工类型">
            <el-select v-model="editForm.employeeType" style="width: 100%">
              <el-option label="正式工" :value="1" />
              <el-option label="实习生" :value="2" />
              <el-option label="临时工" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="入职日期">
            <el-date-picker v-model="editForm.entryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="editDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmitEdit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { employeeApi, departmentApi } from '@/api'

const route = useRoute()
const router = useRouter()

const employeeId = computed(() => route.params.id)
const loading = ref(false)
const employee = ref({})
const departments = ref([])
const activeTab = ref('education')
const dialogVisible = ref(false)
const editDialogVisible = ref(false)
const currentTabType = ref('')
const detailForm = reactive({})
const editForm = reactive({})

const details = reactive({
  educations: [],
  familyMembers: [],
  workExperiences: [],
  projectExperiences: [],
  trainingRecords: [],
})

const dialogTitles = {
  education: '新增教育经历',
  work: '新增工作经验',
  project: '新增项目经验',
  training: '新增培训记录',
  family: '新增家庭成员',
}

const dialogTitle = computed(() => dialogTitles[currentTabType.value] || '新增')

const goBack = () => router.push('/employees')

const loadEmployeeDetails = async () => {
  loading.value = true
  try {
    const res = await employeeApi.getDetails(employeeId.value)
    if (res.success) {
      employee.value = res.data.employee
      details.educations = res.data.educations
      details.familyMembers = res.data.familyMembers
      details.workExperiences = res.data.workExperiences
      details.projectExperiences = res.data.projectExperiences
      details.trainingRecords = res.data.trainingRecords
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    console.error('Load employee details error:', error)
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

const changeStatus = async (status) => {
  const statusText = { 1: '在职', 2: '离职', 3: '休假' }
  try {
    await ElMessageBox.confirm(`确定要将该员工状态变更为"${statusText[status]}"吗？`, '提示', {
      type: 'warning',
    })
    const res = await employeeApi.updateStatus(employeeId.value, { status })
    if (res.success) {
      ElMessage.success(res.message)
      loadEmployeeDetails()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Change status error:', error)
    }
  }
}

const handleEdit = () => {
  Object.assign(editForm, {
    name: employee.value.name,
    gender: employee.value.gender,
    phone: employee.value.phone || '',
    email: employee.value.email || '',
    departmentId: employee.value.departmentId,
    position: employee.value.position || '',
    employeeType: employee.value.employeeType,
    entryDate: employee.value.entryDate,
  })
  editDialogVisible.value = true
}

const handleSubmitEdit = async () => {
  try {
    const res = await employeeApi.update(employeeId.value, editForm)
    if (res.success) {
      ElMessage.success(res.message)
      editDialogVisible.value = false
      loadEmployeeDetails()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    console.error('Submit edit error:', error)
  }
}

const handleAddDetail = (type) => {
  currentTabType.value = type
  Object.keys(detailForm).forEach(key => delete detailForm[key])
  detailForm.gender = 1
  dialogVisible.value = true
}

const handleSubmitDetail = async () => {
  try {
    let res
    switch (currentTabType.value) {
      case 'education':
        res = await employeeApi.addEducation(employeeId.value, detailForm)
        break
      case 'work':
        res = await employeeApi.addWorkExperience(employeeId.value, detailForm)
        break
      case 'project':
        res = await employeeApi.addProjectExperience(employeeId.value, detailForm)
        break
      case 'training':
        res = await employeeApi.addTraining(employeeId.value, detailForm)
        break
      case 'family':
        res = await employeeApi.addFamily(employeeId.value, detailForm)
        break
    }
    if (res?.success) {
      ElMessage.success(res.message)
      dialogVisible.value = false
      loadEmployeeDetails()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (error) {
    console.error('Submit detail error:', error)
  }
}

const handleDeleteDetail = async (type, id) => {
  try {
    await ElMessageBox.confirm('确定要删除该记录吗？', '提示', {
      type: 'warning',
    })
    const res = await employeeApi.deleteDetail(type, id)
    if (res.success) {
      ElMessage.success(res.message)
      loadEmployeeDetails()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete detail error:', error)
    }
  }
}

onMounted(() => {
  loadDepartments()
  loadEmployeeDetails()
})

onActivated(() => {
  loadDepartments()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-content {
  padding: 10px 0;
}

.tab-header {
  margin-bottom: 15px;
}
</style>
