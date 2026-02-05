// PM2 配置文件
// 用于在服务器上部署和管理 IKU Research Agent 应用

module.exports = {
  apps: [
    {
      name: 'iku-research-agent',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 1, // 实例数量，可以设置为 'max' 使用所有 CPU 核心
      exec_mode: 'cluster', // 集群模式，支持负载均衡
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // 日志配置
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 进程管理
      autorestart: true, // 自动重启
      watch: false, // 不监听文件变化（生产环境关闭）
      max_memory_restart: '1G', // 内存超过 1G 自动重启
      
      // 实例配置
      min_uptime: '10s', // 最小运行时间，小于此时间重启视为异常
      max_restarts: 10, // 最大重启次数
      restart_delay: 4000, // 重启延迟（毫秒）
      
      // 时间配置
      kill_timeout: 5000, // 强制退出超时时间
      listen_timeout: 3000, // 监听超时时间
      
      // 环境变量文件
      env_file: '.env.production',
    }
  ],
  
  // 部署配置（可选）
  deploy: {
    production: {
      user: 'deploy', // SSH 用户名
      host: ['your-server-ip'], // 服务器 IP
      ref: 'origin/main', // Git 分支
      repo: 'git@github.com:your-repo/iku-research-agent.git', // Git 仓库
      path: '/var/www/iku-research-agent', // 部署路径
      'post-deploy': 'pnpm install --prod && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
