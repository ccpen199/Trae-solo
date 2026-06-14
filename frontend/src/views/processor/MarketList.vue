<template>
  <div class="market-list-container">
    <el-card class="filter-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">采购市场</span>
        <span class="card-subtitle">精选优质废弃物资源，绿色循环从这里开始</span>
      </div>
      
      <div class="category-tabs">
        <div
          v-for="cat in categories"
          :key="cat.value"
          class="category-item"
          :class="{ active: activeCategory === cat.value }"
          @click="handleCategoryChange(cat.value)"
        >
          <el-icon class="cat-icon"><component :is="cat.icon" /></el-icon>
          <span>{{ cat.label }}</span>
        </div>
      </div>

      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称、卖家、所在地"
          clearable
          style="width: 360px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <div class="sort-group">
          <span class="sort-label">排序：</span>
          <el-radio-group v-model="sortBy" size="default" @change="handleSort">
            <el-radio-button label="time">最新发布</el-radio-button>
            <el-radio-button label="price">价格</el-radio-button>
            <el-radio-button label="weight">重量</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <div class="product-grid">
      <el-card
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        shadow="hover"
        @click="handleDetail(product)"
      >
        <div class="product-image-wrapper">
          <el-image
            :src="product.image"
            fit="cover"
            class="product-image"
          />
          <el-tag :type="categoryTypeMap[product.category]" effect="dark" class="category-tag" size="small">
            {{ product.category }}
          </el-tag>
          <div v-if="product.isHazardous" class="hazardous-badge">
            <el-icon><Warning /></el-icon>
            <span>危废</span>
          </div>
        </div>
        
        <div class="product-content">
          <h4 class="product-title" :title="product.title">{{ product.title }}</h4>
          
          <div class="product-meta">
            <div class="meta-item">
              <el-icon><Scale /></el-icon>
              <span>{{ product.weight }} 吨</span>
            </div>
            <div class="meta-item">
              <el-icon><Location /></el-icon>
              <span>{{ product.location }}</span>
            </div>
          </div>

          <div class="product-seller">
            <el-avatar :size="24" :src="product.sellerAvatar">
              {{ product.sellerName.charAt(0) }}
            </el-avatar>
            <span class="seller-name">{{ product.sellerName }}</span>
            <el-tag v-if="product.isCertified" type="success" effect="plain" size="small">已认证</el-tag>
          </div>

          <div class="product-footer">
            <div class="price-section">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ product.price.toLocaleString() }}</span>
              <span class="price-unit">/吨</span>
            </div>
            <el-button type="primary" size="small" @click.stop="handlePurchase(product)">
              立即采购
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[8, 12, 20, 40]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="purchaseDialogVisible" title="确认采购" width="500px">
      <div v-if="currentProduct" class="purchase-form">
        <div class="product-info-row">
          <el-image :src="currentProduct.image" fit="cover" class="thumb-image" />
          <div class="product-brief">
            <h4>{{ currentProduct.title }}</h4>
            <p class="brief-meta">{{ currentProduct.category }} · {{ currentProduct.weight }}吨</p>
            <p class="brief-price">¥{{ currentProduct.price.toLocaleString() }} /吨</p>
          </div>
        </div>
        
        <el-form label-width="100px" class="purchase-detail-form">
          <el-form-item label="采购重量">
            <el-input-number
              v-model="purchaseForm.weight"
              :min="0.1"
              :max="currentProduct.weight"
              :step="0.1"
              style="width: 100%"
            />
            <span class="unit-tip">吨（最多可采购 {{ currentProduct.weight }} 吨）</span>
          </el-form-item>
          <el-form-item label="预计金额">
            <span class="estimated-amount">¥{{ estimatedAmount.toLocaleString() }}</span>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="purchaseForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息（选填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="purchaseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="purchaseLoading" @click="confirmPurchase">
          确认采购
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search, Scale, Location, Warning,
  Box, Tools, House, Coin, Flask
} from '@element-plus/icons-vue'

const searchKeyword = ref('')
const activeCategory = ref('all')
const sortBy = ref('time')
const purchaseDialogVisible = ref(false)
const purchaseLoading = ref(false)
const currentProduct = ref(null)

const purchaseForm = reactive({
  weight: 1,
  remark: ''
})

const categories = [
  { value: 'all', label: '全部', icon: Box },
  { value: '工业边角料', label: '工业边角料', icon: Box },
  { value: '二手设备', label: '二手设备', icon: Tools },
  { value: '废旧家电', label: '废旧家电', icon: House },
  { value: '生活塑料', label: '生活塑料', icon: Coin },
  { value: '危废', label: '危废', icon: Flask }
]

