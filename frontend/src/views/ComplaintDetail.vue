<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">投诉详情</h1>
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div v-loading="loading">
      <div class="detail-section chart-container">
        <div class="detail-section-title">投诉信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">投诉编号：</span>
              <span class="detail-value">{{ complaint.complaint_no }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">投诉类型：</span>
              <span class="detail-value">{{ getTypeText(complaint.complaint_type) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">投诉状态：</span>
              <span class="detail-value">
                <span :class="getStatusClass(complaint.status)">{{ getStatusText(complaint.status) }}</span>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">投诉人：</span>
              <span class="detail-value">{{ complaint.complainant_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">联系电话：</span>
              <span class="detail-value">{{ complaint.complainant_phone }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">投诉时间：</span>
              <span class="detail-value">{{ complaint.complaint_time }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">涉事司机：</span>
              <span class="detail-value">
                <el-button type="primary" link @click="viewDriver">{{ complaint.driver_name }}</el-button>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">所属平台：</span>
              <span class="detail-value">{{ complaint.platform_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">关联订单：</span>
              <span class="detail-value">
                <el-button v-if="complaint.order_id" type="primary" link @click="viewOrder">
                  {{ complaint.platform_order_no }}
                </el-button>
                <span v-else>-</span>
              </span>
            </div>
          </el-col>
        </el-row>
        <div class="detail-item" style="margin-top: 12px">
          <span class="detail-label">投诉内容：</span>
          <span class="detail-value">{{ complaint.complaint_content }}</span>
        </div>
      </div>

      <div class="detail-section chart-container">
        <div class="detail-section-title">证据列表</div>
        <el-row :gutter="16">
          <el-col :span="6" v-for="(evidence, index) in evidences" :key="index">
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden">
              <div style="height: 120px; background: #f3f4f6; display: flex; align-items: center; justify-content: center">
                <el-icon v-if="evidence.type === 'image'" style="font-size: 48px; color: #9ca3af"><Picture /></el-icon>
                <el-icon v-else-if="evidence.type === 'video'" style="font-size: 48px; color: #9ca3af"><VideoCamera /></el-icon>
                <el-icon v-else style="font-size: 48px; color: #9ca3af"><Document /></el-icon>
              </div>
              <div style="padding: 8px; text-align: center">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px">{{ evidence.name }}</div>
                <el-button type="primary" link size="small" @click="viewEvidence(evidence)">查看</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
        <el-empty v-if="evidences.length === 0" description="暂无证据" />
      </div>

      <div class="detail-section chart-container">
        <div class="detail-section-title">处理记录</div>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in processRecords"
            :key="index"
            :timestamp="record.time"
            :type="getTimelineType(record.action)"
          >
            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600">{{ record.actionText }}</h4>
            <p style="margin: 0; color: #6b7280">{{ record.remark }}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af">处理人：{{ record.operator }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="processRecords.length === 0" description="暂无处理记录" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Picture, VideoCamera, Document } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const complaint = ref({})
const evidences = ref([])
const processRecords = ref([])

const getStatusText = (status) => {
  const map = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'tag-warning', processing: 'tag-info', resolved: 'tag-success', closed: 'tag-danger' }
  return map[status] || 'tag-info'
}

const getTypeText = (type) => {
  const map = { price_abnormal: '计价异常', detour: '绕路投诉', unlicensed: '无证运营', service: '服务态度', refuse: '拒载', other: '其他' }
  return map[type] || type
}

const getTimelineType = (action) => {
  const map = { create: 'primary', process: 'warning', resolve: 'success', close: 'danger' }
  return map[action] || 'primary'
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const data = await request.get(`/complaints/${id}`)
    complaint.value = data
    try {
      const urls = data.evidence_urls ? JSON.parse(data.evidence_urls) : []
      evidences.value = Array.isArray(urls) ? urls.map((url, i) => ({ type: 'image', name: `证据${i + 1}`, url })) : []
    } catch { evidences.value = [] }
    const records = []
    records.push({ action: 'create', actionText: '提交投诉', time: data.complaint_time, remark: data.complaint_content, operator: data.complainant_name })
    if (data.handle_result) {
      records.push({ action: 'process', actionText: '处理投诉', time: data.handle_time, remark: data.handle_result, operator: data.handler })
    }
    processRecords.value = records
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const viewDriver = () => {
  if (complaint.value.driver_id) {
    router.push(`/drivers/${complaint.value.driver_id}`)
  }
}

const viewOrder = () => {
  if (complaint.value.order_id) {
    router.push(`/orders/${complaint.value.order_id}`)
  }
}

const viewEvidence = (evidence) => {
  ElMessage.info('查看证据：' + evidence.name)
}

onMounted(() => {
  fetchDetail()
})
</script>
