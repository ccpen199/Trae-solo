<template>
  <div class="address-add-container">
    <van-nav-bar title="新增地址" left-text="返回" @click-left="goBack" />
    
    <van-form @submit="onSubmit">
      <van-cell-group>
        <van-field 
          v-model="form.name" 
          placeholder="收货人姓名" 
          required
        />
        <van-field 
          v-model="form.phone" 
          placeholder="手机号码" 
          type="tel"
          maxlength="11"
          required
        />
        <van-field 
          v-model="form.province" 
          placeholder="省份" 
        />
        <van-field 
          v-model="form.city" 
          placeholder="城市" 
        />
        <van-field 
          v-model="form.district" 
          placeholder="区县" 
        />
        <van-field 
          v-model="form.detail" 
          placeholder="详细地址（街道、门牌号等）" 
          required
        />
        <van-cell title="设为默认地址" right-icon>
          <van-switch v-model="form.isDefault" />
        </van-cell>
      </van-cell-group>
      
      <div class="form-actions">
        <van-button type="primary" block native-type="submit">保存地址</van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Form, Field, CellGroup, Cell, Switch, Button, showToast } from 'vant'
import { addressApi } from '../services/api'

const router = useRouter()
const form = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

const goBack = () => {
  router.back()
}

const onSubmit = () => {
  if (!form.name) {
    showToast('请输入收货人姓名')
    return
  }
  
  if (!form.phone) {
    showToast('请输入手机号码')
    return
  }
  
  if (!form.detail) {
    showToast('请输入详细地址')
    return
  }
  
  addressApi.addAddress({
    name: form.name,
    phone: form.phone,
    province: form.province,
    city: form.city,
    district: form.district,
    detail: form.detail,
    isDefault: form.isDefault ? 1 : 0
  }).then(res => {
    if (res.code === 200) {
      showToast('地址添加成功')
      router.back()
    } else {
      showToast(res.message)
    }
  }).catch(() => {
    showToast('添加失败')
  })
}
</script>

<style scoped>
.address-add-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.form-actions {
  padding: 20px;
}
</style>