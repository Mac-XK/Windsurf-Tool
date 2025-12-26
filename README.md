# Windsurf Go 🚀

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.4-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/Electron-27-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

<p align="center">
  <b>一款现代化的 Windsurf 账号批量管理工具</b>
</p>

---

<img width="400" height="300" alt="cc76fcd9edb632252d7420365cc56d65" src="https://github.com/user-attachments/assets/37169e42-aa27-44ad-8490-81077c4b0bc6" />
<img width="400" height="300" alt="347bcf7d696e1fe3508fbc21a28321bd" src="https://github.com/user-attachments/assets/0029c7d4-7864-431b-87fe-722f315bb1c5" />
<img width="400" height="300" alt="aaf64634315ca04f6abfb6e8eb3225ea" src="https://github.com/user-attachments/assets/9d271276-08ab-4b56-b444-57c58265cffd" />
<img width="400" height="300" alt="b2dac2f17205fbe4267d45604076f807" src="https://github.com/user-attachments/assets/c06ac01e-23a4-4941-97c8-ab67c3eb4900" />

## 📖 项目简介

Windsurf Go 是一款基于 Vue 3 + Electron 开发的桌面应用程序，用于批量管理 Windsurf 账号。它提供了自动化注册、账号管理、一键切换等功能，大大简化了多账号管理的复杂度。

### ✨ 主要特性

- 🔄 **批量自动注册** - 支持 1-10 个账号同时注册，最多 4 个并发窗口
- 📧 **自动获取验证码** - 通过 IMAP 协议自动接收并解析邮箱验证码
- 🛡️ **绕过 Cloudflare** - 使用 puppeteer-real-browser 自动处理 Turnstile 验证
- 📋 **账号管理** - 查看、复制、删除已注册的账号信息
- 🔀 **一键切换账号** - 快速切换不同的 Windsurf 账号
- 🌙 **深色/浅色主题** - 支持主题切换，保护眼睛
- 💾 **本地数据存储** - 账号信息安全存储在本地

---

## 🖼️ 界面预览

```
┌─────────────────────────────────────────────────────────┐
│  Windsurf Go                              🌙  ─  □  ✕  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ 注册 │ │ 账号 │ │ 切换 │ │ 教程 │ │ 设置 │         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │              批量注册 / 账号列表                 │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 前端框架 | Vue 3 + Vite | 用户界面 |
| UI 组件库 | Element Plus | UI 组件 |
| 状态管理 | Pinia | 账号数据管理 |
| 桌面框架 | Electron 27 | 桌面应用容器 |
| 浏览器自动化 | puppeteer-real-browser | 绕过 Cloudflare 检测 |
| 邮件接收 | imap + mailparser | IMAP 协议获取验证码 |

---

## 📦 安装使用

### 方式一：下载预编译版本（推荐）

| 系统 | 文件名 | 说明 |
|------|--------|------|
| Windows | `Windsurf-Tool-Setup-x.x.x.exe` | 安装版 |
| Windows | `Windsurf-Tool-x.x.x-portable.exe` | 便携版（免安装） |
| macOS | `Windsurf-Tool-x.x.x.dmg` | DMG 安装包 |
| macOS | `Windsurf-Tool-x.x.x-mac.zip` | ZIP 压缩包 |

### 方式二：从源码运行

#### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0（推荐）或 npm >= 9.0.0

#### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/Mac-XK/Windsurf-Tool.git
cd Windsurf-Tool

# 2. 安装依赖
pnpm install
# 或使用 npm
npm install

# 3. 启动开发模式
pnpm electron:dev
# 或使用 npm
npm run electron:dev
```

---

## 🔧 打包教程

### Windows 打包

#### 前置准备

1. 确保已安装 Node.js 18+ 和 pnpm/npm
2. 建议在 Windows 系统上打包 Windows 版本

#### 打包步骤

```bash
# 1. 安装依赖（如果还没安装）
pnpm install

# 2. 打包 Windows 版本
pnpm electron:build:win
# 或
npm run electron:build:win
```

#### 输出文件

打包完成后，在 `dist-electron` 目录下会生成：

```
dist-electron/
├── Windsurf-Tool-Setup-2.0.0.exe    # NSIS 安装程序
└── Windsurf-Tool-2.0.0-portable.exe # 便携版
```

### macOS 打包

#### 前置准备

1. 确保已安装 Node.js 18+ 和 pnpm/npm
2. **必须在 macOS 系统上打包 macOS 版本**
3. 如需签名，需要 Apple Developer 证书

#### 打包步骤

```bash
# 1. 安装依赖（如果还没安装）
pnpm install

# 2. 打包 macOS 版本
pnpm electron:build:mac
# 或
npm run electron:build:mac
```

#### 输出文件

打包完成后，在 `dist-electron` 目录下会生成：

```
dist-electron/
├── Windsurf-Tool-2.0.0.dmg          # DMG 安装包
├── Windsurf-Tool-2.0.0-mac.zip      # ZIP 压缩包
└── mac/
    └── Windsurf-Tool.app            # 应用程序
```

