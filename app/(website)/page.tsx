'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/lib/cart-context';
import { products, getBestSellers, CIRCLE_CATEGORIES } from '@/lib/products';
import { ShoppingBag, Star, ChevronRight, ChevronLeft, Truck, Clock, Shield, Users, Store } from 'lucide-react';
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

  return (
    <section className="relative overflow-hidden bg-gray-900">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={slide.image}
          alt={slide.title}
          className="w-full h-full object-cover transition-opacity duration-700"
          key={slide.id}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/40" />
      </div>

      {/* Slide content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        {/* Badge */}
        <div className="inline-block bg-orange-500/20 text-orange-400 text-xs font-bold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-orange-500/30">
          {slide.badge}
        </div>

        {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
            {slide.title.split(' ').map((word, i) => (
              <span key={i}>
                {i > 0 && ' '}
                {i % 4 === 1 ? <span className="text-orange-400">{word}</span> : word}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p className="text-white/70 text-base leading-relaxed mb-3 max-w-md line-clamp-3">
            {slide.description}
          </p>

          {/* Discount text */}
          {slide.discountText && (
            <p className="text-orange-400 font-bold text-sm mb-5">{slide.discountText}</p>
          )}

          {/* CTA */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link href={slide.link}
              className="px-8 py-3.5 bg-orange-600 text-white font-bold text-sm rounded-full hover:bg-orange-700 transition-colors inline-flex items-center gap-2">
              SHOP NOW <ChevronRight size={15} />
            </Link>
            <Link href="/shop"
              className="px-8 py-3.5 border-2 border-white/30 text-white font-bold text-sm rounded-full hover:border-orange-400 hover:text-orange-400 transition-colors">
              View All Products
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-5">
            {[
              { icon: Truck, label: 'Same-Day Delivery' },
              { icon: Clock, label: 'Baked Fresh Daily' },
              { icon: Shield, label: 'Quality Guaranteed' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-white/60 font-medium">
                <b.icon size={14} className="text-orange-400" /> {b.label}
              </div>
            ))}
          </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={() => goTo(current - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => goTo(current + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-orange-500' : 'w-2 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      {slides.length > 1 && (
        <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full text-white/70 text-xs font-medium">
          {current + 1} / {slides.length}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const bestSellers = getBestSellers();

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
            <Link href="/#contact"
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
              { label: 'THANK YOU', image: 'https://images.unsplash.com/photo-1499638673689-79a0b0a1bcea?w=600&q=80&fit=crop', href: '/shop?category=Cookies' },
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

      {/* ─── SECOND BEST SELLERS (all products preview) ──────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-black text-gray-900">Fresh Today</h2>
            <Link href="/shop" className="text-sm font-bold text-gray-600 hover:text-orange-600 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.filter(p => p.inStock).slice(2, 10).map(p => <HomeProductCard key={p.id} product={p} />)}
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
