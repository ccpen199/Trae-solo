<template>
  <div class="car-select-page">
    <div class="header">
      <div class="back-btn" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </div>
      <h3>选择车型</h3>
      <div class="help-btn" @click="showHelp = true">
        <el-icon :size="18"><QuestionFilled /></el-icon>
      </div>
    </div>

    <div class="steps">
      <div class="step-item" :class="{ active: step >= 1, done: step > 1 }">
        <span class="step-num">{{ step > 1 ? '✓' : '1' }}</span>
        <span class="step-label">品牌</span>
      </div>
      <div class="step-line" :class="{ active: step > 1 }"></div>
      <div class="step-item" :class="{ active: step >= 2, done: step > 2 }">
        <span class="step-num">{{ step > 2 ? '✓' : '2' }}</span>
        <span class="step-label">车系</span>
      </div>
      <div class="step-line" :class="{ active: step > 2 }"></div>
      <div class="step-item" :class="{ active: step >= 3, done: step > 3 }">
        <span class="step-num">{{ step > 3 ? '✓' : '3' }}</span>
        <span class="step-label">年份/排量</span>
      </div>
      <div class="step-line" :class="{ active: step > 3 }"></div>
      <div class="step-item" :class="{ active: step >= 4 }">
        <span class="step-num">4</span>
        <span class="step-label">具体车型</span>
      </div>
    </div>

    <div class="selection-hint" v-if="selectedBrand || selectedSeries || selectedSpec">
      <span class="hint-text" v-if="selectedBrand">
        {{ selectedBrand.name }}
        <el-icon @click="resetToStep(1)" class="remove-icon"><Close /></el-icon>
      </span>
      <span class="arrow" v-if="selectedBrand && selectedSeries">→</span>
      <span class="hint-text" v-if="selectedSeries">
        {{ selectedSeries.name }}
        <el-icon @click="resetToStep(2)" class="remove-icon"><Close /></el-icon>
      </span>
      <span class="arrow" v-if="selectedSeries && selectedSpec">→</span>
      <span class="hint-text" v-if="selectedSpec">
        {{ selectedSpec.year }} {{ selectedSpec.displacement }}
        <el-icon @click="resetToStep(3)" class="remove-icon"><Close /></el-icon>
      </span>
    </div>

    <div class="content">
      <div v-if="step === 1" class="brand-list">
        <div class="brand-groups">
          <div v-for="group in brandGroups" :key="group.initial" class="brand-group">
            <div class="group-title">{{ group.initial }}</div>
            <div class="group-brands">
              <div 
                v-for="brand in group.brands" 
                :key="brand.id"
                class="brand-item"
                @click="selectBrand(brand)"
                :class="{ selected: selectedBrand?.id === brand.id }"
              >
                <div class="brand-logo">
                  <span>{{ brand.name.charAt(0) }}</span>
                </div>
                <span class="brand-name">{{ brand.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="index-bar">
          <span 
            v-for="group in brandGroups" 
            :key="group.initial"
            class="index-item"
          >
            {{ group.initial }}
          </span>
        </div>
      </div>

      <div v-if="step === 2" class="series-list">
        <div class="series-header">
          <span>{{ selectedBrand?.name }}</span>
        </div>
        <div class="series-items">
          <div 
            v-for="series in seriesList" 
            :key="series.id"
            class="series-item"
            @click="selectSeries(series)"
          >
            <div class="series-info">
              <span class="series-name">{{ series.name }}</span>
              <span class="series-meta">{{ series.type }} | {{ series.priceRange }}</span>
            </div>
            <el-icon :size="16" color="#ccc"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <div v-if="step === 3" class="spec-list">
        <div class="year-groups">
          <div v-for="group in specGroups" :key="group.year" class="year-group">
            <div class="year-title">{{ group.year }}</div>
            <div class="spec-items">
              <div 
                v-for="spec in group.displacements" 
                :key="`${spec.year}-${spec.displacement}`"
                class="spec-item"
                @click="selectSpec(spec)"
              >
                <span class="displacement">{{ spec.displacement }}</span>
                <span class="engine" v-if="spec.engineModel">{{ spec.engineModel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="step === 4" class="model-list">
        <div class="model-header">
          <span>请选择具体配置</span>
        </div>
        <div class="model-items">
          <div 
            v-for="model in modelList" 
            :key="model.id"
            class="model-item"
            @click="selectModel(model)"
          >
            <div class="model-info">
              <span class="model-name">{{ model.name }}</span>
              <span class="model-full-name">{{ model.fullName }}</span>
              <div class="model-meta">
                <span>{{ model.transmission }}</span>
                <span>{{ model.fuelType }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="showHelp"
      title="车型帮助"
      width="90%"
      class="help-dialog"
    >
      <div class="help-content">
        <h4>如何确定我的车型？</h4>
        <div class="help-section">
          <p>1. 查看行驶证</p>
          <p class="help-desc">行驶证上的"车辆型号"栏可以查看具体车型信息</p>
        </div>
        <div class="help-section">
          <p>2. 查看车辆铭牌</p>
          <p class="help-desc">车辆铭牌通常位于驾驶位B柱下方，包含车辆型号、排量、生产日期等信息</p>
        </div>
        <div class="help-section">
          <p>3. 查看购车发票/合格证</p>
          <p class="help-desc">购车发票和车辆合格证上都有详细的车辆型号信息</p>
        </div>
        <div class="help-section">
          <p>4. 联系客服</p>
          <p class="help-desc">如仍有疑问，可拨打客服热线：400-111-8866</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const step = ref(1)
const brandGroups = ref([])
const seriesList = ref([])
const specGroups = ref([])
const modelList = ref([])

const selectedBrand = ref(null)
const selectedSeries = ref(null)
const selectedSpec = ref(null)
const showHelp = ref(false)

const goBack = () => {
  router.back()
}

const resetToStep = (targetStep) => {
  if (targetStep === 1) {
    selectedBrand.value = null
    selectedSeries.value = null
    selectedSpec.value = null
  } else if (targetStep === 2) {
    selectedSeries.value = null
    selectedSpec.value = null
  } else if (targetStep === 3) {
    selectedSpec.value = null
  }
  step.value = targetStep
}

const selectBrand = (brand) => {
  selectedBrand.value = brand
  step.value = 2
  loadSeries(brand.id)
}

const selectSeries = (series) => {
  selectedSeries.value = series
  step.value = 3
  loadSpecs(series.id)
}

const selectSpec = (spec) => {
  selectedSpec.value = spec
  step.value = 4
  loadModels(spec.id)
}

const selectModel = async (model) => {
  if (userStore.isLoggedIn) {
    try {
      await request.post('/api/user-cars', {
        carModelId: model.id,
        isDefault: true
      })
      ElMessage.success('车型已保存')
    } catch (e) {
      console.log('保存车型失败', e)
    }
  }
  router.back()
}

const loadBrands = async () => {
  try {
    const res = await request.get('/api/car/brands')
    if (res.code === 200) {
      brandGroups.value = res.data
    }
  } catch (e) {
    brandGroups.value = [
      {
        initial: 'A',
        brands: [
          { id: 6, name: '奥迪', initial: 'A', logo: '', sort_order: 6 }
        ]
      },
      {
        initial: 'B',
        brands: [
          { id: 3, name: '本田', initial: 'B', logo: '', sort_order: 3 },
          { id: 5, name: '别克', initial: 'B', logo: '', sort_order: 5 },
          { id: 7, name: '宝马', initial: 'B', logo: '', sort_order: 7 },
          { id: 8, name: '奔驰', initial: 'B', logo: '', sort_order: 8 }
        ]
      },
      {
        initial: 'C',
        brands: [
          { id: 13, name: '长城', initial: 'C', logo: '', sort_order: 13 },
          { id: 15, name: '长安', initial: 'C', logo: '', sort_order: 15 }
        ]
      },
      {
        initial: 'D',
        brands: [
          { id: 1, name: '大众', initial: 'D', logo: '', sort_order: 1 }
        ]
      },
      {
        initial: 'F',
        brands: [
          { id: 2, name: '丰田', initial: 'F', logo: '', sort_order: 2 },
          { id: 11, name: '福特', initial: 'F', logo: '', sort_order: 11 }
        ]
      },
      {
        initial: 'J',
        brands: [
          { id: 14, name: '吉利', initial: 'J', logo: '', sort_order: 14 }
        ]
      },
      {
        initial: 'Q',
        brands: [
          { id: 10, name: '起亚', initial: 'Q', logo: '', sort_order: 10 }
        ]
      },
      {
        initial: 'R',
        brands: [
          { id: 4, name: '日产', initial: 'R', logo: '', sort_order: 4 }
        ]
      },
      {
        initial: 'X',
        brands: [
          { id: 9, name: '现代', initial: 'X', logo: '', sort_order: 9 },
          { id: 12, name: '雪佛兰', initial: 'X', logo: '', sort_order: 12 }
        ]
      }
    ]
  }
}

const loadSeries = async (brandId) => {
  try {
    const res = await request.get(`/api/car/series/${brandId}`)
    if (res.code === 200) {
      seriesList.value = res.data
    }
  } catch (e) {
    if (brandId === 1) {
      seriesList.value = [
        { id: 1, name: '朗逸', type: '紧凑型车', priceRange: '9.99-15.89万' },
        { id: 2, name: '速腾', type: '紧凑型车', priceRange: '11.49-16.99万' },
        { id: 3, name: '迈腾', type: '中型车', priceRange: '18.69-25.39万' },
        { id: 4, name: '帕萨特', type: '中型车', priceRange: '17.99-25.09万' },
        { id: 5, name: '途观L', type: '中型SUV', priceRange: '19.87-26.08万' }
      ]
    } else if (brandId === 2) {
      seriesList.value = [
        { id: 6, name: '卡罗拉', type: '紧凑型车', priceRange: '10.98-15.98万' },
        { id: 7, name: '凯美瑞', type: '中型车', priceRange: '17.98-26.98万' },
        { id: 8, name: '雷凌', type: '紧凑型车', priceRange: '10.78-15.28万' }
      ]
    } else {
      seriesList.value = [
        { id: 9, name: '思域', type: '紧凑型车', priceRange: '12.99-18.79万' },
        { id: 10, name: '雅阁', type: '中型车', priceRange: '16.98-25.88万' }
      ]
    }
  }
}

const loadSpecs = async (seriesId) => {
  try {
    const res = await request.get(`/api/car/specs/${seriesId}`)
    if (res.code === 200) {
      specGroups.value = res.data
    }
  } catch (e) {
    specGroups.value = [
      {
        year: '2024款',
        displacements: [
          { displacement: '1.4T', year: '2024款', engineModel: 'EA211' },
          { displacement: '1.5L', year: '2024款', engineModel: 'EA211' },
          { displacement: '2.0T', year: '2024款', engineModel: 'EA888' }
        ]
      },
      {
        year: '2023款',
        displacements: [
          { displacement: '1.4T', year: '2023款', engineModel: 'EA211' },
          { displacement: '1.5L', year: '2023款', engineModel: 'EA211' }
        ]
      }
    ]
  }
}

const loadModels = async (specId) => {
  try {
    const res = await request.get(`/api/car/models/${specId}`)
    if (res.code === 200) {
      modelList.value = res.data
    }
  } catch (e) {
    modelList.value = [
      { 
        id: 1, 
        name: '舒适版', 
        fullName: '2024款 1.4T 舒适版',
        transmission: '双离合',
        fuelType: '汽油'
      },
      { 
        id: 2, 
        name: '豪华版', 
        fullName: '2024款 1.4T 豪华版',
        transmission: 'AT',
        fuelType: '汽油'
      },
      { 
        id: 3, 
        name: '旗舰版', 
        fullName: '2024款 1.4T 旗舰版',
        transmission: 'CVT',
        fuelType: '汽油'
      }
    ]
  }
}

onMounted(() => {
  loadBrands()
})
</script>

<style scoped>
.car-select-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .help-btn {
  color: #fff;
  cursor: pointer;
}

.header h3 {
  flex: 1;
  text-align: center;
  color: #fff;
  font-size: 17px;
  font-weight: 500;
  margin: 0;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #fff;
  gap: 8px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e8e8e8;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
}

.step-item.active .step-num,
.step-item.done .step-num {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.step-label {
  font-size: 11px;
  color: #999;
}

.step-item.active .step-label {
  color: #667eea;
}

.step-line {
  width: 24px;
  height: 2px;
  background: #e8e8e8;
  margin-bottom: 16px;
}

.step-line.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.selection-hint {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  margin-top: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.hint-text {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: #f0f2ff;
  border-radius: 4px;
  font-size: 13px;
  color: #667eea;
  gap: 4px;
}

.remove-icon {
  cursor: pointer;
  font-size: 12px;
}

.arrow {
  color: #999;
  font-size: 12px;
}

.content {
  background: #fff;
  margin-top: 8px;
  min-height: calc(100vh - 200px);
}

.brand-list {
  position: relative;
  padding-right: 24px;
}

.brand-groups {
  padding: 0 16px;
}

.brand-group {
  margin-bottom: 8px;
}

.group-title {
  position: sticky;
  top: 0;
  background: #f5f7fa;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #667eea;
  margin: 0 -16px 8px;
}

.group-brands {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.brand-item {
  width: calc(33.33% - 8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.brand-item:hover {
  background: #f5f7fa;
}

.brand-item.selected {
  background: #f0f2ff;
  border: 1px solid #667eea;
}

.brand-logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 6px;
}

.brand-name {
  font-size: 12px;
  color: #333;
}

.index-bar {
  position: fixed;
  right: 8px;
  top: 200px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.index-item {
  width: 20px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #667eea;
  cursor: pointer;
}

.series-list, .model-list {
  padding: 0 16px;
}

.series-header, .model-header {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #666;
}

.series-items, .model-items {
  display: flex;
  flex-direction: column;
}

.series-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.series-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.series-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.series-meta {
  font-size: 12px;
  color: #999;
}

.model-item {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.model-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.model-full-name {
  font-size: 12px;
  color: #666;
  margin: 4px 0 6px;
}

.model-meta {
  display: flex;
  gap: 12px;
}

.model-meta span {
  font-size: 11px;
  color: #999;
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 4px;
}

.spec-list {
  padding: 0 16px;
}

.year-groups {
  display: flex;
  flex-direction: column;
}

.year-group {
  margin-bottom: 16px;
}

.year-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.spec-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 0;
}

.spec-item {
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.2s;
}

.spec-item:hover {
  background: #f0f2ff;
}

.displacement {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.engine {
  font-size: 11px;
  color: #999;
}

.help-content h4 {
  font-size: 15px;
  color: #333;
  margin: 0 0 16px;
}

.help-section {
  margin-bottom: 16px;
}

.help-section p {
  margin: 0;
}

.help-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-top: 4px !important;
  padding-left: 16px;
}
</style>
