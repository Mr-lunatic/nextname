-- Cloudflare D1 数据库表结构
-- 用于存储从Ubuntu采集器同步的价格数据

CREATE TABLE IF NOT EXISTS pricing_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tld TEXT NOT NULL,
  registrar TEXT NOT NULL,
  registrar_name TEXT,
  registrar_url TEXT,
  registration_price REAL,
  renewal_price REAL,
  transfer_price REAL,
  currency TEXT,
  currency_name TEXT,
  currency_type TEXT,
  has_promo INTEGER DEFAULT 0,
  promo_code TEXT,
  updated_time TEXT,
  crawled_at TEXT DEFAULT (datetime('now')),
  source TEXT DEFAULT 'ubuntu_sync',
  is_active INTEGER DEFAULT 1,
  UNIQUE(tld, registrar)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_pricing_tld ON pricing_data(tld);
CREATE INDEX IF NOT EXISTS idx_pricing_registrar ON pricing_data(registrar);
CREATE INDEX IF NOT EXISTS idx_pricing_crawled_at ON pricing_data(crawled_at);
CREATE INDEX IF NOT EXISTS idx_pricing_active ON pricing_data(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_tld_active ON pricing_data(tld, is_active);

-- 同步状态表
CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_sync_time TEXT DEFAULT (datetime('now')),
  total_records INTEGER DEFAULT 0,
  sync_source TEXT DEFAULT 'ubuntu',
  status TEXT DEFAULT 'success'
);

-- 插入初始同步状态
INSERT OR IGNORE INTO sync_status (id, total_records, status) VALUES (1, 0, 'pending');
