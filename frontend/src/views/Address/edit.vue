<template>
  <div class="address-edit-page page-container">
    <van-nav-bar title="编辑地址" left-arrow @click-left="goBack" :placeholder="true" />
    
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="收货人"
          placeholder="请输入收货人姓名"
          :rules="[{ required: true, message: '请输入收货人姓名' }]"
        />
        
        <van-field
          v-model="form.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }
          ]"
        />
        
        <van-field
          v-model="regionText"
          is-link
          readonly
          label="所在地区"
          placeholder="请选择省市区"
          @click="showPicker = true"
        />
        
        <van-field
          v-model="form.address"
          name="address"
          label="详细地址"
          placeholder="请输入详细地址"
          type="textarea"
          :rules="[{ required: true, message: '请输入详细地址' }]"
        />
        
        <van-cell title="设为默认地址">
          <template #right-icon>
            <van-switch v-model="form.is_default" active-color="#FF4D4F" />
          </template>
        </van-cell>
      </van-cell-group>
      
      <div style="margin: 16px;">
        <van-button round block type="primary" size="large" native-type="submit">
          保存
        </van-button>
      </div>
    </van-form>
    
    <van-popup
      v-model:show="showPicker"
      round
      position="bottom"
    >
      <van-picker
        title="选择地区"
        :columns="areaColumns"
        @confirm="onAreaConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import request from '@/utils/axios';

const router = useRouter();
const route = useRoute();

const addressId = route.params.id;
const showPicker = ref(false);

const form = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  is_default: false
});

const regionText = computed(() => {
  return [form.province, form.city, form.district].filter(Boolean).join(' ');
});

const areaColumns = [
  {
    text: '北京市',
    children: [
      { text: '北京市', children: [{ text: '东城区' }, { text: '西城区' }, { text: '朝阳区' }, { text: '海淀区' }] }
    ]
  },
  {
    text: '上海市',
    children: [
      { text: '上海市', children: [{ text: '黄浦区' }, { text: '徐汇区' }, { text: '浦东新区' }, { text: '静安区' }] }
    ]
  },
  {
    text: '广东省',
    children: [
      { text: '广州市', children: [{ text: '天河区' }, { text: '越秀区' }, { text: '海珠区' }] },
      { text: '深圳市', children: [{ text: '南山区' }, { text: '福田区' }, { text: '罗湖区' }] }
    ]
  },
  {
    text: '浙江省',
    children: [
      { text: '杭州市', children: [{ text: '西湖区' }, { text: '上城区' }, { text: '拱墅区' }] }
    ]
  }
];

const goBack = () => {
  router.back();
};

const onAreaConfirm = ({ selectedOptions }) => {
  const [province, city, district] = selectedOptions;
  form.province = province?.text || '';
  form.city = city?.text || '';
  form.district = district?.text || '';
  showPicker.value = false;
};

const fetchAddress = async () => {
  if (!addressId) return;
  
  try {
    const res = await request.get('/address');
    const addresses = res.data;
    const address = addresses.find(a => a.id == addressId);
    
    if (address) {
      form.name = address.name;
      form.phone = address.phone;
      form.province = address.province || '';
      form.city = address.city || '';
      form.district = address.district || '';
      form.address = address.address;
      form.is_default = address.is_default === 1;
    }
  } catch (error) {
    console.error('获取地址详情失败:', error);
  }
};

const onSubmit = async (values) => {
  if (!form.city) {
    showToast('请选择所在地区');
    return;
  }
  
  try {
    const data = {
      name: form.name,
      phone: form.phone,
      province: form.province,
      city: form.city,
      district: form.district,
      address: form.address,
      is_default: form.is_default ? 1 : 0
    };
    
    if (addressId) {
      await request.put(`/address/${addressId}`, data);
      showToast('修改成功');
    } else {
      await request.post('/address', data);
      showToast('添加成功');
    }
    
    router.back();
  } catch (error) {
    console.error('保存地址失败:', error);
  }
};

onMounted(() => {
  fetchAddress();
});
</script>

<style lang="less" scoped>
.address-edit-page {
  background: #f5f5f5;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

:deep(.van-cell-group) {
  margin-top: 12px;
}

:deep(.van-button) {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  --van-button-primary-background: #FF4D4F;
  --van-button-primary-border-color: #FF4D4F;
}
</style>
