<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>执行详情 - {{ detail?.task_name }}</span>
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
        </div>
      </template>

      <div v-if="detail" style="max-width: 1000px">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="任务类型">
            <el-tag :type="detail.task_type === 'A' ? 'primary' : 'success'">
              {{ detail.task_type === 'A' ? 'A类任务(主机厂下发)' : 'B类任务(经销商自建)' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="内训方式">{{ detail.training_method }}</el-descriptions-item>
          <el-descriptions-item label="考核方式">{{ detail.exam_method }}</el-descriptions-item>
          <el-descriptions-item label="要求课时">{{ detail.required_hours }} 小时</el-descriptions-item>
          <el-descriptions-item label="执行课时">
            <el-input-number v-model="formData.actual_hours" :min="0" :max="1000" size="small" :disabled="isSubmitted" />
          </el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <el-tag :type="detail.status === 'submitted' ? 'warning' : 'info'">
              {{ detail.status_text }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>任务内容</el-divider>
        <el-card shadow="never" style="background-color: #f5f7fa; margin-bottom: 20px">
          {{ detail.task_content || '暂无任务内容' }}
        </el-card>

        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="课程计划" name="course">
            <div style="margin-bottom: 15px">
              <el-button type="primary" size="small" @click="handleAddCourse" :disabled="isSubmitted">
                <el-icon><Plus /></el-icon>
                添加课程
              </el-button>
            </div>
            <el-table :data="detail.course_plans || []" size="small">
              <el-table-column prop="course_name" label="课程名称" min-width="150" />
              <el-table-column prop="lecturer" label="讲师" width="100" />
              <el-table-column prop="start_time" label="开始时间" width="160">
                <template #default="{ row }">
                  {{ formatDate(row.start_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="end_time" label="结束时间" width="160">
                <template #default="{ row }">
                  {{ formatDate(row.end_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="content" label="课程内容" min-width="200" />
              <el-table-column label="操作" width="150" v-if="!isSubmitted">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleEditCourse(row)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="handleDeleteCourse(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!detail.course_plans || detail.course_plans.length === 0" description="暂无课程计划" :image-size="60" />
          </el-tab-pane>

          <el-tab-pane label="报名设置" name="enrollment">
            <div style="margin-bottom: 15px">
              <el-button type="primary" size="small" @click="handleSaveEnrollment" :disabled="isSubmitted">
                <el-icon><Save /></el-icon>
                保存报名设置
              </el-button>
            </div>
            <div style="background-color: #f5f7fa; padding: 15px; border-radius: 4px">
              <h4 style="margin-bottom: 15px">选择参加人员（从经销商人员列表中勾选）:</h4>
              <el-checkbox-group v-model="selectedPersonnel">
                <el-row :gutter="20">
                  <el-col :span="8" v-for="person in availablePersonnel" :key="person.id">
                    <el-checkbox :label="person" :disabled="isSubmitted">
                      {{ person.name }} ({{ person.position }})
                    </el-checkbox>
                  </el-col>
                </el-row>
              </el-checkbox-group>
            </div>
            <el-divider>已报名人员</el-divider>
            <el-table :data="detail.enrollments || []" size="small">
              <el-table-column prop="person_name" label="姓名" width="120" />
              <el-table-column prop="person_id" label="工号" width="120" />
            </el-table>
            <el-empty v-if="!detail.enrollments || detail.enrollments.length === 0" description="暂无报名人员" :image-size="60" />
          </el-tab-pane>

          <el-tab-pane label="上传提交" name="upload">
            <el-form :model="formData" label-width="100px">
              <el-form-item label="照片">
                <el-upload
                  action="/api/upload/single"
                  multiple
                  :limit="10"
                  :on-success="handlePhotoUploadSuccess"
                  :on-remove="handlePhotoRemove"
                  :file-list="photoList"
                  :disabled="isSubmitted"
                  accept=".jpg,.jpeg,.png,.gif"
                  list-type="picture-card"
                >
                  <el-icon v-if="!isSubmitted"><Plus /></el-icon>
                </el-upload>
              </el-form-item>

              <el-form-item label="视频">
                <div class="el-upload__tip" style="margin-bottom: 10px; color: #e6a23c">
                  注意：视频大小限制 30MB 以内，支持 mp4、avi、mov 格式
                </div>
                <el-upload
                  action="/api/upload/video"
                  multiple
                  :limit="5"
                  :on-success="handleVideoUploadSuccess"
                  :on-remove="handleVideoRemove"
                  :file-list="videoList"
                  :disabled="isSubmitted"
                  accept=".mp4,.avi,.mov"
                >
                  <el-button type="primary" :disabled="isSubmitted">
                    <el-icon><Upload /></el-icon>
                    上传视频
                  </el-button>
                </el-upload>
              </el-form-item>

              <el-form-item label="附件">
                <el-upload
                  action="/api/upload/single"
                  multiple
                  :limit="10"
                  :on-success="handleAttachmentUploadSuccess"
                  :on-remove="handleAttachmentRemove"
                  :file-list="attachmentList"
                  :disabled="isSubmitted"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                >
                  <el-button type="primary" :disabled="isSubmitted">
                    <el-icon><Upload /></el-icon>
                    上传附件
                  </el-button>
                </el-upload>
              </el-form-item>
            </el-form>

            <el-divider>操作</el-divider>
            <div style="text-align: center">
              <el-button type="primary" size="large" @click="handleSave" :disabled="isSubmitted" :loading="saving">
                <el-icon><Save /></el-icon>
                保存
              </el-button>
              <el-button 
                type="warning" 
                size="large" 
                style="margin-left: 20px" 
                @click="handleSubmit" 
                :disabled="isSubmitted"
                :loading="submitting"
              >
                <el-icon><Promotion /></el-icon>
                完成内训执行并提交
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <el-dialog 
      v-model="courseDialogVisible" 
      :title="isEditCourse ? '编辑课程' : '添加课程'" 
      width="500px"
    >
      <el-form ref="courseFormRef" :model="courseForm" :rules="courseRules" label-width="100px">
        <el-form-item label="课程名称" prop="course_name">
          <el-input v-model="courseForm.course_name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="讲师" prop="lecturer">
          <el-input v-model="courseForm.lecturer" placeholder="请输入讲师姓名" />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="courseForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="courseForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="课程内容" prop="content">
          <el-input
            v-model="courseForm.content"
            type="textarea"
            :rows="3"
            placeholder="请输入课程内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCourse" :loading="courseSaving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { executionApi, dealersApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const detail = ref(null)
const activeTab = ref('course')
const saving = ref(false)
const submitting = ref(false)
const courseDialogVisible = ref(false)
const isEditCourse = ref(false)
const courseSaving = ref(false)
const courseFormRef = ref(null)
const availablePersonnel = ref([])
const selectedPersonnel = ref([])

const photoList = ref([])
const videoList = ref([])
const attachmentList = ref([])

const isSubmitted = computed(() => detail.value?.status === 'submitted')

const formData = reactive({
  actual_hours: 0
})

const courseForm = reactive({
  id: null,
  course_name: '',
  lecturer: '',
  start_time: null,
  end_time: null,
  content: ''
})

const courseRules = {
  course_name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  lecturer: [{ required: true, message: '请输入讲师姓名', trigger: 'blur' }]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const loadDetail = async () => {
  try {
    const res = await executionApi.getDetail(route.params.id)
    if (res.data?.success) {
      detail.value = res.data.data
      formData.actual_hours = res.data.data.actual_hours || 0
      
      photoList.value = (res.data.data.photos || []).map(p => ({
        name: p.original_name || '照片',
        url: p.url,
        response: { data: { url: p.url } }
      }))
      
      videoList.value = (res.data.data.videos || []).map(v => ({
        name: v.original_name || '视频',
        url: v.url,
        response: { data: { url: v.url } }
      }))
      
      attachmentList.value = (res.data.data.attachments || []).map(a => ({
        name: a.original_name || '附件',
        url: a.url,
        response: { data: { url: a.url } }
      }))

      if (res.data.data.enrollments && res.data.data.enrollments.length > 0) {
        selectedPersonnel.value = res.data.data.enrollments.map(e => ({
          name: e.person_name,
          employee_id: e.person_id
        }))
      }
    }
  } catch (error) {
    console.error('加载执行详情失败:', error)
    ElMessage.error('加载执行详情失败')
  }
}

const loadPersonnel = async () => {
  try {
    const res = await dealersApi.getPersonnel(1)
    if (res.data?.success) {
      availablePersonnel.value = res.data.data
    }
  } catch (error) {
    console.error('加载人员列表失败:', error)
  }
}

const handleAddCourse = () => {
  isEditCourse.value = false
  courseForm.id = null
  courseForm.course_name = ''
  courseForm.lecturer = ''
  courseForm.start_time = null
  courseForm.end_time = null
  courseForm.content = ''
  courseDialogVisible.value = true
}

const handleEditCourse = (row) => {
  isEditCourse.value = true
  courseForm.id = row.id
  courseForm.course_name = row.course_name
  courseForm.lecturer = row.lecturer
  courseForm.start_time = row.start_time ? new Date(row.start_time) : null
  courseForm.end_time = row.end_time ? new Date(row.end_time) : null
  courseForm.content = row.content
  courseDialogVisible.value = true
}

const handleDeleteCourse = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该课程吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await executionApi.deleteCoursePlan(row.id)
    if (res.data?.success) {
      ElMessage.success('删除成功')
      loadDetail()
    } else {
      ElMessage.error(res.data?.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除课程失败:', error)
      ElMessage.error('删除课程失败')
    }
  }
}

const handleSaveCourse = async () => {
  if (!courseFormRef.value) return
  
  await courseFormRef.value.validate(async (valid) => {
    if (!valid) return

    courseSaving.value = true
    try {
      const data = {
        task_id: detail.value.task_id,
        dealer_id: detail.value.dealer_id,
        course_name: courseForm.course_name,
        lecturer: courseForm.lecturer,
        start_time: courseForm.start_time ? dayjs(courseForm.start_time).format('YYYY-MM-DD HH:mm:ss') : null,
        end_time: courseForm.end_time ? dayjs(courseForm.end_time).format('YYYY-MM-DD HH:mm:ss') : null,
        content: courseForm.content
      }

      let res
      if (isEditCourse.value) {
        res = await executionApi.updateCoursePlan(courseForm.id, data)
      } else {
        res = await executionApi.addCoursePlan(data)
      }

      if (res.data?.success) {
        ElMessage.success(isEditCourse.value ? '更新成功' : '添加成功')
        courseDialogVisible.value = false
        loadDetail()
      } else {
        ElMessage.error(res.data?.message || '操作失败')
      }
    } catch (error) {
      console.error('保存课程失败:', error)
      ElMessage.error('保存课程失败')
    } finally {
      courseSaving.value = false
    }
  })
}

const handleSaveEnrollment = async () => {
  try {
    const data = {
      task_id: detail.value.task_id,
      dealer_id: detail.value.dealer_id,
      personnel_list: selectedPersonnel.value
    }

    const res = await executionApi.saveEnrollment(data)
    if (res.data?.success) {
      ElMessage.success('保存成功')
      loadDetail()
    } else {
      ElMessage.error(res.data?.message || '保存失败')
    }
  } catch (error) {
    console.error('保存报名设置失败:', error)
    ElMessage.error('保存报名设置失败')
  }
}

const handlePhotoUploadSuccess = (response, file, fileList) => {
  if (response?.success) {
    file.url = response.data.url
  }
}

const handlePhotoRemove = (file, fileList) => {
  console.log('照片移除:', file.name)
}

const handleVideoUploadSuccess = (response, file, fileList) => {
  if (response?.success) {
    file.url = response.data.url
  }
}

const handleVideoRemove = (file, fileList) => {
  console.log('视频移除:', file.name)
}

const handleAttachmentUploadSuccess = (response, file, fileList) => {
  if (response?.success) {
    file.url = response.data.url
  }
}

const handleAttachmentRemove = (file, fileList) => {
  console.log('附件移除:', file.name)
}

const getUploadFiles = (fileList) => {
  return fileList.map(f => ({
    original_name: f.name,
    url: f.url
  }))
}

const handleSave = async () => {
  saving.value = true
  try {
    const data = {
      actual_hours: formData.actual_hours,
      photos: getUploadFiles(photoList.value),
      videos: getUploadFiles(videoList.value),
      attachments: getUploadFiles(attachmentList.value)
    }

    const res = await executionApi.saveSubmission(route.params.id, data)
    if (res.data?.success) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.data?.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleSubmit = async () => {
  try {
    await ElMessageBox.confirm('确定要完成内训执行并提交审核吗？提交后无法修改。', '提示', {
      confirmButtonText: '确定提交',
      cancelButtonText: '取消',
      type: 'warning'
    })

    submitting.value = true
    const data = {
      actual_hours: formData.actual_hours,
      photos: getUploadFiles(photoList.value),
      videos: getUploadFiles(videoList.value),
      attachments: getUploadFiles(attachmentList.value)
    }

    const res = await executionApi.submitSubmission(route.params.id, data)
    if (res.data?.success) {
      ElMessage.success('提交成功，等待主机厂审核')
      loadDetail()
    } else {
      ElMessage.error(res.data?.message || '提交失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
      ElMessage.error('提交失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadDetail()
  loadPersonnel()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
