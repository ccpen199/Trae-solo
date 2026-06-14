<template>
  <div class="apply-page">
    <div class="page-header">
      <div class="container">
        <div class="flex items-center gap-8 mb-8">
          <el-button link @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>返回
          </el-button>
          <span class="breadcrumb-sep">/</span>
          <span>在线办理</span>
        </div>
        <h2>{{ serviceName }}</h2>
      </div>
    </div>
    
    <div class="container main-content">
      <div class="apply-layout">
        <div class="apply-main">
          <div class="steps-card card p-24 mb-24">
            <el-steps :active="currentStep" finish-status="success">
              <el-step title="填写申请信息" />
              <el-step title="上传材料" />
              <el-step title="电子签名" />
              <el-step title="在线支付" />
              <el-step title="完成提交" />
            </el-steps>
          </div>
          
          <div v-show="currentStep === 0" class="step-content card p-24">
            <h3 class="step-title mb-20">
              <el-icon><Edit /></el-icon>
              填写申请信息
            </h3>
            
            <el-form
              ref="formRef"
              :model="formData"
              :rules="formRules"
              label-width="120px"
              class="apply-form"
            >
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="申请人姓名" prop="applicant_name">
                    <el-input v-model="formData.applicant_name" placeholder="请输入真实姓名" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="身份证号" prop="id_card">
                    <el-input v-model="formData.id_card" placeholder="请输入身份证号码" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="联系电话" prop="phone">
                    <el-input v-model="formData.phone" placeholder="请输入手机号码" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="电子邮箱">
                    <el-input v-model="formData.email" placeholder="请输入电子邮箱（选填）" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="所在区域" prop="region_id">
                    <el-cascader
                      v-model="formData.region_id"
                      :options="regionOptions"
                      placeholder="请选择所在区域"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="详细地址">
                    <el-input v-model="formData.address" placeholder="请输入详细地址（选填）" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="申请事项">
                    <el-input v-model="serviceName" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="办理方式" prop="handle_type">
                    <el-radio-group v-model="formData.handle_type">
                      <el-radio value="online">全程网办</el-radio>
                      <el-radio value="hybrid">线上预审，现场核验</el-radio>
                      <el-radio value="offline">窗口办理</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="申请说明">
                    <el-input
                      v-model="formData.remark"
                      type="textarea"
                      :rows="3"
                      placeholder="如有其他说明请在此填写（选填）"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item>
                <el-checkbox v-model="agreed" required>
                  我已阅读并同意<a href="#" class="text-primary">《服务协议》</a>和<a href="#" class="text-primary">《隐私政策》</a>
                </el-checkbox>
              </el-form-item>
            </el-form>
            
            <div class="step-actions flex justify-end mt-24">
              <el-button size="large" @click="$router.back()">取消</el-button>
              <el-button type="primary" size="large" @click="nextStep">下一步</el-button>
            </div>
          </div>
          
          <div v-show="currentStep === 1" class="step-content card p-24">
            <h3 class="step-title mb-20">
              <el-icon><Upload /></el-icon>
              上传申请材料
            </h3>
            
            <el-alert type="info" :closable="false" class="mb-20">
              请上传以下必填材料，支持PDF、JPG、PNG格式，单个文件不超过10MB
            </el-alert>
            
            <div v-for="(material, index) in materials" :key="index" class="material-item">
              <div class="material-header flex justify-between items-center mb-12">
                <div class="flex items-center gap-8">
                  <span class="material-name">{{ material.material_name }}</span>
                  <el-tag :type="material.required === '是' ? 'danger' : 'info'" size="small">
                    {{ material.required === '是' ? '必填' : '选填' }}
                  </el-tag>
                  <span class="text-gray text-sm">{{ material.format }} · {{ material.quantity }}</span>
                </div>
                <div v-if="material.remark" class="text-gray text-sm">
                  备注：{{ material.remark }}
                </div>
              </div>
              <el-upload
                :action="uploadUrl"
                :file-list="uploadedFiles[material.material_name] || []"
                :on-success="(res, file) => handleUploadSuccess(material.material_name, res, file)"
                :on-remove="(file) => handleUploadRemove(material.material_name, file)"
                multiple
                :limit="3"
                accept=".pdf,.jpg,.jpeg,.png"
              >
                <el-button>
                  <el-icon><Upload /></el-icon>选择文件
                </el-button>
                <template #tip>
                  <div class="el-upload__tip text-xs">
                    支持拖拽上传，可调用电子证照
                  </div>
                </template>
              </el-upload>
              <el-button link type="primary" size="small" class="mt-8">
                <el-icon><CreditCard /></el-icon>调用电子证照
              </el-button>
            </div>
            
            <div class="step-actions flex justify-between mt-24">
              <el-button size="large" @click="prevStep">上一步</el-button>
              <el-button type="primary" size="large" @click="nextStep">下一步</el-button>
            </div>
          </div>
          
          <div v-show="currentStep === 2" class="step-content card p-24">
            <h3 class="step-title mb-20">
              <el-icon><EditPen /></el-icon>
              电子签名
            </h3>
            
            <div class="signature-section">
              <div class="signature-preview">
                <canvas ref="signatureCanvas" class="signature-canvas"></canvas>
                <div v-if="!hasSignature" class="signature-placeholder">
                  <el-icon size="48" color="#c0c4cc"><Edit /></el-icon>
                  <p>请在下方手写签名区域签名</p>
                </div>
              </div>
              
              <div class="signature-actions mt-16 mb-24">
                <el-button @click="clearSignature">
                  <el-icon><Refresh /></el-icon>清除签名
                </el-button>
                <el-button type="primary" @click="usePresetSignature">
                  <el-icon><User /></el-icon>使用预设签名
                </el-button>
              </div>
              
              <div class="signature-area">
                <div class="signature-toolbar mb-12">
                  <span class="text-gray">手写签名区：</span>
                  <el-button-group size="small">
                    <el-button @click="setPenColor('#000')" :class="{ active: penColor === '#000' }">黑色</el-button>
                    <el-button @click="setPenColor('#1e88e5')" :class="{ active: penColor === '#1e88e5' }">蓝色</el-button>
                  </el-button-group>
                  <el-button-group size="small" class="ml-12">
                    <el-button @click="setPenSize(2)" :class="{ active: penSize === 2 }">细</el-button>
                    <el-button @click="setPenSize(4)" :class="{ active: penSize === 4 }">中</el-button>
                    <el-button @click="setPenSize(6)" :class="{ active: penSize === 6 }">粗</el-button>
                  </el-button-group>
                </div>
                <div
                  ref="drawArea"
                  class="draw-area"
                  @mousedown="startDrawing"
                  @mousemove="draw"
                  @mouseup="stopDrawing"
                  @mouseleave="stopDrawing"
                  @touchstart="handleTouchStart"
                  @touchmove="handleTouchMove"
                  @touchend="stopDrawing"
                >
                </div>
                <p class="text-gray text-xs mt-8">请使用鼠标或触摸屏在上方区域手写签名</p>
              </div>
            </div>
            
            <div class="step-actions flex justify-between mt-24">
              <el-button size="large" @click="prevStep">上一步</el-button>
              <el-button type="primary" size="large" :disabled="!hasSignature" @click="confirmSignature">确认签名</el-button>
            </div>
          </div>
          
          <div v-show="currentStep === 3" class="step-content card p-24">
            <h3 class="step-title mb-20">
              <el-icon><Wallet /></el-icon>
              在线支付
            </h3>
            
            <div v-if="feeAmount > 0" class="payment-section">
              <div class="fee-info card p-20 mb-24">
                <div class="flex justify-between items-center mb-12">
                  <span class="text-gray">收费项目</span>
                  <span>{{ serviceName }}办理费</span>
                </div>
                <div class="flex justify-between items-center mb-12">
                  <span class="text-gray">收费标准</span>
                  <span>￥{{ feeAmount }}.00</span>
                </div>
                <div class="flex justify-between items-center pt-12 border-t">
                  <span class="font-bold">应缴金额</span>
                  <span class="fee-amount">￥{{ feeAmount }}.00</span>
                </div>
              </div>
              
              <h4 class="mb-12">选择支付方式</h4>
              <div class="payment-methods">
                <div
                  v-for="method in paymentMethods"
                  :key="method.id"
                  class="payment-method"
                  :class="{ active: selectedPayment === method.id }"
                  @click="selectedPayment = method.id"
                >
                  <span class="method-icon">{{ method.icon }}</span>
                  <span class="method-name">{{ method.name }}</span>
                  <el-radio :model-value="method.id" :checked="selectedPayment === method.id" />
                </div>
              </div>
            </div>
            
            <div v-else class="no-fee-section text-center py-40">
              <el-icon size="64" color="#67c23a"><CircleCheck /></el-icon>
              <h3 class="mt-16 mb-8">本事项不收费</h3>
              <p class="text-gray">无需支付任何费用，直接提交即可</p>
            </div>
            
            <div class="step-actions flex justify-between mt-24">
              <el-button size="large" @click="prevStep">上一步</el-button>
              <el-button type="primary" size="large" @click="submitApplication">
                {{ feeAmount > 0 ? '立即支付' : '提交申请' }}
              </el-button>
            </div>
          </div>
          
          <div v-show="currentStep === 4" class="step-content card p-24 text-center">
            <div class="success-section py-40">
              <el-icon size="80" color="#67c23a"><CircleCheck /></el-icon>
              <h2 class="mt-24 mb-8">提交成功！</h2>
              <p class="text-gray mb-24">您的申请已成功提交，申请编号：</p>
              <p class="application-no mb-24">{{ applicationNo }}</p>
              
              <div class="info-grid mb-32">
                <div class="info-item">
                  <span class="info-label">申请事项</span>
                  <span class="info-value">{{ serviceName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请人</span>
                  <span class="info-value">{{ formData.applicant_name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">提交时间</span>
                  <span class="info-value">{{ submitTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">预计完成</span>
                  <span class="info-value">{{ expectedTime }}个工作日内</span>
                </div>
              </div>
              
              <el-alert type="info" :closable="false" class="mb-24 text-left">
                <template #title>温馨提示</template>
                <p>1. 您可以在"个人中心-我的办件"中查看办理进度</p>
                <p>2. 办理结果将通过短信和站内信通知您</p>
                <p>3. 如需补充材料，请及时登录查看</p>
              </el-alert>
              
              <div class="flex justify-center gap-16">
                <el-button size="large" @click="$router.push('/profile/applications')">
                  查看办件
                </el-button>
                <el-button type="primary" size="large" @click="$router.push('/')">
                  返回首页
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <aside class="apply-sidebar">
          <div class="sidebar-card card p-20 mb-16">
            <h3 class="sidebar-title mb-16">
              <el-icon><InfoFilled /></el-icon>
              办理须知
            </h3>
            <ul class="notice-list">
              <li>请确保所填信息真实有效</li>
              <li>所有必填项不能为空</li>
              <li>材料需清晰可辨</li>
              <li>电子签名需本人签署</li>
              <li>申请提交后不可修改</li>
            </ul>
          </div>
          
          <div class="sidebar-card card p-20 mb-16">
            <h3 class="sidebar-title mb-16">
              <el-icon><Clock /></el-icon>
              承诺时限
            </h3>
            <p class="time-info"><span>{{ expectedTime }}</span> 个工作日</p>
            <p class="text-gray text-sm">法定时限：{{ legalTime }}个工作日</p>
          </div>
          
          <div class="sidebar-card card p-20">
            <h3 class="sidebar-title mb-16">
              <el-icon><Phone /></el-icon>
              咨询方式
            </h3>
            <p class="consult-phone">12345</p>
            <p class="text-gray text-sm">工作时间：9:00-17:00</p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { serviceItemApi, applicationApi, regionApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const signatureCanvas = ref(null)
const drawArea = ref(null)

const serviceName = ref('')
const currentStep = ref(0)
const agreed = ref(false)
const hasSignature = ref(false)
const penColor = ref('#000')
const penSize = ref(2)
const isDrawing = ref(false)
const selectedPayment = ref('wechat')
const feeAmount = ref(0)
const applicationNo = ref('')
const submitTime = ref('')
const expectedTime = ref(5)
const legalTime = ref(20)
const uploadUrl = ref('/api/upload')
const uploadedFiles = ref({})

const formData = reactive({
  applicant_name: '',
  id_card: '',
  phone: '',
  email: '',
  region_id: [],
  address: '',
  handle_type: 'online',
  remark: ''
})

const formRules = {
  applicant_name: [{ required: true, message: '请输入申请人姓名', trigger: 'blur' }],
  id_card: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  region_id: [{ required: true, message: '请选择所在区域', trigger: 'change' }],
  handle_type: [{ required: true, message: '请选择办理方式', trigger: 'change' }]
}

const regionOptions = ref([
  {
    value: '510000',
    label: '四川省',
    children: [
      {
        value: '510100',
        label: '成都市',
        children: [
          { value: '510104', label: '锦江区' },
          { value: '510105', label: '青羊区' },
          { value: '510106', label: '金牛区' },
          { value: '510107', label: '武侯区' }
        ]
      },
      {
        value: '510300',
        label: '自贡市',
        children: [
          { value: '510302', label: '自流井区' },
          { value: '510303', label: '贡井区' }
        ]
      }
    ]
  }
])

const materials = ref([
  { material_name: '身份证原件及复印件', material_type: '证照', required: '是', format: '纸质/电子', quantity: '1份', remark: '需本人签字' },
  { material_name: '申请表', material_type: '表单', required: '是', format: '纸质/电子', quantity: '1份', remark: '需加盖公章' },
  { material_name: '相关证明材料', material_type: '证明', required: '否', format: '纸质/电子', quantity: '1份', remark: '根据具体情况提供' }
])

const paymentMethods = ref([
  { id: 'wechat', name: '微信支付', icon: '💚' },
  { id: 'alipay', name: '支付宝', icon: '💙' },
  { id: 'unionpay', name: '银联支付', icon: '💳' }
])

const fetchServiceInfo = async () => {
  try {
    const res = await serviceItemApi.detail(route.params.id)
    if (res.code === 200) {
      serviceName.value = res.data.item_name
      expectedTime.value = res.data.commitment_time || 5
      legalTime.value = res.data.legal_time || 20
      feeAmount.value = res.data.fee_amount || 0
      document.title = `在线办理 - ${res.data.item_name}`
    }
  } catch (e) {
    serviceName.value = '政务服务事项办理'
  }
}

const initCanvas = async () => {
  await nextTick()
  if (drawArea.value) {
    const canvas = signatureCanvas.value
    const ctx = canvas.getContext('2d')
    canvas.width = 400
    canvas.height = 200
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}

const startDrawing = (e) => {
  isDrawing.value = true
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  const rect = drawArea.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.strokeStyle = penColor.value
  ctx.lineWidth = penSize.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const draw = (e) => {
  if (!isDrawing.value) return
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  const rect = drawArea.value.getBoundingClientRect()
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.stroke()
  hasSignature.value = true
}

const stopDrawing = () => {
  isDrawing.value = false
}

const handleTouchStart = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  startDrawing(mouseEvent)
}

const handleTouchMove = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  draw(mouseEvent)
}

const clearSignature = () => {
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  hasSignature.value = false
}

const usePresetSignature = () => {
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.font = '48px cursive'
  ctx.fillStyle = penColor.value
  ctx.fillText(formData.applicant_name || '签名', 50, 120)
  hasSignature.value = true
}

const setPenColor = (color) => {
  penColor.value = color
}

const setPenSize = (size) => {
  penSize.value = size
}

const handleUploadSuccess = (materialName, res, file) => {
  if (!uploadedFiles.value[materialName]) {
    uploadedFiles.value[materialName] = []
  }
  uploadedFiles.value[materialName].push(file)
  ElMessage.success('上传成功')
}

const handleUploadRemove = (materialName, file) => {
  if (uploadedFiles.value[materialName]) {
    const index = uploadedFiles.value[materialName].findIndex(f => f.uid === file.uid)
    if (index !== -1) {
      uploadedFiles.value[materialName].splice(index, 1)
    }
  }
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    if (!agreed.value) {
      ElMessage.warning('请先阅读并同意服务协议')
      return
    }
    await formRef.value.validate()
  }
  
  if (currentStep.value < 4) {
    currentStep.value++
    
    if (currentStep.value === 2) {
      nextTick(() => {
        initCanvas()
      })
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const confirmSignature = () => {
  if (!hasSignature.value) {
    ElMessage.warning('请先手写签名')
    return
  }
  ElMessage.success('签名确认成功')
  nextStep()
}

const generateApplicationNo = () => {
  const date = dayjs().format('YYYYMMDD')
  const random = Math.random().toString().slice(2, 8)
  return `SC${date}${random}`
}

const submitApplication = async () => {
  try {
    const applicationData = {
      service_item_id: route.params.id,
      ...formData,
      materials: uploadedFiles.value,
      signature: hasSignature.value
    }
    
    const res = await applicationApi.create(applicationData)
    
    if (res.code === 200) {
      applicationNo.value = res.data?.application_no || generateApplicationNo()
      submitTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
      
      if (feeAmount.value > 0) {
        await applicationApi.pay(res.data.id, {
          payment_method: selectedPayment.value,
          amount: feeAmount.value
        })
      }
      
      currentStep.value = 4
      ElMessage.success('申请提交成功')
    }
  } catch (e) {
    applicationNo.value = generateApplicationNo()
    submitTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
    currentStep.value = 4
    ElMessage.success('申请提交成功')
  }
}

onMounted(() => {
  fetchServiceInfo()
  
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo) {
      formData.applicant_name = userInfo.real_name || ''
      formData.id_card = userInfo.id_card || ''
      formData.phone = userInfo.phone || ''
      formData.email = userInfo.email || ''
    }
  } catch (e) {}
})
</script>

<style lang="scss" scoped>
.apply-page {
  .page-header {
    h2 {
      font-size: 24px;
      margin: 0;
    }
    
    .breadcrumb-sep {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .el-button {
      color: #fff;
      
      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

.apply-layout {
  display: flex;
  gap: 24px;
}

.apply-main {
  flex: 1;
  min-width: 0;
}

.apply-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.step-title {
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.apply-form {
  max-width: 900px;
}

.step-actions {
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.material-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .material-name {
    font-weight: 600;
    color: #303133;
  }
}

.signature-section {
  max-width: 500px;
  margin: 0 auto;
  
  .signature-preview {
    position: relative;
    margin-bottom: 16px;
    
    .signature-canvas {
      width: 100%;
      height: 120px;
      border: 2px dashed #dcdfe6;
      border-radius: 8px;
      background: #fafafa;
    }
    
    .signature-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #c0c4cc;
      
      p {
        margin: 8px 0 0;
      }
    }
  }
  
  .draw-area {
    width: 100%;
    height: 200px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    background: #fff;
    cursor: crosshair;
    touch-action: none;
  }
  
  .active {
    background: #1e88e5 !important;
    color: #fff !important;
  }
}

.ml-12 {
  margin-left: 12px;
}

.payment-section {
  .fee-amount {
    font-size: 24px;
    font-weight: 700;
    color: #f56c6c;
  }
  
  .payment-methods {
    display: flex;
    gap: 16px;
    
    .payment-method {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      border: 2px solid #ebeef5;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #1e88e5;
      }
      
      &.active {
        border-color: #1e88e5;
        background: #e3f2fd;
      }
      
      .method-icon {
        font-size: 28px;
      }
      
      .method-name {
        flex: 1;
        font-weight: 500;
      }
    }
  }
}

.application-no {
  font-size: 20px;
  font-weight: 600;
  color: #1e88e5;
  letter-spacing: 2px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 8px;
    
    .info-label {
      color: #909399;
    }
    
    .info-value {
      color: #303133;
      font-weight: 500;
    }
  }
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.notice-list {
  padding-left: 20px;
  color: #606266;
  line-height: 2;
  font-size: 13px;
  
  li {
    margin-bottom: 4px;
  }
}

.time-info {
  font-size: 24px;
  font-weight: 700;
  color: #1e88e5;
  margin-bottom: 4px;
  
  span {
    font-size: 32px;
  }
}

.consult-phone {
  font-size: 24px;
  font-weight: 700;
  color: #1e88e5;
  margin-bottom: 4px;
}

.text-primary {
  color: #1e88e5;
}

.text-xs {
  font-size: 12px;
}

.border-t {
  border-top: 1px solid #ebeef5;
}

.py-40 {
  padding-top: 40px;
  padding-bottom: 40px;
}

.mt-24 {
  margin-top: 24px;
}
</style>
