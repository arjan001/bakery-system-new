'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { products, getBestSellers, CIRCLE_CATEGORIES } from '@/lib/products';
import { ShoppingBag, Star, ChevronRight, Truck, Clock, Shield } from 'lucide-react';

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

export default function HomePage() {
  const bestSellers = getBestSellers();

  return (
    <div className="bg-white">

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <p className="text-xs text-orange-600 font-bold tracking-widest uppercase mb-3">
              FREE DELIVERY ON ORDERS OVER KES 2,000
            </p>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-5">
              Award-Winning<br />
              <span className="text-orange-600">Baked Goods</span><br />
              Delivered Daily
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
              From birthdays to anniversaries, we&apos;ve got the perfect bake for every occasion.
              Handcrafted with love by our master bakers — fresh every morning.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop"
                className="px-8 py-3.5 bg-gray-900 text-white font-bold text-sm rounded-full hover:bg-orange-600 transition-colors inline-flex items-center gap-2">
                SHOP NOW <ChevronRight size={15} />
              </Link>
              <Link href="/shop?category=Cake"
                className="px-8 py-3.5 border-2 border-gray-200 text-gray-800 font-bold text-sm rounded-full hover:border-orange-400 transition-colors">
                Custom Cakes
              </Link>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-5 mt-10">
              {[
                { icon: Truck, label: 'Same-Day Delivery' },
                { icon: Clock, label: 'Baked Fresh Daily' },
                { icon: Shield, label: 'Quality Guaranteed' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <b.icon size={14} className="text-orange-500" /> {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image Grid */}
          <div className="hidden md:grid grid-cols-2 gap-3 h-[480px]">
            <div className="rounded-3xl overflow-hidden row-span-2">
              <img
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&fit=crop"
                alt="Chocolate Cake" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80&fit=crop"
                alt="Croissant" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80&fit=crop"
                alt="Bread" className="w-full h-full object-cover" />
            </div>
          </div>
          {/* Mobile hero image */}
          <div className="md:hidden rounded-3xl overflow-hidden aspect-video">
            <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80&fit=crop"
              alt="Bakery" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

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
              { label: 'BIRTHDAYS', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop', href: '/shop?category=Cake' },
              { label: 'THANK YOU', image: 'https://images.unsplash.com/photo-1464500701-54b8b28ede7f?w=600&q=80&fit=crop', href: '/shop?category=Cookies' },
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
            <p className="text-2xl font-black text-white">25% OFF CUSTOM CAKE ORDERS 🎂</p>
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
