'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Globe, PhoneCall, CheckCircle, XCircle, CreditCard, Truck, Clock } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Rejected' | 'On Hold';
  source: 'Regular' | 'Online' | 'OnCall';
  orderDate: string;
  dueDate: string;
  assignedDriver?: string;
  deliveryNotes: string;
  paymentStatus: 'Unpaid' | 'Pay on Delivery' | 'Paid' | 'M-Pesa Pending';
  fulfillment: 'Delivery' | 'Pickup';
  rejectionReason?: string;
}

type Tab = 'regular' | 'online' | 'oncall';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('regular');

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<Order | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<Order | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [rejectReason, setRejectReason] = useState('');
  const [confirmPayment, setConfirmPayment] = useState<Order['paymentStatus']>('Pay on Delivery');
  const [confirmFulfillment, setConfirmFulfillment] = useState<Order['fulfillment']>('Delivery');

  const [formData, setFormData] = useState<Omit<Order, 'id' | 'total'>>({
    orderNumber: '',
    customerName: '',
    customerPhone: '',
    items: [{ productName: '', quantity: 1, unitPrice: 0 }],
    status: 'Pending',
    source: 'Regular',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    assignedDriver: '',
    deliveryNotes: '',
    paymentStatus: 'Unpaid',
    fulfillment: 'Delivery',
  });

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const mapped = await Promise.all(data.map(async (r: Record<string, unknown>) => {
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', r.id);
        return {
          id: r.id as string,
          orderNumber: (r.order_number || '') as string,
          customerName: (r.customer_name || '') as string,
          customerPhone: (r.customer_phone || '') as string,
          items: (items || []).map((i: Record<string, unknown>) => ({
            productName: i.product_name as string,
            quantity: i.quantity as number,
            unitPrice: i.unit_price as number,
          })),
          total: (r.total_amount || 0) as number,
          status: (r.status || 'Pending') as Order['status'],
          source: (r.source || 'Regular') as Order['source'],
          orderDate: (r.order_date || '') as string,
          dueDate: (r.due_date || '') as string,
          assignedDriver: (r.assigned_driver || '') as string,
          deliveryNotes: (r.delivery_notes || '') as string,
          paymentStatus: (r.payment_status || 'Unpaid') as Order['paymentStatus'],
          fulfillment: (r.fulfillment || 'Delivery') as Order['fulfillment'],
          rejectionReason: (r.rejection_reason || '') as string,
        };
      }));
      setOrders(mapped);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    supabase.from('employees').select('first_name, last_name').eq('category', 'Driver').eq('status', 'Active').then(({ data }) => {
      if (data) setDrivers(data.map((d: Record<string, unknown>) => `${d.first_name} ${d.last_name}`));
    });
  }, []);

  // Computed lists per tab
  const regularOrders = orders.filter(o => o.source === 'Regular' || !o.source);
  const onlineOrders  = orders.filter(o => o.source === 'Online');
  const onCallOrders  = orders.filter(o => o.source === 'OnCall');

  const pendingOnline = onlineOrders.filter(o => o.status === 'Pending').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedTotal = formData.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const row = {
      order_number: formData.orderNumber,
      customer_name: formData.customerName,
      customer_phone: formData.customerPhone,
      total_amount: calculatedTotal,
      status: formData.status,
      source: formData.source,
      order_date: formData.orderDate || null,
      due_date: formData.dueDate || null,
      assigned_driver: formData.assignedDriver,
      delivery_notes: formData.deliveryNotes,
      payment_status: formData.paymentStatus,
      fulfillment: formData.fulfillment,
    };
    try {
      if (editingId) {
        await supabase.from('orders').update(row).eq('id', editingId);
        await supabase.from('order_items').delete().eq('order_id', editingId);
        if (formData.items.length > 0)
          await supabase.from('order_items').insert(formData.items.map(i => ({ order_id: editingId, product_name: i.productName, quantity: i.quantity, unit_price: i.unitPrice, total: i.quantity * i.unitPrice })));
      } else {
        const { data: created } = await supabase.from('orders').insert(row).select().single();
        if (created && formData.items.length > 0)
          await supabase.from('order_items').insert(formData.items.map(i => ({ order_id: created.id, product_name: i.productName, quantity: i.quantity, unit_price: i.unitPrice, total: i.quantity * i.unitPrice })));
      }
      await fetchOrders();
    } catch (err) { console.error(err); }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
      customerName: '', customerPhone: '',
      items: [{ productName: '', quantity: 1, unitPrice: 0 }],
      status: 'Pending', source: 'Regular',
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      assignedDriver: '', deliveryNotes: '',
      paymentStatus: 'Unpaid', fulfillment: 'Delivery',
    });
    setEditingId(null);
  };

  const handleEdit = (order: Order) => {
    setFormData({
      orderNumber: order.orderNumber, customerName: order.customerName, customerPhone: order.customerPhone,
      items: order.items.length > 0 ? order.items : [{ productName: '', quantity: 1, unitPrice: 0 }],
      status: order.status, source: order.source,
      orderDate: order.orderDate, dueDate: order.dueDate,
      assignedDriver: order.assignedDriver || '', deliveryNotes: order.deliveryNotes,
      paymentStatus: order.paymentStatus, fulfillment: order.fulfillment,
    });
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this order?')) {
      await supabase.from('order_items').delete().eq('order_id', id);
      await supabase.from('orders').delete().eq('id', id);
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleAssignDriver = async (orderId: string, driver: string) => {
    await supabase.from('orders').update({ assigned_driver: driver, status: 'Shipped' }).eq('id', orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, assignedDriver: driver, status: 'Shipped' } : o));
    setShowTracking(false);
  };

  // ── Online Order Actions ──
  const handleConfirmOrder = async () => {
    if (!showConfirmModal) return;
    await supabase.from('orders').update({
      status: 'Confirmed',
      payment_status: confirmPayment,
      fulfillment: confirmFulfillment,
    }).eq('id', showConfirmModal.id);
    setOrders(orders.map(o => o.id === showConfirmModal.id
      ? { ...o, status: 'Confirmed', paymentStatus: confirmPayment, fulfillment: confirmFulfillment }
      : o));
    setShowConfirmModal(null);
  };

  const handleRejectOrder = async () => {
    if (!showRejectModal) return;
    await supabase.from('orders').update({
      status: 'Rejected',
      rejection_reason: rejectReason,
    }).eq('id', showRejectModal.id);
    setOrders(orders.map(o => o.id === showRejectModal.id
      ? { ...o, status: 'Rejected', rejectionReason: rejectReason }
      : o));
    setShowRejectModal(null);
    setRejectReason('');
  };

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { productName: '', quantity: 1, unitPrice: 0 }] });
  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...formData.items];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, items: updated });
  };
  const removeItem = (idx: number) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const getStatusColor = (s: Order['status']) => {
    switch (s) {
      case 'On Hold':    return 'bg-amber-100 text-amber-800';
      case 'Pending':    return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed':  return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-indigo-100 text-indigo-800';
      case 'Ready':      return 'bg-purple-100 text-purple-800';
      case 'Shipped':    return 'bg-orange-100 text-orange-800';
      case 'Delivered':  return 'bg-green-100 text-green-800';
      case 'Cancelled':  return 'bg-gray-100 text-gray-700';
      case 'Rejected':   return 'bg-red-100 text-red-800';
      default:           return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (p: Order['paymentStatus']) => {
    switch (p) {
      case 'Paid':             return 'bg-green-100 text-green-800';
      case 'Pay on Delivery':  return 'bg-amber-100 text-amber-800';
      case 'M-Pesa Pending':   return 'bg-blue-100 text-blue-800';
      default:                 return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredRegular = regularOrders.filter(o => filterStatus === 'All' || o.status === filterStatus);
  const filteredOnCall  = onCallOrders.filter(o => filterStatus === 'All' || o.status === filterStatus);

  // ── Shared Order Row renderer ──
  const OrderRow = ({ order, showActions = true }: { order: Order; showActions?: boolean }) => (
    <tr className="border-b border-border hover:bg-secondary/50 transition-colors">
      <td className="px-4 py-3 font-mono text-xs font-semibold">{order.orderNumber}</td>
      <td className="px-4 py-3">
        <p className="font-medium text-sm">{order.customerName}</p>
        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{order.items.length} item(s)</td>
      <td className="px-4 py-3 font-semibold text-sm">KES {order.total.toLocaleString()}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{order.dueDate || '—'}</td>
      {showActions && (
        <td className="px-4 py-3">
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setShowDetailModal(order)}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium">View</button>
            <button onClick={() => handleEdit(order)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button>
            {order.status === 'Ready' && (
              <button onClick={() => { setSelectedOrderId(order.id); setShowTracking(true); }}
                className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 font-medium">Assign</button>
            )}
            <button onClick={() => handleDelete(order.id)}
              className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button>
          </div>
        </td>
      )}
    </tr>
  );

  const TableHead = ({ showActions = true }: { showActions?: boolean }) => (
    <thead className="bg-secondary border-b border-border">
      <tr>
        <th className="px-4 py-3 text-left font-semibold text-sm">Order #</th>
        <th className="px-4 py-3 text-left font-semibold text-sm">Customer</th>
        <th className="px-4 py-3 text-left font-semibold text-sm">Items</th>
        <th className="px-4 py-3 text-left font-semibold text-sm">Total</th>
        <th className="px-4 py-3 text-left font-semibold text-sm">Status</th>
        <th className="px-4 py-3 text-left font-semibold text-sm">Payment</th>
        <th className="px-4 py-3 text-left font-semibold text-sm">Due Date</th>
        {showActions && <th className="px-4 py-3 text-left font-semibold text-sm">Actions</th>}
      </tr>
    </thead>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="mb-1">Order Management</h1>
        <p className="text-muted-foreground">Regular orders, online orders, and on-call orders — all in one place</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: orders.length, color: '' },
          { label: 'On Hold', value: orders.filter(o => o.status === 'On Hold').length, color: 'text-amber-600' },
          { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: 'text-yellow-600' },
          { label: 'Online (new)', value: pendingOnline, color: 'text-blue-600' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="border border-border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {([
          { id: 'regular', label: 'Regular Orders', icon: ShoppingBag, count: regularOrders.length },
          { id: 'online',  label: 'Online Orders',  icon: Globe,       count: onlineOrders.length,  badge: pendingOnline },
          { id: 'oncall',  label: 'On-Call Orders', icon: PhoneCall,   count: onCallOrders.length },
        ] as const).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFilterStatus('All'); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors relative ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {tab.count}
              </span>
              {'badge' in tab && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Right-side create button */}
        <div className="ml-auto pb-2">
          {(activeTab === 'regular' || activeTab === 'oncall') && (
            <button
              onClick={() => {
                resetForm();
                setFormData(prev => ({ ...prev, source: activeTab === 'oncall' ? 'OnCall' : 'Regular' }));
                setShowForm(true);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium text-sm"
            >
              + Create Order
            </button>
          )}
        </div>
      </div>

      {/* ── REGULAR ORDERS TAB ── */}
      {activeTab === 'regular' && (
        <div>
          <div className="mb-4">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
              {['All', 'On Hold', 'Pending', 'Confirmed', 'Processing', 'Ready', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <TableHead />
              <tbody>
                {filteredRegular.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No regular orders found</td></tr>
                ) : filteredRegular.map(o => <OrderRow key={o.id} order={o} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ONLINE ORDERS TAB ── */}
      {activeTab === 'online' && (
        <div>
          {/* Info banner */}
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 flex gap-3 items-start">
            <Globe size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Online Orders — from your website</p>
              <p className="text-xs text-blue-700 mt-0.5">
                These orders come in from your public website. <strong>Confirm</strong> to approve and proceed to fulfilment, or <strong>Reject</strong> if you can&apos;t fulfil the order. After confirming, set whether the customer has paid or will pay on delivery.
              </p>
            </div>
          </div>

          {onlineOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
              <Globe size={36} className="text-muted-foreground/30 mb-3" />
              <p className="font-semibold text-muted-foreground">No online orders yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                Once your website is live and customers start ordering, their orders will appear here for you to review and confirm.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {onlineOrders.map(order => (
                <div key={order.id} className={`border rounded-xl p-4 bg-card ${order.status === 'Pending' ? 'border-blue-300 bg-blue-50/30' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
                        {order.fulfillment && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground">
                            {order.fulfillment === 'Delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone} &bull; {order.orderDate}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {order.items.map((item, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-secondary rounded">
                            {item.quantity}× {item.productName}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm font-bold mt-2">Total: KES {order.total.toLocaleString()}</p>
                      {order.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Rejected: {order.rejectionReason}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {order.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => { setShowConfirmModal(order); setConfirmPayment('Pay on Delivery'); setConfirmFulfillment('Delivery'); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-semibold"
                          >
                            <CheckCircle size={13} /> Confirm Order
                          </button>
                          <button
                            onClick={() => { setShowRejectModal(order); setRejectReason(''); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-semibold"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      {order.status === 'Confirmed' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatusChange(order.id, 'Processing')}
                            className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 font-semibold"
                          >
                            → Processing
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'Ready')}
                            className="px-3 py-1.5 text-xs bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 font-semibold"
                          >
                            → Ready
                          </button>
                        </div>
                      )}
                      {order.status === 'Ready' && (
                        <button
                          onClick={() => { setSelectedOrderId(order.id); setShowTracking(true); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 text-xs font-semibold"
                        >
                          <Truck size={13} /> Assign Driver
                        </button>
                      )}
                      <button onClick={() => setShowDetailModal(order)}
                        className="px-3 py-1.5 text-xs bg-secondary text-foreground rounded-lg hover:bg-secondary/70 font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ON-CALL ORDERS TAB ── */}
      {activeTab === 'oncall' && (
        <div>
          {/* Info banner */}
          <div className="mb-5 rounded-xl border border-purple-200 bg-purple-50 px-5 py-4 flex gap-4">
            <PhoneCall size={20} className="text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-purple-900 mb-1">How On-Call Orders Work</p>
              <p className="text-sm text-purple-800 leading-relaxed">
                A customer calls in to place an order. The admin opens the <strong>POS system</strong>, searches for products, adds them to the cart, selects the customer, and checks out — choosing either <strong>Pickup</strong> or <strong>Delivery</strong> as the fulfilment method.
              </p>
              <p className="text-sm text-purple-800 mt-1">
                The sale is recorded in POS and any delivery needed can then be scheduled from the <strong>Delivery</strong> page.
              </p>
              <Link
                href="/admin/pos"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-semibold hover:bg-purple-800 transition-colors"
              >
                <ShoppingBag size={14} /> Open POS for On-Call Order
              </Link>
            </div>
          </div>

          {/* On-call orders tagged from system */}
          {onCallOrders.length > 0 && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">On-Call Orders History</p>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary/50 outline-none">
                  {['All', 'On Hold', 'Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
                <table className="w-full text-sm">
                  <TableHead />
                  <tbody>
                    {filteredOnCall.map(o => <OrderRow key={o.id} order={o} />)}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {onCallOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-xl text-center">
              <Clock size={32} className="text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">No on-call orders recorded yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">On-call orders are processed through the POS system above</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Order Modal ── */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }}
        title={editingId ? 'Edit Order' : 'Create Order'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Order Number</label>
              <input type="text" value={formData.orderNumber}
                onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Source</label>
              <select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value as Order['source'] })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="Regular">Regular</option>
                <option value="Online">Online</option>
                <option value="OnCall">On-Call</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Customer Name *</label>
              <input type="text" value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Phone</label>
              <input type="tel" value={formData.customerPhone}
                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Order Date</label>
              <input type="date" value={formData.orderDate}
                onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Due / Delivery Date</label>
              <input type="date" value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Order['status'] })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                {['On Hold','Pending','Confirmed','Processing','Ready','Shipped','Delivered','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Payment</label>
              <select value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as Order['paymentStatus'] })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="Unpaid">Unpaid</option>
                <option value="Pay on Delivery">Pay on Delivery</option>
                <option value="M-Pesa Pending">M-Pesa Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Fulfilment</label>
              <select value={formData.fulfillment} onChange={e => setFormData({ ...formData, fulfillment: e.target.value as Order['fulfillment'] })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="Delivery">Delivery</option>
                <option value="Pickup">Pickup</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="border border-border rounded-lg p-3 bg-secondary/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">Order Items</label>
              <button type="button" onClick={addItem} className="text-xs text-primary font-medium hover:underline">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" placeholder="Product name" value={item.productName}
                    onChange={e => updateItem(idx, 'productName', e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                  <input type="number" placeholder="Qty" value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-16 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                  <input type="number" placeholder="KES" value={item.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold px-1">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border text-right text-sm font-bold">
              Total: KES {formData.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toLocaleString()}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Delivery Notes</label>
            <textarea value={formData.deliveryNotes} onChange={e => setFormData({ ...formData, deliveryNotes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" rows={2} />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium text-sm">
              {editingId ? 'Update' : 'Create'} Order
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Assign Driver Modal ── */}
      <Modal isOpen={showTracking && !!selectedOrder} onClose={() => setShowTracking(false)}
        title={`Assign Driver — ${selectedOrder?.orderNumber}`} size="sm">
        <div className="space-y-4">
          <div className="bg-secondary rounded-lg p-3 text-sm">
            <p className="font-semibold">{selectedOrder?.customerName}</p>
            <p className="text-muted-foreground text-xs">{selectedOrder?.customerPhone}</p>
            <p className="text-muted-foreground text-xs mt-1">KES {selectedOrder?.total.toLocaleString()} &bull; {selectedOrder?.fulfillment}</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Select Driver</label>
            <select onChange={e => handleAssignDriver(selectedOrderId!, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" defaultValue="">
              <option value="">Choose a driver…</option>
              {drivers.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {drivers.length === 0 && <p className="text-xs text-muted-foreground mt-1">No drivers found. Add employees with category "Driver".</p>}
          </div>
          <button onClick={() => setShowTracking(false)}
            className="w-full px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm">Cancel</button>
        </div>
      </Modal>

      {/* ── Confirm Online Order Modal ── */}
      <Modal isOpen={!!showConfirmModal} onClose={() => setShowConfirmModal(null)}
        title="Confirm Online Order" size="sm">
        {showConfirmModal && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-green-800">{showConfirmModal.customerName}</p>
              <p className="text-green-700 text-xs">{showConfirmModal.items.length} item(s) &bull; KES {showConfirmModal.total.toLocaleString()}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                <CreditCard size={14} className="inline mr-1" /> Payment Method
              </label>
              <div className="grid grid-cols-1 gap-2">
                {([
                  { v: 'Paid' as const, label: '✅ Already Paid (online)', desc: 'Customer paid via card or M-Pesa online' },
                  { v: 'Pay on Delivery' as const, label: '💵 Pay on Delivery (Cash)', desc: 'Customer pays in cash upon delivery/pickup' },
                  { v: 'M-Pesa Pending' as const, label: '📱 M-Pesa on Delivery', desc: 'We send STK push when delivering' },
                ]).map(opt => (
                  <button key={opt.v} type="button" onClick={() => setConfirmPayment(opt.v)}
                    className={`text-left px-3 py-2.5 rounded-lg border-2 transition-colors ${confirmPayment === opt.v ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                <Truck size={14} className="inline mr-1" /> Fulfilment
              </label>
              <div className="flex gap-2">
                {(['Delivery', 'Pickup'] as const).map(f => (
                  <button key={f} type="button" onClick={() => setConfirmFulfillment(f)}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${confirmFulfillment === f ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'}`}>
                    {f === 'Delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={() => setShowConfirmModal(null)}
                className="flex-1 px-3 py-2 border border-border rounded-lg hover:bg-secondary text-sm">Cancel</button>
              <button onClick={handleConfirmOrder}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm">
                ✓ Confirm Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reject Online Order Modal ── */}
      <Modal isOpen={!!showRejectModal} onClose={() => setShowRejectModal(null)}
        title="Reject Order" size="sm">
        {showRejectModal && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-red-800">{showRejectModal.customerName}</p>
              <p className="text-red-700 text-xs">{showRejectModal.items.length} item(s) &bull; KES {showRejectModal.total.toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason for rejection</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" rows={3}
                placeholder="e.g. Out of stock, delivery area not covered, order incomplete…" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(null)}
                className="flex-1 px-3 py-2 border border-border rounded-lg hover:bg-secondary text-sm">Cancel</button>
              <button onClick={handleRejectOrder}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm">
                Reject Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Order Detail Modal ── */}
      <Modal isOpen={!!showDetailModal} onClose={() => setShowDetailModal(null)}
        title={showDetailModal?.orderNumber || ''} size="md">
        {showDetailModal && (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Customer:</span><strong className="ml-2">{showDetailModal.customerName}</strong></div>
              <div><span className="text-muted-foreground">Phone:</span><strong className="ml-2">{showDetailModal.customerPhone || '—'}</strong></div>
              <div><span className="text-muted-foreground">Status:</span><span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(showDetailModal.status)}`}>{showDetailModal.status}</span></div>
              <div><span className="text-muted-foreground">Payment:</span><span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${getPaymentColor(showDetailModal.paymentStatus)}`}>{showDetailModal.paymentStatus}</span></div>
              <div><span className="text-muted-foreground">Source:</span><strong className="ml-2">{showDetailModal.source}</strong></div>
              <div><span className="text-muted-foreground">Fulfilment:</span><strong className="ml-2">{showDetailModal.fulfillment}</strong></div>
              <div><span className="text-muted-foreground">Order Date:</span><strong className="ml-2">{showDetailModal.orderDate || '—'}</strong></div>
              <div><span className="text-muted-foreground">Due Date:</span><strong className="ml-2">{showDetailModal.dueDate || '—'}</strong></div>
              {showDetailModal.assignedDriver && <div className="col-span-2"><span className="text-muted-foreground">Driver:</span><strong className="ml-2">{showDetailModal.assignedDriver}</strong></div>}
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary"><tr><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-center">Qty</th><th className="px-3 py-2 text-right">Unit Price</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
                <tbody>
                  {showDetailModal.items.map((item, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2">{item.productName}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">KES {item.unitPrice}</td>
                      <td className="px-3 py-2 text-right font-semibold">KES {(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-secondary/50">
                  <tr><td colSpan={3} className="px-3 py-2 text-right font-bold">Total</td><td className="px-3 py-2 text-right font-bold text-primary">KES {showDetailModal.total.toLocaleString()}</td></tr>
                </tfoot>
              </table>
            </div>
            {showDetailModal.deliveryNotes && (
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Delivery Notes</p>
                <p>{showDetailModal.deliveryNotes}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={() => { handleEdit(showDetailModal); setShowDetailModal(null); }}
                className="flex-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm font-medium">Edit Order</button>
              <button onClick={() => setShowDetailModal(null)}
                className="flex-1 px-3 py-2 border border-border rounded-lg hover:bg-secondary text-sm">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
