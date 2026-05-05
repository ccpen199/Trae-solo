<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-logo">
        <el-icon :size="48" color="#667eea"><House /></el-icon>
        <h1>标准化套餐系统</h1>
      </div>
      
      <el-card class="register-card">
        <template #header>
          <div class="card-header">
            <span>用户注册</span>
          </div>
        </template>
        
        <el-steps :active="currentStep" align-center class="register-steps">
          <el-step title="基本信息" />
          <el-step title="房屋信息" />
          <el-step title="完成注册" />
        </el-steps>
        
        <div class="step-content">
          <div v-show="currentStep === 0">
            <el-form ref="form1" :model="registerForm" :rules="basicRules" label-width="100px">
              <el-form-item label="手机号" prop="phone">
                <el-input 
                  v-model="registerForm.phone" 
                  placeholder="请输入手机号"
                  prefix-icon="User"
                />
              </el-form-item>
              
              <el-form-item label="密码" prop="password">
                <el-input 
                  v-model="registerForm.password" 
                  type="password"
                  placeholder="请输入密码（不填则默认为手机号后6位）"
                  prefix-icon="Lock"
                  show-password
                />
              </el-form-item>
              
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input 
                  v-model="registerForm.confirmPassword" 
                  type="password"
                  placeholder="请再次输入密码"
                  prefix-icon="Lock"
                  show-password
                />
              </el-form-item>
              
              <el-form-item label="姓名" prop="realName">
                <el-input 
                  v-model="registerForm.realName" 
                  placeholder="请输入真实姓名（选填）"
                  prefix-icon="User"
                />
              </el-form-item>
              
              <el-form-item label="身份证号" prop="idCard">
                <el-input 
                  v-model="registerForm.idCard" 
                  placeholder="请输入身份证号（选填）"
                  prefix-icon="Document"
                />
              </el-form-item>
            </el-form>
          </div>
          
          <div v-show="currentStep === 1">
            <el-form ref="form2" :model="registerForm" :rules="houseRules" label-width="100px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="省份" prop="province">
                    <el-input 
                      v-model="registerForm.province" 
                      placeholder="请输入省份"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="城市" prop="city">
                    <el-input 
                      v-model="registerForm.city" 
                      placeholder="请输入城市"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="区域" prop="district">
                    <el-input 
                      v-model="registerForm.district" 
                      placeholder="请输入区域"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="项目" prop="project">
                    <el-input 
                      v-model="registerForm.project" 
                      placeholder="请输入小区/项目名称"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="楼栋" prop="building">
                    <el-input 
                      v-model="registerForm.building" 
                      placeholder="楼栋号"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="楼层" prop="floor">
                    <el-input 
                      v-model="registerForm.floor" 
                      placeholder="楼层"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="房号" prop="roomNumber">
                    <el-input 
                      v-model="registerForm.roomNumber" 
                      placeholder="房号"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="户型" prop="houseType">
                    <el-select v-model="registerForm.houseType" placeholder="请选择户型" style="width: 100%">
                      <el-option label="一室一厅" value="一室一厅" />
                      <el-option label="两室一厅" value="两室一厅" />
                      <el-option label="两室两厅" value="两室两厅" />
                      <el-option label="三室一厅" value="三室一厅" />
                      <el-option label="三室两厅" value="三室两厅" />
                      <el-option label="四室及以上" value="四室及以上" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="房屋面积" prop="houseArea">
                    <el-input-number 
                      v-model="registerForm.houseArea" 
                      :min="0"
                      :precision="2"
                      placeholder="请输入房屋面积（㎡）"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="平面效果图">
                <el-upload
                  class="upload-demo"
                  action="#"
                  :auto-upload="false"
                  multiple
                  :limit="3"
                >
                  <el-button type="primary">点击上传</el-button>
                  <template #tip>
                    <div class="el-upload__tip">只能上传 jpg/png 文件，且不超过 500kb</div>
                  </template>
                </el-upload>
              </el-form-item>
            </el-form>
          </div>
          
          <div v-show="currentStep === 2" class="confirm-step">
            <el-result
              icon="success"
              title="注册信息确认"
              sub-title="请确认以下信息，确认后将完成注册"
            >
              <template #extra>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="手机号">{{ registerForm.phone }}</el-descriptions-item>
                  <el-descriptions-item label="姓名">{{ registerForm.realName || '未填写' }}</el-descriptions-item>
                  <el-descriptions-item label="城市">{{ registerForm.city || '未填写' }}</el-descriptions-item>
                  <el-descriptions-item label="项目">{{ registerForm.project || '未填写' }}</el-descriptions-item>
                  <el-descriptions-item label="户型">{{ registerForm.houseType || '未填写' }}</el-descriptions-item>
                  <el-descriptions-item label="面积">{{ registerForm.houseArea ? registerForm.houseArea + '㎡' : '未填写' }}</el-descriptions-item>
                </el-descriptions>
              </template>
            </el-result>
          </div>
        </div>
        
        <div class="step-actions">
          <el-button 
            v-if="currentStep > 0"
            @click="prevStep"
          >
            上一步
          </el-button>
          <el-button 
            v-if="currentStep < 2"
            type="primary"
            @click="nextStep"
          >
            下一步
          </el-button>
          <el-button 
            v-if="currentStep === 2"
            type="primary"
            :loading="loading"
            @click="handleRegister"
          >
            完成注册
          </el-button>
        </div>
        
        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login">立即登录</router-link>
        </div>
      </el-card>
      
      <p class="register-tip">提示：未设置密码时，默认密码为手机号后6位</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(0)
const loading = ref(false)

const registerForm = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
  realName: '',
  idCard: '',
  province: '',
  city: '',
  district: '',
  project: '',
  building: '',
  floor: '',
  roomNumber: '',
  houseType: '',
  houseArea: null
})

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback()
    return
  }
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const basicRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass2, trigger: 'blur' }
  ]
}

const houseRules = {
  houseArea: [
    { type: 'number', min: 0, message: '面积不能为负数', trigger: 'blur' }
  ]
}

const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleRegister = async () => {
  if (!registerForm.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  
  loading.value = true
  try {
    const registerData = {
      phone: registerForm.phone,
      password: registerForm.password || undefined,
      realName: registerForm.realName || undefined,
      idCard: registerForm.idCard || undefined,
      province: registerForm.province || undefined,
      city: registerForm.city || undefined,
      district: registerForm.district || undefined,
      project: registerForm.project || undefined,
      building: registerForm.building || undefined,
      floor: registerForm.floor || undefined,
      roomNumber: registerForm.roomNumber || undefined,
      houseType: registerForm.houseType || undefined,
      houseArea: registerForm.houseArea || undefined
    }
    
    await userStore.register(registerData)
    ElMessage.success('注册成功！默认密码为手机号后6位')
    router.push('/login')
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage.error(error.response?.data?.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 20px 0;
}

.register-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.register-logo {
  text-align: center;
  margin-bottom: 20px;
}

.register-logo h1 {
  color: #fff;
  margin-top: 10px;
  font-size: 24px;
  font-weight: bold;
}

.register-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.card-header {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.register-steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 350px;
}

.step-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.register-footer span {
  color: #909399;
}

.register-footer a {
  color: #667eea;
  margin-left: 5px;
}

.register-tip {
  text-align: center;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.confirm-step {
  padding: 20px;
}
</style>
