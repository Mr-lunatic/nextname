#!/usr/bin/env python3
import requests
import json
import time
import mysql.connector
from bs4 import BeautifulSoup
import re
from datetime import datetime
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class NazhumiSpider:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
        self.base_url = 'https://www.nazhumi.com'
        self.all_data = []
        self.support_matrix = {}
        self.tld_list = []
        self.registrar_list = set()
        self.failed_tlds = []
        
    def get_all_tlds(self):
        """使用已知的常见TLD列表，或者从其他来源获取"""
        try:
            print("🔍 Using predefined TLD list...")

            # 使用常见的TLD列表（基于我们之前的测试结果）
            common_tlds = [
                # 通用顶级域名
                'com', 'net', 'org', 'info', 'biz', 'name', 'pro', 'mobi', 'travel', 'jobs', 'tel', 'asia', 'xxx', 'cat', 'coop', 'museum', 'aero', 'int', 'post',

                # 新通用顶级域名
                'xyz', 'top', 'online', 'site', 'tech', 'store', 'blog', 'news', 'cloud', 'space', 'website', 'live', 'studio', 'design', 'art', 'shop', 'digital', 'email', 'host', 'domains',

                # 国家代码顶级域名
                'cn', 'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'uk', 'co.uk', 'org.uk', 'me.uk', 'de', 'fr', 'it', 'es', 'nl', 'ca', 'au', 'jp', 'kr', 'in', 'br', 'mx', 'ru', 'pl', 'se', 'no', 'dk', 'fi', 'be', 'ch', 'at', 'ie', 'pt', 'gr', 'cz', 'hk', 'tw', 'sg', 'my', 'th', 'ph', 'id', 'vn', 'ae', 'sa',

                # 其他TLD
                'io', 'co', 'ai', 'app', 'dev', 'me', 'tv', 'cc', 'ws'
            ]

            # 验证TLD是否真的存在
            verified_tlds = []
            print(f"📋 Verifying {len(common_tlds)} TLDs...")

            for i, tld in enumerate(common_tlds):
                try:
                    # 快速检查TLD页面是否存在
                    url = f'{self.base_url}/domain/{tld}'
                    response = self.session.head(url, timeout=10)

                    if response.status_code == 200:
                        verified_tlds.append(tld)
                        print(f"✅ {tld} - verified")
                    else:
                        print(f"❌ {tld} - not found")

                except Exception as e:
                    print(f"⚠️ {tld} - error: {e}")

                # 进度显示
                if (i + 1) % 10 == 0:
                    print(f"📊 Progress: {i + 1}/{len(common_tlds)} checked, {len(verified_tlds)} verified")

                # 友好延迟
                time.sleep(0.5)

            self.tld_list = verified_tlds
            print(f"🎉 Total verified TLDs: {len(verified_tlds)}")

            # 保存TLD列表
            os.makedirs('data', exist_ok=True)
            with open('data/nazhumi_tlds.json', 'w', encoding='utf-8') as f:
                json.dump(verified_tlds, f, indent=2, ensure_ascii=False)

            return verified_tlds

        except Exception as e:
            print(f"❌ Error getting TLD list: {e}")
            return []
    
    def get_tld_registrars(self, tld):
        """从 https://www.nazhumi.com/domain/{tld}/1 获取特定TLD的所有注册商和价格"""
        try:
            print(f"🔍 Getting registrars for .{tld}...")
            
            page = 1
            tld_data = []
            
            while True:
                url = f'{self.base_url}/domain/{tld}/{page}'
                
                response = self.session.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 查找价格表格或列表
                price_rows = self.parse_price_table(soup, tld)
                
                if not price_rows:
                    if page == 1:
                        print(f"⚠️ No price data found for .{tld}")
                        self.failed_tlds.append(tld)
                    break
                
                tld_data.extend(price_rows)
                print(f"✅ Found {len(price_rows)} registrars on page {page} for .{tld}")
                
                # 检查是否有下一页
                next_page = soup.find('a', text=re.compile(r'下一页|Next|>'))
                if not next_page:
                    break
                
                page += 1
                time.sleep(1)  # 友好延迟
            
            # 更新支持矩阵
            for data in tld_data:
                registrar = data['registrar']
                self.registrar_list.add(registrar)
                
                if registrar not in self.support_matrix:
                    self.support_matrix[registrar] = []
                if tld not in self.support_matrix[registrar]:
                    self.support_matrix[registrar].append(tld)
            
            print(f"🎉 Total registrars for .{tld}: {len(tld_data)}")
            return tld_data
            
        except Exception as e:
            print(f"❌ Error getting registrars for .{tld}: {e}")
            self.failed_tlds.append(tld)
            return []
    
    def parse_price_table(self, soup, tld):
        """解析价格表格，提取注册商和价格信息"""
        try:
            price_data = []

            # 查找价格表格 - 基于实际HTML结构
            table = soup.find('table', class_='table')
            if not table:
                print(f"⚠️ No price table found for .{tld}")
                return []

            # 查找表格行
            tbody = table.find('tbody')
            if not tbody:
                print(f"⚠️ No tbody found in table for .{tld}")
                return []

            rows = tbody.find_all('tr')
            print(f"📋 Found {len(rows)} price rows for .{tld}")

            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 5:  # 注册商、注册价格、续费价格、转入价格、操作
                    data = self.extract_price_data(cells, tld)
                    if data:
                        price_data.append(data)

            return price_data

        except Exception as e:
            print(f"⚠️ Error parsing price table for .{tld}: {e}")
            return []
    
    def extract_price_data(self, cells, tld):
        """从表格行中提取价格数据 - 基于实际HTML结构"""
        try:
            if len(cells) < 5:  # 注册商、注册价格、续费价格、转入价格、操作
                return None

            # 提取注册商信息 (第1列)
            registrar_cell = cells[0]
            registrar_link = registrar_cell.find('a')

            if not registrar_link:
                return None

            registrar_name = registrar_link.get_text(strip=True)
            href = registrar_link.get('href', '')

            # 从链接中提取注册商代码: /registrar/spaceship -> spaceship
            registrar_match = re.search(r'/registrar/([^/]+)', href)
            if registrar_match:
                registrar = registrar_match.group(1)
            else:
                registrar = registrar_name.lower().replace(' ', '').replace('.', '')

            # 提取官网链接 (第5列)
            registrar_url = ''
            if len(cells) > 4:
                url_link = cells[4].find('a')
                if url_link:
                    registrar_url = url_link.get('href', '')

            # 提取价格信息
            reg_price_text = cells[1].get_text(strip=True)      # 注册价格
            renew_price_text = cells[2].get_text(strip=True)    # 续费价格
            transfer_price_text = cells[3].get_text(strip=True) # 转入价格

            # 解析价格和货币
            reg_price, reg_currency = self.parse_price_and_currency(reg_price_text)
            renew_price, renew_currency = self.parse_price_and_currency(renew_price_text)
            transfer_price, transfer_currency = self.parse_price_and_currency(transfer_price_text)

            # 使用第一个有效货币作为主货币
            currency = reg_currency or renew_currency or transfer_currency or 'usd'

            # 检查是否有有效价格
            if not any([reg_price, renew_price, transfer_price]):
                return None

            data = {
                'tld': tld,
                'registrar': registrar,
                'registrar_name': registrar_name,
                'registrar_url': registrar_url,
                'registration_price': reg_price,
                'renewal_price': renew_price,
                'transfer_price': transfer_price,
                'currency': currency.lower(),
                'currency_name': self.get_currency_name(currency),
                'currency_type': self.get_currency_type(currency),
                'has_promo': False,
                'updated_time': datetime.now().isoformat(),
                'crawled_at': datetime.now().isoformat(),
                'source': 'nazhumi_web'
            }

            return data

        except Exception as e:
            print(f"⚠️ Error extracting price data: {e}")
            return None
    
    def extract_price_from_div(self, div, tld):
        """从div元素中提取价格数据"""
        try:
            text = div.get_text()
            # 这里需要根据实际HTML结构来解析
            # 暂时返回None，等看到实际页面结构后再实现
            return None
        except:
            return None
    
    def parse_price_and_currency(self, price_text):
        """解析价格文本，返回价格和货币 - 基于实际格式"""
        try:
            if not price_text or price_text.strip() in ['--', '-', 'N/A', '', '暂无']:
                return None, None

            # 移除空格和换行
            price_text = price_text.strip().replace('\n', '').replace('\r', '').replace(',', '')

            # 检测货币类型和提取价格
            currency = 'usd'  # 默认
            price = None

            # 美元格式: "5.62 美元" 或 "$5.62"
            if '美元' in price_text or '$' in price_text:
                currency = 'usd'
                price_match = re.search(r'(\d+(?:\.\d+)?)', price_text)
                if price_match:
                    price = float(price_match.group(1))

            # 人民币格式: "69 元" 或 "¥69"
            elif '元' in price_text or '¥' in price_text or 'CNY' in price_text.upper():
                currency = 'cny'
                price_match = re.search(r'(\d+(?:\.\d+)?)', price_text)
                if price_match:
                    price = float(price_match.group(1))

            # 欧元格式: "8 欧元" 或 "€8"
            elif '欧元' in price_text or '€' in price_text or 'EUR' in price_text.upper():
                currency = 'eur'
                price_match = re.search(r'(\d+(?:\.\d+)?)', price_text)
                if price_match:
                    price = float(price_match.group(1))

            # 英镑格式
            elif '英镑' in price_text or '£' in price_text or 'GBP' in price_text.upper():
                currency = 'gbp'
                price_match = re.search(r'(\d+(?:\.\d+)?)', price_text)
                if price_match:
                    price = float(price_match.group(1))

            # 默认处理：只有数字
            else:
                price_match = re.search(r'(\d+(?:\.\d+)?)', price_text)
                if price_match:
                    price = float(price_match.group(1))
                    currency = 'usd'  # 默认美元

            return price, currency

        except Exception as e:
            print(f"⚠️ Error parsing price '{price_text}': {e}")
            return None, None
    
    def get_currency_name(self, currency):
        """获取货币名称"""
        currency_names = {
            'usd': 'US Dollar',
            'cny': '人民币',
            'eur': '欧元',
            'gbp': '英镑',
            'jpy': '日元'
        }
        return currency_names.get(currency.lower(), currency.upper())
    
    def get_currency_type(self, currency):
        """获取货币类型"""
        currency_types = {
            'usd': '美元',
            'cny': '人民币',
            'eur': '欧元',
            'gbp': '英镑',
            'jpy': '日元'
        }
        return currency_types.get(currency.lower(), currency.upper())

    def save_to_mysql(self, data_list):
        """保存数据到MySQL"""
        if not data_list:
            return 0

        try:
            connection = mysql.connector.connect(
                host=os.getenv('DB_HOST'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD'),
                database=os.getenv('DB_NAME'),
                port=int(os.getenv('DB_PORT', 3306))
            )

            cursor = connection.cursor()

            insert_query = """
            INSERT INTO pricing_data (
                tld, registrar, registrar_name, registrar_url,
                registration_price, renewal_price, transfer_price,
                currency, currency_name, currency_type,
                has_promo, updated_time, crawled_at, source, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                registrar_name = VALUES(registrar_name),
                registrar_url = VALUES(registrar_url),
                registration_price = VALUES(registration_price),
                renewal_price = VALUES(renewal_price),
                transfer_price = VALUES(transfer_price),
                currency = VALUES(currency),
                currency_name = VALUES(currency_name),
                currency_type = VALUES(currency_type),
                has_promo = VALUES(has_promo),
                updated_time = VALUES(updated_time),
                crawled_at = VALUES(crawled_at)
            """

            saved_count = 0
            for data in data_list:
                try:
                    values = (
                        data['tld'],
                        data['registrar'],
                        data['registrar_name'],
                        data['registrar_url'],
                        data['registration_price'],
                        data['renewal_price'],
                        data['transfer_price'],
                        data['currency'],
                        data['currency_name'],
                        data['currency_type'],
                        data['has_promo'],
                        data['updated_time'],
                        data['crawled_at'],
                        data['source'],
                        True  # is_active
                    )

                    cursor.execute(insert_query, values)
                    saved_count += 1

                except Exception as e:
                    print(f"⚠️ Error saving {data['registrar']}/{data['tld']}: {e}")

            connection.commit()
            print(f"✅ Saved {saved_count}/{len(data_list)} records to MySQL")
            return saved_count

        except Exception as e:
            print(f"❌ MySQL error: {e}")
            return 0
        finally:
            if 'connection' in locals() and connection.is_connected():
                cursor.close()
                connection.close()

    def save_progress(self):
        """保存进度和统计信息"""
        try:
            os.makedirs('data', exist_ok=True)

            # 保存支持矩阵
            with open('data/nazhumi_support_matrix.json', 'w', encoding='utf-8') as f:
                json.dump(self.support_matrix, f, indent=2, ensure_ascii=False)

            # 保存注册商列表
            with open('data/nazhumi_registrars.json', 'w', encoding='utf-8') as f:
                json.dump(list(self.registrar_list), f, indent=2, ensure_ascii=False)

            # 保存失败的TLD列表
            with open('data/nazhumi_failed_tlds.json', 'w', encoding='utf-8') as f:
                json.dump(self.failed_tlds, f, indent=2, ensure_ascii=False)

            # 保存统计信息
            stats = {
                'crawl_time': datetime.now().isoformat(),
                'total_tlds': len(self.tld_list),
                'successful_tlds': len(self.tld_list) - len(self.failed_tlds),
                'failed_tlds': len(self.failed_tlds),
                'total_registrars': len(self.registrar_list),
                'total_combinations': sum(len(tlds) for tlds in self.support_matrix.values()),
                'success_rate': f"{((len(self.tld_list) - len(self.failed_tlds)) / len(self.tld_list) * 100):.1f}%" if self.tld_list else "0%",
                'registrar_stats': {
                    registrar: {
                        'supported_tlds': len(tlds),
                        'tld_list': tlds
                    }
                    for registrar, tlds in self.support_matrix.items()
                },
                'failed_tld_list': self.failed_tlds
            }

            with open('data/nazhumi_crawl_stats.json', 'w', encoding='utf-8') as f:
                json.dump(stats, f, indent=2, ensure_ascii=False)

            print("✅ Progress and stats saved to data/ directory")

        except Exception as e:
            print(f"❌ Error saving progress: {e}")

    def run_full_crawl(self):
        """运行完整的nazhumi网站爬取"""
        print("🚀 Starting full nazhumi website crawl...")
        print("📋 Phase 1: Getting all supported TLDs")

        # 阶段1: 获取所有TLD
        tld_list = self.get_all_tlds()
        if not tld_list:
            print("❌ No TLDs found, exiting...")
            return

        print(f"\n📋 Phase 2: Crawling {len(tld_list)} TLDs for registrar data")

        # 阶段2: 爬取每个TLD的注册商数据
        all_data = []
        for i, tld in enumerate(tld_list):
            print(f"\n📊 Progress: {i+1}/{len(tld_list)} - Crawling .{tld}")

            tld_data = self.get_tld_registrars(tld)
            if tld_data:
                all_data.extend(tld_data)

                # 每个TLD处理完后立即保存到数据库
                saved_count = self.save_to_mysql(tld_data)
                print(f"💾 Saved {saved_count} records for .{tld}")

            # 每10个TLD保存一次进度
            if (i + 1) % 10 == 0:
                self.save_progress()
                print(f"\n📈 Progress saved: {len(all_data)} total records so far")

            # 友好延迟
            if i < len(tld_list) - 1:
                time.sleep(2)  # 2秒延迟

        # 最终保存
        self.save_progress()

        # 显示最终统计
        print(f"\n🎉 Full crawl completed!")
        print(f"📊 Total TLDs processed: {len(tld_list)}")
        print(f"📊 Successful TLDs: {len(tld_list) - len(self.failed_tlds)}")
        print(f"📊 Failed TLDs: {len(self.failed_tlds)}")
        print(f"📊 Total registrars found: {len(self.registrar_list)}")
        print(f"📊 Total price records: {len(all_data)}")
        print(f"📊 Average registrars per TLD: {len(all_data) / (len(tld_list) - len(self.failed_tlds)):.1f}" if len(tld_list) > len(self.failed_tlds) else "N/A")

        if self.failed_tlds:
            print(f"\n⚠️ Failed TLDs: {', '.join(self.failed_tlds[:10])}" + ("..." if len(self.failed_tlds) > 10 else ""))

if __name__ == "__main__":
    spider = NazhumiSpider()
    spider.run_full_crawl()
