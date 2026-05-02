<template>
  <div class="detail-container">
    <el-header style="height: auto; padding: 0;">
      <div class="header-inner">
        <div class="logo">
          <h1><router-link to="/">C2C二手交易平台</router-link></h1>
        </div>
        
        <div class="header-actions">
          <template v-if="userStore.isLoggedIn">
            <router-link to="/publish">
              <el-button type="primary">发布商品</el-button>
            </router-link>
            <el-dropdown>
              <span class="user-info">
                <el-avatar :size="32">
                  {{ userStore.userInfo?.nickname?.charAt(0) }}
                </el-avatar>
                <span class="nickname">{{ userStore.userInfo?.nickname }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item><router-link to="/profile">个人中心</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/orders">我的订单</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/my-products">我的商品</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/favorites">我的收藏</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/chat">消息中心</router-link></el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin || userStore.isCustomerService">
                    <router-link to="/admin">管理后台</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login"><el-button>登录</el-button></router-link>
            <router-link to="/register"><el-button type="primary">注册</el-button></router-link>
          </template>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item><router-link to="/">首页</router-link></el-breadcrumb-item>
        <el-breadcrumb-item>商品详情</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-loading="loading" class="detail-loading">
        <template v-if="product">
          <el-card class="detail-card">
            <el-row :gutter="40">
              <el-col :span="10">
                <div class="image-gallery">
                  <img
                    class="main-image"
                    :src="getProductImage()"
                    alt="商品图片"
                  />
                </div>
              </el-col>

              <el-col :span="14">
                <div class="product-info">
                  <h1 class="product-title">{{ product.title }}</h1>
                  
                  <div class="price-section">
                    <span class="current-price">¥{{ product.price.toFixed(2) }}</span>
                    <span v-if="product.originalPrice" class="original-price">
                      原价 ¥{{ product.originalPrice.toFixed(2) }}
                    </span>
                  </div>

                  <div class="meta-list">
                    <div class="meta-item" v-if="product.brand">
                      <span class="meta-label">品牌：</span>
                      <el-tag type="primary" size="small">{{ product.brand }}</el-tag>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">分类：</span>
                      <span>{{ product.category }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">状态：</span>
                      <el-tag :type="getStatusType(product.status)" size="small">
                        {{ getStatusText(product.status) }}
                      </el-tag>
                    </div>
                    <div class="meta-item" v-if="product.location">
                      <span class="meta-label">位置：</span>
                      <span>{{ product.location }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">发布时间：</span>
                      <span>{{ formatDate(product.createdAt) }}</span>
                    </div>
                  </div>

                  <div class="seller-section" v-if="product.sellerNickname">
                    <div class="seller-info">
                      <el-avatar :size="48">
                        {{ product.sellerNickname.charAt(0) }}
                      </el-avatar>
                      <div class="seller-detail">
                        <div class="seller-name">
                          {{ product.sellerNickname }}
                          <el-tag
                            v-if="product.sellerTrustScore"
                            :type="getTrustType(product.sellerTrustScore)"
                            size="small"
                            class="trust-tag"
                          >
                            信任分 {{ product.sellerTrustScore }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="action-section">
                    <el-button
                      type="primary"
                      size="large"
                      :disabled="product.status !== 'on_sale'"
                      :loading="buyLoading"
                      @click="handleBuy"
                      class="buy-btn"
                    >
                      立即购买
                    </el-button>
                    <el-button
                      size="large"
                      @click="goBack"
                    >
                      返回列表
                    </el-button>
                  </div>

                  <div class="notice-section" v-if="product.needsAppraisal">
                    <el-alert
                      title="该商品需要在线鉴定"
                      type="warning"
                      :closable="false"
                      show-icon
                    >
                      <template #default>
                        <p>1. 卖家发货时，商品将先寄送至平台鉴定中心</p>
                        <p>2. 专业鉴定师对商品进行真伪鉴定</p>
                        <p>3. 鉴定通过后，商品再寄送给买家</p>
                        <p>4. 如鉴定为假，全额退款给买家</p>
                      </template>
                    </el-alert>
                  </div>
                </div>
              </el-col>
            </el-row>

            <el-tabs v-model="activeTab" class="detail-tabs">
              <el-tab-pane label="商品描述" name="description">
                <div class="description-section">
                  <p v-if="product.description">{{ product.description }}</p>
                  <p v-else class="no-desc">暂无商品描述</p>
                </div>
              </el-tab-pane>

              <el-tab-pane label="担保交易说明" name="notice">
                <div class="escrow-section">
                  <el-alert
                    title="担保交易保障"
                    type="success"
                    :closable="false"
                    show-icon
                  >
                    <template #default>
                      <p><strong>1. 资金担保：</strong>买家付款后，资金由平台担保锁定，卖家无法立即提现</p>
                      <p><strong>2. 安全发货：</strong>卖家看到付款成功后才发货</p>
                      <p><strong>3. 确认收货：</strong>买家确认收货无误后，资金才会转给卖家</p>
                      <p><strong>4. 纠纷处理：</strong>如有纠纷，平台客服将介入调解，保留全量会话与凭证</p>
                    </template>
                  </el-alert>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </template>

        <el-empty v-if="!loading && !product" description="商品不存在或已下架" />
      </div>
    </el-main>

    <el-dialog
      v-model="orderDialogVisible"
      title="确认订单"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="order-dialog" v-if="product">
        <el-card :body-style="{ padding: '16px' }">
          <el-row :gutter="20">
            <el-col :span="8">
              <img :src="getProductImage()" class="order-image" alt="商品图片" />
            </el-col>
            <el-col :span="16">
              <h3 class="order-title">{{ product.title }}</h3>
              <div class="order-price">
                <span class="price">¥{{ product.price.toFixed(2) }}</span>
              </div>
              <div class="order-info">
                <p>卖家：{{ product.sellerNickname }}</p>
                <p>品牌：{{ product.brand || '未填写' }}</p>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <div class="order-summary">
          <div class="summary-row">
            <span>商品金额</span>
            <span>¥{{ product.price.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>服务费 (2%)</span>
            <span>¥{{ getServiceFee().toFixed(2) }}</span>
          </div>
          <div class="summary-row total">
            <span>应付金额</span>
            <span class="total-price">¥{{ getTotalAmount().toFixed(2) }}</span>
          </div>
        </div>

        <el-alert
          title="担保交易说明"
          type="info"
          :closable="false"
          style="margin-top: 16px;"
        >
          付款后资金由平台担保锁定，确认收货无误后才会转给卖家
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="payLoading" @click="confirmOrder">
          确认支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store'
import { productApi, orderApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const buyLoading = ref(false)
const payLoading = ref(false)
const product = ref(null)
const activeTab = ref('description')
const orderDialogVisible = ref(false)

const productImages = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%20smartphone%20used%20electronics%20product%20photo&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sony%20camera%20lens%20used%20photography%20product%20photo&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20watch%20Rolex%20used%20jewelry%20product%20photo&image_size=square'
]

const getProductImage = () => {
  if (product.value?.images && product.value.images.length > 0) {
    return product.value.images[0]
  }
  const index = (product.value?.id || 0) % productImages.length
  return productImages[index]
}

const getServiceFee = () => {
  if (!product.value) return 0
  const fee = product.value.price * 0.02
  return fee < 5 ? 5 : fee
}

const getTotalAmount = () => {
  if (!product.value) return 0
  return product.value.price
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getStatusType = (status) => {
  const types = {
    'on_sale': 'success',
    'pending_review': 'warning',
    'sold': 'info',
    'removed': 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    'on_sale': '在售',
    'pending_review': '待审核',
    'sold': '已售出',
    'removed': '已下架'
  }
  return texts[status] || status
}

const getTrustType = (score) => {
  if (score >= 900) return 'success'
  if (score >= 700) return 'primary'
  if (score >= 400) return 'warning'
  return 'danger'
}

const fetchProduct = async () => {
  loading.value = true
  try {
    const result = await productApi.getDetail(route.params.id)
    product.value = result.data
  } catch (e) {
    console.error('Failed to fetch product:', e)
    ElMessage.error('获取商品详情失败')
  } finally {
    loading.value = false
  }
}

const handleBuy = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  if (!product.value) return

  if (product.value.sellerId === userStore.userInfo?.id) {
    ElMessage.warning('不能购买自己的商品')
    return
  }

  orderDialogVisible.value = true
}

const confirmOrder = async () => {
  payLoading.value = true
  try {
    const result = await orderApi.create({
      productId: product.value.id
    })

    ElMessage.success('订单创建成功，正在跳转到订单页面...')
    orderDialogVisible.value = false
    
    setTimeout(() => {
      const orderId = result.data.order?.id || result.data.orderId
      router.push(`/orders/${orderId}`)
    }, 500)
  } catch (e) {
    console.error('Failed to create order:', e)
  } finally {
    payLoading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Logout error:', e)
    }
  }
}

onMounted(() => {
  fetchProduct()
})
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.logo a {
  color: inherit;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.nickname {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.breadcrumb {
  margin-bottom: 20px;
}

.detail-loading {
  min-height: 400px;
}

.detail-card {
  padding: 20px;
}

.image-gallery {
  position: relative;
}

.main-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

.product-info {
  padding-left: 20px;
}

.product-title {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  line-height: 1.5;
}

.price-section {
  padding: 16px;
  background-color: #fff7e6;
  border-radius: 8px;
  margin-bottom: 20px;
}

.current-price {
  font-size: 28px;
  font-weight: bold;
  color: #f56c6c;
}

.original-price {
  margin-left: 12px;
  font-size: 14px;
  color: #909399;
  text-decoration: line-through;
}

.meta-list {
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.meta-label {
  width: 70px;
  color: #909399;
  flex-shrink: 0;
}

.seller-section {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seller-detail {
  flex: 1;
}

.seller-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.trust-tag {
  margin-left: 8px;
}

.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.buy-btn {
  min-width: 150px;
}

.notice-section {
  margin-bottom: 20px;
}

.detail-tabs {
  margin-top: 32px;
}

.description-section {
  padding: 20px 0;
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
}

.no-desc {
  color: #909399;
  text-align: center;
  padding: 40px 0;
}

.escrow-section {
  padding: 20px 0;
}

.order-dialog {
  padding: 10px 0;
}

.order-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.order-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: normal;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.order-price {
  margin-bottom: 8px;
}

.order-price .price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.order-info {
  font-size: 13px;
  color: #909399;
}

.order-info p {
  margin: 4px 0;
}

.order-summary {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.summary-row.total {
  padding-top: 12px;
  margin-bottom: 0;
  border-top: 1px solid #ebeef5;
  font-size: 16px;
  color: #303133;
  font-weight: bold;
}

.total-price {
  color: #f56c6c;
  font-size: 20px;
}
</style>
