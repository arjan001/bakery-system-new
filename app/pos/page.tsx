'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  saleType: 'Retail' | 'Wholesale';
}

interface Cart {
  items: POSItem[];
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

type PaymentMethod = 'Cash' | 'Mpesa' | 'Card' | 'Credit';

interface Payment {
  method: PaymentMethod;
  amountPaid: number;
  referenceNo?: string;
  customerName?: string;
  customerPhone?: string;
}

export default function POSPage() {
  const [cart, setCart] = useState<Cart>({ items: [], saleType: 'Retail' });
  const [products] = useState<Product[]>([
    { id: '1', name: 'White Bread', sku: 'WB001', retailPrice: 200, wholesalePrice: 150, stock: 50, category: 'Bread' },
    { id: '2', name: 'Croissant', sku: 'CR001', retailPrice: 150, wholesalePrice: 100, stock: 30, category: 'Pastry' },
    { id: '3', name: 'Chocolate Cake', sku: 'CC001', retailPrice: 500, wholesalePrice: 400, stock: 20, category: 'Cake' },
    { id: '4', name: 'Donut', sku: 'DN001', retailPrice: 50, wholesalePrice: 35, stock: 100, category: 'Pastry' },
    { id: '5', name: 'Bagel', sku: 'BG001', retailPrice: 100, wholesalePrice: 75, stock: 40, category: 'Bread' },
    { id: '6', name: 'Muffin', sku: 'MF001', retailPrice: 120, wholesalePrice: 90, stock: 25, category: 'Cake' },
  ]);

  const [showPayment, setShowPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [payment, setPayment] = useState<Payment>({ method: 'Cash', amountPaid: 0 });

  const saveDebtor = (record: any) => {
    if (typeof window === 'undefined') return;
    const existing = window.localStorage.getItem('debtors');
    const list = existing ? JSON.parse(existing) : [];
    window.localStorage.setItem('debtors', JSON.stringify([...list, record]));
  };

  const addToCart = (product: Product) => {
    const price = cart.saleType === 'Retail' ? product.retailPrice : product.wholesalePrice;
    const existingItem = cart.items.find(item => item.id === product.id && item.saleType === cart.saleType);

    if (existingItem) {
      setCart({
        ...cart,
        items: cart.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      setCart({
        ...cart,
        items: [...cart.items, {
          id: product.id,
          name: product.name,
          price,
          quantity: 1,
          saleType: cart.saleType,
        }],
      });
    }
  };

  const removeFromCart = (id: string) => {
    setCart({
      ...cart,
      items: cart.items.filter(item => item.id !== id),
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart({
        ...cart,
        items: cart.items.map(item =>
          item.id === id
            ? { ...item, quantity }
            : item
        ),
      });
    }
  };

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetPOS = () => {
    setCart({ items: [], saleType: 'Retail' });
    setPayment({ method: 'Cash', amountPaid: 0 });
    setShowPayment(false);
  };

  const handlePayment = () => {
    if (cart.items.length === 0) return;

    if (payment.method === 'Credit') {
      if (!payment.customerName || !payment.customerPhone) {
        alert('Please enter customer name and phone for credit sales');
        return;
      }

      const debtorRecord = {
        id: Date.now().toString(),
        name: payment.customerName,
        phone: payment.customerPhone,
        amount: total,
        date: new Date().toLocaleDateString(),
        status: 'Pending',
        items: cart.items,
      };

      saveDebtor(debtorRecord);
      alert(`Credit Sale Recorded!\nCustomer: ${payment.customerName}\nAmount: ${total.toFixed(2)}\nThis will appear in the Debtors module.`);
      resetPOS();
      return;
    }

    if (payment.amountPaid < total) {
      alert('Insufficient payment amount');
      return;
    }

    const change = payment.amountPaid - total;
    alert(
      `Sale Completed!\n` +
      `Method: ${payment.method === 'Mpesa' ? 'M-Pesa' : payment.method}\n` +
      `Total: ${total.toFixed(2)}\n` +
      `Change: ${change.toFixed(2)}`
    );
    resetPOS();
  };

  const clearCart = () => {
    if (cart.items.length > 0 && confirm('Clear the cart?')) {
      setCart({ items: [], saleType: 'Retail' });
    }
  };

  const paymentButtons: { label: string; value: PaymentMethod }[] = [
    { label: 'Cash', value: 'Cash' },
    { label: 'M-Pesa', value: 'Mpesa' },
    { label: 'Card', value: 'Card' },
    { label: 'Credit', value: 'Credit' },
  ];

  return (
    <div className="p-8 h-screen overflow-hidden flex flex-col bg-background">
      <div className="mb-4">
        <h1 className="mb-1">Point of Sale (POS)</h1>
        <p className="text-sm text-muted-foreground">
          Sell products with Cash, M-Pesa, Card, or on Credit (auto-syncs to Debtors)
        </p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Products */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <select
              value={cart.saleType}
              onChange={(e) => setCart({ ...cart, saleType: e.target.value as any })}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none font-medium"
            >
              <option>Retail</option>
              <option>Wholesale</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card p-4">
            <div className="grid grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="p-3 border border-border rounded-lg hover:shadow-md hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="font-medium text-sm mb-1">{product.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{product.sku}</div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold">
                      {cart.saleType === 'Retail' ? product.retailPrice : product.wholesalePrice}
                    </span>
                    <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="w-80 flex flex-col border border-border rounded-lg bg-card shadow-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg">Cart Summary</h2>
            <div className="text-xs text-muted-foreground mt-1">
              {cart.items.length} item{cart.items.length === 1 ? '' : 's'} • {cart.saleType}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.items.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No items in cart</div>
            ) : (
              cart.items.map(item => (
                <div key={item.id} className="flex items-start justify-between bg-secondary p-3 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.quantity} x {item.price}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{(item.price * item.quantity).toFixed(2)}</div>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-12 px-2 py-1 mt-1 text-xs border border-border rounded text-center outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-full mt-1 text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (16%):</span>
              <span className="font-medium">{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
              <span>Total:</span>
              <span className="text-primary">{total.toFixed(2)}</span>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors font-medium text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => setShowPayment(true)}
                disabled={cart.items.length === 0}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium text-sm"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Complete Payment" size="md">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Due</p>
            <p className="text-3xl font-bold text-primary">{total.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {paymentButtons.map(btn => (
                <button
                  key={btn.value}
                  onClick={() => setPayment(prev => ({ ...prev, method: btn.value }))}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all text-sm ${
                    payment.method === btn.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {payment.method === 'Credit' && (
            <div className="space-y-3 p-3 bg-secondary rounded-lg border border-border">
              <input
                type="text"
                placeholder="Customer Name"
                value={payment.customerName || ''}
                onChange={(e) => setPayment(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
              />
              <input
                type="tel"
                placeholder="Customer Phone"
                value={payment.customerPhone || ''}
                onChange={(e) => setPayment(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This will automatically create a debtor entry visible under the Debtors module.
              </p>
            </div>
          )}

          {payment.method !== 'Credit' && (
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount Paid"
                value={payment.amountPaid || ''}
                onChange={(e) => setPayment(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
              {payment.method === 'Mpesa' && (
                <input
                  type="text"
                  placeholder="M-Pesa Reference"
                  value={payment.referenceNo || ''}
                  onChange={(e) => setPayment(prev => ({ ...prev, referenceNo: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                />
              )}
              {payment.method === 'Card' && (
                <input
                  type="text"
                  placeholder="Card Reference / Transaction ID"
                  value={payment.referenceNo || ''}
                  onChange={(e) => setPayment(prev => ({ ...prev, referenceNo: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                />
              )}
            </div>
          )}

          {payment.method !== 'Credit' && payment.amountPaid > 0 && (
            <div className="bg-secondary p-3 rounded-lg border border-border text-sm text-muted-foreground">
              Change: {(payment.amountPaid - total).toFixed(2)}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-border">
            <button
              onClick={() => setShowPayment(false)}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

