<template>
  <el-container style="min-height: 100vh;">
    <Header />
    <el-main>
      <el-card style="max-width: 1200px; margin: 0 auto;">
        <template #header>
          <span style="font-size: 18px; font-weight: bold;">购物车</span>
        </template>

        <el-table
          v-loading="loading"
          :data="cartItems"
          border
          style="width: 100%;"
          v-if="cartItems.length > 0"
        >
          <el-table-column prop="name" label="商品信息" width="400">
            <template #default="scope">
              <div style="display: flex; align-items: center;">
                <el-image
                  :src="scope.row.image_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20product%20placeholder&image_size=square'"
                  style="width: 80px; height: 80px; margin-right: 12px;"
                  fit="cover"
                />
                <div>
                  <div style="font-weight: bold; cursor: pointer; color: #409eff;" @click="goToDetail(scope.row.product_id)">
                    {{ scope.row.name }}
                  </div>
                  <div style="color: #999; font-size: 12px; margin-top: 4px;">
                    单价: ¥{{ scope.row.price }}
                  </div>
                  <el-tag v-if="scope.row.status !== 'on_sale'" type="danger" size="small" style="margin-top: 4px;">
                    已下架
                  </el-tag>
                  <el-tag v-else-if="scope.row.stock < scope.row.quantity" type="warning" size="small" style="margin-top: 4px;">
                    库存不足
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="单价" width="120">
            <template #default="scope">
              <span style="color: #ff4d4f; font-weight: bold;">¥{{ scope.row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="200">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.quantity"
                :min="1"
                :max="scope.row.stock"
                size="small"
                @change="handleQuantityChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="150">
            <template #default="scope">
              <span style="color: #ff4d4f; font-weight: bold; font-size: 16px;">
                ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="danger" text @click="handleRemove(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-else description="购物车空空如也">
          <el-button type="primary" @click="$router.push('/home')">去逛逛</el-button>
        </el-empty>

        <div v-if="cartItems.length > 0" style="margin-top: 20px; padding: 20px; background-color: #f5f7fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <el-button type="danger" text @click="handleClearCart">清空购物车</el-button>
            <el-button text @click="$router.push('/home')">继续购物</el-button>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 20px;">
              共 <strong style="color: #409eff; font-size: 18px;">{{ totalQuantity }}</strong> 件商品
            </span>
            <span style="margin-right: 20px;">
              合计：<strong style="color: #ff4d4f; font-size: 24px;">¥{{ totalPrice.toFixed(2) }}</strong>
            </span>
            <el-button type="primary" size="large" :disabled="!canCheckout" @click="handleCheckout">
              结算
            </el-button>
          </div>
        </div>
      </el-card>
    </el-main>
    <el-footer style="background-color: #333; color: #fff; text-align: center; padding: 20px 0;">
      <p>© 2026 网上商城 - 版权所有</p>
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Header from '@/components/Header.vue'
import { getCart, updateCartItem, removeFromCart, clearCart, checkout, confirmPurchase } from '@/api/cart'

const router = useRouter()

const loading = ref(false)
const cartItems = ref([])

const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const totalQuantity = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

const canCheckout = computed(() => {
  return cartItems.value.every(item => 
    item.status === 'on_sale' && item.stock >= item.quantity
  ) && cartItems.value.length > 0
})

const fetchCart = async () => {
  loading.value = true
  try {
    const res = await getCart()
    if (res.success) {
      cartItems.value = res.data.items || []
    }
  } catch (error) {
    console.error('获取购物车失败', error)
  } finally {
    loading.value = false
  }
}

const handleQuantityChange = async (item) => {
  try {
    await updateCartItem(item.product_id, item.quantity)
    ElMessage.success('数量已更新')
  } catch (error) {
    console.error('更新购物车失败', error)
  }
}

const handleRemove = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await removeFromCart(item.product_id)
    ElMessage.success('已从购物车移除')
    fetchCart()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除购物车商品失败', error)
    }
  }
}

const handleClearCart = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await clearCart()
    ElMessage.success('购物车已清空')
    fetchCart()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空购物车失败', error)
    }
  }
}

const handleCheckout = async () => {
  try {
    const res = await checkout()
    if (res.success) {
      await ElMessageBox.confirm(
        `确认购买以下商品？\n\n共 ${totalQuantity.value} 件商品，合计 ¥${totalPrice.value.toFixed(2)}\n\n${res.data.message}`,
        '确认订单',
        {
          confirmButtonText: '确认购买',
          cancelButtonText: '取消',
          type: 'info'
        }
      )
      
      const purchaseRes = await confirmPurchase()
      if (purchaseRes.success) {
        ElMessage.success(purchaseRes.message)
        fetchCart()
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('结算失败', error)
    }
  }
}

const goToDetail = (id) => {
  router.push(`/product/${id}`)
}

onMounted(() => {
  fetchCart()
})
</script>
