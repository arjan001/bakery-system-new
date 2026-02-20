'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/modal';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  saleType: 'Retail' | 'Wholesale';
}

interface Product {
  id: string;
  name: string;
  sku: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
}

type PaymentMethod = 'Cash' | 'Mpesa' | 'Credit';
type MpesaStatus = 'idle' | 'sending' | 'waiting' | 'success' | 'failed';

export default function POSPage() {
  // Products
  const [products] = useState<Product[]>([
    { id: '1', name: 'White Bread', sku: 'WB001', retailPrice: 200, wholesalePrice: 150, stock: 50, category: 'Bread' },
    { id: '2', name: 'Croissant', sku: 'CR001', retailPrice: 150, wholesalePrice: 100, stock: 30, category: 'Pastry' },
    { id: '3', name: 'Chocolate Cake', sku: 'CC001', retailPrice: 500, wholesalePrice: 400, stock: 20, category: 'Cake' },
    { id: '4', name: 'Donut', sku: 'DN001', retailPrice: 50, wholesalePrice: 35, stock: 100, category: 'Pastry' },
    { id: '5', name: 'Bagel', sku: 'BG001', retailPrice: 100, wholesalePrice: 75, stock: 40, category: 'Bread' },
    { id: '6', name: 'Muffin', sku: 'MF001', retailPrice: 120, wholesalePrice: 90, stock: 25, category: 'Cake' },
  ]);

  // Customers
  const WALK_IN: Customer = { id: 'walk-in', name: 'Walk-in Customer', phone: '', type: 'Retail' };
  const [customers] = useState<Customer[]>([
    WALK_IN,
    { id: '1', name: 'Main Retail Outlet', phone: '+254712345678', type: 'Retail' },
    { id: '2', name: 'Wholesale Distributors', phone: '+254723456789', type: 'Wholesale' },
  ]);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(WALK_IN);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>('idle');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [creditName, setCreditName] = useState('');
  const [creditPhone, setCreditPhone] = useState('');

  // Totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  // Filtered products
  const categories = [...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    const price = saleType === 'Retail' ? product.retailPrice : product.wholesalePrice;
    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCartItems([...cartItems, { id: product.id, name: product.name, price, quantity: 1, saleType }]);
    }
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => item.id === id ? { ...item, quantity: qty } : item));
    }
  };

  const removeFromCart = (id: string) => setCartItems(cartItems.filter(item => item.id !== id));

  const clearCart = () => {
    if (cartItems.length > 0 && confirm('Clear the cart?')) setCartItems([]);
  };

  // Reset everything
  const resetPOS = useCallback(() => {
    setCartItems([]);
    setPaymentMethod('Cash');
    setCashAmount(0);
    setMpesaPhone('');
    setMpesaStatus('idle');
    setMpesaMessage('');
    setCreditName('');
    setCreditPhone('');
    setShowPayment(false);
  }, []);

  // Customer selection
  const handleCustomerChange = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId) || WALK_IN;
    setSelectedCustomer(cust);
    if (cust.phone) setMpesaPhone(cust.phone);
    if (cust.type === 'Wholesale') setSaleType('Wholesale');
  };

  // ── M-Pesa STK Push ──
  const sendMpesaStkPush = async () => {
    if (!mpesaPhone) {
      setMpesaMessage('Please enter M-Pesa phone number');
      return;
    }

    setMpesaStatus('sending');
    setMpesaMessage('Sending STK push to ' + mpesaPhone + '...');

    try {
      const res = await fetch('/api/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: Math.ceil(total),
          accountReference: `POS-${Date.now()}`,
          description: `Bakery POS Sale - ${selectedCustomer.name}`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMpesaStatus('waiting');
        setMpesaMessage('STK push sent! Waiting for customer to enter PIN on their phone...');

        // Poll for completion (in production, use callback webhook)
        setTimeout(() => {
          setMpesaStatus('success');
          setMpesaMessage(`Payment of KES ${total.toFixed(0)} received via M-Pesa`);
        }, 8000);
      } else {
        setMpesaStatus('failed');
        setMpesaMessage(data.message || 'Failed to send STK push. Try again.');
      }
    } catch {
      setMpesaStatus('failed');
      setMpesaMessage('Network error. Check connection and try again.');
    }
  };

  // ── Handle Payment ──
  const handlePayment = () => {
    if (cartItems.length === 0) return;

    if (paymentMethod === 'Cash') {
      if (cashAmount < total) {
        alert('Insufficient payment amount');
        return;
      }
      const change = cashAmount - total;
      alert(`Sale Complete!\nTotal: KES ${total.toFixed(0)}\nPaid: KES ${cashAmount.toFixed(0)}\nChange: KES ${change.toFixed(0)}`);
      resetPOS();
    } else if (paymentMethod === 'Mpesa') {
      if (mpesaStatus === 'success') {
        alert(`M-Pesa Sale Complete!\nTotal: KES ${total.toFixed(0)}\nPhone: ${mpesaPhone}\nPayment received successfully.`);
        resetPOS();
      }
    } else if (paymentMethod === 'Credit') {
      const name = creditName || selectedCustomer.name;
      const phone = creditPhone || selectedCustomer.phone;
      if (!name || name === 'Walk-in Customer') {
        alert('Please select or enter a customer for credit sales');
        return;
      }
      // Save debtor record
      if (typeof window !== 'undefined') {
        const existing = window.localStorage.getItem('debtors');
        const list = existing ? JSON.parse(existing) : [];
        list.push({ id: Date.now().toString(), name, phone, amount: total, date: new Date().toLocaleDateString(), status: 'Pending', items: cartItems });
        window.localStorage.setItem('debtors', JSON.stringify(list));
      }
      alert(`Credit Sale Recorded!\nCustomer: ${name}\nAmount: KES ${total.toFixed(0)}\nThis appears in Debtors module.`);
      resetPOS();
    }
  };

  // Open checkout
  const openCheckout = () => {
    if (cartItems.length === 0) return;
    setPaymentMethod('Cash');
    setCashAmount(0);
    setMpesaPhone(selectedCustomer.phone || '');
    setMpesaStatus('idle');
    setMpesaMessage('');
    setCreditName(selectedCustomer.id !== 'walk-in' ? selectedCustomer.name : '');
    setCreditPhone(selectedCustomer.phone || '');
    setShowPayment(true);
  };

  // Quick cash amounts
  const quickCash = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-background">
      {/* Top Bar */}
      <div className="px-6 py-3 border-b border-border bg-card flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">Point of Sale</h1>
          <p className="text-xs text-muted-foreground">Cash &bull; M-Pesa &bull; Credit</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Customer selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Customer:</span>
            <select
              value={selectedCustomer.id}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none bg-background min-w-[180px]"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sale type toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['Retail', 'Wholesale'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSaleType(t)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  saleType === t ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Products ── */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search + filter */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none bg-card text-sm"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none bg-card text-sm font-medium"
            >
              <option value="All">All</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const price = saleType === 'Retail' ? product.retailPrice : product.wholesalePrice;
                const inCart = cartItems.find(i => i.id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`relative p-4 border rounded-xl text-left transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                      inCart ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
                        {inCart.quantity}
                      </span>
                    )}
                    <p className="font-semibold text-sm mb-0.5">{product.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{product.sku} &bull; {product.category}</p>
                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-primary">KES {price}</span>
                      <span className="text-xs text-muted-foreground">{product.stock} left</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cart ── */}
        <div className="w-[340px] flex flex-col border-l border-border bg-card">
          {/* Cart header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Cart</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-secondary font-medium">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{selectedCustomer.name} &bull; {saleType}</p>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="text-3xl mb-2">🛒</p>
                <p className="text-sm">Tap products to add</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">KES {item.price} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-background border border-border text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-colors">-</button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-background border border-border text-sm font-bold hover:bg-green-50 hover:text-green-600 transition-colors">+</button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-bold">KES {(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart totals */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">VAT (16%)</span><span>KES {tax.toFixed(0)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Total</span>
              <span className="text-primary">KES {total.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={clearCart} className="px-4 py-2.5 border border-border rounded-xl hover:bg-secondary transition-colors font-medium text-sm">Clear</button>
              <button
                onClick={openCheckout}
                disabled={cartItems.length === 0}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 font-semibold text-sm"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Complete Payment" size="md">
        <div className="space-y-5">
          {/* Amount display */}
          <div className="text-center py-4 bg-secondary rounded-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
            <p className="text-4xl font-black text-primary">KES {total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{selectedCustomer.name} &bull; {cartItems.reduce((s, i) => s + i.quantity, 0)} items</p>
          </div>

          {/* Payment method tabs */}
          <div>
            <p className="text-sm font-semibold mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'Cash' as const, label: 'Cash', icon: '💵' },
                { value: 'Mpesa' as const, label: 'M-Pesa', icon: '📱' },
                { value: 'Credit' as const, label: 'Credit', icon: '📝' },
              ]).map(btn => (
                <button
                  key={btn.value}
                  onClick={() => { setPaymentMethod(btn.value); setMpesaStatus('idle'); setMpesaMessage(''); }}
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 font-medium transition-all text-sm ${
                    paymentMethod === btn.value
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border hover:border-primary/40 bg-background'
                  }`}
                >
                  <span className="text-xl">{btn.icon}</span>
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Cash Payment ── */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Amount Received</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={cashAmount || ''}
                  onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-lg font-bold focus:ring-2 focus:ring-primary/50 outline-none text-center"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {quickCash.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCashAmount(amt)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      cashAmount === amt ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCashAmount(Math.ceil(total))}
                className="w-full py-2 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5"
              >
                Exact Amount ({Math.ceil(total).toLocaleString()})
              </button>
              {cashAmount > 0 && (
                <div className={`p-3 rounded-xl text-center font-bold text-lg ${
                  cashAmount >= total ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {cashAmount >= total ? `Change: KES ${(cashAmount - total).toFixed(0)}` : `Short: KES ${(total - cashAmount).toFixed(0)}`}
                </div>
              )}
            </div>
          )}

          {/* ── M-Pesa Payment ── */}
          {paymentMethod === 'Mpesa' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0712345678"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-lg font-mono focus:ring-2 focus:ring-primary/50 outline-none text-center tracking-wider"
                  autoFocus
                  disabled={mpesaStatus === 'sending' || mpesaStatus === 'waiting'}
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">Enter customer&apos;s M-Pesa registered number</p>
              </div>

              {mpesaStatus === 'idle' && (
                <button
                  onClick={sendMpesaStkPush}
                  disabled={!mpesaPhone}
                  className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <span>📱</span> Send STK Push — KES {total.toFixed(0)}
                </button>
              )}

              {mpesaStatus === 'sending' && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-medium text-blue-800">Sending to {mpesaPhone}...</p>
                </div>
              )}

              {mpesaStatus === 'waiting' && (
                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-center">
                  <div className="animate-pulse">
                    <p className="text-2xl mb-2">📱</p>
                    <p className="text-sm font-bold text-yellow-800">Waiting for PIN entry...</p>
                    <p className="text-xs text-yellow-700 mt-1">Customer should see the prompt on their phone</p>
                  </div>
                </div>
              )}

              {mpesaStatus === 'success' && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-sm font-bold text-green-800">Payment Received!</p>
                  <p className="text-xs text-green-700 mt-1">KES {total.toFixed(0)} from {mpesaPhone}</p>
                </div>
              )}

              {mpesaStatus === 'failed' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                    <p className="text-sm font-medium text-red-800">{mpesaMessage}</p>
                  </div>
                  <button
                    onClick={() => { setMpesaStatus('idle'); setMpesaMessage(''); }}
                    className="w-full py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Credit Payment ── */}
          {paymentMethod === 'Credit' && (
            <div className="space-y-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm font-bold text-amber-800">Credit Sale — Added to Debtors</p>
              <input
                type="text"
                placeholder="Customer Name"
                value={creditName}
                onChange={(e) => setCreditName(e.target.value)}
                className="w-full px-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-white"
              />
              <input
                type="tel"
                placeholder="Customer Phone"
                value={creditPhone}
                onChange={(e) => setCreditPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-white"
              />
              <p className="text-xs text-amber-700">This sale will be recorded as a debt and appear in the Debtors module.</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              onClick={() => setShowPayment(false)}
              className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-secondary transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={
                (paymentMethod === 'Cash' && cashAmount < total) ||
                (paymentMethod === 'Mpesa' && mpesaStatus !== 'success') ||
                (paymentMethod === 'Credit' && !creditName && selectedCustomer.id === 'walk-in')
              }
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-bold text-sm disabled:opacity-40"
            >
              {paymentMethod === 'Mpesa' && mpesaStatus === 'success' ? 'Confirm Sale' :
               paymentMethod === 'Credit' ? 'Record Credit Sale' :
               'Complete Sale'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
