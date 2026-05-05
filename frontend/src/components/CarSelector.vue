<template>
  <div class="car-selector">
    <div class="steps">
      <div 
        v-for="(step, index) in steps" 
        :key="step"
        class="step-item"
        :class="{ active: currentStepIndex >= index, current: currentStepIndex === index }"
        @click="goToStep(index)"
      >
        {{ step }}
        <div class="step-dot" v-if="currentStepIndex > index"></div>
      </div>
    </div>

    <div class="help-tip" @click="showHelp = true">
      <el-icon><QuestionFilled /></el-icon>
      <span>不知道车型？点我获取帮助</span>
    </div>

    <div class="step-content">
      <!-- 步骤1：选择品牌 -->
      <div v-if="currentStepIndex === 0" class="brand-list">
        <div class="brand-section" v-for="group in groupedBrands" :key="group.initial">
          <div class="brand-initial">{{ group.initial }}</div>
          <div class="brand-items">
            <div 
              v-for="brand in group.brands" 
              :key="brand.id"
              class="brand-item"
              :class="{ selected: selectedBrand?.id === brand.id }"
              @click="selectBrand(brand)"
            >
              <div class="brand-logo">{{ brand.name.charAt(0) }}</div>
              <span class="brand-name">{{ brand.name }}</span>
            </div>
          </div>
        </div>
        
        <div class="letter-index">
          <div 
            v-for="group in groupedBrands" 
            :key="group.initial"
            class="letter-item"
            @click="scrollToInitial(group.initial)"
          >
            {{ group.initial }}
          </div>
        </div>
      </div>

      <!-- 步骤2：选择车系 -->
      <div v-if="currentStepIndex === 1" class="series-list">
        <div class="drawer-header">
          <div class="back-btn" @click="goToStep(0)">
            <el-icon><ArrowLeft /></el-icon>
          </div>
          <div class="current-brand">
            {{ selectedBrand?.name }}
          </div>
          <div style="width: 40px"></div>
        </div>
        
        <div class="series-category" v-if="seriesByType.sedan?.length">
          <div class="category-title">轿车</div>
          <div class="series-items">
            <div 
              v-for="series in seriesByType.sedan" 
              :key="series.id"
              class="series-item"
              :class="{ selected: selectedSeries?.id === series.id }"
              @click="selectSeries(series)"
            >
              <span class="series-name">{{ series.name }}</span>
              <span class="series-price">{{ series.price_range }}</span>
            </div>
          </div>
        </div>
        
        <div class="series-category" v-if="seriesByType.suv?.length">
          <div class="category-title">SUV</div>
          <div class="series-items">
            <div 
              v-for="series in seriesByType.suv" 
              :key="series.id"
              class="series-item"
              :class="{ selected: selectedSeries?.id === series.id }"
              @click="selectSeries(series)"
            >
              <span class="series-name">{{ series.name }}</span>
              <span class="series-price">{{ series.price_range }}</span>
            </div>
          </div>
        </div>
        
        <div class="series-category" v-if="seriesByType.other?.length">
          <div class="category-title">其他</div>
          <div class="series-items">
            <div 
              v-for="series in seriesByType.other" 
              :key="series.id"
              class="series-item"
              :class="{ selected: selectedSeries?.id === series.id }"
              @click="selectSeries(series)"
            >
              <span class="series-name">{{ series.name }}</span>
              <span class="series-price">{{ series.price_range }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤3：选择排量/年份 -->
      <div v-if="currentStepIndex === 2" class="spec-list">
        <div class="drawer-header">
          <div class="back-btn" @click="goToStep(1)">
            <el-icon><ArrowLeft /></el-icon>
          </div>
          <div class="current-series">
            {{ selectedSeries?.name }}
          </div>
          <div style="width: 40px"></div>
        </div>
        
        <div class="spec-year-group" v-for="yearGroup in groupedSpecs" :key="yearGroup.year">
          <div class="year-title">{{ yearGroup.year }}</div>
          <div class="spec-items">
            <div 
              v-for="spec in yearGroup.displacements" 
              :key="`${spec.year}-${spec.displacement}`"
              class="spec-item"
              :class="{ selected: isSpecSelected(spec) }"
              @click="selectSpec(spec)"
            >
              <span class="spec-displacement">{{ spec.displacement }}</span>
              <span class="spec-engine" v-if="spec.engine_model">{{ spec.engine_model }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤4：选择具体车型 -->
      <div v-if="currentStepIndex === 3" class="model-list">
        <div class="drawer-header">
          <div class="back-btn" @click="goToStep(2)">
            <el-icon><ArrowLeft /></el-icon>
          </div>
          <div class="current-spec">
            选择配置
          </div>
          <div style="width: 40px"></div>
        </div>
        
        <div class="model-items">
          <div 
            v-for="model in models" 
            :key="model.id"
            class="model-item"
            :class="{ selected: currentSelectedModel?.id === model.id }"
            @click="selectModel(model)"
          >
            <span class="model-name">{{ model.full_name || model.name }}</span>
            <span class="model-transmission">{{ model.transmission }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="action-bar" v-if="selectedBrand">
      <el-button 
        type="primary" 
        size="large"
        :disabled="!canConfirm"
        @click="confirmSelection"
        class="confirm-btn"
      >
        确认选择
      </el-button>
    </div>

    <!-- 帮助弹窗 -->
    <el-dialog v-model="showHelp" title="车型选择帮助" width="90%" center>
      <div class="help-content">
        <h4>如何找到我的车型？</h4>
        <div class="help-step">
          <span class="help-number">1</span>
          <p><strong>查看行驶证</strong>：行驶证上有完整的车辆型号信息</p>
        </div>
        <div class="help-step">
          <span class="help-number">2</span>
          <p><strong>查看车辆登记证书</strong>：登记证书上有详细的车型配置</p>
        </div>
        <div class="help-step">
          <span class="help-number">3</span>
          <p><strong>查看车门B柱标签</strong>：车门B柱上有车辆信息铭牌</p>
        </div>
        <div class="help-step">
          <span class="help-number">4</span>
          <p><strong>查看保养手册</strong>：保养手册上有车辆型号说明</p>
        </div>
        
        <h4 style="margin-top: 20px;">常见问题</h4>
        <div class="help-faq">
          <p><strong>Q: 排量后面的T和L是什么意思？</strong></p>
          <p>A: T表示涡轮增压，L表示自然吸气或排量升数。</p>
        </div>
        <div class="help-faq">
          <p><strong>Q: 变速箱类型有什么区别？</strong></p>
          <p>A: AT是自动变速箱，CVT是无级变速箱，双离合是DSG/DCT等。</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const props = defineProps({
  selectedModel: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:selectedModel', 'confirm', 'close'])

const steps = ['品牌', '车系', '排量', '配置']
const currentStepIndex = ref(0)
const showHelp = ref(false)

const groupedBrands = ref([])
const seriesByType = ref({ sedan: [], suv: [], other: [] })
const groupedSpecs = ref([])
const models = ref([])

const selectedBrand = ref(null)
const selectedSeries = ref(null)
const selectedSpec = ref(null)
const currentSelectedModel = ref(null)

const canConfirm = computed(() => {
  return currentSelectedModel.value !== null
})

const goToStep = (index) => {
  if (index <= currentStepIndex.value || (index === currentStepIndex.value + 1 && canGoNext())) {
    currentStepIndex.value = index
  }
}

const canGoNext = () => {
  switch (currentStepIndex.value) {
    case 0: return selectedBrand.value !== null
    case 1: return selectedSeries.value !== null
    case 2: return selectedSpec.value !== null
    case 3: return currentSelectedModel.value !== null
    default: return false
  }
}

const selectBrand = (brand) => {
  selectedBrand.value = brand
  loadSeries(brand.id)
  currentStepIndex.value = 1
}

const selectSeries = (series) => {
  selectedSeries.value = series
  loadSpecs(series.id)
  currentStepIndex.value = 2
}

const selectSpec = (spec) => {
  selectedSpec.value = spec
  loadModels(spec)
  currentStepIndex.value = 3
}

const selectModel = (model) => {
  currentSelectedModel.value = model
}

const isSpecSelected = (spec) => {
  return selectedSpec.value && 
         selectedSpec.value.year === spec.year && 
         selectedSpec.value.displacement === spec.displacement
}

const loadBrands = async () => {
  try {
    const res = await request.get('/api/car/brands')
    if (res.code === 200) {
      groupedBrands.value = res.data
    }
  } catch (e) {
    console.error('加载品牌失败:', e)
    ElMessage.error('加载品牌列表失败')
  }
}

const loadSeries = async (brandId) => {
  try {
    const res = await request.get(`/api/car/series/${brandId}`)
    if (res.code === 200) {
      const series = res.data
      seriesByType.value = {
        sedan: series.filter(s => s.type?.includes('轿车')),
        suv: series.filter(s => s.type?.includes('SUV')),
        other: series.filter(s => !s.type?.includes('轿车') && !s.type?.includes('SUV'))
      }
    }
  } catch (e) {
    console.error('加载车系失败:', e)
    ElMessage.error('加载车系列表失败')
  }
}

const loadSpecs = async (seriesId) => {
  try {
    const res = await request.get(`/api/car/specs/${seriesId}`)
    if (res.code === 200) {
      groupedSpecs.value = res.data
    }
  } catch (e) {
    console.error('加载规格失败:', e)
    ElMessage.error('加载车型规格失败')
  }
}

const loadModels = async (spec) => {
  try {
    if (spec.id) {
      const modelRes = await request.get(`/api/car/models/${spec.id}`)
      if (modelRes.code === 200 && modelRes.data && modelRes.data.length > 0) {
        models.value = modelRes.data
        return
      }
    }
    
    models.value = [
      { 
        id: spec.id ? spec.id * 10 + 1 : 1, 
        name: '舒适版', 
        transmission: '双离合',
        fuelType: '汽油'
      },
      { 
        id: spec.id ? spec.id * 10 + 2 : 2, 
        name: '豪华版', 
        transmission: 'AT',
        fuelType: '汽油'
      },
      { 
        id: spec.id ? spec.id * 10 + 3 : 3, 
        name: '旗舰版', 
        transmission: 'CVT',
        fuelType: '汽油'
      }
    ]
  } catch (e) {
    console.error('加载车型失败:', e)
    models.value = [
      { 
        id: 1, 
        name: '舒适版', 
        transmission: '双离合',
        fuelType: '汽油'
      },
      { 
        id: 2, 
        name: '豪华版', 
        transmission: 'AT',
        fuelType: '汽油'
      },
      { 
        id: 3, 
        name: '旗舰版', 
        transmission: 'CVT',
        fuelType: '汽油'
      }
    ]
  }
}

const scrollToInitial = (initial) => {
  const element = document.querySelector(`.brand-initial:contains("${initial}")`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const confirmSelection = () => {
  if (currentSelectedModel.value) {
    emit('update:selectedModel', currentSelectedModel.value)
    emit('confirm', currentSelectedModel.value)
  }
}

onMounted(() => {
  loadBrands()
})
</script>

<style scoped>
.car-selector {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.steps {
  display: flex;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eee;
}

.step-item {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: #999;
  position: relative;
  cursor: pointer;
}

.step-item.active {
  color: #409eff;
}

.step-item.current {
  color: #409eff;
  font-weight: bold;
}

.step-dot {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background-color: #409eff;
  border-radius: 50%;
}

.help-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background-color: #e6f7ff;
  color: #1890ff;
  font-size: 13px;
  cursor: pointer;
}

.help-tip .el-icon {
  margin-right: 6px;
}

.step-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 70px;
}

/* 品牌列表 */
.brand-list {
  padding: 12px;
  position: relative;
}

.brand-section {
  margin-bottom: 12px;
}

.brand-initial {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
  padding: 0 8px;
}

.brand-items {
  display: flex;
  flex-wrap: wrap;
}

.brand-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.brand-item:hover {
  background-color: #f5f7fa;
}

.brand-item.selected {
  background-color: #ecf5ff;
}

.brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 6px;
}

.brand-name {
  font-size: 13px;
  color: #333;
}

.letter-index {
  position: fixed;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  font-size: 11px;
  color: #999;
  z-index: 10;
}

.letter-item {
  padding: 2px 4px;
  cursor: pointer;
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 5;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #f5f7fa;
}

.current-brand,
.current-series,
.current-spec {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

/* 车系列表 */
.series-list {
  height: 100%;
}

.series-category {
  padding: 12px 16px;
}

.category-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.series-items {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.series-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.series-item:last-child {
  border-bottom: none;
}

.series-item:hover {
  background-color: #f9f9f9;
}

.series-item.selected {
  background-color: #ecf5ff;
}

.series-name {
  font-size: 15px;
  color: #333;
}

.series-price {
  font-size: 13px;
  color: #ff6600;
}

/* 规格列表 */
.spec-list {
  height: 100%;
}

.spec-year-group {
  padding: 12px 16px;
}

.year-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.spec-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spec-item {
  padding: 10px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spec-item:hover {
  background-color: #e6f7ff;
}

.spec-item.selected {
  background-color: #409eff;
  color: #fff;
}

.spec-displacement {
  font-size: 15px;
  font-weight: bold;
}

.spec-engine {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}

/* 车型列表 */
.model-list {
  height: 100%;
}

.model-items {
  padding: 12px 16px;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-item:hover {
  background-color: #e6f7ff;
}

.model-item.selected {
  background-color: #409eff;
  color: #fff;
}

.model-name {
  font-size: 15px;
  font-weight: bold;
}

.model-transmission {
  font-size: 13px;
  opacity: 0.7;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 750px;
  margin: 0 auto;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.confirm-btn {
  width: 100%;
  border-radius: 25px;
  height: 48px;
  font-size: 16px;
}

/* 帮助内容 */
.help-content {
  padding: 10px 0;
}

.help-content h4 {
  margin-bottom: 12px;
  color: #333;
}

.help-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.help-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 10px;
  flex-shrink: 0;
}

.help-step p {
  flex: 1;
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.help-faq {
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.help-faq p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

.help-faq p:first-child {
  color: #333;
  margin-bottom: 6px;
}
</style>
