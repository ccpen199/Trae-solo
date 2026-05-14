<template>
  <div class="address-container">
    <van-nav-bar title="收货地址" left-text="返回" @click-left="goBack" />

    <div class="address-list">
      <div 
        v-for="addr in addresses" 
        :key="addr.id" 
        class="address-card"
        @click="selectAddress(addr)"
      >
        <div class="address-header">
          <span class="address-name">{{ addr.name }}</span>
          <span class="address-phone">{{ addr.phone }}</span>
          <van-icon v-if="addr.isDefault" name="check" class="default-icon" />
        </div>
        <p class="address-detail">{{ addr.address }}</p>
        <div class="address-actions">
          <van-button type="default" size="small" @click.stop="editAddress(addr)">编辑</van-button>
          <van-button type="default" size="small" @click.stop="deleteAddress(addr)">删除</van-button>
        </div>
      </div>
    </div>

    <van-button type="primary" class="add-btn" @click="addAddress">
      <van-icon name="plus" />
      添加新地址
    </van-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { addresses as mockAddresses } from '@/data/mockData'
import { showToast } from 'vant'

const router = useRouter()

const addresses = ref([...mockAddresses])

const goBack = () => {
  router.back()
}

const selectAddress = (addr) => {
  showToast(`选择地址: ${addr.name}`)
}

const addAddress = () => {
  showToast('添加新地址')
}

const editAddress = (addr) => {
  showToast(`编辑地址: ${addr.name}`)
}

const deleteAddress = (addr) => {
  addresses.value = addresses.value.filter(a => a.id !== addr.id)
  showToast('已删除')
}
</script>

<style scoped>
.address-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.address-list {
  padding: 16px;
}

.address-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.address-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.address-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-right: 12px;
}

.address-phone {
  font-size: 14px;
  color: #666;
}

.default-icon {
  margin-left: auto;
  color: #ff6b35;
}

.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px;
}

.address-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.address-actions .van-button {
  padding: 4px 16px;
  font-size: 12px;
}

.add-btn {
  width: calc(100% - 32px);
  margin: 0 16px;
  border-radius: 25px;
  padding: 14px;
}
</style>
