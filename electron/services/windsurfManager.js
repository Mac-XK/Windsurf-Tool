const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Windsurf管理器 - 重置配置、机器码、自动登录
 */
class WindsurfManager {
  constructor(logCallback = null) {
    this.home = process.env.HOME;
    this.logCallback = logCallback; // 日志回调函数
    
    // Windsurf应用路径
    this.windsurfApp = '/Applications/Windsurf.app';
    
    // Windsurf相关路径
    this.paths = {
      appSupport: path.join(this.home, 'Library/Application Support/Windsurf'),
      preferences: path.join(this.home, 'Library/Preferences/com.exafunction.windsurf.plist'),
      httpStorages: path.join(this.home, 'Library/HTTPStorages/com.exafunction.windsurf'),
      caches: path.join(this.home, 'Library/Caches/com.exafunction.windsurf'),
      shipitCaches: path.join(this.home, 'Library/Caches/com.exafunction.windsurf.ShipIt'),
    };
    
    // 需要删除的子目录
    this.deleteSubdirs = [
      'Cache',
      'CachedData',
      'CachedExtensionVSIXs',
      'CachedProfilesData',
      'Code Cache',
      'Cookies',
      'Cookies-journal',
      'Crashpad',
      'DawnGraphiteCache',
      'DawnWebGPUCache',
      'GPUCache',
      'Local Storage',
      'Session Storage',
      'Shared Dictionary',
      'SharedStorage',
      'TransportSecurity',
      'Trust Tokens',
      'Trust Tokens-journal',
      'blob_storage',
      'logs',
      'Network Persistent State',
    ];
    
    // 配置文件路径
    this.storageJson = path.join(this.paths.appSupport, 'User/globalStorage/storage.json');
    this.machineidFile = path.join(this.paths.appSupport, 'machineid');
  }


