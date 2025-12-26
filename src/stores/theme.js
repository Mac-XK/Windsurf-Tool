import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  // 初始化主题
  const initTheme = () => {
    const saved = localStorage.getItem('windsurf_theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      // 跟随系统
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  // 应用主题
  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  }

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value
    localStorage.setItem('windsurf_theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  // 监听变化
  watch(isDark, applyTheme)

  return {
    isDark,
    initTheme,
    toggleTheme
  }
})
