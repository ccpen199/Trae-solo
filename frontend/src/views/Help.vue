<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">帮助中心</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="search-bar">
        <input type="text" placeholder="搜索问题" v-model="searchKeyword" @keyup.enter="handleSearch" />
      </div>

      <div class="contact-section">
        <div class="contact-title">联系客服</div>
        <div class="contact-list">
          <div class="contact-item">
            <span class="contact-icon">💬</span>
            <div class="contact-info">
              <div class="contact-name">在线客服</div>
              <div class="contact-desc">9:00-21:00在线</div>
            </div>
          </div>
          <div class="contact-item">
            <span class="contact-icon">📞</span>
            <div class="contact-info">
              <div class="contact-name">客服电话</div>
              <div class="contact-desc">400-888-8888</div>
            </div>
          </div>
        </div>
      </div>

      <div class="faq-section">
        <div class="faq-title">常见问题</div>
        <div 
          class="faq-item" 
          v-for="(item, index) in faqList" 
          :key="index"
          @click="toggleFaq(index)"
        >
          <div class="faq-question">
            <span class="faq-icon">{{ item.icon }}</span>
            <span class="faq-text">{{ item.question }}</span>
            <span class="faq-arrow" :class="{ open: expandedIndex === index }">›</span>
          </div>
          <div v-if="expandedIndex === index" class="faq-answer">
            {{ item.answer }}
          </div>
        </div>
      </div>

      <div class="quick-section">
        <div class="quick-title">快捷服务</div>
        <div class="quick-grid">
          <div class="quick-item" v-for="item in quickServices" :key="item.name" @click="handleQuickService(item)">
            <span class="quick-icon">{{ item.icon }}</span>
            <span class="quick-name">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../components/TabBar.vue'

const router = useRouter()

const searchKeyword = ref('')
const expandedIndex = ref(null)

const faqList = ref([
  {
    icon: '📦',
    question: '如何申请退款？',
    answer: '您可以在"我的订单"中找到需要退款的订单，点击"申请退款"按钮，填写退款原因后提交申请。客服会在1-3个工作日内处理您的申请。'
  },
  {
    icon: '🚚',
    question: '什么时候发货？',
    answer: '一般情况下，您的订单会在24小时内发货（特殊商品除外）。发货后您会收到短信通知，可以在"我的订单"中查看物流信息。'
  },
  {
    icon: '💰',
    question: '优惠券怎么使用？',
    answer: '在结算页面，您可以选择已有的优惠券进行抵扣。请注意每张优惠券都有使用条件和有效期，请在有效期内使用。'
  },
  {
    icon: '🔒',
    question: '忘记密码怎么办？',
    answer: '在登录页面点击"忘记密码"，您可以通过绑定的手机号或邮箱找回密码。建议使用字母+数字+特殊字符的组合密码来保障账户安全。'
  },
  {
    icon: '⭐',
    question: '积分有什么用？',
    answer: '积分可以在积分商城兑换优惠券和实物商品。您可以通过购物、签到、评价等方式获得积分。'
  }
])

const quickServices = ref([
  { name: '订单查询', icon: '📋', path: '/orders' },
  { name: '物流查询', icon: '🚚', path: '/orders' },
  { name: '修改地址', icon: '📍', path: '/profile' },
  { name: '发票服务', icon: '📄', path: '/profile' },
  { name: '售后服务', icon: '🔧', path: '/orders' },
  { name: '意见反馈', icon: '💡', path: '/' },
  { name: '关于我们', icon: 'ℹ️', path: '/' },
  { name: '更多服务', icon: '📌', path: '/' }
])

function goBack() {
  router.back()
}

function handleSearch() {
  if (searchKeyword.value.trim()) {
    const event = new CustomEvent('showToast', { detail: `搜索"${searchKeyword.value}"` })
    window.dispatchEvent(event)
  }
}

function toggleFaq(index) {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

function handleQuickService(item) {
  if (item.path && item.path !== '/') {
    router.push(item.path)
  } else {
    const event = new CustomEvent('showToast', { detail: `${item.name}功能开发中` })
    window.dispatchEvent(event)
  }
}
</script>

<style scoped>
.content {
  padding-top: 54px;
  padding-bottom: 60px;
}

.search-bar {
  padding: 15px;
  background: #fff;
}

.search-bar input {
  width: 100%;
  height: 40px;
  padding: 0 15px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 14px;
  outline: none;
}

.contact-section {
  background: #fff;
  margin-top: 10px;
  padding: 15px;
}

.contact-title, .faq-title, .quick-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.contact-icon {
  font-size: 28px;
  margin-right: 15px;
}

.contact-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 3px;
}

.contact-desc {
  font-size: 12px;
  color: var(--gray-color);
}

.faq-section, .quick-section {
  background: #fff;
  margin-top: 10px;
  padding: 15px;
}

.faq-item {
  border-bottom: 1px solid var(--border-color);
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-question {
  display: flex;
  align-items: center;
  padding: 15px 0;
}

.faq-icon {
  font-size: 20px;
  margin-right: 10px;
}

.faq-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.faq-arrow {
  font-size: 20px;
  color: var(--gray-color);
  transform: rotate(90deg);
  transition: transform 0.3s;
}

.faq-arrow.open {
  transform: rotate(-90deg);
}

.faq-answer {
  padding: 0 30px 15px;
  font-size: 13px;
  color: var(--gray-color);
  line-height: 1.6;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.quick-icon {
  font-size: 28px;
  margin-bottom: 5px;
}

.quick-name {
  font-size: 12px;
  color: #333;
}
</style>