const categoryTypeMap = {
  '工业边角料': 'primary',
  '二手设备': 'warning',
  '废旧家电': 'info',
  '生活塑料': 'success',
  '危废': 'danger'
}

const queryParams = reactive({
  page: 1,
  pageSize: 8,
  category: '',
  keyword: '',
  sort: 'time'
})

const productList = ref([
  {
    id: 1,
    title: '工厂废铁边角料 纯净度高 量大从优',
    category: '工业边角料',
    image: 'https://via.placeholder.com/300x200/e8f5e9/66bb6a?text=Scrap+Iron',
    weight: 25.5,
    price: 2800,
    sellerName: '鑫源金属回收有限公司',
    sellerAvatar: '',
    location: '江苏省苏州市',
    isCertified: true,
    isHazardous: false,
    publishTime: '2024-06-14 09:30:00'
  },
  {
    id: 2,
    title: '二手注塑机 8成新 正常使用中',
    category: '二手设备',
    image: 'https://via.placeholder.com/300x200/f1f8e9/43a047?text=Injection+Machine',
    weight: 3.2,
    price: 45000,
    sellerName: '顺达二手机械',
    sellerAvatar: '',
    location: '广东省东莞市',
    isCertified: true,
    isHazardous: false,
    publishTime: '2024-06-14 10:15:00'
  },
  {
    id: 3,
    title: '废旧家电一批 冰箱洗衣机空调',
    category: '废旧家电',
    image: 'https://via.placeholder.com/300x200/dcedc8/81c784?text=Home+Appliances',
    weight: 8.6,
    price: 1200,
    sellerName: '绿源再生资源',
    sellerAvatar: '',
    location: '浙江省杭州市',
    isCertified: true,
    isHazardous: false,
    publishTime: '2024-06-13 14:20:00'
  },
  {
    id: 4,
    title: 'PET塑料瓶打包料 干净无杂质',
    category: '生活塑料',
    image: 'https://via.placeholder.com/300x200/c5e1a5/a5d6a7?text=PET+Bottles',
    weight: 15.2,
    price: 3200,
    sellerName: '塑联再生科技',
    sellerAvatar: '',
    location: '山东省青岛市',
    isCertified: false,
    isHazardous: false,
    publishTime: '2024-06-13 16:45:00'
  },
  {
    id: 5,
    title: '废油漆桶 HW49危废 需资质',
    category: '危废',
    image: 'https://via.placeholder.com/300x200/ffebee/ef5350?text=Hazardous+Waste',
    weight: 5.8,
    price: 800,
    sellerName: '安泰环保科技',
    sellerAvatar: '',
    location: '上海市浦东新区',
    isCertified: true,
    isHazardous: true,
    publishTime: '2024-06-12 08:30:00'
  },
  {
    id: 6,
    title: '废纸箱 工厂库存 纯黄板纸',
    category: '工业边角料',
    image: 'https://via.placeholder.com/300x200/b9f6ca/66bb6a?text=Waste+Paper',
    weight: 32.0,
    price: 1850,
    sellerName: '华丰纸品回收',
    sellerAvatar: '',
    location: '江苏省无锡市',
    isCertified: true,
    isHazardous: false,
    publishTime: '2024-06-12 11:00:00'
  },
  {
    id: 7,
    title: '二手叉车 3吨 电动叉车',
    category: '二手设备',
    image: 'https://via.placeholder.com/300x200/e0f2e1/4caf50?text=Forklift',
    weight: 4.5,
    price: 28000,
    sellerName: '永盛二手设备',
    sellerAvatar: '',
    location: '天津市武清区',
    isCertified: false,
    isHazardous: false,
    publishTime: '2024-06-11 13:20:00'
  },
  {
    id: 8,
    title: '废旧电路板 含金废料',
    category: '危废',
    image: 'https://via.placeholder.com/300x200/ffcdd2/e53935?text=Circuit+Boards',
    weight: 2.3,
    price: 12000,
    sellerName: '金源贵金属回收',
    sellerAvatar: '',
    location: '广东省深圳市',
    isCertified: true,
    isHazardous: true,
    publishTime: '2024-06-11 15:50:00'
  },
  {
    id: 9,
    title: 'HDPE塑料颗粒 再生料',
    category: '生活塑料',
    image: 'https://via.placeholder.com/300x200/dcedc8/81c784?text=HDPE+Pellets',
    weight: 20.0,
    price: 5800,
    sellerName: '科泰塑业',
    sellerAvatar: '',
    location: '浙江省宁波市',
    isCertified: true,
    isHazardous: false,
    publishTime: '2024-06-10 09:15:00'
  },
  {
    id: 10,
    title: '废不锈钢 304材质 边角料',
    category: '工业边角料',
    image: 'https://via.placeholder.com/300x200/e8f5e9/66bb6a?text=Stainless+Steel',
    weight: 12.8,
    price: 9500,
    sellerName: '宝盛金属回收',
    sellerAvatar: '',
    location: '广东省佛山市',
    isCertified: true,
    isHazardous: false,
    publishTime: '2024-06-10 14:30:00'
  },
  {
    id: 11,
    title: '废旧空调 1.5匹 壁挂式',
    category: '废旧家电',
    image: 'https://via.placeholder.com/300x200/c5e1a5/a5d6a7?text=Air+Conditioner',
    weight: 1.2,
    price: 800,
    sellerName: '绿源再生资源',
    sellerAvatar: '',
    location: '江苏省南京市',
    isCertified: true,
    isHazardous: false,
    publishTime: '2024-06-09 10:00:00'
  },
  {
    id: 12,
    title: '废铅酸蓄电池 HW49',
    category: '危废',
    image: 'https://via.placeholder.com/300x200/ffebee/ef5350?text=Batteries',
    weight: 6.5,
    price: 6500,
    sellerName: '恒泰危废处理',
    sellerAvatar: '',
    location: '河北省唐山市',
    isCertified: true,
    isHazardous: true,
    publishTime: '2024-06-09 16:20:00'
  }
])

