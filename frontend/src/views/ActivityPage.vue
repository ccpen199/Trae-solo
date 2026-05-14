<template>
  <div class="min-h-screen bg-pdd-bg">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 border-b flex items-center">
      <button @click="$router.back()" class="text-xl">←</button>
      <h1 class="flex-1 text-center font-medium">{{ pageTitle }}</h1>
      <div class="w-6"></div>
    </div>

    <div v-if="type === 'orchard'">
      <div class="bg-gradient-to-b from-green-400 to-green-600 p-6 text-white text-center">
        <div class="text-6xl mb-4">🌳</div>
        <h2 class="text-xl font-bold mb-2">多多果园</h2>
        <p class="text-white/80 text-sm">浇水种树，水果免费送到家</p>
      </div>
      <div class="bg-white mx-3 mt-3 rounded-xl p-6 text-center">
        <div class="text-4xl mb-4">🍎</div>
        <p class="text-gray-600 mb-4">当前进度: 60%</p>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div class="bg-pdd-red h-3 rounded-full" style="width: 60%"></div>
        </div>
        <button class="mt-4 px-8 py-2 bg-green-500 text-white rounded-full">
          去浇水
        </button>
      </div>
    </div>

    <div v-if="type === 'bargain'">
      <div class="bg-gradient-to-b from-pdd-red to-red-600 p-6 text-white text-center">
        <div class="text-6xl mb-4">🔪</div>
        <h2 class="text-xl font-bold mb-2">砍价免费拿</h2>
        <p class="text-white/80 text-sm">邀请好友砍价，免费拿好货</p>
      </div>
      <div class="bg-white mx-3 mt-3 rounded-xl p-4">
        <h3 class="font-medium mb-3">热门商品</h3>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="i in 4" :key="i" class="bg-gray-50 rounded-lg p-2 text-center">
            <div class="text-4xl">🎁</div>
            <p class="text-xs text-gray-600 mt-2">价值 ¥{{ 100 + i * 50 }} 商品</p>
            <p class="text-pdd-red text-sm font-medium">还差 {{ 10 - i * 2 }} 人</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="type === 'cash'">
      <div class="bg-gradient-to-b from-yellow-400 to-orange-500 p-6 text-white text-center">
        <div class="text-6xl mb-4">💵</div>
        <h2 class="text-xl font-bold mb-2">天天领现金</h2>
        <p class="text-white/80 text-sm">分享给好友，现金马上到账</p>
      </div>
      <div class="bg-white mx-3 mt-3 rounded-xl p-6 text-center">
        <div class="text-5xl font-bold text-pdd-red mb-2">¥99.50</div>
        <p class="text-gray-500 text-sm">再邀请 1 位好友，即可提现</p>
        <button class="mt-4 px-8 py-2 bg-pdd-red text-white rounded-full">
          去邀请
        </button>
      </div>
    </div>

    <div v-if="type === 'game'">
      <div class="bg-gradient-to-b from-pink-400 to-purple-500 p-6 text-white text-center">
        <div class="text-6xl mb-4">🎮</div>
        <h2 class="text-xl font-bold mb-2">多多爱消除</h2>
        <p class="text-white/80 text-sm">玩游戏赢红包，边玩边赚</p>
      </div>
      <div class="bg-white mx-3 mt-3 rounded-xl p-6 text-center">
        <div class="text-4xl mb-4">⭐</div>
        <p class="text-gray-600 mb-2">当前关卡: 第 123 关</p>
        <p class="text-pdd-red text-xl font-bold">累计获得: ¥8.50</p>
        <button class="mt-4 px-8 py-2 bg-pdd-red text-white rounded-full">
          开始游戏
        </button>
      </div>
    </div>

    <div v-if="type === 'coupon'">
      <div class="bg-white p-3 space-y-2">
        <div v-for="i in 5" :key="i" class="bg-white border rounded-lg p-3 flex">
          <div class="bg-pdd-red text-white text-center px-4 py-2 rounded-l-lg">
            <div class="text-2xl font-bold">{{ 10 * i }}</div>
            <div class="text-xs">优惠券</div>
          </div>
          <div class="flex-1 px-3">
            <h4 class="font-medium">满{{ 50 * i }}减{{ 10 * i }}</h4>
            <p class="text-xs text-gray-400 mt-1">有效期至 2025-12-31</p>
          </div>
          <button class="px-4 py-2 border border-pdd-red text-pdd-red rounded-full text-sm self-center">
            去使用
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const type = computed(() => {
  const path = route.path
  if (path.includes('orchard')) return 'orchard'
  if (path.includes('bargain')) return 'bargain'
  if (path.includes('cash')) return 'cash'
  if (path.includes('game')) return 'game'
  if (path.includes('coupon')) return 'coupon'
  return 'activity'
})

const pageTitle = computed(() => {
  const titles = {
    orchard: '多多果园',
    bargain: '砍价免费拿',
    cash: '天天领现金',
    game: '多多爱消除',
    coupon: '优惠券'
  }
  return titles[type.value] || '活动'
})
</script>
