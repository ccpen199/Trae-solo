<template>
  <div class="pos-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="tables-card">
          <template #header>
            <span>桌台选择</span>
          </template>
          <div class="table-grid">
            <div
              v-for="table in tables"
              :key="table.id"
              class="table-item"
              :class="getTableClass(table.status)"
              @click="selectTable(table)"
            >
              <div class="table-name">{{ table.name }}</div>
              <div class="table-info">{{ table.capacity }}人</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="11">
        <el-card class="menu-card">
          <template #header>
            <div class="menu-header">
              <span>菜单</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索菜品"
                suffix-icon="Search"
                style="width: 200px"
                clearable
              />
            </div>
          </template>
          
          <el-tabs v-model="activeCategory">
            <el-tab-pane
              v-for="category in menuCategories"
              :key="category.id"
              :label="category.name"
              :name="category.id"
            >
              <div class="dishes-grid">
                <div
                  v-for="dish in getDishesByCategory(category.id)"
                  :key="dish.id"
                  class="dish-item"
                  :class="{ disabled: dish.status !== 1 }"
                  @click="addDishToCart(dish)"
                >
                  <div class="dish-name">{{ dish.name }}</div>
                  <div class="dish-price">¥{{ dish.price }}</div>
                  <div class="dish-unit">{{ dish.unit }}</div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
      
      <el-col :span="7">
        <el-card class="cart-card">
          <template #header>
            <div class="cart-header">
              <span>当前订单</span>
              <el-tag v-if="selectedTable" type="primary">
                {{ selectedTable.name }}
              </el-tag>
            </div>
          </template>
          
          <div class="cart-items" v-if="cartItems.length > 0">
            <div
              v-for="(item, index) in cartItems"
              :key="item.dishId"
              class="cart-item"
            >
              <div class="cart-item-info">
                <div class="cart-item-name">{{ item.dishName }}</div>
                <div class="cart-item-price">¥{{ item.price }} × {{ item.quantity }}</div>
              </div>
              <div class="cart-item-actions">
                <el-button size="small" circle icon="Minus" @click="decreaseQuantity(index)" />
                <span class="cart-item-qty">{{ item.quantity }}</span>
                <el-button size="small" circle icon="Plus" @click="increaseQuantity(index)" />
              </div>
              <div class="cart-item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
            </div>
          </div>
          
          <el-empty v-else description="请选择桌台并添加菜品" />
          
          <div class="cart-footer">
            <div class="cart-total">
              <span>总计：</span>
              <span class="total-amount">¥{{ cartTotal.toFixed(2) }}</span>
            </div>
            <el-button
              type="primary"
              size="large"
              :disabled="cartItems.length === 0"
              @click="submitOrder"
              :loading="loading"
            >
              提交订单
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)
const searchKeyword = ref('')
const activeCategory = ref('')

const tables = ref([])
const menuCategories = ref([])
const menuDishes = ref([])

const selectedTable = ref(null)
const cartItems = ref([])

const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const getTableClass = (status) => {
  const map = {
    available: 'available',
    occupied: 'occupied',
    reserved: 'reserved',
    cleaning: 'cleaning',
    maintenance: 'maintenance'
  }
  return map[status] || 'available'
}

const getDishesByCategory = (categoryId) => {
  let dishes = menuDishes.value.filter(d => d.categoryId === categoryId)
  if (searchKeyword.value) {
    dishes = dishes.filter(d => 
      d.name.includes(searchKeyword.value) || 
      (d.code && d.code.includes(searchKeyword.value))
    )
  }
  return dishes
}

const selectTable = (table) => {
  if (table.status === 'maintenance') {
    ElMessage.warning('该桌台正在维护中')
    return
  }
  selectedTable.value = table
}

