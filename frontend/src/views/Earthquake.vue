<template>
  <div>
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">震情监测</h2>
        <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
          新增地震
        </el-button>
      </div>

      <el-row v-if="data.earthquake" :gutter="16">
        <el-col :span="6">
          <div class="stat-card danger">
            <div class="stat-value magnitude-high">{{ data.earthquake.magnitude }} 级</div>
            <div class="stat-label">震级</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-value">{{ data.earthquake.depth }} km</div>
            <div class="stat-label">震源深度</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card info">
            <div class="stat-value">{{ data.earthquake.affected_radius || '--' }} km</div>
            <div class="stat-label">影响半径</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-value">{{ data.earthquake.intensity_estimate || '--' }}</div>
            <div class="stat-label">预估烈度</div>
          </div>
        </el-col>
      </el-row>

      <div v-if="data.earthquake" class="page-container" style="margin-top: 20px;">
        <h3 class="section-title">基本信息</h3>
        <div class="detail-row">
          <div class="detail-item">
            <span class="detail-label">发生时间：</span>
            <span class="detail-value">{{ formatTime(data.earthquake.occurred_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">震中位置：</span>
            <span class="detail-value">{{ data.earthquake.location }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">经纬度：</span>
            <span class="detail-value">{{ data.earthquake.latitude }}, {{ data.earthquake.longitude }}</span>
          </div>
        </div>
      </div>

      <el-row v-if="data.aftershocks && data.aftershocks.length > 0" :gutter="16">
        <el-col :span="12">
          <div class="page-container">
            <h3 class="section-title">余震记录 (最近{{ data.aftershocks.length }}次)</h3>
            <el-table :data="data.aftershocks" size="small" max-height="300">
              <el-table-column prop="magnitude" label="震级" width="80">
                <template #default="{ row }">
                  <span :class="row.magnitude >= 5 ? 'magnitude-high' : ''">{{ row.magnitude }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="depth" label="深度(km)" width="100" />
              <el-table-column label="位置">
                <template #default="{ row }">
                  {{ row.latitude }}, {{ row.longitude }}
                </template>
              </el-table-column>
              <el-table-column prop="occurred_at" label="发生时间">
                <template #default="{ row }">
                  {{ formatTime(row.occurred_at) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="page-container">
            <h3 class="section-title">重点区域</h3>
            <div v-if="data.keyAreas && data.keyAreas.length > 0" class="card-grid">
              <el-card v-for="area in data.keyAreas" :key="area.id" shadow="hover">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ area.name }}</span>
                    <el-tag :type="getRiskType(area.risk_level)" size="small">
                      {{ area.risk_level || '未评估' }}
                    </el-tag>
                  </div>
                </template>
                <div class="detail-item" style="margin-bottom: 8px;">
                  <span class="detail-label">风险等级：</span>
                  <span :class="`risk-${area.risk_level}`">{{ area.risk_level || '未评估' }}</span>
                </div>
                <div class="detail-item" style="margin-bottom: 8px;">
                  <span class="detail-label">人口：</span>
                  <span class="detail-value">{{ area.population || '--' }} 人</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">说明：</span>
                  <span class="detail-value">{{ area.description || '暂无' }}</span>
                </div>
              </el-card>
            </div>
            <el-empty v-else description="暂无重点区域数据" />
          </div>
        </el-col>
      </el-row>

      <el-empty v-if="!data.earthquake" description="暂无地震数据，请先添加地震记录" />
    </div>

    <el-dialog v-model="showAddDialog" title="新增地震记录" width="600px">
      <el-form :model="eqForm" label-width="100px">
        <el-form-item label="震级" required>
          <el-input-number v-model="eqForm.magnitude" :step="0.1" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="纬度" required>
          <el-input-number v-model="eqForm.latitude" :step="0.0001" :min="-90" :max="90" />
        </el-form-item>
        <el-form-item label="经度" required>
          <el-input-number v-model="eqForm.longitude" :step="0.0001" :min="-180" :max="180" />
        </el-form-item>
        <el-form-item label="深度(km)" required>
          <el-input-number v-model="eqForm.depth" :step="1" :min="0" />
        </el-form-item>
        <el-form-item label="位置" required>
          <el-input v-model="eqForm.location" placeholder="如：四川省阿坝州汶川县" />
        </el-form-item>
        <el-form-item label="发生时间" required>
          <el-date-picker
            v-model="eqForm.occurred_at"
            type="datetime"
            placeholder="选择发生时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;" />
        </el-form-item>
        <el-form-item label="预估烈度">
          <el-input v-model="eqForm.intensity_estimate" placeholder="如：XI度" />
        </el-form-item>
        <el-form-item label="影响半径(km)">
          <el-input-number v-model="eqForm.affected_radius" :step="1" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelAdd">取消</el-button>
        <el-button type="primary" @click="addEarthquake">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { api } from '@/api'

const showAddDialog = ref(false)
const data = reactive({
  earthquake: null,
  aftershocks: [],
  keyAreas: []
})

const eqForm = reactive({
  magnitude: 5.0,
  latitude: 31.0,
  longitude: 103.4,
  depth: 10,
  location: '',
  occurred_at: new Date(),
  intensity_estimate: '',
  affected_radius: 50
})

const resetEqForm = () => {
  eqForm.magnitude = 5.0
  eqForm.latitude = 31.0
  eqForm.longitude = 103.4
  eqForm.depth = 10
  eqForm.location = ''
  eqForm.occurred_at = new Date()
  eqForm.intensity_estimate = ''
  eqForm.affected_radius = 50
}

const formatTime = (t) => {
  if (!t) return '--'
  return new Date(t).toLocaleString('zh-CN')
}

const getRiskType = (level) => {
  const map = { extreme: 'danger', high: 'danger', medium: 'warning', low: 'success' }
  return map[level] || 'info'
}

const loadData = async () => {
  try {
    const res = await api.earthquakes.latest()
    if (res && res.earthquake) {
      Object.assign(data, res)
    }
  } catch (err) {
    console.error('加载震情数据失败:', err)
  }
}

const addEarthquake = async () => {
  if (!eqForm.location || !eqForm.occurred_at) {
    ElMessage.warning('请填写必填项：位置、发生时间')
    return
  }
  try {
    await api.earthquakes.create(eqForm)
    ElMessage.success('地震记录添加成功，震情首页已更新')
    showAddDialog.value = false
    resetEqForm()
    loadData()
  } catch (err) {
    console.error('添加失败:', err)
    ElMessage.error(err.message || '添加失败，请检查输入')
  }
}

const cancelAdd = () => {
  resetEqForm()
  showAddDialog.value = false
}

onMounted(() => {
  loadData()
})
</script>
