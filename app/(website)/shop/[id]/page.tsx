import { products } from '@/lib/products';
import ProductPageClient from './product-page-client';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductPageClient id={id} />;
}

export async function generateStaticParams() {
  return products.map(p => ({ id: p.id }));
}
