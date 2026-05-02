<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { request } from '@/utils/api'
import { showToast, showLoadingToast, closeToast } from 'vant'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

const tableId = ref('')
const loading = ref(false)

const handleScan = async () => {
  if (!tableId.value.trim()) {
    showToast('请输入桌号')
    return
  }

  loading.value = true
  showLoadingToast({
    message: '正在获取桌台信息...',
    forbidClick: true,
  })

  try {
    const table = await request.get(`/tables/number/${tableId.value.trim()}`)

    if (table) {
      cartStore.setTableInfo(table.id, table.tableNumber)
      cartStore.loadFromLocalStorage()

      closeToast()
      showToast({ message: `欢迎光临，桌号 ${table.tableNumber}` })

      const redirect = route.query.redirect as string
      router.push(redirect || '/menu')
    }
  } catch (error: any) {
    closeToast()
    showToast({ message: error.response?.data?.message || '桌台不存在', type: 'fail' })
  } finally {
    loading.value = false
  }
}

const mockScan = () => {
  tableId.value = 'A01'
  handleScan()
}

onMounted(() => {
  if (cartStore.tableId) {
    cartStore.loadFromLocalStorage()
    router.push('/menu')
  }
})
</script>

<template>
  <div class="scan-page">
    <div class="scan-header">
      <div class="logo">
        <van-icon name="shop-o" size="60" color="#ff6b00" />
      </div>
      <h1>欢迎光临</h1>
      <p class="subtitle">请扫描桌台二维码开始点餐</p>
    </div>

    <div class="scan-content">
      <div class="scan-area">
        <van-icon name="scan" size="80" color="#999" />
        <p>将二维码放入框内</p>
      </div>

      <div class="manual-input">
        <p class="label">手动输入桌号</p>
        <van-field
          v-model="tableId"
          placeholder="请输入桌号，如：A01"
          clearable
          maxlength="10"
          class="table-input"
        >
          <template #button>
            <van-button type="primary" size="small" @click="handleScan" :loading="loading">
            确认
          </van-button>
          </template>
        </van-field>
      </div>

      <div class="quick-enter">
        <p class="label">快速体验</p>
        <div class="quick-tables">
          <van-tag type="primary" size="large" @click="mockScan">
            桌号 A01
          </van-tag>
          <van-tag type="primary" size="large" @click="() => { tableId.value = 'A02'; handleScan() }">
            桌号 A02
          </van-tag>
          <van-tag type="primary" size="large" @click="() => { tableId.value = 'B01'; handleScan() }">
            桌号 B01
          </van-tag>
        </div>
      </div>
    </div>

    <div class="scan-footer">
      <p>技术支持：餐饮点餐收银系统</p>
    </div>
  </div>
</template>

<style scoped>
.scan-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fff5e6 0%, #ffffff 100%);
}

.scan-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;

  .logo {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(255, 107, 0, 0.2);
    margin-bottom: 24px;
  }

  h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 600;
    color: #333;
  }

  .subtitle {
    margin: 0;
    font-size: 14px;
    color: #999;
  }
}

.scan-content {
  padding: 0 20px 40px;
}

.scan-area {
  width: 200px;
  height: 200px;
  margin: 0 auto 32px;
  border: 2px dashed #ddd;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #fafafa;

  p {
    margin: 0;
    font-size: 14px;
    color: #999;
  }
}

.manual-input,
.quick-enter {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;

  .label {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .table-input {
    :deep(.van-field__control) {
      font-size: 18px;
    }
  }
}

.quick-tables {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.scan-footer {
  text-align: center;
  padding: 20px;

  p {
    margin: 0;
    font-size: 12px;
    color: #ccc;
  }
}
</style>
