<template>
  <div class="min-h-screen bg-pdd-bg pb-24">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 border-b">
      <h1 class="text-center font-medium text-lg">购物车</h1>
    </div>

    <div v-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else-if="carts.length === 0" class="py-20">
      <Empty icon="🛒" text="购物车是空的" />
      <div class="text-center mt-4">
        <button @click="$router.push('/')" class="px-6 py-2 bg-pdd-red text-white rounded-full text-sm">
          去逛逛
        </button>
      </div>
    </div>

    <div v-else>
      <div class="space-y-2 px-3 py-2">
        <div
          v-for="item in carts"
          :key="item.id"
          class="bg-white rounded-lg p-3 flex items-center gap-3"
        >
          <button @click="toggleSelect(item)" class="text-xl">
            {{ item.selected ? '✅' : '⬜' }}
          </button>
          <img :src="item.product_image" class="w-20 h-20 object-cover rounded" @click="$router.push(`/product/${item.product_id}`)" />
          <div class="flex-1 min-w-0">
            <h3 class="text-sm text-gray-800 line-clamp-2">{{ item.product_name }}</h3>
            <div class="flex items-center justify-between mt-2">
              <span class="text-pdd-red font-bold">¥{{ item.price?.toFixed?.(2) || item.price }}</span>
              <div class="flex items-center gap-2">
                <button
                  @click="updateQuantity(item, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  class="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 disabled:text-gray-300"
                >
                  -
                </button>
                <span class="w-6 text-center text-sm">{{ item.quantity }}</span>
                <button
                  @click="updateQuantity(item, item.quantity + 1)"
                  :disabled="item.quantity >= item.stock"
                  class="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 disabled:text-gray-300"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 bg-white border-t z-40 px-3 py-2 safe-bottom">
      <div class="flex items-center gap-3">
        <button @click="toggleSelectAll" class="text-xl">
          {{ isAllSelected ? '✅' : '⬜' }}
        </button>
        <span class="text-sm">全选</span>
        <div class="flex-1 text-right">
          <span class="text-sm text-gray-500">合计: </span>
          <span class="text-pdd-red text-xl font-bold">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
        <button
          @click="goCheckout"
          :disabled="selectedCount === 0"
          class="px-6 py-2 bg-pdd-red text-white rounded-full text-sm font-medium disabled:bg-gray-300"
        >
          去结算({{ selectedCount }})
        </button>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../stores/toast'
import { cartApi } from '../api'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'
import TabBar from '../components/TabBar.vue'

const router = useRouter()
const toast = useToast()

const loading = ref(true)
const carts = ref([])

const selectedCount = computed(() => carts.value.filter(c => c.selected).length)
const isAllSelected = computed(() => carts.value.length > 0 && carts.value.every(c => c.selected))
const totalPrice = computed(() => {
  return carts.value
    .filter(c => c.selected)
    .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
})

async function loadCarts() {
  loading.value = true
  try {
    const res = await cartApi.getList()
    if (res.success) {
      carts.value = res.data || []
    }
  } catch (e) {
    console.error('加载购物车失败:', e)
  } finally {
    loading.value = false
  }
}

async function toggleSelect(item) {
  try {
    await cartApi.updateCart(item.id, undefined, !item.selected)
    item.selected = !item.selected
  } catch (e) {
    console.error('更新购物车失败:', e)
  }
}

async function toggleSelectAll() {
  const newSelected = !isAllSelected.value
  try {
    for (const item of carts.value) {
      if (item.selected !== newSelected) {
        await cartApi.updateCart(item.id, undefined, newSelected)
        item.selected = newSelected
      }
    }
  } catch (e) {
    console.error('全选失败:', e)
  }
}

async function updateQuantity(item, quantity) {
  if (quantity < 1 || quantity > item.stock) return
  
  try {
    await cartApi.updateCart(item.id, quantity, undefined)
    item.quantity = quantity
  } catch (e) {
    console.error('更新数量失败:', e)
  }
}

function goCheckout() {
  const selected = carts.value.filter(c => c.selected)
  if (selected.length === 0) {
    toast.warning('请选择要结算的商品')
    return
  }
  
  router.push({ name: 'Checkout', query: { productId: selected[0].product_id, quantity: selected[0].quantity } })
}

onMounted(() => {
  loadCarts()
})
</script>