  /**
   * 生成64位十六进制机器ID
   */
  generateMachineId() {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 64; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  /**
   * 生成UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 生成带大括号的UUID
   */
  generateSqmId() {
    return '{' + this.generateUUID() + '}';
  }

  /**
   * 检查Windsurf是否正在运行
   */
  async checkWindsurfRunning() {
    try {
      const { stdout } = await execPromise('pgrep -f Windsurf');
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 关闭Windsurf应用 - 增强版
   * 多次重试确保强制关闭成功
   */
  async closeWindsurf() {
    try {
      this.log('\n🚫 正在关闭Windsurf...');
      
      // 检查是否正在运行
      const isRunning = await this.checkWindsurfRunning();
      if (!isRunning) {
        this.log('✓ Windsurf未运行');
        return true;
      }
      
      this.log('检测到Windsurf正在运行,开始关闭...');
      
      // 第1次尝试: 正常关闭
      this.log('第1次尝试: 正常关闭 (killall Windsurf)...');
      await execPromise('killall Windsurf').catch(() => {});
      await this.sleep(2000);
      
      // 检查是否关闭
      if (!await this.checkWindsurfRunning()) {
        this.log('✓ Windsurf已成功关闭');
        return true;
      }
      
      // 第2次尝试: 强制关闭
      this.log('第2次尝试: 强制关闭 (killall -9 Windsurf)...');
      await execPromise('killall -9 Windsurf').catch(() => {});
      await this.sleep(2000);
      
      if (!await this.checkWindsurfRunning()) {
        this.log('✓ Windsurf已强制关闭');
        return true;
      }
      
      // 第3次尝试: 使用pkill
      this.log('第3次尝试: 使用pkill强制关闭...');
      await execPromise('pkill -9 -f Windsurf').catch(() => {});
      await this.sleep(2000);
      
      if (!await this.checkWindsurfRunning()) {
        this.log('✓ Windsurf已强制关闭');
        return true;
      }
      
      // 第4次尝试: 获取PID并kill
      this.log('第4次尝试: 获取PID并kill...');
      try {
        const { stdout } = await execPromise('pgrep -f Windsurf');
        const pids = stdout.trim().split('\n').filter(pid => pid);
        
        for (const pid of pids) {
          this.log(`  正在kill PID: ${pid}`);
          await execPromise(`kill -9 ${pid}`).catch(() => {});
        }
        
        await this.sleep(2000);
        
        if (!await this.checkWindsurfRunning()) {
          this.log('✓ Windsurf已强制关闭');
          return true;
        }
      } catch (error) {
        this.log('获取PID失败:', error.message);
      }
      
      // 第5次尝试: 使用AppleScript强制退出
      this.log('第5次尝试: 使用AppleScript强制退出...');
      try {
        const script = `
          tell application "System Events"
            set appList to name of every process whose name is "Windsurf"
            repeat with appName in appList
              do shell script "killall -9 Windsurf"
            end repeat
          end tell
        `;
        await execPromise(`osascript -e '${script}'`).catch(() => {});
        await this.sleep(2000);
        
        if (!await this.checkWindsurfRunning()) {
          this.log('✓ Windsurf已强制关闭');
          return true;
        }
      } catch (error) {
        this.log('AppleScript关闭失败:', error.message);
      }
      
      // 最后检查 - 宽松处理
      const stillRunning = await this.checkWindsurfRunning();
      if (stillRunning) {
        this.log('⚠️  Windsurf进程可能仍在运行，但将继续执行');
        // 不返回false，继续执行
        return true;
      }
      
      this.log('✓ Windsurf已关闭');
      return true;
      
    } catch (error) {
      this.log('关闭Windsurf失败:', error.message);
      return false;
    }
  }

  /**
   * 检测Windsurf配置文件路径
   */
  async detectConfigPaths() {
    const results = {
      appSupport: { exists: false, path: this.paths.appSupport },
      preferences: { exists: false, path: this.paths.preferences },
      httpStorages: { exists: false, path: this.paths.httpStorages },
      caches: { exists: false, path: this.paths.caches },
      shipitCaches: { exists: false, path: this.paths.shipitCaches },
      storageJson: { exists: false, path: this.storageJson },
      machineidFile: { exists: false, path: this.machineidFile },
    };

    for (const key in results) {
      try {
        await fs.access(results[key].path);
        results[key].exists = true;
      } catch (error) {
        results[key].exists = false;
      }
    }

    return results;
  }

  /**
   * 删除缓存和数据
   */
  async deleteCachesAndData() {
    this.log('\n🗑️  删除缓存和数据...');
    
    // 删除Application Support下的子目录
    for (const subdir of this.deleteSubdirs) {
      const dirPath = path.join(this.paths.appSupport, subdir);
      try {
        const stat = await fs.stat(dirPath);
        if (stat.isFile()) {
          await fs.unlink(dirPath);
          this.log(`  ✓ 已删除文件: ${subdir}`);
        } else {
          await fs.rm(dirPath, { recursive: true, force: true });
          this.log(`  ✓ 已删除目录: ${subdir}`);
        }
      } catch (error) {
        // 文件不存在,跳过
      }
    }
    
    // 删除Preferences
    try {
      await fs.unlink(this.paths.preferences);
      this.log('  ✓ 已删除: Preferences');
    } catch (error) {
      // 文件不存在
    }
    
    // 删除HTTP Storages
    try {
      await fs.rm(this.paths.httpStorages, { recursive: true, force: true });
      this.log('  ✓ 已删除: HTTP Storages');
    } catch (error) {
      // 目录不存在
    }
    
    // 删除Caches
    for (const cachePath of [this.paths.caches, this.paths.shipitCaches]) {
      try {
        await fs.rm(cachePath, { recursive: true, force: true });
        this.log(`  ✓ 已删除: ${path.basename(cachePath)}`);
      } catch (error) {
        // 目录不存在
      }
    }
  }

  /**
   * 清理用户数据
   */
  async cleanUserData() {
    this.log('\n🧹 清理用户数据...');
    
    const userDir = path.join(this.paths.appSupport, 'User');
    
    try {
      await fs.access(userDir);
    } catch (error) {
      this.log('  ⚠️  User目录不存在');
      return;
    }
    
    // 删除globalStorage(除了storage.json)
    const globalStorage = path.join(userDir, 'globalStorage');
    try {
      const items = await fs.readdir(globalStorage);
      for (const item of items) {
        if (item !== 'storage.json') {
          const itemPath = path.join(globalStorage, item);
          const stat = await fs.stat(itemPath);
          if (stat.isFile()) {
            await fs.unlink(itemPath);
          } else {
            await fs.rm(itemPath, { recursive: true, force: true });
          }
          this.log(`  ✓ 已删除: globalStorage/${item}`);
        }
      }
    } catch (error) {
      // 目录不存在
    }
    
    // 清理workspaceStorage
    const workspaceStorage = path.join(userDir, 'workspaceStorage');
    try {
      await fs.rm(workspaceStorage, { recursive: true, force: true });
      await fs.mkdir(workspaceStorage, { recursive: true });
      this.log('  ✓ 已清理: workspaceStorage');
    } catch (error) {
      // 处理失败
    }
    
    // 清理History
    const history = path.join(userDir, 'History');
    try {
      await fs.rm(history, { recursive: true, force: true });
      await fs.mkdir(history, { recursive: true });
      this.log('  ✓ 已清理: History');
    } catch (error) {
      // 处理失败
    }
  }

  /**
   * 创建预设配置 - 跳过初始设置
   */
  async createPresetConfig() {
    this.log('\n📝 创建预设配置...');
    
    // 生成新的ID
    const newMachineId = this.generateMachineId();
    const newSqmId = this.generateSqmId();
    const newDeviceId = this.generateUUID();
    const newMachineid = this.generateUUID();
    
    this.log(`  新machineId: ${newMachineId}`);
    this.log(`  新sqmId: ${newSqmId}`);
    this.log(`  新devDeviceId: ${newDeviceId}`);
    this.log(`  新machineid: ${newMachineid}`);
    
    // 1. 创建 settings.json - 基础设置
    try {
      const settingsPath = path.join(this.paths.appSupport, 'User/settings.json');
      const settings = {
        "workbench.startupEditor": "none",  // 跳过欢迎页
        "workbench.welcomePage.walkthroughs.openOnInstall": false,  // 跳过演练
        "telemetry.telemetryLevel": "off",  // 关闭遥测
        "window.commandCenter": true,
        "explorer.confirmDragAndDrop": false,
        "explorer.confirmDelete": false
      };
      
      await fs.mkdir(path.dirname(settingsPath), { recursive: true });
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      this.log('  ✓ 已创建: settings.json');
    } catch (error) {
      this.log(`  ✗ 创建失败 settings.json: ${error.message}`);
    }
    
    // 2. 创建 storage.json - 完整配置
    try {
      const storageData = {
        "telemetry.machineId": newMachineId,
        "telemetry.sqmId": newSqmId,
        "telemetry.devDeviceId": newDeviceId,
        "theme": "vs-dark",  // 默认深色主题
        "themeBackground": "#1f1f1f",
        "colorThemeData": JSON.stringify({
          "id": "vs-dark vscode-theme-defaults-themes-dark_plus-json",
          "label": "Dark+",
          "settingsId": "Default Dark+",
          "themeTokenColors": [],
          "semanticTokenRules": [],
          "extensionData": {
            "_extensionId": "vscode.theme-defaults",
            "_extensionIsBuiltin": true,
            "_extensionName": "theme-defaults",
            "_extensionPublisher": "vscode"
          },
          "themeSemanticHighlighting": false,
          "colorMap": {}
        }),
        "windowSplash": {
          "zoomLevel": 0,
          "baseTheme": "vs-dark",
          "colorInfo": {
            "foreground": "#cccccc",
            "background": "#1f1f1f",
            "editorBackground": "#1f1f1f",
            "titleBarBackground": "#181818",
            "activityBarBackground": "#181818",
            "sideBarBackground": "#181818",
            "statusBarBackground": "#181818"
          },
          "layoutInfo": {
            "sideBarSide": "left",
            "editorPartMinWidth": 220,
            "titleBarHeight": 35,
            "activityBarWidth": 42,
            "sideBarWidth": 300,
            "statusBarHeight": 22,
            "windowBorder": false
          }
        },
        "windowControlHeight": 35
      };
      
      await fs.mkdir(path.dirname(this.storageJson), { recursive: true });
      
      // 如果文件已存在且只读，先删除
      try {
        await fs.chmod(this.storageJson, 0o644);
        await fs.unlink(this.storageJson);
      } catch (e) {
        // 文件不存在，忽略
      }
      
      await fs.writeFile(this.storageJson, JSON.stringify(storageData, null, 4));
      await fs.chmod(this.storageJson, 0o444);  // 只读
      this.log('  ✓ 已创建: storage.json');
      this.log('  ✓ 已设置为只读');
    } catch (error) {
      this.log(`  ✗ 创建失败 storage.json: ${error.message}`);
    }
    
    // 3. 创建 machineid 文件
    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(this.machineidFile), { recursive: true });
      
      // 如果文件已存在且只读，先删除
      try {
        await fs.chmod(this.machineidFile, 0o644);
        await fs.unlink(this.machineidFile);
      } catch (e) {
        // 文件不存在，忽略
      }
      
      // 创建新文件
      await fs.writeFile(this.machineidFile, newMachineid + '\n');
      await fs.chmod(this.machineidFile, 0o444);  // 只读
      this.log('  ✓ 已创建: machineid');
      this.log('  ✓ 已设置为只读');
    } catch (error) {
      this.log(`  ✗ 创建失败 machineid: ${error.message}`);
      // 即使失败也继续，不影响整体流程
    }
    
    // 4. 创建必要的目录结构
    try {
      const dirs = [
        path.join(this.paths.appSupport, 'User/workspaceStorage'),
        path.join(this.paths.appSupport, 'User/History'),
        path.join(this.paths.appSupport, 'User/globalStorage')
      ];
      
      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
      }
      this.log('  ✓ 已创建必要目录');
    } catch (error) {
      this.log(`  ✗ 创建目录失败: ${error.message}`);
    }
  }

