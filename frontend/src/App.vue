<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-primary {
  background: #ff6b6b;
  color: white;
}
.btn-primary:hover {
  background: #ff5252;
}
.btn-secondary {
  background: #4ecdc4;
  color: white;
}
.btn-secondary:hover {
  background: #3db8af;
}
.btn-block {
  width: 100%;
}
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>
