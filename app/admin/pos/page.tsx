'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface CartItem { id: string; name: string; sku: string; price: number; quantity: number; stock: number; }
interface Product { id: string; name: string; sku: string; retailPrice: number; wholesalePrice: number; stock: number; category: string; }
interface Customer { id: string; name: string; phone: string; type: string; }
interface HeldOrder { id: string; name: string; items: CartItem[]; customer: Customer; saleType: string; time: string; }
interface ReceiptData { receiptNo: string; date: string; cashier: string; customer: string; items: CartItem[]; subtotal: number; tax: number; total: number; paid: number; change: number; method: string; mpesaRef?: string; }
interface ReceiptSettings { headerText: string; subHeaderText: string; footerText: string; disclaimer: string; showLogo: boolean; showTax: boolean; showCashier: boolean; showCustomer: boolean; showPaymentDetails: boolean; }
interface PaymentDetailsSettings { mpesaType: 'paybill' | 'till'; paybillNumber: string; accountNumber: string; tillNumber: string; mpesaName: string; showOnReceipt: boolean; bankName: string; bankAccount: string; bankBranch: string; }
interface GeneralSettings { businessName: string; phone: string; address: string; currency: string; taxRate: number; logoUrl: string; }

type PaymentMethod = 'Cash' | 'Mpesa' | 'Credit';
type MpesaStatus = 'idle' | 'sending' | 'waiting' | 'success' | 'failed';

