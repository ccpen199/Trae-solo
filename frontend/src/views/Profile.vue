<template>
  <div class="profile-page page-container">
    <div class="header">
      <div class="user-info">
        <div class="avatar">
          <img :src="user.avatar || '/default-avatar.png'" :alt="user.nickname" />
        </div>
        <div class="user-detail">
          <h2 class="nickname">{{ user.nickname }}</h2>
          <p class="phone">{{ user.phone }}</p>
        </div>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-item" @click="goCoupons">
        <Ticket class="menu-icon" />
        <span class="menu-text">我的优惠券</span>
        <ChevronRight class="menu-arrow" />
      </div>
      <div class="menu-item" @click="goOrders">
        <Package class="menu-icon" />
        <span class="menu-text">我的订单</span>
        <ChevronRight class="menu-arrow" />
      </div>
      <div class="menu-item" @click="goDesignerApply">
        <Palette class="menu-icon" />
        <span class="menu-text">申请设计师</span>
        <ChevronRight class="menu-arrow" />
      </div>
      <div class="menu-item" @click="showEditProfile = true">
        <User class="menu-icon" />
        <span class="menu-text">编辑资料</span>
        <ChevronRight class="menu-arrow" />
      </div>
    </div>

    <div class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <BottomNav />

    <el-dialog title="编辑资料" v-model="showEditProfile">
      <el-form :model="editForm">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditProfile = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog title="申请设计师" v-model="showDesignerApply">
      <el-form :model="designerForm">
        <el-form-item label="真实姓名">
          <el-input v-model="designerForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="designerForm.bio" type="textarea" placeholder="请输入个人简介" />
        </el-form-item>
        <el-form-item label="从业年限">
          <el-input v-model="designerForm.experience" type="number" placeholder="请输入从业年限" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDesignerApply = false">取消</el-button>
        <el-button type="primary" @click="applyDesigner">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Ticket, Package, Palette, User, ChevronRight } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { useUserStore } from '@/stores/user'
import { authAPI, designerAPI } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const user = ref({
  nickname: '',
  phone: '',
  avatar: ''
})

const showEditProfile = ref(false)
const showDesignerApply = ref(false)

const editForm = reactive({
  nickname: ''
})

const designerForm = reactive({
  real_name: '',
  bio: '',
  experience: ''
})

onMounted(() => {
  loadUser()
})

async function loadUser() {
  try {
    const data = await authAPI.getProfile()
    user.value = data
    editForm.nickname = data.nickname || ''
  } catch {
    console.error('加载用户信息失败')
  }
}

function goCoupons() {
  router.push('/coupons')
}

function goOrders() {
  router.push('/orders')
}

function goDesignerApply() {
  showDesignerApply.value = true
}

async function saveProfile() {
  try {
    await authAPI.updateProfile({ nickname: editForm.nickname })
    user.value.nickname = editForm.nickname
    userStore.user = user.value
    showEditProfile.value = false
    ElMessage.success('修改成功')
  } catch {
    ElMessage.error('修改失败')
  }
}

async function applyDesigner() {
  if (!designerForm.real_name) {
    ElMessage.error('请输入真实姓名')
    return
  }
  try {
    await designerAPI.apply({
      real_name: designerForm.real_name,
      bio: designerForm.bio,
      experience: designerForm.experience || 0
    })
    showDesignerApply.value = false
    ElMessage.success('申请成功，等待审核')
  } catch {
    ElMessage.error('申请失败')
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.5);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-detail {
  color: white;
}

.nickname {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.phone {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

.menu-section {
  margin: 12px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 24px;
  height: 24px;
  color: #2563eb;
  margin-right: 12px;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.menu-arrow {
  width: 16px;
  height: 16px;
  color: #999;
}

.logout-section {
  padding: 16px;
}

.logout-btn {
  width: 100%;
  height: 44px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #666;
  font-size: 16px;
}
</style>