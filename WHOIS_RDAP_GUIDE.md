# WHOIS与RDAP协议并存机制说明

## 协议选择策略

### 自动检测机制
```typescript
// 智能协议选择
if (shouldUseWhois(tld)) {
  // 使用传统WHOIS协议
  const whoisResult = await queryWhois(domain)
} else {
  // 使用现代RDAP协议  
  const rdapResult = await queryRDAP(domain)
}
```

### TLD分类
- **WHOIS协议TLD (17个)**：.cn, .de, .io, .co, .me, .jp, .kr, .in, .ru, .it, .be, .eu, .au, .mx, .tv, .cc, .ly, .sh, .gg, .crypto
- **RDAP协议TLD (1193+个)**：.com, .net, .org, .info, .biz, .name, .ai, .app, .dev 等大部分现代TLD

## WHOIS API服务说明

### 当前使用的免费API服务

1. **WhoisJS API** (主要)
   - 地址：https://api.whoisjs.com/
   - 费用：完全免费，无需API key
   - 限制：无明确限制，社区维护
   - 稳定性：中等，可能偶尔不稳定

2. **Generic WHOIS API** (备用)
   - 地址：https://whois.as207111.net/api/whois
   - 费用：免费
   - 限制：基础功能
   - 稳定性：较好

3. **RDAP代理服务** (RIPE)
   - 地址：https://rdap.db.ripe.net/
   - 费用：免费，官方服务
   - 限制：主要覆盖欧洲域名
   - 稳定性：高，RIPE官方维护

4. **WhoisFreaks API** (备用)
   - 地址：https://api.whoisfreaks.com/
   - 费用：有免费额度，可能需要注册
   - 限制：日请求量限制
   - 稳定性：较好，商业服务

### 容错机制
- **多服务轮询**：依次尝试4个API服务
- **8秒超时**：避免单个服务阻塞
- **保守策略**：查询失败时假设域名已注册
- **明确标识**：返回数据标明查询方法和可靠性

## 数据质量对比

| 协议/服务 | 准确性 | 响应速度 | 数据完整性 | 稳定性 |
|-----------|--------|----------|------------|--------|
| RDAP (官方) | 95% | 快 (2-5s) | 高 | 高 |
| WHOIS API (免费) | 80% | 中 (3-8s) | 中 | 中 |
| HTTP验证 | 70% | 快 (2-3s) | 低 | 高 |
| 启发式判断 | 60% | 即时 | 很低 | 高 |

## 缓存策略

### 分层TTL设置
```typescript
if (responseData.is_available) {
  ttl = 5 * 60 * 1000      // 5分钟 - 可用域名可能被快速注册
} else if (responseData.fallback_method) {
  ttl = 2 * 60 * 1000      // 2分钟 - WHOIS API结果可靠性较低
} else {
  ttl = 30 * 60 * 1000     // 30分钟 - RDAP官方数据最可靠
}
```

### 数据来源标识
- `RDAP (Official)` - 官方RDAP数据，最可靠
- `WhoisJS API (Free)` - 免费WHOIS API
- `RDAP Proxy (Free)` - RDAP代理服务
- `CN HTTP verification` - 中国域名HTTP验证
- `Conservative heuristic` - 保守启发式判断

## 成本分析

### 完全免费的服务
1. **WhoisJS API** - 社区项目，完全免费
2. **RIPE RDAP代理** - 官方服务，免费
3. **Generic WHOIS** - 基础免费服务
4. **HTTP验证** - 自建，无外部依赖

### 潜在付费服务（备用）
- **WhoisFreaks** - 有免费额度，超出后收费
- 如需更高稳定性，可考虑：
  - WhoisXML API (每月1000次免费)
  - Whois API (.com等商业服务)

## 建议优化方案

### 短期（当前实现）
- 使用免费API组合
- 多重fallback确保可用性
- 明确标识数据来源

### 中期优化
- 监控API稳定性和准确性
- 根据实际使用情况调整服务优先级
- 考虑缓存优化减少API调用

### 长期方案
- 评估是否需要付费API提升稳定性
- 考虑自建WHOIS查询服务
- 集成更多官方RDAP服务

## 注意事项

1. **免费API限制**：可能有请求频率限制
2. **数据准确性**：免费服务准确性略低于官方RDAP
3. **稳定性风险**：第三方服务可能偶尔不可用
4. **保守策略**：系统设计为宁可误报已注册，不误报可注册