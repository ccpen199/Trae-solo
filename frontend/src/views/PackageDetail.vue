<template>
  <div class="package-detail-page">
    <div class="container">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/packages' }">套餐列表</el-breadcrumb-item>
        <el-breadcrumb-item>{{ packageInfo?.name || '套餐详情' }}</el-breadcrumb-item>
      </el-breadcrumb>
      
      <div class="detail-content" v-loading="loading">
        <el-empty v-if="!packageInfo && !loading" description="套餐不存在" />
        
        <template v-if="packageInfo">
          <div class="detail-header">
            <div class="detail-image">
              <el-image
                :src="packageInfo.coverImage || 'https://picsum.photos/600/400?random=' + packageInfo.id"
                fit="cover"
                :preview-src-list="[packageInfo.coverImage || 'https://picsum.photos/600/400?random=' + packageInfo.id]"
              />
              <div class="package-badge" v-if="packageInfo.category">
                {{ packageInfo.category }}
              </div>
            </div>
            
            <div class="detail-info">
              <h1 class="package-name">{{ packageInfo.name }}</h1>
              
              <div class="package-features" v-if="packageInfo.features && packageInfo.features.length">
                <el-tag 
                  v-for="(feature, index) in packageInfo.features" 
                  :key="index"
                  class="feature-tag"
                >
                  {{ feature }}
                </el-tag>
              </div>
              
              <div class="price-section">
                <div class="base-price">
                  <span class="label">基础价格：</span>
                  <span class="price">
                    <span class="currency">¥</span>
                    <span class="amount">{{ packageInfo.basePrice }}</span>
                    <span class="unit">/㎡</span>
                  </span>
                </div>
                
                <div class="selected-price" v-if="selectedAttributes.length > 0">
                  <span class="label">当前选择：</span>
                  <span class="price">
                    <span class="currency">¥</span>
                    <span class="amount">{{ currentPrice }}</span>
                    <span class="unit">/㎡</span>
                  </span>
                  <span class="price-diff" :class="priceDiffClass">
                    ({{ priceDiff >= 0 ? '+' : '' }}{{ priceDiff }} 元/㎡)
                  </span>
                </div>
                
                <div class="total-estimate" v-if="userHouseArea">
                  <span class="label">预估总价：</span>
                  <span class="price">
                    <span class="currency">¥</span>
                    <span class="amount">{{ estimatedTotal }}</span>
                  </span>
                  <span class="note">({{ userHouseArea }}㎡ × {{ currentPrice }}元/㎡)</span>
                </div>
              </div>
              
              <div class="attributes-section" v-if="attributes.length > 0">
                <h3>套餐属性</h3>
                <div class="attribute-group" v-for="attr in attributes" :key="attr.id">
                  <div class="attribute-label">
                    {{ attr.name }}
                    <span class="required" v-if="attr.required">*</span>
                  </div>
                  <el-radio-group 
                    v-model="selectedAttrs[attr.id]" 
                    @change="handleAttrChange"
                    class="attribute-values"
                  >
                    <el-radio-button 
                      v-for="value in attr.values" 
                      :key="value.id" 
                      :label="String(value.id)"
                      :disabled="!value.isAvailable"
                    >
                      <span class="value-name">{{ value.value }}</span>
                      <span class="value-price" v-if="value.priceAdjustment !== 0">
                        {{ value.priceAdjustment > 0 ? '+' : '' }}{{ value.priceAdjustment }}元
                      </span>
                    </el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              
              <div class="house-area-section">
                <h3>房屋面积</h3>
                <el-input-number 
                  v-model="userHouseArea" 
                  :min="0"
                  :precision="2"
                  :step="1"
                  placeholder="请输入房屋面积"
                  size="large"
                  style="width: 200px"
                >
                  <template #suffix>㎡</template>
                </el-input-number>
                <span class="area-tip" v-if="userHouseArea">预估总价：¥{{ estimatedTotal }}</span>
              </div>
              
              <div class="action-section">
                <el-button 
                  type="primary" 
                  size="large"
                  :loading="addingCart"
                  @click="handleAddToCart"
                >
                  <el-icon><ShoppingCart /></el-icon>
                  加入购物车
                </el-button>
                <el-button 
                  size="large"
                  @click="handleAddFavorite"
                >
                  <el-icon><Star /></el-icon>
                  收藏
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="detail-tabs">
            <el-tabs v-model="activeTab" type="border-card">
              <el-tab-pane label="套餐详情" name="detail">
                <div class="tab-content">
                  <p>{{ packageInfo.description || '暂无详细描述' }}</p>
                  
                  <div class="detail-specs" v-if="packageInfo.specs">
                    <h4>套餐规格</h4>
                    <el-descriptions :column="2" border>
                      <el-descriptions-item 
                        v-for="(value, key) in packageInfo.specs" 
                        :key="key"
                        :label="key"
                      >
                        {{ value }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="用户评论" name="comments">
                <comments-section :package-id="Number(route.params.id)" />
              </el-tab-pane>
            </el-tabs>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { packageApi } from '@/api/package'
import { useCartStore } from '@/store/cart'
import { useUserStore } from '@/store/user'
import CommentsSection from '@/components/CommentsSection.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const loading = ref(false)
const addingCart = ref(false)
const packageInfo = ref(null)
const attributes = ref([])
const activeTab = ref('detail')

const selectedAttrs = reactive({})
const userHouseArea = ref(userStore.userInfo?.houseArea || 0)

const selectedAttributes = computed(() => {
  const result = []
  attributes.value.forEach(attr => {
    if (selectedAttrs[attr.id]) {
      const value = attr.values.find(v => String(v.id) === selectedAttrs[attr.id])
      if (value) {
        result.push({
          attributeId: attr.id,
          attributeName: attr.name,
          valueId: value.id,
          value: value.value,
          priceAdjustment: value.priceAdjustment
        })
      }
    }
  })
  return result
})

const currentPrice = computed(() => {
  if (!packageInfo.value) return 0
  let price = packageInfo.value.basePrice
  selectedAttributes.value.forEach(attr => {
    price += attr.priceAdjustment
  })
  return price
})

const priceDiff = computed(() => {
  if (!packageInfo.value) return 0
  return currentPrice.value - packageInfo.value.basePrice
})

const priceDiffClass = computed(() => {
  if (priceDiff.value > 0) return 'positive'
  if (priceDiff.value < 0) return 'negative'
  return 'zero'
})

const estimatedTotal = computed(() => {
  if (!userHouseArea.value || userHouseArea.value <= 0) return 0
  return (currentPrice.value * userHouseArea.value).toFixed(2)
})

const fetchPackageDetail = async () => {
  const packageId = route.params.id
  if (!packageId) return
  
  loading.value = true
  try {
    const result = await packageApi.getDetail(packageId)
    packageInfo.value = result.data
    attributes.value = result.data.attributes || []
    
    attributes.value.forEach(attr => {
      const defaultVal = attr.values.find(v => v.isDefault) || attr.values[0]
      if (defaultVal) {
        selectedAttrs[attr.id] = String(defaultVal.id)
      }
    })
  } catch (error) {
    console.error('获取套餐详情失败:', error)
    ElMessage.error('获取套餐详情失败')
  } finally {
    loading.value = false
  }
}

const handleAttrChange = () => {
}

const handleAddToCart = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  
  if (!userHouseArea.value || userHouseArea.value <= 0) {
    ElMessage.warning('请输入房屋面积')
    return
  }
  
  addingCart.value = true
  try {
    await cartStore.addToCart({
      packageId: Number(route.params.id),
      packageName: packageInfo.value.name,
      houseArea: userHouseArea.value,
      selectedAttributes: selectedAttributes.value,
      unitPrice: currentPrice.value,
      quantity: 1
    })
    ElMessage.success('已加入购物车')
  } catch (error) {
    console.error('加入购物车失败:', error)
    ElMessage.error(error.response?.data?.message || '加入购物车失败')
  } finally {
    addingCart.value = false
  }
}

