const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs').promises

// 服务模块
const RegistrationBot = require('./services/registrationBot')
const WindsurfManager = require('./services/windsurfManager')
const EmailReceiver = require('./services/emailReceiver')
const CardBindingBot = require('./services/cardBindingBot')

let mainWindow
const isDev = process.argv.includes('--dev') || !app.isPackaged

// 数据文件路径
const getDataPath = (filename) => path.join(app.getPath('userData'), filename)
const ACCOUNTS_FILE = () => getDataPath('accounts.json')
const CONFIG_FILE = () => getDataPath('config.json')

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ==================== 账号管理 IPC ====================

// 获取所有账号
ipcMain.handle('get-accounts', async () => {
  try {
    const data = await fs.readFile(ACCOUNTS_FILE(), 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
})

// 保存账号
ipcMain.handle('save-accounts', async (event, accounts) => {
  try {
    await fs.writeFile(ACCOUNTS_FILE(), JSON.stringify(accounts, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 添加账号
ipcMain.handle('add-account', async (event, account) => {
  try {
    let accounts = []
    try {
      const data = await fs.readFile(ACCOUNTS_FILE(), 'utf-8')
      accounts = JSON.parse(data)
    } catch (e) {}
    
    accounts.push({
      id: Date.now().toString(),
      ...account,
      createdAt: account.createdAt || new Date().toISOString()
    })
    
    await fs.writeFile(ACCOUNTS_FILE(), JSON.stringify(accounts, null, 2))
    return { success: true, accounts }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 删除账号
ipcMain.handle('delete-account', async (event, id) => {
  try {
    const data = await fs.readFile(ACCOUNTS_FILE(), 'utf-8')
    let accounts = JSON.parse(data)
    accounts = accounts.filter(acc => acc.id !== id)
    await fs.writeFile(ACCOUNTS_FILE(), JSON.stringify(accounts, null, 2))
    return { success: true, accounts }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 更新账号
ipcMain.handle('update-account', async (event, { id, updates }) => {
  try {
    const data = await fs.readFile(ACCOUNTS_FILE(), 'utf-8')
    let accounts = JSON.parse(data)
    const index = accounts.findIndex(acc => acc.id === id)
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates }
      await fs.writeFile(ACCOUNTS_FILE(), JSON.stringify(accounts, null, 2))
      return { success: true, accounts }
    }
    return { success: false, error: '账号不存在' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==================== 配置管理 IPC ====================

// 获取配置
ipcMain.handle('get-config', async () => {
  try {
    const data = await fs.readFile(CONFIG_FILE(), 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return { domains: [], imap: { host: '', port: 993, user: '', password: '' } }
  }
})

// 保存配置
ipcMain.handle('save-config', async (event, config) => {
  try {
    await fs.writeFile(CONFIG_FILE(), JSON.stringify(config, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 测试 IMAP 连接
ipcMain.handle('test-imap', async (event, imapConfig) => {
  try {
    const receiver = new EmailReceiver(imapConfig)
    const result = await receiver.testConnection()
    return result
  } catch (error) {
    return { success: false, message: error.message }
  }
})

// ==================== 注册功能 IPC ====================

// 批量注册
ipcMain.handle('batch-register', async (event, params) => {
  console.log('===== 收到批量注册请求 =====')
  console.log('原始参数:', params)
  const { count, headless = false } = params || {}
  console.log('解析后 - count:', count, 'headless:', headless)
  
  try {
    // 获取配置
    let config = {}
    try {
      const data = await fs.readFile(CONFIG_FILE(), 'utf-8')
      config = JSON.parse(data)
    } catch (e) {}

    if (!config.domains || config.domains.length === 0) {
      return { success: false, error: '请先配置邮箱域名' }
    }

    if (!config.imap || !config.imap.host) {
      return { success: false, error: '请先配置 IMAP 邮箱' }
    }

    console.log('批量注册参数 - headless:', headless)
    
    const bot = new RegistrationBot({
      emailDomains: config.domains,
      emailConfig: config.imap,
      headless: headless
    })

    // 发送日志到前端
    const logCallback = (message) => {
      mainWindow.webContents.send('register-log', message)
    }

    const progressCallback = ({ current, total }) => {
      mainWindow.webContents.send('register-progress', { current, total })
    }

    const results = await bot.batchRegister(count, progressCallback, logCallback)
    
    return { success: true, results }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==================== 切换账号 IPC ====================

// 切换账号
ipcMain.handle('switch-account', async (event, account) => {
  try {
    const logCallback = (message) => {
      mainWindow.webContents.send('switch-log', message)
    }

    const manager = new WindsurfManager(logCallback)
    
    // 1. 完整重置
    logCallback('开始重置 Windsurf 配置...')
    const resetResult = await manager.fullReset()
    
    if (!resetResult.success) {
      return { success: false, error: resetResult.error }
    }

    // 2. 启动 Windsurf 并自动登录
    logCallback('启动 Windsurf 并自动登录...')
    const loginResult = await manager.autoLogin(account.email, account.password)
    
    return loginResult
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 仅重置（不登录）
ipcMain.handle('reset-windsurf', async () => {
  try {
    const logCallback = (message) => {
      mainWindow.webContents.send('switch-log', message)
    }

    const manager = new WindsurfManager(logCallback)
    const result = await manager.fullReset()
    return result
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==================== 绑卡 IPC ====================

let cardBindingBot = null

// 启动绑卡流程 - 登录账号
ipcMain.handle('bind-card-login', async (event, { account, cardInfo }) => {
  try {
    const logCallback = (message) => {
      mainWindow.webContents.send('bind-card-log', message)
    }

    cardBindingBot = new CardBindingBot()
    const result = await cardBindingBot.loginAndBind(account, cardInfo, logCallback)
    return result
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 关闭绑卡浏览器
ipcMain.handle('bind-card-close', async () => {
  try {
    if (cardBindingBot) {
      await cardBindingBot.close()
      cardBindingBot = null
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})


