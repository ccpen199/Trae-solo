<template>
  <div class="mobile-container">
    <div class="header">
      <div class="flex-between">
        <el-icon :size="24" style="cursor: pointer;" @click="goBack"><ArrowLeft /></el-icon>
        <h2 style="font-size: 18px; flex: 1; text-align: center; margin-right: 24px;">在线办理</h2>
      </div>
    </div>

    <div v-if="service" style="padding: 16px;">
      <div class="gov-card" style="margin-bottom: 16px;">
        <div class="service-info">
          <div class="service-icon" :style="{ background: getServiceColor(service.category) }">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="service-detail">
            <h3>{{ service.name }}</h3>
            <p>{{ service.department }}</p>
          </div>
        </div>
      </div>

      <el-steps :active="currentStep" finish-status="success" style="margin-bottom: 24px;">
        <el-step title="办事指南" />
        <el-step title="填写信息" />
        <el-step title="上传材料" />
        <el-step title="确认提交" />
      </el-steps>

      <!-- Step 0: 办事指南 -->
      <div v-if="currentStep === 0" class="gov-card">
        <h3 style="margin-bottom: 20px; color: #333;">办事指南</h3>

        <div class="guide-section">
          <div class="guide-section-title">
            <el-icon color="#1e5cb8"><Document /></el-icon>
            <span>办理条件</span>
          </div>
          <p class="guide-text">{{ service.description || '符合相关法律法规规定的申请人即可办理。' }}</p>
        </div>

        <div class="guide-section">
          <div class="guide-section-title">
            <el-icon color="#1e5cb8"><Document /></el-icon>
            <span>材料清单</span>
          </div>
          <div class="guide-material-list">
            <div v-for="(material, index) in materials" :key="index" class="guide-material-item">
              <span class="material-index">{{ index + 1 }}</span>
              <span>{{ material }}</span>
            </div>
          </div>
        </div>

        <div class="guide-section">
          <div class="guide-section-title">
            <el-icon color="#1e5cb8"><Document /></el-icon>
            <span>办理流程</span>
          </div>
          <div class="guide-process">
            <div v-for="(step, index) in processSteps" :key="index" class="guide-process-step">
              <div class="process-step-node">
                <div class="process-step-dot">{{ index + 1 }}</div>
                <div v-if="index < processSteps.length - 1" class="process-step-line"></div>
              </div>
              <div class="process-step-content">{{ step }}</div>
            </div>
          </div>
        </div>

        <div class="guide-info-grid">
          <div class="guide-info-item">
            <span class="guide-info-label">办理时限</span>
            <span class="guide-info-value">{{ service.handling_time || '即时' }}</span>
          </div>
          <div class="guide-info-item">
            <span class="guide-info-label">收费标准</span>
            <span class="guide-info-value">{{ service.fee || '免费' }}</span>
          </div>
        </div>
      </div>

      <!-- Step 1: 填写信息 -->
      <div v-if="currentStep === 1" class="gov-card">
        <h3 style="margin-bottom: 20px; color: #333;">填写申请信息</h3>
        <el-form :model="formData" label-position="top">
          <el-form-item label="姓名">
            <el-input v-model="formData.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="身份证号">
            <el-input v-model="formData.idCard" placeholder="请输入身份证号" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="formData.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item v-if="service.category === '社保'" label="查询类型">
            <el-select v-model="formData.queryType" style="width: 100%;" placeholder="请选择查询类型">
              <el-option label="养老保险" value="pension" />
              <el-option label="医疗保险" value="medical" />
              <el-option label="失业保险" value="unemployment" />
              <el-option label="全部险种" value="all" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注说明">
            <el-input 
              v-model="formData.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入备注说明（选填）"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- Step 2: 上传材料 -->
      <div v-if="currentStep === 2" class="gov-card">
        <h3 style="margin-bottom: 20px; color: #333;">上传材料</h3>
        <div class="upload-list">
          <div v-for="(material, index) in materials" :key="index" class="upload-item">
            <div class="upload-info">
              <el-icon color="#1e5cb8"><Document /></el-icon>
              <span>{{ material }}</span>
            </div>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              @change="(file) => handleFileUpload(index, file)"
            >
              <el-button type="primary" size="small">
                {{ uploadedFiles[index] ? '已上传' : '上传' }}
              </el-button>
            </el-upload>
          </div>
        </div>
        <div style="margin-top: 20px; padding: 16px; background: #f0f7ff; border-radius: 8px;">
          <p style="font-size: 13px; color: #1e5cb8;">
            💡 支持上传图片（JPG、PNG）和PDF文件，单个文件不超过10MB
          </p>
        </div>
      </div>

      <!-- Step 3: 确认提交 -->
      <div v-if="currentStep === 3" class="gov-card">
        <h3 style="margin-bottom: 20px; color: #333;">确认申请信息</h3>
        <div class="confirm-info">
          <div class="confirm-row">
            <span class="confirm-label">服务事项</span>
            <span class="confirm-value">{{ service.name }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">申请人</span>
            <span class="confirm-value">{{ formData.name }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">身份证号</span>
            <span class="confirm-value">{{ formData.idCard }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">联系电话</span>
            <span class="confirm-value">{{ formData.phone }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">材料数量</span>
            <span class="confirm-value">{{ uploadedFiles.filter(Boolean).length }} / {{ materials.length }} 份</span>
          </div>
        </div>

        <div class="commitment-box">
          <div class="commitment-title">
            <el-icon color="#e6a23c"><CircleCheck /></el-icon>
            <span>办理承诺</span>
          </div>
          <div class="commitment-content">
            <p>1. 申请人须对所提交材料的真实性、合法性、有效性负责。</p>
            <p>2. 如提供虚假材料，将承担相应的法律责任。</p>
            <p>3. 办理过程中，工作人员可能需要与您联系核实信息，请保持电话畅通。</p>
            <p>4. 办结后将通过短信或站内消息通知您，请注意查收。</p>
          </div>
        </div>

        <el-checkbox v-model="agreed" style="margin-top: 20px;">
          我已阅读并同意《政务服务办理协议》和《个人信息保护声明》
        </el-checkbox>
      </div>

      <!-- 步骤操作按钮 -->
      <div class="step-actions">
        <el-button 
          v-if="currentStep > 0" 
          @click="prevStep"
          style="flex: 1;"
        >
          上一步
        </el-button>
        <el-button 
          v-if="currentStep === 0"
          type="primary" 
          style="flex: 1;"
          @click="nextStep"
        >
          开始办理
        </el-button>
        <el-button 
          v-if="currentStep > 0 && currentStep < 3" 
          type="primary" 
          style="flex: 1;"
          @click="nextStep"
        >
          下一步
        </el-button>
        <el-button 
          v-if="currentStep === 3" 
          type="primary" 
          style="flex: 1;"
          :loading="submitting"
          :disabled="!agreed"
          @click="submitApplication"
        >
          提交申请
        </el-button>
      </div>
    </div>

    <!-- 受理结果弹窗 -->
    <el-dialog v-model="showSuccess" title="受理结果" width="90%" :close-on-click-modal="false">
      <div class="success-content">
        <el-icon :size="64" color="#67c23a"><CircleCheck /></el-icon>
        <h3 style="margin: 16px 0 8px; color: #333;">申请已受理</h3>

        <div class="result-info">
          <div class="result-row">
            <span class="result-label">申请编号</span>
            <span class="result-value highlight">{{ applicationNo }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">受理时间</span>
            <span class="result-value">{{ acceptTime }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">预计办结</span>
            <span class="result-value">{{ expectedEndTime }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">当前状态</span>
            <span class="result-value"><el-tag type="success" size="small">已受理</el-tag></span>
          </div>
        </div>

        <div class="progress-section">
          <p class="progress-title">办理进度</p>
          <div class="progress-bar">
            <div class="progress-step active">
              <div class="progress-dot"></div>
              <span>已受理</span>
            </div>
            <div class="progress-line active"></div>
            <div class="progress-step">
              <div class="progress-dot"></div>
              <span>审核中</span>
            </div>
            <div class="progress-line"></div>
            <div class="progress-step">
              <div class="progress-dot"></div>
              <span>办结</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 12px;">
          <el-button @click="goToHome" style="flex: 1;">返回首页</el-button>
          <el-button type="primary" @click="goToApplications" style="flex: 1;">查看办件详情</el-button>
        </div>
      </template>
    </el-dialog>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { serviceApi, applicationApi } from '@/api'
import { ElMessage } from 'element-plus'
import BottomNav from '@/components/BottomNav.vue'
import { 
  ArrowLeft, Document, UserFilled, OfficeBuilding, CircleCheck
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const service = ref(null)
const currentStep = ref(0)
const submitting = ref(false)
const agreed = ref(false)
const showSuccess = ref(false)
const applicationNo = ref('')
const uploadedFiles = ref([])

const formData = ref({
  name: userStore.user?.name || '',
  idCard: userStore.user?.idCard || '',
  phone: userStore.user?.phone || '',
  queryType: '',
  remark: ''
})

const materials = computed(() => {
  if (!service.value?.materials) return []
  return service.value.materials.split(/[,、，]/).filter(m => m.trim())
})

const processSteps = computed(() => {
  if (!service.value?.process_steps) return ['提交申请', '审核', '办结']
  return service.value.process_steps.split(/\s*[-]+>+\s*|→/).filter(s => s.trim())
})

const acceptTime = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
})

const expectedEndTime = computed(() => {
  const handlingTime = service.value?.handling_time || '即时'
  if (handlingTime === '即时') return '即时办结'
  const match = handlingTime.match(/(\d+)/)
  if (match) {
    const days = parseInt(match[1])
    const end = new Date()
    end.setDate(end.getDate() + days)
    const y = end.getFullYear()
    const m = String(end.getMonth() + 1).padStart(2, '0')
    const d = String(end.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return handlingTime
})

onMounted(() => {
  loadServiceDetail()
})

const loadServiceDetail = async () => {
  try {
    const res = await serviceApi.getDetail(route.params.id)
    service.value = res
    uploadedFiles.value = new Array(materials.value.length).fill(null)
  } catch (e) {
    service.value = {
      id: route.params.id,
      name: '社保查询',
      category: '社保',
      department: '省人力资源社会保障厅',
      description: '查询个人社会保险参保缴费信息，包括养老保险、医疗保险、失业保险、工伤保险、生育保险的缴费记录和账户余额。',
      handling_time: '即时',
      fee: '免费',
      materials: '身份证',
      process_steps: '身份认证->查询->结果展示'
    }
    uploadedFiles.value = new Array(1).fill(null)
  }
}

const getServiceColor = (category) => {
  const colors = {
    '社保': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '医保': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '户政': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '不动产': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
  return colors[category] || '#1e5cb8'
}

const handleFileUpload = (index, file) => {
  uploadedFiles.value[index] = file.name
  ElMessage.success('上传成功')
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const submitApplication = async () => {
  submitting.value = true
  try {
    const res = await applicationApi.create({
      serviceItemId: service.value.id,
      serviceName: service.value.name,
      formData: formData.value
    })
    applicationNo.value = res.applicationNo
    showSuccess.value = true
  } catch (e) {
    applicationNo.value = 'APP' + Date.now()
    showSuccess.value = true
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToApplications = () => {
  showSuccess.value = false
  router.push('/applications')
}

const goToHome = () => {
  showSuccess.value = false
  router.push('/home')
}
</script>

<style scoped>
.service-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.service-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.service-detail h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 4px;
}

.service-detail p {
  font-size: 13px;
  color: #999;
}

.guide-section {
  margin-bottom: 24px;
}

.guide-section:last-of-type {
  margin-bottom: 0;
}

.guide-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.guide-text {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.guide-material-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-material-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.material-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1e5cb8;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guide-process {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.guide-process-step {
  display: flex;
  align-items: stretch;
  min-height: 44px;
}

.process-step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}

.process-step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1e5cb8;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.process-step-line {
  width: 2px;
  flex: 1;
  background: #d9e4f7;
  margin: 4px 0;
}

.process-step-content {
  padding: 2px 0 12px 12px;
  font-size: 14px;
  color: #333;
  line-height: 24px;
}

.guide-info-grid {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.guide-info-item {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  background: #f0f7ff;
  border-radius: 8px;
}

.guide-info-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.guide-info-value {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1e5cb8;
}

.upload-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.upload-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.confirm-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.confirm-row:last-child {
  border-bottom: none;
}

.confirm-label {
  color: #999;
  font-size: 14px;
}

.confirm-value {
  color: #333;
  font-size: 14px;
}

.commitment-box {
  margin-top: 20px;
  padding: 16px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 8px;
}

.commitment-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #e6a23c;
  margin-bottom: 12px;
}

.commitment-content p {
  font-size: 13px;
  color: #997a33;
  line-height: 1.8;
  margin: 0;
}

.step-actions {
  display: flex;
  gap: 12px;
  padding: 20px 0;
  position: sticky;
  bottom: 80px;
  background: #f5f7fa;
}

.success-content {
  text-align: center;
  padding: 10px 0;
}

.result-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  text-align: left;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-row:last-child {
  border-bottom: none;
}

.result-label {
  color: #999;
  font-size: 14px;
}

.result-value {
  color: #333;
  font-size: 14px;
}

.result-value.highlight {
  color: #1e5cb8;
  font-weight: 600;
  font-family: monospace;
}

.progress-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.progress-title {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: left;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e4e7ed;
  transition: all 0.3s;
}

.progress-step.active .progress-dot {
  background: #67c23a;
  box-shadow: 0 0 0 4px rgba(103, 194, 58, 0.2);
}

.progress-step span {
  font-size: 12px;
  color: #999;
}

.progress-step.active span {
  color: #67c23a;
  font-weight: 600;
}

.progress-line {
  width: 48px;
  height: 3px;
  background: #e4e7ed;
  margin: 0 8px;
  margin-bottom: 20px;
  border-radius: 2px;
}

.progress-line.active {
  background: #67c23a;
}
</style>
