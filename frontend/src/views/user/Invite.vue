<template>
  <div class="invite-page">
    <div class="invite-header">
      <div class="header-bg"></div>
      <van-icon name="arrow-left" size="20" color="#fff" class="back-icon" @click="goBack" />
      <div class="header-content">
        <div class="header-title">推荐有奖</div>
        <div class="header-subtitle">邀请好友得易捷币</div>
      </div>
    </div>

    <div class="invite-card">
      <div class="card-header">
        <div class="card-title">我的邀请码</div>
      </div>
      <div class="card-content">
        <div class="invite-code" @click="copyCode">
          {{ inviteCode }}
          <van-icon name="copy-o" size="16" color="#969799" />
        </div>
        <div class="invite-tip">点击复制邀请码</div>
      </div>
    </div>

    <div class="reward-section">
      <div class="section-title">邀请奖励</div>
      <div class="reward-list">
        <div class="reward-item">
          <div class="reward-icon">
            <van-icon name="gift-o" size="24" color="#ff6b6b" />
          </div>
          <div class="reward-info">
            <div class="reward-title">邀请新人注册</div>
            <div class="reward-desc">邀请好友完成注册，双方各得100易捷币</div>
          </div>
          <div class="reward-amount">+100</div>
        </div>
        <div class="reward-item">
          <div class="reward-icon">
            <van-icon name="new-fire-o" size="24" color="#ff9f43" />
          </div>
          <div class="reward-info">
            <div class="reward-title">邀请加油</div>
            <div class="reward-desc">好友首次加油满200元，额外奖励50易捷币</div>
          </div>
          <div class="reward-amount">+50</div>
        </div>
        <div class="reward-item">
          <div class="reward-icon">
            <van-icon name="shopping-cart-o" size="24" color="#4ecdc4" />
          </div>
          <div class="reward-info">
            <div class="reward-title">邀请购物</div>
            <div class="reward-desc">好友首次购物满100元，额外奖励30易捷币</div>
          </div>
          <div class="reward-amount">+30</div>
        </div>
      </div>
    </div>

    <div class="invite-stats">
      <div class="stat-item">
        <div class="stat-value">{{ inviteStats.invited_count || 0 }}</div>
        <div class="stat-label">已邀请</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ inviteStats.total_coins || 0 }}</div>
        <div class="stat-label">获得易捷币</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ inviteStats.completed_count || 0 }}</div>
        <div class="stat-label">完成奖励</div>
      </div>
    </div>

    <div class="invite-record" v-if="inviteList.length > 0">
      <div class="record-header">邀请记录</div>
      <div class="record-list">
        <div class="record-item" v-for="record in inviteList" :key="record.id">
          <div class="record-info">
            <div class="record-phone">{{ record.invitee_phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '新用户' }}</div>
            <div class="record-time">{{ record.created_at }}</div>
          </div>
          <div class="record-status">
            <van-tag :type="record.status === 'completed' ? 'success' : 'primary'" size="small">
              {{ record.status === 'completed' ? '已完成' : '进行中' }}
            </van-tag>
          </div>
        </div>
      </div>
    </div>

    <div class="invite-bottom">
      <van-button
        type="primary"
        block
        size="large"
        @click="handleShare"
        class="share-btn"
      >
        立即邀请好友
      </van-button>
    </div>

    <van-action-sheet v-model:show="showShareSheet" title="分享给好友">
      <div class="share-options">
        <div class="share-item" @click="shareByWechat">
          <van-icon name="wechat" size="40" color="#07c160" />
          <span>微信好友</span>
        </div>
        <div class="share-item" @click="shareByMoments">
          <van-icon name="comments-o" size="40" color="#07c160" />
          <span>朋友圈</span>
        </div>
        <div class="share-item" @click="shareByQrcode">
          <van-icon name="qr" size="40" color="#1989fa" />
          <span>二维码</span>
        </div>
        <div class="share-item" @click="shareByLink">
          <van-icon name="link" size="40" color="#969799" />
          <span>复制链接</span>
        </div>
      </div>
    </van-action-sheet>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { createInvite } from '../../api/user'

const router = useRouter()

const loading = ref(false)
const showShareSheet = ref(false)