  /**
   * 重置机器标识 (旧方法,保留兼容)
   */
  async resetMachineIds() {
    this.log('\n🔧 重置机器标识...');
    
    // 生成新的ID
    const newMachineId = this.generateMachineId();
    const newSqmId = this.generateSqmId();
    const newDeviceId = this.generateUUID();
    const newMachineid = this.generateUUID();
    
    this.log(`  新machineId: ${newMachineId}`);
    this.log(`  新sqmId: ${newSqmId}`);
    this.log(`  新devDeviceId: ${newDeviceId}`);
    this.log(`  新machineid: ${newMachineid}`);
    
    // 修改storage.json
    try {
      let data;
      try {
        const content = await fs.readFile(this.storageJson, 'utf-8');
        data = JSON.parse(content);
      } catch (error) {
        // 文件不存在,创建新的
        data = {};
      }
      
      // 修改三个字段
      data['telemetry.machineId'] = newMachineId;
      data['telemetry.sqmId'] = newSqmId;
      data['telemetry.devDeviceId'] = newDeviceId;
      
      // 清理其他可能的标识字段
      const keysToRemove = [
        'backupWorkspaces',
        'profileAssociations',
        'windowControlHeight',
        'lastKnownMenubarData'
      ];
      for (const key of keysToRemove) {
        delete data[key];
      }
      
      // 确保目录存在
      await fs.mkdir(path.dirname(this.storageJson), { recursive: true });
      
      // 写回文件
      await fs.writeFile(this.storageJson, JSON.stringify(data, null, 4));
      
      // 设置为只读
      await fs.chmod(this.storageJson, 0o444);
      
      this.log('  ✓ 已修改: storage.json');
      this.log('  ✓ 已设置为只读');
    } catch (error) {
      this.log(`  ✗ 修改失败 storage.json: ${error.message}`);
    }
    
    // 修改machineid文件
    try {
      await fs.mkdir(path.dirname(this.machineidFile), { recursive: true });
      await fs.writeFile(this.machineidFile, newMachineid + '\n');
      await fs.chmod(this.machineidFile, 0o444);
      this.log('  ✓ 已修改: machineid');
      this.log('  ✓ 已设置为只读');
    } catch (error) {
      this.log(`  ✗ 修改失败 machineid: ${error.message}`);
    }
  }