#### macOS 签名（可选）

如果要分发给其他用户，建议进行代码签名：

```bash
# 设置环境变量
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-password

# 然后执行打包
pnpm electron:build:mac
```

### 跨平台打包

如果需要在一台机器上打包多个平台：

```bash
# 打包所有平台（需要对应系统环境）
pnpm electron:build
# 或
npm run electron:build
```

> ⚠️ **注意**：macOS 应用只能在 macOS 系统上打包，Windows 应用建议在 Windows 系统上打包。

---

## 📖 使用教程

### 第一步：配置邮箱

在使用批量注册功能前，需要先配置邮箱：

1. 点击顶部导航栏的 **「设置」** 按钮
2. 配置 **邮箱域名**（用于生成注册邮箱）
3. 配置 **IMAP 信息**（用于接收验证码）

#### IMAP 配置示例

| 邮箱服务商 | IMAP 服务器 | 端口 | 加密 |
|-----------|-------------|------|------|
| QQ 邮箱 | imap.qq.com | 993 | SSL |
| Gmail | imap.gmail.com | 993 | SSL |
| 163 邮箱 | imap.163.com | 993 | SSL |
| Outlook | outlook.office365.com | 993 | SSL |

> 💡 **提示**：QQ 邮箱需要使用授权码而非登录密码，请在 QQ 邮箱设置中开启 IMAP 并获取授权码。

### 第二步：批量注册

1. 点击顶部导航栏的 **「注册」** 按钮
2. 设置注册数量（1-10 个）
3. 选择是否启用 **无头模式**（建议关闭以提高成功率）
4. 点击 **「开始批量注册」** 按钮
5. 等待注册完成，查看日志了解进度

#### 注册流程说明

```
生成邮箱/密码 → 打开浏览器 → 填写注册表单 → 
处理 CF 验证 → 获取邮箱验证码 → 完成注册 → 保存账号
```

### 第三步：管理账号

1. 点击顶部导航栏的 **「账号」** 按钮
2. 查看所有已注册的账号列表
3. 支持的操作：
   - 📋 复制账号信息
   - 🗑️ 删除账号
   - 🔄 刷新列表

### 第四步：切换账号

1. 点击顶部导航栏的 **「切换」** 按钮
2. 选择要切换的账号
3. 点击 **「切换」** 按钮完成切换

---

## 📁 项目结构

```
windsurf-go/
├── src/                          # Vue 前端源码
│   ├── views/                    # 页面组件
│   │   ├── RegisterView.vue      # 批量注册页面
│   │   ├── AccountsView.vue      # 账号管理页面
│   │   ├── SwitchView.vue        # 账号切换页面
│   │   ├── SettingsView.vue      # 设置页面
│   │   └── TutorialView.vue      # 教程页面
│   ├── stores/                   # Pinia 状态管理
│   ├── router/                   # Vue Router 路由
│   ├── styles/                   # 全局样式
│   ├── App.vue                   # 根组件
│   └── main.js                   # 入口文件
├── electron/                     # Electron 主进程
│   ├── main.js                   # 主进程入口
│   └── services/                 # 核心服务
│       ├── registrationBot.js    # 注册机器人
│       ├── emailReceiver.js      # 邮件接收器
│       ├── browserAutomation.js  # 浏览器自动化
│       └── windsurfManager.js    # Windsurf 管理器
├── docs/                         # 文档
├── index.html                    # HTML 入口
├── vite.config.js                # Vite 配置
└── package.json                  # 项目配置
```

---

## ❓ 常见问题

### Q: 注册时 Cloudflare 验证失败怎么办？

A: 尝试以下方法：
1. 关闭无头模式（取消勾选 Headless）
2. 确保网络稳定
3. 适当降低并发数量

### Q: 验证码获取失败怎么办？

A: 检查以下配置：
1. IMAP 服务器地址是否正确
2. 端口是否为 993
3. 密码是否为授权码（QQ 邮箱等需要）
4. 邮箱是否开启了 IMAP 服务

### Q: macOS 打开提示"无法验证开发者"怎么办？

A: 执行以下命令：
```bash
sudo xattr -rd com.apple.quarantine /Applications/Windsurf-Tool.app
```

### Q: Windows 安装时被杀毒软件拦截怎么办？

A: 这是因为应用未签名导致的误报，可以：
1. 暂时关闭杀毒软件
2. 将应用添加到白名单
3. 使用便携版（portable）

---

## 🔒 安全说明

- 所有账号数据仅存储在本地，不会上传到任何服务器
- 数据存储位置：
  - Windows: `%APPDATA%/windsurf-tool-vue/`
  - macOS: `~/Library/Application Support/windsurf-tool-vue/`

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

## ⭐ Star History

如果这个项目对你有帮助，请给一个 Star ⭐ 支持一下！

---

<p align="center">Made with ❤️ by Windsurf Go Team</p>
