<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  title: string
  showBack?: boolean
  extra?: any
}>()

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <div class="page-header">
    <div class="header-content">
      <div class="left-section">
        <el-button
          v-if="showBack"
          icon="ArrowLeft"
          text
          @click="goBack"
          class="back-btn"
        />
        <h2 class="page-title">{{ title }}</h2>
      </div>
      <div class="right-section">
        <slot name="extra">{{ extra }}</slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;

    .left-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .back-btn {
        font-size: 18px;
      }

      .page-title {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin: 0;
      }
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px;

    .header-content {
      .left-section {
        .page-title {
          font-size: 18px;
        }
      }
    }
  }
}
</style>
