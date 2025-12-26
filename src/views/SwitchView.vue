<template>
  <div class="switch-view">
    <div class="page-header">
      <h1>切换账号</h1>
    </div>
    
    <!-- 账号选择卡片 -->
    <div class="switch-card">
      <div class="card-header">
        <h3>选择要切换的账号</h3>
        <p>选择一个账号后点击自动切换，系统将自动完成登录</p>
      </div>
      
      <div class="account-selector">
        <el-select 
          v-model="selectedAccount" 
          placeholder="请选择账号" 
          size="large"
          style="width: 100%"
        >
          <el-option
            v-for="acc in availableAccounts"
            :key="acc.id"
            :label="acc.email"
            :value="acc.id"
          >
            <div class="account-option">
              <span class="option-email">{{ acc.email }}</span>
              <span :class="['option-badge', acc.status]">
                {{ acc.daysRemaining > 0 ? `${acc.daysRemaining}天` : '已到期' }}
              </span>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 选中账号信息 -->
      <div v-if="selectedAccountInfo" class="selected-info">
        <div class="info-item">
          <span class="info-label">邮箱</span>
          <span class="info-value">{{ selectedAccountInfo.email }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">状态</span>
          <span :class="['status-tag', selectedAccountInfo.status]">
            {{ selectedAccountInfo.daysRemaining > 0 ? `剩余 ${selectedAccountInfo.daysRemaining} 天` : '已到期' }}
          </span>
        </div>
      </div>

      <div class="action-buttons">
        <el-button 
          type="primary" 
          size="large" 
          :loading="isSwitching" 
          :disabled="!selectedAccount" 
          @click="switchAccount"
        >
          <el-icon v-if="!isSwitching"><VideoPlay /></el-icon>
          {{ isSwitching ? '切换中...' : '自动切换账号' }}
        </el-button>
        <el-button 
          size="large" 
          :loading="isResetting" 
          @click="resetOnly"
        >
          <el-icon v-if="!isResetting"><RefreshRight /></el-icon>
          {{ isResetting ? '重置中...' : '仅重置配置' }}
        </el-button>
      </div>
    </div>

    <!-- 切换流程说明 -->
    <div class="process-card">
      <div class="process-title">切换流程</div>
      <div class="process-steps">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-text">重置 Windsurf 配置和机器码</div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-text">启动 Windsurf 应用</div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-text">自动填写登录信息</div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step-item">
          <div class="step-num">4</div>
          <div class="step-text">完成账号切换</div>
        </div>
      </div>
    </div>

    <!-- 切换日志 -->
    <div v-if="logs.length" class="log-card">
      <div class="log-header">
        <span class="log-title">📋 切换日志</span>
        <el-button link type="primary" @click="logs = []">清空</el-button>
      </div>
      <div class="log-content" ref="logContainer">
        <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccountsStore } from '@/stores/accounts'

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }

const store = useAccountsStore()
const selectedAccount = ref('')
const isSwitching = ref(false)
const isResetting = ref(false)
const logs = ref([])
const logContainer = ref(null)

onMounted(() => {
  store.loadFromStorage()
})

const availableAccounts = computed(() => {
  return store.accounts.map(acc => ({
    ...acc,
    daysRemaining: store.getDaysRemaining(acc.createdAt),
    status: store.getStatus(store.getDaysRemaining(acc.createdAt))
  }))
})

const selectedAccountInfo = computed(() => {
  if (!selectedAccount.value) return null
  return availableAccounts.value.find(a => a.id === selectedAccount.value)
})

const addLog = (message, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.push({ time, message, type })
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const switchAccount = async () => {
  if (!selectedAccount.value || isSwitching.value) return
  
  const account = store.accounts.find(a => a.id === selectedAccount.value)
  if (!account) return

  isSwitching.value = true
  logs.value = []

  if (ipcRenderer) {
    addLog('开始切换账号...')
    const result = await ipcRenderer.invoke('switch-account', account)
    
    if (result.success) {
      addLog('账号切换完成！', 'success')
      ElMessage.success('切换完成')
    } else {
      addLog(`切换失败: ${result.error}`, 'error')
      ElMessage.error(result.error)
    }
  } else {
    addLog('开始切换账号...')
    addLog('正在重置 Windsurf 配置...')
    await new Promise(r => setTimeout(r, 1000))
    
    addLog('正在清除机器码...') 
    await new Promise(r => setTimeout(r, 1000))
    
    addLog('正在启动 Windsurf...')
    await new Promise(r => setTimeout(r, 1000))
    
    addLog(`正在登录账号: ${account.email}`)
    await new Promise(r => setTimeout(r, 1000))
    
    addLog('账号切换完成！', 'success')
    ElMessage.success('切换完成')
  }

  isSwitching.value = false
}

const resetOnly = async () => {
  if (isResetting.value) return

  isResetting.value = true
  logs.value = []

  if (ipcRenderer) {
    addLog('开始重置 Windsurf 配置...')
    const result = await ipcRenderer.invoke('reset-windsurf')
    
    if (result.success) {
      addLog('重置完成！', 'success')
      ElMessage.success('重置完成')
    } else {
      addLog(`重置失败: ${result.error}`, 'error')
      ElMessage.error(result.error)
    }
  } else {
    addLog('开始重置 Windsurf 配置...')
    await new Promise(r => setTimeout(r, 2000))
    addLog('重置完成！', 'success')
    ElMessage.success('重置完成')
  }

  isResetting.value = false
}

onMounted(() => {
  if (ipcRenderer) {
    ipcRenderer.on('switch-log', (event, message) => {
      let type = 'info'
      if (message.includes('✓') || message.includes('成功') || message.includes('完成')) type = 'success'
      else if (message.includes('✗') || message.includes('失败') || message.includes('❌')) type = 'error'
      addLog(message, type)
    })
  }
})

onUnmounted(() => {
  if (ipcRenderer) {
    ipcRenderer.removeAllListeners('switch-log')
  }
})
</script>

<style scoped>
.switch-view {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.switch-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
  transition: background-color 0.3s, border-color 0.3s;
}

.card-header {
  margin-bottom: 24px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.card-header p {
  font-size: 13px;
  color: var(--text-secondary);
}

.account-selector {
  margin-bottom: 20px;
}

.account-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.option-email {
  color: var(--text-primary);
}

.option-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.option-badge.active { background: #d1fae5; color: #059669; }
.option-badge.warning { background: #fef3c7; color: #d97706; }
.option-badge.expired { background: #fee2e2; color: #dc2626; }

.selected-info {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  gap: 32px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-muted);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.active { background: #d1fae5; color: #059669; }
.status-tag.warning { background: #fef3c7; color: #d97706; }
.status-tag.expired { background: #fee2e2; color: #dc2626; }

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons .el-button {
  padding: 12px 24px;
}

.process-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
  transition: background-color 0.3s, border-color 0.3s;
}

.process-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.process-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-num {
  width: 28px;
  height: 28px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.step-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.step-arrow {
  color: var(--text-muted);
  font-size: 16px;
}

.log-card {
  background: var(--card-bg);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: background-color 0.3s, border-color 0.3s;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.log-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.log-content {
  max-height: 240px;
  overflow-y: auto;
  padding: 16px 20px;
}

.log-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
  display: flex;
  gap: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.success .log-msg { color: var(--success-color); }
.log-item.error .log-msg { color: var(--danger-color); }
.log-time { color: var(--text-muted); font-family: monospace; font-size: 12px; }
.log-msg { color: var(--text-primary); flex: 1; }
</style>
