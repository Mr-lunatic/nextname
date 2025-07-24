interface DomainStructuredDataProps {
  domain: string
}

export function DomainStructuredData({ domain }: DomainStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${domain} - 域名查询结果`,
    "description": `查看 ${domain} 的详细信息：WHOIS查询、注册状态、到期时间、DNS记录，以及50+注册商价格对比。`,
    "url": `https://nextname.app/domain/${domain}`,
    "mainEntity": {
      "@type": "Product",
      "name": `${domain} 域名`,
      "description": `${domain} 域名的详细信息和注册服务`,
      "category": "域名服务",
      "brand": {
        "@type": "Brand",
        "name": "NextName"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "8.57",
        "highPrice": "17.99",
        "offerCount": "5",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "NextName"
        }
      }
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
          "name": "域名查询",
          "item": "https://nextname.app/search"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": domain,
          "item": `https://nextname.app/domain/${domain}`
        }
      ]
    },
    "provider": {
      "@type": "Organization",
      "name": "NextName",
      "url": "https://nextname.app",
      "logo": "https://nextname.app/logo.png",
      "description": "专业的域名查询和价格对比平台"
    },
    "potentialAction": [
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://nextname.app/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      {
        "@type": "ViewAction",
        "target": `https://nextname.app/domain/${domain}`,
        "name": `查看 ${domain} 详情`
      }
    ],
    "about": {
      "@type": "Thing",
      "name": `${domain} 域名信息`,
      "description": `${domain} 的完整域名信息，包括WHOIS数据、注册商价格对比、DNS记录等详细信息。`,
      "sameAs": [
        `https://whois.net/whois/${domain}`,
        `https://www.whois.com/whois/${domain}`
      ]
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "NextName",
      "url": "https://nextname.app"
    },
    "dateModified": new Date().toISOString(),
    "datePublished": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "NextName",
      "url": "https://nextname.app"
    },
    "publisher": {
      "@type": "Organization",
      "name": "NextName",
      "url": "https://nextname.app",
      "logo": {
        "@type": "ImageObject",
        "url": "https://nextname.app/logo.png"
      }
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
