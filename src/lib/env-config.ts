/**
 * 环境变量配置检查和验证工具
 * 用于确保应用运行所需的环境变量正确配置
 */

interface EnvConfig {
  // 必需的环境变量
  required: {
    name: string;
    description: string;
    category: 'auth' | 'database' | 'api' | 'general';
  }[];
  
  // 可选的环境变量
  optional: {
    name: string;
    description: string;
    category: 'auth' | 'database' | 'api' | 'general';
    defaultValue?: string;
  }[];
}

const ENV_CONFIG: EnvConfig = {
  required: [
    {
      name: 'NEXT_PUBLIC_BASE_URL',
      description: '应用的基础URL，用于生成完整的链接',
      category: 'general'
    }
  ],
  optional: [
    {
      name: 'ADMIN_ACCESS_KEY',
      description: '服务端管理员访问密钥',
      category: 'auth'
    },
    {
      name: 'NEXT_PUBLIC_ADMIN_KEY',
      description: '客户端管理员访问密钥',
      category: 'auth'
    },
    {
      name: 'ALLOWED_IPS',
      description: '允许访问的IP地址白名单',
      category: 'auth'
    },
    {
      name: 'DEV_ALLOW_LOCALHOST',
      description: '开发环境是否允许localhost访问',
      category: 'auth',
      defaultValue: 'true'
    },
    {
      name: 'MAX_LOGIN_ATTEMPTS',
      description: '最大登录尝试次数',
      category: 'auth',
      defaultValue: '5'
    },
    {
      name: 'LOCKOUT_DURATION_MINUTES',
      description: '账户锁定时间(分钟)',
      category: 'auth',
      defaultValue: '30'
    },
    {
      name: 'CLOUDFLARE_ACCOUNT_ID',
      description: 'Cloudflare账户ID',
      category: 'database'
    },
    {
      name: 'CLOUDFLARE_API_TOKEN',
      description: 'Cloudflare API令牌',
      category: 'database'
    },
    {
      name: 'CLOUDFLARE_D1_DATABASE_ID',
      description: 'Cloudflare D1数据库ID',
      category: 'database'
    },
    {
      name: 'NEXT_PUBLIC_GA_ID',
      description: 'Google Analytics ID',
      category: 'api'
    },
    {
      name: 'DEBUG_VERBOSE_LOGGING',
      description: '是否启用详细日志',
      category: 'general',
      defaultValue: 'false'
    },
    {
      name: 'ENABLE_PERFORMANCE_MONITORING',
      description: '是否启用性能监控',
      category: 'general',
      defaultValue: 'false'
    }
  ]
};

export interface EnvCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  configured: string[];
  summary: {
    total: number;
    configured: number;
    missing: number;
    required: number;
    optional: number;
  };
}

/**
 * 检查环境变量配置
 */
export function checkEnvConfig(): EnvCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];
  const configured: string[] = [];

  // 检查必需的环境变量
  for (const config of ENV_CONFIG.required) {
    const value = process.env[config.name];
    if (!value || value.trim() === '') {
      errors.push(`❌ 缺少必需的环境变量: ${config.name} (${config.description})`);
      missing.push(config.name);
    } else {
      configured.push(config.name);
      
      // 特殊检查：URL格式验证
      if (config.name === 'NEXT_PUBLIC_BASE_URL') {
        try {
          new URL(value.trim());
          console.log(`✅ ${config.name} 配置正确:`, value.trim());
        } catch (e) {
          warnings.push(`⚠️ ${config.name} URL格式可能不正确: ${value}`);
        }
      }
    }
  }

  // 检查可选的环境变量
  for (const config of ENV_CONFIG.optional) {
    const value = process.env[config.name];
    if (!value || value.trim() === '') {
      if (config.category === 'auth') {
        warnings.push(`⚠️  建议配置: ${config.name} (${config.description})`);
      }
      missing.push(config.name);
    } else {
      configured.push(config.name);
      
      // 特殊检查
      if (config.name === 'NEXT_PUBLIC_ADMIN_KEY' && value === 'your-public-admin-key-here-please-change') {
        warnings.push(`⚠️  请更改默认密钥: ${config.name}`);
      }
      if (config.name === 'ADMIN_ACCESS_KEY' && value === 'your-secret-admin-key-here-please-change') {
        warnings.push(`⚠️  请更改默认密钥: ${config.name}`);
      }
    }
  }

  const totalVars = ENV_CONFIG.required.length + ENV_CONFIG.optional.length;
  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    missing,
    configured,
    summary: {
      total: totalVars,
      configured: configured.length,
      missing: missing.length,
      required: ENV_CONFIG.required.length,
      optional: ENV_CONFIG.optional.length
    }
  };
}

