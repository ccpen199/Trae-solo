<template>
  <div class="result-container">
    <el-card shadow="hover" class="result-card">
      <template #header>
        <div class="card-header">
          <h2>溯源结果</h2>
          <el-button type="primary" @click="goBack">返回查询</el-button>
        </div>
      </template>
      
      <div v-if="loading" class="loading">
        <el-spinner size="large" />
        <p>正在查询溯源信息...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <el-icon :size="48"><Warning /></el-icon>
        <p>{{ error }}</p>
        <el-button type="primary" @click="loadTraceData">重新查询</el-button>
      </div>
      
      <div v-else class="trace-result">
        <!-- 批次基本信息 -->
        <el-card shadow="hover" class="info-card">
          <template #header>
            <h3>产品信息</h3>
          </template>
          <el-descriptions :column="2">
            <el-descriptions-item label="批次号">{{ traceData.batch_info.batch_code }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ traceData.batch_info.product_name }}</el-descriptions-item>
            <el-descriptions-item label="农场名称">{{ traceData.batch_info.farm_name }}</el-descriptions-item>
            <el-descriptions-item label="农场位置">{{ traceData.batch_info.farm_location }}</el-descriptions-item>
            <el-descriptions-item label="种植日期">{{ traceData.batch_info.planting_date }}</el-descriptions-item>
            <el-descriptions-item label="采收日期">{{ traceData.batch_info.harvest_date }}</el-descriptions-item>
            <el-descriptions-item label="质量状态">{{ traceData.batch_info.status }}</el-descriptions-item>
            <el-descriptions-item label="查询时间">{{ traceData.query_time }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        
        <!-- 农事记录 -->
        <el-card shadow="hover" class="info-card">
          <template #header>
            <h3>农事记录</h3>
          </template>
          <el-table :data="traceData.farming_info.operations" style="width: 100%">
            <el-table-column prop="type" label="操作类型" />
            <el-table-column prop="name" label="操作名称" />
            <el-table-column prop="time" label="操作时间" width="180" />
            <el-table-column prop="operator" label="操作人" />
          </el-table>
        </el-card>
        
        <!-- 质检信息 -->
        <el-card shadow="hover" class="info-card">
          <template #header>
            <h3>质量检测</h3>
          </template>
          <div class="quality-info">
            <div class="quality-result" :class="{ 'passed': traceData.quality_info.passed, 'failed': !traceData.quality_info.passed }">
              <el-icon :size="32">{{ traceData.quality_info.passed ? 'Check' : 'Close' }}</el-icon>
              <span>{{ traceData.quality_info.passed ? '检测合格' : '检测不合格' }}</span>
            </div>
            <div class="quality-details">
              <h4>农残检测</h4>
              <el-tag v-for="(value, key) in traceData.quality_info.pesticide_results" :key="key" :type="value <= traceData.quality_info.thresholds[key] ? 'success' : 'danger'">
                {{ key }}: {{ value }}mg/kg
              </el-tag>
              <h4 style="margin-top: 15px;">重金属检测</h4>
              <el-tag v-for="(value, key) in traceData.quality_info.heavy_metal_results" :key="key" :type="value <= traceData.quality_info.heavy_metal_thresholds[key] ? 'success' : 'danger'">
                {{ key }}: {{ value }}mg/kg
              </el-tag>
            </div>
          </div>
        </el-card>
        
        <!-- 流通轨迹 -->
        <el-card shadow="hover" class="info-card">
          <template #header>
            <h3>流通轨迹</h3>
          </template>
          <div class="flow-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in traceData.flow_info.path"
                :key="index"
                :timestamp="item.time"
                :type="index === 0 ? 'primary' : index === traceData.flow_info.path.length - 1 ? 'success' : 'info'"
              >
                <div class="timeline-content">
                  <h4>{{ item.from.name }} → {{ item.to.name }}</h4>
                  <p>操作：{{ item.operation }}</p>
                  <p>数量：{{ item.quantity }} {{ item.unit }}</p>
                  <p v-if="item.temperature">温度：{{ item.temperature }}°C</p>
                  <p v-if="item.humidity">湿度：{{ item.humidity }}%</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
        
        <!-- 全景地图 -->
        <el-card shadow="hover" class="info-card">
          <template #header>
            <h3>全景地图</h3>
          </template>
          <div class="map-container">
            <div class="map-placeholder">
              <el-icon :size="64"><MapLocation /></el-icon>
              <p>地图加载中...</p>
              <p>显示产品从产地到消费的完整路径</p>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Check, Close, Warning, MapLocation } from '@element-plus/icons-vue'
