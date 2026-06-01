<template>
  <div class="order-confirm">
    <van-nav-bar title="确认订单" left-arrow @click-left="goBack" fixed placeholder />

    <van-cell-group inset class="address-group">
      <van-cell title="自提方式" :value="pickType === 1 ? '到店自提' : '送货上门'" is-link @click="showPickType = true" />
      <van-cell v-if="pickType === 1" title="自提地址" value="北京市朝阳区某某路123号柚诚小栈" />
      <van-cell v-if="pickType === 2" title="收货地址" is-link>
        <template #value>
          <span v-if="address">{{ address.name }} {{ address.phone }}<br>{{ address.detail }}</span>
          <span v-else class="add-address">请添加收货地址</span>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="goods-group">
      <div class="goods-item" v-for="item in cartItems" :key="item.id">
        <img :src="item.images?.[0]" :alt="item.name" class="goods-img" />
        <div class="goods-info">
          <div class="goods-name">{{ item.name }}</div>
          <div class="goods-price">¥{{ item.price }}</div>
          <div class="goods-quantity">x{{ item.quantity }}</div>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group inset class="coupon-group" @click="showCoupon = true">
      <van-cell title="优惠券" is-link>
        <template #value>
          <span v-if="selectedCoupon" class="coupon-selected">已选 -¥{{ selectedCoupon.value }}</span>
          <span v-else class="coupon-empty">{{ coupons.length }}张可用</span>
        </template>
      </van-cell>
    </van-cell-group>

    <van-field v-model="remark" label="备注" placeholder="选填，请输入备注信息" class="remark-field" />

    <div class="price-detail">
      <div class="price-row">
        <span>商品金额</span>
        <span>¥{{ totalAmount.toFixed(2) }}</span>
      </div>
      <div class="price-row" v-if="discountAmount > 0">
        <span>优惠金额</span>
        <span class="discount">-¥{{ discountAmount.toFixed(2) }}</span>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="total">
        <span>实付：</span>
        <span class="total-price">¥{{ payAmount.toFixed(2) }}</span>
      </div>
      <van-button type="primary" round class="submit-btn" @click="submitOrder">
        提交订单
      </van-button>
    </div>

    <van-popup v-model="showPickType" position="bottom">
      <div class="pick-popup">
        <div class="popup-title">选择提货方式</div>
        <div class="pick-option" :class="{ active: pickType === 1 }" @click="selectPickType(1)">
          <div class="option-title">到店自提</div>
          <div class="option-desc">到店自提，免配送费</div>
        </div>
        <div class="pick-option" :class="{ active: pickType === 2 }" @click="selectPickType(2)">
          <div class="option-title">送货上门</div>
          <div class="option-desc">配送费20元起</div>
        </div>
        <van-button type="primary" block round class="confirm-btn" @click="showPickType = false">
          确定
        </van-button>
      </div>
    </van-popup>

    <van-popup v-model="showCoupon" position="bottom" round>
      <div class="coupon-popup">
        <div class="popup-title">选择优惠券</div>
        <div class="coupon-list" v-if="coupons.length > 0">
          <div 
            class="coupon-item" 
            v-for="coupon in coupons" 
            :key="coupon.id" 
            :class="{ 
              selected: selectedCoupon?.id === coupon.id,
              disabled: totalAmount < coupon.min_amount 
            }" 
            @click="selectCoupon(coupon)"
          >
            <div class="coupon-left">
              <div class="coupon-value">
                <template v-if="coupon.type === 1">
                  <span class="symbol">¥</span>{{ coupon.value }}
                </template>
                <template v-else>
                  {{ Math.round(coupon.value * 10) }}<span class="symbol">折</span>
                </template>
              </div>
              <div class="coupon-condition">
                {{ coupon.min_amount > 0 ? '满' + coupon.min_amount + '可用' : '无门槛' }}
              </div>
            </div>
            <div class="coupon-right">
              <div class="coupon-name">{{ coupon.name }}</div>
              <div class="coupon-time">有效期至长期有效</div>
              <div class="coupon-tip" v-if="totalAmount < coupon.min_amount">
                还差¥{{ (coupon.min_amount - totalAmount).toFixed(2) }}可用
              </div>
            </div>
            <van-checkbox 
              v-model="coupon.selected" 
              :checked="selectedCoupon?.id === coupon.id" 
              :disabled="totalAmount < coupon.min_amount"
              class="coupon-check" 
            />
          </div>
        </div>
        <van-empty v-else description="暂无可用优惠券" />
        <van-button type="primary" block round class="confirm-btn" @click="showCoupon = false">
          确定
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import request from '@/utils/request';

const router = useRouter();
const route = useRoute();

