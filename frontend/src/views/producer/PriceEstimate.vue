<template>
  <div class="price-estimate-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon class="title-icon"><DataLine /></el-icon>
        智能估价
      </h2>
      <p class="page-subtitle">AI智能分析市场行情，为您提供精准的废弃物回收估价</p>
    </div>

    <div class="estimate-main">
      <el-card class="form-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Edit /></el-icon>
            <span>估价表单</span>
          </div>
        </template>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="estimate-form"
        >
          <el-form-item label="废弃物分类" prop="category">
            <el-select
              v-model="form.category"
              placeholder="请选择分类"
              style="width: 100%"
              @change="handleCategoryChange"
            >
              <el-option
                v-for="item in categoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="子分类" prop="subCategory">
            <el-select
              v-model="form.subCategory"
              placeholder="请选择子分类"
              style="width: 100%"
            >
              <el-option
                v-for="item in subCategoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="材质" prop="material">
            <el-select
              v-model="form.material"
              placeholder="请选择材质"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="item in materialOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="重量" prop="weight">
            <el-input-number
              v-model="form.weight"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%"
              placeholder="请输入重量"
            />
            <span class="unit-text">吨</span>
          </el-form-item>
          <el-form-item label="所在地区" prop="region">
            <el-cascader
              v-model="form.region"
              :options="regionOptions"
              placeholder="请选择省/市"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              class="estimate-btn"
              :loading="estimateLoading"
              @click="handleEstimate"
            >
              <el-icon><MagicStick /></el-icon>
              开始估价
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="result-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span>估价结果</span>
          </div>
        </template>
        <div v-if="!showResult" class="result-placeholder">
          <el-icon :size="64" class="placeholder-icon"><DataLine /></el-icon>
          <p>请填写左侧表单信息</p>
          <p class="sub-text">点击"开始估价"获取智能估价结果</p>
        </div>
        <div v-else class="result-content">
          <div class="price-range-section">
            <div class="section-label">预估价格范围</div>
            <div class="price-range">
              <span class="price-min">¥{{ estimateResult.minPrice?.toLocaleString() }}</span>
              <span class="price-divider">-</span>
              <span class="price-max">¥{{ estimateResult.maxPrice?.toLocaleString() }}</span>
              <span class="price-unit">/吨</span>
            </div>
            <div class="total-price">
              预估总价：<span class="total-price-value">¥{{ totalPrice.toLocaleString() }}</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">市场参考价</div>
              <div class="info-value">¥{{ estimateResult.marketPrice?.toLocaleString() }}/吨</div>
            </div>
            <div class="info-item">
              <div class="info-label">价格趋势</div>
              <div class="info-value trend" :class="estimateResult.trend">
                <el-icon>
                  <Top v-if="estimateResult.trend === 'up'" />
                  <Bottom v-else-if="estimateResult.trend === 'down'" />
                  <Minus v-else />
                </el-icon>
                {{ trendTextMap[estimateResult.trend] }}
                <span class="trend-rate" v-if="estimateResult.trend !== 'stable'">
                  {{ estimateResult.trendRate }}%
                </span>
              </div>
            </div>
          </div>

          <div class="basis-section">
            <div class="section-label">估价依据</div>
            <div class="basis-list">
              <div class="basis-item" v-for="(item, index) in estimateResult.basis" :key="index">
                <el-icon class="basis-icon"><Select /></el-icon>
                <span>{{ item }}</span>
              </div>
            </div>
          </div>

          <div class="action-section">
            <el-button type="primary" @click="handlePublish">
              <el-icon><Plus /></el-icon>
              一键发布
            </el-button>
            <el-button @click="handleSaveRecord">
              <el-icon><DocumentAdd /></el-icon>
              保存记录
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="history-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><History /></el-icon>
          <span>历史估价记录</span>
        </div>
      </template>
      <el-table :data="historyList" style="width: 100%">
        <el-table-column prop="time" label="估价时间" width="180" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="scope">
            <el-tag size="small" type="success">{{ scope.row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="material" label="材质" width="120" />
        <el-table-column prop="weight" label="重量" width="100">
          <template #default="scope">{{ scope.row.weight }}吨</template>
        </el-table-column>
        <el-table-column label="价格范围" width="200">
          <template #default="scope">
            <span class="price-text">
              ¥{{ scope.row.minPrice?.toLocaleString() }} - ¥{{ scope.row.maxPrice?.toLocaleString() }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="趋势" width="100">
          <template #default="scope">
            <span class="trend-text" :class="scope.row.trend">
              <el-icon>
                <Top v-if="scope.row.trend === 'up'" />
                <Bottom v-else-if="scope.row.trend === 'down'" />
                <Minus v-else />
              </el-icon>
              {{ trendTextMap[scope.row.trend] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleApplyHistory(scope.row)">
              应用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataLine, Edit, TrendCharts, MagicStick, Top, Bottom, Minus,
  Select, Plus, DocumentAdd, History
} from '@element-plus/icons-vue'
import { estimatePrice } from '@/api/price'

const router = useRouter()
const formRef = ref(null)
const estimateLoading = ref(false)
const showResult = ref(false)

const form = reactive({
  category: '',
  subCategory: '',
  material: '',
  weight: null,
  region: []
})

const rules = {
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  material: [
    { required: true, message: '请选择材质', trigger: 'change' }
  ],
  weight: [
    { required: true, message: '请输入重量', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '重量必须大于0', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ]
}

const categoryOptions = [
  { label: '工业边角料', value: 'industrial' },
  { label: '二手设备', value: 'equipment' },
  { label: '废旧家电', value: 'appliance' },
  { label: '生活塑料', value: 'plastic' }
]

const subCategoryMap = {
  industrial: [
    { label: '废纸', value: 'waste_paper' },
    { label: '废塑料', value: 'waste_plastic' },
    { label: '废金属', value: 'waste_metal' },
    { label: '废玻璃', value: 'waste_glass' }
  ],
  equipment: [
    { label: '机械设备', value: 'machinery' },
    { label: '电气设备', value: 'electrical' },
    { label: '生产设备', value: 'production' }
  ],
  appliance: [
    { label: '大家电', value: 'large_appliance' },
    { label: '小家电', value: 'small_appliance' }
  ],
  plastic: [
    { label: 'PET瓶', value: 'pet_bottle' },
    { label: '塑料薄膜', value: 'plastic_film' },
    { label: '塑料容器', value: 'plastic_container' }
  ]
}

const subCategoryOptions = computed(() => {
  return subCategoryMap[form.category] || []
})

const materialOptions = [
  { label: '牛皮纸', value: 'kraft_paper' },
  { label: '瓦楞纸', value: 'corrugated' },
  { label: 'PET塑料', value: 'pet' },
  { label: 'HDPE塑料', value: 'hdpe' },
  { label: '生铁', value: 'cast_iron' },
  { label: '不锈钢', value: 'stainless_steel' },
  { label: '铜', value: 'copper' },
  { label: '铝', value: 'aluminum' },
  { label: '普通玻璃', value: 'glass' },
  { label: '钢化玻璃', value: 'tempered_glass' }
]

const regionOptions = [
  {
    value: 'beijing',
    label: '北京市',
    children: [
      { value: 'beijing-city', label: '北京市' }
    ]
  },
  {
    value: 'shanghai',
    label: '上海市',
    children: [
      { value: 'shanghai-city', label: '上海市' }
    ]
  },
  {
    value: 'guangdong',
    label: '广东省',
    children: [
      { value: 'guangzhou', label: '广州市' },
      { value: 'shenzhen', label: '深圳市' },
      { value: 'dongguan', label: '东莞市' }
    ]
  },
  {
    value: 'jiangsu',
    label: '江苏省',
    children: [
      { value: 'nanjing', label: '南京市' },
      { value: 'suzhou', label: '苏州市' },
      { value: 'wuxi', label: '无锡市' }
    ]
  },
  {
    value: 'zhejiang',
    label: '浙江省',
    children: [
      { value: 'hangzhou', label: '杭州市' },
      { value: 'ningbo', label: '宁波市' }
    ]
  }
]

const trendTextMap = {
  up: '上涨',
  down: '下跌',
  stable: '稳定'
}

const estimateResult = reactive({
  minPrice: 0,
  maxPrice: 0,
  marketPrice: 0,
  trend: 'stable',
  trendRate: 0,
  basis: []
})

const totalPrice = computed(() => {
  const avgPrice = (estimateResult.minPrice + estimateResult.maxPrice) / 2
  return Math.round(avgPrice * (form.weight || 0) * 100) / 100
})

const historyList = ref([
  {
    id: 1,
    time: '2024-06-14 14:30:25',
    category: '工业边角料',
    material: '牛皮纸',
    weight: 5,
    minPrice: 1200,
    maxPrice: 1500,
    trend: 'up',
    trendRate: 5.2
  },
  {
    id: 2,
    time: '2024-06-13 10:15:42',
    category: '废塑料',
    material: 'PET塑料',
    weight: 2.5,
    minPrice: 2800,
    maxPrice: 3200,
    trend: 'down',
    trendRate: 2.1
  },
  {
    id: 3,
    time: '2024-06-12 16:45:10',
    category: '废金属',
    material: '生铁',
    weight: 10,
    minPrice: 1800,
    maxPrice: 2100,
    trend: 'stable',
    trendRate: 0
  }
])

const handleCategoryChange = () => {
  form.subCategory = ''
}

const handleEstimate = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (err) {
    return
  }

  estimateLoading.value = true
  try {
    const res = await estimatePrice({
      category: form.category,
      subCategory: form.subCategory,
      material: form.material,
      weight: form.weight,
      region: form.region?.[0] || ''
    })
    if (res.data) {
      Object.assign(estimateResult, res.data)
    }
  } catch (err) {
    const mockData = {
      minPrice: 1200,
      maxPrice: 1500,
      marketPrice: 1350,
      trend: 'up',
      trendRate: 5.2,
      basis: [
        `材质品质：${form.material || '标准'}等级，影响价格约 ±8%`,
        '市场供需：近期下游需求增加，价格小幅上涨',
        `地区因素：${form.region?.[1] || '本地'}回收价格处于中等水平`,
        '重量规模：5吨以上批量回收，单价上浮3-5%',
        '运输成本：距离回收中心距离适中，成本可控'
      ]
    }
    Object.assign(estimateResult, mockData)
  } finally {
    estimateLoading.value = false
    showResult.value = true
  }
}

const handlePublish = () => {
  router.push({
    path: '/producer/wastes/publish',
    query: {
      category: form.category,
      subCategory: form.subCategory,
      material: form.material,
      weight: form.weight
    }
  })
}

const handleSaveRecord = () => {
  const record = {
    id: Date.now(),
    time: new Date().toLocaleString(),
    category: categoryOptions.find(c => c.value === form.category)?.label || '',
    material: materialOptions.find(m => m.value === form.material)?.label || '',
    weight: form.weight,
    minPrice: estimateResult.minPrice,
    maxPrice: estimateResult.maxPrice,
    trend: estimateResult.trend,
    trendRate: estimateResult.trendRate
  }
  historyList.value.unshift(record)
  ElMessage.success('记录已保存')
}

const handleApplyHistory = (row) => {
  const category = categoryOptions.find(c => c.label === row.category)
  const material = materialOptions.find(m => m.label === row.material)
  if (category) form.category = category.value
  if (material) form.material = material.value
  form.weight = row.weight
  ElMessage.success('已应用历史记录')
}
</script>

<style scoped>
.price-estimate-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  text-align: center;
  padding: 30px 0 10px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #2e7d32;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.title-icon {
  font-size: 28px;
  color: #43a047;
}

.page-subtitle {
  font-size: 14px;
  color: #66bb6a;
  margin: 0;
}

.estimate-main {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-header .el-icon {
  color: #43a047;
}

.form-card,
.result-card,
.history-card {
  border-radius: 12px;
  border: 1px solid #e8f5e9;
}

.form-card :deep(.el-card__header),
.result-card :deep(.el-card__header),
.history-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #e8f5e9;
}

.form-card :deep(.el-card__body),
.result-card :deep(.el-card__body),
.history-card :deep(.el-card__body) {
  padding: 20px;
}

.unit-text {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.estimate-btn {
  width: 100%;
  height: 44px;
  margin-top: 12px;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border: none;
}

.result-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #909399;
}

.placeholder-icon {
  color: #c5e1a5;
  margin-bottom: 16px;
}

.result-placeholder p {
  margin: 4px 0;
  font-size: 14px;
}

.result-placeholder .sub-text {
  font-size: 12px;
  color: #c0c4cc;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.price-range-section {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.price-range-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
}

.section-label {
  font-size: 13px;
  color: #2e7d32;
  margin-bottom: 12px;
  font-weight: 500;
}

.price-range {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.price-min {
  font-size: 36px;
  font-weight: 700;
  color: #2e7d32;
}

.price-divider {
  font-size: 24px;
  color: #66bb6a;
  font-weight: 300;
}

.price-max {
  font-size: 36px;
  font-weight: 700;
  color: #1b5e20;
}

.price-unit {
  font-size: 14px;
  color: #2e7d32;
}

.total-price {
  margin-top: 12px;
  font-size: 14px;
  color: #2e7d32;
}

.total-price-value {
  font-weight: 600;
  font-size: 18px;
  color: #1b5e20;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  text-align: center;
}

.info-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.info-value.trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.info-value.trend.up {
  color: #67c23a;
}

.info-value.trend.down {
  color: #f56c6c;
}

.trend-rate {
  font-size: 13px;
  font-weight: 400;
}

.basis-section {
  padding: 16px;
  background: #f1f8e9;
  border-radius: 8px;
}

.basis-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.basis-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #33691e;
}

.basis-icon {
  color: #66bb6a;
  margin-top: 2px;
  flex-shrink: 0;
}

.action-section {
  display: flex;
  gap: 12px;
}

.action-section .el-button {
  flex: 1;
}

.price-text {
  color: #e6a23c;
  font-weight: 500;
}

.trend-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.trend-text.up {
  color: #67c23a;
}

.trend-text.down {
  color: #f56c6c;
}
</style>
