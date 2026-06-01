<script setup>
import { useAppStore } from './stores/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { showCitySelector } = storeToRefs(appStore)
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style scoped>
</style>
