// 自定义图片加载器 - 支持CDN和多种优化策略
export default function imageLoader({ src, width, quality }) {
  // CDN配置
  const CDN_BASE_URL = process.env.CDN_URL || 'https://cdn.nextname.app'
  const IMAGE_CDN_URL = process.env.IMAGE_CDN_URL || 'https://images.nextname.app'
  
  // 如果是外部URL，直接返回
  if (src.startsWith('http')) {
    return src
  }
  
  // 图片质量优化
  const optimizedQuality = quality || 85
  
  // 根据文件类型选择不同的处理策略
  const isVector = src.endsWith('.svg')
  const isLogo = src.includes('/logo/')
  const isIcon = src.includes('icon') || src.includes('favicon')
  
  // SVG图片直接从CDN返回，不进行压缩
  if (isVector) {
    return `${CDN_BASE_URL}${src}`
  }
  
  // Logo和图标使用高质量
  if (isLogo || isIcon) {
    return `${IMAGE_CDN_URL}${src}?w=${width}&q=${Math.min(optimizedQuality + 10, 100)}&fm=webp`
  }
  
  // 根据宽度选择不同的优化策略
  let format = 'webp'
  let compressionQuality = optimizedQuality
  
  if (width >= 1920) {
    // 大图片使用AVIF格式和较高压缩
    format = 'avif'
    compressionQuality = Math.max(optimizedQuality - 10, 60)
  } else if (width >= 1200) {
    // 中等图片
    compressionQuality = optimizedQuality
  } else if (width <= 400) {
    // 小图片可以使用更高压缩
    compressionQuality = Math.max(optimizedQuality - 5, 70)
  }
  
  // 构建优化后的URL
  const params = new URLSearchParams({
    w: width.toString(),
    q: compressionQuality.toString(),
    fm: format,
    // 添加自适应压缩
    auto: 'compress,format',
    // 启用渐进式JPEG
    progressive: 'true',
    // 移除元数据减少文件大小
    strip: 'true'
  })
  
  return `${IMAGE_CDN_URL}${src}?${params.toString()}`
}

// 图片优化工具函数
export function getOptimizedImageProps(src, { width, height, quality, priority = false }) {
  const baseProps = {
    src,
    width,
    height,
    quality: quality || 85,
    priority,
    // 添加更好的加载策略
    loading: priority ? 'eager' : 'lazy',
    placeholder: 'blur',
    // 生成模糊占位符
    blurDataURL: generateBlurDataURL(width, height),
  }
  
  // 根据图片类型添加特定优化
  if (src.includes('logo') || src.includes('icon')) {
    baseProps.quality = Math.min(baseProps.quality + 10, 100)
  }
  
  return baseProps
}

// 生成模糊占位符
function generateBlurDataURL(width, height) {
  const canvas = typeof window !== 'undefined' ? document.createElement('canvas') : null
  if (!canvas) {
    // 服务端渲染时返回SVG占位符
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="100%" height="100%" fill="url(#grad)" opacity="0.5"/>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f9fafb;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>`
    ).toString('base64')}`
  }
  
  // 客户端生成Canvas占位符
  canvas.width = Math.min(width, 40)
  canvas.height = Math.min(height, 40)
  
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  return canvas.toDataURL('image/jpeg', 0.1)
}

// 图片懒加载观察器
export class ImageLazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    }
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    )
  }
  
  observe(element) {
    this.observer.observe(element)
  }
  
  unobserve(element) {
    this.observer.unobserve(element)
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        const src = img.dataset.src
        
        if (src) {
          // 预加载图片
          const newImg = new Image()
          newImg.onload = () => {
            img.src = src
            img.classList.remove('lazy-loading')
            img.classList.add('lazy-loaded')
          }
          newImg.onerror = () => {
            img.classList.add('lazy-error')
          }
          newImg.src = src
        }
        
        this.observer.unobserve(img)
      }
    })
  }
  
  disconnect() {
    this.observer.disconnect()
  }
}

// 图片压缩工具
export function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'image/webp'
  } = options
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      
      // 绘制并压缩
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(resolve, format, quality)
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}