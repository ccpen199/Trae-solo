<template>
  <div class="admin-courses">
    <div class="toolbar">
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon> 新建培训计划
      </el-button>
    </div>

    <el-table :data="courses" style="width: 100%">
      <el-table-column prop="title" label="课程名称" />
      <el-table-column prop="instructor_name" label="讲师" width="100" />
      <el-table-column prop="applicable_positions" label="适用岗位" width="150" show-overflow-tooltip />
      <el-table-column prop="registration_scope" label="报名范围" width="150" show-overflow-tooltip />
      <el-table-column prop="live_time" label="直播时间" width="160">
        <template #default="{ row }">{{ formatDate(row.live_time) }}</template>
      </el-table-column>
      <el-table-column prop="credits" label="学分" width="80" />
      <el-table-column label="必修" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.is_required" type="danger" size="small">是</el-tag>
          <el-tag v-else size="small">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="editCourse(row)">编辑</el-button>
          <el-button type="primary" link size="small" @click="viewEnrollments(row)">报名名单</el-button>
          <el-button link size="small" @click="goLive(row)">进入直播</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑培训计划' : '新建培训计划'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="课程主题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="课程描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="讲师" prop="instructor_id">
          <el-select v-model="form.instructor_id" style="width: 100%">
            <el-option v-for="u in instructors" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用岗位">
          <el-input v-model="form.applicable_positions" placeholder="多个岗位用逗号分隔" />
        </el-form-item>
        <el-form-item label="报名范围">
          <el-input v-model="form.registration_scope" />
        </el-form-item>
        <el-form-item label="直播时间" prop="live_time">
          <el-date-picker v-model="form.live_time" type="datetime" style="width: 100%" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="时长(分钟)">
          <el-input-number v-model="form.duration" :min="30" :max="480" />
        </el-form-item>
        <el-form-item label="学分">
          <el-input-number v-model="form.credits" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="必修课程">
          <el-switch v-model="form.is_required" />
        </el-form-item>
        <el-form-item label="课程状态">
          <el-select v-model="form.status">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCourse" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="enrollmentsVisible" title="报名名单" width="800px">
      <el-table :data="enrollments" style="width: 100%">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="status" label="学习状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enrollment_status === 'completed' ? 'success' : 'primary'" size="small">
              {{ row.enrollment_status === 'completed' ? '已完成' : '学习中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="attendance_status" label="出勤状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.attendance_status === 'present'" type="success" size="small">已签到</el-tag>
            <el-tag v-else type="info" size="small">未签到</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enrolled_at" label="报名时间" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElIcon } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()
const courses = ref([])
const instructors = ref([])
const dialogVisible = ref(false)
const enrollmentsVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const enrollments = ref([])
const currentCourseId = ref(null)

const form = ref({
  title: '',
  description: '',
  instructor_id: null,
  applicable_positions: '',
  registration_scope: '',
  live_time: '',
  duration: 60,
  credits: 1,
  is_required: false,
  status: 'published'
})

async function loadCourses() {
  courses.value = await api.get('/courses')
}

async function loadInstructors() {
  const users = await api.get('/admin/users')
  instructors.value = users.filter(u => u.role === 'instructor' || u.role === 'admin')
}

function showCreateDialog() {
  isEdit.value = false
  form.value = {
    title: '',
    description: '',
    instructor_id: null,
    applicable_positions: '',
    registration_scope: '',
    live_time: '',
    duration: 60,
    credits: 1,
    is_required: false,
    status: 'published'
  }
  dialogVisible.value = true
}

function editCourse(row) {
  isEdit.value = true
  currentCourseId.value = row.id
  form.value = { ...row }
  dialogVisible.value = true
}

async function saveCourse() {
  if (!form.value.title) {
    return ElMessage.warning('请输入课程主题')
  }
  
  saving.value = true
  try {
    if (isEdit.value) {
      await api.put(`/courses/${currentCourseId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/courses', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadCourses()
  } catch (error) {
    ElMessage.error(error.error || '保存失败')
  } finally {
    saving.value = false
  }
}

async function viewEnrollments(row) {
  try {
    enrollments.value = await api.get(`/courses/${row.id}/enrollments`)
    enrollmentsVisible.value = true
  } catch (error) {
    ElMessage.error('获取报名名单失败')
  }
}

function goLive(row) {
  router.push(`/live/${row.id}`)
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function getStatusType(status) {
  const types = { draft: 'info', published: 'primary', completed: 'success' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { draft: '草稿', published: '已发布', completed: '已完成' }
  return texts[status] || status
}

onMounted(() => {
  loadCourses()
  loadInstructors()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}
</style>
