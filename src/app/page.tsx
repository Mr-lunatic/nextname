import { getAllSupportedTLDs } from '@/lib/tld-data';
import { TldItem } from '@/types';
import HomePageContent from '@/components/home-page-content';

export const runtime = 'edge'; // Keep runtime for edge compatibility

export default async function Page() {
  const allTlds = await getAllSupportedTLDs();
  const popularTLDs = allTlds.map((item: TldItem) => ({ name: item.tld, price: '$12.99' })); // Mock price for now

  return <HomePageContent popularTLDs={popularTLDs} />;
}