<template>
  <div class="register-view">
    <div class="page-header">
      <h1>批量注册</h1>
      <div class="config-status" :class="{ error: !hasConfig }">
        <el-icon v-if="hasConfig"><CircleCheck /></el-icon>
        <el-icon v-else><Warning /></el-icon>
        <span>{{ hasConfig ? '配置就绪' : '请先配置邮箱域名' }}</span>
      </div>
    </div>

    <!-- 注册设置卡片 -->
    <div class="register-card">
      <div class="register-header">
        <div class="register-info">
          <h3>自动批量注册</h3>
          <p>自动生成邮箱、注册账号、接收验证码</p>
        </div>
      </div>
      
      <div class="register-form">
        <div class="form-item">
          <span class="form-label">注册数量</span>
          <div class="number-input">
            <button class="num-btn" @click="registerCount > 1 && registerCount--">−</button>
            <input type="number" v-model.number="registerCount" min="1" max="10" />
            <button class="num-btn" @click="registerCount < 10 && registerCount++">+</button>
          </div>
          <span class="form-hint">建议 1-10 个</span>
        </div>

        <div class="form-item">
          <span class="form-label">无头模式</span>
          <el-switch v-model="headlessMode" />
          <el-tooltip content="无头模式不显示浏览器窗口，但可能被 Cloudflare 检测" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        
        <el-button 
          type="primary" 
          size="large" 
          :loading="isRegistering" 
          :disabled="!hasConfig"
          @click="startRegister"
          class="register-btn"
        >
          <el-icon v-if="!isRegistering"><VideoPlay /></el-icon>
          {{ isRegistering ? '注册中...' : '开始批量注册' }}
        </el-button>
      </div>

      <!-- 进度条 -->
      <div v-if="isRegistering" class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>

    <!-- 注册日志 -->
    <div class="log-card">
      <div class="log-header">
        <span class="log-title">📋 注册日志</span>
        <el-button v-if="logs.length" link type="primary" @click="logs = []">清空</el-button>
      </div>
      <div class="log-content" ref="logContainer">
        <div v-if="!logs.length" class="log-empty">
          暂无日志，点击开始注册后显示
        </div>
        <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 使用提示 -->
    <div class="tips-card">
      <div class="tip-item">
        <el-icon><InfoFilled /></el-icon>
        <span>每个账号注册约需 1-2 分钟，请耐心等待</span>
      </div>
      <div class="tip-item">
        <el-icon><InfoFilled /></el-icon>
        <span>注册前请确保已在「配置」页面设置好邮箱域名和 IMAP</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccountsStore } from '@/stores/accounts'

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }

const store = useAccountsStore()
const registerCount = ref(1)
const headlessMode = ref(false)
const isRegistering = ref(false)
const logs = ref([])
const logContainer = ref(null)
const progress = ref(0)
const hasConfig = ref(true)

// 检查配置
const checkConfig = async () => {
  if (ipcRenderer) {
    const config = await ipcRenderer.invoke('get-config')
    hasConfig.value = config.domains && config.domains.length > 0 && config.imap && config.imap.host
  }
}

onMounted(() => {
  checkConfig()
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

const startRegister = async () => {
  if (isRegistering.value) return
  
  isRegistering.value = true
  logs.value = []
  progress.value = 0
  addLog(`开始注册 ${registerCount.value} 个账号...`)

  if (ipcRenderer) {
    // 确保参数是普通值，避免 Vue Proxy 序列化问题
    const params = {
      count: Number(registerCount.value),
      headless: Boolean(headlessMode.value)
    }
    console.log('发送注册请求，参数:', params)
    const result = await ipcRenderer.invoke('batch-register', params)
    
    if (result.success) {
      const successCount = result.results.filter(r => r.success).length
      addLog(`批量注册完成！成功 ${successCount} 个`, 'success')
      await store.loadFromStorage()
      ElMessage.success(`注册完成，成功 ${successCount} 个`)
    } else {
      addLog(`注册失败: ${result.error}`, 'error')
      ElMessage.error(result.error)
    }
  } else {
    for (let i = 0; i < registerCount.value; i++) {
      addLog(`正在注册第 ${i + 1} 个账号...`)
      await new Promise(r => setTimeout(r, 1000))
      progress.value = Math.round(((i + 1) / registerCount.value) * 100)
      
      const randomStr = Math.random().toString(36).substring(2, 8)
      const email = `user_${randomStr}@example.com`
      const password = `pass_${randomStr}`
      
      await store.addAccount({ email, password })
      addLog(`账号 ${email} 注册成功`, 'success')
    }
    addLog('批量注册完成！', 'success')
    ElMessage.success('注册完成')
  }

  progress.value = 100
  isRegistering.value = false
}

onMounted(() => {
  if (ipcRenderer) {
    ipcRenderer.on('register-log', (event, message) => {
      let type = 'info'
      if (message.includes('✓') || message.includes('成功')) type = 'success'
      else if (message.includes('✗') || message.includes('失败') || message.includes('❌')) type = 'error'
      addLog(message, type)
    })
    
    ipcRenderer.on('register-progress', (event, data) => {
      // 支持细粒度进度更新
      if (data.percent !== undefined) {
        progress.value = data.percent
      } else {
        progress.value = Math.round((data.current / data.total) * 100)
      }
    })
  }
})

onUnmounted(() => {
  if (ipcRenderer) {
    ipcRenderer.removeAllListeners('register-log')
    ipcRenderer.removeAllListeners('register-progress')
  }
})
</script>

<style scoped>
.register-view {
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.config-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  background: #d1fae5;
  color: #059669;
}

.config-status.error {
  background: #fee2e2;
  color: #dc2626;
}

.register-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
  transition: background-color 0.3s, border-color 0.3s;
}

.register-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.register-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.register-info p {
  font-size: 13px;
  color: var(--text-secondary);
}

.register-form {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.number-input {
  display: flex;
  align-items: center;
  background: var(--bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
}

.number-input input {
  width: 60px;
  text-align: center;
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  padding: 8px 0;
}

.number-input input:focus {
  outline: none;
}

.num-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.num-btn:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.help-icon {
  color: var(--text-muted);
  cursor: help;
  font-size: 16px;
}

.register-btn {
  margin-left: auto;
  padding: 12px 28px;
  font-size: 15px;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--primary-color);
  min-width: 40px;
}

.log-card {
  background: var(--card-bg);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
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
  max-height: 280px;
  overflow-y: auto;
  padding: 16px 20px;
}

.log-empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 40px 0;
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

.tips-card {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 16px 20px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 6px 0;
}

.tip-item .el-icon {
  color: var(--primary-color);
}
</style>
