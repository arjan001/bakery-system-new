'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ChevronLeft, ChevronRight, CheckSquare, Square, Trash2, Package, Clock, CheckCircle, Truck, XCircle, MapPin, Eye } from 'lucide-react';
import { Modal } from '@/components/modal';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface TrackedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: string;
  source: string;
  orderDate: string;
  dueDate: string;
  assignedDriver: string;
  deliveryNotes: string;
  paymentStatus: string;
  fulfillment: string;
  rejectionReason: string;
  createdAt: string;
}

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Ready', 'Shipped', 'Delivered'];

export default function OrderTrackingPage() {
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Datatable states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailOrder, setDetailOrder] = useState<TrackedOrder | null>(null);
  const itemsPerPage = 10;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) { showToast('Failed to load orders: ' + error.message, 'error'); setLoading(false); return; }
    if (!data || data.length === 0) { setOrders([]); setLoading(false); return; }

    const mapped = await Promise.all(data.map(async (r: Record<string, unknown>) => {
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', r.id);
      return {
        id: r.id as string,
        orderNumber: (r.order_number || '') as string,
        customerName: (r.customer_name || '') as string,
        customerPhone: (r.customer_phone || '') as string,
        items: (items || []).map((i: Record<string, unknown>) => ({
          productName: (i.product_name || '') as string,
          quantity: (i.quantity || 0) as number,
          unitPrice: (i.unit_price || 0) as number,
        })),
        total: (r.total_amount || 0) as number,
        status: (r.status || 'Pending') as string,
        source: (r.source || 'Regular') as string,
        orderDate: (r.order_date || '') as string,
        dueDate: (r.due_date || '') as string,
        assignedDriver: (r.assigned_driver || '') as string,
        deliveryNotes: (r.delivery_notes || '') as string,
        paymentStatus: (r.payment_status || 'Unpaid') as string,
        fulfillment: (r.fulfillment || 'Delivery') as string,
        rejectionReason: (r.rejection_reason || '') as string,
        createdAt: (r.created_at || '') as string,
      };
    }));
    setOrders(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Filter and search
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesSource = filterSource === 'All' || order.source === filterSource;
    if (!matchesStatus || !matchesSource) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.customerPhone.toLowerCase().includes(term) ||
      order.assignedDriver.toLowerCase().includes(term)
    );
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterSource]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Select all logic
  const allPageSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selectedIds.has(o.id));
  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => { const n = new Set(prev); paginatedOrders.forEach(o => n.delete(o.id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); paginatedOrders.forEach(o => n.add(o.id)); return n; });
    }
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected order(s)? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    try {
      // Delete order items first
      for (const id of ids) {
        await supabase.from('order_items').delete().eq('order_id', id);
      }
      const { error } = await supabase.from('orders').delete().in('id', ids);
      if (error) throw error;
      setOrders(prev => prev.filter(o => !selectedIds.has(o.id)));
      setSelectedIds(new Set());
      showToast(`${ids.length} order(s) deleted`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to delete: ${msg}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    try {
      await supabase.from('order_items').delete().eq('order_id', id);
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      showToast('Order deleted', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to delete: ${msg}`, 'error');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (detailOrder?.id === orderId) setDetailOrder(prev => prev ? { ...prev, status: newStatus } : null);
      showToast(`Order status updated to ${newStatus}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to update: ${msg}`, 'error');
    }
  };

  const getStatusColor = (s: string) => {
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

  const getPaymentColor = (p: string) => {
    switch (p) {
      case 'Paid':             return 'bg-green-100 text-green-800';
      case 'Pay on Delivery':  return 'bg-amber-100 text-amber-800';
      case 'M-Pesa Pending':   return 'bg-blue-100 text-blue-800';
      default:                 return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusStepIndex = (status: string) => STATUS_STEPS.indexOf(status);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={14} />;
      case 'Confirmed': return <CheckCircle size={14} />;
      case 'Processing': return <Package size={14} />;
      case 'Ready': return <Package size={14} />;
      case 'Shipped': return <Truck size={14} />;
      case 'Delivered': return <CheckCircle size={14} />;
      case 'Rejected': return <XCircle size={14} />;
      case 'Cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  // Stats
  const stats = [
    { label: 'Total Orders', value: orders.length, color: '' },
    { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: 'text-yellow-600' },
    { label: 'Processing', value: orders.filter(o => ['Confirmed', 'Processing', 'Ready'].includes(o.status)).length, color: 'text-blue-600' },
    { label: 'Shipped', value: orders.filter(o => o.status === 'Shipped').length, color: 'text-orange-600' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: 'text-green-600' },
  ];

  return (
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Order Tracking</h1>
        <p className="text-muted-foreground">Track order status, progress, and delivery across all channels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="border border-border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search / Filter / Actions */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search order #, customer, driver..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
            {['All', 'On Hold', 'Pending', 'Confirmed', 'Processing', 'Ready', 'Shipped', 'Delivered', 'Rejected', 'Cancelled'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
            <option value="All">All Sources</option>
            <option value="Regular">Regular</option>
            <option value="Online">Online</option>
            <option value="OnCall">On-Call</option>
          </select>
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
              <Trash2 size={14} /> Delete {selectedIds.size}
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading orders...</div>
      ) : (
        <>
          <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-3 py-3 text-center w-10">
                    <button type="button" onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                      {allPageSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Order #</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Items</th>
                  <th className="px-4 py-3 text-left font-semibold">Total</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Progress</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment</th>
                  <th className="px-4 py-3 text-left font-semibold">Source</th>
                  <th className="px-4 py-3 text-left font-semibold">Due</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                      {searchTerm || filterStatus !== 'All' || filterSource !== 'All' ? 'No orders match your filters.' : 'No orders found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map(order => {
                    const stepIdx = getStatusStepIndex(order.status);
                    return (
                      <tr key={order.id} className={`border-b border-border hover:bg-secondary/50 transition-colors ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-3 py-3 text-center">
                          <button type="button" onClick={() => toggleSelect(order.id)} className="text-muted-foreground hover:text-foreground">
                            {selectedIds.has(order.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{order.items.length} item(s)</td>
                        <td className="px-4 py-3 font-semibold text-sm">KES {order.total.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)} {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {/* Progress bar */}
                          {stepIdx >= 0 ? (
                            <div className="flex gap-0.5">
                              {STATUS_STEPS.map((_, i) => (
                                <div key={i} className={`h-1.5 w-4 rounded-full ${i <= stepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-muted-foreground">{order.source}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{order.dueDate || '\u2014'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setDetailOrder(order)}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" title="View Details">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => handleDelete(order.id)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1}&ndash;{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex gap-1 items-center">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-1.5 border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) page = i + 1;
                  else if (currentPage <= 4) page = i + 1;
                  else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                  else page = currentPage - 3 + i;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === page ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="p-1.5 border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal with Timeline */}
      <Modal isOpen={!!detailOrder} onClose={() => setDetailOrder(null)}
        title={`Order Tracking \u2014 ${detailOrder?.orderNumber || ''}`} size="xl">
        {detailOrder && (
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">

            {/* Status Timeline */}
            <div className="bg-secondary/30 rounded-xl p-5">
              <p className="text-sm font-bold mb-4">Order Progress</p>
              {detailOrder.status === 'Rejected' || detailOrder.status === 'Cancelled' ? (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${detailOrder.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                  <XCircle size={18} />
                  <div>
                    <p className="font-semibold">{detailOrder.status}</p>
                    {detailOrder.rejectionReason && <p className="text-xs mt-0.5">{detailOrder.rejectionReason}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = getStatusStepIndex(detailOrder.status);
                    const isCompleted = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            isCompleted ? 'bg-green-500 border-green-500 text-white' :
                            isCurrent ? 'bg-primary border-primary text-primary-foreground' :
                            'bg-white border-gray-300 text-gray-400'
                          }`}>
                            {isCompleted && !isCurrent ? <CheckCircle size={16} /> : (i + 1)}
                          </div>
                          <p className={`text-[10px] mt-1 font-medium text-center ${isCompleted ? 'text-green-700' : 'text-muted-foreground'}`}>{step}</p>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-1 ${i < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {detailOrder.status === 'Pending' && (
                <button onClick={() => handleStatusChange(detailOrder.id, 'Confirmed')}
                  className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                  Confirm Order
                </button>
              )}
              {detailOrder.status === 'Confirmed' && (
                <button onClick={() => handleStatusChange(detailOrder.id, 'Processing')}
                  className="px-3 py-2 text-xs bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 font-semibold">
                  Start Processing
                </button>
              )}
              {(detailOrder.status === 'Confirmed' || detailOrder.status === 'Processing') && (
                <button onClick={() => handleStatusChange(detailOrder.id, 'Ready')}
                  className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 font-semibold">
                  Mark as Ready
                </button>
              )}
              {detailOrder.status === 'Ready' && (
                <button onClick={() => handleStatusChange(detailOrder.id, 'Shipped')}
                  className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 font-semibold">
                  Mark as Shipped
                </button>
              )}
              {detailOrder.status === 'Shipped' && (
                <button onClick={() => handleStatusChange(detailOrder.id, 'Delivered')}
                  className="px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                  Mark as Delivered
                </button>
              )}
              {['Pending', 'Confirmed'].includes(detailOrder.status) && (
                <button onClick={() => handleStatusChange(detailOrder.id, 'Cancelled')}
                  className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold ml-auto">
                  Cancel Order
                </button>
              )}
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Customer</p>
                <p className="font-semibold">{detailOrder.customerName}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <p className="font-semibold">{detailOrder.customerPhone || '\u2014'}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPaymentColor(detailOrder.paymentStatus)}`}>{detailOrder.paymentStatus}</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Fulfillment</p>
                <div className="flex items-center gap-1">
                  {detailOrder.fulfillment === 'Delivery' ? <Truck size={14} /> : <MapPin size={14} />}
                  <span className="font-semibold">{detailOrder.fulfillment}</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Source</p>
                <p className="font-semibold">{detailOrder.source}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Order Date</p>
                <p className="font-semibold">{detailOrder.orderDate || '\u2014'}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Due Date</p>
                <p className="font-semibold">{detailOrder.dueDate || '\u2014'}</p>
              </div>
              {detailOrder.assignedDriver && (
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Driver</p>
                  <p className="font-semibold">{detailOrder.assignedDriver}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailOrder.items.map((item, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2">{item.productName}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">KES {item.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-semibold">KES {(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-secondary/50">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-bold">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-primary">KES {detailOrder.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {detailOrder.deliveryNotes && (
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Delivery Notes</p>
                <p className="text-sm">{detailOrder.deliveryNotes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <button onClick={() => setDetailOrder(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
