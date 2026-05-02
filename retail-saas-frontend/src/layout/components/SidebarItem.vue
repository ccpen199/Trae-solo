<template>
  <div v-if="!item.hidden">
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren)">
      <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': isNest }">
        <el-icon v-if="onlyOneChild.meta?.icon">
          <component :is="onlyOneChild.meta.icon" />
        </el-icon>
        <template #title>
          <span v-if="onlyOneChild.meta?.title">{{ onlyOneChild.meta.title }}</span>
        </template>
      </el-menu-item>
    </template>
    
    <el-sub-menu v-else :index="resolvePath(item.path)" popper-append-to-body>
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <span v-if="item.meta?.title">{{ item.meta.title }}</span>
      </template>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(item.path)"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  basePath: {
    type: String,
    default: ''
  },
  isNest: {
    type: Boolean,
    default: false
  }
})

const onlyOneChild = computed(() => {
  const showingChildren = props.item.children?.filter(item => !item.hidden) || []
  return showingChildren[0] || props.item
})

const hasOneShowingChild = (children = [], parent) => {
  const showingChildren = children.filter(item => !item.hidden)
  if (showingChildren.length === 1) {
    return true
  }
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
    return true
  }
  return false
}

const resolvePath = (routePath) => {
  if (routePath.startsWith('http') || routePath.startsWith('https')) {
    return routePath
  }
  if (routePath.startsWith('/')) {
    return routePath
  }
  if (props.basePath && !routePath.startsWith('/')) {
    return `${props.basePath}/${routePath}`.replace(/\/+/g, '/')
  }
  return routePath
}
</script>

<style scoped>
.nest-menu .el-menu-item {
  min-width: 180px !important;
}

.submenu-title-noDropdown {
  padding: 0 !important;
  position: relative;
}

.submenu-title-noDropdown:hover {
  background-color: rgba(0, 0, 0, 0.06) !important;
}
</style>
