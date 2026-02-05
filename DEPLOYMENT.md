# IKU Research Agent 部署文档

> 完整的打包和部署指南

## 📋 目录

- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [环境要求](#环境要求)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 方式一：自动化部署（推荐）

```bash
# 1. 本地打包
pnpm run build:pack

# 2. 上传到服务器（同时上传部署包和自动化脚本）
scp dist/iku-research-agent-*.zip scripts/server-deploy.sh user@server:/var/www/

# 3. 服务器上运行自动化脚本
ssh user@server
cd /var/www
bash server-deploy.sh
```

**自动化脚本会完成**：
- ✅ 环境检查和依赖安装
- ✅ 解压和配置
- ✅ 安装 npm 依赖
- ✅ PM2 启动和配置
- ✅ 开机自启设置

### 方式二：手动部署

```bash
# 1. 本地打包
pnpm run build:pack

# 2. 上传到服务器
scp dist/iku-research-agent-*.zip user@server:/var/www/

# 3. 服务器端操作
ssh user@server
cd /var/www
unzip iku-research-agent-*.zip
cd iku-research-agent

# 4. 安装依赖
mkdir -p logs
pnpm install --prod

# 5. 配置环境变量
vi .env.production

# 6. 启动应用
pm2 start ecosystem.config.js
pm2 save
```

---

## 📖 详细步骤

### 本地操作

#### 1. 构建项目
```bash
# 安装依赖（首次）
pnpm install

# 构建 Next.js 应用
pnpm run build
```

#### 2. 打包部署包
```bash
# 生产环境打包
pnpm run build:pack

# 或开发环境打包
pnpm run build:pack:dev
```

打包完成后，会在 `dist/` 目录生成：
- `iku-research-agent-production-YYYY-MM-DD.zip` - 部署包
- `DEPLOY_GUIDE.md` - 详细部署指南

### 服务器操作

#### 1. 环境准备

**必需软件**：
- Node.js >= 18.0.0
- pnpm (推荐) 或 npm
- PM2 (进程管理器)

**安装命令**：
```bash
# 安装 Node.js 18+ (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2
```

#### 2. 上传和解压

```bash
# 上传文件
scp dist/iku-research-agent-*.zip user@server:/var/www/

# 服务器上解压
cd /var/www
unzip iku-research-agent-*.zip
cd iku-research-agent
```

#### 3. 安装依赖

```bash
# 创建日志目录
mkdir -p logs

# 安装 Node.js 依赖（重要！）
pnpm install --prod
```

> ⚠️ **重要**：必须在服务器上运行 `pnpm install --prod` 安装依赖，部署包中不包含 node_modules。

#### 4. 配置环境变量

```bash
# 编辑生产环境配置
vi .env.production
```

**必需的环境变量**：
```env
# 后端 API 地址
NEXT_PUBLIC_GPTR_API_URL=http://your-backend-url:port

# 例如：
NEXT_PUBLIC_GPTR_API_URL=http://152.136.120.30:37992
```

#### 5. 启动应用

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs iku-research-agent

# 设置开机自启
pm2 startup
pm2 save
```

#### 6. 验证部署

```bash
# 检查应用状态
pm2 status

# 测试本地访问
curl http://localhost:3000

# 在浏览器访问
# http://your-server-ip:3000
```

---

## 🔧 环境要求

### 本地开发环境

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | 必需 |
| pnpm | 最新版 | 推荐 |
| npm | >= 8.0.0 | 可选 |

### 服务器生产环境

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | 必需 |
| pnpm | 最新版 | 推荐，或使用 npm |
| PM2 | 最新版 | 进程管理 |
| Linux | Ubuntu 20.04+ | 推荐 |
| 内存 | >= 1GB | 推荐 2GB+ |
| 磁盘 | >= 2GB | 应用 + 依赖 |

---

## 🔄 更新部署

### 方式一：使用自动化脚本

```bash
# 本地重新打包
pnpm run build:pack

# 上传新包和脚本
scp dist/iku-research-agent-*.zip scripts/server-deploy.sh user@server:/var/www/

# 服务器上运行脚本（会自动备份旧版本）
ssh user@server "cd /var/www && bash server-deploy.sh"
```

### 方式二：手动更新

```bash
# 1. 停止应用
pm2 stop iku-research-agent

# 2. 备份当前版本
cd /var/www
mv iku-research-agent iku-research-agent.backup

# 3. 解压新版本
unzip iku-research-agent-new.zip
cd iku-research-agent

# 4. 重新安装依赖
pnpm install --prod

# 5. 检查环境变量
vi .env.production

# 6. 重启应用
pm2 restart iku-research-agent

# 或使用 reload（零停机重启）
pm2 reload iku-research-agent
```

---

## 🛠️ PM2 管理

### 基本命令

```bash
# 启动
pm2 start ecosystem.config.js

# 停止
pm2 stop iku-research-agent

# 重启
pm2 restart iku-research-agent

# 重新加载（零停机）
pm2 reload iku-research-agent

# 删除
pm2 delete iku-research-agent

# 查看列表
pm2 list

# 查看详情
pm2 show iku-research-agent
```

### 日志管理

```bash
# 查看实时日志
pm2 logs iku-research-agent

# 查看错误日志
pm2 logs iku-research-agent --err

# 查看输出日志
pm2 logs iku-research-agent --out

# 清空日志
pm2 flush

# 日志文件位置
# - 输出日志: ./logs/out.log
# - 错误日志: ./logs/error.log
```

### 监控

```bash
# 实时监控
pm2 monit

# Web 界面（可选）
pm2 plus
```

---

## ❓ 常见问题

### Q1: 打包失败，提示缺少 .next 目录
**A**: 先运行 `pnpm run build` 生成构建产物

### Q2: 服务器上依赖安装失败
**A**: 
1. 检查 Node.js 版本：`node -v` (应该 >= 18.0.0)
2. 检查 pnpm 是否安装：`pnpm -v`
3. 尝试清除缓存：`rm -rf node_modules && pnpm install --prod`

### Q3: PM2 启动失败
**A**:
1. 检查 logs 目录是否存在：`mkdir -p logs`
2. 查看错误日志：`pm2 logs iku-research-agent --err`
3. 检查端口是否被占用：`lsof -i :3000`
4. 确认依赖已安装：`ls -la node_modules`

### Q4: 应用启动但无法访问
**A**:
1. 检查防火墙：`sudo ufw status`
2. 开放端口：`sudo ufw allow 3000/tcp`
3. 检查应用状态：`pm2 status`
4. 测试本地访问：`curl http://localhost:3000`

### Q5: 环境变量不生效
**A**:
1. 确认文件存在：`ls -la .env.production`
2. 检查文件格式（不要有多余空格）
3. 重启应用：`pm2 restart iku-research-agent --update-env`

### Q6: 内存占用过高
**A**:
1. 调整 PM2 内存限制：编辑 `ecosystem.config.js`
   ```javascript
   max_memory_restart: '2G'  // 改为 2GB
   ```
2. 重启应用：`pm2 restart iku-research-agent`

### Q7: 需要修改端口
**A**: 编辑 `ecosystem.config.js`
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 8080,  // 修改为你需要的端口
}
```

---

## 🔒 安全建议

1. **使用 Nginx 反向代理**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **配置防火墙**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   ```

3. **HTTPS 配置**
   - 使用 Let's Encrypt 申请免费证书
   - 使用 Nginx 配置 HTTPS

4. **定期备份**
   - 应用代码
   - 环境变量文件
   - 数据库（如果有）

---

## 📚 参考资料

- [Next.js 文档](https://nextjs.org/docs)
- [PM2 文档](https://pm2.keymetrics.io/docs)
- [pnpm 文档](https://pnpm.io/zh/)
- [详细打包说明](./scripts/README.md)

---

## 💬 技术支持

- 项目仓库: https://github.com/assafelovic/gpt-researcher
- 问题反馈: 在仓库提交 Issue
- 打包脚本: `scripts/pack-deploy.js`
- 部署脚本: `scripts/server-deploy.sh`
