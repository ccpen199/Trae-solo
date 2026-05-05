<template>
  <div class="grade-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成绩管理</span>
          <el-button type="primary" size="small" @click="handleBatchAdd" v-if="userStore.hasPermission('grade:create')">
            <el-icon><Plus /></el-icon>
            批量录入成绩
          </el-button>
        </div>
      </template>

      <div class="filters">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="课程">
            <el-select v-model="filterForm.courseId" placeholder="全部课程" clearable filterable style="width: 200px">
              <el-option v-for="item in courseList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="班级">
            <el-select v-model="filterForm.classId" placeholder="全部班级" clearable filterable style="width: 180px">
              <el-option v-for="item in classList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="学生">
            <el-input v-model="filterForm.studentName" placeholder="学生姓名" clearable style="width: 150px" />
          </el-form-item>
          <el-form-item label="学年">
            <el-select v-model="filterForm.academicYear" placeholder="全部学年" clearable style="width: 150px">
              <el-option v-for="year in academicYears" :key="year" :label="year" :value="year" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadList">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="loading" :data="list" border stripe style="width: 100%">
        <el-table-column prop="student.studentNo" label="学号" width="130" />
        <el-table-column prop="student.name" label="姓名" width="100" />
        <el-table-column prop="student.classInfo.name" label="班级" min-width="150" />
        <el-table-column prop="course.name" label="课程名称" min-width="180" />
        <el-table-column prop="course.credits" label="学分" width="70" align="center" />
        <el-table-column prop="term" label="学期" width="120" align="center" />
        <el-table-column prop="score" label="成绩" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.score)" size="small">
              {{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="绩点" width="70" align="center" />
        <el-table-column label="操作" width="200" fixed="right" v-if="userStore.hasPermission('grade:update') || userStore.hasPermission('grade:delete')">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain @click="handleEdit(row)" v-if="userStore.hasPermission('grade:update')">编辑</el-button>
            <el-button type="danger" size="small" plain @click="handleDelete(row)" v-if="userStore.hasPermission('grade:delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        class="pagination"
        background
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="学生" prop="studentId" v-if="!isBatch">
          <el-select v-model="form.studentId" placeholder="请选择学生" filterable style="width: 100%">
            <el-option v-for="item in studentList" :key="item.id" :label="`${item.studentNo} - ${item.name}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="请选择课程" filterable style="width: 100%">
            <el-option v-for="item in courseList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学年" prop="academicYear">
              <el-select v-model="form.academicYear" placeholder="请选择学年" style="width: 100%">
                <el-option v-for="year in academicYears" :key="year" :label="year" :value="year" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学期" prop="semester">
              <el-radio-group v-model="form.semester">
                <el-radio :value="1">一</el-radio>
                <el-radio :value="2">二</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="成绩" prop="score">
          <el-input-number v-model="form.score" :min="0" :max="100" :precision="1" />
          <span style="margin-left: 20px; color: #909399; font-size: 12px;">
            等级和绩点将根据成绩自动计算
          </span>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量录入成绩" width="900px">
      <el-form :model="batchForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="班级" required>
              <el-select v-model="batchForm.classId" placeholder="请选择班级" filterable style="width: 100%" @change="handleClassChange">
                <el-option v-for="item in classList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="课程" required>
              <el-select v-model="batchForm.courseId" placeholder="请选择课程" filterable style="width: 100%">
                <el-option v-for="item in courseList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学年" required>
              <el-select v-model="batchForm.academicYear" placeholder="请选择学年" style="width: 100%">
                <el-option v-for="year in academicYears" :key="year" :label="year" :value="year" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-table
        v-loading="batchLoading"
        :data="batchStudentList"
        border
        stripe
        max-height="400"
        style="margin-top: 20px"
      >
        <el-table-column prop="studentNo" label="学号" width="130" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column label="成绩" width="150">
          <template #default="{ row, $index }">
            <el-input-number
              v-model="batchScores[$index]"
              :min="0"
              :max="100"
              :precision="1"
              placeholder="成绩"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="等级" width="80">
          <template #default="{ $index }">
            <el-tag :type="getLevelType(getLevel(batchScores[$index]))" size="small">
              {{ getLevel(batchScores[$index]) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitLoading" @click="handleBatchSubmit">
          批量保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { gradeApi, courseApi, classApi, studentApi } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const loading = ref(false)
const submitLoading = ref(false)
const list = ref([])
const courseList = ref([])
const classList = ref([])
const studentList = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const isBatch = ref(false)

const currentYear = new Date().getFullYear()
const academicYears = computed(() => {
  const years = []
  for (let i = 0; i < 6; i++) {
    const startYear = currentYear - i
    years.push(`${startYear}-${startYear + 1}`)
  }
  return years
})

const pagination = reactive({ page: 1, pageSize: 10 })

const filterForm = reactive({
  courseId: null,
  classId: null,
  studentName: '',
  academicYear: null
})

const form = reactive({
  id: null,
  studentId: null,
  courseId: null,
  academicYear: `${currentYear}-${currentYear + 1}`,
  semester: 1,
  score: null,
  remark: ''
})

const rules = {
  studentId: [{ required: true, message: '请选择学生', trigger: 'change' }],
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  academicYear: [{ required: true, message: '请选择学年', trigger: 'change' }],
  semester: [{ required: true, message: '请选择学期', trigger: 'change' }],
  score: [{ required: true, message: '请输入成绩', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑成绩' : '新增成绩')

const batchDialogVisible = ref(false)
const batchLoading = ref(false)
const batchSubmitLoading = ref(false)
const batchStudentList = ref([])
const batchScores = ref([])

const batchForm = reactive({
  classId: null,
  courseId: null,
  academicYear: `${currentYear}-${currentYear + 1}`,
  semester: 1
})

const getScoreType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

const getLevelType = (level) => {
  const map = {
    '优秀': 'success',
    '良好': 'primary',
    '中等': 'info',
    '及格': 'warning',
    '不及格': 'danger'
  }
  return map[level] || 'info'
}

const getLevel = (score) => {
  if (score == null) return ''
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '不及格'
}

const loadCourses = async () => {
  try {
    const res = await courseApi.list({ page: 1, pageSize: 1000 })
    courseList.value = res.data?.list || []
  } catch (error) {
    console.error('加载课程失败:', error)
  }
}

const loadClasses = async () => {
  try {
    const res = await classApi.list({ page: 1, pageSize: 1000 })
    classList.value = res.data?.list || []
  } catch (error) {
    console.error('加载班级失败:', error)
  }
}

const loadStudents = async () => {
  try {
    const res = await studentApi.list({ page: 1, pageSize: 1000 })
    studentList.value = res.data?.list || []
  } catch (error) {
    console.error('加载学生失败:', error)
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm
    }
    const res = await gradeApi.list(params)
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('加载失败')
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.courseId = null
  filterForm.classId = null
  filterForm.studentName = ''
  filterForm.academicYear = null
  pagination.page = 1
  loadList()
}

const handleSizeChange = (size) => { pagination.pageSize = size; loadList() }
const handleCurrentChange = (page) => { pagination.page = page; loadList() }

const parseTerm = (term) => {
  if (!term) return { academicYear: null, semester: 1 }
  const parts = term.split('-')
  if (parts.length === 3) {
    return {
      academicYear: `${parts[0]}-${parts[1]}`,
      semester: parseInt(parts[2]) || 1
    }
  }
  return { academicYear: term, semester: 1 }
}

const buildTerm = (academicYear, semester) => {
  return `${academicYear}-${semester}`
}

const handleEdit = (row) => {
  isEdit.value = true
  isBatch.value = false
  const parsed = parseTerm(row.term)
  form.id = row.id
  form.studentId = row.studentId
  form.courseId = row.courseId
  form.academicYear = parsed.academicYear
  form.semester = parsed.semester
  form.score = row.score
  form.remark = row.remark
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const submitData = {
      ...form,
      term: buildTerm(form.academicYear, form.semester)
    }
    delete submitData.academicYear
    delete submitData.semester

    if (isEdit.value) {
      await gradeApi.update(form.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await gradeApi.create(submitData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该成绩吗？', '提示', { type: 'warning' })
    await gradeApi.delete(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const handleBatchAdd = () => {
  batchForm.classId = null
  batchForm.courseId = null
  batchForm.academicYear = `${currentYear}-${currentYear + 1}`
  batchForm.semester = 1
  batchStudentList.value = []
  batchScores.value = []
  batchDialogVisible.value = true
}

const handleClassChange = async (classId) => {
  if (!classId) {
    batchStudentList.value = []
    batchScores.value = []
    return
  }
  batchLoading.value = true
  try {
    const res = await studentApi.list({ classId, page: 1, pageSize: 1000 })
    batchStudentList.value = res.data?.list || []
    batchScores.value = batchStudentList.value.map(() => null)
  } catch (error) {
    console.error('加载班级学生失败:', error)
  } finally {
    batchLoading.value = false
  }
}

const handleBatchSubmit = async () => {
  if (!batchForm.classId) {
    ElMessage.warning('请选择班级')
    return
  }
  if (!batchForm.courseId) {
    ElMessage.warning('请选择课程')
    return
  }

  const validScores = batchScores.value.filter(s => s != null)
  if (validScores.length === 0) {
    ElMessage.warning('请至少录入一个学生的成绩')
    return
  }

  batchSubmitLoading.value = true
  try {
    const term = buildTerm(batchForm.academicYear, batchForm.semester)
    const grades = []
    batchStudentList.value.forEach((student, index) => {
      if (batchScores.value[index] != null) {
        grades.push({
          studentId: student.id,
          courseId: batchForm.courseId,
          term: term,
          score: batchScores.value[index]
        })
      }
    })
    await gradeApi.batchCreate({ grades })
    ElMessage.success(`成功保存 ${grades.length} 条成绩`)
    batchDialogVisible.value = false
    loadList()
  } catch (error) {
    console.error('批量保存失败:', error)
  } finally {
    batchSubmitLoading.value = false
  }
}

onMounted(() => {
  loadCourses()
  loadClasses()
  loadStudents()
  loadList()
})
</script>

<style scoped>
.grade-container { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.filters { margin-bottom: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 4px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
