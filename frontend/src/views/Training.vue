<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">培训考试管理</h1>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="培训课程" name="courses">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <span style="font-weight: 600;">课程列表</span>
          <el-button size="small" type="primary" @click="showCourseDialog = true">新增课程</el-button>
        </div>
        <el-table :data="courses" stripe>
          <el-table-column prop="course_code" label="课程编码" width="120" />
          <el-table-column prop="course_name" label="课程名称" />
          <el-table-column prop="course_type" label="课程类型" width="100">
            <template #default="{ row }">
              <el-tag>{{ row.course_type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="时长(小时)" width="100" />
          <el-table-column prop="description" label="描述" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="培训记录" name="records">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <span style="font-weight: 600;">培训记录列表</span>
          <el-button size="small" type="primary" @click="showRecordDialog = true">新增记录</el-button>
        </div>
        <el-table :data="records" stripe>
          <el-table-column prop="employee_name" label="员工姓名" width="100" />
          <el-table-column prop="course_name" label="培训课程" />
          <el-table-column prop="training_date" label="培训日期" width="120" />
          <el-table-column prop="sign_in_status" label="签到" width="80">
            <template #default="{ row }">
              <el-tag :type="row.sign_in_status === 'signed' ? 'success' : 'info'">
                {{ row.sign_in_status === 'signed' ? '已签' : '未签' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="成绩" width="80" />
          <el-table-column prop="pass_status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.pass_status === 'pass' ? 'success' : row.pass_status === 'fail' ? 'danger' : 'warning'">
                {{ row.pass_status === 'pass' ? '通过' : row.pass_status === 'fail' ? '未过' : '待考' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" @click="editRecord(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="考试记录" name="exams">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <span style="font-weight: 600;">考试记录列表</span>
          <el-button size="small" type="primary" @click="showExamDialog = true">新增考试</el-button>
        </div>
        <el-table :data="exams" stripe>
          <el-table-column prop="employee_name" label="员工姓名" width="100" />
          <el-table-column prop="exam_name" label="考试名称" />
          <el-table-column prop="exam_type" label="类型" width="100" />
          <el-table-column prop="exam_date" label="考试日期" width="120" />
          <el-table-column prop="score" label="成绩" width="80" />
          <el-table-column prop="pass_status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.pass_status === 'pass' ? 'success' : row.pass_status === 'fail' ? 'danger' : 'warning'">
                {{ row.pass_status === 'pass' ? '通过' : row.pass_status === 'fail' ? '未过' : '待考' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" @click="editExam(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showCourseDialog" title="新增课程" width="500px">
      <el-form :model="courseForm" label-width="100px">
        <el-form-item label="课程编码">
          <el-input v-model="courseForm.course_code" />
        </el-form-item>
        <el-form-item label="课程名称">
          <el-input v-model="courseForm.course_name" />
        </el-form-item>
        <el-form-item label="课程类型">
          <el-select v-model="courseForm.course_type" style="width: 100%;">
            <el-option label="安全" value="安全" />
            <el-option label="技术" value="技术" />
            <el-option label="质量" value="质量" />
            <el-option label="管理" value="管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="时长(小时)">
          <el-input-number v-model="courseForm.duration" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="courseForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCourseDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCourse">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRecordDialog" :title="editingRecord ? '编辑记录' : '新增记录'" width="500px">
      <el-form :model="recordForm" label-width="100px">
        <el-form-item label="员工">
          <el-select v-model="recordForm.employee_id" style="width: 100%;" :disabled="!!editingRecord">
            <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="培训课程">
          <el-select v-model="recordForm.course_id" style="width: 100%;" :disabled="!!editingRecord">
            <el-option v-for="c in courses" :key="c.id" :label="c.course_name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="培训日期">
          <el-date-picker v-model="recordForm.training_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item v-if="editingRecord" label="签到状态">
          <el-select v-model="recordForm.sign_in_status" style="width: 100%;">
            <el-option label="已签到" value="signed" />
            <el-option label="未签到" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editingRecord" label="成绩">
          <el-input-number v-model="recordForm.score" :min="0" :max="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item v-if="editingRecord" label="通过状态">
          <el-select v-model="recordForm.pass_status" style="width: 100%;">
            <el-option label="通过" value="pass" />
            <el-option label="未通过" value="fail" />
            <el-option label="待考" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editingRecord" label="讲师评分">
          <el-rate v-model="recordForm.instructor_rating" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecordDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showExamDialog" :title="editingExam ? '编辑考试' : '新增考试'" width="500px">
      <el-form :model="examForm" label-width="100px">
        <el-form-item label="员工">
          <el-select v-model="examForm.employee_id" style="width: 100%;" :disabled="!!editingExam">
            <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试名称">
          <el-input v-model="examForm.exam_name" :disabled="!!editingExam" />
        </el-form-item>
        <el-form-item label="考试类型">
          <el-select v-model="examForm.exam_type" style="width: 100%;" :disabled="!!editingExam">
            <el-option label="理论" value="理论" />
            <el-option label="实操" value="实操" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试日期">
          <el-date-picker v-model="examForm.exam_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item v-if="editingExam" label="成绩">
          <el-input-number v-model="examForm.score" :min="0" :max="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item v-if="editingExam" label="通过状态">
          <el-select v-model="examForm.pass_status" style="width: 100%;">
            <el-option label="通过" value="pass" />
            <el-option label="未通过" value="fail" />
            <el-option label="待考" value="pending" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExamDialog = false">取消</el-button>
        <el-button type="primary" @click="saveExam">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { trainingAPI, employeesAPI } from '@/api'

const activeTab = ref('courses')
const courses = ref([])
const records = ref([])
const exams = ref([])
const employees = ref([])

const showCourseDialog = ref(false)
const showRecordDialog = ref(false)
const showExamDialog = ref(false)
const editingRecord = ref(null)
const editingExam = ref(null)

const courseForm = ref({
  course_code: '',
  course_name: '',
  course_type: '安全',
  duration: 4,
  description: ''
})

const recordForm = ref({
  employee_id: null,
  course_id: null,
  training_date: '',
  sign_in_status: 'pending',
  score: 0,
  pass_status: 'pending',
  retake_count: 0,
  instructor_rating: 0
})

const examForm = ref({
  employee_id: null,
  exam_name: '',
  exam_type: '理论',
  exam_date: '',
  score: 0,
  pass_status: 'pending',
  retake_count: 0
})

const loadData = async () => {
  try {
    const [courseRes, recordRes, examRes, empRes] = await Promise.all([
      trainingAPI.courses(),
      trainingAPI.records(),
      trainingAPI.exams(),
      employeesAPI.list()
    ])
    courses.value = courseRes.data || []
    records.value = recordRes.data || []
    exams.value = examRes.data || []
    employees.value = empRes.data || []
  } catch (err) {
    ElMessage.error('加载数据失败')
  }
}

const saveCourse = async () => {
  try {
    await trainingAPI.createCourse(courseForm.value)
    ElMessage.success('创建成功')
    showCourseDialog.value = false
    loadData()
  } catch (err) {
    ElMessage.error('创建失败')
  }
}

const editRecord = (row) => {
  editingRecord.value = row
  recordForm.value = { ...row }
  showRecordDialog.value = true
}

const saveRecord = async () => {
  try {
    if (editingRecord.value) {
      await trainingAPI.updateRecord(editingRecord.value.id, recordForm.value)
      ElMessage.success('更新成功')
    } else {
      await trainingAPI.createRecord(recordForm.value)
      ElMessage.success('创建成功')
    }
    showRecordDialog.value = false
    editingRecord.value = null
    loadData()
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

const editExam = (row) => {
  editingExam.value = row
  examForm.value = { ...row }
  showExamDialog.value = true
}

const saveExam = async () => {
  try {
    if (editingExam.value) {
      await trainingAPI.updateExam(editingExam.value.id, examForm.value)
      ElMessage.success('更新成功')
    } else {
      await trainingAPI.createExam(examForm.value)
      ElMessage.success('创建成功')
    }
    showExamDialog.value = false
    editingExam.value = null
    loadData()
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
