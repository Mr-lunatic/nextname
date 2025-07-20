#!/bin/bash

# 域名价格采集器监控脚本
# 使用方法: ./monitor.sh

echo "🔍 Domain Price Crawler Monitor"
echo "═══════════════════════════════════════"

# 检查PM2状态
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📈 System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"

echo ""
echo "🗄️ Database Status:"
# 检查数据库记录数
RECORD_COUNT=$(mysql -u domain_pricing -p"simple123" domainpricing -se "SELECT COUNT(*) FROM pricing_data;" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "Total Records: $RECORD_COUNT"
    
    # 检查最新数据
    LATEST=$(mysql -u domain_pricing -p"simple123" domainpricing -se "SELECT MAX(crawled_at) FROM pricing_data;" 2>/dev/null)
    echo "Latest Data: ${LATEST:-'No data yet'}"
    
    # 检查今日采集数据
    TODAY_COUNT=$(mysql -u domain_pricing -p"simple123" domainpricing -se "SELECT COUNT(*) FROM pricing_data WHERE DATE(crawled_at) = CURDATE();" 2>/dev/null)
    echo "Today's Records: $TODAY_COUNT"
else
    echo "❌ Database connection failed"
fi

echo ""
echo "📋 Recent Logs (last 10 lines):"
pm2 logs domain-crawler --lines 10 --nostream

echo ""
echo "⏰ Next Actions:"
echo "- Data cleanup: Daily at 01:00"
echo "- Price crawling: Daily at 02:00"
echo "- Health check: Every hour"

echo ""
echo "🔧 Useful Commands:"
echo "pm2 logs domain-crawler          # View logs"
echo "pm2 restart domain-crawler       # Restart service"
echo "pm2 monit                        # Real-time monitoring"
echo "./monitor.sh                     # Run this script again"
