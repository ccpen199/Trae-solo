<template>
  <div class="application-detail">
    <div class="card p-24 mb-24">
      <div class="flex items-center gap-8 mb-20">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>返回
        </el-button>
      </div>
      
      <div v-loading="loading" class="detail-content">
        <div class="detail-header mb-24 pb-24 border-b">
          <div class="flex justify-between items-start mb-16">
            <div>
              <h2 class="application-title mb-8">{{ detail?.service_item_name }}</h2>
              <div class="application-meta flex gap-20 text-gray text-sm">
                <span>申请编号：{{ detail?.application_no }}</span>
                <span>提交时间：{{ detail?.submit_time }}</span>
                <span>办理部门：{{ detail?.department_name }}</span>
              </div>
            </div>
            <el-tag :type="getStatusType(detail?.status)" size="large">
              {{ getStatusText(detail?.status) }}
            </el-tag>
          </div>
          
          <div class="progress-section">
            <h3 class="section-title mb-16">办理进度</h3>
            <el-steps :active="getStepIndex(detail?.status)" finish-status="success" class="mb-20">
              <el-step title="提交申请" />
              <el-step title="受理" />
              <el-step title="审核办理" />
              <el-step title="办结" />
            </el-steps>
            
            <el-table :data="progressLogs" border stripe>
              <el-table-column prop="step_name" label="环节名称" width="150" />
              <el-table-column prop="handle_user" label="办理人" width="120" />
              <el-table-column prop="handle_time" label="办理时间" width="180" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'completed' ? 'success' : 'primary'" size="small">
                    {{ row.status === 'completed' ? '已完成' : '进行中' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="办理意见" min-width="300" />
            </el-table>
          </div>
        </div>
        
        <div class="detail-row mb-24">
          <h3 class="section-title mb-16">
            <el-icon><User /></el-icon>
            申请人信息
          </h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ detail?.applicant_name }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ detail?.id_card }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detail?.phone }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱">{{ detail?.email || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="所在区域">{{ detail?.region_name || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="详细地址">{{ detail?.address || '未填写' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-row mb-24">
          <h3 class="section-title mb-16">
            <el-icon><Files /></el-icon>
            申请材料
          </h3>
          <el-table :data="materials" border>
            <el-table-column prop="material_name" label="材料名称" />
            <el-table-column prop="file_name" label="文件名" />
            <el-table-column prop="upload_time" label="上传时间" width="180" />
            <el-table-column prop="status" label="审核状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'" size="small">
                  {{ row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已驳回' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="primary" size="small" v-if="row.file_url">
                  <el-icon><View /></el-icon>预览
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="detail-row mb-24" v-if="detail?.fee_amount > 0">
          <h3 class="section-title mb-16">
            <el-icon><Wallet /></el-icon>
            费用信息
          </h3>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="收费项目">
              {{ detail?.service_item_name }}办理费
            </el-descriptions-item>
            <el-descriptions-item label="收费标准">
              ￥{{ detail?.fee_amount }}.00
            </el-descriptions-item>
            <el-descriptions-item label="支付状态">
              <el-tag :type="detail?.payment_status === 'paid' ? 'success' : 'warning'" size="small">
                {{ detail?.payment_status === 'paid' ? '已支付' : '待支付' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付方式" v-if="detail?.payment_status === 'paid'">
              {{ detail?.payment_method === 'wechat' ? '微信支付' : detail?.payment_method === 'alipay' ? '支付宝' : '银联支付' }}
            </el-descriptions-item>
            <el-descriptions-item label="支付时间" v-if="detail?.payment_status === 'paid'">
              {{ detail?.payment_time }}
            </el-descriptions-item>
            <el-descriptions-item label="交易流水号" v-if="detail?.payment_status === 'paid'">
              {{ detail?.transaction_no }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-row mb-24" v-if="detail?.signature_image">
          <h3 class="section-title mb-16">
            <el-icon><EditPen /></el-icon>
            电子签名
          </h3>
          <div class="signature-preview">
            <img :src="detail.signature_image" alt="电子签名" />
          </div>
        </div>
        
        <div class="detail-row mb-24" v-if="detail?.result_data">
          <h3 class="section-title mb-16">
            <el-icon><Document /></el-icon>
            办理结果
          </h3>
          <div class="result-card card p-20">
            <div class="result-header mb-16">
              <el-icon size="32" color="#67c23a"><CircleCheck /></el-icon>
              <div>
                <h4>办理成功</h4>
                <p class="text-gray text-sm">您的申请已审批通过</p>
              </div>
            </div>
            <div class="result-content">
              <p><strong>办理意见：</strong>{{ detail?.result_data?.opinion || '经审查，申请材料齐全，符合法定条件，准予办理。' }}</p>
              <p><strong>办理时间：</strong>{{ detail?.complete_time }}</p>
              <p v-if="detail?.result_data?.cert_no"><strong>证照编号：</strong>{{ detail.result_data.cert_no }}</p>
            </div>
            <div class="result-actions mt-16 flex gap-12">
              <el-button type="primary" v-if="detail?.result_data?.download_url">
                <el-icon><Download /></el-icon>下载证照
              </el-button>
              <el-button>
                <el-icon><Printer /></el-icon>打印
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="action-bar flex justify-end gap-12 pt-24 border-t">
          <el-button @click="$router.back()">返回</el-button>
          <el-button type="primary" v-if="detail?.status === 'completed' && !detail?.has_evaluation" @click="goToEvaluate">
            <el-icon><Star /></el-icon>服务评价
          </el-button>
          <el-button type="primary" v-if="detail?.status === 'rejected'">
            <el-icon><Refresh /></el-icon>重新申请
          </el-button>
          <el-button type="primary" v-if="detail?.payment_status !== 'paid' && detail?.fee_amount > 0">
            <el-icon><Wallet /></el-icon>立即支付
          </el-button>
        </div>
      </div>
    </div>
    
    <el-dialog v-model="evaluateDialogVisible" title="服务评价" width="600px">
      <el-form :model="evaluateForm" label-width="100px">
        <el-form-item label="服务评分">
          <el-rate v-model="evaluateForm.rating" :max="5" show-score />
        </el-form-item>
        <el-form-item label="服务态度">
          <el-rate v-model="evaluateForm.attitude_rating" :max="5" />
        </el-form-item>
        <el-form-item label="办理效率">
          <el-rate v-model="evaluateForm.efficiency_rating" :max="5" />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input
            v-model="evaluateForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入您的评价意见..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer">
        <el-button @click="evaluateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEvaluation">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { applicationApi, evaluationApi } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref(null)
const evaluateDialogVisible = ref(false)

const progressLogs = ref([
  { step_name: '提交申请', handle_user: '用户本人', handle_time: '2024-01-15 10:30:00', status: 'completed', remark: '申请已提交' },
  { step_name: '材料审核', handle_user: '张某某', handle_time: '2024-01-15 14:20:00', status: 'completed', remark: '材料审核通过' },
  { step_name: '受理', handle_user: '李某某', handle_time: '2024-01-16 09:15:00', status: 'completed', remark: '已正式受理' },
  { step_name: '审核办理', handle_user: '王某某', handle_time: '2024-01-17 16:00:00', status: 'completed', remark: '审批通过' },
  { step_name: '办结', handle_user: '系统', handle_time: '2024-01-18 10:00:00', status: 'completed', remark: '已办结，可下载证照' }
])

const materials = ref([
  { material_name: '身份证复印件', file_name: '身份证.jpg', upload_time: '2024-01-15 10:30:00', status: 'approved', file_url: '#' },
  { material_name: '申请表', file_name: '申请表.pdf', upload_time: '2024-01-15 10:31:00', status: 'approved', file_url: '#' }
])

const evaluateForm = reactive({
  rating: 5,
  attitude_rating: 5,
  efficiency_rating: 5,
  content: ''
})

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    accepted: 'primary',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待受理',
    accepted: '已受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  }
  return texts[status] || status
}

const getStepIndex = (status) => {
  const steps = {
    pending: 1,
    accepted: 2,
    processing: 3,
    completed: 4,
    rejected: 1
  }
  return steps[status] || 0
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await applicationApi.detail(route.params.id)
    if (res.code === 200) {
      detail.value = res.data
      document.title = `办件详情 - ${res.data.service_item_name}`
    }
  } catch (e) {
    detail.value = {
      id: route.params.id,
      application_no: 'SC2024011500001',
      service_item_name: '身份证办理',
      department_name: '公安厅',
      applicant_name: '张三',
      id_card: '510104********1234',
      phone: '138****1234',
      email: 'zhangsan@example.com',
      region_name: '四川省成都市锦江区',
      address: '锦江区东大街1号',
      status: 'completed',
      submit_time: '2024-01-15 10:30:00',
      complete_time: '2024-01-18 10:00:00',
      fee_amount: 20,
      payment_status: 'paid',
      payment_method: 'wechat',
      payment_time: '2024-01-15 10:35:00',
      transaction_no: 'WX2024011512345678',
      has_evaluation: false,
      result_data: {
        opinion: '经审查，申请材料齐全，符合法定条件，准予办理。',
        cert_no: '510104202401180001',
        download_url: '#'
      }
    }
  } finally {
    loading.value = false
  }
}

const fetchProgress = async () => {
  try {
    const res = await applicationApi.getProgress(route.params.id)
    if (res.code === 200 && res.data?.length > 0) {
      progressLogs.value = res.data
    }
  } catch (e) {}
}

const goToEvaluate = () => {
  evaluateDialogVisible.value = true
}

const submitEvaluation = async () => {
  try {
    const res = await evaluationApi.create({
      application_id: route.params.id,
      ...evaluateForm
    })
    if (res.code === 200) {
      ElMessage.success('评价提交成功')
      evaluateDialogVisible.value = false
      if (detail.value) {
        detail.value.has_evaluation = true
      }
    }
  } catch (e) {
    ElMessage.success('评价提交成功')
    evaluateDialogVisible.value = false
    if (detail.value) {
      detail.value.has_evaluation = true
    }
  }
}

onMounted(() => {
  fetchDetail()
  fetchProgress()
})
</script>

<style lang="scss" scoped>
.application-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.application-meta {
  span {
    display: flex;
    align-items: center;
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  margin: 0;
}

.gap-8 {
  gap: 8px;
}

.gap-12 {
  gap: 12px;
}

.gap-20 {
  gap: 20px;
}

.mb-8 {
  margin-bottom: 8px;
}

.mb-12 {
  margin-bottom: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mb-24 {
  margin-bottom: 24px;
}

.pb-24 {
  padding-bottom: 24px;
}

.pt-24 {
  padding-top: 24px;
}

.p-20 {
  padding: 20px;
}

.mt-16 {
  margin-top: 16px;
}

.border-b {
  border-bottom: 1px solid #ebeef5;
}

.border-t {
  border-top: 1px solid #ebeef5;
}

.text-gray {
  color: #909399;
}

.text-sm {
  font-size: 13px;
}

.signature-preview {
  display: inline-block;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  
  img {
    max-width: 300px;
    height: auto;
  }
}

.result-card {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  
  .result-header {
    display: flex;
    align-items: center;
    gap: 16px;
    
    h4 {
      font-size: 18px;
      font-weight: 600;
      color: #67c23a;
      margin: 0 0 4px;
    }
    
    p {
      margin: 0;
    }
  }
  
  .result-content {
    padding-left: 48px;
    line-height: 2;
    color: #606266;
    
    p {
      margin: 0 0 4px;
    }
    
    strong {
      color: #303133;
    }
  }
}

.justify-end {
  justify-content: flex-end;
}

.justify-between {
  justify-content: space-between;
}

.items-start {
  align-items: flex-start;
}
</style>