  /**
   * 完整重置Windsurf (新版 - 使用预设配置)
   * 流程: 强制关闭 → 清除配置 → 重置机器码 → 创建预设配置
   */
  async fullReset() {
    this.log('='.repeat(60));
    this.log('Windsurf完整重置');
    this.log('='.repeat(60));
    
    try {
      // ========== 步骤1: 强制关闭Windsurf ==========
      this.log('\n【步骤1/4】强制关闭Windsurf');
      const isRunning = await this.checkWindsurfRunning();
      if (isRunning) {
        this.log('⚠️  检测到Windsurf正在运行');
        const closed = await this.closeWindsurf();
        
        // closeWindsurf已经是宽松模式，总是返回true
        this.log('✓ Windsurf关闭流程完成');
        // 等待系统释放文件锁
        await this.sleep(3000);
      } else {
        this.log('✓ Windsurf未运行');
      }
      
      // ========== 步骤2: 删除缓存和数据 ==========
      this.log('\n【步骤2/4】删除缓存和数据');
      await this.deleteCachesAndData();
      this.log('✓ 缓存和数据已删除');
      
      // ========== 步骤3: 清理用户数据 ==========
      this.log('\n【步骤3/4】清理用户数据');
      await this.cleanUserData();
      this.log('✓ 用户数据已清理');
      
      // ========== 步骤4: 创建预设配置 (重置机器码) ==========
      this.log('\n【步骤4/4】创建预设配置并重置机器码');
      await this.createPresetConfig();
      this.log('✓ 预设配置已创建，机器码已重置');
      
      this.log('\n' + '='.repeat(60));
      this.log('✅ Windsurf重置完成!');
      this.log('='.repeat(60));
      
      return { success: true, message: 'Windsurf重置完成' };
    } catch (error) {
      console.error('\n❌ 重置失败:', error.message);
      console.error('错误详情:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 启动Windsurf应用
   */
  async launchWindsurf() {
    try {
      this.log('\n🚀 启动Windsurf...');
      await execPromise(`open "${this.windsurfApp}"`);
      this.log('  ✓ Windsurf已启动');
      return true;
    } catch (error) {
      this.log(`  ✗ 启动失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 检测Windsurf应用路径
   */
  async detectWindsurfApp() {
    const possiblePaths = [
      '/Applications/Windsurf.app',
      path.join(this.home, 'Applications/Windsurf.app'),
      '/System/Applications/Windsurf.app'
    ];
    
    for (const appPath of possiblePaths) {
      try {
        await fs.access(appPath);
        this.windsurfApp = appPath;
        this.log(`✓ 找到Windsurf应用: ${appPath}`);
        return appPath;
      } catch (error) {
        // 继续检查下一个路径
      }
    }
    
    throw new Error('未找到Windsurf应用,请确认已安装');
  }

  /**
   * 点击UI元素 - 使用AppleScript
   */
  async clickButton(buttonName, windowIndex = 1) {
    try {
      const script = `
        tell application "System Events"
          tell process "Windsurf"
            click button "${buttonName}" of window ${windowIndex}
          end tell
        end tell
      `;
      await execPromise(`osascript -e '${script}'`);
      this.log(`✓ 已点击按钮: ${buttonName}`);
      return true;
    } catch (error) {
      this.log(`✗ 点击按钮失败 ${buttonName}: ${error.message}`);
      return false;
    }
  }

  /**
   * 点击UI元素(通过索引)
   */
  async clickButtonByIndex(index, windowIndex = 1) {
    try {
      const script = `
        tell application "System Events"
          tell process "Windsurf"
            click button ${index} of window ${windowIndex}
          end tell
        end tell
      `;
      await execPromise(`osascript -e '${script}'`);
      this.log(`✓ 已点击按钮索引: ${index}`);
      return true;
    } catch (error) {
      this.log(`✗ 点击按钮失败 [${index}]: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取窗口中的所有按钮
   */
  async getWindowButtons(windowIndex = 1) {
    try {
      const script = `
        tell application "System Events"
          tell process "Windsurf"
            name of every button of window ${windowIndex}
          end tell
        end tell
      `;
      const { stdout } = await execPromise(`osascript -e '${script}'`);
      this.log(`窗口 ${windowIndex} 的按钮:`, stdout.trim());
      return stdout.trim();
    } catch (error) {
      this.log(`获取按钮列表失败: ${error.message}`);
      return '';
    }
  }

  /**
   * 等待窗口出现
   */
  async waitForWindow(timeout = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const script = `
          tell application "System Events"
            tell process "Windsurf"
              count of windows
            end tell
          end tell
        `;
        const { stdout } = await execPromise(`osascript -e '${script}'`);
        const windowCount = parseInt(stdout.trim());
        if (windowCount > 0) {
          this.log(`✓ 检测到 ${windowCount} 个窗口`);
          return windowCount;
        }
      } catch (error) {
        // 继续等待
      }
      await this.sleep(1000);
    }
    return 0;
  }

  /**
   * 检查窗口是否存在
   */
  async hasWindow(windowIndex = 1) {
    try {
      const script = `
        tell application "System Events"
          tell process "Windsurf"
            exists window ${windowIndex}
          end tell
        end tell
      `;
      const { stdout } = await execPromise(`osascript -e '${script}'`);
      return stdout.trim() === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * 统一的按钮点击方法
   * 尝试多种方式点击按钮：Tab导航+Enter、直接点击按钮名称、点击按钮索引
   */
  async clickButtonUnified(buttonName, buttonIndex = null, useTab = false) {
    try {
      this.log(`\n🎯 尝试点击按钮: ${buttonName}`);
      
      // 激活Windsurf窗口
      await this.activateWindsurf();
      await this.sleep(500);
      
      // 方法1: 使用Tab键导航 + Enter（如果指定）
      if (useTab && buttonIndex !== null) {
        this.log(`  方法1: 使用Tab键导航到第 ${buttonIndex} 个按钮...`);
        // buttonIndex是按钮位置（从1开始），需要按Tab键 (buttonIndex-1) 次
        const tabCount = buttonIndex - 1;
        for (let i = 0; i < tabCount; i++) {
          await this.pressTab();
          await this.sleep(300);
        }
        this.log(`  已按 ${tabCount} 次Tab键，现在按Enter...`);
        await this.pressEnter();
        await this.sleep(2000);
        
        // 检查是否成功（窗口是否还存在）
        const stillHasWindow = await this.hasWindow(1);
        if (!stillHasWindow) {
          this.log(`  ✓ 成功点击 ${buttonName}`);
          return true;
        }
      }
      
      // 方法2: 直接通过按钮名称点击
      this.log(`  方法2: 通过按钮名称点击...`);
      const clicked = await this.clickButton(buttonName, 1);
      if (clicked) {
        await this.sleep(2000);
        const stillHasWindow = await this.hasWindow(1);
        if (!stillHasWindow) {
          this.log(`  ✓ 成功点击 ${buttonName}`);
          return true;
        }
      }
      
      // 方法3: 通过索引点击
      if (buttonIndex !== null) {
        this.log(`  方法3: 通过索引 ${buttonIndex} 点击...`);
        await this.clickButtonByIndex(buttonIndex, 1);
        await this.sleep(2000);
        const stillHasWindow = await this.hasWindow(1);
        if (!stillHasWindow) {
          this.log(`  ✓ 成功点击 ${buttonName}`);
          return true;
        }
      }
      
      this.log(`  ⚠️  所有方法都未能确认点击成功`);
      return false;
      
    } catch (error) {
      this.log(`  ✗ 点击失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取 AppleScript 脚本路径
   */
  getAppleScriptPath() {
    const fs = require('fs');
    
    // 开发环境路径
    const devScriptPath = path.join(__dirname, 'clickLogin.applescript');
    if (fs.existsSync(devScriptPath)) {
      return devScriptPath;
    }
    
    // 打包后路径
    const prodScriptPath = path.join(process.resourcesPath, 'app/src/clickLogin.applescript');
    if (process.resourcesPath && fs.existsSync(prodScriptPath)) {
      return prodScriptPath;
    }
    
    return null;
  }

  /**
   * 使用 AppleScript 点击 Log in 按钮
   */
  async clickLoginWithAppleScript() {
    try {
      const scriptPath = this.getAppleScriptPath();
      
      if (!scriptPath) {
        this.log('✗ 未找到 AppleScript 脚本');
        return false;
      }
      
      this.log('✓ 使用 AppleScript: ' + scriptPath);
      this.log('执行点击命令...');
      
      const command = `osascript "${scriptPath}"`;
      
      try {
        const { stdout, stderr } = await execPromise(command, {
          timeout: 10000, // 10秒超时
        });
        
        if (stdout) {
          this.log(stdout.trim());
        }
        
        if (stderr && !stderr.includes('deprecated')) {
          this.log('⚠️ ' + stderr.trim());
        }
        
        // 等待检查窗口是否关闭
        await this.sleep(1500);
        const stillHasWindow = await this.hasWindow(1);
        
        if (!stillHasWindow) {
          this.log('✓ 点击成功，窗口已关闭');
          return true;
        }
        
        this.log('⚠️ 点击后窗口仍存在');
        return false;
        
      } catch (error) {
        this.log('✗ AppleScript 执行失败: ' + error.message);
        if (error.message.includes('ENOENT')) {
          this.log('💡 AppleScript 文件未找到');
        } else if (error.message.includes('timeout')) {
          this.log('💡 执行超时，请检查Windsurf窗口是否正常显示');
        }
        
        return false;
      }
    } catch (error) {
      this.log('✗ 执行失败: ' + error.message);
      return false;
    }
  }

  /**
   * 获取窗口位置和大小
   */
  async getWindowBounds() {
    try {
      const script = `
        tell application "System Events"
          tell process "Windsurf"
            set pos to position of window 1
            set sz to size of window 1
            return (item 1 of pos) & "," & (item 2 of pos) & "," & (item 1 of sz) & "," & (item 2 of sz)
          end tell
        end tell
      `;
      const { stdout } = await execPromise(`osascript -e '${script}'`);
      const parts = stdout.trim().split(',');
      
      if (parts.length !== 4) {
        this.log(`窗口位置格式错误: ${stdout}`);
        return null;
      }
      
      return {
        x: parseInt(parts[0]),
        y: parseInt(parts[1]),
        width: parseInt(parts[2]),
        height: parseInt(parts[3])
      };
    } catch (error) {
      this.log(`获取窗口位置失败: ${error.message}`);
      return null;
    }
  }


  /**
   * 自动完成初始设置流程 - 优化版
   * 前3个页面：直接按回车键（无延迟）
   * 第4个页面：使用Python PyAutoGUI精确点击Log in按钮
   */
  async completeOnboarding() {
    try {
      this.log('\n🎯 开始自动完成初始设置...');
      
      // 等待窗口出现
      this.log('\n等待Windsurf窗口...');
      const windowCount = await this.waitForWindow(30000);
      if (windowCount === 0) {
        this.log('⚠️  未检测到窗口，可能Windsurf已经配置完成');
        return { success: true, message: '未检测到欢迎窗口' };
      }
      
      this.log(`✓ 检测到 ${windowCount} 个窗口`);
      
      // 等待窗口内容完全加载
      this.log('等待窗口内容完全加载（3秒）...');
      await this.sleep(3000);
      
      // 激活Windsurf窗口
      await this.activateWindsurf();
      await this.sleep(500);
      
      this.log('\n💡 前3个页面使用回车键，第4个页面使用精确点击\n');
      
      // 前3个页面：直接按回车键，无延迟
      for (let step = 1; step <= 3; step++) {
        this.log(`--- 步骤 ${step}/4: 按回车键 ---`);
        
        // 检查窗口是否还存在
        const hasWindow = await this.hasWindow(1);
        if (!hasWindow) {
          this.log('✓ 窗口已关闭，流程完成');
          return { success: true, message: '初始设置完成' };
        }
        
        // 激活窗口并按回车
        await this.activateWindsurf();
        await this.sleep(200);
        await this.pressEnter();
        this.log(`✓ 已按回车键`);
        
        // 短暂等待页面切换
        await this.sleep(800);
      }
      
      // 第4个页面：使用 AppleScript 精确点击 Log in 按钮
      this.log('\n--- 步骤 4/4: 精确点击 Log in 按钮 ---');
      
      // 检查窗口是否还存在
      const hasWindow = await this.hasWindow(1);
      if (!hasWindow) {
        this.log('✓ 窗口已关闭，流程完成');
        return { success: true, message: '初始设置完成' };
      }
      
      // 使用 AppleScript 点击按钮
      this.log('使用 AppleScript 点击 Log in 按钮...');
      const clicked = await this.clickLoginWithAppleScript();
      
      if (clicked) {
        this.log('✓ Log in 按钮点击成功');
        this.log('\n✓ 初始设置流程完成，浏览器应该已打开');
        return { success: true, message: '初始设置完成' };
      }
      
      this.log('\n⚠️  自动点击失败，窗口仍然存在');
      this.log('💡 请手动点击 Log in 按钮');
      
      return { success: true, message: '初始设置完成' };
      
    } catch (error) {
      this.log(`⚠️  设置流程出错: ${error.message}`);
      this.log('继续执行，可能需要手动完成部分步骤');
      return { success: true, message: '部分自动化完成' };
    }
  }

  /**
   * 自动登录Windsurf - 完整版
   * 1. 检查是否已有欢迎窗口
   * 2. 如果没有，启动应用
   * 3. 完成初始设置
   * 4. 浏览器自动登录
   */
  async autoLogin(email, password) {
    try {
      this.log('\n🔐 开始自动登录Windsurf...');
      this.log(`📧 邮箱: ${email}`);
      this.log(`🔑 密码: ${password}`);
      
      // 检测Windsurf应用
      await this.detectWindsurfApp();
      
      // 检查Windsurf是否已经运行并有欢迎窗口
      const isRunning = await this.checkWindsurfRunning();
      let hasWelcomeWindow = false;
      
      if (isRunning) {
        this.log('✓ 检测到Windsurf已运行');
        // 检查是否有欢迎窗口
        try {
          const windowCount = await this.waitForWindow(2000); // 短暂检查
          if (windowCount > 0) {
            hasWelcomeWindow = true;
            this.log('✓ 检测到欢迎窗口，跳过重启步骤');
          }
        } catch (error) {
          // 没有窗口
        }
      }
      
      // 如果没有欢迎窗口，需要启动Windsurf
      if (!hasWelcomeWindow) {
        if (isRunning) {
          this.log('⚠️  Windsurf已运行但没有欢迎窗口，可能已经登录');
          this.log('💡 如果需要重新登录，请先手动关闭Windsurf或使用重置功能');
          return { 
            success: false, 
            error: 'Windsurf已运行但没有欢迎窗口，请先关闭或重置'
          };
        }
        
        // 启动Windsurf
        await this.launchWindsurf();
        
        // 等待Windsurf完全启动并显示界面（5秒）
        this.log('⏱️  等待Windsurf完全启动（5秒）...');
        await this.sleep(5000);
      }
      
      // 完成初始设置流程
      const onboardingResult = await this.completeOnboarding();
      if (!onboardingResult.success) {
        throw new Error('初始设置失败: ' + onboardingResult.error);
      }
      
      this.log('\n💡 提示: 浏览器将打开登录页面');
      this.log('💡 请在浏览器中完成登录,或使用浏览器自动化工具');
      
      return { 
        success: true, 
        message: '登录流程已启动,等待浏览器登录',
        email: email,
        password: password
      };
      
    } catch (error) {
      console.error('自动登录失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 使用AppleScript输入文本
   */
  async typeText(text) {
    // 转义特殊字符
    const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const script = `
      tell application "System Events"
        keystroke "${escapedText}"
      end tell
    `;
    await execPromise(`osascript -e '${script}'`);
  }

  /**
   * 使用AppleScript按键
   */
  async pressKey(key) {
    const script = `
      tell application "System Events"
        key code ${this.getKeyCode(key)}
      end tell
    `;
    await execPromise(`osascript -e '${script}'`);
  }

  /**
   * 按Enter键 - 使用macOS系统内置功能
   */
  async pressEnter() {
    try {
      // 使用AppleScript的key code方式（更可靠）
      // key code 36 = Return键（主键盘回车）
      const script = `
        tell application "System Events"
          tell process "Windsurf"
            key code 36
          end tell
        end tell
      `;
      await execPromise(`osascript -e '${script}'`);
      return true;
    } catch (error) {
      this.log(`按Enter键失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 按Space键
   */
  async pressSpace() {
    try {
      const script = `
        tell application "System Events"
          tell process "Windsurf"
            key code 49
          end tell
        end tell
      `;
      await execPromise(`osascript -e '${script}'`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 激活Windsurf窗口
   */
  async activateWindsurf() {
    try {
      const script = `
        tell application "Windsurf"
          activate
        end tell
      `;
      await execPromise(`osascript -e '${script}'`);
      this.log('✓ 已激活Windsurf窗口');
      return true;
    } catch (error) {
      this.log(`激活窗口失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 使用AppleScript按组合键
   */
  async pressKeyCombo(...keys) {
    const modifiers = [];
    const mainKey = keys[keys.length - 1];
    
    for (let i = 0; i < keys.length - 1; i++) {
      modifiers.push(keys[i] + ' down');
    }
    
    const modifierStr = modifiers.length > 0 ? ' using {' + modifiers.join(', ') + '}' : '';
    const script = `
      tell application "System Events"
        key code ${this.getKeyCode(mainKey)}${modifierStr}
      end tell
    `;
    await execPromise(`osascript -e '${script}'`);
  }

  /**
   * 获取键盘码
   */
  getKeyCode(key) {
    const keyCodes = {
      'return': '36',
      'tab': '48',
      'space': '49',
      'delete': '51',
      'escape': '53',
      'enter': '76'
    };
    return keyCodes[key] || '36';
  }

  /**
   * 使用AppleScript自动化浏览器登录
   * 适用于系统默认浏览器（Chrome/Safari等）
   */
  async autoFillBrowserLogin(email, password) {
    try {
      this.log('\n🌐 开始浏览器自动化登录...');
      
      // 等待浏览器窗口出现和页面加载
      await this.sleep(3000);
      
      // 检测浏览器类型并激活
      const browsers = ['Google Chrome', 'Safari', 'Firefox', 'Microsoft Edge'];
      let activeBrowser = null;
      
      for (const browser of browsers) {
        try {
          const script = `
            tell application "System Events"
              exists process "${browser}"
            end tell
          `;
          const { stdout } = await execPromise(`osascript -e '${script}'`);
          if (stdout.trim() === 'true') {
            activeBrowser = browser;
            this.log(`✓ 检测到浏览器: ${browser}`);
            break;
          }
        } catch (e) {
          // 继续检查下一个
        }
      }
      
      if (!activeBrowser) {
        return { success: false, error: '未检测到浏览器' };
      }
      
      // 激活浏览器并等待页面加载
      const activateScript = `
        tell application "${activeBrowser}"
          activate
        end tell
      `;
      await execPromise(`osascript -e '${activateScript}'`);
      await this.sleep(2000); // 等待页面加载
      
      // 转义特殊字符
      const escapedEmail = email.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const escapedPassword = password.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      
      // 方法1: 先点击地址栏或使用 Cmd+L 聚焦，然后定位到第一个输入框
      this.log('定位到邮箱输入框...');
      try {
        // 先按 Cmd+L 聚焦地址栏，然后按 Escape 取消，再按 Tab 到第一个输入框
        const focusScript = `
          tell application "System Events"
            tell process "${activeBrowser}"
              -- 按 Cmd+L 聚焦地址栏
              key code 37 using {command down}
              delay 0.3
              -- 按 Escape 取消地址栏
              key code 53
              delay 0.3
              -- 按 Tab 键导航到第一个输入框（通常是邮箱输入框）
              key code 48
              delay 0.5
            end tell
          end tell
        `;
        await execPromise(`osascript -e '${focusScript}'`);
      } catch (e) {
        this.log('⚠️ 定位输入框失败，尝试直接输入');
      }
      
      // 输入邮箱
      this.log('输入邮箱...');
      const emailScript = `
        tell application "System Events"
          tell process "${activeBrowser}"
            keystroke "${escapedEmail}"
          end tell
        end tell
      `;
      await execPromise(`osascript -e '${emailScript}'`);
      await this.sleep(800);
      
      // Tab到密码框
      this.log('定位到密码输入框...');
      const tabScript = `
        tell application "System Events"
          tell process "${activeBrowser}"
            key code 48
          end tell
        end tell
      `;
      await execPromise(`osascript -e '${tabScript}'`);
      await this.sleep(800);
      
      // 输入密码
      this.log('输入密码...');
      const passwordScript = `
        tell application "System Events"
          tell process "${activeBrowser}"
            keystroke "${escapedPassword}"
          end tell
        end tell
      `;
      await execPromise(`osascript -e '${passwordScript}'`);
      await this.sleep(800);
      
      // 尝试找到并点击登录按钮
      this.log('查找登录按钮...');
      try {
        const clickButtonScript = `
          tell application "System Events"
            tell process "${activeBrowser}"
              try
                -- 尝试通过按钮名称查找
                set buttonFound to false
                set allButtons to buttons of window 1
                repeat with btn in allButtons
                  try
                    set btnName to name of btn
                    if btnName contains "Sign in" or btnName contains "Log in" or btnName contains "登录" or btnName contains "Sign In" or btnName contains "Login" then
                      click btn
                      set buttonFound to true
                      exit repeat
                    end if
                  end try
                end repeat
                
                if not buttonFound then
                  -- 如果没找到，按 Tab 键导航到按钮，然后按 Enter
                  key code 48
                  delay 0.3
                  key code 36
                end if
              on error
                -- 如果都失败，直接按 Enter
                key code 36
              end try
            end tell
          end tell
        `;
        await execPromise(`osascript -e '${clickButtonScript}'`);
        this.log('✓ 已点击登录按钮');
      } catch (e) {
        // 如果点击按钮失败，尝试按 Enter
        this.log('⚠️ 点击按钮失败，使用 Enter 键提交');
        const enterScript = `
          tell application "System Events"
            tell process "${activeBrowser}"
              key code 36
            end tell
          end tell
        `;
        await execPromise(`osascript -e '${enterScript}'`);
      }
      
      this.log('✓ 登录信息已填写，等待登录完成');
      
      return { success: true, message: '登录信息已自动填写' };
      
    } catch (error) {
      this.log(`❌ 浏览器自动化失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 按Tab键 - 使用macOS系统内置功能
   */
  async pressTab() {
    try {
      // 使用AppleScript的key code方式
      // key code 48 = Tab键
      const script = `
        tell application "System Events"
          tell process "Windsurf"
            key code 48
          end tell
        end tell
      `;
      await execPromise(`osascript -e '${script}'`);
      return true;
    } catch (error) {
      this.log(`按Tab键失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 输出日志(同时发送到前端)
   */
  log(message) {
    console.log(message);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WindsurfManager;
