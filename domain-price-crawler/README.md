# Domain Price Crawler

一个专为1M带宽Ubuntu服务器优化的域名价格采集系统，集成nazhumi.com API，支持定时采集和数据管理。

## 🌟 特性

- **带宽优化**: 专为1M带宽设计，5秒间隔请求，避免网络拥堵
- **智能采集**: 分层采集策略，优先采集热门TLD和注册商
- **数据去重**: 自动跳过已有新鲜数据，避免重复采集
- **错误处理**: 完善的重试机制和错误恢复
- **定时调度**: 凌晨2-6点自动采集，避开用户活跃期
- **数据管理**: PostgreSQL存储，支持数据清理和统计
- **日志监控**: 详细的日志记录和进度监控

## 📋 系统要求

- **操作系统**: Ubuntu 22.04 LTS
- **Node.js**: 18.x 或更高版本
- **数据库**: PostgreSQL 12+
- **内存**: 最少2GB RAM
- **带宽**: 1M带宽（已优化）
- **存储**: 至少10GB可用空间

## 🚀 快速开始

### 1. 环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 项目安装

```bash
# 克隆或下载项目到宝塔面板网站目录
cd /www/wwwroot
# 如果是上传的文件，解压到 domain-price-crawler 目录

cd domain-price-crawler

# 安装依赖
npm install
```

### 3. 数据库配置

在宝塔面板中：
1. 创建PostgreSQL数据库：`domain_pricing`
2. 创建数据库用户并授权
3. 记录数据库连接信息

### 4. 环境配置

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

配置示例：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=domain_pricing
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# 采集配置
CRAWL_INTERVAL_MS=5000
MAX_CONCURRENT_REQUESTS=1
DAILY_CRAWL_LIMIT=3600

# 日志配置
LOG_LEVEL=info
NODE_ENV=production
```

### 5. 数据库初始化

```bash
# 运行数据库设置
npm run setup
```

### 6. 测试系统

```bash
# 运行完整测试
npm run test
```

### 7. 启动系统

```bash
# 启动采集器
npm start
```

## 📊 使用说明

### 命令行选项

```bash
# 启动采集器
npm start

# 查看系统状态
npm start -- --status

# 运行测试
npm run test

# 数据库设置
npm run setup

# 查看帮助
npm start -- --help
```

### 系统监控

启动后，系统会显示：
- 📊 数据统计（总记录数、TLD数量、注册商数量）
- ⏰ 调度状态（下次采集时间、是否在采集窗口）
- 📈 采集结果（成功率、耗时、错误信息）

### 日志文件

日志文件位置：`logs/`
- `crawler.log` - 主日志文件
- `error.log` - 错误日志
- `crawl.log` - 采集专用日志（JSON格式）

## ⚙️ 配置说明

### 采集策略

系统采用分层采集策略：

1. **启动阶段** (< 500条记录)
   - 8个核心TLD × 10个主要注册商 = 80个任务
   - 确保最重要的数据优先获取

2. **扩展阶段** (500-2000条记录)
   - 20个重要TLD × 15个注册商 = 300个任务
   - 逐步扩展数据覆盖

3. **正常运营** (> 2000条记录)
   - 50个优先TLD × 40个注册商 = 2000个任务
   - 全面覆盖重要数据

### 带宽优化

- **请求间隔**: 5秒（可配置）
- **并发限制**: 1个（串行处理）
- **连接复用**: 启用HTTP Keep-Alive
- **数据压缩**: 启用gzip压缩
- **超时设置**: 30秒请求超时

### 时间调度

- **采集窗口**: 每日凌晨2:00-6:00
- **数据清理**: 每日凌晨1:00
- **健康检查**: 每小时一次
- **时区**: Asia/Shanghai

## 🔧 高级配置

### 自定义TLD和注册商

编辑 `src/config/constants.js`：

```javascript
// 添加自定义TLD
const CUSTOM_TLDS = ['example', 'test'];

// 添加自定义注册商
const CUSTOM_REGISTRARS = ['custom-registrar'];
```

### 调整采集频率

编辑 `.env` 文件：

```env
# 更快的采集间隔（注意带宽限制）
CRAWL_INTERVAL_MS=3000

# 更大的每日限制
DAILY_CRAWL_LIMIT=5000
```

### 数据库优化

```sql
-- 创建额外索引
CREATE INDEX idx_pricing_price ON pricing_data(registration_price);
CREATE INDEX idx_pricing_currency ON pricing_data(currency);

-- 定期维护
VACUUM ANALYZE pricing_data;
```

## 🛠️ 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查PostgreSQL服务状态
   sudo systemctl status postgresql
   
   # 检查数据库配置
   npm start -- --status
   ```

2. **API连接超时**
   ```bash
   # 测试网络连接
   curl -I https://www.nazhumi.com/api/v1
   
   # 检查防火墙设置
   sudo ufw status
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   
   # 调整Node.js内存限制
   export NODE_OPTIONS="--max-old-space-size=1024"
   ```

### 日志分析

```bash
# 查看实时日志
tail -f logs/crawler.log

# 查看错误日志
tail -f logs/error.log

# 搜索特定错误
grep "ERROR" logs/crawler.log
```

## 📈 性能监控

### 系统指标

- **采集速度**: 约900请求/小时
- **数据新鲜度**: 24小时内
- **成功率**: 目标>90%
- **响应时间**: 平均<5秒

### 监控命令

```bash
# 查看系统状态
npm start -- --status

# 查看数据库统计
psql -d domain_pricing -c "SELECT COUNT(*) FROM pricing_data;"

# 查看进程状态
ps aux | grep node
```

## 🔄 数据同步

系统设计支持与Cloudflare D1同步（待实现）：

```javascript
// 同步到Cloudflare D1
npm run sync
```

## 📝 开发说明

### 项目结构

```
src/
├── config/          # 配置文件
├── services/        # 核心服务
├── utils/           # 工具函数
├── setup/           # 数据库设置
└── test/            # 测试文件
```

### 添加新功能

1. 在 `src/services/` 中添加新服务
2. 在 `src/config/constants.js` 中添加配置
3. 在 `src/test/` 中添加测试
4. 更新 `README.md` 文档

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请查看：
1. 日志文件 `logs/`
2. 运行测试 `npm run test`
3. 检查系统状态 `npm start -- --status`
