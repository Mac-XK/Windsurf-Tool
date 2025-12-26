const { connect } = require('puppeteer-real-browser');
const puppeteer = require('puppeteer');

class RegistrationBot {
  constructor(config) {
    this.config = config;
    // 自定义域名邮箱列表
    this.emailDomains = config.emailDomains || ['example.com'];
    // 邮箱编号计数器(1-999)
    this.emailCounter = 1;
    // 无头模式
    this.headless = config.headless === true;
    console.log('RegistrationBot 初始化 - headless:', this.headless, '原始值:', config.headless);
  }

  /**
   * 生成域名邮箱
   * 格式: 编号(1-999) + 随机字母数字组合
   */
  async generateTempEmail() {
    // 获取当前编号
    const number = this.emailCounter;
    
    // 生成随机字母数字组合(8位)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomStr = '';
    for (let i = 0; i < 8; i++) {
      randomStr += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // 组合用户名: 编号 + 随机字符串
    const username = `${number}${randomStr}`;
    
    // 随机选择配置的域名
    const randomIndex = Math.floor(Math.random() * this.emailDomains.length);
    const domain = this.emailDomains[randomIndex];
    
    // 递增计数器(1-999循环)
    this.emailCounter++;
    if (this.emailCounter > 999) {
      this.emailCounter = 1;
    }
    
    return `${username}@${domain}`;
  }

  /**
   * 获取邮箱验证码（使用本地EmailReceiver）
   * 支持重试机制：最多重试3次，每次间隔30秒
   */
  async getVerificationCode(email, maxWaitTime = 120000) {
    const emailConfig = this.config.emailConfig;
    
    if (!emailConfig) {
      throw new Error('未配置邮箱IMAP信息');
    }
    
    const EmailReceiver = require('./emailReceiver');
    const receiver = new EmailReceiver(emailConfig);
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 30000; // 30秒
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (this.logCallback) {
          this.logCallback(`📬 第 ${attempt} 次尝试获取验证码...`);
        }
        console.log(`[尝试 ${attempt}/${MAX_RETRIES}] 等待 ${email} 的验证码邮件...`);
        
        const code = await receiver.getVerificationCode(email, maxWaitTime);
        
        if (code) {
          if (this.logCallback) {
            this.logCallback(`✓ 成功获取验证码: ${code}`);
          }
          return code;
        }
      } catch (error) {
        console.error(`[尝试 ${attempt}/${MAX_RETRIES}] 获取验证码失败:`, error.message);
        
        if (attempt < MAX_RETRIES) {
          if (this.logCallback) {
            this.logCallback(`⚠️ 第 ${attempt} 次获取失败，${RETRY_DELAY/1000} 秒后重试...`);
          }
          console.log(`等待 ${RETRY_DELAY/1000} 秒后重试...`);
          await this.sleep(RETRY_DELAY);
        } else {
          if (this.logCallback) {
            this.logCallback(`❌ 已重试 ${MAX_RETRIES} 次，仍未获取到验证码`);
          }
          throw new Error(`获取验证码失败，已重试 ${MAX_RETRIES} 次: ${error.message}`);
        }
      }
    }
    
