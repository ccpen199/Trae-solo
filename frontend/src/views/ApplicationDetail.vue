<template>
  <div>
    <div class="page-header">
      <span class="page-title">申请详情 #{{ application?.id }}</span>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card style="margin-bottom: 20px">
          <template #header>
            <span style="font-weight: 600">基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目单位">{{ application?.project_unit }}</el-descriptions-item>
            <el-descriptions-item label="指标文号">{{ application?.indicator_no }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ application?.applicant }}</el-descriptions-item>
            <el-descriptions-item label="申请金额">
              <span style="color: #f56c6c; font-weight: 600">¥{{ Number(application?.amount).toLocaleString() }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(application?.status)">
                {{ getStatusText(application?.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核阶段">
              <el-tag :type="getStageType(application?.current_stage)">
                {{ getStageText(application?.current_stage) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="申请说明" :span="2">
              {{ application?.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-bottom: 20px" v-if="application?.status === 'correction'">
          <template #header>
            <span style="font-weight: 600; color: #e6a23c">补正材料</span>
          </template>
          <el-alert type="warning" title="请补充以下材料" style="margin-bottom: 16px">
            <div v-if="missingAttachments.length">缺少：{{ missingAttachments.map(t => getAttachmentLabel(t)).join('、') }}</div>
          </el-alert>
          <el-upload
            :auto-upload="false"
            :on-change="handleFileChange"
            multiple
            :file-list="fileList"
          >
            <el-button type="primary">上传补正材料</el-button>
          </el-upload>
          <div style="margin-top: 16px">
            <el-button type="success" @click="submitCorrection" :loading="submitting">
              提交补正
            </el-button>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <span style="font-weight: 600">附件材料</span>
          </template>
          <el-table :data="application?.attachments || []" size="small">
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                {{ getAttachmentLabel(row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="original_name" label="文件名" />
            <el-table-column prop="file_size" label="大小" width="100">
              <template #default="{ row }">
                {{ formatSize(row.file_size) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <el-button link type="primary" size="small">下载</el-button>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span style="font-weight: 600">审核时间线</span>
          </template>
          <div class="audit-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in application?.auditHistory || []"
                :key="index"
                :timestamp="record.created_at"
                :type="getTimelineType(record.action)"
              >
                <div style="font-weight: 600">
                  {{ getAuditActionText(record.action) }}
                  <el-tag size="small" style="margin-left: 8px">
                    {{ getStageText(record.stage) }}
                  </el-tag>
                </div>
                <div style="font-size: 12px; color: #909399; margin-top: 4px">
                  审核人：{{ record.auditor }}
                </div>
                <div v-if="record.opinion" style="margin-top: 8px; font-size: 13px">
                  {{ record.opinion }}
                </div>
              </el-timeline-item>
              <el-timeline-item timestamp="提交申请" type="primary">
                <div style="font-weight: 600">申请已提交</div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { applicationsApi } from '../api'

const route = useRoute()
const router = useRouter()
const application = ref(null)
const fileList = ref([])
const submitting = ref(false)

const attachmentTypes = {
  contract: '合同',
  acceptance: '验收单',
  invoice: '发票',
  request: '请款说明',
  other: '其他'
}

const missingAttachments = computed(() => {
  if (!application.value) return []
  const required = ['contract', 'acceptance', 'invoice', 'request']
  const uploaded = application.value.attachments?.map(a => a.type) || []
  return required.filter(t => !uploaded.includes(t))
})

const getAttachmentLabel = (type) => attachmentTypes[type] || type

const getStatusType = (status) => {
  const types = { pending: 'info', correction: 'warning', approved: 'success', rejected: 'danger', paid: 'success' }
  return types[status] || 'info'
}
const getStatusText = (status) => {
  const texts = { pending: '待审核', correction: '待补正', approved: '已通过', rejected: '已拒绝', paid: '已支付' }
  return texts[status] || status
}
const getStageType = (stage) => {
  const types = { business: 'primary', finance: 'warning', leader: 'danger', completed: 'success' }
  return types[stage] || 'info'
}
const getStageText = (stage) => {
  const texts = { business: '业务审核', finance: '财务审核', leader: '领导审批', completed: '已完成', correction: '补正' }
  return texts[stage] || stage
}
const getTimelineType = (action) => {
  const types = { approve: 'success', reject: 'danger', return: 'warning' }
  return types[action] || 'info'
}
const getAuditActionText = (action) => {
  const texts = { approve: '审核通过', reject: '审核拒绝', return: '退回补正' }
  return texts[action] || action
}
const formatSize = (size) => {
  if (!size) return '-'
  return (size / 1024).toFixed(1) + ' KB'
}

const handleFileChange = (file) => {
  fileList.value.push(file.raw)
}

const submitCorrection = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传补正材料')
    return
  }
  submitting.value = true
  try {
    const formData = new FormData()
    fileList.value.forEach(f => formData.append('attachments', f))
    formData.append('attachmentTypes', JSON.stringify(fileList.value.map(() => 'other')))
    
    await applicationsApi.uploadAttachments(route.params.id, formData)
    ElMessage.success('补正材料已提交')
    loadApplication()
    fileList.value = []
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

const loadApplication = async () => {
  try {
    application.value = await applicationsApi.get(route.params.id)
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

onMounted(() => {
  loadApplication()
})
</script>
