# 域名搜索Web应用 - Domain Search Platform

> 专业的域名搜索、价格对比和WHOIS查询平台

## 🎯 项目特色

### 智能搜索功能
- **自动识别输入类型**：智能识别完整域名、域名前缀或域名后缀
- **实时搜索建议**：输入过程中提供智能补全和搜索建议
- **批量检测**：支持批量检测域名前缀在各TLD下的可用性

### 价格对比系统
- **多注册商对比**：实时对比50+注册商的价格
- **多维度排序**：支持按注册价格、续费价格、转入价格排序
- **优惠信息展示**：显示各注册商的促销活动和优惠代码

### 现代化体验
- **响应式设计**：完美适配桌面端和移动端
- **暗黑模式**：支持明亮/暗黑主题切换，可跟随系统设置
- **动画效果**：Framer Motion提供流畅的交互动画
- **无障碍访问**：支持键盘导航和屏幕阅读器

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
npm start
```

## 📁 项目结构

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API路由
│   │   ├── search/        # 搜索API
│   │   ├── domain/        # 域名查询API
│   │   └── pricing/       # 价格对比API
│   ├── search/            # 搜索结果页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # 组件库
│   ├── ui/               # 基础UI组件
│   ├── smart-search.tsx  # 智能搜索组件
│   ├── price-comparison.tsx # 价格对比组件
│   └── theme-toggle.tsx  # 主题切换组件
├── lib/                  # 工具函数
├── styles/              # 全局样式
└── types/               # TypeScript类型定义
```

## 🔧 技术栈

### 前端框架
- **Next.js 14+** - React全栈框架，支持SSR/SSG
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 原子化CSS框架
- **Framer Motion** - 动画效果库

### UI组件
- **Shadcn/ui** - 现代化组件库
- **Radix UI** - 无障碍访问的原始组件
- **Lucide React** - 图标库

### 状态管理
- **Zustand** - 轻量级状态管理
- **Next Themes** - 主题管理

## 📊 功能演示

### 1. 智能搜索
```typescript
// 自动检测输入类型
"google.com"     → 完整域名查询
"mysite"         → 域名前缀批量检测
".com"           → 域名后缀价格对比
```

### 2. 域名可用性检测
- 使用RDAP协议检测域名注册状态
- 显示详细的WHOIS信息
- 实时检测结果反馈

### 3. 价格对比
- 支持多种货币显示（USD、CNY、EUR等）
- 实时汇率转换
- 最优价格推荐

## 🎨 界面设计

### 设计原则
- **现代化设计**：采用当前流行的设计趋势
- **用户体验优先**：简洁直观的操作流程
- **性能优化**：快速加载和流畅交互

### 色彩方案
- **明亮模式**：白色背景，蓝色强调色
- **暗黑模式**：深色背景，高对比度文字
- **语义化颜色**：成功、警告、错误状态明确

## 🔌 API接口

### 搜索API
```http
GET /api/search?q={query}&type={type}&lang={lang}
```

### 域名查询API
```http
GET /api/domain/{domain}
```

### 价格对比API
```http
GET /api/pricing?domain={domain}&order={order}&currency={currency}
```

## 🌐 国际化支持

- 自动语言检测
- 中文/英文切换
- 完整本地化支持

## 📱 响应式设计

- 移动端优化
- 触摸友好的交互
- 自适应布局

## 🔒 安全性

- HTTPS加密传输
- 输入验证和过滤
- API限流保护

## 📈 性能优化

- 代码分割和懒加载
- 图片优化和CDN
- 缓存策略优化

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License

## 🎯 开发计划

- [ ] 国际化支持 (i18n)
- [ ] 货币切换功能
- [ ] 历史记录功能
- [ ] 收藏夹功能
- [ ] 用户认证系统
- [ ] 高级筛选功能

---

## 🌟 致谢

感谢所有为这个项目做出贡献的开发者和设计师。

特别感谢：
- Next.js 团队提供优秀的框架
- Tailwind CSS 提供强大的样式系统
- Radix UI 提供无障碍组件
- Framer Motion 提供流畅的动画效果

---

**💡 提示：** 这个项目旨在创建一个比 smartdomain.io 更优秀的域名搜索平台，提供更现代化的用户体验和更强大的功能。