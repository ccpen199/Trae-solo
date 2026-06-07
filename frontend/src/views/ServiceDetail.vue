<template>
  <div class="mobile-container">
    <div class="header">
      <div class="flex-between">
        <el-icon :size="24" style="cursor: pointer;" @click="goBack"><ArrowLeft /></el-icon>
        <h2 style="font-size: 18px; flex: 1; text-align: center; margin-right: 24px;">服务详情</h2>
      </div>
    </div>

    <div v-if="service" style="padding: 16px;">
      <div class="gov-card" style="margin-bottom: 16px;">
        <div class="flex-between" style="margin-bottom: 12px;">
          <h2 style="font-size: 20px; color: #333;">{{ service.name }}</h2>
          <el-tag type="primary">{{ service.category }}</el-tag>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">{{ service.description }}</p>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
          <p style="color: #999; font-size: 13px;">
            <el-icon><OfficeBuilding /></el-icon>
            {{ service.department }}
          </p>
        </div>
      </div>

      <div class="gov-card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px; color: #333;">办理信息</h3>
        <div class="info-row">
          <span class="info-label">办理时限</span>
          <span class="info-value">{{ service.handling_time }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">办理费用</span>
          <span class="info-value">{{ service.fee }}</span>
        </div>
      </div>

      <div class="gov-card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px; color: #333;">所需材料</h3>
        <div class="material-list">
          <div v-for="(material, index) in materials" :key="index" class="material-item">
            <el-icon color="#1e5cb8"><DocumentChecked /></el-icon>
            <span>{{ material }}</span>
          </div>
        </div>
      </div>

      <div class="gov-card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px; color: #333;">办理流程</h3>
        <el-steps direction="vertical" :active="0">
          <el-step 
            v-for="(step, index) in processSteps" 
            :key="index"
            :title="step"
            description=""
          />
        </el-steps>
      </div>

      <div class="action-bar">
        <el-button 
          type="primary" 
          size="large" 
          style="width: 100%;"
          @click="goToApply"
        >
          立即办理
        </el-button>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { serviceApi } from '@/api'
import BottomNav from '@/components/BottomNav.vue'
import { 
  ArrowLeft, OfficeBuilding, Document
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const service = ref(null)

const materials = computed(() => {
  if (!service.value?.materials) return []
  return service.value.materials.split(/[,、，]/).filter(m => m.trim())
})

const processSteps = computed(() => {
  if (!service.value?.process_steps) return []
  return service.value.process_steps.split(/[-->→]/).filter(s => s.trim())
})

onMounted(() => {
  loadServiceDetail()
})

const loadServiceDetail = async () => {
  try {
    const res = await serviceApi.getDetail(route.params.id)
    service.value = res
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
  }
}

const goBack = () => {
  router.back()
}

const goToApply = () => {
  router.push(`/apply/${route.params.id}`)
}
</script>

<style scoped>
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #999;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 14px;
}

.material-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.action-bar {
  position: sticky;
  bottom: 80px;
  padding: 16px 0;
  background: #f5f7fa;
}
</style>
