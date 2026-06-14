<template>
  <div class="product-detail-page" v-loading="loading">
    <el-page-header @back="$router.back()" content="商品详情" style="margin-bottom: 20px;" />
    
    <el-row :gutter="20" v-if="product">
      <el-col :span="10">
        <el-card class="image-card">
          <div class="product-image-large">
            <el-icon size="120"><Goods /></el-icon>
          </div>
          <div class="image-tags">
            <el-tag v-if="product.is_low_stock" type="danger" effect="dark">库存紧张</el-tag>
            <el-tag v-if="product.is_expiring_soon" type="warning" effect="dark">即将到期</el-tag>
            <el-tag type="success" effect="dark">{{ product.category_name }}</el-tag>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="14">
        <el-card class="info-card">
          <h2 class="product-name">{{ product.name }}</h2>
          <p class="product-desc">{{ product.description }}</p>
          
          <div class="merchant-section">
            <div class="merchant-info">
              <el-avatar :size="48" style="background-color: #409eff;">
                {{ product.merchant_name?.charAt(0) }}
              </el-avatar>
              <div class="merchant-detail">
                <div class="merchant-name">{{ product.merchant_name }}</div>
                <div class="merchant-status">
                  <el-tag :type="product.merchant_qualification === 'verified' ? 'success' : 'warning'" size="small">
                    {{ product.merchant_qualification === 'verified' ? '资质已核验' : '资质待核验' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
          
          <div class="price-section">
            <span class="current-price">¥{{ product.price.toFixed(2) }}</span>
            <span v-if="product.original_price" class="original-price">¥{{ product.original_price.toFixed(2) }}</span>
            <el-tag type="danger" effect="dark" v-if="product.original_price">
              省{{ (product.original_price - product.price).toFixed(0) }}元
            </el-tag>
          </div>
          
          <div class="meta-section">
            <div class="meta-item">
              <span class="label">库存</span>
              <span class="value">
                {{ product.stock }}件
                <el-tag v-if="product.stock <= product.stock_warning" type="warning" size="small">
                  库存预警
                </el-tag>
              </span>
            </div>
            <div class="meta-item">
              <span class="label">销量</span>
              <span class="value">{{ product.sales_count || 0 }}件</span>
            </div>
            <div class="meta-item" v-if="product.expiry_date">
              <span class="label">有效期至</span>
              <span class="value">{{ product.expiry_date }}</span>
            </div>
          </div>
          
          <div class="purchase-section">
            <div class="quantity-selector">
              <span class="label">购买数量</span>
              <el-input-number
                v-model="quantity"
                :min="1"
                :max="product.stock"
                size="large"
              />
            </div>
            <div class="coupon-selector" v-if="availableCoupons.length > 0">
              <span class="label">优惠券</span>
              <el-select v-model="selectedCouponId" placeholder="选择优惠券" clearable style="width: 300px;">
                <el-option
                  v-for="c in availableCoupons"
                  :key="c.id"
                  :label="`${c.name} - 减${c.value}元 (满${c.min_amount}可用)`"
                  :value="c.id"
                  :disabled="product.price * quantity < c.min_amount"
                />
              </el-select>
            </div>
            <div class="total-section">
              <span>合计：</span>
              <span class="total-price">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
            <div class="action-buttons">
              <el-button size="large" @click="$router.back()">返回</el-button>
              <el-button type="primary" size="large" :loading="purchasing" :disabled="product.stock === 0" @click="handlePurchase">
                <el-icon><ShoppingCart /></el-icon>
                立即购买
              </el-button>
            </div>
          </div>
        </el-card>
        
        <el-card class="inventory-card" style="margin-top: 20px;">
          <template #header>
            <span style="font-weight: 600;">库存变动记录（可复查）</span>
          </template>
          <el-table :data="product.inventory_logs" size="small" stripe>
            <el-table-column prop="change_type" label="变动类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.change_type === 'sale' ? 'danger' : row.change_type === 'restock' ? 'success' : 'warning'" size="small">
                  {{ { sale: '销售出库', restock: '补货入库', warning: '库存预警' }[row.change_type] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.quantity > 0 ? '#67c23a' : '#f56c6c' }">
                  {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="库存" width="120">
              <template #default="{ row }">
                {{ row.stock_before }} → {{ row.stock_after }}
              </template>
            </el-table-column>
            <el-table-column prop="operator_name" label="操作人" width="120" />
            <el-table-column prop="remark" label="备注" />
            <el-table-column prop="created_at" label="时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { getProduct, purchaseProduct, getCoupons } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const purchasing = ref(false)
const product = ref(null)
const quantity = ref(1)
const selectedCouponId = ref(null)
const availableCoupons = ref([])

const totalAmount = computed(() => {
  if (!product.value) return 0
  let total = product.value.price * quantity.value
  if (selectedCouponId.value) {
    const coupon = availableCoupons.value.find(c => c.id === selectedCouponId.value)
    if (coupon && total >= coupon.min_amount) {
      total -= coupon.value
      if (total < 0) total = 0
    }
  }
  return total
})

async function loadProduct() {
  loading.value = true
  try {
    const res = await getProduct(route.params.id)
    product.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadCoupons() {
  try {
    const res = await getCoupons({ user_id: userStore.userId, status: 'unused' })
    availableCoupons.value = res.data.filter(c => !c.is_expired)
  } catch {}
}

async function handlePurchase() {
  try {
    await ElMessageBox.confirm(
      `确认购买【${product.value.name}】x${quantity.value}，合计 ¥${totalAmount.toFixed(2)}？`,
      '确认购买',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
    
    purchasing.value = true
    const res = await purchaseProduct(product.value.id, {
      user_id: userStore.userId,
      quantity: quantity.value,
      coupon_id: selectedCouponId.value || null
    })
    
    ElMessage.success(`下单成功！订单号：${res.data.orderNo}`)
    
    await ElMessageBox.confirm(
      `订单已创建，是否立即支付 ¥${res.data.totalAmount.toFixed(2)}？`,
      '支付提示',
      { confirmButtonText: '立即支付', cancelButtonText: '稍后支付', type: 'success' }
    ).then(async () => {
      await purchaseProduct(res.data.orderId)
      ElMessage.success('支付成功！')
      loadProduct()
    }).catch(() => {
      router.push('/profile/orders')
    })
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '购买失败')
    }
  } finally {
    purchasing.value = false
  }
}

onMounted(() => {
  loadProduct()
  loadCoupons()
})
</script>

<style scoped>
.product-detail-page {
  padding: 0;
}

.image-card {
  border: none;
  border-radius: 12px;
}

.product-image-large {
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 8px;
}

.image-tags {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.info-card {
  border: none;
  border-radius: 12px;
}

.product-name {
  font-size: 24px;
  margin: 0 0 10px;
  color: #303133;
}

.product-desc {
  color: #606266;
  margin-bottom: 20px;
  line-height: 1.6;
}

.merchant-section {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.merchant-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.merchant-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.price-section {
  padding: 20px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.current-price {
  font-size: 36px;
  font-weight: 600;
  color: #f56c6c;
  margin-right: 15px;
}

.original-price {
  font-size: 16px;
  color: #909399;
  text-decoration: line-through;
  margin-right: 15px;
}

.meta-section {
  display: flex;
  gap: 40px;
  margin-bottom: 25px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-item .label {
  font-size: 13px;
  color: #909399;
}

.meta-item .value {
  font-size: 15px;
  color: #303133;
}

.purchase-section {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.quantity-selector, .coupon-selector {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.quantity-selector .label, .coupon-selector .label {
  width: 80px;
  color: #606266;
}

.total-section {
  text-align: right;
  margin-bottom: 20px;
  font-size: 16px;
}

.total-price {
  font-size: 28px;
  font-weight: 600;
  color: #f56c6c;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.inventory-card {
  border: none;
  border-radius: 12px;
}
</style>