const cartIds = ref([]);
const cartItems = ref([]);
const remark = ref('');
const pickType = ref(1);
const address = ref(null);
const showPickType = ref(false);
const showCoupon = ref(false);
const coupons = ref([]);
const selectedCoupon = ref(null);

const totalAmount = computed(() => cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const discountAmount = computed(() => {
  if (!selectedCoupon.value) return 0;
  if (totalAmount.value >= selectedCoupon.value.min_amount) {
    if (selectedCoupon.value.type === 1) {
      return selectedCoupon.value.value || 0;
    } else if (selectedCoupon.value.type === 2) {
      return Math.round(totalAmount.value * (1 - selectedCoupon.value.value) * 100) / 100;
    }
  }
  return 0;
});
const payAmount = computed(() => Math.max(0, totalAmount.value - discountAmount.value));

const getCartItems = async () => {
  const ids = route.query.cartIds?.split(',')?.map(Number) || [];
  cartIds.value = ids;
  const res = await request.get('/cart');
  cartItems.value = res.filter(item => ids.includes(item.id));
};

const getCoupons = async () => {
  try {
    const res = await request.get('/user/coupons', { params: { status: 0 } });
    coupons.value = res.map(c => ({ ...c, selected: false }));
  } catch (e) {
    console.error('获取优惠券失败', e);
  }
};

const selectPickType = (type) => {
  pickType.value = type;
};

const selectCoupon = (coupon) => {
  if (totalAmount.value < coupon.min_amount) {
    return;
  }
  if (selectedCoupon.value?.id === coupon.id) {
    selectedCoupon.value = null;
  } else {
    selectedCoupon.value = coupon;
  }
};

const submitOrder = async () => {
  if (cartItems.value.length === 0) {
    showToast('请选择商品');
    return;
  }
  try {
    const res = await request.post('/orders', {
      cartIds: cartIds.value,
      pickType: pickType.value,
      pickInfo: { name: '用户', phone: '13800138000', detail: '自提' },
      remark: remark.value,
      couponId: selectedCoupon.value?.id
    });
    showToast('下单成功');
    router.replace(`/orders`);
  } catch (e) {
    showToast('下单失败，请重试');
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  getCartItems();
  getCoupons();
});
</script>

<style scoped lang="less">
.order-confirm {
  padding-bottom: 70px;
}

.address-group, .goods-group, .coupon-group {
  margin-top: 10px;
}

.add-address {
  color: #ff6b35;
}

.goods-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.goods-img {
  width: 70px;
  height: 70px;
  border-radius: 6px;
  object-fit: cover;
}

.goods-info {
  flex: 1;
  margin-left: 12px;
  position: relative;
}

.goods-name {
  font-size: 14px;
  margin-bottom: 6px;
}

.goods-price {
  color: #ff6b35;
  font-size: 14px;
  font-weight: 600;
}

.goods-quantity {
  position: absolute;
  right: 0;
  bottom: 0;
  color: #999;
}

.remark-field {
  margin-top: 10px;
  background: #fff;
}

.price-detail {
  background: #fff;
  padding: 15px;
  margin-top: 10px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

.discount {
  color: #ff6b35;
}

.coupon-empty {
  color: #999;
}

.coupon-selected {
  color: #ff6b35;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.total {
  font-size: 14px;
}

.total-price {
  color: #ff6b35;
  font-size: 20px;
  font-weight: 600;
}

.submit-btn {
  width: 120px;
}

.pick-popup, .coupon-popup {
  padding: 20px;
  min-height: 250px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.pick-option {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;

  &.active {
    border-color: #ff6b35;
    background: #fff8f5;
  }
}

.option-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 5px;
}

.option-desc {
  font-size: 12px;
  color: #999;
}

.coupon-list {
  max-height: 300px;
  overflow-y: auto;
}

.coupon-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  position: relative;

  &.selected {
    border-color: #ff6b35;
    background: #fff8f5;
  }

  &.disabled {
    opacity: 0.6;
    background: #f5f5f5;
  }
}

.coupon-left {
  width: 80px;
  text-align: center;
  border-right: 1px dashed #eee;
  padding-right: 12px;
}

.coupon-value {
  color: #ff6b35;
  font-size: 24px;
  font-weight: 600;

  .symbol {
    font-size: 14px;
  }
}

.coupon-condition {
  font-size: 11px;
  color: #999;
}

.coupon-right {
  flex: 1;
  padding-left: 12px;
}

.coupon-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.coupon-time {
  font-size: 11px;
  color: #999;
}

.coupon-tip {
  font-size: 11px;
  color: #ff6b35;
  margin-top: 2px;
}

.coupon-check {
  margin-left: 10px;
}

.confirm-btn {
  height: 44px;
  margin-top: 20px;
}
</style>
