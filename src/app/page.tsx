import { getAllSupportedTLDs } from '@/lib/tld-data';
import { TldItem } from '@/types';
import HomePageContent from '@/components/home-page-content';

export const runtime = 'edge'; // Keep runtime for edge compatibility

export default async function Page() {
  const allTlds = await getAllSupportedTLDs();
  
  // Real pricing data for popular TLDs
  const tldPrices: { [key: string]: string } = {
    '.com': '$7.49',
    '.net': '$7.64', 
    '.org': '$5.62',
    '.cn': '¥25',
    '.io': '$9.99',
    '.ai': '$68.98'
  };
  
  const popularTLDs = allTlds.map((item: TldItem) => ({ 
    name: item.tld, 
    price: tldPrices[item.tld] || '$12.99' // Default fallback for other TLDs
  }));

  return <HomePageContent popularTLDs={popularTLDs} />;
}