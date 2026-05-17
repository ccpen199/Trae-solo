<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        active-class="active"
      >
        <el-icon class="nav-icon">
          <component :is="item.icon" />
        </el-icon>
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="sidebar-hot-topics">
      <h3 class="hot-title">热门话题</h3>
      <div class="topic-list">
        <a
          v-for="topic in hotTopics"
          :key="topic"
          class="topic-item"
          @click="handleTopicClick(topic)"
        >
          #{{ topic }}
        </a>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Compass, User, Shop, Star, Message } from '@element-plus/icons-vue'

const router = useRouter()

const menuItems = [
  { path: '/discover', name: '发现', icon: Compass },
  { path: '/following', name: '关注', icon: User },
  { path: '/shop', name: '购物', icon: Shop },
  { path: '/messages', name: '消息', icon: Message },
  { path: '/profile', name: '我的', icon: Star }
]

const hotTopics = [
  '穿搭分享',
  '美食探店',
  '旅行日记',
  '护肤心得',
  '健身打卡',
  '家居好物'
]

const handleTopicClick = (topic) => {
  router.push(`/search?keyword=${encodeURIComponent(topic)}`)
}
</script>

<style lang="scss" scoped>
.app-sidebar {
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  width: 200px;
  background: #fff;
  border-right: 1px solid #eee;
  padding: 20px 0;
  overflow-y: auto;

  .sidebar-nav {
    margin-bottom: 30px;

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      color: #666;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
        color: #ff2442;
      }

      &.active {
        background: #fff5f6;
        color: #ff2442;
        font-weight: 500;
      }

      .nav-icon {
        font-size: 20px;
        margin-right: 12px;
      }

      .nav-text {
        font-size: 14px;
      }
    }
  }

  .sidebar-hot-topics {
    padding: 0 24px;

    .hot-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }

    .topic-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .topic-item {
        padding: 6px 12px;
        background: #f5f5f5;
        border-radius: 16px;
        font-size: 12px;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #fff5f6;
          color: #ff2442;
        }
      }
    }
  }
}
</style>
