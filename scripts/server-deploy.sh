#!/bin/bash
# 服务器端快速部署脚本
# 使用方法：将此脚本和 zip 包一起上传到服务器，然后运行：bash server-deploy.sh

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# 检查是否有 zip 文件
echo ""
echo "=========================================="
echo "  IKU Research Agent 快速部署脚本"
echo "=========================================="
echo ""

# 查找 zip 文件
ZIP_FILE=$(ls iku-research-agent-*.zip 2>/dev/null | head -n 1)

if [ -z "$ZIP_FILE" ]; then
    error "未找到部署包！请确保 iku-research-agent-*.zip 文件在当前目录"
fi

info "找到部署包：$ZIP_FILE"

# 提取目录名（去掉 .zip 后缀）
DIR_NAME="${ZIP_FILE%.zip}"

# 1. 检查必需的工具
info "检查系统环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    error "未安装 Node.js！请先安装 Node.js >= 18.0.0"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js 版本过低！当前版本：$(node -v)，需要 >= 18.0.0"
fi
success "Node.js 版本检查通过：$(node -v)"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    warning "未安装 pnpm，将使用 npm 安装..."
    npm install -g pnpm
    success "pnpm 安装完成"
else
    success "pnpm 已安装：$(pnpm -v)"
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    warning "未安装 PM2，正在安装..."
    npm install -g pm2
    success "PM2 安装完成"
else
    success "PM2 已安装：$(pm2 -v)"
fi

# 2. 备份旧版本（如果存在）
if [ -d "$DIR_NAME" ]; then
    warning "检测到已存在的部署目录：$DIR_NAME"
    read -p "是否备份旧版本？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        BACKUP_NAME="${DIR_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
        mv "$DIR_NAME" "$BACKUP_NAME"
        success "已备份旧版本到：$BACKUP_NAME"
    else
        warning "将删除旧版本..."
        rm -rf "$DIR_NAME"
    fi
fi

# 3. 解压部署包
info "解压部署包..."
unzip -q "$ZIP_FILE"
success "部署包解压完成"

# 进入项目目录
cd "$DIR_NAME" || error "无法进入项目目录"

# 4. 创建必需的目录
info "创建必需目录..."
mkdir -p logs
success "logs 目录创建完成"

# 5. 安装依赖
info "安装项目依赖（这可能需要几分钟）..."
if pnpm install --prod; then
    success "依赖安装完成"
else
    error "依赖安装失败！请检查网络连接或 pnpm-lock.yaml 文件"
fi

# 6. 检查环境变量文件
if [ ! -f ".env.production" ]; then
    warning "未找到 .env.production 文件！"
    if [ -f ".example.env" ]; then
        info "发现 .example.env 模板文件"
        read -p "是否基于模板创建 .env.production？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp .example.env .env.production
            info "已创建 .env.production，请编辑配置："
            echo "  vi .env.production"
            read -p "按回车键继续..." 
        fi
    else
        warning "请手动创建 .env.production 文件"
    fi
else
    success "找到环境变量文件：.env.production"
fi

# 7. 检查 PM2 配置文件
if [ ! -f "ecosystem.config.js" ]; then
    error "未找到 ecosystem.config.js 配置文件！"
fi
success "找到 PM2 配置文件"

# 8. 询问是否启动应用
echo ""
read -p "是否立即启动应用？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    info "启动应用..."
    
    # 检查是否已经有运行中的实例
    if pm2 list | grep -q "iku-research-agent"; then
        warning "检测到已运行的实例"
        read -p "是否重启？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pm2 restart iku-research-agent
            success "应用已重启"
        else
            pm2 reload iku-research-agent
            success "应用已重新加载（零停机）"
        fi
    else
        # 新启动
        pm2 start ecosystem.config.js
        success "应用启动成功"
    fi
    
    # 9. 显示状态
    echo ""
    info "应用状态："
    pm2 status
    
    # 10. 设置开机自启
    echo ""
    read -p "是否设置开机自启动？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 startup
        pm2 save
        success "开机自启动设置完成"
    fi
    
    # 11. 显示访问信息
    echo ""
    echo "=========================================="
    success "部署完成！"
    echo "=========================================="
    echo ""
    echo "📝 应用信息："
    echo "   - 名称: iku-research-agent"
    echo "   - 端口: 3000 (默认)"
    echo "   - 目录: $(pwd)"
    echo ""
    echo "🔧 常用命令："
    echo "   - 查看状态: pm2 status"
    echo "   - 查看日志: pm2 logs iku-research-agent"
    echo "   - 重启应用: pm2 restart iku-research-agent"
    echo "   - 停止应用: pm2 stop iku-research-agent"
    echo ""
    echo "🌐 访问地址："
    echo "   - 本地: http://localhost:3000"
    echo "   - 外网: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "📖 查看详细文档: cat DEPLOY_GUIDE.md"
    echo ""
    
    # 测试应用是否可访问
    sleep 2
    if curl -s http://localhost:3000 > /dev/null; then
        success "应用运行正常，可以访问！"
    else
        warning "应用可能还在启动中，请稍后访问"
    fi
else
    echo ""
    info "跳过启动，手动启动命令："
    echo "  cd $DIR_NAME"
    echo "  pm2 start ecosystem.config.js"
fi

echo ""
success "脚本执行完成！"
