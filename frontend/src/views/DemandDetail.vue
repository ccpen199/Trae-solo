<template>
  <div class="demand-detail">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
      <h1>需求详情</h1>
    </div>

    <div v-if="demand" class="detail-content">
      <el-card class="detail-card">
        <div class="card-header">
          <span class="demand-number">{{ demand.demandNumber }}</span>
          <el-tag :type="getStatusType(demand.status)">{{ getStatusText(demand.status) }}</el-tag>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>客户名称</label>
            <span>{{ demand.customerName }}</span>
          </div>
          <div class="info-item">
            <label>联系电话</label>
            <span>{{ demand.contactPhone }}</span>
          </div>
          <div class="info-item">
            <label>户型</label>
            <span>{{ demand.houseType }}</span>
          </div>
          <div class="info-item">
            <label>面积</label>
            <span>{{ demand.area }} ㎡</span>
          </div>
          <div class="info-item">
            <label>风格</label>
            <span>{{ demand.style }}</span>
          </div>
          <div class="info-item">
            <label>预算范围</label>
            <span>{{ demand.budgetRange }}</span>
          </div>
          <div class="info-item full-width">
            <label>地址</label>
            <span>{{ demand.province }} {{ demand.city }} {{ demand.district }} {{ demand.address }}</span>
          </div>
          <div class="info-item full-width">
            <label>描述</label>
            <span>{{ demand.description }}</span>
          </div>
        </div>

        <div v-if="demand.designer" class="designer-section">
          <h3>分配的设计师</h3>
          <div class="designer-info">
            <span>姓名：{{ demand.designer.name }}</span>
            <span>电话：{{ demand.designer.phone }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="action-card">
        <h3>操作</h3>
        <div class="action-buttons">
          <el-button type="primary" @click="createMeasurement" v-if="canCreateMeasurement">创建量尺任务</el-button>
          <el-button type="success" @click="createDesign" v-if="canCreateDesign">创建设计</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { demandApi } from '../api'

const route = useRoute()
const demand = ref<any>(null)

const canCreateMeasurement = computed(() => {
  return demand.value?.status === 'DESIGNER_ASSIGNED'
})

const canCreateDesign = computed(() => {
  return demand.value?.status === 'MEASURED'
})

onMounted(async () => {
  await loadDemand()
})

const loadDemand = async () => {
  try {
    const res = await demandApi.get(route.params.id as string)
    demand.value = res.data.demand
  } catch (error) {
    console.error('加载需求详情失败:', error)
  }
}

const createMeasurement = () => {
  alert('跳转到创建量尺任务页面')
}

const createDesign = () => {
  alert('跳转到创建设计页面')
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'PENDING': 'warning',
    'DESIGNER_ASSIGNED': 'info',
    'MEASUREMENT_SCHEDULED': 'info',
    'MEASURED': 'success',
    'DESIGN_IN_PROGRESS': 'warning',
    'DESIGN_SUBMITTED': 'info',
    'DESIGN_APPROVED': 'success',
    'QUOTED': 'success',
    'ORDER_CREATED': 'success'
  }
  return types[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PENDING': '待处理',
    'DESIGNER_ASSIGNED': '已分配设计师',
    'MEASUREMENT_SCHEDULED': '量尺已安排',
    'MEASURED': '已量尺',
    'DESIGN_IN_PROGRESS': '设计中',
    'DESIGN_SUBMITTED': '设计已提交',
    'DESIGN_APPROVED': '设计已审核',
    'QUOTED': '已报价',
    'ORDER_CREATED': '已下单'
  }
  return texts[status] || status
}
</script>

<style scoped>
.demand-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
}

.detail-content {
  max-width: 800px;
}

.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.demand-number {
  font-size: 18px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-item label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 16px;
  color: #1f2937;
}

.designer-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.designer-section h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.designer-info {
  display: flex;
  gap: 20px;
}

.action-card {
  margin-bottom: 20px;
}

.action-card h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>