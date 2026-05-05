<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>审核详情</span>
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <div v-if="detail" style="max-width: 900px">
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="区域">{{ detail.region }}</el-descriptions-item>
          <el-descriptions-item label="经销商">{{ detail.dealer_name }}</el-descriptions-item>
          <el-descriptions-item label="经销商代码">{{ detail.dealer_code }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">
            <el-tag :type="detail.task_type === 'A' ? 'primary' : 'success'" size="small">
              {{ detail.task_type === 'A' ? 'A类任务' : 'B类任务' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务名称" :span="2">{{ detail.task_name }}</el-descriptions-item>
          <el-descriptions-item label="内训方式">{{ detail.training_method }}</el-descriptions-item>
          <el-descriptions-item label="考核方式">{{ detail.exam_method }}</el-descriptions-item>
          <el-descriptions-item label="要求课时">{{ detail.required_hours }} 小时</el-descriptions-item>
          <el-descriptions-item label="执行课时">
            <span :style="{ color: detail.actual_hours >= detail.required_hours ? '#67c23a' : '#f56c6c' }">
              {{ detail.actual_hours }} 小时
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(detail.submitted_at) }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getAuditStatusType(detail.status)">{{ detail.status_text }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>任务内容</el-divider>
        <el-card shadow="never" style="background-color: #f5f7fa">
          {{ detail.task_content || '暂无任务内容' }}
        </el-card>

        <el-divider>课程计划</el-divider>
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
        </el-table>
        <el-empty v-if="!detail.course_plans || detail.course_plans.length === 0" description="暂无课程计划" :image-size="60" />

        <el-divider>报名人员</el-divider>
        <el-table :data="detail.enrollments || []" size="small">
          <el-table-column prop="person_name" label="姓名" width="100" />
          <el-table-column prop="person_id" label="工号" width="120" />
        </el-table>
        <el-empty v-if="!detail.enrollments || detail.enrollments.length === 0" description="暂无报名人员" :image-size="60" />

        <el-divider>上传资料</el-divider>
        
        <div v-if="detail.photos && detail.photos.length > 0" style="margin-bottom: 20px">
          <h4 style="margin-bottom: 10px; color: #303133">照片:</h4>
          <el-row :gutter="10">
            <el-col :span="6" v-for="(photo, index) in detail.photos" :key="index">
              <el-card shadow="hover" style="text-align: center">
                <el-icon :size="40" style="color: #409eff"><Picture /></el-icon>
                <div style="margin-top: 10px; font-size: 12px; word-break: break-all">
                  {{ photo.original_name || '照片' }}
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-if="detail.videos && detail.videos.length > 0" style="margin-bottom: 20px">
          <h4 style="margin-bottom: 10px; color: #303133">视频:</h4>
          <el-row :gutter="10">
            <el-col :span="6" v-for="(video, index) in detail.videos" :key="index">
              <el-card shadow="hover" style="text-align: center">
                <el-icon :size="40" style="color: #e6a23c"><VideoCamera /></el-icon>
                <div style="margin-top: 10px; font-size: 12px; word-break: break-all">
                  {{ video.original_name || '视频' }}
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-if="detail.attachments && detail.attachments.length > 0">
          <h4 style="margin-bottom: 10px; color: #303133">附件:</h4>
          <el-row :gutter="10">
            <el-col :span="6" v-for="(file, index) in detail.attachments" :key="index">
              <el-card shadow="hover" style="text-align: center">
                <el-icon :size="40" style="color: #909399"><Document /></el-icon>
                <div style="margin-top: 10px; font-size: 12px; word-break: break-all">
                  {{ file.original_name || '附件' }}
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <el-empty 
          v-if="(!detail.photos || detail.photos.length === 0) && 
                  (!detail.videos || detail.videos.length === 0) && 
                  (!detail.attachments || detail.attachments.length === 0)" 
          description="暂无上传资料" 
          :image-size="60" 
        />

        <el-divider v-if="detail.audit_record">审核记录</el-divider>
        <el-card v-if="detail.audit_record" shadow="never" style="background-color: #f5f7fa">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="审核状态">
              <el-tag :type="getAuditStatusType(detail.audit_record.status)">{{ detail.status_text }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核人">{{ detail.audit_record.auditor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="审核时间" :span="2">
              {{ formatDate(detail.audit_record.audited_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="审核意见" :span="2">
              {{ detail.audit_record.comment || '无' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <div v-if="detail.status === 'pending'" style="margin-top: 30px; text-align: center">
          <el-button type="success" size="large" @click="handleApprove">
            <el-icon><CircleCheck /></el-icon>
            通过
          </el-button>
          <el-button type="danger" size="large" style="margin-left: 20px" @click="handleReject">
            <el-icon><CircleClose /></el-icon>
            驳回
          </el-button>
        </div>
      </div>
    </el-card>

    <el-dialog 
      v-model="auditDialogVisible" 
      title="填写审核意见" 
      width="500px"
    >
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核结果">
          <el-tag :type="auditAction === 'approve' ? 'success' : 'danger'" size="large">
            {{ auditAction === 'approve' ? '审核通过' : '审核驳回' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="auditForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit" :loading="auditing">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auditApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const detail = ref(null)
const auditDialogVisible = ref(false)
const auditing = ref(false)
const auditAction = ref('approve')

const auditForm = reactive({
  comment: ''
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const getAuditStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

const loadDetail = async () => {
  try {
    const res = await auditApi.getDetail(route.params.id)
    if (res.data?.success) {
      detail.value = res.data.data
    }
  } catch (error) {
    console.error('加载审核详情失败:', error)
    ElMessage.error('加载审核详情失败')
  }
}

const handleApprove = async () => {
  auditAction.value = 'approve'
  auditForm.comment = ''
  auditDialogVisible.value = true
}

const handleReject = async () => {
  auditAction.value = 'reject'
  auditForm.comment = ''
  auditDialogVisible.value = true
}

const confirmAudit = async () => {
  try {
    auditing.value = true
    const status = auditAction.value === 'approve' ? 'approved' : 'rejected'
    const res = await auditApi.audit(route.params.id, {
      status: status,
      comment: auditForm.comment,
      auditor: '系统管理员'
    })
    if (res.data?.success) {
      ElMessage.success(status === 'approved' ? '审核通过' : '已驳回')
      auditDialogVisible.value = false
      loadDetail()
    } else {
      ElMessage.error(res.data?.message || '审核失败')
    }
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('审核失败')
  } finally {
    auditing.value = false
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
