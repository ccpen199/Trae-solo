<template>
  <div class="note-card card" @click="goToDetail">
    <div class="note-images">
      <img
        v-for="(img, index) in displayImages"
        :key="index"
        :src="img"
        :alt="note.title"
        class="note-image"
        :class="{ 'single-image': displayImages.length === 1 }"
      />
      <div v-if="note.images && note.images.length > 3" class="image-more">
        +{{ note.images.length - 3 }}
      </div>
    </div>
    <div class="note-content">
      <h3 class="note-title">{{ note.title }}</h3>
      <p class="note-desc">{{ note.content }}</p>
    </div>
    <div class="note-footer">
      <div class="user-info" @click.stop="goToUser">
        <el-avatar :size="28" :src="note.avatar" />
        <span class="username">{{ note.nickname }}</span>
      </div>
      <div class="note-stats">
        <span class="stat-item" @click.stop="toggleLike">
          <span :class="{ 'liked': isLiked }">❤️</span>
          <span>{{ likeCount }}</span>
        </span>
        <span class="stat-item">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ note.comments_count || 0 }}</span>
        </span>
        <span class="stat-item" @click.stop="toggleCollect">
          <el-icon :class="{ 'collected': isCollected }"><Star /></el-icon>
          <span>{{ collectCount }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotRound, Star } from '@element-plus/icons-vue'

const props = defineProps({
  note: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const isLiked = ref(props.note.isLiked || false)
const isCollected = ref(props.note.isCollected || false)
const likeCount = ref(props.note.likes_count || 0)
const collectCount = ref(props.note.collects_count || 0)

const displayImages = computed(() => {
  const images = props.note.images || []
  return images.slice(0, 3)
})

const goToDetail = () => {
  router.push(`/note/${props.note.id}`)
}

const goToUser = () => {
  router.push(`/user/${props.note.user_id}`)
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1
}

const toggleCollect = () => {
  isCollected.value = !isCollected.value
  collectCount.value += isCollected.value ? 1 : -1
}
</script>

<style lang="scss" scoped>
.note-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .note-images {
    position: relative;
    display: grid;
    gap: 2px;
    overflow: hidden;

    &.has-1 {
      grid-template-columns: 1fr;
    }

    &.has-2 {
      grid-template-columns: 1fr 1fr;
    }

    &.has-3 {
      grid-template-columns: 1fr 1fr;

      .note-image:first-child {
        grid-column: span 2;
      }
    }
  }

  .note-image {
    width: 100%;
    object-fit: cover;
    aspect-ratio: 1;

    &.single-image {
      aspect-ratio: auto;
      max-height: 400px;
    }
  }

  .image-more {
    position: absolute;
    right: 8px;
    bottom: 8px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .note-content {
    padding: 12px;

    .note-title {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .note-desc {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
  }

  .note-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-top: 1px solid #f5f5f5;

    .user-info {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;

      &:hover .username {
        color: #ff2442;
      }

      .username {
        font-size: 12px;
        color: #666;
        transition: color 0.2s;
      }
    }

    .note-stats {
      display: flex;
      align-items: center;
      gap: 12px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #999;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: #ff2442;
        }

        .el-icon {
          font-size: 14px;

          &.liked,
          &.collected {
            color: #ff2442;
            fill: #ff2442;
          }
        }
      }
    }
  }
}
</style>
