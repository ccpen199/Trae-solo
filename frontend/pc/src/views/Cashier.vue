<template>
  <div class="cashier-container">
    <div class="cashier-header">
      <div class="header-left">
        <h2>收银台</h2>
        <span class="store-info">{{ userInfo?.storeName || '门店' }}</span>
      </div>
      <div class="header-right">
        <span class="cashier-name">{{ userInfo?.realName || '收银员' }}</span>
        <el-button type="primary" plain @click="handleLogout">退出</el-button>
      </div>
    </div>

    <div class="cashier-content">
      <div class="left-panel">
        <div class="scan-area">
          <div class="scan-title">
            <el-icon :size="20"><Scan /></el-icon>
            <span>商品扫描</span>
          </div>
          <div class="scan-input-group">
            <el-input
              v-model="scanInput"
              placeholder="请扫描商品条码或手动输入条码（如：6901234567891）"
              @keyup.enter="handleScan"
              class="scan-input"
              clearable
            />
            <el-button type="primary" @click="handleScan" :loading="scanning">
              <el-icon><Search /></el-icon>
              扫描
            </el-button>
          </div>
          
          <div v-if="lastScannedProduct" class="scan-result">
            <div class="result-header">
              <span class="success-text">
                <el-icon><Check /></el-icon>
                扫描成功
              </span>
            </div>
            <div class="result-content">
              <div class="result-item">
                <span class="label">商品名称:</span>
                <span class="value">{{ lastScannedProduct.productName || lastScannedProduct.name }}</span>
              </div>
              <div class="result-item">
                <span class="label">条码:</span>
                <span class="value barcode">{{ lastScannedProduct.barcode }}</span>
              </div>
              <div class="result-item">
                <span class="label">标准价格:</span>
                <span class="value price">¥{{ formatPrice(lastScannedProduct.price || lastScannedProduct.standardPrice) }}</span>
              </div>
              <div class="result-item" v-if="lastScannedProduct.memberPrice">
                <span class="label">会员价:</span>
                <span class="value member-price">¥{{ formatPrice(lastScannedProduct.memberPrice) }}</span>
              </div>
              <div class="result-item">
                <span class="label">库存:</span>
                <span class="value" :class="{'low-stock': lastScannedProduct.availableStock < 10}">
                  {{ lastScannedProduct.availableStock }} {{ lastScannedProduct.unit }}
                  <span v-if="lastScannedProduct.availableStock < 10" class="stock-warning">（库存不足）</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="product-grid">
          <div class="grid-header">
            <h3>商品列表</h3>
            <el-input
              v-model="productSearchKeyword"
              placeholder="搜索商品名称或条码"
              style="width: 200px"
              clearable
              @clear="searchProducts"
              @keyup.enter="searchProducts"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="grid-items">
            <div 
              v-for="product in productList" 
              :key="product.productId || product.id" 
              class="grid-item" 
              @click="selectProduct(product)"
              :class="{'out-of-stock': product.availableStock <= 0}"
            >
              <div class="product-name">{{ product.productName || product.name }}</div>
              <div class="product-barcode">{{ product.barcode }}</div>
              <div class="product-price-row">
                <span class="product-price">¥{{ formatPrice(product.price || product.standardPrice) }}</span>
                <span class="product-stock" :class="{'low-stock': product.availableStock < 10}">
                  库存: {{ product.availableStock }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="productList.length === 0" class="empty-products">
            <el-empty description="暂无商品" />
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="member-section">
          <h3>会员信息</h3>
          <div class="member-input">
            <el-input 
              v-model="memberInput" 
              placeholder="请输入会员手机号或会员码（如：13800138001）" 
              @keyup.enter="handleMemberIdentify"
              clearable
            />
            <el-button type="primary" @click="handleMemberIdentify" :loading="identifyingMember">
              <el-icon><User /></el-icon>
              识别
            </el-button>
            <el-button @click="clearMember" v-if="memberInfo">
              <el-icon><Close /></el-icon>
              清除
            </el-button>
          </div>
          <div v-if="memberInfo" class="member-info">
            <div class="member-avatar">
              <el-avatar :size="50" style="background-color: #409EFF">
                {{ memberInfo.name ? memberInfo.name.charAt(0) : '会' }}
              </el-avatar>
            </div>
            <div class="member-detail">
              <div class="info-item">
                <span class="label">会员姓名:</span>
                <span class="value">{{ memberInfo.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">会员等级:</span>
                <span class="value level-badge" :class="memberInfo.level.toLowerCase()">
                  {{ getLevelName(memberInfo.level) }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">积分余额:</span>
                <span class="value points">{{ memberInfo.pointsBalance }} 积分</span>
              </div>
              <div class="info-item">
                <span class="label">储值余额:</span>
                <span class="value balance">¥{{ formatPrice(memberInfo.storedBalance) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-section">
          <h3>购物车 <span class="cart-count">({{ totalQuantity }} 件)</span></h3>
          <div class="cart-list" v-if="cartItems.length > 0">
            <div v-for="(item, index) in cartItems" :key="index" class="cart-item">
              <div class="item-info">
                <div class="item-name">{{ item.productName }}</div>
                <div class="item-meta">
                  <span class="item-barcode">{{ item.barcode }}</span>
                  <span class="item-unit-price">¥{{ formatPrice(item.unitPrice) }}</span>
                  <span v-if="item.memberPrice && item.memberPrice < item.unitPrice" class="item-member-price">
                    会员价 ¥{{ formatPrice(item.memberPrice) }}
                  </span>
                </div>
              </div>
              <div class="item-quantity">
                <el-button 
                  size="small" 
                  @click="updateQuantity(index, -1)"
                  :disabled="item.quantity <= 1"
                >-</el-button>
                <span class="quantity">{{ item.quantity }}</span>
                <el-button 
                  size="small" 
                  @click="updateQuantity(index, 1)"
                  :disabled="item.quantity >= item.availableStock"
                >+</el-button>
              </div>
              <div class="item-subtotal">
                ¥{{ formatPrice(item.unitPrice * item.quantity) }}
              </div>
              <el-button 
                size="small" 
                type="danger" 
                text
                @click="removeItem(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div v-else class="empty-cart">
            <el-empty description="购物车为空，请扫描或选择商品" />
          </div>
        </div>

        <div class="payment-section">
          <div class="payment-info">
            <div class="info-row">
              <span>商品总数:</span>
              <span class="highlight">{{ totalQuantity }} 件</span>
            </div>
            <div class="info-row">
              <span>商品金额:</span>
              <span>¥{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="info-row" v-if="discountAmount > 0">
              <span>促销折扣:</span>
              <span class="discount">-¥{{ formatPrice(discountAmount) }}</span>
            </div>
            <div class="info-row" v-if="memberInfo && memberDiscount > 0">
              <span>会员折扣:</span>
              <span class="discount">-¥{{ formatPrice(memberDiscount) }}</span>
            </div>
            <div class="info-row total">
              <span>应收金额:</span>
              <span class="total-amount">¥{{ formatPrice(totalAmount) }}</span>
            </div>
          </div>

          <div class="payment-methods">
            <el-button type="primary" @click="handlePayment('CASH')" :disabled="cartItems.length === 0">
              <el-icon><Money /></el-icon>
              现金
            </el-button>
            <el-button type="primary" @click="handlePayment('CARD')" :disabled="cartItems.length === 0">
              <el-icon><CreditCard /></el-icon>
              刷卡
            </el-button>
            <el-button type="primary" @click="handlePayment('WECHAT')" :disabled="cartItems.length === 0">
              <el-icon><ChatDotRound /></el-icon>
              微信
            </el-button>
            <el-button type="primary" @click="handlePayment('ALIPAY')" :disabled="cartItems.length === 0">
              <el-icon><Wallet /></el-icon>
              支付宝
            </el-button>
          </div>
          
          <div class="quick-actions">
            <el-button type="info" plain @click="clearCart" :disabled="cartItems.length === 0">
              <el-icon><Refresh /></el-icon>
              清空购物车
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="paymentDialogVisible" title="支付确认" width="500px">
      <div class="payment-dialog">
        <div class="payment-info">
          <div class="info-row">
            <span>应收金额:</span>
            <span class="amount">¥{{ formatPrice(totalAmount) }}</span>
          </div>
          <div class="info-row">
            <span>支付方式:</span>
            <span>{{ paymentMethodMap[selectedPaymentMethod] }}</span>
          </div>
          <div v-if="memberInfo" class="use-points-row">
            <el-checkbox v-model="usePoints">使用积分抵扣</el-checkbox>
            <div v-if="usePoints" class="points-input">
              <el-input-number 
                v-model="pointsToUse" 
                :min="0" 
                :max="memberInfo?.pointsBalance || 0"
                :step="100"
              />
              <span class="points-value">
                = ¥{{ formatPrice(pointsToUse * 0.01) }}
              </span>
              <span class="points-tip">（当前积分: {{ memberInfo?.pointsBalance || 0 }}）</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="paymentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmPayment" :loading="paying">确认支付</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="receiptDialogVisible" title="小票预览" width="450px">
      <div class="receipt-preview" v-if="currentReceipt">
        <div class="receipt-header">
          <h3>{{ currentReceipt.storeName || '测试门店' }}</h3>
          <p>交易单号: {{ currentReceipt.transactionNo }}</p>
          <p>交易时间: {{ formatDateTime(currentReceipt.transactionTime) }}</p>
        </div>
        <div class="receipt-body">
          <div class="receipt-header-row">
            <span>商品</span>
            <span>数量</span>
            <span>单价</span>
            <span>金额</span>
          </div>
          <div v-for="(item, index) in receiptItems" :key="index" class="receipt-item">
            <span>{{ item.productName }}</span>
            <span>{{ item.quantity }}</span>
            <span>¥{{ item.unitPrice }}</span>
            <span>¥{{ item.subtotal }}</span>
          </div>
        </div>
        <div class="receipt-footer">
          <div class="footer-row">
            <span>商品金额:</span>
            <span>¥{{ formatPrice(currentReceipt.totalAmount) }}</span>
          </div>
          <div class="footer-row" v-if="currentReceipt.discountAmount > 0">
            <span>折扣金额:</span>
            <span class="discount">-¥{{ formatPrice(currentReceipt.discountAmount) }}</span>
          </div>
          <div class="footer-row total">
            <span>实收金额:</span>
            <span class="total-text">¥{{ formatPrice(currentReceipt.actualAmount) }}</span>
          </div>
          <div class="footer-row">
            <span>支付方式:</span>
            <span>{{ paymentMethodMap[currentReceipt.paymentMethod] }}</span>
          </div>
          <div v-if="currentReceipt.pointsEarned" class="footer-row">
            <span>获得积分:</span>
            <span class="points-earned">+{{ currentReceipt.pointsEarned }} 积分</span>
          </div>
        </div>
        <div class="receipt-bottom">
          <p>谢谢惠顾，欢迎下次光临！</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="receiptDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="printReceipt">
            <el-icon><Printer /></el-icon>
            打印小票
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Scan, Search, Check, User, Close, Delete, 
  Money, CreditCard, ChatDotRound, Wallet, Refresh, Printer
} from '@element-plus/icons-vue'

const router = useRouter()

const scanInput = ref('')
const productSearchKeyword = ref('')
const memberInput = ref('')
const memberInfo = ref(null)
const cartItems = ref([])
const productList = ref([])
const lastScannedProduct = ref(null)

const paymentDialogVisible = ref(false)
const receiptDialogVisible = ref(false)
const selectedPaymentMethod = ref('')
const usePoints = ref(false)
const pointsToUse = ref(0)
const currentReceipt = ref(null)
const receiptItems = ref([])

const scanning = ref(false)
const identifyingMember = ref(false)
const paying = ref(false)

const userInfo = computed(() => {
  const user = localStorage.getItem('userInfo')
  return user ? JSON.parse(user) : null
})

const totalQuantity = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
})

const discountAmount = ref(0)
const memberDiscount = computed(() => {
  if (!memberInfo.value) return 0
  return cartItems.value.reduce((sum, item) => {
    if (item.memberPrice && item.memberPrice < item.unitPrice) {
      return sum + ((item.unitPrice - item.memberPrice) * item.quantity)
    }
    return sum
  }, 0)
})

const totalAmount = computed(() => {
  return subtotal.value - discountAmount.value - memberDiscount.value
})

const paymentMethodMap = {
  CASH: '现金',
  CARD: '银行卡',
  WECHAT: '微信支付',
  ALIPAY: '支付宝'
}

const formatPrice = (price) => {
  if (price == null) return '0.00'
  return Number(price).toFixed(2)
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}

const getLevelName = (level) => {
  const map = {
    NORMAL: '普通会员',
    SILVER: '银卡会员',
    GOLD: '金卡会员'
  }
  return map[level] || level
}

onMounted(() => {
  loadProducts()
})

const loadProducts = async () => {
  try {
    const response = await axios.get('/api/pos/products', {
      params: {
        storeId: userInfo.value?.storeId || 1
      }
    })
    if (response.data.success) {
      productList.value = response.data.data
    }
  } catch (error) {
    console.error('加载商品失败:', error)
    ElMessage.error('加载商品列表失败')
  }
}

const searchProducts = async () => {
  try {
    const response = await axios.get('/api/pos/products', {
      params: {
        storeId: userInfo.value?.storeId || 1,
        keyword: productSearchKeyword.value
      }
    })
    if (response.data.success) {
      productList.value = response.data.data
    }
  } catch (error) {
    console.error('搜索商品失败:', error)
    ElMessage.error('搜索商品失败')
  }
}

const handleScan = async () => {
  if (!scanInput.value.trim()) {
    ElMessage.warning('请输入商品条码')
    return
  }
  
  scanning.value = true
  try {
    const response = await axios.post('/api/pos/scan', {
      barcode: scanInput.value.trim(),
      storeId: userInfo.value?.storeId || 1,
      memberId: memberInfo.value?.id
    })
    
    if (response.data.success) {
      const product = response.data.data
      if (product.found) {
        lastScannedProduct.value = product
        
        if (product.availableStock <= 0) {
          ElMessage.error('商品库存不足')
          return
        }
        
        addProduct(product)
        ElMessage.success(`${product.productName} 已添加到购物车`)
      } else {
        ElMessage.error(product.message || '商品未找到')
      }
    }
  } catch (error) {
    console.error('扫描失败:', error)
    ElMessage.error('扫描失败，请检查条码是否正确')
  } finally {
    scanning.value = false
    scanInput.value = ''
  }
}

const selectProduct = (product) => {
  if (product.availableStock <= 0) {
    ElMessage.warning('该商品库存不足')
    return
  }
  
  lastScannedProduct.value = product
  addProduct(product)
  ElMessage.success(`${product.productName || product.name} 已添加到购物车`)
}

const addProduct = (product) => {
  const productId = product.productId || product.id
  const productName = product.productName || product.name
  const unitPrice = product.memberPrice || product.price || product.unitPrice || product.standardPrice
  
  const existingItem = cartItems.value.find(item => item.productId === productId)
  if (existingItem) {
    if (existingItem.quantity + 1 <= existingItem.availableStock) {
      existingItem.quantity++
    } else {
      ElMessage.warning('库存不足')
      return
    }
  } else {
    cartItems.value.push({
      productId: productId,
      productName: productName,
      unitPrice: unitPrice,
      memberPrice: product.memberPrice,
      quantity: 1,
      barcode: product.barcode,
      availableStock: product.availableStock || 999
    })
  }
  calculateDiscount()
}

const updateQuantity = (index, change) => {
  const item = cartItems.value[index]
  const newQuantity = item.quantity + change
  
  if (newQuantity < 1) {
    ElMessage.warning('商品数量不能小于1')
    return
  }
  
  if (newQuantity > item.availableStock) {
    ElMessage.warning('库存不足')
    return
  }
  
  item.quantity = newQuantity
  calculateDiscount()
}

const removeItem = (index) => {
  cartItems.value.splice(index, 1)
  calculateDiscount()
}

const clearCart = () => {
  ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    cartItems.value = []
    discountAmount.value = 0
    lastScannedProduct.value = null
    ElMessage.success('购物车已清空')
  })
}

const handleMemberIdentify = async () => {
  if (!memberInput.value.trim()) {
    ElMessage.warning('请输入会员手机号或会员码')
    return
  }
  
  identifyingMember.value = true
  try {
    const response = await axios.get(`/api/member/identify?identifier=${memberInput.value.trim()}`)
    if (response.data.success) {
      if (response.data.data.found) {
        memberInfo.value = response.data.data
        ElMessage.success(`会员识别成功: ${memberInfo.value.name}`)
        
        recalculateCartWithMemberPrice()
        calculateDiscount()
      } else {
        ElMessage.error(response.data.data.message || '会员未找到')
      }
    } else {
      ElMessage.error(response.data.message || '会员识别失败')
    }
  } catch (error) {
    console.error('会员识别失败:', error)
    ElMessage.error('会员识别失败，请稍后重试')
  } finally {
    identifyingMember.value = false
    memberInput.value = ''
  }
}

const clearMember = () => {
  memberInfo.value = null
  usePoints.value = false
  pointsToUse.value = 0
  
  for (const item of cartItems.value) {
    if (item.memberPrice) {
      item.unitPrice = item.originalPrice || item.unitPrice
      item.memberPrice = null
    }
  }
  
  calculateDiscount()
  ElMessage.info('已清除会员信息')
}

const recalculateCartWithMemberPrice = async () => {
  if (!memberInfo.value) return
  
  for (const item of cartItems.value) {
    if (!item.originalPrice) {
      item.originalPrice = item.unitPrice
    }
    
    try {
      const response = await axios.post('/api/pos/scan', {
        barcode: item.barcode,
        storeId: userInfo.value?.storeId || 1,
        memberId: memberInfo.value.id
      })
      
      if (response.data.success && response.data.data.memberPrice) {
        item.memberPrice = response.data.data.memberPrice
        if (item.memberPrice < item.unitPrice) {
          item.unitPrice = item.memberPrice
        }
      }
    } catch (error) {
      console.error('获取会员价失败:', error)
    }
  }
}

const calculateDiscount = async () => {
  if (cartItems.value.length === 0) {
    discountAmount.value = 0
    return
  }
  
  try {
    const order = {
      storeId: userInfo.value?.storeId || 1,
      cashierId: userInfo.value?.userId || 1,
      memberId: memberInfo.value?.id,
      items: cartItems.value.map(item => ({
        productId: item.productId,
        barcode: item.barcode,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity
      })),
      totalAmount: subtotal.value
    }
    
    const response = await axios.post('/api/pos/discount/calculate', order)
    if (response.data.success) {
      const result = response.data.data
      discountAmount.value = result.discountAmount || 0
    }
  } catch (error) {
    console.error('折扣计算失败:', error)
  }
}

const handlePayment = (method) => {
  if (cartItems.value.length === 0) {
    ElMessage.warning('购物车为空，请先添加商品')
    return
  }
  
  selectedPaymentMethod.value = method
  usePoints.value = memberInfo.value && memberInfo.value.pointsBalance > 0
  pointsToUse.value = 0
  paymentDialogVisible.value = true
}

const confirmPayment = async () => {
  if (usePoints.value && pointsToUse.value > 0 && !memberInfo.value) {
    ElMessage.warning('请先识别会员')
    return
  }
  
  paying.value = true
  try {
    const order = {
      storeId: userInfo.value?.storeId || 1,
      cashierId: userInfo.value?.userId || 1,
      memberId: memberInfo.value?.id,
      items: cartItems.value.map(item => ({
        productId: item.productId,
        barcode: item.barcode,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity
      })),
      totalAmount: subtotal.value,
      discountAmount: discountAmount.value,
      actualAmount: totalAmount.value,
      pointsToUse: pointsToUse.value > 0 ? pointsToUse.value : undefined
    }
    
    const payment = {
      paymentMethod: selectedPaymentMethod.value,
      amount: totalAmount.value - (pointsToUse.value * 0.01)
    }
    
    const response = await axios.post('/api/pos/order/pay', {
      order,
      payment
    })
    
    if (response.data.success) {
      ElMessage.success('支付成功')
      paymentDialogVisible.value = false
      await loadReceipt(response.data.data.transactionNo)
      
      cartItems.value = []
      discountAmount.value = 0
      lastScannedProduct.value = null
    } else {
      ElMessage.error(response.data.message || '支付失败')
    }
  } catch (error) {
    console.error('支付失败:', error)
    ElMessage.error('支付失败，请稍后重试')
  } finally {
    paying.value = false
  }
}

const loadReceipt = async (transactionNo) => {
  try {
    const response = await axios.get(`/api/pos/receipt/no/${transactionNo}`)
    if (response.data.success) {
      currentReceipt.value = response.data.data.receipt
      receiptItems.value = response.data.data.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: formatPrice(item.unitPrice),
        subtotal: formatPrice(item.subtotal)
      }))
      receiptDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取小票失败:', error)
  }
}

