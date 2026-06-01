<template>
  <div class="node-tracking">
    <div class="page-header">
      <h1 class="page-title">节点追踪</h1>
      <p class="page-subtitle">记录行李在各节点的状态</p>
    </div>

    <div class="card">
      <el-form :inline="true" :model="form" class="mb-4">
        <el-form-item label="行李牌" required>
          <el-input 
            v-model="form.baggage_tag" 
            placeholder="请输入行李牌" 
            clearable 
            @keyup.enter="loadBaggage"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadBaggage" :loading="loadingBaggage">查询行李</el-button>
        </el-form-item>
      </el-form>

      <div v-if="baggage" class="baggage-card mb-4">
        <div class="flex justify-between items-center">
          <div>
            <span class="baggage-tag">{{ baggage.baggage_tag }}</span>
            <span class="ml-4">{{ baggage.passenger_name }} · {{ baggage.flight_no }}</span>
          </div>
          <el-tag :type="getStatusType(baggage.status)">{{ getStatusText(baggage.status) }}</el-tag>
        </div>
      </div>

      <div v-if="baggage">
        <el-form :model="form" label-width="100px" @submit.prevent="submitNode">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="节点类型" required>
                <el-select v-model="form.node_type" placeholder="请选择节点" style="width: 100%;">
                  <el-option
                    v-for="node in availableNodes"
                    :key="node.type"
                    :label="node.name"
                    :value="node.type"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="节点时间" required>
                <el-date-picker
                  v-model="form.node_time"
                  type="datetime"
                  placeholder="选择时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="位置">
                <el-input v-model="form.location" placeholder="例如：T2航站楼、3号转盘" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="操作员">
                <el-input v-model="form.operator" placeholder="操作员姓名或工号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选备注信息" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" @click="submitNode" :loading="submitting">
              记录节点
            </el-button>
            <el-button size="large" @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="baggage && nodes.length > 0" class="mt-6">
        <h3 class="text-lg font-semibold mb-4">已记录节点</h3>
        <div class="timeline">
          <div 
            v-for="node in expectedNodes" 
            :key="node.type"
            :class="['timeline-node', getNodeStatusClass(node.type)]"
          >
            <div class="node-title">{{ node.name }}</div>
            <template v-if="getNodeByType(node.type)">
              <div class="node-time">{{ formatTime(getNodeByType(node.type).node_time) }}</div>
              <div v-if="getNodeByType(node.type).location" class="node-location">
                位置：{{ getNodeByType(node.type).location }}
              </div>
              <div v-if="getNodeByType(node.type).operator" class="node-location">
                操作员：{{ getNodeByType(node.type).operator }}
              </div>
            </template>
            <template v-else>
              <div class="node-time text-gray-400">待处理</div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="!baggage && !loadingBaggage" class="empty-state" style="padding: 60px 20px;">
        <el-icon class="empty-icon"><Search /></el-icon>
        <div class="empty-text">请输入行李牌查询并记录节点</div>
      </div>
    </div>

    <div class="card">
      <h3 class="text-lg font-semibold mb-4 flex items-center justify-between">
        <span>节点缺失告警</span>
        <el-button size="small" @click="loadAlerts">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </h3>
      <div v-if="alerts?.alerts?.length > 0" class="alert-list">
        <el-table :data="alerts.alerts.slice(0, 20)" size="small" v-loading="loadingAlerts">
          <el-table-column prop="baggage_tag" label="行李牌" width="140">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="form.baggage_tag = row.baggage_tag; loadBaggage();">
                {{ row.baggage_tag }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="passenger_name" label="旅客" width="100" />
          <el-table-column prop="flight_no" label="航班" width="100" />
          <el-table-column label="航线" min-width="140">
            <template #default="{ row }">
              {{ row.departure }} → {{ row.destination }}
            </template>
          </el-table-column>
          <el-table-column label="缺失节点" min-width="200">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-1">
                <el-tag 
                  v-for="n in row.missing_nodes" 
                  :key="n" 
                  type="danger" 
                  size="small"
                >
                  {{ getNodeName(n) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="告警级别" width="100">
            <template #default="{ row }">
              <el-tag :type="row.alert_type === 'critical' ? 'danger' : 'warning'" size="small">
                {{ row.alert_type === 'critical' ? '严重' : '警告' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="empty-state" style="padding: 40px 20px;">
        <div class="empty-text">暂无节点缺失告警</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { baggageApi, nodeApi } from '../api'

const route = useRoute()

const loadingBaggage = ref(false)
const loadingAlerts = ref(false)
const submitting = ref(false)
const baggage = ref(null)
const nodes = ref([])
const alerts = ref(null)

const expectedNodes = [
  { type: 'check_in', name: '托运' },
  { type: 'security', name: '安检' },
  { type: 'loading', name: '装机' },
  { type: 'transfer', name: '中转' },
  { type: 'unloading', name: '卸机' },
  { type: 'carousel', name: '转盘' },
  { type: 'pickup', name: '领取' }
]

const form = reactive({
  baggage_tag: '',
  node_type: '',
  node_time: '',
  location: '',
  operator: '',
  remark: ''
})

const availableNodes = computed(() => {
  if (!baggage.value) return []
  const existingTypes = nodes.value.map(n => n.node_type)
  return expectedNodes.filter(n => !existingTypes.includes(n.type))
})

async function loadBaggage() {
  if (!form.baggage_tag.trim()) {
    ElMessage.warning('请输入行李牌')
    return
  }

  loadingBaggage.value = true
  baggage.value = null
  nodes.value = []

  try {
    const data = await baggageApi.getByTag(form.baggage_tag.trim().toUpperCase())
    baggage.value = data.baggage
    nodes.value = data.nodes
    form.node_type = ''
  } catch (err) {
    if (err.response?.status === 404) {
      ElMessage.error('未找到该行李牌的记录')
    } else {
      ElMessage.error('查询失败')
    }
    console.error(err)
  } finally {
    loadingBaggage.value = false
  }
}

async function loadAlerts() {
  loadingAlerts.value = true
  try {
    alerts.value = await nodeApi.getAlerts(24)
  } catch (err) {
    console.error(err)
  } finally {
    loadingAlerts.value = false
  }
}

function getNodeByType(type) {
  return nodes.value.find(n => n.node_type === type)
}

function getNodeStatusClass(type) {
  const node = getNodeByType(type)
  if (node) return 'completed'
  const existingTypes = nodes.value.map(n => n.node_type)
  const currentIndex = expectedNodes.findIndex(n => n.type === type)
  const hasLater = expectedNodes.slice(currentIndex + 1).some(n => existingTypes.includes(n.type))
  if (hasLater) return 'missing'
  return 'pending'
}

function getNodeName(type) {
  const node = expectedNodes.find(n => n.type === type)
  return node?.name || type
}

async function submitNode() {
  if (!form.baggage_tag || !form.node_type || !form.node_time) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submitting.value = true
  try {
    await nodeApi.create({
      baggage_tag: form.baggage_tag.trim().toUpperCase(),
      node_type: form.node_type,
      node_time: form.node_time,
      location: form.location,
      operator: form.operator,
      remark: form.remark
    })
    ElMessage.success('节点记录成功')
    loadBaggage()
  } catch (err) {
    if (err.response?.status === 409) {
      ElMessage.error('该节点已存在')
    } else if (err.response?.status === 404) {
      ElMessage.error('未找到该行李')
    } else {
      ElMessage.error('记录失败')
    }
    console.error(err)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.node_type = ''
  form.location = ''
  form.operator = ''
  form.remark = ''
  form.node_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function getStatusType(status) {
  const map = {
    in_transit: 'primary',
    arrived: 'success',
    picked_up: 'success',
    exception: 'danger',
    lost: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    in_transit: '运输中',
    arrived: '已到达',
    picked_up: '已领取',
    exception: '异常',
    lost: '遗失'
  }
  return map[status] || status
}

function formatTime(time) {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

onMounted(() => {
  loadAlerts()
  form.node_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
  
  if (route.query.tag) {
    form.baggage_tag = route.query.tag
    loadBaggage()
  }
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.mt-6 {
  margin-top: 24px;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.flex-wrap {
  flex-wrap: wrap;
}

.gap-1 {
  gap: 4px;
}

.ml-4 {
  margin-left: 16px;
}

.text-lg {
  font-size: 18px;
}

.text-gray-400 {
  color: #c0c4cc;
}

.font-semibold {
  font-weight: 600;
}
</style>
