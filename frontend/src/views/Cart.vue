<template>
  <div class="cart-page">
    <div class="container">
      <h1 class="page-title">我的购物车</h1>
      
      <div class="cart-content" v-loading="loading">
        <el-empty v-if="cartStore.items.length === 0" description="购物车是空的，快去选购吧！">
          <template #action>
            <router-link to="/packages">
              <el-button type="primary">浏览套餐</el-button>
            </router-link>
          </template>
        </el-empty>
        
        <template v-else>
          <div class="cart-main">
            <div class="cart-items">
              <div class="cart-section">
                <h3>套餐商品</h3>
                <div class="item-group">
                  <div class="cart-item" v-for="item in packageItems" :key="item.id">
                    <div class="item-select">
                      <el-checkbox v-model="item.selected" @change="handleSelectChange" />
                    </div>
                    <div class="item-image">
                      <el-image
                        :src="'https://picsum.photos/100/100?random=' + item.id"
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
                      <div class="item-area">
                        房屋面积：{{ item.houseArea }}㎡
                      </div>
                    </div>
                    <div class="item-price">
                      <span class="unit-price">¥{{ item.unitPrice }}/㎡</span>
                      <span class="total-price">¥{{ (item.unitPrice * item.houseArea).toFixed(2) }}</span>
                    </div>
                    <div class="item-actions">
                      <el-button type="text" danger @click="handleRemoveItem(item.id)">
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="cart-section" v-if="accessoryItems.length > 0">
                <h3>配件商品</h3>
                <div class="item-group">
                  <div class="cart-item" v-for="item in accessoryItems" :key="'acc-' + item.id">
                    <div class="item-select">
                      <el-checkbox v-model="item.selected" @change="handleSelectChange" />
                    </div>
                    <div class="item-image">
                      <el-image
                        :src="item.image || 'https://picsum.photos/100/100?random=acc' + item.id"
                        fit="cover"
                      />
                    </div>
                    <div class="item-info">
                      <h4 class="item-name">{{ item.name }}</h4>
                      <div class="item-category">{{ item.categoryName || '配件' }}</div>
                    </div>
                    <div class="item-quantity">
                      <el-input-number 
                        v-model="item.quantity" 
                        :min="1"
                        :max="99"
                        size="small"
                        @change="handleQuantityChange(item)"
                      />
                    </div>
                    <div class="item-price">
                      <span class="unit-price">¥{{ item.unitPrice }}</span>
                      <span class="total-price">¥{{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
                    </div>
                    <div class="item-actions">
                      <el-button type="text" danger @click="handleRemoveAccessory(item.id)">
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="cart-section" v-if="upgradeItems.length > 0">
                <h3>优化改造包</h3>
                <div class="item-group">
                  <div class="cart-item" v-for="item in upgradeItems" :key="'upg-' + item.id">
                    <div class="item-select">
                      <el-checkbox v-model="item.selected" @change="handleSelectChange" />
                    </div>
                    <div class="item-image">
                      <el-image
                        :src="'https://picsum.photos/100/100?random=upg' + item.id"
                        fit="cover"
                      />
                    </div>
                    <div class="item-info">
                      <h4 class="item-name">{{ item.name }}</h4>
                      <div class="item-desc">{{ item.description }}</div>
                    </div>
                    <div class="item-quantity">
                      <el-input-number 
                        v-model="item.quantity" 
                        :min="1"
                        :max="99"
                        size="small"
                        @change="handleQuantityChange(item)"
                      />
                    </div>
                    <div class="item-price">
                      <span class="unit-price">¥{{ item.unitPrice }}</span>
                      <span class="total-price">¥{{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
                    </div>
                    <div class="item-actions">
                      <el-button type="text" danger @click="handleRemoveUpgrade(item.id)">
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="cart-sidebar">
              <div class="price-summary">
                <h3>订单汇总</h3>
                
                <div class="summary-item">
                  <span class="label">套餐总价：</span>
                  <span class="value">¥{{ summary.packageTotal.toFixed(2) }}</span>
                </div>
                
                <div class="summary-item" v-if="summary.accessoryTotal > 0">
                  <span class="label">配件总价：</span>
                  <span class="value">¥{{ summary.accessoryTotal.toFixed(2) }}</span>
                </div>
                
                <div class="summary-item" v-if="summary.upgradeTotal > 0">
                  <span class="label">改造包总价：</span>
                  <span class="value">¥{{ summary.upgradeTotal.toFixed(2) }}</span>
                </div>
                
                <div class="summary-total">
                  <span class="label">订单总额：</span>
                  <span class="value">¥{{ summary.total.toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="cart-actions">
                <el-button 
                  type="primary" 
                  size="large"
                  :disabled="selectedCount === 0"
                  @click="handleCheckout"
                >
                  去结算 ({{ selectedCount }}件)
                </el-button>
                <el-button 
                  size="large"
                  @click="handleClearSelected"
                >
                  清空购物车
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '@/store/cart'
import { useUserStore } from '@/store/user'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const loading = ref(false)

const packageItems = computed(() => cartStore.items.filter(i => i.type === 'package'))
const accessoryItems = computed(() => cartStore.items.filter(i => i.type === 'accessory'))
const upgradeItems = computed(() => cartStore.items.filter(i => i.type === 'upgrade'))

const selectedCount = computed(() => {
  return cartStore.items.filter(i => i.selected).length
})

const summary = computed(() => {
  let packageTotal = 0
  let accessoryTotal = 0
  let upgradeTotal = 0
  
  cartStore.items.forEach(item => {
    if (!item.selected) return
    
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

const handleSelectChange = () => {
  cartStore.updateSelection()
}

const handleRemoveItem = async (itemId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个套餐吗？', '提示', {
      type: 'warning'
    })
    await cartStore.removeFromCart(itemId, 'package')
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

const handleRemoveAccessory = async (itemId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个配件吗？', '提示', {
      type: 'warning'
    })
    await cartStore.removeFromCart(itemId, 'accessory')
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

const handleRemoveUpgrade = async (itemId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个改造包吗？', '提示', {
      type: 'warning'
    })
    await cartStore.removeFromCart(itemId, 'upgrade')
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

const handleQuantityChange = (item) => {
  cartStore.updateItemQuantity(item.id, item.type, item.quantity)
}

const handleClearSelected = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
      type: 'warning'
    })
    await cartStore.clearCart()
    ElMessage.success('购物车已清空')
  } catch {
    // 用户取消
  }
}

const handleCheckout = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: '/cart' } })
    return
  }
  
  if (selectedCount.value === 0) {
    ElMessage.warning('请至少选择一件商品')
    return
  }
  
  router.push('/orders/confirm')
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    cartStore.fetchCart().catch(() => {})
  }
})
</script>

