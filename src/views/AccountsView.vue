<template>
  <div class="accounts-view">
    <div class="page-header">
      <h1>账号管理</h1>
      <div class="header-actions">
        <el-button @click="refreshList">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button @click="showImportDialog = true">
          <el-icon><Upload /></el-icon> 导入
        </el-button>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 添加账号
        </el-button>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ store.stats.total }}</div>
        <div class="stat-label">总账号</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ store.stats.active }}</div>
        <div class="stat-label">可用</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ store.stats.warning }}</div>
        <div class="stat-label">即将到期</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">{{ store.stats.expired }}</div>
        <div class="stat-label">已到期</div>
      </div>
    </div>

    <!-- 账号列表 -->
    <div class="card">
      <el-table :data="accountsWithStatus" style="width: 100%" empty-text="暂无账号">
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column label="密码" min-width="140">
          <template #header>
            <div class="password-header">
              <span>密码</span>
              <el-icon class="toggle-icon" @click="showPassword = !showPassword">
                <View v-if="showPassword" />
                <Hide v-else />
              </el-icon>
            </div>
          </template>
          <template #default="{ row }">
            <span>{{ showPassword ? row.password : '••••••••' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="绑卡" width="80" align="center">
          <template #default="{ row }">
            <span :class="['bindcard-badge', row.cardBound ? 'bound' : 'unbound']">
              {{ row.cardBound ? '已绑' : '未绑' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="到期日期" width="120">
          <template #default="{ row }">
            <span class="expire-date">{{ formatExpireDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-badge', row.status]">
              {{ row.daysRemaining > 0 ? `${row.daysRemaining}天` : '已到期' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="复制账号" placement="top">
                <el-button link type="primary" @click="copyAccount(row)">
                  <el-icon :size="18"><CopyDocument /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="绑定银行卡" placement="top">
                <el-button link type="warning" @click="bindCard(row)">
                  <el-icon :size="18"><CreditCard /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除账号" placement="top">
                <el-button link type="danger" @click="deleteAccount(row.id)">
                  <el-icon :size="18"><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加账号对话框 -->
    <el-dialog v-model="showAddDialog" title="添加账号" width="400px">
      <el-form :model="newAccount" label-width="80px">
        <el-form-item label="邮箱">
          <el-input v-model="newAccount.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="newAccount.password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="注册日期">
          <el-date-picker
            v-model="newAccount.createdAt"
            type="date"
            placeholder="选择日期（默认今天）"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddAccount">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入账号对话框 -->
    <el-dialog v-model="showImportDialog" title="导入账号" width="500px">
      <el-form label-width="80px">
        <el-form-item label="格式说明">
          <div class="import-hint">
            每行一个账号，格式：<code>邮箱,密码</code> 或 <code>邮箱----密码</code>
          </div>
        </el-form-item>
        <el-form-item label="账号数据">
          <el-input
            v-model="importText"
            type="textarea"
            :rows="8"
            placeholder="user1@example.com,password1&#10;user2@example.com----password2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>

    <!-- 绑卡日志对话框 -->
    <el-dialog v-model="showBindCardLogDialog" title="绑卡日志" width="600px">
      <div class="bind-card-logs">
        <div v-for="(log, index) in bindCardLogs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="bindCardLogs.length === 0" class="no-logs">暂无日志</div>
      </div>
      <template #footer>
        <el-button @click="bindCardLogs = []; showBindCardLogDialog = false">清空并关闭</el-button>
        <el-button type="primary" @click="showBindCardLogDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 绑定银行卡对话框 -->
    <el-dialog v-model="showBindCardDialog" title="绑定银行卡" width="500px">
      <div class="bind-card-info">
        <p>当前账号: <strong>{{ currentBindAccount?.email }}</strong></p>
      </div>
      <el-form :model="cardInfo" label-width="100px">
        <el-form-item label="输入方式">
          <el-radio-group v-model="cardInputMode">
            <el-radio value="bin">BIN头生成</el-radio>
            <el-radio value="full">完整卡号</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <template v-if="cardInputMode === 'bin'">
          <el-form-item label="BIN头">
            <el-input v-model="cardInfo.bin" placeholder="请输入6-8位BIN头，如 453256" maxlength="8" />
          </el-form-item>
        </template>
        
        <template v-else>
          <el-form-item label="卡号">
            <el-input v-model="cardInfo.cardNumber" placeholder="请输入16位卡号" maxlength="19" />
          </el-form-item>
          <el-form-item label="有效期">
            <div class="expire-inputs">
              <el-input v-model="cardInfo.expMonth" placeholder="MM" maxlength="2" style="width: 80px" />
              <span class="expire-separator">/</span>
              <el-input v-model="cardInfo.expYear" placeholder="YY" maxlength="2" style="width: 80px" />
            </div>
          </el-form-item>
          <el-form-item label="CVV">
            <el-input v-model="cardInfo.cvv" placeholder="3位CVV" maxlength="4" style="width: 100px" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showBindCardDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBindCard">绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAccountsStore } from '@/stores/accounts'

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }

const store = useAccountsStore()
const showAddDialog = ref(false)
const showImportDialog = ref(false)
const showBindCardDialog = ref(false)
const showPassword = ref(false)
const newAccount = ref({ email: '', password: '', createdAt: null })
const importText = ref('')
const currentBindAccount = ref(null)
const cardInputMode = ref('bin')
const cardInfo = ref({
  bin: '',
  cardNumber: '',
  expMonth: '',
  expYear: '',
  cvv: ''
})

const PRO_TRIAL_DAYS = 13
const bindCardLogs = ref([])
const showBindCardLogDialog = ref(false)

onMounted(() => {
  store.loadFromStorage()
  
  // 监听绑卡日志
  if (ipcRenderer) {
    ipcRenderer.on('bind-card-log', (event, message) => {
      bindCardLogs.value.push({
        time: new Date().toLocaleTimeString(),
        message
      })
    })
  }
})

const accountsWithStatus = computed(() => {
  return store.accounts.map(acc => ({
    ...acc,
    daysRemaining: store.getDaysRemaining(acc.createdAt),
    status: store.getStatus(store.getDaysRemaining(acc.createdAt)),
    cardBound: acc.cardBound || false
  }))
})

// 格式化到期日期
const formatExpireDate = (createdAt) => {
  const created = new Date(createdAt)
  const expireDate = new Date(created.getTime() + PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000)
  return expireDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

// 刷新列表
const refreshList = async () => {
  await store.loadFromStorage()
  ElMessage.success('已刷新')
}

// 添加账号
const handleAddAccount = async () => {
  if (!newAccount.value.email || !newAccount.value.password) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const accountData = {
    email: newAccount.value.email,
    password: newAccount.value.password
  }
  
  // 如果指定了日期，使用指定日期
  if (newAccount.value.createdAt) {
    accountData.createdAt = new Date(newAccount.value.createdAt).toISOString()
  }
  
  await store.addAccount(accountData)
  newAccount.value = { email: '', password: '', createdAt: null }
  showAddDialog.value = false
  ElMessage.success('添加成功')
}

// 导入账号
const handleImport = async () => {
  if (!importText.value.trim()) {
    ElMessage.warning('请输入账号数据')
    return
  }

  const lines = importText.value.trim().split('\n')
  let successCount = 0
  let failCount = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let email, password
    
    // 支持多种分隔符
    if (trimmed.includes('----')) {
      [email, password] = trimmed.split('----')
    } else if (trimmed.includes(',')) {
      [email, password] = trimmed.split(',')
    } else if (trimmed.includes('\t')) {
      [email, password] = trimmed.split('\t')
    } else {
      failCount++
      continue
    }

    email = email?.trim()
    password = password?.trim()

    if (email && password) {
      await store.addAccount({ email, password })
      successCount++
    } else {
      failCount++
    }
  }

  importText.value = ''
  showImportDialog.value = false
  
  if (successCount > 0) {
    ElMessage.success(`成功导入 ${successCount} 个账号${failCount > 0 ? `，${failCount} 个失败` : ''}`)
  } else {
    ElMessage.error('导入失败，请检查格式')
  }
}

// 复制账号
const copyAccount = (account) => {
  navigator.clipboard.writeText(`${account.email}\n${account.password}`)
  ElMessage.success('已复制到剪贴板')
}

// 绑定银行卡 - 打开对话框
const bindCard = (account) => {
  currentBindAccount.value = account
  // 重置表单
  cardInputMode.value = 'bin'
  cardInfo.value = {
    bin: '',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvv: ''
  }
  showBindCardDialog.value = true
}

// 处理绑卡
const isBindingCard = ref(false)

const handleBindCard = async () => {
  if (cardInputMode.value === 'bin') {
    if (!cardInfo.value.bin || cardInfo.value.bin.length < 6) {
      ElMessage.warning('请输入至少6位BIN头')
      return
    }
  } else {
    if (!cardInfo.value.cardNumber || cardInfo.value.cardNumber.length < 15) {
      ElMessage.warning('请输入完整卡号')
      return
    }
    if (!cardInfo.value.expMonth || !cardInfo.value.expYear) {
      ElMessage.warning('请输入有效期')
      return
    }
    if (!cardInfo.value.cvv || cardInfo.value.cvv.length < 3) {
      ElMessage.warning('请输入CVV')
      return
    }
  }
  
  if (!ipcRenderer) {
    ElMessage.warning('此功能仅在桌面应用中可用')
    return
  }
  
  isBindingCard.value = true
  showBindCardDialog.value = false
  bindCardLogs.value = [] // 清空之前的日志
  showBindCardLogDialog.value = true // 显示日志对话框
  ElMessage.info('正在启动浏览器登录...')
  
  try {
    const result = await ipcRenderer.invoke('bind-card-login', {
      account: {
        email: currentBindAccount.value.email,
        password: currentBindAccount.value.password
      },
      cardInfo: {
        mode: cardInputMode.value,
        ...cardInfo.value
      }
    })
    
    if (result.success) {
      ElMessage.success(result.message || '绑卡成功')
      // 更新账号绑卡状态
      await store.updateAccount(currentBindAccount.value.id, { 
        cardBound: true,
        cardBoundAt: new Date().toISOString()
      })
    } else if (result.submitted) {
      // 表单已提交，但需要手动确认结果
      ElMessage.warning(result.message || '表单已提交，请手动确认绑卡结果')
      // 不自动更新绑卡状态
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error) {
    ElMessage.error('绑卡失败: ' + error.message)
  } finally {
    isBindingCard.value = false
  }
}

// 删除账号
const deleteAccount = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个账号吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await store.removeAccount(id)
    ElMessage.success('删除成功')
  } catch {
    // 取消删除
  }
}
</script>

<style scoped>
.accounts-view {
  max-width: 1000px;
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

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid var(--border-color);
  transition: background-color 0.3s, border-color 0.3s;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-card.success .stat-value { color: var(--success-color); }
.stat-card.warning .stat-value { color: var(--warning-color); }
.stat-card.danger .stat-value { color: var(--danger-color); }

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color);
  transition: background-color 0.3s, border-color 0.3s;
}

.expire-date {
  font-size: 13px;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.warning {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.expired {
  background: #fee2e2;
  color: #dc2626;
}

.import-hint {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.import-hint code {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.password-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.2s;
}

.toggle-icon:hover {
  color: var(--primary-color);
}

.bindcard-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.bindcard-badge.bound {
  background: #d1fae5;
  color: #059669;
}

.bindcard-badge.unbound {
  background: #f3f4f6;
  color: #9ca3af;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.bind-card-info {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.bind-card-info p {
  margin: 0;
  color: var(--text-secondary);
}

.expire-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expire-separator {
  color: var(--text-secondary);
  font-size: 16px;
}

.bind-card-logs {
  max-height: 400px;
  overflow-y: auto;
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 12px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--text-muted);
  flex-shrink: 0;
  font-family: monospace;
}

.log-message {
  color: var(--text-primary);
  word-break: break-all;
}

.no-logs {
  text-align: center;
  color: var(--text-muted);
  padding: 20px;
}
</style>
