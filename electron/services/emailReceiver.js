const Imap = require('imap');
const { simpleParser } = require('mailparser');

/**
 * 本地邮箱验证码接收器
 */
class EmailReceiver {
  constructor(config) {
    this.config = config;
  }

  /**
   * 获取验证码（本地IMAP实现）
   */
  async getVerificationCode(targetEmail, maxWaitTime = 120000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // 创建IMAP连接
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      let checkInterval;
      let isResolved = false;

      const checkMail = () => {
        if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkInterval);
          imap.end();
          if (!isResolved) {
            isResolved = true;
            reject(new Error('获取验证码超时'));
          }
          return;
        }

        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.log('打开邮箱失败:', err.message);
            return;
          }

          // 搜索未读邮件(不限制发件人,因为可能从不同域名发送)
          const searchCriteria = ['UNSEEN'];

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              console.log('搜索邮件失败:', err.message);
              return;
            }

            if (!results || results.length === 0) {
              console.log('暂无新邮件');
              return;
            }
            
            console.log(`找到 ${results.length} 封未读邮件`);

            const fetch = imap.fetch(results, { bodies: '', markSeen: true });

            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, (err, parsed) => {
                  if (err || isResolved) return;

                  // 检查邮件主题或内容是否包含Windsurf相关关键词
                  const subject = parsed.subject || '';
                  const from = parsed.from?.text || '';
                  const to = parsed.to?.text || '';
                  
                  console.log(`邮件信息 - 主题: ${subject}, 发件人: ${from}, 收件人: ${to}`);
                  
                  // 检查是否是Windsurf相关邮件
                  const isWindsurfEmail = subject.toLowerCase().includes('windsurf') || 
                                         subject.toLowerCase().includes('verify') ||
                                         from.toLowerCase().includes('windsurf') ||
                                         from.toLowerCase().includes('codeium') ||
                                         from.toLowerCase().includes('exafunction');
                  
                  if (!isWindsurfEmail) {
                    console.log('不是Windsurf验证邮件,跳过');
                    return;
                  }
                  
                  // 检查邮件是否发送给目标邮箱
                  if (!to.includes(targetEmail)) {
                    console.log(`收件人不匹配: ${to} != ${targetEmail}`);
                    return;
                  }

                  // 从邮件内容中提取验证码
                  const emailBody = (parsed.text || parsed.html || '').replace(/<[^>]*>/g, '');
                  console.log('邮件内容:', emailBody.substring(0, 200));
                  
                  // 多种验证码格式匹配
                  const patterns = [
                    /\b(\d{6})\b/,                    // 6位数字
                    /\b([A-Z0-9]{6})\b/,              // 6位字母数字
                    /验证码[：:]\s*(\w+)/,             // 中文验证码
                    /code[：:]\s*(\w+)/i,             // 英文code
                    /verification code[：:]\s*(\w+)/i // verification code
                  ];

                  for (const pattern of patterns) {
                    const match = emailBody.match(pattern);
                    if (match) {
                      clearInterval(checkInterval);
                      imap.end();
                      if (!isResolved) {
                        isResolved = true;
                        console.log(`✓ 找到验证码: ${match[1]}`);
                        resolve(match[1]);
                      }
                      return;
                    }
                  }
                  
                  console.log('未能从邮件中提取验证码');
                });
              });
            });

            fetch.once('error', (err) => {
              console.log('获取邮件失败:', err.message);
            });
          });
        });
      };

      imap.once('ready', () => {
        console.log('IMAP连接成功，开始监听验证码邮件...');
        checkMail();
        checkInterval = setInterval(checkMail, 5000); // 每5秒检查一次
      });

      imap.once('error', (err) => {
        clearInterval(checkInterval);
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`IMAP连接失败: ${err.message}`));
        }
      });

      imap.once('end', () => {
        clearInterval(checkInterval);
        console.log('IMAP连接已关闭');
      });

      imap.connect();
    });
  }

  /**
   * 测试IMAP连接
   */
  async testConnection() {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,  // 10秒连接超时
        authTimeout: 10000   // 10秒认证超时
      });

      // 设置总超时
      const timeout = setTimeout(() => {
        imap.end();
        resolve({ success: false, message: '连接超时，请检查服务器地址和端口' });
      }, 15000);

      imap.once('ready', () => {
        clearTimeout(timeout);
        imap.end();
        resolve({ success: true, message: 'IMAP连接成功' });
      });

      imap.once('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, message: `IMAP连接失败: ${err.message}` });
      });

      imap.connect();
    });
  }
}

module.exports = EmailReceiver;