    throw new Error('获取验证码失败，已达到最大重试次数');
  }


  /**
   * 生成随机英文名
   */
  generateRandomName() {
    const firstNames = [
      'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
      'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
      'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
      'Emily', 'Ashley', 'Kimberly', 'Melissa', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda', 'Betty'
    ];
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
      'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott',
      'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Phillips'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return { firstName, lastName };
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
   * 注册单个账号
   */
  async registerAccount(logCallback, stepCallback) {
    this.logCallback = logCallback;
    this.stepCallback = stepCallback; // 步骤进度回调
    let browser, page;
    
    try {
      this.log('🚀 开始连接浏览器...');
      
      let response;
      
      if (this.headless) {
        // 无头模式：使用 puppeteer-real-browser 但设置 headless
        this.log('🔇 无头模式启动...');
        this.log('⚠️ 注意：无头模式可能被 Cloudflare 检测，如失败请关闭无头模式');
        
        response = await connect({
          headless: true,
          fingerprint: true,
          turnstile: true,
          tf: true,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu'
          ]
        });
        
        browser = response.browser;
        page = response.page;
        
      } else {
        // 有头模式：使用 puppeteer-real-browser（更好的反检测）
        this.log('🖥️ 有头模式启动（使用 Real Browser）...');
        
        response = await connect({
          headless: false,
          fingerprint: true,
          turnstile: true,
          tf: true,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        });
        
        browser = response.browser;
        page = response.page;
      }
      
      this.log('✓ 浏览器连接成功');
      
      if (!browser || !page) {
        throw new Error('浏览器或页面对象未创建');
      }
      
      this.log('✓ 浏览器已启动');
      
      // 生成临时邮箱和密码
      const email = await this.generateTempEmail();
      const password = email; // 密码和邮箱一样
      const { firstName, lastName } = this.generateRandomName();
      
      this.log(`📧 邮箱: ${email}`);
      this.log(`👤 姓名: ${firstName} ${lastName}`);
      
      // 访问注册页面
      this.log('🌐 正在访问注册页面...');
      await page.goto('https://windsurf.com/account/register', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      await this.sleep(2000);
      
      // ========== 第一步: 填写基本信息 ==========
      this.log('📝 步骤1: 填写基本信息');
      if (this.stepCallback) this.stepCallback(1, 5); // 步骤1/5
      
      // 等待表单加载
      await page.waitForSelector('input', { timeout: 15000 });
      await this.sleep(1000);
      
      // 填写First name
      const firstNameInput = await page.$('input[name="firstName"], input[placeholder*="First"], input[placeholder*="first"]');
      if (firstNameInput) {
        await firstNameInput.click();
        await firstNameInput.type(firstName, { delay: 100 });
      }
      
      // 填写Last name
      const lastNameInput = await page.$('input[name="lastName"], input[placeholder*="Last"], input[placeholder*="last"]');
      if (lastNameInput) {
        await lastNameInput.click();
        await lastNameInput.type(lastName, { delay: 100 });
      }
      
      // 填写Email
      const emailInput = await page.$('input[type="email"], input[name="email"]');
      if (emailInput) {
        await emailInput.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
        await emailInput.type(email, { delay: 100 });
      }
      
      // 同意条款复选框
      const checkbox = await page.$('input[type="checkbox"]');
      if (checkbox) {
        const isChecked = await page.evaluate(el => el.checked, checkbox);
        if (!isChecked) {
          await checkbox.click();
        }
      }
      
      await this.sleep(1000);
      
      // 点击Continue按钮
      this.log('🔘 点击Continue按钮...');
      let clicked = false;
      
      // 尝试多种方式找到并点击按钮
      try {
        // 方式1: 通过type=submit
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
          clicked = true;
          this.log('✓ Continue按钮点击成功');
        }
      } catch (e) {
        this.log('⚠️ submit按钮点击失败,尝试其他方式');
      }
      
      if (!clicked) {
        try {
          // 方式2: 通过文本内容查找
          const buttons = await page.$$('button');
          for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && (text.includes('Continue') || text.includes('继续'))) {
              await btn.click();
              clicked = true;
              this.log('✓ 通过文本查找点击成功');
              break;
            }
          }
        } catch (e) {
          this.log('⚠️ 文本查找失败');
        }
      }
      
      if (!clicked) {
        throw new Error('无法找到Continue按钮');
      }
      
      await this.sleep(3000);
      
      // ========== 第二步: 填写密码 ==========
      this.log('🔐 步骤2: 填写密码信息');
      if (this.stepCallback) this.stepCallback(2, 5); // 步骤2/5
      
      // 等待密码输入页面
      await page.waitForSelector('input[type="password"]', { timeout: 15000 });
      await this.sleep(1000);
      
      // 再次填写Email（如果需要）
      const emailInput2 = await page.$('input[type="email"], input[name="email"]');
      if (emailInput2) {
        const emailValue = await page.evaluate(el => el.value, emailInput2);
        if (!emailValue) {
          await emailInput2.click();
          await emailInput2.type(email, { delay: 100 });
        }
      }
      
      // 填写密码
      const passwordInputs = await page.$$('input[type="password"]');
      if (passwordInputs.length >= 1) {
        await passwordInputs[0].click();
        await passwordInputs[0].type(password, { delay: 100 });
      }
      
      // 填写确认密码
      if (passwordInputs.length >= 2) {
        await passwordInputs[1].click();
        await passwordInputs[1].type(password, { delay: 100 });
      }
      
      await this.sleep(1000);
      
      // 点击Continue按钮
      this.log('🔘 点击第二个Continue按钮...');
      let clicked2 = false;
      
      try {
        const submitBtn2 = await page.$('button[type="submit"]');
        if (submitBtn2) {
          await submitBtn2.click();
          clicked2 = true;
          this.log('✓ 第二个Continue按钮点击成功');
        }
      } catch (e) {
        this.log('⚠️ 尝试其他方式');
      }
      
      if (!clicked2) {
        try {
          const buttons = await page.$$('button');
          for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && (text.includes('Continue') || text.includes('继续'))) {
              await btn.click();
              clicked2 = true;
              this.log('✓ 通过文本找到按钮');
              break;
            }
          }
        } catch (e) {
          this.log('⚠️ 查找失败');
        }
      }
      
      if (!clicked2) {
        throw new Error('无法找到第二个Continue按钮');
      }
      
      await this.sleep(3000);
      
      // ========== 第三步: Cloudflare人机验证 ==========
      this.log('🛡️ 步骤3: 等待Cloudflare验证...');
      if (this.stepCallback) this.stepCallback(3, 5); // 步骤3/5
      
      // puppeteer-real-browser会自动处理Cloudflare Turnstile验证
      // 等待验证完成
      await this.sleep(10000);
      
      // 点击Continue按钮（验证后）
      this.log('🔘 查找验证后的Continue按钮...');
      let clicked3 = false;
      
      // 尝试多次查找按钮
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // 方式1: 通过submit按钮
          const submitBtn = await page.$('button[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            clicked3 = true;
            this.log('✓ 验证后Continue按钮点击成功');
            break;
          }
        } catch (e) {
          // 忽略错误,继续尝试
        }
        
        if (!clicked3) {
          try {
            // 方式2: 通过文本查找
            const buttons = await page.$$('button');
            for (const btn of buttons) {
              const text = await page.evaluate(el => el.textContent, btn);
              if (text && (text.includes('Continue') || text.includes('继续') || text.includes('Next'))) {
                await btn.click();
                clicked3 = true;
                this.log('✓ 通过文本找到Continue按钮');
                break;
              }
            }
          } catch (e) {
            // 忽略错误
          }
        }
        
        if (clicked3) break;
        
        // 等待1秒后重试
        this.log(`⚠️ 第${attempt + 1}次未找到按钮,等待后重试...`);
        await this.sleep(2000);
      }
      
      if (!clicked3) {
        this.log('⚠️ 未找到Continue按钮,可能已自动跳转');
      }
      
      await this.sleep(3000);
      
      // ========== 第四步: 输入验证码 ==========
      this.log('📮 步骤4: 等待邮箱验证码...');
      if (this.stepCallback) this.stepCallback(4, 5); // 步骤4/5
      
      // 等待验证码输入框
      await page.waitForSelector('input[type="text"], input[name="code"]', { timeout: 15000 });
      
      // 延迟15秒后再获取验证码，避免批量注册时验证码混淆
      this.log('⏱️  延迟 15 秒后获取验证码，避免混淆...');
      await this.sleep(15000);
      
      // 获取验证码
      this.log('📬 正在接收验证码...');
      const verificationCode = await this.getVerificationCode(email);
      this.log(`✓ 获取到验证码: ${verificationCode}`);
      
      // 输入6位验证码
      const codeInputs = await page.$$('input[type="text"], input[name="code"]');
      
      if (codeInputs.length === 6) {
        // 如果是6个独立输入框
        for (let i = 0; i < 6; i++) {
          await codeInputs[i].click();
          await codeInputs[i].type(verificationCode[i], { delay: 100 });
        }
      } else if (codeInputs.length === 1) {
        // 如果是单个输入框
        await codeInputs[0].click();
        await codeInputs[0].type(verificationCode, { delay: 100 });
      }
      
      await this.sleep(1000);
      
      // 点击Create account按钮
      console.log('点击Create account按钮...');
      const createBtn = await page.$('button[type="submit"]');
      if (createBtn) {
        await createBtn.click();
      }
      await this.sleep(5000);
      
      // ========== 第五步: 检查注册是否成功 ==========
      if (this.stepCallback) this.stepCallback(5, 5); // 步骤5/5
      const currentUrl = page.url();
      const isSuccess = !currentUrl.includes('/login') && !currentUrl.includes('/signup');
      
      if (isSuccess) {
        console.log('✓ 注册成功!');
        
        // 保存账号到本地
        const fs = require('fs').promises;
        const path = require('path');
        const { app } = require('electron');
        const ACCOUNTS_FILE = path.join(app.getPath('userData'), 'accounts.json');
        
        let accounts = [];
        try {
          const data = await fs.readFile(ACCOUNTS_FILE, 'utf-8');
          accounts = JSON.parse(data);
        } catch (error) {
          // 文件不存在，使用空数组
        }
        
        const account = {
          id: Date.now().toString(),
          email,
          password,
          firstName,
          lastName,
          createdAt: new Date().toISOString()
        };
        
        accounts.push(account);
        await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        
        console.log('账号已保存到本地');
        
        return {
          success: true,
          email,
          password,
          firstName,
          lastName,
          createdAt: account.createdAt
        };
      } else {
        throw new Error('注册失败，请检查页面');
      }
      
    } catch (error) {
      console.error('注册过程出错:', error);
      console.error('错误堆栈:', error.stack);
      return {
        success: false,
        error: error.message || '未知错误',
        errorStack: error.stack
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('浏览器已关闭');
        } catch (e) {
          console.error('关闭浏览器失败:', e);
        }
      }
    }
  }

  /**
   * 批量注册(控制并发数量)
   * 最多同时4个窗口，每个注册完成后才开始下一个
   */
  async batchRegister(count, progressCallback, logCallback) {
    const MAX_CONCURRENT = 4; // 最大并发数
    
    if (logCallback) {
      logCallback(`🚀 开始批量注册 ${count} 个账号`);
      logCallback(`📊 最大并发数: ${MAX_CONCURRENT} 个窗口`);
      logCallback(`⏱️  验证码延迟: 15 秒`);
    }
    
    const results = [];
    let completed = 0;
    
    // 分批执行，每批最多 MAX_CONCURRENT 个
    for (let i = 0; i < count; i += MAX_CONCURRENT) {
      const batchSize = Math.min(MAX_CONCURRENT, count - i);
      const batchTasks = [];
      
      if (logCallback) {
        logCallback(`\n========== 第 ${Math.floor(i/MAX_CONCURRENT) + 1} 批次，注册 ${batchSize} 个账号 ==========`);
      }
      
      // 创建当前批次的任务
      for (let j = 0; j < batchSize; j++) {
        const taskIndex = i + j + 1;
        
        // 为每个任务创建独立的日志回调
        const taskLogCallback = (log) => {
          if (logCallback) {
            logCallback(`[窗口${taskIndex}] ${log}`);
          }
        };
        
        // 每个窗口间隔启动，避免验证码混淆
        const startDelay = j * 3000; // 每个窗口延迟3秒启动
        
        const task = (async () => {
          await this.sleep(startDelay);
          
          if (logCallback) {
            logCallback(`\n[窗口${taskIndex}] 开始注册...`);
          }
          
          // 步骤进度回调 - 更新细粒度进度
          const stepCallback = (step, totalSteps) => {
            // 计算当前任务的进度贡献
            const taskProgress = (step / totalSteps);
            const overallProgress = ((completed + taskProgress) / count) * 100;
            if (progressCallback) {
              progressCallback({ current: completed + taskProgress, total: count, percent: Math.round(overallProgress) });
            }
          };
          
          const result = await this.registerAccount(taskLogCallback, stepCallback);
          
          completed++;
          if (progressCallback) {
            progressCallback({ current: completed, total: count, percent: Math.round((completed / count) * 100) });
          }
          
          if (logCallback) {
            if (result.success) {
              logCallback(`✅ [窗口${taskIndex}] 注册成功! 邮箱: ${result.email}`);
            } else {
              logCallback(`❌ [窗口${taskIndex}] 注册失败: ${result.error}`);
            }
          }
          
          return result;
        })();
        
        batchTasks.push(task);
      }
      
      // 等待当前批次完成
      const batchResults = await Promise.all(batchTasks);
      results.push(...batchResults);
      
      // 如果还有下一批，等待一段时间再开始
      if (i + MAX_CONCURRENT < count) {
        if (logCallback) {
          logCallback(`\n⏸️  等待10秒后开始下一批次...`);
        }
        await this.sleep(10000);
      }
    }
    
    if (logCallback) {
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      logCallback(`\n========== 批量注册完成 ==========`);
      logCallback(`✅ 成功: ${successCount} 个`);
      logCallback(`❌ 失败: ${failedCount} 个`);
    }
    
    return results;
  }


  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RegistrationBot;