const handleAddFavorite = () => {
  ElMessage.info('收藏功能开发中')
}

onMounted(() => {
  fetchPackageDetail()
})
</script>

<style scoped>
.package-detail-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.breadcrumb {
  margin-bottom: 20px;
}

.detail-content {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
}

.detail-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 30px;
}

.detail-image {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.detail-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.package-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}

.detail-info {
  display: flex;
  flex-direction: column;
}

.package-name {
  font-size: 28px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
}

.package-features {
  margin-bottom: 20px;
}

.feature-tag {
  margin-right: 10px;
  margin-bottom: 10px;
}

.price-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.base-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 10px;
}

.selected-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 10px;
}

.total-estimate {
  display: flex;
  align-items: baseline;
  padding-top: 10px;
  border-top: 1px solid #e4e7ed;
}

.base-price .label,
.selected-price .label,
.total-estimate .label {
  color: #606266;
  margin-right: 10px;
}

.base-price .price,
.selected-price .price,
.total-estimate .price {
  display: flex;
  align-items: baseline;
}

.base-price .currency,
.selected-price .currency,
.total-estimate .currency {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
}

.base-price .amount,
.selected-price .amount,
.total-estimate .amount {
  font-size: 28px;
  color: #f56c6c;
  font-weight: bold;
}

.base-price .unit,
.selected-price .unit,
.total-estimate .unit {
  font-size: 14px;
  color: #909399;
  margin-left: 2px;
}

.price-diff {
  margin-left: 10px;
  font-size: 14px;
}

.price-diff.positive {
  color: #f56c6c;
}

.price-diff.negative {
  color: #67c23a;
}

.price-diff.zero {
  color: #909399;
}

.total-estimate .note {
  margin-left: 10px;
  color: #909399;
  font-size: 13px;
}

.attributes-section h3,
.house-area-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
}

.attribute-group {
  margin-bottom: 20px;
}

.attribute-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.attribute-label .required {
  color: #f56c6c;
}

.attribute-values {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.value-name {
  margin-right: 5px;
}

.value-price {
  font-size: 12px;
  color: #f56c6c;
}

.house-area-section {
  margin-bottom: 30px;
}

.area-tip {
  margin-left: 15px;
  color: #f56c6c;
  font-size: 16px;
  font-weight: bold;
}

.action-section {
  display: flex;
  gap: 15px;
}

.action-section .el-button {
  padding: 12px 30px;
}

.detail-tabs {
  border-top: 1px solid #e4e7ed;
  padding-top: 30px;
}

.tab-content {
  padding: 20px;
}

.detail-specs {
  margin-top: 30px;
}

.detail-specs h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
}

@media (max-width: 992px) {
  .detail-header {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .detail-image img {
    height: 300px;
  }
}
</style>