const addDishToCart = (dish) => {
  if (dish.status !== 1) {
    ElMessage.warning('该菜品已下架或售罄')
    return
  }
  
  if (!selectedTable.value) {
    ElMessage.warning('请先选择桌台')
    return
  }
  
  const existingItem = cartItems.value.find(item => item.dishId === dish.id)
  if (existingItem) {
    existingItem.quantity++
  } else {
    cartItems.value.push({
      dishId: dish.id,
      dishName: dish.name,
      price: parseFloat(dish.price),
      quantity: 1,
      unit: dish.unit
    })
  }
}

const increaseQuantity = (index) => {
  cartItems.value[index].quantity++
}

const decreaseQuantity = (index) => {
  if (cartItems.value[index].quantity > 1) {
    cartItems.value[index].quantity--
  } else {
    cartItems.value.splice(index, 1)
  }
}

const submitOrder = async () => {
  if (cartItems.value.length === 0) {
    ElMessage.warning('请添加菜品')
    return
  }
  
  if (!selectedTable.value) {
    ElMessage.warning('请选择桌台')
    return
  }
  
  loading.value = true
  try {
    const orderData = {
      tableId: selectedTable.value.id,
      guestCount: selectedTable.value.capacity,
      orderType: 'dine_in',
      items: cartItems.value.map(item => ({
        dishId: item.dishId,
        quantity: item.quantity
      })),
      remark: ''
    }
    
    await api.order.create(orderData)
    ElMessage.success('订单创建成功')
    
    cartItems.value = []
    selectedTable.value = null
    await fetchTables()
    
  } catch (error) {
    console.error('Submit order error:', error)
  } finally {
    loading.value = false
  }
}

const fetchTables = async () => {
  try {
    const res = await api.table.getList()
    tables.value = res.data || []
  } catch (error) {
    console.error('Fetch tables error:', error)
  }
}

const fetchMenu = async () => {
  try {
    const [categoriesRes, dishesRes] = await Promise.all([
      api.dish.categories.getList(),
      api.dish.getList({ pageSize: 1000 })
    ])
    
    menuCategories.value = categoriesRes.data || []
    menuDishes.value = dishesRes.data?.list || []
    
    if (menuCategories.value.length > 0) {
      activeCategory.value = menuCategories.value[0].id
    }
  } catch (error) {
    console.error('Fetch menu error:', error)
  }
}

onMounted(() => {
  fetchTables()
  fetchMenu()
})
</script>

<style scoped>
.pos-container {
  height: 100%;
}

.tables-card, .menu-card, .cart-card {
  height: 100%;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.table-item {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.table-item:hover {
  transform: scale(1.05);
}

.table-item.available {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  color: #67c23a;
}

.table-item.occupied {
  background: #fef0f0;
  border: 1px solid #fde2e2;
  color: #f56c6c;
}

.table-item.reserved {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  color: #e6a23c;
}

.table-item.cleaning {
  background: #f4f4f5;
  border: 1px solid #e9e9eb;
  color: #909399;
}

.table-item.maintenance {
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  color: #c0c4cc;
}

.table-name {
  font-size: 16px;
  font-weight: bold;
}

.table-info {
  font-size: 12px;
  margin-top: 5px;
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.dish-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.dish-item:hover:not(.disabled) {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.dish-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f7fa;
}

.dish-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.dish-price {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
}

.dish-unit {
  font-size: 12px;
  color: #909399;
  margin-left: 5px;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-items {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-size: 14px;
  font-weight: bold;
}

.cart-item-price {
  font-size: 12px;
  color: #909399;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  margin: 0 10px;
}

.cart-item-qty {
  margin: 0 8px;
  min-width: 20px;
  text-align: center;
}

.cart-item-subtotal {
  font-size: 14px;
  font-weight: bold;
  color: #f56c6c;
  min-width: 60px;
  text-align: right;
}

.cart-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

.cart-total {
  text-align: right;
  margin-bottom: 15px;
  font-size: 16px;
}

.total-amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.cart-footer .el-button {
  width: 100%;
}

.cart-card {
  position: relative;
}
</style>
