#!/bin/bash

# 🚀 Cloudflare Pages 快速部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署到 Cloudflare Pages..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查是否有 Git 仓库
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git add .
    git commit -m "Initial commit: Domain search application"
    echo "✅ Git 仓库已初始化"
    echo ""
    echo "⚠️  请手动完成以下步骤："
    echo "1. 在 GitHub 创建新仓库 'yuming-domain-search'"
    echo "2. 运行: git remote add origin https://github.com/YOUR_USERNAME/yuming-domain-search.git"
    echo "3. 运行: git push -u origin main"
    echo "4. 然后重新运行此脚本"
    exit 0
fi

# 检查是否有未提交的更改
if [[ `git status --porcelain` ]]; then
    echo "📝 发现未提交的更改，正在提交..."
    git add .
    
    # 获取提交信息
    read -p "请输入提交信息 (默认: Update application): " commit_msg
    commit_msg=${commit_msg:-"Update application"}
    
    git commit -m "$commit_msg"
    echo "✅ 更改已提交"
fi

# 推送到 GitHub
echo "📤 推送代码到 GitHub..."
git push origin main

echo ""
echo "✅ 部署流程已启动！"
echo ""
echo "📋 接下来的步骤："
echo "1. 🌐 GitHub Actions 将自动构建项目"
echo "2. 🚀 Cloudflare Pages 将自动部署"
echo "3. 📊 查看部署状态: https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
echo ""
echo "⏱️  部署通常需要 2-5 分钟完成"
echo "🌍 部署完成后即可访问您的网站"
echo ""
echo "💡 首次部署可能需要额外配置："
echo "   - 在 Cloudflare Pages 添加自定义域名"
echo "   - 在 GitHub 添加必要的 Secrets"
echo "   - 查看详细指南: cat CLOUDFLARE_DEPLOYMENT.md"