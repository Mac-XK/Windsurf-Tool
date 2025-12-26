<template>
  <el-container class="app-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">Windsurf Go</span>
      </div>
      <nav class="nav-menu">
        <router-link to="/accounts" class="nav-item" :class="{ active: currentRoute === '/accounts' }">
          <el-icon><User /></el-icon>
          <span>账号管理</span>
        </router-link>
        <router-link to="/register" class="nav-item" :class="{ active: currentRoute === '/register' }">
          <el-icon><Plus /></el-icon>
          <span>批量注册</span>
        </router-link>
        <router-link to="/switch" class="nav-item" :class="{ active: currentRoute === '/switch' }">
          <el-icon><Switch /></el-icon>
          <span>切换账号</span>
        </router-link>
        <router-link to="/settings" class="nav-item" :class="{ active: currentRoute === '/settings' }">
          <el-icon><Setting /></el-icon>
          <span>系统配置</span>
        </router-link>
        <router-link to="/tutorial" class="nav-item" :class="{ active: currentRoute === '/tutorial' }">
          <el-icon><Document /></el-icon>
          <span>使用教程</span>
        </router-link>
      </nav>
      
      <!-- 主题切换 -->
      <div class="theme-toggle" @click="themeStore.toggleTheme()">
        <el-icon v-if="themeStore.isDark"><Sunny /></el-icon>
        <el-icon v-else><Moon /></el-icon>
        <span>{{ themeStore.isDark ? '浅色模式' : '深色模式' }}</span>
      </div>
    </el-aside>
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const themeStore = useThemeStore()
const currentRoute = computed(() => route.path)

onMounted(() => {
  themeStore.initTheme()
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  background: var(--bg-primary);
}

.sidebar {
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s, border-color 0.3s;
}

.logo {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--border-color);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.nav-menu {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary-color);
  color: #fff;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.main-content {
  background: var(--bg-primary);
  padding: 32px;
  overflow-y: auto;
  transition: background-color 0.3s;
}
</style>
