import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref([])
  const PRO_TRIAL_DAYS = 13

  // 计算账号剩余天数
  const getDaysRemaining = (createdAt) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000 - (now - created)
    return Math.ceil(diffTime / (24 * 60 * 60 * 1000))
  }

  // 获取账号状态
  const getStatus = (daysRemaining) => {
    if (daysRemaining <= 0) return 'expired'
    if (daysRemaining <= 3) return 'warning'
    return 'active'
  }

  // 统计数据
  const stats = computed(() => {
    const total = accounts.value.length
    let active = 0, warning = 0, expired = 0
    
    accounts.value.forEach(acc => {
      const days = getDaysRemaining(acc.createdAt)
      const status = getStatus(days)
      if (status === 'active') active++
      else if (status === 'warning') warning++
      else expired++
    })
    
    return { total, active, warning, expired }
  })

  // 从 Electron 加载账号
  const loadFromStorage = async () => {
    if (ipcRenderer) {
      accounts.value = await ipcRenderer.invoke('get-accounts')
    } else {
      // 浏览器环境使用 localStorage
      const data = localStorage.getItem('windsurf_accounts')
      if (data) accounts.value = JSON.parse(data)
    }
  }

  // 添加账号
  const addAccount = async (account) => {
    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('add-account', account)
      if (result.success) {
        accounts.value = result.accounts
      }
      return result
    } else {
      accounts.value.push({
        id: Date.now().toString(),
        ...account,
        createdAt: account.createdAt || new Date().toISOString()
      })
      localStorage.setItem('windsurf_accounts', JSON.stringify(accounts.value))
      return { success: true }
    }
  }

  // 删除账号
  const removeAccount = async (id) => {
    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('delete-account', id)
      if (result.success) {
        accounts.value = result.accounts
      }
      return result
    } else {
      accounts.value = accounts.value.filter(acc => acc.id !== id)
      localStorage.setItem('windsurf_accounts', JSON.stringify(accounts.value))
      return { success: true }
    }
  }

  // 更新账号信息
  const updateAccount = async (id, updates) => {
    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('update-account', { id, updates })
      if (result.success) {
        accounts.value = result.accounts
      }
      return result
    } else {
      const index = accounts.value.findIndex(acc => acc.id === id)
      if (index !== -1) {
        accounts.value[index] = { ...accounts.value[index], ...updates }
        localStorage.setItem('windsurf_accounts', JSON.stringify(accounts.value))
      }
      return { success: true }
    }
  }

  return {
    accounts,
    stats,
    getDaysRemaining,
    getStatus,
    addAccount,
    removeAccount,
    updateAccount,
    loadFromStorage
  }
})
