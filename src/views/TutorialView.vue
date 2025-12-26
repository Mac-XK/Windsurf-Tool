<template>
  <div class="tutorial-view">
    <div class="page-header">
      <h1>📚 使用教程</h1>
    </div>

    <!-- 快速开始 -->
    <div class="section">
      <h2>🚀 快速开始</h2>
      <div class="steps-card">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <h4>配置邮箱</h4>
            <p>前往「配置」页面，配置 IMAP 邮箱用于接收验证码</p>
            <ul>
              <li>填写 IMAP 服务器地址（如：imap.qq.com）</li>
              <li>填写邮箱账号和授权码</li>
              <li>点击「测试连接」确保配置正确</li>
            </ul>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">
            <h4>批量注册账号</h4>
            <p>在「批量注册」页面进行账号注册</p>
            <ul>
              <li>设置注册数量（1-10个）</li>
              <li>点击「开始批量注册」</li>
              <li>等待自动注册完成</li>
            </ul>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">
            <h4>切换账号</h4>
            <p>前往「切换账号」页面切换账号</p>
            <ul>
              <li>选择要使用的账号</li>
              <li>点击「自动切换账号」</li>
              <li>等待自动完成登录流程</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能详解 -->
    <div class="section">
      <h2>💡 功能详解</h2>
      
      <div class="faq-item">
        <div class="faq-q">📝 批量注册</div>
        <div class="faq-a">
          <p>自动批量注册 Windsurf 账号，无需手动操作。</p>
          <p>系统会自动生成邮箱、注册账号、接收验证码。每个账号注册大约需要 1-2 分钟。</p>
        </div>
      </div>

      <div class="faq-item">
        <div class="faq-q">👤 账号管理</div>
        <div class="faq-a">
          <p>管理所有已注册的账号，查看到期时间。</p>
          <ul>
            <li><span class="badge active">可用</span> 剩余 4 天以上</li>
            <li><span class="badge warning">即将到期</span> 剩余 1-3 天</li>
            <li><span class="badge expired">已到期</span> 试用期已结束</li>
          </ul>
        </div>
      </div>

      <div class="faq-item">
        <div class="faq-q">📥 导入账号</div>
        <div class="faq-a">
          <p>支持批量导入已有账号，格式：</p>
          <code>邮箱,密码</code> 或 <code>邮箱----密码</code>
          <p style="margin-top: 8px;">每行一个账号</p>
        </div>
      </div>

      <div class="faq-item">
        <div class="faq-q">🔄 账号切换</div>
        <div class="faq-a">
          <p>一键切换 Windsurf 账号，自动完成登录。</p>
          <p>流程：关闭 Windsurf → 清除配置和机器码 → 启动 Windsurf → 自动登录</p>
        </div>
      </div>
    </div>

    <!-- 常见问题 -->
    <div class="section">
      <h2>❓ 常见问题</h2>
      
      <div class="faq-item">
        <div class="faq-q">Q1: 批量注册失败怎么办？</div>
        <div class="faq-a">
          <ul>
            <li>检查 IMAP 邮箱配置是否正确</li>
            <li>检查网络连接是否正常</li>
            <li>验证码接收超时，稍后重试</li>
          </ul>
        </div>
      </div>

      <div class="faq-item">
        <div class="faq-q">Q2: 自动登录不成功？</div>
        <div class="faq-a">
          <ul>
            <li>确保 Windsurf 已完全关闭</li>
            <li>检查账号是否有效（未到期）</li>
            <li>手动清除配置后重试</li>
          </ul>
        </div>
      </div>

      <div class="faq-item">
        <div class="faq-q">Q3: 账号试用期是多久？</div>
        <div class="faq-a">
          <p>Windsurf Pro 试用期为 <strong>13 天</strong>。系统会自动计算到期时间并提醒。</p>
        </div>
      </div>

      <div class="faq-item">
        <div class="faq-q">Q4: 数据存储在哪里？</div>
        <div class="faq-a">
          <p>所有账号数据都存储在本地，完全本地化，不上传到任何服务器。</p>
          <p><strong>macOS:</strong> ~/Library/Application Support/windsurf-tool-vue/</p>
        </div>
      </div>
    </div>

    <!-- 注意事项 -->
    <div class="section">
      <h2>⚠️ 注意事项</h2>
      <div class="warning-box">
        <ul>
          <li>本工具仅供学习交流使用，请遵守 Windsurf 服务条款</li>
          <li>批量注册时请合理控制数量，避免对服务器造成压力</li>
          <li>账号数据存储在本地，请妥善保管，避免泄露</li>
          <li>切换账号前请保存当前工作，避免数据丢失</li>
          <li>建议使用专用邮箱进行注册，不要使用重要邮箱</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.tutorial-view {
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

.section {
  margin-bottom: 32px;
}

.section h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.steps-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-color);
}

.step {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.step:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.step:first-child {
  padding-top: 0;
}

.step-num {
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.step-content p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.step-content ul {
  margin: 0;
  padding-left: 18px;
}

.step-content li {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.faq-item {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 12px;
}

.faq-q {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.faq-a {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.faq-a p {
  margin-bottom: 6px;
}

.faq-a ul {
  margin: 8px 0;
  padding-left: 18px;
}

.faq-a li {
  margin-bottom: 4px;
}

.faq-a code {
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  margin-right: 6px;
}

.badge.active { background: #d1fae5; color: #059669; }
.badge.warning { background: #fef3c7; color: #d97706; }
.badge.expired { background: #fee2e2; color: #dc2626; }

.warning-box {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 16px 20px;
}

.warning-box ul {
  margin: 0;
  padding-left: 18px;
}

.warning-box li {
  font-size: 13px;
  color: #92400e;
  margin-bottom: 8px;
  line-height: 1.5;
}

.warning-box li:last-child {
  margin-bottom: 0;
}
</style>
