# 🚀 Cloudflare Pages 部署完整指南

## 📋 当前状态检查

✅ 域名已迁移到 Cloudflare  
✅ 项目配置已优化  
✅ 部署文件已准备完毕  

## 🔧 接下来的步骤

### 1️⃣ 推送代码到 GitHub

```bash
# 如果还没有 Git 仓库，先初始化
git init
git add .
git commit -m "Initial commit: Domain search application with Cloudflare optimization"

# 创建 GitHub 仓库（在 GitHub 网站上创建）
# 然后连接到远程仓库
git remote add origin https://github.com/YOUR_USERNAME/yuming-domain-search.git
git branch -M main
git push -u origin main
```

### 2️⃣ 配置 Cloudflare Pages

1. **登录 Cloudflare Dashboard**
   - 进入 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 选择 "Pages" 选项卡

2. **创建新项目**
   ```
   点击 "Create a project" 
   → 选择 "Connect to Git"
   → 选择 GitHub
   → 授权 Cloudflare 访问你的 GitHub
   → 选择刚创建的仓库
   ```

3. **配置构建设置**
   ```
   Project name: yuming-domain-search
   Production branch: main
   Build command: npm run build
   Build output directory: out
   Root directory: (留空)
   ```

4. **环境变量设置**
   ```
   NEXTAUTH_URL = https://yourdomain.com
   NODE_ENV = production
   ```

### 3️⃣ 配置自定义域名

1. **在 Cloudflare Pages 项目中**
   ```
   进入项目设置 → Custom domains
   → Add custom domain
   → 输入你的域名（如：search.yourdomain.com 或 yourdomain.com）
   ```

2. **DNS 记录会自动配置**
   - Cloudflare 会自动添加 CNAME 记录
   - SSL 证书会自动生成和配置

### 4️⃣ 配置 GitHub Secrets（用于自动部署）

在 GitHub 仓库中设置 Secrets：

1. **获取 Cloudflare API Token**
   ```
   Cloudflare Dashboard → My Profile → API Tokens
   → Create Token → Custom Token
   
   权限设置：
   - Account: Cloudflare Pages:Edit
   - Zone: Zone:Read
   - Zone Resources: Include - All zones
   ```

2. **获取 Account ID**
   ```
   Cloudflare Dashboard → 右侧边栏查看 Account ID
   ```

3. **在 GitHub 设置 Secrets**
   ```
   GitHub 仓库 → Settings → Secrets and variables → Actions
   
   添加以下 Secrets：
   - CLOUDFLARE_API_TOKEN: (上面获取的 API Token)
   - CLOUDFLARE_ACCOUNT_ID: (你的 Account ID)
   - NEXTAUTH_URL: https://yourdomain.com
   ```

## 🔄 本地开发到生产的工作流

### 开发流程

```bash
# 1. 本地开发
npm run dev

# 2. 开发完成后，提交代码
git add .
git commit -m "feat: 新功能描述"
git push origin main

# 3. 自动触发部署
# GitHub Actions 会自动构建并部署到 Cloudflare Pages
```

### 分支策略

```bash
# 开发分支
git checkout -b feature/new-feature
# 开发...
git commit -m "feat: 新功能"
git push origin feature/new-feature

# 创建 Pull Request
# 合并到 main 分支后自动部署到生产环境
```

### 预览部署

```bash
# 每个 Pull Request 都会创建预览部署
# 可以在部署前预览更改
```

## 🚀 一键部署脚本

创建便捷的部署脚本：

```bash
# 创建 deploy.sh
#!/bin/bash
echo "🚀 开始部署到 Cloudflare Pages..."

# 检查是否有未提交的更改
if [[ `git status --porcelain` ]]; then
  echo "⚠️  有未提交的更改，请先提交："
  git status --short
  exit 1
fi

# 推送到 GitHub（触发自动部署）
git push origin main

echo "✅ 代码已推送，GitHub Actions 将自动构建并部署"
echo "📊 查看部署状态: https://github.com/YOUR_USERNAME/yuming-domain-search/actions"
echo "🌐 部署完成后访问: https://yourdomain.com"
```

## 📊 监控和优化

### 1. 性能监控
```bash
# Cloudflare Pages 提供：
- 构建时间监控
- 部署历史
- 访问分析
- Core Web Vitals
```

### 2. 缓存优化
```bash
# 已配置的缓存策略：
- 静态资源: 1年缓存
- API响应: 5-30分钟缓存  
- HTML页面: 5分钟缓存
```

### 3. CDN 优化
```bash
# Cloudflare 全球 CDN：
- 全球 200+ 节点
- 自动压缩（Brotli/Gzip）
- HTTP/3 支持
- 图片优化
```

## 🔧 故障排除

### 常见问题

1. **构建失败**
   ```bash
   检查 package.json 中的 engines 字段
   确保 Node.js 版本 >= 18
   ```

2. **API 路由不工作**
   ```bash
   确保 next.config.js 中的 output 配置正确
   检查 _redirects 文件
   ```

3. **域名解析问题**
   ```bash
   检查 DNS 记录是否正确
   使用 dig 命令验证：dig yourdomain.com
   ```

## 📱 移动端优化

已配置的优化：
- 响应式设计
- 触摸友好界面
- 快速加载（< 3秒）
- PWA 支持（可扩展）

## 🔒 安全配置

已配置的安全措施：
- HTTPS 强制重定向
- 安全头设置
- XSS 保护
- 内容类型检查
- 框架保护

---

## 🎯 总结

配置完成后，你将拥有：

✅ **自动化部署**：推送代码即部署  
✅ **全球 CDN**：极速访问体验  
✅ **SSL 证书**：自动配置和续期  
✅ **缓存优化**：智能缓存策略  
✅ **监控分析**：性能和访问数据  
✅ **预览部署**：安全的功能测试  

需要帮助完成任何步骤，请告诉我！