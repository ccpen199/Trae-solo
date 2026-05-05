<template>
  <div class="user-profile-page">
    <div class="container">
      <h1 class="page-title">个人中心</h1>
      
      <div class="profile-content">
        <div class="profile-sidebar">
          <div class="user-card">
            <div class="user-avatar">
              <el-avatar :size="80" icon="UserFilled" />
            </div>
            <div class="user-info">
              <h3>{{ userStore.userInfo?.realName || '用户' }}</h3>
              <p class="user-phone">
                {{ userStore.userInfo?.phone ? userStore.userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定手机' }}
              </p>
            </div>
          </div>
          
          <div class="quick-actions">
            <router-link to="/orders">
              <div class="action-item">
                <el-icon :size="24"><Document /></el-icon>
                <span>我的订单</span>
              </div>
            </router-link>
            <router-link to="/cart">
              <div class="action-item">
                <el-icon :size="24"><ShoppingCart /></el-icon>
                <span>购物车</span>
              </div>
            </router-link>
          </div>
        </div>
        
        <div class="profile-main">
          <el-tabs v-model="activeTab" type="border-card">
            <el-tab-pane label="基本信息" name="basic">
              <el-form 
                ref="basicForm" 
                :model="basicForm" 
                :rules="basicRules" 
                label-width="100px"
                class="profile-form"
              >
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="basicForm.phone" disabled />
                </el-form-item>
                
                <el-form-item label="姓名" prop="realName">
                  <el-input v-model="basicForm.realName" placeholder="请输入真实姓名" />
                </el-form-item>
                
                <el-form-item label="身份证号" prop="idCard">
                  <el-input v-model="basicForm.idCard" placeholder="请输入身份证号" maxlength="18" />
                </el-form-item>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    :loading="saving"
                    @click="handleSaveBasic"
                  >
                    保存修改
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="房屋信息" name="house">
              <el-form 
                ref="houseForm" 
                :model="houseForm" 
                :rules="houseRules" 
                label-width="100px"
                class="profile-form"
              >
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="省份" prop="province">
                      <el-input v-model="houseForm.province" placeholder="请输入省份" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="城市" prop="city">
                      <el-input v-model="houseForm.city" placeholder="请输入城市" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="区域" prop="district">
                      <el-input v-model="houseForm.district" placeholder="请输入区域" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="小区/项目" prop="project">
                      <el-input v-model="houseForm.project" placeholder="请输入小区/项目名称" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="楼栋" prop="building">
                      <el-input v-model="houseForm.building" placeholder="楼栋号" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="楼层" prop="floor">
                      <el-input v-model="houseForm.floor" placeholder="楼层" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="房号" prop="roomNumber">
                      <el-input v-model="houseForm.roomNumber" placeholder="房号" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="户型" prop="houseType">
                      <el-select v-model="houseForm.houseType" placeholder="请选择户型" style="width: 100%">
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
                        v-model="houseForm.houseArea" 
                        :min="0"
                        :precision="2"
                        placeholder="房屋面积（㎡）"
                        style="width: 100%"
                      >
                        <template #suffix>㎡</template>
                      </el-input-number>
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
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    :loading="saving"
                    @click="handleSaveHouse"
                  >
                    保存修改
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="修改密码" name="password">
              <el-form 
                ref="passwordForm" 
                :model="passwordForm" 
                :rules="passwordRules" 
                label-width="100px"
                class="profile-form"
              >
                <el-form-item label="当前密码" prop="oldPassword">
                  <el-input 
                    v-model="passwordForm.oldPassword" 
                    type="password"
                    show-password
                    placeholder="请输入当前密码"
                  />
                </el-form-item>
                
                <el-form-item label="新密码" prop="newPassword">
                  <el-input 
                    v-model="passwordForm.newPassword" 
                    type="password"
                    show-password
                    placeholder="请输入新密码（6-20位）"
                  />
                </el-form-item>
                
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input 
                    v-model="passwordForm.confirmPassword" 
                    type="password"
                    show-password
                    placeholder="请再次输入新密码"
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    :loading="saving"
                    @click="handleSavePassword"
                  >
                    修改密码
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const activeTab = ref('basic')
const saving = ref(false)

const basicForm = reactive({
  phone: '',
  realName: '',
  idCard: ''
})

const houseForm = reactive({
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

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const basicRules = {
  realName: [
    { min: 2, max: 20, message: '姓名长度在2-20个字符', trigger: 'blur' }
  ],
  idCard: [
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ]
}

const houseRules = {
  houseArea: [
    { type: 'number', min: 0, message: '面积不能为负数', trigger: 'blur' }
  ]
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const loadUserData = () => {
  const user = userStore.userInfo
  if (user) {
    basicForm.phone = user.phone || ''
    basicForm.realName = user.realName || ''
    basicForm.idCard = user.idCard || ''
    
    houseForm.province = user.province || ''
    houseForm.city = user.city || ''
    houseForm.district = user.district || ''
    houseForm.project = user.project || ''
    houseForm.building = user.building || ''
    houseForm.floor = user.floor || ''
    houseForm.roomNumber = user.roomNumber || ''
    houseForm.houseType = user.houseType || ''
    houseForm.houseArea = user.houseArea || null
  }
}

const handleSaveBasic = async () => {
  saving.value = true
  try {
    const data = {
      realName: basicForm.realName || undefined,
      idCard: basicForm.idCard || undefined
    }
    await userStore.updateProfile(data)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleSaveHouse = async () => {
  saving.value = true
  try {
    const data = {
      province: houseForm.province || undefined,
      city: houseForm.city || undefined,
      district: houseForm.district || undefined,
      project: houseForm.project || undefined,
      building: houseForm.building || undefined,
      floor: houseForm.floor || undefined,
      roomNumber: houseForm.roomNumber || undefined,
      houseType: houseForm.houseType || undefined,
      houseArea: houseForm.houseArea || undefined
    }
    await userStore.updateProfile(data)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleSavePassword = async () => {
  saving.value = true
  try {
    await userStore.updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('密码修改失败:', error)
    ElMessage.error(error.response?.data?.message || '密码修改失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.user-profile-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.page-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  font-weight: bold;
}

.profile-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

.profile-sidebar {
  flex-shrink: 0;
}

.user-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  margin-bottom: 20px;
}

.user-avatar {
  margin-bottom: 15px;
}

.user-info h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 5px;
  font-weight: bold;
}

.user-phone {
  font-size: 14px;
  color: #909399;
}

.quick-actions {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
}

.quick-actions a {
  text-decoration: none;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  border-radius: 8px;
  color: #606266;
  transition: all 0.3s ease;
}

.action-item:hover {
  background: #f5f7fa;
  color: #667eea;
}

.profile-main {
  min-width: 0;
}

.profile-form {
  max-width: 600px;
  padding: 20px;
}

.upload-demo {
  margin-top: 10px;
}

@media (max-width: 992px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    display: flex;
    gap: 10px;
  }
  
  .quick-actions .action-item {
    flex: 1;
    justify-content: center;
  }
}
</style>
