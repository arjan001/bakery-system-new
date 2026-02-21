'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CartProvider, useCart } from '@/lib/cart-context';
import { products } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Search, User, Heart, X, Plus, Minus, Menu, ChevronRight } from 'lucide-react';

// ─── Announcement Bar ───────────────────────────────────────────────────────
function AnnouncementBar() {
  return (
    <div className="bg-orange-600 text-white text-xs py-2.5 text-center font-medium tracking-wide">
      🍞 FREE DELIVERY ON ORDERS OVER KES 2,000 &nbsp;•&nbsp; FRESHLY BAKED DAILY &nbsp;•&nbsp; ORDER BY 5PM FOR NEXT-DAY DELIVERY &nbsp;•&nbsp; 🎂 CUSTOM CAKES — ORDER 48 HRS IN ADVANCE
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const { itemCount, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [businessName, setBusinessName] = useState('SNACKOH');
  const router = useRouter();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Load logo and business name from database/localStorage
  useEffect(() => {
    async function loadBranding() {
      try {
        const { data, error } = await supabase.from('business_settings').select('value').eq('key', 'general').single();
        if (!error && data?.value) {
          const g = data.value as Record<string, string>;
          if (g.logoUrl) setLogoUrl(g.logoUrl);
          if (g.businessName) setBusinessName(g.businessName);
          return;
        }
      } catch { /* table may not exist */ }
      try {
        const saved = localStorage.getItem('snackoh_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.general?.logoUrl) setLogoUrl(parsed.general.logoUrl);
          if (parsed.general?.businessName) setBusinessName(parsed.general.businessName);
        }
      } catch { /* ignore */ }
    }
    loadBranding();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'HOME', href: '/' },
    { label: 'SHOP', href: '/shop' },
    { label: 'ABOUT', href: '/#about' },
    { label: 'CONTACT', href: '/#contact' },
  ];

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-10 w-auto object-contain" />
            ) : (
              <span className="text-2xl font-black tracking-tight text-gray-900 hover:text-orange-600 transition-colors">
                {businessName}
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className="text-xs font-bold tracking-widest text-gray-700 hover:text-orange-600 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700">
              <Search size={18} />
            </button>
            <Link href="/admin"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700"
              title="Staff Admin">
              <User size={18} />
            </Link>
            <button
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700">
              <Heart size={18} />
            </button>
            <button onClick={openCart}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700">
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
            <button className="md:hidden ml-1 w-9 h-9 flex items-center justify-center" onClick={() => setMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute inset-0 bg-white z-50 flex items-center px-6" style={{ height: 64 }}>
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search breads, cakes, pastries…"
                className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400" />
              <button type="submit" className="text-xs font-bold text-orange-600 hover:underline">Search</button>
              <button type="button" onClick={() => setSearchOpen(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex justify-between items-center">
              <span className="text-xl font-black">SNACKOH</span>
              <button onClick={() => setMenuOpen(false)}><X size={20} /></button>
            </div>
            <nav className="p-5 space-y-4">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-sm font-bold tracking-wider text-gray-800 hover:text-orange-600 py-2 border-b border-gray-50">
                  {l.label} <ChevronRight size={14} className="text-gray-400" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Cart Drawer ─────────────────────────────────────────────────────────────
function CartDrawer() {
  const { items, removeItem, updateQty, total, isOpen, closeCart, itemCount } = useCart();
  const router = useRouter();
  const freeDeliveryThreshold = 2000;
  const remaining = Math.max(0, freeDeliveryThreshold - total);
  const progress = Math.min(100, (total / freeDeliveryThreshold) * 100);

  const suggested = products.filter(p => !items.find(i => i.id === p.id) && p.inStock).slice(0, 3);

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-50" onClick={closeCart} />}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[400px] max-w-full bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-base">Shopping Cart</h2>
          <button onClick={closeCart} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Free delivery bar */}
        <div className="px-5 py-3 border-b border-gray-50">
          {remaining > 0 ? (
            <p className="text-xs text-gray-600 mb-1.5">
              Buy <strong>KES {remaining.toLocaleString()}</strong> more to enjoy <strong>FREE delivery</strong>
            </p>
          ) : (
            <p className="text-xs text-green-700 font-semibold mb-1.5">🎉 You qualify for FREE delivery!</p>
          )}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag size={40} className="text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <button onClick={() => { closeCart(); router.push('/shop'); }}
                className="mt-4 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-full hover:bg-orange-700">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-orange-600 font-bold mt-0.5">KES {item.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                      <Minus size={10} />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                      <Plus size={10} />
                    </button>
                    <button onClick={() => removeItem(item.id)}
                      className="text-xs text-gray-400 hover:text-red-500 ml-2 underline">Remove</button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-800">KES {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}

          {/* You may also like */}
          {items.length > 0 && suggested.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">You may also like</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {suggested.map(p => (
                  <div key={p.id} className="shrink-0 w-28">
                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-50 mb-1.5">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700 truncate">{p.name}</p>
                    <p className="text-xs text-orange-600 font-bold">KES {p.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="font-black text-gray-900 text-base">KES {total.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">Taxes and delivery calculated at checkout</p>
            <button onClick={() => { closeCart(); router.push('/checkout'); }}
              className="w-full py-3.5 bg-gray-900 text-white font-bold text-sm rounded-full hover:bg-gray-800 transition-colors">
              Check Out
            </button>
            <button onClick={() => { closeCart(); router.push('/cart'); }}
              className="w-full py-3 border-2 border-gray-200 text-gray-800 font-bold text-sm rounded-full hover:border-gray-400 transition-colors">
              View Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-white text-2xl font-black mb-4">SNACKOH</h3>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              Artisan baked goods crafted with love. From our oven to your table, fresh daily.
            </p>
            <p className="text-xs text-gray-500">📍 Nairobi, Kenya</p>
            <p className="text-xs text-gray-500 mt-1">📞 +254 700 000 000</p>
            <p className="text-xs text-gray-500 mt-1">✉️ hello@snackoh.co.ke</p>
            <div className="flex gap-3 mt-4">
              {['𝕏', 'f', '▶', 'in'].map(s => (
                <button key={s} className="w-8 h-8 bg-gray-800 rounded-full text-xs font-bold flex items-center justify-center hover:bg-orange-600 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">About Us</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {['Our Story', 'Privacy Policy', 'Terms & Conditions', 'Contact Us', 'Careers'].map(l => (
                <li key={l}><Link href="#" className="hover:text-orange-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Categories</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {['Breads', 'Pastries', 'Cakes', 'Cookies', 'Donuts', 'Custom Orders'].map(l => (
                <li key={l}><Link href="/shop" className="hover:text-orange-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Let Us Help You</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {['Delivery Information', 'Order Tracking', 'FAQs', 'Refund Policy', 'Custom Cakes'].map(l => (
                <li key={l}><Link href="#" className="hover:text-orange-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom newsletter + payments */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap">
              🎁 Get 10% Off
            </div>
            <span className="text-xs text-gray-500">Subscribe to our newsletter for the latest updates and offers</span>
          </div>
          <div className="flex gap-2">
            <input type="email" placeholder="Your email address"
              className="px-4 py-2 bg-gray-800 text-white text-xs rounded-lg outline-none placeholder-gray-500 w-52 focus:ring-2 focus:ring-orange-500" />
            <button className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700">
              SUBSCRIBE
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Snackoh Bakers · All rights reserved</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">We accept:</span>
            {['VISA', 'MC', 'MPESA'].map(p => (
              <span key={p} className="px-2 py-0.5 bg-gray-800 text-gray-300 text-[10px] font-bold rounded">{p}</span>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-5 flex items-center justify-center">
          <p className="text-xs text-gray-600">
            Developed by{' '}
            <a href="http://oneplusafrica.com/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              OnePlusAfrica Tech Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
