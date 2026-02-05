// scripts/pack-deploy.js
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 从命令行参数获取配置
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const environment = envArg ? envArg.split('=')[1] : 'production';

// 配置项（针对 iku-research-agent 项目优化）
const config = {
  // 打包后zip包的输出目录（自动创建）
  outputDir: path.join(__dirname, '../dist'),
  // zip包名称：项目名-环境-版本-时间戳.zip
  zipName: `iku-research-agent-${environment}-v0.1.74-${new Date().toISOString().slice(0, 10)}.zip`,
  // 需要打包的**文件/文件夹**（服务器运行/构建必需）
  include: [
    // ===== 1. Next.js 构建产物（必需） =====
    '.next',
    
    // ===== 2. 项目核心配置文件 =====
    'next.config.mjs', // Next.js 配置（注意是 .mjs）
    'package.json', // 依赖清单（服务器端安装依赖必需）
    'pnpm-lock.yaml', // pnpm 锁文件（保证依赖版本一致，必需）
    'pnpm-workspace.yaml', // pnpm 工作区配置
    'ecosystem.config.js', // PM2 进程管理配置（生产环境必需）
    
    // ===== 3. TypeScript 配置 =====
    'tsconfig.json', // TypeScript 主配置
    'tsconfig.lib.json', // TypeScript 库配置
    
    // ===== 4. 样式/构建配置 =====
    'tailwind.config.ts', // Tailwind CSS 配置
    'postcss.config.mjs', // PostCSS 配置
    '.prettierrc', // 代码格式化配置（可选）
    '.eslintrc.json', // ESLint 配置（可选）
    
    // ===== 5. 源代码目录（App Router） =====
    'app', // Next.js 13+ App Router 核心目录
    'components', // 组件目录
    'actions', // Server Actions
    'helpers', // 辅助函数
    'hooks', // React Hooks
    'utils', // 工具函数
    'types', // TypeScript 类型定义
    'config', // 配置文件
    'styles', // 样式文件
    
    // ===== 6. 公共静态资源 =====
    'public',
    
    // ===== 7. 环境变量文件 =====
    environment === 'production' ? '.env.production' : '.env.development',
    '.example.env', // 环境变量示例文件
  ],
  
  // 需排除的文件（即使在include里，也会被排除）
  exclude: [
    // ===== 依赖目录（服务器自己安装） =====
    'node_modules/**',
    '.pnp',
    '.pnp.js',
    '.yarn/**',
    
    // ===== 构建/临时文件 =====
    'dist/**', // 打包输出目录
    'out/**', // Next.js 导出目录
    'build/**', // 其他构建目录
    '.next/cache/**', // Next.js 缓存（可选保留）
    '*.tsbuildinfo', // TypeScript 构建信息
    'next-env.d.ts', // Next.js 环境类型定义
    
    // ===== 开发环境文件 =====
    '.env.local', // 本地环境变量
    '.env*.local', // 所有本地环境变量
    environment === 'production' ? '.env.development' : '.env.production', // 排除非当前环境的配置
    
    // ===== 版本控制 =====
    '.git/**',
    '.gitignore',
    '.gitattributes',
    
    // ===== 编辑器/IDE 配置 =====
    '.vscode/**',
    '.idea/**',
    '.DS_Store', // macOS
    'Thumbs.db', // Windows
    '*.swp', // Vim
    '*.swo',
    
    // ===== 日志和测试 =====
    'logs/**',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'coverage/**',
    
    // ===== 脚本和文档 =====
    'scripts/**', // 打包脚本（服务器不需要）
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'CONTRIBUTING.md',
    '*.md', // 所有 markdown 文件
    
    // ===== Docker 相关（如果不用 Docker 部署） =====
    'Dockerfile',
    'Dockerfile.dev',
    '.dockerignore',
    'docker-compose.yml',
    '*.tar.gz', // Docker 镜像包
    
    // ===== Python 相关（如果前端不需要） =====
    '.python-version',
    '*.pyc',
    '__pycache__/**',
    
    // ===== 其他不必要文件 =====
    '.vercel/**', // Vercel 部署配置
    'nginx/**', // nginx 配置（如果不在同一包）
  ],
};

// ===== 工具函数 =====

