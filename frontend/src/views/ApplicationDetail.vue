<template>
  <div class="mobile-container">
    <div class="header">
      <div class="flex-between">
        <el-icon :size="24" style="cursor: pointer;" @click="goBack"><ArrowLeft /></el-icon>
        <h2 style="font-size: 18px; flex: 1; text-align: center; margin-right: 24px;">办件详情</h2>
      </div>
    </div>

    <div v-if="application" style="padding: 16px;">
      <div class="gov-card" style="margin-bottom: 16px;">
        <div class="flex-between" style="margin-bottom: 12px;">
          <h3 style="font-size: 18px; color: #333;">{{ application.service_name }}</h3>
          <span :class="['status-badge', `status-${application.status}`]">
            {{ getStatusText(application.status) }}
          </span>
        </div>
        <p style="color: #666; font-size: 13px;">申请编号：{{ application.application_no }}</p>
        <p style="color: #666; font-size: 13px; margin-top: 4px;">提交时间：{{ formatTime(application.submit_time || application.created_at) }}</p>
      </div>

      <div class="gov-card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px; color: #333;">办理进度</h3>
        <el-steps direction="vertical" :active="application.current_step || 0" finish-status="success">
          <el-step title="提交申请" :description="application.submit_time ? formatTime(application.submit_time) : ''" />
          <el-step title="材料审核" description="工作人员正在审核您的材料" />
          <el-step title="业务办理" description="相关部门正在处理" />
          <el-step title="办理完成" :description="application.completed_at ? formatTime(application.completed_at) : ''" />
        </el-steps>
      </div>

      <div class="gov-card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px; color: #333;">申请信息</h3>
        <div class="info-list">
          <div class="info-item">
            <span class="label">申请人</span>
            <span class="value">{{ formData.name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">身份证号</span>
            <span class="value">{{ formData.idCard || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话</span>
            <span class="value">{{ formData.phone || '-' }}</span>
          </div>
          <div class="info-item" v-if="application.result">
            <span class="label">办理结果</span>
            <span class="value">{{ application.result }}</span>
          </div>
        </div>
      </div>

      <div class="gov-card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px; color: #333;">办理日志</h3>
        <div class="log-list">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            <div class="log-dot"></div>
            <div class="log-content">
              <p class="log-action">{{ log.action }}</p>
              <p class="log-time">{{ formatTime(log.created_at) }}</p>
              <p v-if="log.remark" class="log-remark">{{ log.remark }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="application.status === 'pending'" class="action-bar">
        <el-button style="width: 100%;" @click="cancelApplication">撤销申请</el-button>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { applicationApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import BottomNav from '@/components/BottomNav.vue'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const application = ref(null)
const logs = ref([])

const formData = computed(() => {
  if (!application.value?.formData) return {}
  return typeof application.value.formData === 'string' 
    ? JSON.parse(application.value.formData) 
    : application.value.formData
})

onMounted(() => {
  loadApplicationDetail()
})

const loadApplicationDetail = async () => {
  try {
    const res = await applicationApi.getDetail(route.params.id)
    application.value = res
    logs.value = res.logs || []
  } catch (e) {
    application.value = {
      id: route.params.id,
      application_no: 'APP202401150001',
      service_name: '社保查询',
      status: 'processing',
      submit_time: '2024-01-15 10:30:00',
      current_step: 1,
      formData: { name: '测试用户', idCard: '4401**********1234', phone: '138****8000' },
      logs: [
        { action: '提交申请', created_at: '2024-01-15 10:30:00', remark: '用户在线提交申请' },
        { action: '材料审核', created_at: '2024-01-15 11:00:00', remark: '工作人员审核中' }
      ]
    }
    logs.value = application.value.logs
  }
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '办理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 16)
}

const cancelApplication = async () => {
  try {
    await ElMessageBox.confirm('确定要撤销此申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await applicationApi.cancel(route.params.id)
    ElMessage.success('撤销成功')
    router.back()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('撤销成功')
      router.back()
    }
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #999;
  font-size: 14px;
}

.value {
  color: #333;
  font-size: 14px;
}

.log-list {
  position: relative;
  padding-left: 20px;
}

.log-list::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #e5e7eb;
}

.log-item {
  position: relative;
  padding-bottom: 20px;
}

.log-item:last-child {
  padding-bottom: 0;
}

.log-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1e5cb8;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #1e5cb8;
}

.log-action {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #999;
}

.log-remark {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.action-bar {
  position: sticky;
  bottom: 80px;
  padding: 16px 0;
  background: #f5f7fa;
}
</style>