/**
 * 打印环境变量检查结果
 */
export function printEnvCheckResult(result: EnvCheckResult, verbose: boolean = false): void {
  const isDev = process.env.NODE_ENV === 'development';
  
  console.log('\n🔧 环境变量配置检查');
  console.log('='.repeat(50));
  
  // 打印摘要
  console.log(`📊 配置摘要: ${result.summary.configured}/${result.summary.total} 个变量已配置`);
  console.log(`   必需变量: ${ENV_CONFIG.required.length - result.errors.length}/${ENV_CONFIG.required.length}`);
  console.log(`   可选变量: ${result.summary.configured - (ENV_CONFIG.required.length - result.errors.length)}/${ENV_CONFIG.optional.length}`);
  
  // 打印错误
  if (result.errors.length > 0) {
    console.log('\n❌ 错误:');
    result.errors.forEach(error => console.log(`   ${error}`));
  }
  
  // 打印警告
  if (result.warnings.length > 0) {
    console.log('\n⚠️  警告:');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  // 开发环境提示
  if (isDev && !result.isValid) {
    console.log('\n💡 开发环境快速修复:');
    console.log('   1. 复制环境变量模板: cp .env.example .env');
    console.log('   2. 编辑 .env 文件，配置必需的环境变量');
    console.log('   3. 重启开发服务器');
  }
  
  // 详细信息
  if (verbose && result.configured.length > 0) {
    console.log('\n✅ 已配置的变量:');
    result.configured.forEach(name => {
      const value = process.env[name];
      const displayValue = name.includes('KEY') || name.includes('TOKEN') 
        ? `${value?.substring(0, 4)}...` 
        : value;
      console.log(`   ${name}: ${displayValue}`);
    });
  }
  
  console.log('='.repeat(50));
  
  if (result.isValid) {
    console.log('✅ 环境变量配置检查通过\n');
  } else {
    console.log('❌ 环境变量配置检查失败\n');
  }
}

/**
 * 获取环境变量配置指南
 */
export function getEnvSetupGuide(): string {
  return `
🚀 环境变量设置指南

1. 创建环境变量文件:
   cp .env.example .env

2. 编辑 .env 文件，配置以下关键变量:

   # 管理员访问控制
   ADMIN_ACCESS_KEY=your-secret-admin-key-here
   NEXT_PUBLIC_ADMIN_KEY=your-public-admin-key-here

   # 应用配置
   NEXT_PUBLIC_BASE_URL=https://your-domain.com

3. 生成安全密钥:
   openssl rand -base64 32

4. 重启应用以应用更改

💡 提示: 在生产环境中，请确保使用强密钥并定期更换。
`;
}

/**
 * 在应用启动时检查环境变量
 */
export function validateEnvOnStartup(): void {
  const result = checkEnvConfig();
  const isDev = process.env.NODE_ENV === 'development';
  const verboseLogging = process.env.DEBUG_VERBOSE_LOGGING === 'true';
  
  // 在开发环境或启用详细日志时显示完整检查结果
  if (isDev || verboseLogging) {
    printEnvCheckResult(result, verboseLogging);
  }
  
  // 在生产环境中，如果有关键配置问题，记录警告
  if (!isDev && !result.isValid) {
    console.warn('⚠️  Production environment has configuration issues. Please check your environment variables.');
    result.errors.forEach(error => console.warn(error));
  }
}

export { ENV_CONFIG };