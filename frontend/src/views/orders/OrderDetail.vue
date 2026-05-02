<template>
  <div class="order-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/orders' }">订单管理</el-breadcrumb-item>
            <el-breadcrumb-item>订单详情</el-breadcrumb-item>
          </el-breadcrumb>
          <div class="header-actions">
            <el-button @click="router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <el-button 
              type="primary" 
              v-if="hasAvailableActions" 
              @click="goToProcess"
            >
              处理订单
            </el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="16">
          <el-descriptions
            :column="2"
            border
            label-style="width: 120px"
          >
            <el-descriptions-item label="订单号">
              <el-tag type="primary">{{ order?.order_no }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="STATUS_COLOR[order?.current_status]" effect="light">
                {{ STATUS_LABEL[order?.current_status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单标题">
              {{ order?.title }}
            </el-descriptions-item>
            <el-descriptions-item label="模型名称">
              {{ order?.model_name }}
            </el-descriptions-item>
            <el-descriptions-item label="模型类型">
              {{ getModelTypeLabel(order?.model_type) }}
            </el-descriptions-item>
            <el-descriptions-item label="负责人">
              {{ order?.responsible_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="成本限额">
              <span v-if="order?.cost_limit !== null && order?.cost_limit !== undefined">
                ¥{{ order.cost_limit.toFixed(2) }}
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="实际金额">
              <span v-if="order?.actual_cost !== null && order?.actual_cost !== undefined">
                ¥{{ order.actual_cost.toFixed(2) }}
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="期望完成时间">
              {{ formatDate(order?.expect_complete_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="是否锁定">
              <el-tag :type="order?.is_locked === 1 ? 'warning' : 'info'">
                {{ order?.is_locked === 1 ? '已锁定' : '未锁定' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(order?.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDate(order?.updated_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ order?.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">状态说明</el-divider>
          
          <el-alert
            :title="order?.stateInfo?.name"
            :description="order?.stateInfo?.description"
            type="info"
            show-icon
            :closable="false"
          >
            <template #default>
              <div v-if="order?.stateInfo">
                <p><strong>负责人角色：</strong>{{ ROLE_LABEL[order.stateInfo.responsibleRole] || '-' }}</p>
                <p><strong>下游影响：</strong>{{ order.stateInfo.downstreamImpact }}</p>
              </div>
            </template>
          </el-alert>

          <el-divider content-position="left">明细信息</el-divider>
          
          <el-table :data="details" stripe v-if="details.length > 0">
            <el-table-column prop="detail_no" label="明细号" width="180" />
            <el-table-column prop="material_name" label="材质名称" width="120" />
            <el-table-column prop="material_url" label="材质URL" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="STATUS_COLOR[row.status] || 'info'" effect="light">
                  {{ STATUS_LABEL[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty description="暂无明细信息" v-else />
        </el-col>

        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <span>可用操作</span>
            </template>
            <div class="action-buttons">
              <el-button
                v-for="action in order?.availableActions || []"
                :key="action"
                :type="ACTION_TYPE[action] || 'primary'"
                block
                @click="goToProcess"
              >
                {{ ACTION_LABEL[action] }}
              </el-button>
              <el-button type="info" disabled block v-if="!order?.availableActions?.length">
                暂无可用操作
              </el-button>
            </div>
          </el-card>

          <el-card shadow="never" style="margin-top: 20px">
            <template #header>
              <span>状态流转历史</span>
            </template>
            <el-timeline v-if="transitions.length > 0">
              <el-timeline-item
                v-for="(item, index) in transitions"
                :key="item.id"
                :type="getTransitionType(item)"
                :timestamp="formatDate(item.created_at)"
                placement="top"
              >
                <el-card shadow="never" class="timeline-card">
                  <h4>{{ item.action }}</h4>
                  <p><strong>从：</strong>{{ STATUS_LABEL[item.from_status] || item.from_status }}</p>
                  <p><strong>到：</strong>{{ STATUS_LABEL[item.to_status] || item.to_status }}</p>
                  <p><strong>操作人：</strong>{{ item.operator_name || '系统' }}</p>
                  <p v-if="item.comment"><strong>备注：</strong>{{ item.comment }}</p>
                  <p v-if="item.reason"><strong>原因：</strong>{{ item.reason }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty description="暂无流转记录" v-else />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { 
  STATUS_LABEL, STATUS_COLOR, STATUS, 
  ROLE_LABEL, ACTION_LABEL, ACTION_TYPE,
  MODEL_TYPES 
} from '@/utils/constants'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const order = ref(null)
const details = ref([])
const transitions = ref([])
const timeline = ref([])

const hasAvailableActions = computed(() => 
  order.value?.availableActions?.length > 0
)

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}

function getModelTypeLabel(type) {
  const item = MODEL_TYPES.find(t => t.value === type)
  return item?.label || type
}

function getTransitionType(item) {
  const action = item.action
  if (action === 'approve') return 'success'
  if (action === 'reject' || action === 'cancel') return 'danger'
  if (action === 'submit_model' || action === 'submit_lead') return 'primary'
  return 'warning'
}

async function fetchOrderDetail() {
  loading.value = true
  try {
    const res = await request.get(`/orders/${route.params.orderId}`)
    order.value = res.data.order
    details.value = res.data.details || []
    transitions.value = res.data.transitions || []
    timeline.value = res.data.timeline || []
  } catch (err) {
    console.error('获取订单详情失败:', err)
  } finally {
    loading.value = false
  }
}

function goToProcess() {
  router.push(`/orders/${route.params.orderId}/process`)
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.order-detail {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-card {
  padding: 12px;
}

.timeline-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.timeline-card p {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}
</style>