// 检查必需文件是否存在
function checkRequiredFiles() {
  console.log('\n🔍 检查必需文件...');
  const required = [
    '.next',
    'package.json',
    'next.config.mjs',
  ];
  
  const missing = [];
  required.forEach(file => {
    const filePath = path.join(__dirname, '../', file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  });
  
  if (missing.length > 0) {
    console.log(`\x1b[31m❌ 缺少必需文件：${missing.join(', ')}\x1b[0m`);
    console.log(`\x1b[33m💡 提示：请先运行 \`pnpm run build\` 生成构建产物\x1b[0m`);
    return false;
  }
  
  console.log('\x1b[32m✓ 所有必需文件已就绪\x1b[0m');
  return true;
}

// 生成部署说明文件
function generateDeployGuide() {
  const guide = `# IKU Research Agent 部署指南

## 📋 环境信息
- **环境**：${environment}
- **打包时间**：${new Date().toLocaleString('zh-CN')}
- **Node 版本要求**：>= 18.0.0
- **包管理器**：pnpm (推荐)
- **进程管理**：PM2

---

## 🚀 快速部署（推荐流程）

> 💡 **提示**：项目提供了自动化部署脚本 \`scripts/server-deploy.sh\`，可以简化以下所有步骤。
> 使用方法：将部署包和脚本一起上传到服务器，运行 \`bash server-deploy.sh\` 即可。

### 1️⃣ 上传部署包到服务器
\`\`\`bash
# 方式 1: 使用 scp 上传
scp ${config.zipName} user@your-server:/var/www/

# 方式 2: 使用 rsync 上传
rsync -avz ${config.zipName} user@your-server:/var/www/

# 方式 3: 使用 FTP/SFTP 工具上传
# 使用 FileZilla、WinSCP 等工具上传到服务器
\`\`\`

### 2️⃣ 登录服务器并解压
\`\`\`bash
# SSH 登录服务器
ssh user@your-server

# 进入部署目录
cd /var/www/

# 解压部署包
unzip ${config.zipName}

# 进入项目目录
cd iku-research-agent  # 或解压后的目录名
\`\`\`

### 3️⃣ 创建日志目录（PM2 需要）
\`\`\`bash
# 创建日志目录
mkdir -p logs
\`\`\`

### 4️⃣ 安装依赖
\`\`\`bash
# 安装 pnpm（如果服务器上没有）
npm install -g pnpm

# 安装项目依赖（生产环境）
pnpm install --prod

# 注意：此步骤会根据 pnpm-lock.yaml 安装精确版本的依赖
# 确保与开发环境版本一致，避免兼容性问题
\`\`\`

### 5️⃣ 配置环境变量
\`\`\`bash
# 编辑环境变量文件
vi .env.production

# 必需配置项：
# NEXT_PUBLIC_GPTR_API_URL=http://your-backend-api-url:port
#
# 例如：
# NEXT_PUBLIC_GPTR_API_URL=http://152.136.120.30:37992
\`\`\`

### 6️⃣ 使用 PM2 启动应用（推荐）
\`\`\`bash
# 安装 PM2（如果服务器上没有）
npm install -g pm2

# 使用 PM2 配置文件启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs iku-research-agent

# 设置开机自启动
pm2 startup
pm2 save
\`\`\`

### 7️⃣ 验证部署
\`\`\`bash
# 检查服务是否运行
pm2 status

# 测试 API 是否可访问
curl http://localhost:3000

# 或在浏览器访问
# http://your-server-ip:3000
\`\`\`

---

## 🔧 PM2 常用命令

### 应用管理
\`\`\`bash
# 启动应用
pm2 start ecosystem.config.js

# 停止应用
pm2 stop iku-research-agent

# 重启应用
pm2 restart iku-research-agent

# 重新加载（0 秒停机）
pm2 reload iku-research-agent

# 删除应用
pm2 delete iku-research-agent

# 查看所有应用
pm2 list
\`\`\`

### 日志管理
\`\`\`bash
# 查看实时日志
pm2 logs iku-research-agent

# 查看错误日志
pm2 logs iku-research-agent --err

# 清空日志
pm2 flush

# 查看日志文件位置
pm2 show iku-research-agent
\`\`\`

### 监控管理
\`\`\`bash
# 查看应用详情
pm2 show iku-research-agent

# 实时监控（CPU、内存等）
pm2 monit

# 查看进程信息
pm2 info iku-research-agent
\`\`\`

---

## 🔄 更新部署

当需要更新应用时：

\`\`\`bash
# 1. 上传新的部署包
scp new-deploy-package.zip user@server:/var/www/

# 2. 停止应用
pm2 stop iku-research-agent

# 3. 备份当前版本（可选）
mv iku-research-agent iku-research-agent.backup

# 4. 解压新版本
unzip new-deploy-package.zip

# 5. 重新安装依赖（如果依赖有变化）
cd iku-research-agent
pnpm install --prod

# 6. 重启应用
pm2 restart iku-research-agent

# 或使用 reload（0 秒停机）
pm2 reload iku-research-agent
\`\`\`

---

## ⚙️ 配置说明

### PM2 配置文件（ecosystem.config.js）

已包含在部署包中，主要配置项：

\`\`\`javascript
{
  name: 'iku-research-agent',      // 应用名称
  instances: 1,                     // 实例数量（可改为 'max' 使用所有 CPU）
  exec_mode: 'cluster',             // 集群模式
  env: {
    NODE_ENV: 'production',
    PORT: 3000,                     // 端口号（可修改）
  },
  error_file: './logs/error.log',  // 错误日志路径
  out_file: './logs/out.log',      // 输出日志路径
  max_memory_restart: '1G',        // 内存超过 1G 自动重启
}
\`\`\`

### 自定义端口
如需修改端口，编辑 \`ecosystem.config.js\`：

\`\`\`javascript
env: {
  NODE_ENV: 'production',
  PORT: 8080,  // 修改为你需要的端口
}
\`\`\`

### 多实例负载均衡
编辑 \`ecosystem.config.js\`：

\`\`\`javascript
instances: 'max',  // 使用所有 CPU 核心
// 或指定数量
instances: 4,      // 启动 4 个实例
\`\`\`

---

## ❌ 故障排查

### 问题 1: PM2 启动失败
\`\`\`bash
# 检查日志
pm2 logs iku-research-agent --lines 100

# 检查 PM2 进程
pm2 status

# 重新启动
pm2 delete iku-research-agent
pm2 start ecosystem.config.js
\`\`\`

### 问题 2: 依赖安装失败
\`\`\`bash
# 检查 Node.js 版本
node -v  # 应该 >= 18.0.0

# 清除缓存重新安装
rm -rf node_modules
pnpm install --prod

# 或使用 npm
npm install --production
\`\`\`

### 问题 3: 端口被占用
\`\`\`bash
# 查看端口占用
lsof -i :3000

# 修改端口（编辑 ecosystem.config.js 中的 PORT）
vi ecosystem.config.js

# 重启应用
pm2 restart iku-research-agent
\`\`\`

### 问题 4: 环境变量不生效
\`\`\`bash
# 确认文件存在
ls -la .env.production

# 检查 PM2 环境变量
pm2 show iku-research-agent

# 重新加载配置
pm2 restart iku-research-agent --update-env
\`\`\`

### 问题 5: 应用频繁重启
\`\`\`bash
# 查看错误日志
pm2 logs iku-research-agent --err

# 检查内存使用
pm2 monit

# 增加内存限制（编辑 ecosystem.config.js）
max_memory_restart: '2G'  # 改为 2G
\`\`\`

---

## 🔒 安全建议

1. **防火墙配置**
   \`\`\`bash
   # 开放应用端口（如 3000）
   sudo ufw allow 3000/tcp
   
   # 仅允许特定 IP 访问
   sudo ufw allow from YOUR_IP to any port 3000
   \`\`\`

2. **使用 Nginx 反向代理**
   \`\`\`nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
   }
   \`\`\`

3. **定期备份**
   - 定期备份应用代码
   - 备份环境变量文件
   - 备份日志文件

---

## 📞 技术支持

- **项目仓库**: https://github.com/assafelovic/gpt-researcher
- **打包脚本**: scripts/pack-deploy.js
- **问题反馈**: 在项目仓库提交 Issue

---

## 📝 部署检查清单

- [ ] 服务器 Node.js >= 18.0.0
- [ ] 已安装 pnpm 和 PM2
- [ ] 已上传并解压部署包
- [ ] 已创建 logs 目录
- [ ] 已运行 pnpm install --prod
- [ ] 已配置 .env.production
- [ ] 已使用 PM2 启动应用
- [ ] 已设置 PM2 开机自启
- [ ] 已验证应用可访问
- [ ] 已配置防火墙规则
- [ ] 已设置日志监控

完成以上步骤后，应用即可正常运行！🎉
`;

  return guide;
}

// 主打包函数
async function pack() {
  try {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 开始打包部署包 - 环境: ${environment.toUpperCase()}`);
    console.log('='.repeat(50));
    
    // 1. 检查必需文件
    if (!checkRequiredFiles()) {
      process.exit(1);
    }
    
    // 2. 创建输出目录
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
      console.log(`\x1b[36m📁 创建输出目录：${config.outputDir}\x1b[0m`);
    }
    
    // 3. 生成部署说明
    const deployGuidePath = path.join(config.outputDir, 'DEPLOY_GUIDE.md');
    fs.writeFileSync(deployGuidePath, generateDeployGuide());
    console.log(`\x1b[36m📝 生成部署指南：${deployGuidePath}\x1b[0m`);
    
    // 4. 创建 zip 包
    const zipPath = path.join(config.outputDir, config.zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } }); // 最高压缩级别
    
    console.log('\n📦 开始打包文件...\n');
    
    // 5. 监听打包事件
    let fileCount = 0;
    
    archive.on('entry', (entry) => {
      fileCount++;
      if (fileCount % 100 === 0) {
        process.stdout.write(`\r   已打包 ${fileCount} 个文件...`);
      }
    });
    
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log('\n\n' + '='.repeat(50));
      console.log(`\x1b[32m✅ 打包成功！\x1b[0m`);
      console.log('='.repeat(50));
      console.log(`📦 包名称：${config.zipName}`);
      console.log(`📁 包路径：${zipPath}`);
      console.log(`📊 包大小：${sizeInMB} MB`);
      console.log(`📄 文件数：${fileCount} 个`);
      console.log(`🌍 环境：${environment}`);
      console.log(`📖 部署指南：${deployGuidePath}`);
      console.log('='.repeat(50) + '\n');
      console.log(`\x1b[33m💡 提示：请查看 ${deployGuidePath} 了解部署步骤\x1b[0m\n`);
    });
    
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(`\x1b[33m⚠️  警告：${err.message}\x1b[0m`);
      } else {
        throw err;
      }
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    // 6. 连接流并开始打包
    archive.pipe(output);
    
    // 7. 遍历需要打包的文件/文件夹
    const rootPath = path.join(__dirname, '../');
    let foundFiles = 0;
    let skippedFiles = 0;
    
    config.include.forEach((item) => {
      const itemPath = path.join(rootPath, item);
      
      if (fs.existsSync(itemPath)) {
        foundFiles++;
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // 目录：递归添加所有文件
          archive.directory(itemPath, item, {
            ignore: config.exclude
          });
          console.log(`   \x1b[32m✓\x1b[0m ${item}/ (目录)`);
        } else {
          // 文件：直接添加
          archive.file(itemPath, { name: item });
          console.log(`   \x1b[32m✓\x1b[0m ${item}`);
        }
      } else {
        skippedFiles++;
        console.log(`   \x1b[33m-\x1b[0m ${item} (不存在，跳过)`);
      }
    });
    
    console.log(`\n   找到 ${foundFiles} 个项目，跳过 ${skippedFiles} 个`);
    
    // 8. 完成打包
    await archive.finalize();
    
  } catch (err) {
    console.log('\n' + '='.repeat(50));
    console.log(`\x1b[31m❌ 打包失败：${err.message}\x1b[0m`);
    console.log('='.repeat(50));
    console.error(err.stack);
    process.exit(1);
  }
}

// ===== 主程序入口 =====

// 显示使用说明
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📦 IKU Research Agent 打包部署脚本

用法:
  node scripts/pack-deploy.js [选项]

选项:
  --env=<环境>     指定打包环境 (production|development, 默认: production)
  --help, -h       显示此帮助信息

示例:
  node scripts/pack-deploy.js                    # 打包生产环境
  node scripts/pack-deploy.js --env=development  # 打包开发环境
  pnpm run pack                                  # 使用 npm scripts
  pnpm run build:pack                            # 先构建再打包
  `);
  process.exit(0);
}

// 执行打包
console.log(`\x1b[36m🎯 目标环境：${environment}\x1b[0m`);
pack();