const total = ref(56)

const filteredProducts = computed(() => {
  let list = [...productList.value]
  
  if (activeCategory.value !== 'all') {
    list = list.filter(item => item.category === activeCategory.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.title.toLowerCase().includes(keyword) ||
      item.sellerName.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword)
    )
  }
  
  if (sortBy.value === 'price') {
    list.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'weight') {
    list.sort((a, b) => b.weight - a.weight)
  } else {
    list.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime))
  }
  
  return list
})

const estimatedAmount = computed(() => {
  if (!currentProduct.value) return 0
  return Math.round(purchaseForm.weight * currentProduct.value.price)
})

const handleCategoryChange = (cat) => {
  activeCategory.value = cat
  queryParams.category = cat === 'all' ? '' : cat
  queryParams.page = 1
}

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
}

const handleSort = () => {
  queryParams.sort = sortBy.value
}

const handleDetail = (product) => {
  ElMessage.info(`查看商品详情：${product.title}`)
}

const handlePurchase = (product) => {
  currentProduct.value = product
  purchaseForm.weight = Math.min(1, product.weight)
  purchaseForm.remark = ''
  purchaseDialogVisible.value = true
}

const confirmPurchase = async () => {
  if (purchaseForm.weight <= 0) {
    ElMessage.warning('请输入有效的采购重量')
    return
  }
  purchaseLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  purchaseLoading.value = false
  purchaseDialogVisible.value = false
  ElMessage.success('采购订单已提交，等待卖家确认')
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
}

const handleCurrentChange = (val) => {
  queryParams.page = val
}
</script>

<style scoped>
.market-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 12px;
}

.filter-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.card-header-wrapper {
  margin-bottom: 16px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  display: block;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 13px;
  color: #909399;
}

.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #606266;
}

.category-item:hover {
  background: #e8f5e9;
  color: #43a047;
}

.category-item.active {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  color: #fff;
}

.category-item.active .cat-icon {
  color: #fff;
}

.cat-icon {
  font-size: 18px;
  color: #66bb6a;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.sort-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-label {
  font-size: 14px;
  color: #606266;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.product-card {
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(67, 160, 71, 0.15);
}

.product-card :deep(.el-card__body) {
  padding: 0;
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 66.67%;
  overflow: hidden;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.category-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
}

.hazardous-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(245, 108, 108, 0.95);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.product-content {
  padding: 14px 16px 16px;
}

.product-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
  line-height: 1.4;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.meta-item .el-icon {
  color: #66bb6a;
}

.product-seller {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.seller-name {
  font-size: 13px;
  color: #606266;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.price-symbol {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
}

.price-value {
  font-size: 22px;
  font-weight: 700;
  color: #f56c6c;
}

.price-unit {
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.purchase-form {
  padding: 10px 0;
}

.product-info-row {
  display: flex;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.thumb-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-brief h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.brief-meta {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #909399;
}

.brief-price {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.unit-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.estimated-amount {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.purchase-detail-form {
  margin-top: 16px;
}
</style>
