'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/lib/cart-context';
import { products, getBestSellers, CIRCLE_CATEGORIES } from '@/lib/products';
import { ShoppingBag, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Offer, getOnOffer } from '@/lib/products';

type BannerSlide = {
  id: string;
  title: string;
  description: string;
  image: string;
  badge: string;
  discountText?: string;
  link: string;
  type: 'custom' | 'product';
};

// ─── Product Card (mini, for home page) ───────────────────────────────────
function HomeProductCard({ product }: { product: (typeof products)[0] }) {
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <div className="group cursor-pointer" onClick={() => router.push(`/shop/${product.id}`)}>
      <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square mb-3">
        <img src={product.image} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.isSale && product.originalPrice && (
          <div className="absolute top-3 right-0">
            <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 uppercase tracking-wider"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 8% 100%)' }}>
              SALE
            </div>
          </div>
        )}
        {product.isNew && (
          <span className="absolute top-3 left-3 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
          </div>
        )}
        {product.inStock && (
          <button
            onClick={e => { e.stopPropagation(); addItem({ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category }); }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-orange-600 flex items-center gap-1.5"
          >
            <ShoppingBag size={12} /> Add to Cart
          </button>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-sm font-black text-orange-600">KES {product.price.toLocaleString()}</span>
        {product.originalPrice && (
          <span className="text-xs text-gray-400 line-through">KES {product.originalPrice.toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}

// ─── Promotional Banner Carousel ──────────────────────────────────────────────
function PromoBannerCarousel() {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [rotationInterval, setRotationInterval] = useState(5);
  const [autoRotate, setAutoRotate] = useState(true);

  // Build slides from custom offers + product offers
  useEffect(() => {
    const buildSlides = async () => {
      const allSlides: BannerSlide[] = [];

      // 1. Load custom offers from Supabase (with localStorage fallback)
      let customOffers: Offer[] = [];
      try {
        const { data, error } = await supabase.from('offers').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        if (!error && data) customOffers = data as Offer[];
      } catch { /* table may not exist */ }

      if (customOffers.length === 0) {
        try {
          const local = localStorage.getItem('snackoh_offers');
          if (local) customOffers = (JSON.parse(local) as Offer[]).filter(o => o.is_active);
        } catch { /* ignore */ }
      }

      // Filter by date range
      const now = new Date();
      customOffers = customOffers.filter(o => {
        if (o.start_date && new Date(o.start_date) > now) return false;
        if (o.end_date && new Date(o.end_date) < now) return false;
        return true;
      });

      // Add custom offers as slides
      for (const offer of customOffers) {
        allSlides.push({
          id: `offer-${offer.id}`,
          title: offer.title,
          description: offer.description || '',
          image: offer.image_url || 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=1200&q=80&fit=crop',
          badge: offer.badge_text || 'Special Offer',
          discountText: offer.discount_text || undefined,
          link: offer.product_id ? `/shop/${offer.product_id}` : (offer.link_url || '/shop'),
          type: 'custom',
        });
      }

      // 2. Generate slides from products on sale
      const saleProducts = getOnOffer();
      for (const p of saleProducts) {
        if (p.originalPrice && p.isSale) {
          const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
          allSlides.push({
            id: `product-${p.id}`,
            title: p.name,
            description: p.description,
            image: p.image,
            badge: `${discount}% OFF`,
            discountText: `Now KES ${p.price.toLocaleString()} — Save KES ${(p.originalPrice - p.price).toLocaleString()}`,
            link: `/shop/${p.id}`,
            type: 'product',
          });
        }
      }

      // Fallback: if no slides at all, show a default hero
      if (allSlides.length === 0) {
        allSlides.push({
          id: 'default',
          title: 'Award-Winning Baked Goods Delivered Daily',
          description: 'From birthdays to anniversaries, we\'ve got the perfect bake for every occasion. Handcrafted with love by our master bakers — fresh every morning.',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80&fit=crop',
          badge: 'FREE DELIVERY ON ORDERS OVER KES 2,000',
          link: '/shop',
          type: 'custom',
        });
      }

      setSlides(allSlides);

      // Load rotation settings
      try {
        const rot = localStorage.getItem('snackoh_offer_rotation');
        if (rot) {
          const parsed = JSON.parse(rot);
          setAutoRotate(parsed.enabled !== false);
          setRotationInterval(parsed.interval || 5);
        }
      } catch { /* ignore */ }
    };

    buildSlides();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (!autoRotate || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, rotationInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRotate, rotationInterval, slides.length]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx < 0 ? slides.length - 1 : idx % slides.length);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[current];

  // Side cards for right column
  const sideCards = [
    { title: 'Freshly Baked Breads', desc: 'Artisan loaves baked fresh every morning. White, brown, sourdough & more.', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80&fit=crop', href: '/shop?category=Bread' },
    { title: 'Custom Cakes & Pastries', desc: 'Handcrafted cakes for every occasion. Order 48hrs in advance.', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&fit=crop', href: '/shop?category=Cake' },
  ];

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,0.45fr] gap-4 items-stretch">
          {/* Left: Main hero banner */}
          <div className="relative rounded-2xl overflow-hidden group cursor-pointer min-h-[320px] sm:min-h-[400px] lg:min-h-[480px]">
            <Link href={slide.link} className="absolute inset-0 z-10" />
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              key={slide.id}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                {slide.badge}
              </span>
            </div>

            {/* Text overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-white mb-3">
                {slide.title.split(' ').map((word, i) => (
                  <span key={i}>
                    {i > 0 && ' '}
                    {i % 4 === 1 ? <span className="text-orange-400">{word}</span> : word}
                  </span>
                ))}
              </h1>
              <p className="text-white/80 text-sm md:text-base leading-relaxed mb-4 max-w-lg line-clamp-2">
                {slide.description}
              </p>
              {slide.discountText && (
                <p className="text-orange-300 font-bold text-sm mb-4">{slide.discountText}</p>
              )}
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold text-sm rounded-full hover:bg-orange-700 transition-colors">
                SHOP NOW <ChevronRight size={15} />
              </span>
            </div>

            {/* Carousel controls */}
            {slides.length > 1 && (
              <>
                <button onClick={(e) => { e.preventDefault(); goTo(current - 1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={(e) => { e.preventDefault(); goTo(current + 1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-4 right-6 z-30 flex gap-1.5">
                  {slides.map((s, i) => (
                    <button key={s.id} onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                      className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-orange-500' : 'w-2 bg-white/50 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Two stacked promotional cards */}
          <div className="flex flex-col gap-4">
            {sideCards.map(card => (
              <Link key={card.title} href={card.href}
                className="relative rounded-2xl overflow-hidden group flex-1 min-h-[150px] lg:min-h-0 block">
                <img src={card.image} alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <h3 className="text-white font-black text-sm md:text-base mb-1">{card.title}</h3>
                  <p className="text-white/70 text-xs leading-relaxed line-clamp-2">{card.desc}</p>
                  <span className="inline-flex items-center gap-1 text-orange-400 text-xs font-bold mt-2 group-hover:text-orange-300 transition-colors uppercase tracking-wider">
                    Shop Now <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const bestSellers = getBestSellers();
  const [freshProducts, setFreshProducts] = useState<(typeof products)[0][]>([]);

  // Fetch products from database with fallback to hardcoded list
  useEffect(() => {
    async function loadFreshProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('in_stock', true)
          .order('created_at', { ascending: false })
          .limit(8);
        if (!error && data && data.length > 0) {
          setFreshProducts(data.map((p: Record<string, unknown>) => ({
            id: String(p.id),
            name: String(p.name || p.product_name || ''),
            price: Number(p.price) || 0,
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: String(p.image || p.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80&fit=crop'),
            category: String(p.category || ''),
            description: String(p.description || ''),
            details: String(p.details || ''),
            inStock: p.in_stock !== false,
            stock: Number(p.stock) || 0,
            tags: Array.isArray(p.tags) ? p.tags as string[] : [],
            isNew: Boolean(p.is_new),
            isSale: Boolean(p.is_sale),
            isBestSeller: Boolean(p.is_best_seller),
          })));
          return;
        }
      } catch { /* table may not exist yet */ }
      // Fallback to hardcoded products
      setFreshProducts(products.filter(p => p.inStock).slice(0, 8));
    }
    loadFreshProducts();
  }, []);

  return (
    <div className="bg-white">

      {/* ─── PROMOTIONAL BANNER CAROUSEL ──────────────────────────────────── */}
      <PromoBannerCarousel />

      {/* ─── SCROLLING CATEGORY CIRCLES ──────────────────────────────────── */}
      <section className="py-10 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
            {CIRCLE_CATEGORIES.map(cat => (
              <Link key={cat.label} href={cat.href}
                className="flex flex-col items-center gap-2.5 group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-transparent group-hover:border-orange-400 transition-all ring-2 ring-gray-100 group-hover:ring-orange-200">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-xs font-bold text-gray-700 group-hover:text-orange-600 transition-colors tracking-wide">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT WE OFFER (RETAIL & WHOLESALE) ──────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs text-orange-600 font-bold tracking-widest uppercase mb-1">Retail &amp; Wholesale</p>
            <h2 className="text-3xl font-black text-gray-900">What We Offer</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-lg mx-auto">
              Whether you&apos;re buying for your home or stocking your shop, we&apos;ve got you covered with fresh baked goods every day.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Fresh Breads', desc: 'White, brown, whole wheat & more', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80&fit=crop' },
              { name: 'Kaimati', desc: 'Traditional Kenyan sweet dumplings', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop' },
              { name: 'Cakes & Pastries', desc: 'Custom cakes, croissants & tarts', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80&fit=crop' },
              { name: 'Donuts & Cookies', desc: 'Glazed donuts, butter cookies & more', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80&fit=crop' },
            ].map(item => (
              <Link key={item.name} href="/shop" className="group relative rounded-2xl overflow-hidden aspect-square block">
                <img src={item.image} alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-black text-sm">{item.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Looking for <strong className="text-gray-700">wholesale pricing</strong>? We offer bulk orders for shops, restaurants, events, and corporate clients.
            </p>
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold text-sm rounded-full hover:bg-orange-700 transition-colors">
              Contact Us for Wholesale <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── BEST SELLERS ─────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs text-orange-600 font-bold tracking-widest uppercase mb-1">Our Favourites</p>
              <h2 className="text-3xl font-black text-gray-900">Best Sellers</h2>
            </div>
            <Link href="/shop" className="text-sm font-bold text-gray-600 hover:text-orange-600 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {bestSellers.map(p => <HomeProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ─── PROMO BANNER ─────────────────────────────────────────────────── */}
      <section className="py-4 px-6">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden bg-amber-950 relative h-64 md:h-80 flex items-center">
          <img
            src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=1200&q=80&fit=crop"
            alt="Bakery" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="relative z-10 px-10 md:px-16 max-w-xl">
            <p className="text-orange-300 text-xs font-bold tracking-widest uppercase mb-2">Limited Time</p>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              The Perfect Bakes<br />For Any Occasion
            </h2>
            <p className="text-white/70 text-sm mb-6">
              From graduation to anniversary — our seasonal creations are here for a limited time only.
            </p>
            <Link href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-bold text-sm rounded-full hover:bg-orange-600 hover:text-white transition-colors">
              SHOP NOW <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── GIFTS SECTION ────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs text-orange-600 font-bold tracking-widest uppercase mb-1">Celebrate with Us</p>
            <h2 className="text-3xl font-black text-gray-900">Gifts for Every Occasion!</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
              Whether it&apos;s a birthday or a thank-you, you&apos;ll find the perfect baked gift here.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'BIRTHDAYS', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&fit=crop', href: '/shop?category=Cake' },
              { label: 'THANK YOU', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&fit=crop', href: '/shop?category=Cookies' },
              { label: 'CELEBRATIONS', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80&fit=crop', href: '/shop?category=Cake' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] block">
                <img src={item.image} alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-5 inset-x-0 flex justify-center">
                  <span className="bg-white text-gray-900 font-black text-xs tracking-[0.2em] px-6 py-2.5 rounded-full group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FRESH TODAY (products from database) ─────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs text-orange-600 font-bold tracking-widest uppercase mb-1">Baked Today</p>
              <h2 className="text-3xl font-black text-gray-900">Fresh Today</h2>
            </div>
            <Link href="/shop" className="text-sm font-bold text-gray-600 hover:text-orange-600 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {freshProducts.map(p => <HomeProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-10 text-center">
            <Link href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-600 text-white font-bold text-sm rounded-full hover:bg-orange-700 transition-colors">
              Shop More <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── DISCOUNT STRIP ───────────────────────────────────────────────── */}
      <section className="py-5 bg-orange-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-black text-white">25% OFF CUSTOM CAKE ORDERS</p>
            <p className="text-orange-100 text-sm">Mix and match flavours, get 25% off. This week only.</p>
          </div>
          <Link href="/shop?category=Cake"
            className="shrink-0 px-6 py-3 bg-white text-orange-600 font-black text-sm rounded-full hover:bg-gray-100 transition-colors">
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* ─── ABOUT US ──────────────────────────────────────────────────── */}
      <section id="about" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs text-orange-600 font-bold tracking-widest uppercase mb-2">About Snackoh Bakers</p>
              <h2 className="text-3xl font-black text-gray-900 mb-6">Committed to Health, Quality &amp; Freshness</h2>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  At Snackoh Bakers, we believe that every bite should be a testament to quality. Our bakery is built on a foundation of health-conscious baking, using premium ingredients sourced from trusted suppliers to ensure every product meets the highest standards.
                </p>
                <p>
                  We are committed to maintaining strict quality control at every step — from selecting the finest flours and natural ingredients to our carefully monitored baking processes. Freshness is not just a promise; it&apos;s our daily practice. Every loaf, pastry, and cake is baked fresh to order.
                </p>
                <p>
                  Whether you&apos;re a <strong className="text-gray-800">retail customer</strong> looking for your daily bread or a <strong className="text-gray-800">wholesale partner</strong> stocking your shelves, we serve both with the same dedication to excellence. We supply shops, restaurants, hotels, events, and corporate clients across Nairobi.
                </p>
              </div>
              <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <p className="text-sm font-bold text-gray-800 mb-1">Interested in wholesale orders?</p>
                <p className="text-xs text-gray-600 mb-3">We offer competitive bulk pricing for businesses. Get in touch with our sales team for a custom quote.</p>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-bold text-xs rounded-full hover:bg-orange-700 transition-colors">
                  Contact Us <ChevronRight size={12} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden aspect-[3/4]">
                <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80&fit=crop" alt="Fresh breads" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-[3/4] mt-8">
                <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80&fit=crop" alt="Cakes and pastries" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ──────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">What Our Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Grace M.', review: 'The chocolate fudge cake was absolutely divine! Ordered for my son\'s birthday and everyone was asking where it came from.', rating: 5 },
              { name: 'James K.', review: 'Croissants are the best in Nairobi! Flaky, buttery perfection. I order every Saturday morning.', rating: 5 },
              { name: 'Amina W.', review: 'Custom red velvet cake for our wedding. It was stunning and delicious. Cannot recommend enough!', rating: 5 },
            ].map(r => (
              <div key={r.name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{r.review}&rdquo;</p>
                <p className="font-bold text-gray-900 text-sm">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
