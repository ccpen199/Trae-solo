<template>
  <div class="register-page">
    <div class="page-header">
      <h1>用户注册</h1>
      <p style="font-size: 14px; opacity: 0.9; margin-top: 8px;">成为校园配送骑手</p>
    </div>
    
    <div class="page-content" style="padding: 16px;">
      <div v-if="success" class="alert alert-success">
        <h4 style="margin-bottom: 8px;">注册成功！</h4>
        <p>您的账号正在审核中，请等待人工审核通过后即可登录使用。</p>
        <button 
          class="btn btn-primary" 
          style="margin-top: 12px; width: auto;"
          @click="$router.push('/login')"
        >
          去登录
        </button>
      </div>
      
      <form v-else @submit.prevent="handleRegister" enctype="multipart/form-data">
        <div class="card">
          <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">基础信息</h3>
          
          <div class="form-group">
            <label class="form-label">手机号 <span style="color: #ff4d4f;">*</span></label>
            <div class="input-with-btn">
              <input 
                type="tel" 
                v-model="registerForm.phone" 
                class="form-input" 
                placeholder="请输入手机号"
                maxlength="11"
              >
              <button 
                type="button" 
                class="btn btn-secondary"
                @click="sendCode"
                :disabled="codeSending || codeCountdown > 0"
              >
                {{ codeCountdown > 0 ? `${codeCountdown}s` : codeSending ? '发送中' : '获取验证码' }}
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">验证码 <span style="color: #ff4d4f;">*</span></label>
            <input 
              type="text" 
              v-model="registerForm.code" 
              class="form-input" 
              placeholder="请输入6位验证码"
              maxlength="6"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">设置密码 <span style="color: #ff4d4f;">*</span></label>
            <input 
              type="password" 
              v-model="registerForm.password" 
              class="form-input" 
              placeholder="请设置密码（至少6位）"
            >
          </div>
        </div>
        
        <div class="card">
          <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">身份信息</h3>
          
          <div class="form-group">
            <label class="form-label">真实姓名 <span style="color: #ff4d4f;">*</span></label>
            <input 
              type="text" 
              v-model="registerForm.realName" 
              class="form-input" 
              placeholder="请输入真实姓名"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">身份证号 <span style="color: #ff4d4f;">*</span></label>
            <input 
              type="text" 
              v-model="registerForm.idCardNumber" 
              class="form-input" 
              placeholder="请输入18位身份证号"
              maxlength="18"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">身份证正面照 <span style="color: #ff4d4f;">*</span></label>
            <div 
              class="file-upload" 
              :class="{ 'has-file': idCardFrontPreview }"
              @click="triggerUpload('idCardFront')"
            >
              <img v-if="idCardFrontPreview" :src="idCardFrontPreview" class="upload-preview">
              <div v-else>
                <div style="font-size: 32px; margin-bottom: 8px;">📷</div>
                <div class="upload-text">点击上传身份证正面照</div>
              </div>
            </div>
            <input 
              type="file" 
              ref="idCardFrontInput" 
              style="display: none;" 
              accept="image/*"
              @change="handleFileSelect('idCardFront', $event)"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">学生证首页 <span style="color: #ff4d4f;">*</span></label>
            <div 
              class="file-upload" 
              :class="{ 'has-file': studentCardPreview }"
              @click="triggerUpload('studentCard')"
            >
              <img v-if="studentCardPreview" :src="studentCardPreview" class="upload-preview">
              <div v-else>
                <div style="font-size: 32px; margin-bottom: 8px;">📷</div>
                <div class="upload-text">点击上传学生证首页</div>
              </div>
            </div>
            <input 
              type="file" 
              ref="studentCardInput" 
              style="display: none;" 
              accept="image/*"
              @change="handleFileSelect('studentCard', $event)"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">人脸识别</label>
            <div class="toggle-switch">
              <span class="toggle-label">已完成人脸识别</span>
              <div 
                class="toggle" 
                :class="{ active: registerForm.faceVerified }"
                @click="registerForm.faceVerified = !registerForm.faceVerified"
              ></div>
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 4px;">提示：实际使用中需对接人脸识别SDK</p>
          </div>
        </div>
        
        <div class="card">
          <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">学校与紧急联系人</h3>
          
          <div class="form-group">
            <label class="form-label">选择城市 <span style="color: #ff4d4f;">*</span></label>
            <select 
              v-model="registerForm.cityId" 
              class="select-input"
              @change="onCityChange"
            >
              <option value="">请选择城市</option>
              <option v-for="city in cities" :key="city.id" :value="city.id">
                {{ city.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">选择学校 <span style="color: #ff4d4f;">*</span></label>
            <select 
              v-model="registerForm.schoolId" 
              class="select-input"
              :disabled="!registerForm.cityId"
            >
              <option value="">请选择学校</option>
              <option v-for="school in schools" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">紧急联系人 <span style="color: #ff4d4f;">*</span></label>
            <input 
              type="text" 
              v-model="registerForm.emergencyContact" 
              class="form-input" 
              placeholder="请输入紧急联系人姓名"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">紧急联系电话 <span style="color: #ff4d4f;">*</span></label>
            <input 
              type="tel" 
              v-model="registerForm.emergencyPhone" 
              class="form-input" 
              placeholder="请输入紧急联系电话"
              maxlength="11"
            >
          </div>
        </div>
        
        <div v-if="error" class="alert alert-error" style="margin: 12px;">
          {{ error }}
        </div>
        
        <div style="padding: 0 12px 80px;">
          <button 
            type="submit" 
            class="btn btn-primary btn-block"
            :disabled="loading"
          >
            {{ loading ? '提交中...' : '提交注册' }}
          </button>
          
          <div style="text-align: center; margin-top: 20px;">
            <span style="color: #999; font-size: 14px;">已有账号？</span>
            <router-link to="/login" style="color: #667eea; font-size: 14px; margin-left: 4px;">立即登录</router-link>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { authApi, commonApi } from '../api'

const registerForm = ref({
  phone: '',
  code: '',
  password: '',
  realName: '',
  idCardNumber: '',
  emergencyContact: '',
  emergencyPhone: '',
  cityId: '',
  schoolId: '',
  faceVerified: false
})

const cities = ref([])
const schools = ref([])
const error = ref('')
const loading = ref(false)
const success = ref(false)
const codeSending = ref(false)
const codeCountdown = ref(0)

const idCardFrontFile = ref(null)
const studentCardFile = ref(null)
const idCardFrontPreview = ref('')
const studentCardPreview = ref('')

const idCardFrontInput = ref(null)
const studentCardInput = ref(null)

const loadCities = async () => {
  try {
    const response = await commonApi.getCities()
    if (response.data.success) {
      cities.value = response.data.data
    }
  } catch (err) {
    console.error('加载城市失败:', err)
  }
}

const onCityChange = async () => {
  registerForm.value.schoolId = ''
  schools.value = []
  
  if (registerForm.value.cityId) {
    try {
      const response = await commonApi.getSchools(registerForm.value.cityId)
      if (response.data.success) {
        schools.value = response.data.data
      }
    } catch (err) {
      console.error('加载学校失败:', err)
    }
  }
}

const sendCode = async () => {
  if (!registerForm.value.phone.trim()) {
    error.value = '请输入手机号'
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(registerForm.value.phone)) {
    error.value = '请输入有效的手机号'
    return
  }
  
  codeSending.value = true
  error.value = ''
  
  try {
    const response = await authApi.sendCode(registerForm.value.phone)
    if (response.data.success) {
      alert(`验证码已发送：${response.data.debug?.code || '查看控制台'}`)
      codeCountdown.value = 60
      const timer = setInterval(() => {
        codeCountdown.value--
        if (codeCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      error.value = response.data.message || '发送失败'
    }
  } catch (err) {
    error.value = err.response?.data?.message || '发送失败'
  } finally {
    codeSending.value = false
  }
}

const triggerUpload = (type) => {
  if (type === 'idCardFront') {
    idCardFrontInput.value.click()
  } else {
    studentCardInput.value.click()
  }
}

const handleFileSelect = (type, event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    if (type === 'idCardFront') {
      idCardFrontFile.value = file
      idCardFrontPreview.value = e.target.result
    } else {
      studentCardFile.value = file
      studentCardPreview.value = e.target.result
    }
  }
  reader.readAsDataURL(file)
}

const handleRegister = async () => {
  error.value = ''
  
  if (!registerForm.value.phone.trim()) {
    error.value = '请输入手机号'
    return
  }
  
  if (!registerForm.value.code) {
    error.value = '请输入验证码'
    return
  }
  
  if (!registerForm.value.password || registerForm.value.password.length < 6) {
    error.value = '密码至少6位'
    return
  }
  
  if (!registerForm.value.realName.trim()) {
    error.value = '请输入真实姓名'
    return
  }
  
  if (!registerForm.value.idCardNumber || registerForm.value.idCardNumber.length !== 18) {
    error.value = '请输入18位身份证号'
    return
  }
  
  if (!idCardFrontFile.value) {
    error.value = '请上传身份证正面照'
    return
  }
  
  if (!studentCardFile.value) {
    error.value = '请上传学生证首页'
    return
  }
  
  if (!registerForm.value.cityId) {
    error.value = '请选择城市'
    return
  }
  
  if (!registerForm.value.schoolId) {
    error.value = '请选择学校'
    return
  }
  
  if (!registerForm.value.emergencyContact.trim()) {
    error.value = '请输入紧急联系人'
    return
  }
  
  if (!registerForm.value.emergencyPhone.trim()) {
    error.value = '请输入紧急联系电话'
    return
  }
  
  loading.value = true
  
  try {
    const formData = new FormData()
    formData.append('phone', registerForm.value.phone)
    formData.append('code', registerForm.value.code)
    formData.append('password', registerForm.value.password)
    formData.append('realName', registerForm.value.realName)
    formData.append('idCardNumber', registerForm.value.idCardNumber)
    formData.append('emergencyContact', registerForm.value.emergencyContact)
    formData.append('emergencyPhone', registerForm.value.emergencyPhone)
    formData.append('cityId', registerForm.value.cityId)
    formData.append('schoolId', registerForm.value.schoolId)
    formData.append('faceVerified', registerForm.value.faceVerified)
    
    if (idCardFrontFile.value) {
      formData.append('idCardFront', idCardFrontFile.value)
    }
    if (studentCardFile.value) {
      formData.append('studentCardPage', studentCardFile.value)
    }
    
    const response = await authApi.register(formData)
    
    if (response.data.success) {
      success.value = true
    } else {
      error.value = response.data.message || '注册失败'
    }
  } catch (err) {
    error.value = err.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCities()
})
</script>
