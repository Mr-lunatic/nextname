import { TLDDetails } from '@/lib/tld-manager'

interface TLDStructuredDataProps {
  tld: TLDDetails
  url: string
}

export function TLDStructuredData({ tld, url }: TLDStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${tld.tld}域名指南`,
    "description": tld.description,
    "url": url,
    "about": {
      "@type": "Thing",
      "name": `${tld.tld}顶级域名`,
      "description": tld.registrationPolicy,
      "additionalType": "https://schema.org/Product"
    },
    "mainEntity": {
      "@type": "Service",
      "name": `${tld.tld}域名注册服务`,
      "description": `${tld.tld}域名注册、续费和管理服务`,
      "provider": {
        "@type": "Organization",
        "name": "Next Name",
        "url": "https://nextname.app"
      },
      "serviceType": "域名注册",
      "areaServed": "全球",
      "offers": tld.averagePrice ? {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": tld.averagePrice,
        "highPrice": tld.averagePrice * 2,
        "offerCount": "5+",
        "availability": "https://schema.org/InStock"
      } : undefined
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "首页",
          "item": "https://nextname.app"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "顶级域名",
          "item": "https://nextname.app/tlds"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": `${tld.tld}域名`,
          "item": url
        }
      ]
    },
    "faqPage": {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `${tld.tld}域名有什么注册限制吗？`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": tld.restrictions || tld.registrationPolicy
          }
        },
        {
          "@type": "Question",
          "name": `${tld.tld}域名适合什么类型的网站？`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${tld.tld}域名适合：${tld.usageExamples.join('、')}等类型的网站。`
          }
        },
        {
          "@type": "Question",
          "name": `${tld.tld}域名的平均价格是多少？`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": tld.averagePrice 
              ? `${tld.tld}域名的平均注册价格约为$${tld.averagePrice}，具体价格因注册商而异。`
              : `${tld.tld}域名的价格因注册商而异，建议对比多家注册商的价格。`
          }
        }
      ]
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}

interface TLDListStructuredDataProps {
  tlds: TLDDetails[]
  totalCount: number
}

export function TLDListStructuredData({ tlds, totalCount }: TLDListStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "顶级域名大全",
    "description": "查看所有可注册的顶级域名(TLD)，包括.com、.net、.org等通用域名和各国家域名，实时价格对比和注册建议。",
    "url": "https://nextname.app/tlds",
    "mainEntity": {
      "@type": "ItemList",
      "name": "顶级域名列表",
      "description": "完整的顶级域名(TLD)列表，包含详细信息和价格对比",
      "numberOfItems": totalCount,
      "itemListElement": tlds.slice(0, 20).map((tld, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Service",
          "name": `${tld.tld}域名`,
          "description": tld.description,
          "url": `https://nextname.app/tld${tld.tld}`,
          "serviceType": "域名注册",
          "provider": {
            "@type": "Organization",
            "name": tld.registry
          },
          "offers": tld.averagePrice ? {
            "@type": "Offer",
            "price": tld.averagePrice,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          } : undefined
        }
      }))
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "首页",
          "item": "https://nextname.app"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "顶级域名",
          "item": "https://nextname.app/tlds"
        }
      ]
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}