const inviteCode = ref('YJ2024001')
const inviteStats = ref({
  invited_count: 0,
  total_coins: 0,
  completed_count: 0
})
const inviteList = ref([
  { id: 1, invitee_phone: '13800138001', created_at: '2024-01-15 10:30', status: 'completed' },
  { id: 2, invitee_phone: '13900139002', created_at: '2024-01-14 15:20', status: 'pending' }
])

const goBack = () => {
  router.back()
}

const copyCode = () => {
  const textarea = document.createElement('textarea')
  textarea.value = inviteCode.value
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    showToast('复制成功')
  } catch (err) {
    showToast('复制失败，请手动复制')
  }
  document.body.removeChild(textarea)
}

const handleShare = () => {
  showShareSheet.value = true
}

const shareByWechat = () => {
  showToast('请使用微信扫码分享')
  showShareSheet.value = false
}

const shareByMoments = () => {
  showToast('请使用微信朋友圈分享')
  showShareSheet.value = false
}

const shareByQrcode = () => {
  showToast('生成邀请二维码')
  showShareSheet.value = false
}

const shareByLink = () => {
  const link = `https://yijie.com/invite?code=${inviteCode.value}`
  const textarea = document.createElement('textarea')
  textarea.value = link
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    showToast('链接已复制')
  } catch (err) {
    showToast('复制失败')
  }
  document.body.removeChild(textarea)
  showShareSheet.value = false
}

const fetchInviteInfo = async () => {
  loading.value = true
  try {
    const res = await createInvite()
    if (res.data?.code) {
      inviteCode.value = res.data.code
    }
  } catch (error) {
    console.error('获取邀请信息失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInviteInfo()
})
</script>

<style lang="less" scoped>
.invite-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.invite-header {
  position: relative;
  padding: 20px 16px 60px;
  background: linear-gradient(180deg, #1989fa, #409eff);

  .header-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: #f5f5f5;
    border-radius: 40px 40px 0 0;
  }

  .back-icon {
    position: absolute;
    top: 20px;
    left: 16px;
    z-index: 10;
  }

  .header-content {
    text-align: center;

    .header-title {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }

    .header-subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.invite-card {
  background: #fff;
  margin: -40px 16px 16px;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(25, 137, 250, 0.15);

  .card-header {
    margin-bottom: 16px;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #323233;
    }
  }

  .card-content {
    text-align: center;

    .invite-code {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 32px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
      color: #fff;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 4px;
      border-radius: 8px;
      cursor: pointer;
    }

    .invite-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #969799;
    }
  }
}

.reward-section {
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px;
  border-radius: 12px;

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 16px;
  }

  .reward-list {
    .reward-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f7f8fa;

      &:last-child {
        border-bottom: none;
      }

      .reward-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #f7f8fa;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }

      .reward-info {
        flex: 1;

        .reward-title {
          font-size: 14px;
          font-weight: 500;
          color: #323233;
          margin-bottom: 4px;
        }

        .reward-desc {
          font-size: 12px;
          color: #969799;
        }
      }

      .reward-amount {
        font-size: 18px;
        font-weight: 600;
        color: #ff6b6b;
      }
    }
  }
}

.invite-stats {
  display: flex;
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px 0;
  border-radius: 12px;

  .stat-item {
    flex: 1;
    text-align: center;

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #1989fa;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #969799;
    }
  }
}

.invite-record {
  background: #fff;
  margin: 0 12px;
  border-radius: 12px;

  .record-header {
    padding: 16px;
    font-size: 15px;
    font-weight: 600;
    color: #323233;
    border-bottom: 1px solid #f7f8fa;
  }

  .record-list {
    .record-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #f7f8fa;

      &:last-child {
        border-bottom: none;
      }

      .record-info {
        .record-phone {
          font-size: 14px;
          color: #323233;
          margin-bottom: 4px;
        }

        .record-time {
          font-size: 12px;
          color: #969799;
        }
      }
    }
  }
}

.invite-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);

  .share-btn {
    border-radius: 24px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
    border: none;
  }
}

.share-options {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;

  .share-item {
    width: 25%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    cursor: pointer;

    span {
      margin-top: 8px;
      font-size: 12px;
      color: #646566;
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