<style scoped>
.cart-page {
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

.cart-content {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
}

.cart-main {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 30px;
}

.cart-section {
  margin-bottom: 20px;
}

.cart-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
  display: inline-block;
}

.item-group {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-select {
  margin-right: 15px;
}

.item-image {
  width: 80px;
  height: 80px;
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
  margin-bottom: 8px;
  font-weight: bold;
}

.item-attrs {
  margin-bottom: 8px;
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
  margin-right: 20px;
}

.item-price {
  text-align: right;
  margin-right: 20px;
  min-width: 100px;
}

.unit-price {
  display: block;
  font-size: 12px;
  color: #909399;
}

.total-price {
  display: block;
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
}

.item-actions {
  flex-shrink: 0;
}

.cart-sidebar {
  position: sticky;
  top: 30px;
}

.price-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.price-summary h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-item .label {
  color: #606266;
  font-size: 14px;
}

.summary-item .value {
  color: #333;
  font-size: 14px;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
  margin-top: 15px;
}

.summary-total .label {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.summary-total .value {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.cart-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cart-actions .el-button {
  width: 100%;
  padding: 14px;
}

@media (max-width: 992px) {
  .cart-main {
    grid-template-columns: 1fr;
  }
  
  .cart-item {
    flex-wrap: wrap;
  }
  
  .item-image {
    width: 60px;
    height: 60px;
  }
}
</style>
