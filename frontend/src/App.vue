<template>
  <div class="app-layout">
    <nav class="navbar">
      <div class="navbar-brand" @click="$router.push('/')">📐 设计稿评审协作平台</div>
      <div class="navbar-links">
        <router-link to="/" class="nav-link">项目空间</router-link>
        <router-link to="/reviews" class="nav-link">评审工作台</router-link>
        <router-link to="/reports" class="nav-link">统计报表</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
:root {
  --color-primary: #1a365d;
  --color-primary-light: #2a4a7f;
  --color-text: #4a5568;
  --color-text-light: #718096;
  --color-border: #e2e8f0;
  --color-bg: #f7fafc;
  --color-bg-white: #ffffff;
  --color-success: #38a169;
  --color-warning: #d69e2e;
  --color-danger: #e53e3e;
  --color-info: #3182ce;
  --color-critical: #9b2c2c;
  --color-high: #e53e3e;
  --color-medium: #d69e2e;
  --color-low: #3182ce;
  --radius: 6px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  margin-right: 40px;
}

.navbar-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  padding: 6px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255,255,255,0.1);
}

.nav-link.router-link-exact-active {
  color: #fff;
  background: rgba(255,255,255,0.15);
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  padding: 8px 16px;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--color-primary-light);
}

.btn-secondary {
  background: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-danger {
  background: var(--color-danger);
  color: #fff;
}

.btn-danger:hover {
  background: #c53030;
}

.btn-success {
  background: var(--color-success);
  color: #fff;
}

.btn-success:hover {
  background: #2f855a;
}

.btn-warning {
  background: var(--color-warning);
  color: #fff;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

input, textarea, select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg-white);
  outline: none;
  transition: border-color 0.2s;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--color-primary);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-active { background: #c6f6d5; color: #22543d; }
.badge-archived { background: #e2e8f0; color: #4a5568; }
.badge-pending { background: #fefcbf; color: #744210; }
.badge-in_review { background: #bee3f8; color: #2a4365; }
.badge-completed { background: #c6f6d5; color: #22543d; }
.badge-cancelled { background: #fed7d7; color: #742a2a; }

.card {
  background: var(--color-bg-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--color-text-light);
}

.error-msg {
  background: #fed7d7;
  color: #742a2a;
  padding: 12px;
  border-radius: var(--radius);
  margin-bottom: 16px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: var(--color-bg-white);
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal h3 {
  margin-bottom: 16px;
  color: var(--color-primary);
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.tabs {
  display: flex;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 14px;
  color: var(--color-text-light);
  transition: all 0.2s;
  background: none;
}

.tab:hover {
  color: var(--color-primary);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}
</style>
