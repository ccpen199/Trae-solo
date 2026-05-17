<template>
  <div class="question-card card" @click="$emit('click')">
    <div class="question-title ellipsis-2">{{ question.title }}</div>
    <div class="question-content text-gray ellipsis mt-4">{{ question.content }}</div>
    
    <div class="question-footer flex-between mt-8">
      <div class="user-info flex">
        <img :src="question.avatar || 'https://picsum.photos/100/100'" class="avatar-small" />
        <span class="nickname ml-4">{{ question.nickname }}</span>
      </div>
      <div class="stats flex">
        <span class="stat-item">
          <van-icon name="good-job-o" size="12" />
          <span class="ml-2">{{ question.agree_count || 0 }}</span>
        </span>
        <span class="stat-item ml-12">
          <van-icon name="eye-o" size="12" />
          <span class="ml-2">{{ question.view_count || 0 }}</span>
        </span>
      </div>
    </div>
    
    <div v-if="question.category" class="category-tag">
      {{ question.category }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  question: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])
</script>

<style scoped>
.question-card {
  margin: 8px;
  position: relative;
  cursor: pointer;
}

.question-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

.question-content {
  font-size: 13px;
  line-height: 1.5;
}

.avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.nickname {
  font-size: 12px;
  color: #666;
}

.stat-item {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.category-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 10px;
  font-size: 11px;
  color: #666;
}

.ml-2 {
  margin-left: 2px;
}

.ml-4 {
  margin-left: 4px;
}

.ml-12 {
  margin-left: 12px;
}

.mt-4 {
  margin-top: 4px;
}
</style>
