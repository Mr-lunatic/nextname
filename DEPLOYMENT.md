# 🚀 Cloudflare Pages 部署指南

## 准备工作

### 1. 域名迁移到Cloudflare（推荐）
```bash
# 优势：DNS + 部署 + 缓存一体化管理
1. 登录 Cloudflare Dashboard
2. 添加您的域名
3. 更新域名服务器到Cloudflare
4. 等待DNS传播（通常1-24小时）
```

### 2. 项目配置优化
```bash
# 添加Cloudflare特定配置
npm install @cloudflare/next-on-pages
```

## 🔧 部署配置

### 1. 创建 `wrangler.toml`
```toml
name = "yuming-domain-search"
compatibility_date = "2024-07-15"

[env.production]
vars = { NODE_ENV = "production" }
kv_namespaces = [
  { binding = "DOMAIN_CACHE", id = "your-kv-id", preview_id = "your-preview-kv-id" }
]
```

### 2. 优化 `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}

module.exports = nextConfig
```

### 3. 添加 Cloudflare 特定环境变量
```bash
# 在 Cloudflare Pages 设置中添加：
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
RDAP_CACHE_TTL=3600
```

## 📦 部署步骤

### 方式一：GitHub 集成（推荐）
```bash
1. 推送代码到 GitHub
2. Cloudflare Pages → 连接 GitHub
3. 选择仓库 → 配置构建设置：
   - 构建命令: npm run build
   - 输出目录: out
   - Node.js 版本: 18.x
```

### 方式二：直接部署
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 构建项目
npm run build

# 部署到 Cloudflare Pages
wrangler pages publish out --project-name=yuming-domain-search
```

## 🔧 高级配置

### 1. KV 存储设置（缓存优化）
```bash
# 创建 KV namespace
wrangler kv:namespace create "DOMAIN_CACHE"
wrangler kv:namespace create "DOMAIN_CACHE" --preview
```

### 2. 自定义域名配置
```bash
1. Pages 项目 → 自定义域 → 添加自定义域
2. 输入您的域名（如：search.yourdomain.com）
3. 自动配置 DNS 记录
4. 等待 SSL 证书生成
```

### 3. 性能优化规则
```javascript
// 在 _headers 文件中添加：
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: public, max-age=300, s-maxage=600

/api/domain/*
  Cache-Control: public, max-age=1800, s-maxage=3600
```

## 🚀 部署后优化

### 1. 启用 Cloudflare 功能
```bash
- ✅ Auto Minify (HTML, CSS, JS)
- ✅ Brotli 压缩
- ✅ HTTP/3 支持
- ✅ 0-RTT Connection Resumption
- ✅ Browser Cache TTL: 4 hours
```

### 2. 设置页面规则
```bash
yourdomain.com/api/domain/*
- Cache Level: Cache Everything
- Edge Cache TTL: 2 hours
- Browser Cache TTL: 30 minutes

yourdomain.com/api/search*
- Cache Level: Cache Everything  
- Edge Cache TTL: 10 minutes
- Browser Cache TTL: 5 minutes
```

### 3. 监控和分析
```bash
- 启用 Web Analytics
- 设置 Core Web Vitals 监控
- 配置错误日志收集
```

## 💡 成本对比

### Cloudflare Pages (推荐)
```
免费版：
- 请求：100,000/月
- 带宽：无限制
- 构建时间：500分钟/月
- 域名：无限制
- SSL：免费

Pro版 ($20/月)：
- 请求：10,000,000/月  
- 构建时间：5,000分钟/月
- 高级分析
```

### Vercel 对比
```
免费版：
- 请求：12,000/月 ❌
- 带宽：100GB/月 ❌
- 构建时间：6,000分钟/月

Pro版 ($20/月)：
- 请求：100,000/月
- 带宽：1TB/月
- 无边缘配置灵活性 ❌
```

## 🎯 推荐理由总结

1. **成本效益**：免费版就能支撑大多数需求
2. **性能优越**：全球CDN + 边缘计算
3. **域名集成**：DNS管理 + 部署一体化
4. **缓存能力**：KV存储完美适配域名查询缓存
5. **扩展性强**：可以轻松添加Workers处理复杂逻辑

## 🔗 有用链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [KV 存储文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [域名迁移指南](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)