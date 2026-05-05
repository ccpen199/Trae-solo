<template>
  <div class="address-page page-container">
    <van-nav-bar title="收货地址" left-arrow @click-left="goBack" :placeholder="true" />
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div v-if="addresses.length > 0" class="address-list">
        <van-cell-group inset>
          <van-cell
            v-for="address in addresses"
            :key="address.id"
            is-link
            @click="handleSelect(address)"
          >
            <template #title>
              <div class="address-header flex-between">
                <span class="name">{{ address.name }}</span>
                <span class="phone">{{ address.phone }}</span>
              </div>
              <div class="address-detail">{{ address.province }} {{ address.city }} {{ address.district }} {{ address.address }}</div>
              <div v-if="address.is_default" class="address-tags">
                <van-tag type="danger" size="small">默认</van-tag>
              </div>
            </template>
            <template #right-icon>
              <div class="actions flex">
                <van-icon name="edit" size="18" color="#999" @click.stop="goEdit(address)" />
                <van-icon name="delete-o" size="18" color="#999" @click.stop="handleDelete(address)" />
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
      
      <van-empty v-else description="暂无收货地址" />
    </van-pull-refresh>
    
    <div class="bottom-bar bottom-nav safe-bottom bg-white">
      <van-button type="primary" block size="large" @click="goAdd">
        新增收货地址
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import request from '@/utils/axios';

const router = useRouter();
const route = useRoute();

const addresses = ref([]);
const refreshing = ref(false);

const goBack = () => {
  router.back();
};

const goAdd = () => {
  router.push('/address/add');
};

const goEdit = (address) => {
  router.push(`/address/edit/${address.id}`);
};

const handleSelect = (address) => {
  const selectMode = route.query.select;
  if (selectMode === '1') {
    localStorage.setItem('selectedAddress', JSON.stringify(address));
    router.back();
  }
};

const handleDelete = async (address) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要删除该地址吗？'
    });
    
    await request.delete(`/address/${address.id}`);
    showToast('删除成功');
    fetchAddresses();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除地址失败:', error);
    }
  }
};

const fetchAddresses = async () => {
  try {
    const res = await request.get('/address');
    addresses.value = res.data;
  } catch (error) {
    console.error('获取地址列表失败:', error);
  } finally {
    refreshing.value = false;
  }
};

const onRefresh = () => {
  fetchAddresses();
};

onMounted(() => {
  fetchAddresses();
});
</script>

<style lang="less" scoped>
.address-page {
  padding-bottom: 70px;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.address-list {
  padding: 12px;
  
  :deep(.van-cell) {
    padding: 12px;
  }
  
  .address-header {
    margin-bottom: 4px;
    
    .name {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
    
    .phone {
      font-size: 14px;
      color: #666;
    }
  }
  
  .address-detail {
    font-size: 13px;
    color: #666;
    line-height: 1.6;
  }
  
  .address-tags {
    margin-top: 6px;
  }
  
  .actions {
    gap: 16px;
  }
}

.bottom-bar {
  padding: 8px 16px;
  border-top: 1px solid #eee;
  
  :deep(.van-button) {
    height: 44px;
    border-radius: 22px;
    font-size: 15px;
    font-weight: 600;
    --van-button-primary-background: #FF4D4F;
    --van-button-primary-border-color: #FF4D4F;
  }
}
</style>