function loadSettings() {
  try {
    const saved = localStorage.getItem('snackoh_settings');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

export default function POSPage() {
  // ── Auth (login disabled — anyone can use POS) ──
  const [loggedCashier] = useState('Cashier');

  // ── Opening / Closing Balance ──
  const [showOpeningBalance, setShowOpeningBalance] = useState(true);
  const [showClosingBalance, setShowClosingBalance] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [openingBalanceInput, setOpeningBalanceInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [shiftStarted, setShiftStarted] = useState(false);

  // ── Settings ──
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    headerText: 'SNACKOH BITES', subHeaderText: 'Quality Baked Goods', footerText: 'Thank you for choosing Snackoh!',
    disclaimer: 'Goods once sold are not returnable', showLogo: true, showTax: true, showCashier: true, showCustomer: true, showPaymentDetails: true,
  });
  const [paymentDetailsSettings, setPaymentDetailsSettings] = useState<PaymentDetailsSettings>({
    mpesaType: 'paybill', paybillNumber: '', accountNumber: '', tillNumber: '', mpesaName: 'SNACKOH BITES', showOnReceipt: true,
    bankName: '', bankAccount: '', bankBranch: '',
  });
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    businessName: 'SNACKOH BITES', phone: '+254 700 000 000', address: 'Nairobi, Kenya', currency: 'KES', taxRate: 16, logoUrl: '',
  });

  useEffect(() => {
    async function loadSettingsFromDb() {
      // Try loading from database first
      try {
        const { data, error } = await supabase.from('business_settings').select('key, value');
        if (!error && data && data.length > 0) {
          const dbSettings: Record<string, unknown> = {};
          for (const row of data) dbSettings[row.key] = row.value;
          if (dbSettings.receipt) setReceiptSettings(prev => ({ ...prev, ...(dbSettings.receipt as Record<string, unknown>) }));
          if (dbSettings.paymentDetails) setPaymentDetailsSettings(prev => ({ ...prev, ...(dbSettings.paymentDetails as Record<string, unknown>) }));
          if (dbSettings.general) {
            const g = dbSettings.general as Record<string, unknown>;
            setGeneralSettings(prev => ({
              businessName: (g.businessName as string) || prev.businessName,
              phone: (g.phone as string) || prev.phone,
              address: (g.address as string) || prev.address,
              currency: (g.currency as string) || prev.currency,
              taxRate: (g.taxRate as number) ?? prev.taxRate,
              logoUrl: (g.logoUrl as string) || prev.logoUrl,
            }));
          }
          return;
        }
      } catch {
        // Table may not exist yet
      }
      // Fallback to localStorage
      const s = loadSettings();
      if (s) {
        if (s.receipt) setReceiptSettings(prev => ({ ...prev, ...s.receipt }));
        if (s.paymentDetails) setPaymentDetailsSettings(prev => ({ ...prev, ...s.paymentDetails }));
        if (s.general) setGeneralSettings(prev => ({
          businessName: s.general.businessName || prev.businessName,
          phone: s.general.phone || prev.phone,
          address: s.general.address || prev.address,
          currency: s.general.currency || prev.currency,
          taxRate: s.general.taxRate ?? prev.taxRate,
          logoUrl: s.general.logoUrl || prev.logoUrl,
        }));
      }
    }
    loadSettingsFromDb();
  }, []);

  // ── Sales Totals ──
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);

  // ── Products ──
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 'walk-in', name: 'Walk-in Customer', phone: '', type: 'Retail' },
  ]);

  // ── Cart ──
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // ── Held Orders ──
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeld, setShowHeld] = useState(false);

  // ── Payment ──
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>('idle');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState('');
  const [creditName, setCreditName] = useState('');
  const [creditPhone, setCreditPhone] = useState('');
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Receipt ──
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // ── Fetch products from inventory / pricing ──
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('pricing_tiers').select('*').eq('active', true);
    if (data && data.length > 0) {
      setProducts(data.map((r: Record<string, unknown>) => ({
        id: r.id as string, name: (r.product_name || '') as string, sku: (r.product_code || '') as string,
        retailPrice: (r.retail_price || 0) as number, wholesalePrice: (r.wholesale_price || 0) as number,
        stock: 999, category: 'Products',
      })));
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase.from('customers').select('*').eq('status', 'Active').order('name');
    if (data && data.length > 0) {
      const mapped = data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, phone: (r.phone || '') as string, type: (r.type || 'Retail') as string }));
      setCustomers([{ id: 'walk-in', name: 'Walk-in Customer', phone: '', type: 'Retail' }, ...mapped]);
    }
  }, []);

  useEffect(() => { fetchProducts(); fetchCustomers(); }, [fetchProducts, fetchCustomers]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, []);

  // Totals
  const taxRate = generalSettings.taxRate / 100;
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const categories = [...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const match = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const cat = filterCategory === 'All' || p.category === filterCategory;
    return match && cat;
  });

  // ── Cart ──
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const price = saleType === 'Retail' ? product.retailPrice : product.wholesalePrice;
    const existing = cartItems.find(i => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      setCartItems(cartItems.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCartItems([...cartItems, { id: product.id, name: product.name, sku: product.sku, price, quantity: 1, stock: product.stock }]);
    }
  };
  const updateQty = (id: string, qty: number) => { if (qty <= 0) setCartItems(cartItems.filter(i => i.id !== id)); else setCartItems(cartItems.map(i => i.id === id ? { ...i, quantity: Math.min(qty, i.stock) } : i)); };
  const removeItem = (id: string) => setCartItems(cartItems.filter(i => i.id !== id));
  const clearCart = () => { if (cartItems.length > 0 && confirm('Clear cart?')) setCartItems([]); };

  // ── Hold/Recall ──
  const holdOrder = () => {
    if (cartItems.length === 0) return;
    const held: HeldOrder = { id: Date.now().toString(), name: selectedCustomer.name, items: [...cartItems], customer: selectedCustomer, saleType, time: new Date().toLocaleTimeString() };
    setHeldOrders([...heldOrders, held]);
    setCartItems([]);
  };
  const recallOrder = (held: HeldOrder) => {
    setCartItems(held.items);
    setSelectedCustomer(held.customer);
    setSaleType(held.saleType as 'Retail' | 'Wholesale');
    setHeldOrders(heldOrders.filter(h => h.id !== held.id));
    setShowHeld(false);
  };
  const deleteHeld = (id: string) => setHeldOrders(heldOrders.filter(h => h.id !== id));

  // ── Customer ──
  const handleCustomerChange = (cid: string) => {
    const c = customers.find(x => x.id === cid) || customers[0];
    setSelectedCustomer(c);
    if (c.phone) setMpesaPhone(c.phone);
    if (c.type === 'Wholesale') setSaleType('Wholesale');
  };

  // ── M-Pesa ──
  const pollMpesaStatus = useCallback((checkoutId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 * 3s = 90s max
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts >= maxAttempts) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setMpesaStatus('failed');
        setMpesaMessage('Payment timed out. Please try again.');
        return;
      }
      try {
        const res = await fetch('/api/mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'query', checkoutRequestId: checkoutId }),
        });
        const data = await res.json();
        if (data.status === 'completed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setMpesaStatus('success');
          setMpesaMessage(`KES ${total.toFixed(0)} received via M-Pesa`);
        } else if (data.status === 'cancelled' || data.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setMpesaStatus('failed');
          setMpesaMessage(data.message || 'Payment was cancelled or failed');
        }
      } catch { /* continue polling */ }
    }, 3000);
  }, [total]);

  const sendMpesaStkPush = async () => {
    if (!mpesaPhone) { setMpesaMessage('Enter M-Pesa phone number'); return; }
    setMpesaStatus('sending');
    setMpesaMessage('Sending STK push to ' + mpesaPhone + '...');
    try {
      const res = await fetch('/api/mpesa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: Math.ceil(total),
          accountReference: `SNACKOH-${Date.now()}`,
          description: `Snackoh POS - ${selectedCustomer.name}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMpesaCheckoutId(data.checkoutRequestId);
        setMpesaStatus('waiting');
        setMpesaMessage('STK sent! Enter your M-Pesa PIN on your phone...');
        pollMpesaStatus(data.checkoutRequestId);
      } else {
        setMpesaStatus('failed');
        setMpesaMessage(data.message || 'STK push failed');
      }
    } catch {
      setMpesaStatus('failed');
      setMpesaMessage('Network error — check your connection');
    }
  };

  // ── Generate receipt number ──
  const genReceiptNo = () => `SNK-${Date.now().toString(36).toUpperCase()}`;

  // ── Complete Sale ──
  const completeSale = async (method: string, paid: number, change: number, mpesaRef?: string) => {
    const rNo = genReceiptNo();
    const receipt: ReceiptData = { receiptNo: rNo, date: new Date().toLocaleString(), cashier: loggedCashier, customer: selectedCustomer.name, items: [...cartItems], subtotal, tax, total, paid, change, method, mpesaRef };
    try {
      await supabase.from('pos_sales').insert({
        receipt_number: rNo, customer_name: selectedCustomer.name, sale_type: saleType,
        payment_method: method, mpesa_reference: mpesaRef || null, mpesa_phone: method === 'M-Pesa' ? mpesaPhone : null,
        subtotal, tax, total, amount_paid: paid, change_amount: change, cashier_name: loggedCashier, status: 'Completed',
      });
    } catch { /* continue */ }
    setProducts(products.map(p => { const ci = cartItems.find(i => i.id === p.id); return ci ? { ...p, stock: Math.max(0, p.stock - ci.quantity) } : p; }));
    setTotalSalesCount(prev => prev + 1);
    setTotalSalesAmount(prev => prev + total);
    setReceiptData(receipt);
    setShowPayment(false);
    setShowReceipt(true);
    setCartItems([]);
    setCashAmount(0);
    setMpesaPhone('');
    setMpesaStatus('idle');
    setMpesaCheckoutId('');
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setPaymentMethod('Cash');
  };

  const handlePayment = () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'Cash') {
      if (cashAmount < total) return;
      completeSale('Cash', cashAmount, cashAmount - total);
    } else if (paymentMethod === 'Mpesa') {
      if (mpesaStatus === 'success') completeSale('M-Pesa', total, 0, mpesaCheckoutId || 'MPesa-Auto');
    } else if (paymentMethod === 'Credit') {
      const name = creditName || selectedCustomer.name;
      if (!name || name === 'Walk-in Customer') { alert('Select or enter customer for credit'); return; }
      completeSale('Credit', 0, 0);
    }
  };

  const openCheckout = () => {
    if (cartItems.length === 0) return;
    setPaymentMethod('Cash'); setCashAmount(0); setMpesaPhone(selectedCustomer.phone || ''); setMpesaStatus('idle'); setMpesaMessage('');
    setCreditName(selectedCustomer.id !== 'walk-in' ? selectedCustomer.name : ''); setCreditPhone(selectedCustomer.phone || '');
    setShowPayment(true);
  };

  // ── Print Receipt ──
  const printReceipt = () => {
    if (!receiptRef.current) return;
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    win.document.write(`<html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:12px;padding:10px;max-width:300px;margin:0 auto}h2,h3{text-align:center;margin:4px 0}hr{border:none;border-top:1px dashed #333;margin:8px 0}.row{display:flex;justify-content:space-between}.total{font-size:14px;font-weight:bold}.center{text-align:center}</style></head><body>`);
    win.document.write(receiptRef.current.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
  };

  const quickCash = [100, 200, 500, 1000, 2000, 5000];

  const cur = generalSettings.currency;

  // ── POS VIEW ──
  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-background">
      {/* Top Bar */}
      <div className="px-4 py-2 border-b border-border bg-card flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold text-primary">SNACKOH POS</span>
          <span className="text-xs text-muted-foreground">Cashier: <strong>{loggedCashier}</strong></span>
          <span className="text-xs text-muted-foreground">Opening: {cur} {openingBalance.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">Sales: {totalSalesCount} | {cur} {totalSalesAmount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedCustomer.id} onChange={(e) => handleCustomerChange(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/50 outline-none bg-background min-w-[160px]">
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['Retail', 'Wholesale'] as const).map(t => (
              <button key={t} onClick={() => setSaleType(t)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${saleType === t ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'}`}>{t}</button>
            ))}
          </div>
          <button onClick={holdOrder} disabled={cartItems.length === 0} className="px-3 py-1.5 text-xs border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 font-medium disabled:opacity-40">Hold</button>
          <button onClick={() => setShowHeld(true)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-secondary font-medium relative">
            Recall {heldOrders.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center">{heldOrders.length}</span>}
          </button>
          <button onClick={() => setShowClosingBalance(true)} className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium">End Shift</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Products */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          <div className="flex gap-2 mb-3">
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none bg-card text-sm" />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none bg-card text-sm">{['All', ...categories].map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {filteredProducts.map(p => {
                const price = saleType === 'Retail' ? p.retailPrice : p.wholesalePrice;
                const inCart = cartItems.find(i => i.id === p.id);
                const outOfStock = p.stock <= 0;
                return (
                  <button key={p.id} onClick={() => addToCart(p)} disabled={outOfStock} className={`relative p-3 border rounded-xl text-left transition-all ${outOfStock ? 'opacity-40 cursor-not-allowed bg-gray-50' : inCart ? 'border-primary bg-primary/5 shadow' : 'border-border bg-card hover:border-primary/50 hover:shadow'}`}>
                    {inCart && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow">{inCart.quantity}</span>}
                    {outOfStock && <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">SOLD OUT</span>}
                    <p className="font-semibold text-xs mb-0.5 truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.sku}</p>
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-sm font-bold text-primary">{cur} {price}</span>
                      <span className="text-[10px] text-muted-foreground">{p.stock} left</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="w-[320px] flex flex-col border-l border-border bg-card">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between"><h2 className="font-bold text-sm">Cart</h2><span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-medium">{cartItems.reduce((s, i) => s + i.quantity, 0)} items</span></div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{selectedCustomer.name} &bull; {saleType}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><p className="text-2xl mb-1">🛒</p><p className="text-xs">Tap products to add</p></div>
            ) : cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                <div className="flex-1 min-w-0"><p className="font-medium text-xs truncate">{item.name}</p><p className="text-[10px] text-muted-foreground">{cur} {item.price} x {item.quantity}</p></div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded bg-background border border-border text-xs font-bold hover:bg-red-50">-</button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 rounded bg-background border border-border text-xs font-bold hover:bg-green-50">+</button>
                </div>
                <div className="text-right min-w-[50px]">
                  <p className="text-xs font-bold">{cur} {(item.price * item.quantity).toLocaleString()}</p>
                  <button onClick={() => removeItem(item.id)} className="text-[10px] text-red-500 hover:text-red-700">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span>{cur} {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">VAT ({generalSettings.taxRate}%)</span><span>{cur} {tax.toFixed(0)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-1.5"><span>Total</span><span className="text-primary">{cur} {total.toLocaleString()}</span></div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={clearCart} className="px-3 py-2 border border-border rounded-xl hover:bg-secondary text-xs font-medium">Clear</button>
              <button onClick={openCheckout} disabled={cartItems.length === 0} className="px-3 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 font-bold text-xs">Checkout</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Held Orders Modal ── */}
      <Modal isOpen={showHeld} onClose={() => setShowHeld(false)} title={`Held Orders (${heldOrders.length})`} size="md">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {heldOrders.length === 0 ? <p className="text-center text-muted-foreground text-sm py-8">No held orders</p> : heldOrders.map(h => (
            <div key={h.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div><p className="text-sm font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{h.items.length} items &bull; {h.saleType} &bull; {h.time}</p></div>
              <div className="flex gap-2"><button onClick={() => recallOrder(h)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Recall</button><button onClick={() => deleteHeld(h.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button></div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Payment Modal ── */}
      <Modal isOpen={showPayment} onClose={() => { setShowPayment(false); if (pollTimerRef.current) clearInterval(pollTimerRef.current); }} title="Complete Payment" size="md">
        <div className="space-y-4">
          <div className="text-center py-3 bg-secondary rounded-xl">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-3xl font-black text-primary">{cur} {total.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{selectedCustomer.name} &bull; {cartItems.reduce((s, i) => s + i.quantity, 0)} items &bull; {loggedCashier}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([{ v: 'Cash' as const, l: 'Cash', i: '💵' }, { v: 'Mpesa' as const, l: 'M-Pesa', i: '📱' }, { v: 'Credit' as const, l: 'Credit', i: '📝' }]).map(b => (
              <button key={b.v} onClick={() => { setPaymentMethod(b.v); setMpesaStatus('idle'); if (pollTimerRef.current) clearInterval(pollTimerRef.current); }} className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${paymentMethod === b.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}><span className="text-lg">{b.i}</span>{b.l}</button>
            ))}
          </div>
          {paymentMethod === 'Cash' && (
            <div className="space-y-2">
              <input type="number" placeholder="Amount received" value={cashAmount || ''} onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 border border-border rounded-xl text-lg font-bold focus:ring-2 focus:ring-primary/50 outline-none text-center" autoFocus />
              <div className="grid grid-cols-3 gap-1.5">{quickCash.map(a => (<button key={a} onClick={() => setCashAmount(a)} className={`py-1.5 rounded-lg border text-xs font-medium ${cashAmount === a ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'}`}>{a.toLocaleString()}</button>))}</div>
              <button onClick={() => setCashAmount(Math.ceil(total))} className="w-full py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5">Exact ({Math.ceil(total).toLocaleString()})</button>
              {cashAmount > 0 && <div className={`p-2 rounded-xl text-center font-bold text-sm ${cashAmount >= total ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{cashAmount >= total ? `Change: ${cur} ${(cashAmount - total).toFixed(0)}` : `Short: ${cur} ${(total - cashAmount).toFixed(0)}`}</div>}
            </div>
          )}
          {paymentMethod === 'Mpesa' && (
            <div className="space-y-2">
              <input type="tel" placeholder="0712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} className="w-full px-4 py-3 border border-border rounded-xl text-lg font-mono focus:ring-2 focus:ring-primary/50 outline-none text-center tracking-wider" autoFocus disabled={mpesaStatus === 'sending' || mpesaStatus === 'waiting'} />
              {mpesaStatus === 'idle' && <button onClick={sendMpesaStkPush} disabled={!mpesaPhone} className="w-full py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-xs disabled:opacity-40">📱 Send STK Push — {cur} {total.toFixed(0)}</button>}
              {mpesaStatus === 'sending' && <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center"><div className="animate-spin w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-1"></div><p className="text-xs text-blue-800">Sending...</p></div>}
              {mpesaStatus === 'waiting' && <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center animate-pulse"><p className="text-lg">📱</p><p className="text-xs font-bold text-yellow-800">{mpesaMessage}</p></div>}
              {mpesaStatus === 'success' && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center"><p className="text-lg">✅</p><p className="text-xs font-bold text-green-800">Payment Received!</p></div>}
              {mpesaStatus === 'failed' && <><div className="p-2 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-800">{mpesaMessage}</div><button onClick={() => { setMpesaStatus('idle'); if (pollTimerRef.current) clearInterval(pollTimerRef.current); }} className="w-full py-1.5 border border-border rounded-xl text-xs hover:bg-secondary">Retry</button></>}
            </div>
          )}
          {paymentMethod === 'Credit' && (
            <div className="space-y-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs font-bold text-amber-800">Credit Sale — Debtor Record</p>
              <input type="text" placeholder="Customer Name" value={creditName} onChange={(e) => setCreditName(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white" />
              <input type="tel" placeholder="Phone" value={creditPhone} onChange={(e) => setCreditPhone(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white" />
            </div>
          )}
          <div className="flex gap-2 pt-2 border-t border-border">
            <button onClick={() => { setShowPayment(false); if (pollTimerRef.current) clearInterval(pollTimerRef.current); }} className="flex-1 px-3 py-2.5 border border-border rounded-xl hover:bg-secondary text-xs font-medium">Cancel</button>
            <button onClick={handlePayment} disabled={(paymentMethod === 'Cash' && cashAmount < total) || (paymentMethod === 'Mpesa' && mpesaStatus !== 'success') || (paymentMethod === 'Credit' && !creditName && selectedCustomer.id === 'walk-in')} className="flex-1 px-3 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 font-bold text-xs disabled:opacity-40">
              {paymentMethod === 'Mpesa' && mpesaStatus === 'success' ? 'Confirm' : paymentMethod === 'Credit' ? 'Record Credit' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Receipt Modal (Dynamic from Settings) ── */}
      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Sale Complete" size="sm">
        <div className="space-y-3">
          <div ref={receiptRef} className="bg-white p-4 rounded-lg border border-border text-xs font-mono">
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              {receiptSettings.showLogo !== false && generalSettings.logoUrl && (
                <img src={generalSettings.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
              )}
              <h2 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>{receiptSettings.headerText}</h2>
              <p style={{ margin: '2px 0', fontSize: '10px' }}>{receiptSettings.subHeaderText}</p>
              <p style={{ margin: '2px 0', fontSize: '10px' }}>Tel: {generalSettings.phone}</p>
              {generalSettings.address && <p style={{ margin: '2px 0', fontSize: '10px' }}>{generalSettings.address}</p>}
              <hr style={{ border: 'none', borderTop: '1px dashed #333', margin: '8px 0' }} />
              <p style={{ margin: '0', fontSize: '10px' }}>Receipt: {receiptData?.receiptNo}</p>
              <p style={{ margin: '2px 0', fontSize: '10px' }}>{receiptData?.date}</p>
              {receiptSettings.showCashier && <p style={{ margin: '2px 0', fontSize: '10px' }}>Cashier: {receiptData?.cashier}</p>}
              {receiptSettings.showCustomer && <p style={{ margin: '2px 0', fontSize: '10px' }}>Customer: {receiptData?.customer}</p>}
            </div>
            <hr style={{ border: 'none', borderTop: '1px dashed #333', margin: '8px 0' }} />
            <table style={{ width: '100%', fontSize: '10px' }}>
              <thead><tr style={{ borderBottom: '1px solid #ccc' }}><th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {receiptData?.items.map((item, idx) => (
                  <tr key={idx}><td style={{ padding: '2px 0' }}>{item.name}</td><td style={{ textAlign: 'center' }}>{item.quantity}</td><td style={{ textAlign: 'right' }}>{item.price}</td><td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
            <hr style={{ border: 'none', borderTop: '1px dashed #333', margin: '8px 0' }} />
            <div style={{ fontSize: '10px' }}>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>{cur} {receiptData?.subtotal.toLocaleString()}</span></div>
              {receiptSettings.showTax && <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT ({generalSettings.taxRate}%):</span><span>{cur} {receiptData?.tax.toFixed(0)}</span></div>}
              <div className="row total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}><span>TOTAL:</span><span>{cur} {receiptData?.total.toLocaleString()}</span></div>
              <hr style={{ border: 'none', borderTop: '1px dashed #333', margin: '8px 0' }} />
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid ({receiptData?.method}):</span><span>{cur} {receiptData?.paid.toLocaleString()}</span></div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Change:</span><span>{cur} {receiptData?.change.toFixed(0)}</span></div>
              {receiptData?.mpesaRef && <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}><span>M-Pesa Ref:</span><span>{receiptData.mpesaRef}</span></div>}
            </div>
            {/* Payment Details from Settings */}
            {receiptSettings.showPaymentDetails && paymentDetailsSettings.showOnReceipt && (paymentDetailsSettings.paybillNumber || paymentDetailsSettings.tillNumber || paymentDetailsSettings.bankName) && (
              <>
                <hr style={{ border: 'none', borderTop: '1px dashed #333', margin: '8px 0' }} />
                <div style={{ textAlign: 'center', fontSize: '10px' }}>
                  <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Payment Info:</p>
                  {paymentDetailsSettings.mpesaType === 'paybill' && paymentDetailsSettings.paybillNumber && (
                    <>
                      <p style={{ margin: '2px 0' }}>M-Pesa Paybill: {paymentDetailsSettings.paybillNumber}</p>
                      {paymentDetailsSettings.accountNumber && <p style={{ margin: '2px 0' }}>Account: {paymentDetailsSettings.accountNumber}</p>}
                    </>
                  )}
                  {paymentDetailsSettings.mpesaType === 'till' && paymentDetailsSettings.tillNumber && (
                    <p style={{ margin: '2px 0' }}>M-Pesa Till: {paymentDetailsSettings.tillNumber}</p>
                  )}
                  {paymentDetailsSettings.mpesaName && <p style={{ margin: '2px 0' }}>Name: {paymentDetailsSettings.mpesaName}</p>}
                  {paymentDetailsSettings.bankName && (
                    <>
                      <p style={{ margin: '4px 0 2px', fontWeight: 'bold' }}>Bank Transfer:</p>
                      <p style={{ margin: '2px 0' }}>{paymentDetailsSettings.bankName}</p>
                      {paymentDetailsSettings.bankAccount && <p style={{ margin: '2px 0' }}>A/C: {paymentDetailsSettings.bankAccount}</p>}
                      {paymentDetailsSettings.bankBranch && <p style={{ margin: '2px 0' }}>Branch: {paymentDetailsSettings.bankBranch}</p>}
                    </>
                  )}
                </div>
              </>
            )}
            <hr style={{ border: 'none', borderTop: '1px dashed #333', margin: '8px 0' }} />
            <div style={{ textAlign: 'center', fontSize: '10px' }}>
              <p style={{ margin: '2px 0' }}>{receiptSettings.footerText}</p>
              <p style={{ margin: '2px 0' }}>{receiptSettings.disclaimer}</p>
              <p style={{ margin: '4px 0', fontWeight: 'bold' }}>*** {receiptSettings.headerText} ***</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={printReceipt} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 font-bold text-sm">🖨️ Print Receipt</button>
            <button onClick={() => setShowReceipt(false)} className="flex-1 px-4 py-2.5 border border-border rounded-xl hover:bg-secondary text-sm font-medium">New Sale</button>
          </div>
        </div>
      </Modal>

      {/* ── Opening Balance Modal ── */}
      <Modal isOpen={showOpeningBalance && !shiftStarted} onClose={() => {}} title="Start Shift — Opening Balance" size="sm">
        <div className="space-y-4">
          <div className="text-center py-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-600 uppercase tracking-wider font-medium">Cashier Desk</p>
            <p className="text-sm text-blue-800 mt-1">Enter the opening cash balance to begin your shift</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Opening Cash Balance ({cur})</label>
            <input
              type="number"
              step="0.01"
              value={openingBalanceInput}
              onChange={(e) => setOpeningBalanceInput(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl text-lg font-bold focus:ring-2 focus:ring-primary/50 outline-none text-center"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <button
            onClick={() => {
              const bal = parseFloat(openingBalanceInput) || 0;
              setOpeningBalance(bal);
              setShiftStarted(true);
              setShowOpeningBalance(false);
            }}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 font-bold text-sm"
          >
            Start Shift
          </button>
        </div>
      </Modal>

      {/* ── Closing Balance Modal ── */}
      <Modal isOpen={showClosingBalance} onClose={() => setShowClosingBalance(false)} title="End Shift — Closing Balance" size="md">
        <div className="space-y-4">
          <div className="text-center py-3 bg-red-50 rounded-xl border border-red-200">
            <p className="text-xs text-red-600 uppercase tracking-wider font-medium">Shift Summary</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground">Opening Balance</p>
              <p className="text-lg font-bold">{cur} {openingBalance.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground">Total Sales</p>
              <p className="text-lg font-bold text-green-600">{cur} {totalSalesAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground">Sales Count</p>
              <p className="text-lg font-bold">{totalSalesCount}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">Expected Closing</p>
              <p className="text-lg font-bold text-primary">{cur} {(openingBalance + totalSalesAmount).toLocaleString()}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notes (optional)</label>
            <textarea
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              rows={2}
              placeholder="Any discrepancies or notes..."
            />
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <button onClick={() => setShowClosingBalance(false)} className="flex-1 px-3 py-2.5 border border-border rounded-xl hover:bg-secondary text-xs font-medium">Cancel</button>
            <button
              onClick={async () => {
                try {
                  await supabase.from('pos_sales').insert({
                    receipt_number: `SHIFT-${Date.now().toString(36).toUpperCase()}`,
                    customer_name: 'SHIFT CLOSE',
                    sale_type: 'Shift',
                    payment_method: 'N/A',
                    subtotal: 0,
                    tax: 0,
                    total: 0,
                    amount_paid: 0,
                    change_amount: 0,
                    cashier_name: loggedCashier,
                    status: 'Shift Close',
                    mpesa_reference: JSON.stringify({
                      openingBalance,
                      totalSales: totalSalesAmount,
                      salesCount: totalSalesCount,
                      expectedClosing: openingBalance + totalSalesAmount,
                      notes: closingNotes,
                    }),
                  });
                } catch { /* continue */ }
                setCartItems([]);
                setTotalSalesCount(0);
                setTotalSalesAmount(0);
                setShowClosingBalance(false);
                setShiftStarted(false);
                setShowOpeningBalance(true);
                setOpeningBalanceInput('');
                setOpeningBalance(0);
                setClosingNotes('');
              }}
              className="flex-1 px-3 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-xs"
            >
              Confirm &amp; End Shift
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
