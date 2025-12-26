<template>
  <div class="settings-view">
    <div class="page-header">
      <h1>系统配置</h1>
    </div>
    
    <!-- 邮箱域名配置 -->
    <div class="config-card">
      <div class="card-header">
        <div class="header-icon">📧</div>
        <div class="header-info">
          <h3>邮箱域名</h3>
          <p>配置 Cloudflare Email Routing 的域名，用于生成注册邮箱</p>
        </div>
      </div>
      
      <div class="domain-section">
        <div class="domain-list" v-if="config.domains.length">
          <span v-for="domain in config.domains" :key="domain" class="domain-tag">
            {{ domain }}
            <span class="remove-btn" @click="removeDomain(domain)">×</span>
          </span>
        </div>
        <div v-else class="empty-hint">暂未添加域名</div>
        
        <div class="add-domain">
          <el-input v-model="newDomain" placeholder="输入域名，如 example.com" />
          <el-button type="primary" @click="addDomain">添加</el-button>
        </div>
      </div>
    </div>

    <!-- IMAP 配置 -->
    <div class="config-card">
      <div class="card-header">
        <div class="header-icon">📬</div>
        <div class="header-info">
          <h3>IMAP 邮箱配置</h3>
          <p>配置接收验证码的邮箱（Cloudflare 转发的目标邮箱）</p>
        </div>
      </div>
      
      <div class="form-section">
        <div class="form-row">
          <div class="form-item flex-2">
            <label>IMAP 服务器</label>
            <el-input v-model="config.imap.host" placeholder="如 imap.qq.com" />
          </div>
          <div class="form-item flex-1">
            <label>端口</label>
            <el-input-number v-model="config.imap.port" :min="1" :max="65535" style="width: 100%" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-item flex-1">
            <label>邮箱账号</label>
            <el-input v-model="config.imap.user" placeholder="your@qq.com" />
          </div>
          <div class="form-item flex-1">
            <label>密码 / 授权码</label>
            <el-input v-model="config.imap.password" type="password" show-password placeholder="授权码" />
          </div>
        </div>
        <div class="form-actions">
          <el-button @click="testConnection" :loading="testing">
            <el-icon v-if="!testing"><Connection /></el-icon>
            测试连接
          </el-button>
          <el-button type="primary" @click="saveConfig">
            <el-icon><Check /></el-icon>
            保存配置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 常用邮箱配置参考 -->
    <div class="config-card">
      <div class="card-header">
        <div class="header-icon">💡</div>
        <div class="header-info">
          <h3>常用邮箱 IMAP 配置</h3>
          <p>点击快速填充服务器地址和端口</p>
        </div>
      </div>
      
      <div class="preset-grid">
        <div class="preset-item" @click="applyPreset('qq')">
          <span class="preset-name">QQ 邮箱</span>
          <span class="preset-host">imap.qq.com:993</span>
        </div>
        <div class="preset-item" @click="applyPreset('gmail')">
          <span class="preset-name">Gmail</span>
          <span class="preset-host">imap.gmail.com:993</span>
        </div>
        <div class="preset-item" @click="applyPreset('163')">
          <span class="preset-name">163 邮箱</span>
          <span class="preset-host">imap.163.com:993</span>
        </div>
        <div class="preset-item" @click="applyPreset('outlook')">
          <span class="preset-name">Outlook</span>
          <span class="preset-host">outlook.office365.com:993</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }

const config = ref({
  domains: [],
  imap: { host: '', port: 993, user: '', password: '' }
})
const newDomain = ref('')
const testing = ref(false)

const presets = {
  qq: { host: 'imap.qq.com', port: 993 },
  gmail: { host: 'imap.gmail.com', port: 993 },
  '163': { host: 'imap.163.com', port: 993 },
  outlook: { host: 'outlook.office365.com', port: 993 }
}

onMounted(async () => {
  if (ipcRenderer) {
    config.value = await ipcRenderer.invoke('get-config')
  } else {
    const saved = localStorage.getItem('windsurf_config')
    if (saved) config.value = JSON.parse(saved)
  }
})

const addDomain = () => {
  if (!newDomain.value) return
  if (!config.value.domains.includes(newDomain.value)) {
    config.value.domains.push(newDomain.value)
    saveConfig()
  }
  newDomain.value = ''
}

const removeDomain = (domain) => {
  config.value.domains = config.value.domains.filter(d => d !== domain)
  saveConfig()
}

const saveConfig = async () => {
  if (ipcRenderer) {
    // 转换为普通对象，避免 Vue Proxy 序列化问题
    const configData = JSON.parse(JSON.stringify(config.value))
    const result = await ipcRenderer.invoke('save-config', configData)
    if (result.success) {
      ElMessage.success('配置已保存')
    } else {
      ElMessage.error(result.error)
    }
  } else {
    localStorage.setItem('windsurf_config', JSON.stringify(config.value))
    ElMessage.success('配置已保存')
  }
}

const testConnection = async () => {
  if (!config.value.imap.host || !config.value.imap.user || !config.value.imap.password) {
    ElMessage.warning('请先填写完整的 IMAP 配置')
    return
  }

  testing.value = true
  
  try {
    if (ipcRenderer) {
      // 转换为普通对象，避免 Vue Proxy 序列化问题
      const imapConfig = {
        host: config.value.imap.host,
        port: config.value.imap.port,
        user: config.value.imap.user,
        password: config.value.imap.password
      }
      const result = await ipcRenderer.invoke('test-imap', imapConfig)
      if (result.success) {
        ElMessage.success('连接测试成功')
      } else {
        ElMessage.error(result.message || '连接失败')
      }
    } else {
      await new Promise(r => setTimeout(r, 1500))
      ElMessage.success('连接测试成功（模拟）')
    }
  } catch (error) {
    ElMessage.error('连接失败: ' + (error.message || '未知错误'))
  } finally {
    testing.value = false
  }
}

const applyPreset = (name) => {
  const preset = presets[name]
  if (preset) {
    config.value.imap.host = preset.host
    config.value.imap.port = preset.port
    ElMessage.success(`已应用 ${name.toUpperCase()} 配置`)
  }
}
</script>

<style scoped>
.settings-view {
  max-width: 700px;
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

.config-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
  transition: background-color 0.3s, border-color 0.3s;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.header-icon {
  font-size: 28px;
}

.header-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.header-info p {
  font-size: 13px;
  color: var(--text-secondary);
}

.domain-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.domain-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.domain-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-primary);
}

.remove-btn {
  cursor: pointer;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: var(--danger-color);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  padding: 12px 0;
}

.add-domain {
  display: flex;
  gap: 12px;
}

.add-domain .el-input {
  flex: 1;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item.flex-1 { flex: 1; }
.form-item.flex-2 { flex: 2; }

.form-item label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.preset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-item:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
}

.preset-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.preset-host {
  font-size: 12px;
  color: var(--text-muted);
  font-family: monospace;
}
</style>
