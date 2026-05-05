<template>
  <div class="order-confirm-page">
    <div class="container">
      <h1 class="page-title">确认订单</h1>
      
      <div class="confirm-content" v-loading="loading">
        <el-steps :active="1" align-center class="order-steps">
          <el-step title="选购商品" />
          <el-step title="确认订单" />
          <el-step title="完成下单" />
        </el-steps>
        
        <div class="confirm-main">
          <div class="confirm-left">
            <div class="confirm-section">
              <h3 class="section-title">
                <el-icon><Location /></el-icon>
                收货信息
              </h3>
              <div class="section-content">
                <div class="user-info" v-if="userStore.userInfo">
                  <div class="info-row">
                    <span class="label">收货人：</span>
                    <span class="value">{{ userStore.userInfo.realName || '未填写' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">联系电话：</span>
                    <span class="value">{{ userStore.userInfo.phone }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">身份证号：</span>
                    <span class="value">{{ userStore.userInfo.idCard ? userStore.userInfo.idCard.replace(/^(.{6})(.{8})(.{4})$/, '$1********$3') : '未填写' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">房屋地址：</span>
                    <span class="value">
                      {{ userStore.userInfo.province || '' }}
                      {{ userStore.userInfo.city || '' }}
                      {{ userStore.userInfo.district || '' }}
                      {{ userStore.userInfo.project || '' }}
                      {{ userStore.userInfo.building ? userStore.userInfo.building + '栋' : '' }}
                      {{ userStore.userInfo.floor ? userStore.userInfo.floor + '层' : '' }}
                      {{ userStore.userInfo.roomNumber || '' }}
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="label">户型：</span>
                    <span class="value">{{ userStore.userInfo.houseType || '未填写' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">房屋面积：</span>
                    <span class="value">{{ userStore.userInfo.houseArea ? userStore.userInfo.houseArea + '㎡' : '未填写' }}</span>
                  </div>
                </div>
                <el-empty v-else description="请先登录" />
              </div>
              <router-link to="/user/profile" class="edit-info">
                <el-button type="primary" size="small">
                  <el-icon><Edit /></el-icon>
                  修改个人信息
                </el-button>
              </router-link>
            </div>
            
            <div class="confirm-section">
              <h3 class="section-title">
                <el-icon><ShoppingCart /></el-icon>
                商品清单
              </h3>
              <div class="section-content">
                <div class="order-items">
                  <div class="order-group" v-if="selectedPackageItems.length > 0">
                    <div class="group-title">套餐商品</div>
                    <div class="order-item" v-for="item in selectedPackageItems" :key="item.id">
                      <div class="item-image">
                        <el-image
                          :src="'https://picsum.photos/80/80?random=' + item.id"
                          fit="cover"
                        />
                      </div>
                      <div class="item-info">
                        <h4 class="item-name">{{ item.packageName }}</h4>
                        <div class="item-attrs" v-if="item.selectedAttributes && item.selectedAttributes.length">
                          <span class="attr" v-for="attr in item.selectedAttributes" :key="attr.attributeId">
                            {{ attr.attributeName }}: {{ attr.value }}
                          </span>
                        </div>
                        <div class="item-area">房屋面积：{{ item.houseArea }}㎡</div>
                      </div>
                      <div class="item-price">
                        <div class="unit-price">¥{{ item.unitPrice }}/㎡</div>
                        <div class="total-price">¥{{ (item.unitPrice * item.houseArea).toFixed(2) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="order-group" v-if="selectedAccessoryItems.length > 0">
                    <div class="group-title">配件商品</div>
                    <div class="order-item" v-for="item in selectedAccessoryItems" :key="'acc-' + item.id">
                      <div class="item-image">
                        <el-image
                          :src="item.image || 'https://picsum.photos/80/80?random=acc' + item.id"
                          fit="cover"
                        />
                      </div>
                      <div class="item-info">
                        <h4 class="item-name">{{ item.name }}</h4>
                        <div class="item-category">{{ item.categoryName || '配件' }}</div>
                      </div>
                      <div class="item-quantity">×{{ item.quantity }}</div>
                      <div class="item-price">
                        <div class="unit-price">¥{{ item.unitPrice }}</div>
                        <div class="total-price">¥{{ (item.unitPrice * item.quantity).toFixed(2) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="order-group" v-if="selectedUpgradeItems.length > 0">
                    <div class="group-title">优化改造包</div>
                    <div class="order-item" v-for="item in selectedUpgradeItems" :key="'upg-' + item.id">
                      <div class="item-image">
                        <el-image
                          :src="'https://picsum.photos/80/80?random=upg' + item.id"
                          fit="cover"
                        />
                      </div>
                      <div class="item-info">
                        <h4 class="item-name">{{ item.name }}</h4>
                        <div class="item-desc">{{ item.description }}</div>
                      </div>
                      <div class="item-quantity">×{{ item.quantity }}</div>
                      <div class="item-price">
                        <div class="unit-price">¥{{ item.unitPrice }}</div>
                        <div class="total-price">¥{{ (item.unitPrice * item.quantity).toFixed(2) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="confirm-section">
              <h3 class="section-title">
                <el-icon><Edit /></el-icon>
                订单备注
              </h3>
              <div class="section-content">
                <el-input
                  v-model="orderRemark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入订单备注（选填）"
                  maxlength="500"
                  show-word-limit
                />
              </div>
            </div>
          </div>
          
          <div class="confirm-right">
            <div class="order-summary">
              <h3 class="summary-title">订单汇总</h3>
              
              <div class="summary-detail">
                <div class="summary-row">
                  <span class="label">套餐总价：</span>
                  <span class="value">¥{{ summary.packageTotal.toFixed(2) }}</span>
                </div>
                
                <div class="summary-row" v-if="summary.accessoryTotal > 0">
                  <span class="label">配件总价：</span>
                  <span class="value">¥{{ summary.accessoryTotal.toFixed(2) }}</span>
                </div>
                
                <div class="summary-row" v-if="summary.upgradeTotal > 0">
                  <span class="label">改造包总价：</span>
                  <span class="value">¥{{ summary.upgradeTotal.toFixed(2) }}</span>
                </div>
                
                <div class="summary-row">
                  <span class="label">商品件数：</span>
                  <span class="value">{{ selectedCount }}件</span>
                </div>
              </div>
              
              <div class="summary-total">
                <span class="label">应付金额：</span>
                <span class="value">¥{{ summary.total.toFixed(2) }}</span>
              </div>
              
              <div class="summary-actions">
                <el-button
                  type="primary"
                  size="large"
                  :loading="submitting"
                  :disabled="selectedCount === 0"
                  @click="handleSubmitOrder"
                >
                  提交订单
                </el-button>
                <el-button size="large" @click="goBack">
                  返回购物车
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCartStore } from '@/store/cart'
import { useUserStore } from '@/store/user'
import { orderApi } from '@/api/order'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const orderRemark = ref('')

const selectedItems = computed(() => cartStore.items.filter(i => i.selected))

const selectedPackageItems = computed(() => selectedItems.value.filter(i => i.type === 'package'))
const selectedAccessoryItems = computed(() => selectedItems.value.filter(i => i.type === 'accessory'))
const selectedUpgradeItems = computed(() => selectedItems.value.filter(i => i.type === 'upgrade'))

const selectedCount = computed(() => selectedItems.value.length)

const summary = computed(() => {
  let packageTotal = 0
  let accessoryTotal = 0
  let upgradeTotal = 0
  
  selectedItems.value.forEach(item => {
    if (item.type === 'package') {
      packageTotal += item.unitPrice * item.houseArea
    } else if (item.type === 'accessory') {
      accessoryTotal += item.unitPrice * item.quantity
    } else if (item.type === 'upgrade') {
      upgradeTotal += item.unitPrice * item.quantity
    }
  })
  
  return {
    packageTotal,
    accessoryTotal,
    upgradeTotal,
    total: packageTotal + accessoryTotal + upgradeTotal
  }
})

const goBack = () => {
  router.push('/cart')
}

const handleSubmitOrder = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: '/orders/confirm' } })
    return
  }
  
  if (selectedCount.value === 0) {
    ElMessage.warning('请至少选择一件商品')
    return
  }
  
  submitting.value = true
  try {
    const orderData = {
      packageItems: selectedPackageItems.value.map(item => ({
        packageId: item.packageId,
        packageName: item.packageName,
        houseArea: item.houseArea,
        selectedAttributes: item.selectedAttributes,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      accessoryItems: selectedAccessoryItems.value.map(item => ({
        accessoryId: item.accessoryId,
        name: item.name,
        categoryName: item.categoryName,
        image: item.image,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      upgradeItems: selectedUpgradeItems.value.map(item => ({
        upgradePackageId: item.upgradePackageId,
        name: item.name,
        description: item.description,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      remark: orderRemark.value,
      totalAmount: summary.value.total
    }
    
    const result = await orderApi.create(orderData)
    ElMessage.success('订单提交成功！')
    
    await cartStore.clearCart()
    
    router.push(`/orders/${result.data.orderNo}`)
  } catch (error) {
    console.error('提交订单失败:', error)
    ElMessage.error(error.response?.data?.message || '提交订单失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (userStore.isLoggedIn && selectedCount.value === 0) {
    cartStore.fetchCart().catch(() => {})
  }
})
</script>

<style scoped>
.order-confirm-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.page-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  font-weight: bold;
}

.order-steps {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.confirm-main {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

.confirm-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-content {
  padding-left: 8px;
}

.user-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.info-row .value {
  color: #333;
}

.edit-info {
  margin-top: 15px;
  display: inline-block;
}

.order-items {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.order-group {
  border-bottom: 1px solid #e4e7ed;
}

.order-group:last-child {
  border-bottom: none;
}

.group-title {
  background: #f5f7fa;
  padding: 10px 15px;
  font-size: 14px;
  color: #606266;
  font-weight: bold;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 15px;
}

.item-image {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  font-weight: bold;
}

.item-attrs {
  margin-bottom: 6px;
}

.item-attrs .attr {
  display: inline-block;
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 8px;
  margin-bottom: 4px;
}

.item-area,
.item-category,
.item-desc {
  font-size: 12px;
  color: #909399;
}

.item-quantity {
  font-size: 14px;
  color: #606266;
  margin: 0 20px;
}

.item-price {
  text-align: right;
  min-width: 100px;
}

.item-price .unit-price {
  font-size: 12px;
  color: #909399;
}

.item-price .total-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.order-summary {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  position: sticky;
  top: 30px;
}

.summary-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.summary-detail {
  margin-bottom: 15px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.summary-row .label {
  color: #606266;
  font-size: 14px;
}

.summary-row .value {
  color: #333;
  font-size: 14px;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.summary-total .label {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.summary-total .value {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
}

.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-actions .el-button {
  width: 100%;
  padding: 14px;
}

@media (max-width: 992px) {
  .confirm-main {
    grid-template-columns: 1fr;
  }
  
  .order-item {
    flex-wrap: wrap;
  }
}
</style>
