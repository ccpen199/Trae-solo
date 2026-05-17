<template>
  <div class="profile-container">
    <el-header class="profile-header">
      <div class="header-inner">
        <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
        <h1 class="page-title">个人中心</h1>
      </div>
    </el-header>

    <el-main class="profile-main" v-loading="loading">
      <el-card class="info-card">
        <div class="profile-info">
          <el-avatar :size="80">
            {{ userInfo?.nickname?.charAt(0) || userInfo?.username?.charAt(0) || 'U' }}
          </el-avatar>
          <div class="profile-body">
            <h2 class="profile-name">{{ userInfo?.nickname || userInfo?.username }}</h2>
            <p class="profile-username">用户名: {{ userInfo?.username }}</p>
            <p class="profile-bio">{{ userInfo?.bio || '暂无个人简介' }}</p>
            <div class="profile-stats">
              <div class="stat-item">
                <div class="stat-value">{{ balance }} ¥</div>
                <div class="stat-label">余额</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ joinedPlanets }}</div>
                <div class="stat-label">加入的星球</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ ownedPlanets }}</div>
                <div class="stat-label">创建的星球</div>
              </div>
            </div>
          </div>
          <el-button type="primary" @click="showEdit = true">编辑资料</el-button>
        </div>
      </el-card>

      <h3 class="section-title">我的星球</h3>

      <div v-if="planetsLoading" class="loading-wrap">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="myPlanets.length === 0" class="empty-wrap">
        <el-icon :size="48" color="#909399"><Document /></el-icon>
        <p class="empty-text">还没有加入任何星球</p>
        <el-button type="primary" class="mt-20" @click="goHome">去发现星球</el-button>
      </div>

      <div v-else class="planet-grid">
        <el-card
          v-for="planet in myPlanets"
          :key="planet.id"
          class="planet-card"
          @click="goPlanetDetail(planet.id)"
        >
          <div class="planet-cover">
            <span class="planet-initial">{{ planet.name.charAt(0) }}</span>
          </div>
          <div class="planet-header">
            <h4 class="planet-name">{{ planet.name }}</h4>
            <el-tag
              :type="planet.role === 'owner' ? 'danger' : 'success'"
              size="small"
            >
              {{ planet.role === 'owner' ? '创建者' : '成员' }}
            </el-tag>
          </div>
          <p class="planet-desc">{{ planet.description || '暂无描述' }}</p>
          <div class="planet-footer">
            <span class="stat-item">
              <el-icon><User /></el-icon>
              {{ planet.member_count || 0 }} 成员
            </span>
            <span class="stat-item">
              <el-icon><Document /></el-icon>
              {{ planet.topic_count || 0 }} 主题
            </span>
          </div>
        </el-card>
      </div>
    </el-main>

    <el-dialog v-model="showEdit" title="编辑资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input
            v-model="editForm.bio"
            type="textarea"
            :rows="3"
            placeholder="请输入个人简介"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getProfile, updateProfile } from '@/api/user'
import { getPlanets } from '@/api/planet'
import { ArrowLeft, User, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const planetsLoading = ref(false)
const showEdit = ref(false)
const saving = ref(false)

const userInfo = ref(null)
const balance = ref(0)
const joinedPlanets = ref(0)
const ownedPlanets = ref(0)
const myPlanets = ref([])

const editForm = reactive({
  nickname: '',
  bio: ''
})

const fetchUserInfo = async () => {
  loading.value = true

  try {
    const res = await getProfile()
    userInfo.value = res.data
    balance.value = res.data.balance || 0

    editForm.nickname = res.data.nickname || ''
    editForm.bio = res.data.bio || ''
  } catch (error) {
    console.error('获取用户信息失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchMyPlanets = async () => {
  planetsLoading.value = true

  try {
    const [joinedRes, ownedRes] = await Promise.all([
      getPlanets({ type: 'joined', pageSize: 100 }),
      getPlanets({ type: 'owned', pageSize: 100 })
    ])

    joinedPlanets.value = joinedRes.data.total || 0
    ownedPlanets.value = ownedRes.data.total || 0

    myPlanets.value = [
      ...(ownedRes.data.list || []).map(p => ({ ...p, role: 'owner' })),
      ...(joinedRes.data.list || []).filter(p => p.role !== 'owner')
    ]
  } catch (error) {
    console.error('获取我的星球失败:', error)
  } finally {
    planetsLoading.value = false
  }
}

const handleSave = async () => {
  saving.value = true

  try {
    await updateProfile({
      nickname: editForm.nickname,
      bio: editForm.bio
    })

    ElMessage.success('保存成功')
    showEdit.value = false
    await fetchUserInfo()
  } catch (error) {
    console.error('更新资料失败:', error)
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/home')
}

const goPlanetDetail = (id) => {
  router.push(`/planet/${id}`)
}

onMounted(() => {
  fetchUserInfo()
  fetchMyPlanets()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.profile-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0 24px;
  height: 64px;
}

.header-inner {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 0 16px;
}

.profile-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.mt-20 {
  margin-top: 20px;
}

.info-card {
  margin-bottom: 24px;
}

.profile-info {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.profile-body {
  flex: 1;
}

.profile-name {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.profile-username {
  color: #909399;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.profile-bio {
  color: #606266;
  margin: 0 0 16px 0;
}

.profile-stats {
  display: flex;
  align-items: center;
  gap: 32px;
}

.profile-stats .stat-item {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-text {
  color: #606266;
  margin-top: 16px;
}

.planet-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 640px) {
  .planet-grid {
    grid-template-columns: 1fr;
  }
}

.planet-card {
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.planet-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.planet-cover {
  height: 96px;
  background: linear-gradient(90deg, #66b1ff, #b37feb);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.planet-initial {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.planet-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.planet-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.planet-desc {
  color: #909399;
  font-size: 14px;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  min-height: 42px;
}

.planet-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.planet-footer .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