const printReceipt = async () => {
  try {
    await axios.post('/api/pos/receipt/print', {
      transactionNo: currentReceipt.value.transactionNo
    })
    ElMessage.success('打印指令已发送')
  } catch (error) {
    console.error('打印失败:', error)
    ElMessage.error('打印失败，请稍后重试')
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  })
}
</script>

<style scoped>
.cashier-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.cashier-header {
  height: 60px;
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.store-info {
  font-size: 14px;
  margin-left: 20px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 4px;
}

.cashier-name {
  margin-right: 15px;
  font-size: 14px;
}

.cashier-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 60%;
  padding: 20px;
  background: #f5f7fa;
  overflow-y: auto;
}

.scan-area {
  margin-bottom: 25px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.scan-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.scan-input-group {
  display: flex;
  gap: 10px;
}

.scan-input {
  flex: 1;
}

.scan-result {
  margin-top: 15px;
  padding: 15px;
  background: #f0f9eb;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
}

.result-header {
  margin-bottom: 12px;
}

.success-text {
  color: #67c23a;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.result-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.result-item .label {
  color: #909399;
}

.result-item .value {
  color: #303133;
  font-weight: 500;
}

.result-item .value.price {
  color: #f56c6c;
  font-size: 16px;
}

.result-item .value.member-price {
  color: #67c23a;
  font-size: 16px;
}

.result-item .value.barcode {
  font-family: monospace;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.result-item .value.low-stock {
  color: #e6a23c;
}

.stock-warning {
  color: #e6a23c;
  font-size: 12px;
}

.product-grid {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.grid-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.grid-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.grid-item {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.grid-item:hover:not(.out-of-stock) {
  background: #ecf5ff;
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.grid-item.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
}

.grid-item .product-name {
  font-size: 14px;
  margin-bottom: 5px;
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-item .product-barcode {
  font-size: 11px;
  color: #909399;
  margin-bottom: 8px;
  font-family: monospace;
}

.grid-item .product-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grid-item .product-price {
  font-size: 15px;
  font-weight: 600;
  color: #409EFF;
}

.grid-item .product-stock {
  font-size: 11px;
  color: #909399;
}

.grid-item .product-stock.low-stock {
  color: #e6a23c;
}

.empty-products {
  text-align: center;
  padding: 40px 0;
}

.right-panel {
  width: 40%;
  padding: 20px;
  background: white;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.member-section,
.cart-section,
.payment-section {
  margin-bottom: 20px;
}

.member-section h3,
.cart-section h3,
.payment-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 10px;
  display: inline-block;
}

.cart-count {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

.member-input {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.member-input .el-input {
  flex: 1;
}

.member-info {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-radius: 8px;
}

.member-avatar {
  display: flex;
  align-items: center;
}

.member-detail {
  flex: 1;
}

.member-detail .info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.member-detail .info-item .label {
  color: #909399;
}

.member-detail .info-item .value {
  color: #303133;
  font-weight: 500;
}

.level-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.level-badge.normal {
  background: #f4f4f5;
  color: #909399;
}

.level-badge.silver {
  background: #e6e6e6;
  color: #606266;
}

.level-badge.gold {
  background: #fdf6ec;
  color: #e6a23c;
}

.member-detail .info-item .value.points {
  color: #e6a23c;
}

.member-detail .info-item .value.balance {
  color: #f56c6c;
}

.cart-list {
  max-height: 300px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.item-barcode {
  font-family: monospace;
}

.item-unit-price {
  color: #606266;
}

.item-member-price {
  color: #67c23a;
}

.item-quantity {
  display: flex;
  align-items: center;
  margin: 0 10px;
}

.quantity {
  margin: 0 8px;
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  color: #303133;
}

.item-subtotal {
  margin-right: 10px;
  font-weight: 600;
  color: #303133;
  min-width: 70px;
  text-align: right;
}

.empty-cart {
  text-align: center;
  padding: 30px 0;
  color: #909399;
}

.payment-info {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.payment-info .info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.payment-info .info-row .highlight {
  color: #409EFF;
  font-weight: 500;
}

.payment-info .info-row.total {
  font-weight: 600;
  font-size: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #dcdfe6;
}

.total-amount {
  color: #f56c6c;
  font-size: 20px;
}

.discount {
  color: #67c23a;
}

.payment-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
}

.payment-methods .el-button {
  height: 44px;
  font-size: 15px;
}

.quick-actions {
  text-align: center;
}

.payment-dialog .info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 15px;
}

.payment-dialog .amount {
  font-size: 22px;
  font-weight: 600;
  color: #f56c6c;
}

.use-points-row {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.points-input {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.points-value {
  color: #67c23a;
  font-weight: 500;
}

.points-tip {
  color: #909399;
  font-size: 13px;
}

.receipt-preview {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #fff;
  padding: 20px;
  border: 1px dashed #dcdfe6;
}

.receipt-header {
  text-align: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #dcdfe6;
}

.receipt-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.receipt-header p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.receipt-header-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 8px;
}

.receipt-body {
  margin-bottom: 15px;
}

.receipt-item {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  margin-bottom: 5px;
}

.receipt-footer {
  border-top: 1px dashed #dcdfe6;
  padding-top: 10px;
}

.receipt-footer .footer-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.receipt-footer .footer-row.total {
  font-weight: 600;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

.total-text {
  color: #f56c6c;
  font-size: 15px;
}

.points-earned {
  color: #67c23a;
}

.receipt-bottom {
  text-align: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed #dcdfe6;
  color: #909399;
}

.receipt-bottom p {
  margin: 0;
}

@media (max-width: 1200px) {
  .left-panel {
    width: 55%;
  }
  .right-panel {
    width: 45%;
  }
  .result-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .cashier-content {
    flex-direction: column;
  }
  .left-panel,
  .right-panel {
    width: 100%;
  }
  .left-panel {
    height: 50%;
  }
  .right-panel {
    height: 50%;
    border-left: none;
    border-top: 1px solid #e4e7ed;
  }
  .payment-methods {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
