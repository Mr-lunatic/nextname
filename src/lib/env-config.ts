/**
 * 环境变量配置检查和验证工具
 * 用于确保应用运行所需的环境变量正确配置
 */

interface EnvConfig {
  // 必需的环境变量
  required: {
    name: string;
    description: string;
    category: 'api' | 'general';
  }[];
  
  // 可选的环境变量
  optional: {
    name: string;
    description: string;
    category: 'api' | 'general';
    defaultValue?: string;
  }[];
}

const ENV_CONFIG: EnvConfig = {
  required: [],  // 在生产环境中，我们不强制要求任何变量
  optional: [
    {
      name: 'NEXT_PUBLIC_BASE_URL',
      description: '应用的基础URL，用于生成完整的链接',
      category: 'general'
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

  // 在客户端环境中，只检查 NEXT_PUBLIC_ 开头的变量
  const isClientSide = typeof window !== 'undefined';
  
  // 检查必需的环境变量（目前为空，所以跳过）
  for (const config of ENV_CONFIG.required) {
    const value = process.env[config.name];
    if (!value || value.trim() === '') {
      errors.push(`❌ 缺少必需的环境变量: ${config.name} (${config.description})`);
      missing.push(config.name);
    } else {
      configured.push(config.name);
    }
  }

  // 检查可选的环境变量
  for (const config of ENV_CONFIG.optional) {
    // 在客户端只检查公开的环境变量
    if (isClientSide && !config.name.startsWith('NEXT_PUBLIC_')) {
      continue;
    }
    
    const value = process.env[config.name];
    if (!value || value.trim() === '') {
      missing.push(config.name);
    } else {
      configured.push(config.name);
      
      // URL格式验证
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
      console.log(`   ${name}: ${value}`);
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

   # 应用配置
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   
   # Google Analytics (可选)
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

3. 重启应用以应用更改

💡 提示: 这些环境变量都是可选的，应用可以在没有它们的情况下正常运行。
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