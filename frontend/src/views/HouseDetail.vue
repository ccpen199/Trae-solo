<template>
  <div class="house-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button type="primary" link @click="goBack">
              <el-icon><ArrowLeft /></el-icon>返回
            </el-button>
            <span class="title">{{ houseDetail?.house?.name }}</span>
            <el-tag :type="houseDetail?.house?.status === 'available' ? 'success' : 'info'">
              {{ houseDetail?.house?.status === 'available' ? '可租' : '不可租' }}
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button 
              v-if="userStore.user?.role === 'buyer'" 
              type="primary" 
              @click="startViewingSession"
            >
              <el-icon><VideoCamera /></el-icon>开始看房
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="房源编号">
          {{ houseDetail?.house?.house_no }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ houseDetail?.house?.address }}
        </el-descriptions-item>
        <el-descriptions-item label="开发商">
          {{ houseDetail?.house?.developer_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="面积(㎡)">
          {{ houseDetail?.house?.area || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="户型">
          {{ houseDetail?.house?.rooms ? houseDetail.house.rooms + '室' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="价格(万元)">
          {{ houseDetail?.house?.price ? (houseDetail.house.price / 10000).toFixed(0) : '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card v-if="houseDetail?.panoramics?.length > 0" style="margin-top: 20px;">
      <template #header>
        <span>全景图列表 ({{ houseDetail?.panoramics?.length }})</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="8" v-for="panoramic in houseDetail?.panoramics" :key="panoramic.id">
          <el-card shadow="hover" class="resource-card">
            <div class="resource-icon">
              <el-icon :size="48" color="#409EFF"><VideoCamera /></el-icon>
            </div>
            <div class="resource-info">
              <h4>{{ panoramic.name }}</h4>
              <p class="resource-desc">{{ panoramic.description || '暂无描述' }}</p>
              <div class="resource-meta">
                <el-tag :type="panoramic.status === 'active' ? 'success' : 'info'" size="small">
                  {{ panoramic.status === 'active' ? '已激活' : '草稿' }}
                </el-tag>
                <span class="meta-text">v{{ panoramic.version }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card v-if="houseDetail?.floorPlans?.length > 0" style="margin-top: 20px;">
      <template #header>
        <span>户型图列表 ({{ houseDetail?.floorPlans?.length }})</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="8" v-for="floorPlan in houseDetail?.floorPlans" :key="floorPlan.id">
          <el-card shadow="hover" class="resource-card">
            <div class="resource-icon">
              <el-icon :size="48" color="#67C23A"><OfficeBuilding /></el-icon>
            </div>
            <div class="resource-info">
              <h4>{{ floorPlan.name }}</h4>
              <p class="resource-desc">{{ floorPlan.description || '暂无描述' }}</p>
              <div class="resource-meta">
                <el-tag :type="floorPlan.is_locked ? 'warning' : 'success'" size="small">
                  {{ floorPlan.is_locked ? '已锁定' : '可用' }}
                </el-tag>
                <span class="meta-text">v{{ floorPlan.version }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { housesApi, sessionsApi } from '@/api'
import { ArrowLeft, VideoCamera, OfficeBuilding } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const houseDetail = ref(null)

const goBack = () => {
  router.back()
}

const fetchHouseDetail = async () => {
  try {
    const res = await housesApi.getDetail(route.params.id)
    houseDetail.value = res
  } catch (error) {
    console.error('获取房源详情失败:', error)
  }
}

const startViewingSession = async () => {
  try {
    const res = await sessionsApi.create({ house_id: route.params.id })
    ElMessage.success('看房会话创建成功')
    router.push(`/sessions/${res.session.id}`)
  } catch (error) {
    if (error.response?.data?.existingSessionId) {
      ElMessage.warning('该房源已有进行中的看房会话')
      router.push(`/sessions/${error.response.data.existingSessionId}`)
    }
  }
}

onMounted(() => {
  fetchHouseDetail()
})
</script>

<style scoped>
.house-detail-container {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.resource-card {
  margin-bottom: 20px;
}

.resource-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.resource-info h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: bold;
}

.resource-desc {
  margin: 0 0 8px;
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-text {
  font-size: 12px;
  color: #909399;
}
</style>
