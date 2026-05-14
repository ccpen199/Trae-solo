<template>
  <div class="min-h-screen bg-pdd-bg">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 border-b flex items-center">
      <button @click="$router.back()" class="text-xl">←</button>
      <h1 class="flex-1 text-center font-medium">收货地址</h1>
      <button @click="showAddModal = true" class="text-pdd-red text-sm">+ 新增</button>
    </div>

    <div v-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else-if="addresses.length === 0" class="py-20">
      <Empty icon="📍" text="暂无收货地址" />
      <div class="text-center mt-4">
        <button @click="showAddModal = true" class="px-6 py-2 bg-pdd-red text-white rounded-full text-sm">
          添加地址
        </button>
      </div>
    </div>

    <div v-else class="p-3 space-y-2">
      <div
        v-for="addr in addresses"
        :key="addr.id"
        class="bg-white rounded-lg p-3"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ addr.name }}</span>
          <span class="text-gray-500 text-sm">{{ addr.phone }}</span>
          <span v-if="addr.is_default" class="px-2 py-0.5 bg-pdd-red/10 text-pdd-red text-xs rounded">默认</span>
        </div>
        <p class="text-sm text-gray-600 mt-1">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
        <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <button @click="setDefault(addr)" class="flex items-center gap-1">
            <span>{{ addr.is_default ? '☑️' : '⬜' }}</span>
            <span>设为默认</span>
          </button>
          <button @click="editAddress(addr)" class="flex items-center gap-1">
            <span>✏️</span>
            <span>编辑</span>
          </button>
          <button @click="deleteAddress(addr.id)" class="flex items-center gap-1">
            <span>🗑️</span>
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div class="w-full bg-white rounded-t-xl p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium">{{ editingId ? '编辑地址' : '新增地址' }}</h3>
          <button @click="closeModal" class="text-xl">✕</button>
        </div>
        <div class="space-y-3">
          <input
            v-model="form.name"
            type="text"
            placeholder="收货人姓名"
            class="w-full px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <input
            v-model="form.phone"
            type="tel"
            placeholder="手机号码"
            class="w-full px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <div class="flex gap-2">
            <input
              v-model="form.province"
              type="text"
              placeholder="省份"
              class="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
            />
            <input
              v-model="form.city"
              type="text"
              placeholder="城市"
              class="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
            />
          </div>
          <input
            v-model="form.district"
            type="text"
            placeholder="区县"
            class="w-full px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <textarea
            v-model="form.detail"
            placeholder="详细地址"
            rows="2"
            class="w-full px-3 py-2 border border-gray-200 rounded text-sm resize-none"
          ></textarea>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.is_default" />
            <span>设为默认地址</span>
          </label>
        </div>
        <div class="mt-4">
          <button
            @click="saveAddress"
            :disabled="submitting"
            class="w-full py-2 bg-pdd-red text-white rounded-full text-sm disabled:bg-gray-300"
          >
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useToast } from '../stores/toast'
import { addressApi } from '../api'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'

const toast = useToast()

const loading = ref(true)
const addresses = ref([])
const showAddModal = ref(false)
const editingId = ref(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
})

async function loadAddresses() {
  loading.value = true
  try {
    const res = await addressApi.getList()
    if (res.success) {
      addresses.value = res.data || []
    }
  } catch (e) {
    console.error('加载地址列表失败:', e)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.phone = ''
  form.province = ''
  form.city = ''
  form.district = ''
  form.detail = ''
  form.is_default = false
  editingId.value = null
}

function editAddress(addr) {
  editingId.value = addr.id
  form.name = addr.name
  form.phone = addr.phone
  form.province = addr.province
  form.city = addr.city
  form.district = addr.district
  form.detail = addr.detail
  form.is_default = addr.is_default
  showAddModal.value = true
}

function closeModal() {
  showAddModal.value = false
  resetForm()
}

async function saveAddress() {
  if (!form.name || !form.phone || !form.detail) {
    toast.warning('请填写完整信息')
    return
  }

  submitting.value = true
  try {
    let res
    if (editingId.value) {
      res = await addressApi.update(editingId.value, form)
    } else {
      res = await addressApi.create(form)
    }
    
    if (res.success) {
      toast.success('保存成功')
      closeModal()
      loadAddresses()
    }
  } catch (e) {
    console.error('保存地址失败:', e)
  } finally {
    submitting.value = false
  }
}

async function setDefault(addr) {
  try {
    const res = await addressApi.setDefault(addr.id)
    if (res.success) {
      toast.success('设置成功')
      loadAddresses()
    }
  } catch (e) {
    console.error('设置默认地址失败:', e)
  }
}

async function deleteAddress(id) {
  try {
    const res = await addressApi.delete(id)
    if (res.success) {
      toast.success('删除成功')
      loadAddresses()
    }
  } catch (e) {
    console.error('删除地址失败:', e)
  }
}

onMounted(() => {
  loadAddresses()
})
</script>