import { consumerApi } from '../../services/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const traceData = ref({
  batch_info: {
    batch_code: '',
    product_name: '',
    farm_name: '',
    farm_location: '',
    planting_date: '',
    harvest_date: '',
    status: ''
  },
  farming_info: {
    operations: []
  },
  quality_info: {
    passed: true,
    pesticide_results: {},
    heavy_metal_results: {},
    thresholds: {},
    heavy_metal_thresholds: {}
  },
  flow_info: {
    path: []
  },
  query_time: ''
})

onMounted(async () => {
  await loadTraceData()
})

const loadTraceData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const batchCode = route.params.batchCode
    // 模拟数据
    traceData.value = {
      batch_info: {
        batch_code: batchCode,
        product_name: '西红柿',
        farm_name: '阳光农场',
        farm_location: '山东省青岛市平度市',
        planting_date: '2026-03-01',
        harvest_date: '2026-04-20',
        status: '质检合格'
      },
      farming_info: {
        operations: [
          { type: '种植', name: '播种', time: '2026-03-01', operator: '张三' },
          { type: '灌溉', name: '春季灌溉', time: '2026-03-15', operator: '李四' },
          { type: '施肥', name: '有机肥施肥', time: '2026-03-25', operator: '王五' },
          { type: '采收', name: '成熟采收', time: '2026-04-20', operator: '赵六' }
        ]
      },
      quality_info: {
        passed: true,
        pesticide_results: {
          '甲胺磷': 0.01,
          '克百威': 0.005,
          '毒死蜱': 0.1
        },
        heavy_metal_results: {
          '铅': 0.1,
          '镉': 0.02,
          '砷': 0.2
        },
        thresholds: {
          '甲胺磷': 0.05,
          '克百威': 0.02,
          '毒死蜱': 0.5
        },
        heavy_metal_thresholds: {
          '铅': 0.3,
          '镉': 0.05,
          '砷': 0.5
        }
      },
      flow_info: {
        path: [
          {
            from: { name: '阳光农场' },
            to: { name: '一级仓库' },
            operation: '运输',
            time: '2026-04-20 14:00',
            quantity: 5000,
            unit: 'kg',
            temperature: 10,
            humidity: 60
          },
          {
            from: { name: '一级仓库' },
            to: { name: '配送中心' },
            operation: '转运',
            time: '2026-04-21 08:00',
            quantity: 5000,
            unit: 'kg',
            temperature: 8,
            humidity: 55
          },
          {
            from: { name: '配送中心' },
            to: { name: '零售门店' },
            operation: '配送',
            time: '2026-04-21 10:00',
            quantity: 1000,
            unit: 'kg',
            temperature: 6,
            humidity: 50
          }
        ]
      },
      query_time: new Date().toLocaleString()
    }
  } catch (err) {
    error.value = '查询失败，请稍后重试'
    console.error('查询溯源信息失败:', err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/consumer/trace')
}
</script>

<style scoped>
.result-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.result-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 60px 0;
}

.loading p {
  margin-top: 20px;
  color: #606266;
}

.error {
  text-align: center;
  padding: 60px 0;
  color: #f56c6c;
}

.error p {
  margin: 20px 0;
  font-size: 16px;
}

.trace-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  border-radius: 8px;
}

.info-card h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: bold;
}

.quality-result {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
}

.quality-result.passed {
  background-color: #f0f9eb;
  color: #67c23a;
}

.quality-result.failed {
  background-color: #fef0f0;
  color: #f56c6c;
}

.quality-details {
  margin-top: 20px;
}

.quality-details h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}

.quality-details .el-tag {
  margin-right: 10px;
  margin-bottom: 10px;
}

.flow-timeline {
  margin-top: 10px;
}

.timeline-content h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #303133;
}

.timeline-content p {
  margin: 3px 0;
  font-size: 12px;
  color: #606266;
}

.map-container {
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f2f5;
}

.map-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;
}

.map-placeholder p {
  margin: 10px 0;
}
</style>
