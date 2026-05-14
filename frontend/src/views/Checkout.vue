<template>
  <div class="min-h-screen bg-pdd-bg pb-20">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 border-b flex items-center">
      <button @click="$router.back()" class="text-xl">←</button>
      <h1 class="flex-1 text-center font-medium">确认订单</h1>
      <div class="w-6"></div>
    </div>

    <div v-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else>
      <div class="bg-white mx-3 mt-3 rounded-xl p-4" @click="showAddressPicker = true">
        <div v-if="address">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ address.name }}</span>
            <span class="text-gray-500">{{ address.phone }}</span>
          </div>
          <p class="text-sm text-gray-600 mt-1">{{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}</p>
        </div>
        <div v-else class="flex items-center justify-between">
          <div class="text-center flex-1 text-gray-400">
            请选择收货地址
          </div>
          <span class="text-gray-400">›</span>
        </div>
      </div>

      <div class="bg-white mx-3 mt-3 rounded-xl p-4">
        <div v-if="product" class="flex gap-3">
          <img :src="product.image" class="w-20 h-20 object-cover rounded" />
          <div class="flex-1 min-w-0">
            <h3 class="text-sm line-clamp-2">{{ product.name }}</h3>
            <div class="flex items-center justify-between mt-2">
              <span class="text-pdd-red font-bold">¥{{ product.price?.toFixed?.(2) || product.price }}</span>
              <span class="text-gray-500 text-sm">x{{ quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white mx-3 mt-3 rounded-xl p-4">
        <div class="flex items-center justify-between py-2 border-b">
          <span class="text-gray-600">商品金额</span>
          <span>¥{{ totalPrice.toFixed(2) }}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b">
          <span class="text-gray-600">运费</span>
          <span class="text-pdd-red">免运费</span>
        </div>
        <div class="flex items-center justify-between py-2">
          <span class="text-gray-600">实付金额</span>
          <span class="text-pdd-red text-xl font-bold">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
      </div>

      <div class="bg-white mx-3 mt-3 rounded-xl p-4">
        <div class="flex items-center gap-3 py-2" @click="selectedPayment = 'wechat'">
          <input type="radio" :checked="selectedPayment === 'wechat'" />
          <span class="text-xl">💬</span>
          <span>微信支付</span>
        </div>
        <div class="flex items-center gap-3 py-2" @click="selectedPayment = 'alipay'">
          <input type="radio" :checked="selectedPayment === 'alipay'" />
          <span class="text-xl">💰</span>
          <span>支付宝</span>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 bg-white border-t z-40 px-3 py-2 safe-bottom">
      <div class="flex items-center gap-3">
        <div class="flex-1">
          <span class="text-sm text-gray-500">实付: </span>
          <span class="text-pdd-red text-xl font-bold">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
        <button
          @click="handleSubmit"
          :disabled="submitting || loading"
          class="px-6 py-2 bg-pdd-red text-white rounded-full font-medium disabled:bg-gray-300"
        >
          {{ submitting ? '提交中...' : '立即支付' }}
        </button>
      </div>
    </div>

    <div v-if="showAddressPicker" class="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div class="w-full bg-white rounded-t-xl p-4 max-h-[70vh] overflow-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium">选择收货地址</h3>
          <button @click="showAddressPicker = false" class="text-xl">✕</button>
        </div>
        <div class="space-y-2">
          <div
            v-for="addr in addresses"
            :key="addr.id"
            @click="selectAddress(addr)"
            class="p-3 rounded-lg border"
            :class="address?.id === addr.id ? 'border-pdd-red bg-pdd-red/5' : 'border-gray-200'"
          >
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ addr.name }}</span>
              <span class="text-gray-500 text-sm">{{ addr.phone }}</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
          </div>
          <div v-if="addresses.length === 0" class="text-center py-8 text-gray-400">
            <p class="mb-3">暂无收货地址</p>
            <button @click="createDefaultAddress" class="px-4 py-2 bg-pdd-red text-white rounded-full text-sm">
              快速添加默认地址
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../stores/toast'
import { useUserStore } from '../stores/user'
import { productApi, orderApi, addressApi } from '../api'
import Loading from '../components/Loading.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const product = ref(null)
const quantity = ref(1)
const addresses = ref([])
const address = ref(null)
const selectedPayment = ref('wechat')
const showAddressPicker = ref(false)

const totalPrice = computed(() => {
  return (product.value?.price || 0) * quantity.value
})

async function createDefaultAddress() {
  try {
    const defaultAddr = {
      name: userStore.user?.nickname || '用户',
      phone: userStore.user?.phone || '13800138000',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '拼多多大厦18层',
      is_default: 1
    }
    
    const res = await addressApi.create(defaultAddr)
    if (res.success) {
      const addressRes = await addressApi.getList()
      if (addressRes.success) {
        addresses.value = addressRes.data || []
        address.value = addresses.value[0] || null
      }
      showAddressPicker.value = false
      toast.success('地址已添加')
    }
  } catch (e) {
    console.error('创建默认地址失败:', e)
    toast.error('添加地址失败')
  }
}

async function loadData() {
  loading.value = true
  try {
    if (route.query.productId) {
      const productRes = await productApi.getDetail(route.query.productId)
      if (productRes.success) {
        product.value = productRes.data
      }
    }
    
    quantity.value = parseInt(route.query.quantity) || 1

    try {
      const addressRes = await addressApi.getList()
      if (addressRes.success) {
        addresses.value = addressRes.data || []
        address.value = addresses.value.find(a => a.is_default) || addresses.value[0] || null
      }
    } catch (e) {
      console.error('加载地址列表失败:', e)
      addresses.value = []
      address.value = null
    }
  } catch (e) {
    console.error('加载结算数据失败:', e)
  } finally {
    loading.value = false
  }
}

function selectAddress(addr) {
  address.value = addr
  showAddressPicker.value = false
}

async function handleSubmit() {
  if (!address.value) {
    if (addresses.value.length === 0) {
      toast.info('您还没有收货地址，正在为您创建默认地址...')
      await createDefaultAddress()
      if (!address.value) {
        toast.warning('请添加收货地址')
        return
      }
    } else {
      showAddressPicker.value = true
      toast.warning('请选择收货地址')
      return
    }
  }
  
  await submitOrder()
}

async function submitOrder() {
  submitting.value = true
  try {
    const res = await orderApi.create({
      productId: product.value.id,
      quantity: quantity.value,
      addressId: address.value?.id,
      type: route.query.type || 'normal',
      groupId: route.query.groupId
    })
    
    if (res.success) {
      const payRes = await orderApi.pay(res.data.id, 'wechat')
      if (payRes.success) {
        toast.success('支付成功')
        router.replace({ name: 'OrderSuccess', query: { orderId: res.data.id } })
      }
    }
  } catch (e) {
    console.error('下单失败:', e)
    toast.error('下单失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
