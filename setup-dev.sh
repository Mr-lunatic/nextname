#!/bin/bash

# 🚀 yuming项目本地开发环境快速设置脚本
# 该脚本将帮助您快速设置本地开发环境

set -e

echo "🚀 欢迎使用 yuming 项目开发环境设置"
echo "================================================"

# 检查是否存在.env文件
if [ -f ".env" ]; then
    echo "⚠️  发现现有的 .env 文件"
    read -p "是否要备份现有的 .env 文件？ (y/n): " backup_choice
    if [ "$backup_choice" = "y" ] || [ "$backup_choice" = "Y" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "✅ 已备份现有 .env 文件"
    fi
fi

# 复制环境变量模板
echo "📋 复制环境变量模板..."
cp .env.example .env

# 生成安全密钥
echo "🔑 生成管理员访问密钥..."

# 检查openssl是否可用
if command -v openssl >/dev/null 2>&1; then
    ADMIN_KEY=$(openssl rand -base64 32 | tr -d '\n')
    PUBLIC_KEY=$(openssl rand -base64 24 | tr -d '\n')
    echo "✅ 使用 openssl 生成安全密钥"
else
    # 备用方案：使用时间戳和随机数
    ADMIN_KEY="dev-admin-$(date +%s)-$(($RANDOM % 10000))"
    PUBLIC_KEY="dev-public-$(date +%s)-$(($RANDOM % 10000))"
    echo "⚠️  openssl 不可用，使用简单密钥生成器"
fi

# 更新.env文件中的密钥
echo "📝 更新环境变量配置..."

# macOS 和 Linux 的 sed 语法略有不同
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/ADMIN_ACCESS_KEY=your-secret-admin-key-here-please-change/ADMIN_ACCESS_KEY=$ADMIN_KEY/" .env
    sed -i '' "s/NEXT_PUBLIC_ADMIN_KEY=your-public-admin-key-here-please-change/NEXT_PUBLIC_ADMIN_KEY=$PUBLIC_KEY/" .env
    sed -i '' "s|NEXT_PUBLIC_BASE_URL=https://your-domain.com|NEXT_PUBLIC_BASE_URL=http://localhost:3000|" .env
else
    # Linux
    sed -i "s/ADMIN_ACCESS_KEY=your-secret-admin-key-here-please-change/ADMIN_ACCESS_KEY=$ADMIN_KEY/" .env
    sed -i "s/NEXT_PUBLIC_ADMIN_KEY=your-public-admin-key-here-please-change/NEXT_PUBLIC_ADMIN_KEY=$PUBLIC_KEY/" .env
    sed -i "s|NEXT_PUBLIC_BASE_URL=https://your-domain.com|NEXT_PUBLIC_BASE_URL=http://localhost:3000|" .env
fi

echo "✅ 环境变量配置完成"

# 安装依赖
echo "📦 检查项目依赖..."
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        echo "🔧 安装 npm 依赖..."
        npm install
    else
        echo "✅ npm 依赖已存在"
    fi
else
    echo "❌ 未找到 package.json 文件"
    exit 1
fi

# 创建开发环境快捷访问文件
echo "🔗 创建开发环境快捷访问..."
cat > dev-admin-urls.txt << EOF
🔧 开发环境管理后台快捷链接
================================

📊 数据源管理:
http://localhost:3000/admin/data-sources?key=$PUBLIC_KEY

⚙️  环境变量配置:
http://localhost:3000/admin/env-config?key=$PUBLIC_KEY

🐛 调试页面:
http://localhost:3000/admin/debug?key=$PUBLIC_KEY

💡 提示:
- 这些链接包含访问密钥，请勿分享给他人
- 在生产环境中请使用更强的密钥
- 可以通过 localhost 直接访问（无需密钥）

生成时间: $(date)
EOF

echo "✅ 已创建 dev-admin-urls.txt 文件"

# 显示摘要
echo ""
echo "🎉 开发环境设置完成！"
echo "================================"
echo ""
echo "📋 设置摘要:"
echo "  ✅ 已创建 .env 文件"
echo "  ✅ 已生成管理员访问密钥"
echo "  ✅ 已设置本地开发配置"
echo "  ✅ 已创建快捷访问链接"
echo ""
echo "🚀 下一步:"
echo "  1. 运行 'npm run dev' 启动开发服务器"
echo "  2. 访问 http://localhost:3000"
echo "  3. 查看 dev-admin-urls.txt 获取管理后台链接"
echo ""
echo "📖 管理员密钥信息:"
echo "  🔒 服务端密钥: $ADMIN_KEY"
echo "  🌐 客户端密钥: $PUBLIC_KEY"
echo ""
echo "⚠️  重要提示:"
echo "  - 请保管好生成的密钥"
echo "  - 不要将 .env 文件提交到版本控制"
echo "  - 生产环境请使用更强的密钥"

# 询问是否立即启动开发服务器
echo ""
read -p "🚀 是否立即启动开发服务器？ (y/n): " start_dev
if [ "$start_dev" = "y" ] || [ "$start_dev" = "Y" ]; then
    echo "🔥 启动开发服务器..."
    npm run dev
fi