import { Suspense } from 'react';
import ShopPageClient from './shop-page-client';

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <ShopPageClient />
    </Suspense>
  );
}
