<template>
  <div class="points-exchange-page">
    <div class="page-header">
      <van-icon name="arrow-left" size="20" @click="goBack" />
      <div class="header-title">积分兑换</div>
    </div>

    <div class="points-card">
      <div class="card-left">
        <div class="points-label">我的积分</div>
        <div class="points-value">{{ userStore.userInfo?.points || 0 }}</div>
      </div>
      <div class="card-right">
        <div class="coins-label">易捷币</div>
        <div class="coins-value">{{ userStore.userInfo?.yijie_coins || 0 }}</div>
      </div>
    </div>

    <div class="rule-section">
      <div class="rule-title">兑换规则</div>
      <div class="rule-list">
        <div class="rule-item">
          <van-icon name="info-o" size="14" color="#1989fa" />
          <span>100积分可兑换1元无门槛优惠券</span>
        </div>
        <div class="rule-item">
          <van-icon name="info-o" size="14" color="#1989fa" />
          <span>500积分可兑换10元加油券</span>
        </div>
        <div class="rule-item">
          <van-icon name="info-o" size="14" color="#1989fa" />
          <span>1000积分可兑换25元商品券</span>
        </div>
        <div class="rule-item">
          <van-icon name="info-o" size="14" color="#1989fa" />
          <span>积分兑换的优惠券有效期为30天</span>
        </div>
      </div>
    </div>

    <div class="exchange-section">
      <div class="section-header">
        <span class="section-title">可兑换商品</span>
      </div>
      <div class="exchange-list">
        <div class="exchange-item" v-for="item in exchangeList" :key="item.id">
          <img :src="item.image" class="item-image" />
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-desc">{{ item.description }}</div>
            <div class="item-points">
              <span class="points-required">{{ item.points_required }}积分</span>
              <span class="original-value" v-if="item.original_value">价值¥{{ item.original_value }}</span>
            </div>
          </div>
          <van-button
            size="small"
            type="primary"
            :disabled="(userStore.userInfo?.points || 0) < item.points_required"
            @click="handleExchange(item)"
            class="exchange-btn"
          >
            兑换
          </van-button>
        </div>
      </div>
    </div>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { getPointsExchange, exchangePoints } from '../../api/user'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const exchangeList = ref([
  {
    id: 1,
    name: '5元无门槛券',
    description: '全场通用，满0元可用',
    points_required: 500,
    original_value: 5,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coupon%20voucher%20icon%20yellow%20gold&image_size=square'
  },
  {
    id: 2,
    name: '10元加油券',
    description: '加油满100元可用',
    points_required: 1000,
    original_value: 10,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fuel%20gas%20station%20coupon%20icon%20blue&image_size=square'
  },
  {
    id: 3,
    name: '20元商品券',
    description: '便利店商品满100元可用',
    points_required: 2000,
    original_value: 20,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shopping%20discount%20coupon%20icon%20green&image_size=square'
  },
  {
    id: 4,
    name: '矿泉水一提',
    description: '农夫山泉550ml*12瓶',
    points_required: 3000,
    original_value: 30,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mineral%20water%20bottles%20product%20photo&image_size=square'
  }
])

const goBack = () => {
  router.back()
}

const handleExchange = async (item) => {
  try {
    await showDialog({
      title: '确认兑换',
      message: `确定用${item.points_required}积分兑换"${item.name}"吗？`
    })

    loading.value = true
    const res = await exchangePoints({ exchangeId: item.id })
    
    if (res.code === 200) {
      showToast('兑换成功！')
      if (userStore.userInfo) {
        userStore.userInfo.points = (userStore.userInfo.points || 0) - item.points_required
        userStore.setUserInfo(userStore.userInfo)
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('兑换失败:', error)
      showToast(error.message || '兑换失败')
    }
  } finally {
    loading.value = false
  }
}

const fetchExchangeList = async () => {
  loading.value = true
  try {
    const res = await getPointsExchange()
    if (res.data?.list) {
      exchangeList.value = res.data.list
    }
  } catch (error) {
    console.error('获取兑换列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchExchangeList()
})
</script>

<style lang="less" scoped>
.points-exchange-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;

  .header-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    margin-right: 20px;
  }
}

.points-card {
  display: flex;
  background: linear-gradient(135deg, #1989fa, #409eff);
  margin: 12px;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.2);

  .card-left,
  .card-right {
    flex: 1;
    text-align: center;

    .points-label,
    .coins-label {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
    }

    .points-value,
    .coins-value {
      font-size: 32px;
      font-weight: 600;
      color: #fff;
    }
  }

  .card-left {
    border-right: 1px solid rgba(255, 255, 255, 0.2);
  }
}

.rule-section {
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px;
  border-radius: 12px;

  .rule-title {
    font-size: 15px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 12px;
  }

  .rule-list {
    .rule-item {
      display: flex;
      align-items: flex-start;
      padding: 8px 0;
      font-size: 13px;
      color: #646566;

      .van-icon {
        margin-right: 8px;
        margin-top: 2px;
        flex-shrink: 0;
      }
    }
  }
}

.exchange-section {
  background: #fff;
  margin: 0 12px;
  border-radius: 12px;
  overflow: hidden;

  .section-header {
    padding: 16px;
    border-bottom: 1px solid #f7f8fa;

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #323233;
    }
  }

  .exchange-list {
    .exchange-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #f7f8fa;

      &:last-child {
        border-bottom: none;
      }

      .item-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        object-fit: cover;
        margin-right: 12px;
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-right: 12px;

        .item-name {
          font-size: 14px;
          font-weight: 500;
          color: #323233;
          margin-bottom: 4px;
        }

        .item-desc {
          font-size: 12px;
          color: #969799;
          margin-bottom: 8px;
        }

        .item-points {
          .points-required {
            font-size: 15px;
            font-weight: 600;
            color: #ff6b6b;
          }

          .original-value {
            margin-left: 8px;
            font-size: 12px;
            color: #969799;
            text-decoration: line-through;
          }
        }
      }

      .exchange-btn {
        border-radius: 12px;
        min-width: 60px;
      }
    }
  }
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
