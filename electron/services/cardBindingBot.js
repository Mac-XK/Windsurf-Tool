/**
 * 银行卡绑定机器人
 * 使用 puppeteer-real-browser 自动登录并绑定银行卡
 * 参考 AiGo绑卡 扩展的实现方式
 */

const { connect } = require('puppeteer-real-browser');
const CardGenerator = require('./cardGenerator');

class CardBindingBot {
  constructor() {
    this.browser = null;
    this.page = null;
    this.logCallback = null;
    this.cardInfo = null;
  }

  log(message) {
    console.log(message);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  async loginAndBind(account, cardInfo, logCallback) {
    this.logCallback = logCallback;
    
    try {
      this.log('🚀 启动浏览器...');
      
      const response = await connect({
        headless: false,
        fingerprint: true,
        turnstile: false,  // 禁用自动点击 Cloudflare Turnstile（会误点 Stripe 复选框）
        tf: false,         // 禁用自动处理验证
        args: ['--disable-blink-features=AutomationControlled']
      });
      
      this.browser = response.browser;
      this.page = response.page;
      await this.page.setViewport({ width: 1280, height: 800 });
      this.log('✓ 浏览器已启动');
      
      // 访问登录页面
      this.log('🌐 访问登录页面...');
      await this.page.goto('https://windsurf.com/account/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await this.sleep(2000);

      // 填写邮箱
      this.log(`📧 填写邮箱: ${account.email}`);
      await this.fillInput('input[type="email"], input[name="email"]', account.email);
      await this.sleep(500);
      
      // 填写密码
      this.log('🔐 填写密码...');
      await this.fillInput('input[type="password"]', account.password);
      await this.sleep(500);
      
      // 点击登录按钮
      this.log('🔘 点击登录按钮...');
      await this.page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]') || 
                   Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Log in'));
        if (btn) btn.click();
      });
      
      this.log('⏳ 等待登录完成（最长120秒）...');
      try {
        await this.page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 120000 });
        this.log('✅ 登录成功！');
      } catch (e) {
        if (this.page.url().includes('/login')) {
          return { success: false, message: '登录超时' };
        }
      }
      
      await this.sleep(2000);
      this.log('📍 登录后页面: ' + this.page.url());
      
      // 生成卡信息
      this.generateCardInfo(cardInfo);
      
      // 处理 Cookie 弹窗
      await this.acceptCookies();
      
      // 导航到绑卡页面
      await this.navigateToBilling();
      
      // 填充支付表单
      await this.fillPaymentForm();
      
      // 自动点击提交按钮
      await this.clickSubmitButton();
      
      // 注意：这里只是表示流程完成，并不代表绑卡成功
      // 返回 submitted 而不是 success，让前端知道需要手动确认
      return { success: false, submitted: true, message: '表单已提交，请手动确认绑卡结果' };
      
    } catch (error) {
      this.log(`❌ 操作失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  generateCardInfo(cardInfo) {
    if (cardInfo && cardInfo.mode === 'bin' && cardInfo.bin) {
      this.log(`💳 使用 BIN ${cardInfo.bin} 生成卡信息...`);
      this.cardInfo = CardGenerator.generateFullCardInfo(cardInfo.bin);
    } else if (cardInfo && cardInfo.mode === 'full' && cardInfo.cardNumber) {
      this.log('💳 使用完整卡号...');
      this.cardInfo = {
        cardNumber: cardInfo.cardNumber.replace(/\s/g, ''),
        expMonth: cardInfo.expMonth,
        expYear: cardInfo.expYear,
        cvv: cardInfo.cvv,
        name: CardGenerator.generateChineseName(),
        address: CardGenerator.generateChinaAddress()
      };
    } else {
      this.log('💳 使用默认 BIN 生成卡信息...');
      this.cardInfo = CardGenerator.generateFullCardInfo('424242');
    }
    // 使用中国地址和中文名
    const addr = this.cardInfo.address;
    this.log(`📝 生成地址: ${addr.province || addr.region || 'N/A'} - ${addr.city || addr.district || 'N/A'}`);
    this.log(`📝 持卡人: ${this.cardInfo.name}`);
    this.log(`📝 邮编: ${addr.zipCode || 'N/A'}`);
  }

  async acceptCookies() {
    try {
      await this.page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept all'));
        if (btn) btn.click();
      });
      this.log('✓ 已接受 Cookie');
    } catch (e) {}
  }

  async navigateToBilling() {
    this.log('🌐 导航到账户页面...');
    await this.page.goto('https://windsurf.com/account', { waitUntil: 'networkidle2', timeout: 30000 });
    await this.sleep(2000);
    
    if (this.page.url().includes('/login')) {
      this.log('⚠️ 需要重新登录...');
      await this.page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 60000 });
    }
    
    // 点击 Upgrade
    this.log('🔘 查找 Upgrade 按钮...');
    await this.page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button, a')).find(e => 
        e.textContent.includes('Upgrade') || e.textContent.includes('升级')
      );
      if (el) el.click();
    });
    await this.sleep(3000);
    
    // 直接导航到绑卡页面
    if (!this.page.url().includes('stripe.com') && !this.page.url().includes('billing')) {
      this.log('🌐 导航到绑卡页面...');
      await this.page.goto('https://windsurf.com/billing/individual?plan=2', { waitUntil: 'networkidle2', timeout: 30000 });
      await this.sleep(3000);
    }
    
    this.log('📍 当前页面: ' + this.page.url());
  }

  async fillPaymentForm() {
    this.log('💳 开始填写支付信息...');
    const card = this.cardInfo;
    
    this.log(`📝 卡号: ${card.cardNumber}`);
    this.log(`📝 有效期: ${card.expMonth}/${card.expYear}`);
    this.log(`📝 持卡人: ${card.name}`);
    
    // 等待页面加载
    await this.sleep(3000);
    
    // // 先取消"保存信息"复选框，避免出现电话号码输入框
    // this.log('📋 先取消保存信息复选框...');
    // await this.uncheckSaveInfo();
    // await this.sleep(1000);
    
    // 选择银行卡支付方式
    await this.selectCardPayment();
    await this.sleep(1000);
    
    // 点击手动输入地址
    await this.clickManualAddress();
    await this.sleep(1000);
    
    // 逐个填充字段
    await this.fillStripeFields();
    
    this.log('✅ 支付信息填写完成！');
  }

  /**
   * 自动点击提交按钮
   */
  async clickSubmitButton() {
    this.log('🔘 点击提交按钮...');
    
    const clicked = await this.page.evaluate(() => {
      // 查找提交按钮（多种可能的选择器）
      const selectors = [
        'button[type="submit"]',
        'button:has-text("开始试用")',
        'button:has-text("Start trial")',
        'button:has-text("提交")',
        'button:has-text("Submit")',
        'button:has-text("Pay")',
        'button:has-text("支付")'
      ];
      
      // 尝试多种方式查找按钮
      let submitBtn = null;
      
      // 方法1: 通过按钮文本查找
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent.trim();
        if (text.includes('开始试用') || 
            text.includes('Start trial') || 
            text.includes('提交') ||
            text.includes('Subscribe')) {
          submitBtn = btn;
          break;
        }
      }
      
      if (submitBtn) {
        submitBtn.click();
        return { success: true, text: submitBtn.textContent.trim() };
      }
      
      return { success: false, message: '未找到提交按钮' };
    });
    
    if (clicked.success) {
      this.log(`✅ 已点击: ${clicked.text}`);
    } else {
      this.log('⚠️ 未找到提交按钮，请手动点击');
    }
    
    await this.sleep(2000);
  }

  async selectCardPayment() {
    this.log('🔍 选择银行卡支付...');
    const clicked = await this.page.evaluate(() => {
      const selectors = [
        'button[data-testid=card-accordion-item-button]',
        'button[data-testid="payment-method-card"]',
        '.payment-method-card'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return sel; }
      }
      return null;
    });
    if (clicked) this.log(`✓ 已选择: ${clicked}`);
  }

  async clickManualAddress() {
    const clicked = await this.page.evaluate(() => {
      const btn = document.querySelector('.AddressAutocomplete-manual-entry .Button') ||
                  Array.from(document.querySelectorAll('button')).find(b => 
                    b.textContent.includes('Enter address manually') || b.textContent.includes('手动输入')
                  );
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (clicked) this.log('✓ 已点击手动输入地址');
  }

  /**
   * 取消保存信息复选框 - 只处理 enableStripePass
   */
  async uncheckSaveInfo() {
    try {
      // 只处理特定的复选框，不要处理其他的
      const unchecked = await this.page.evaluate(() => {
        const checkbox = document.querySelector('input[name="enableStripePass"]') ||
                         document.querySelector('input#enableStripePass');
        if (checkbox && checkbox.checked) {
          checkbox.click();
          return true;
        }
        return false;
      });
      if (unchecked) {
        this.log('✓ 已取消保存信息复选框');
      }
    } catch (e) {
      // 忽略错误
    }
  }

  /**
   * 使用 Puppeteer 原生方法填写 Stripe 表单（模拟真实键盘输入）
   */
  async fillStripeFields() {
    const card = this.cardInfo;
    
    this.log('💳 开始填写 Stripe 表单...');
    this.log(`📝 卡号: ${card.cardNumber}`);
    this.log(`📝 有效期: ${card.expMonth}/${card.expYear}`);
    this.log(`📝 持卡人: ${card.name}`);
    
    // 1. 填写卡号 - 使用快速输入
    await this.typeInStripeField('input[name="cardNumber"]', card.cardNumber);
    
    // 2. 填写有效期
    await this.typeInStripeField('input[name="cardExpiry"]', card.expMonth + card.expYear);
    
    // 3. 填写 CVV
    await this.typeInStripeField('input[name="cardCvc"]', card.cvv);
    
    // 4. 填写持卡人姓名
    await this.typeInStripeField('input[name="billingName"]', card.name);
    
    // 5. 选择国家 - 中国
    await this.selectStripeOption('select[name="billingCountry"]', 'CN');
    await this.sleep(1000); // 等待地址字段更新
    
    // 6. 填写邮编
    await this.typeInStripeField('input[name="billingPostalCode"]', card.address.zipCode);
    
    // 7. 选择省份
    await this.selectStripeOption('select[name="billingAdministrativeArea"]', card.address.province);
    await this.sleep(500);
    
    // 8. 填写城市
    await this.typeInStripeField('input[name="billingLocality"]', card.address.city);
    
    // 9. 填写地区
    const districtField = await this.page.$('input[name="billingDependentLocality"]');
    if (districtField) {
      await this.typeInStripeField('input[name="billingDependentLocality"]', card.address.district || '');
    }
    
    // 10. 填写地址第一行
    await this.typeInStripeField('input[name="billingAddressLine1"]', card.address.addressLine1);
    
    // 11. 填写地址第二行
    if (card.address.addressLine2) {
      await this.typeInStripeField('input[name="billingAddressLine2"]', card.address.addressLine2);
    }
    
    this.log('✅ 表单填写完成');
  }

  /**
   * 使用 Puppeteer 真实键盘输入填写 Stripe 字段
   */
  async typeInStripeField(selector, value) {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      const element = await this.page.$(selector);
      if (element) {
        // 点击元素获取焦点
        await element.click();
        await this.sleep(100);
        
        // 清空现有内容 (Mac 使用 Meta/Command)
        await this.page.keyboard.down('Meta');
        await this.page.keyboard.press('a');
        await this.page.keyboard.up('Meta');
        await this.page.keyboard.press('Backspace');
        await this.sleep(50);
        
        // 使用 Puppeteer 的 type 方法真实输入，每个字符间隔 10ms
        const strValue = String(value);
        await element.type(strValue, { delay: 10 });
        
        // 等待输入完成
        await this.sleep(100);
        
        this.log(`  ✓ ${selector}: ${strValue}`);
        return true;
      }
    } catch (e) {
      this.log(`  ✗ ${selector} 未找到或超时: ${e.message}`);
    }
    return false;
  }

  /**
   * 选择 Stripe 下拉框选项
   */
  async selectStripeOption(selector, value) {
    try {
      const selected = await this.page.evaluate((sel, val) => {
        const select = document.querySelector(sel);
        if (select) {
          for (const opt of select.options) {
            if (opt.value.includes(val) || opt.text.includes(val)) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              return opt.value;
            }
          }
        }
        return null;
      }, selector, value);
      if (selected) {
        this.log(`  ✓ ${selector}: ${selected}`);
        return true;
      }
    } catch (e) {
      this.log(`  ✗ ${selector} 选择失败`);
    }
    return false;
  }

  /**
   * 在输入框中输入文本 - 使用 Puppeteer 原生方法
   */
  async typeInField(selector, value) {
    try {
      const element = await this.page.$(selector);
      if (element) {
        // 清空现有内容
        await element.click({ clickCount: 3 });
        await this.page.keyboard.press('Backspace');
        await this.sleep(100);
        
        // 逐字符输入
        await element.type(value, { delay: 30 });
        
        this.log(`  ✓ ${selector}: ${value}`);
        return true;
      }
      this.log(`  ⚠️ 未找到: ${selector}`);
      return false;
    } catch (e) {
      this.log(`  ❌ 填写失败 ${selector}: ${e.message}`);
      return false;
    }
  }

  /**
   * 选择下拉框选项
   */
  async selectOption(selector, value) {
    try {
      const element = await this.page.$(selector);
      if (element) {
        await this.page.select(selector, value);
        this.log(`  ✓ ${selector}: ${value}`);
        return true;
      }
      return false;
    } catch (e) {
      // 尝试通过 evaluate 选择
      const selected = await this.page.evaluate((sel, val) => {
        const select = document.querySelector(sel);
        if (select) {
          for (const opt of select.options) {
            if (opt.value === val || opt.text.includes(val)) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
        }
        return false;
      }, selector, value);
      
      if (selected) this.log(`  ✓ ${selector}: ${value}`);
      return selected;
    }
  }

  /**
   * 选择或输入省份
   */
  async selectOrTypeProvince(province) {
    // 先尝试作为下拉框选择
    const selectSelector = '#billingAdministrativeArea, select[name="billingAdministrativeArea"]';
    const inputSelector = 'input[name="billingAdministrativeArea"]';
    
    const isSelect = await this.page.$(selectSelector);
    if (isSelect) {
      const tagName = await this.page.evaluate(sel => {
        const el = document.querySelector(sel);
        return el ? el.tagName : null;
      }, selectSelector);
      
      if (tagName === 'SELECT') {
        await this.selectOption(selectSelector, province);
        return;
      }
    }
    
    // 作为输入框处理
    await this.typeInField(inputSelector, province);
  }

  async fillInput(selector, value) {
    const el = await this.page.$(selector);
    if (el) {
      await el.click({ clickCount: 3 });
      await this.page.keyboard.press('Backspace');
      await el.type(value, { delay: 50 });
    }
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.log('🔒 浏览器已关闭');
      } catch (e) {}
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = CardBindingBot;
