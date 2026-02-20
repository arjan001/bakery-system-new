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
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile'>('Cash');
  const [amountPaid, setAmountPaid] = useState(0);

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

  const handlePayment = () => {
    if (amountPaid >= total) {
      const change = amountPaid - total;
      alert(`Sale Completed!\nTotal: ${total.toFixed(2)}\nPayment: ${amountPaid.toFixed(2)}\nChange: ${change.toFixed(2)}`);
      setCart({ items: [], saleType: 'Retail' });
      setAmountPaid(0);
      setShowPayment(false);
    } else {
      alert('Insufficient payment amount');
    }
  };

  return (
    <div className="p-8 h-screen overflow-hidden flex flex-col">
      <div className="mb-6">
        <h1 className="mb-2">Point of Sale (POS)</h1>
        <p className="text-muted-foreground">Sell products as wholesale or retail</p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <select
              value={cart.saleType}
              onChange={(e) => setCart({ ...cart, saleType: e.target.value as any })}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
            <div className="grid grid-cols-3 gap-4 p-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed text-left hover:bg-secondary"
                >
                  <p className="font-semibold text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-primary">
                      {cart.saleType === 'Retail' ? product.retailPrice : product.wholesalePrice}
                    </span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                      Stock: {product.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 flex flex-col border border-border rounded-lg bg-card shadow-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg">Cart</h2>
            <p className="text-xs text-muted-foreground">{cart.saleType} Sale</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              cart.items.map(item => (
                <div key={item.id} className="flex items-start justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">KES {item.price}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 text-xs border border-border rounded hover:bg-muted"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 text-xs border border-border rounded hover:bg-muted"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-xs font-bold">KES {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-semibold">KES {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (16%):</span>
              <span className="font-semibold">KES {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Total:</span>
              <span className="text-primary">KES {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 space-y-2 border-t border-border">
            <button
              onClick={() => setCart({ items: [], saleType: 'Retail' })}
              className="w-full px-4 py-2 text-sm bg-secondary text-foreground rounded-lg hover:bg-muted transition-colors font-semibold"
            >
              Clear Cart
            </button>
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.items.length === 0}
              className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Complete Payment" size="md">
        <div className="space-y-4">
          <div className="bg-secondary p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Amount Due</p>
            <p className="text-3xl font-bold text-primary">KES {total.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile">Mobile Money</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Amount Paid</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              placeholder="0.00"
              min="0"
              step="100"
            />
          </div>

          {amountPaid > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                Change: KES {Math.max(0, amountPaid - total).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button
              onClick={() => setShowPayment(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              className="btn-primary"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
