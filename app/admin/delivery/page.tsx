'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';
import { ClipboardList } from 'lucide-react';
import { logAudit } from '@/lib/audit-logger';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  address: string;
  gpsLat: number;
  gpsLng: number;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
}

interface Vehicle {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  status: string;
}

interface DeliveryItem {
  name: string;
  quantity: number;
  unit: string;
}

interface Delivery {
  id: string;
  trackingNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  customerAddress: string;
  customerGpsLat: number;
  customerGpsLng: number;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleName: string;
  status: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered' | 'Failed';
  scheduledDate: string;
  timeSlot: string;
  items: DeliveryItem[];
  notes: string;
  specialInstructions: string;
  createdAt: string;
}

const TIME_SLOTS = [
  '06:00 - 08:00',
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

const STATUSES: Delivery['status'][] = ['Pending', 'Assigned', 'In Transit', 'Delivered', 'Failed'];

const emptyItem: DeliveryItem = { name: '', quantity: 1, unit: 'pcs' };

function generateTrackingNumber(): string {
  const prefix = 'DEL';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

function dbToDelivery(r: Record<string, unknown>): Delivery {
  let items: DeliveryItem[] = [];
  try {
    if (r.items && typeof r.items === 'string') items = JSON.parse(r.items);
    else if (Array.isArray(r.items)) items = r.items as DeliveryItem[];
  } catch { /* empty */ }
  return {
    id: r.id as string,
    trackingNumber: (r.tracking_number || '') as string,
    customerId: (r.customer_id || '') as string,
    customerName: (r.customer_name || '') as string,
    customerPhone: (r.customer_phone || '') as string,
    customerLocation: (r.customer_location || r.destination || '') as string,
    customerAddress: (r.customer_address || '') as string,
    customerGpsLat: (r.customer_gps_lat || 0) as number,
    customerGpsLng: (r.customer_gps_lng || 0) as number,
    driverId: (r.driver_id || '') as string,
    driverName: (r.driver || r.driver_name || '') as string,
    vehicleId: (r.vehicle_id || '') as string,
    vehicleName: (r.vehicle || r.vehicle_name || '') as string,
    status: (r.status || 'Pending') as Delivery['status'],
    scheduledDate: (r.scheduled_date || '') as string,
    timeSlot: (r.time_slot || '') as string,
    items,
    notes: (r.notes || '') as string,
    specialInstructions: (r.special_instructions || '') as string,
    createdAt: (r.created_at || '') as string,
  };
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { productName: string; quantity: number }[];
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Delivery | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    trackingNumber: '',
    customerId: '',
    driverId: '',
    vehicleId: '',
    status: 'Pending' as Delivery['status'],
    scheduledDate: '',
    timeSlot: '',
    items: [{ ...emptyItem }] as DeliveryItem[],
    notes: '',
    specialInstructions: '',
  });

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Fetch deliveries
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('deliveries').select('*').order('created_at', { ascending: false });
    if (data) {
      setDeliveries(data.map((r: Record<string, unknown>) => dbToDelivery(r)));
    }
    setLoading(false);
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase.from('customers').select('*').order('name', { ascending: true });
    if (data) {
      setCustomers(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r.name || '') as string,
        phone: (r.phone || '') as string,
        email: (r.email || '') as string,
        location: (r.location || '') as string,
        address: (r.address || '') as string,
        gpsLat: (r.gps_lat || 0) as number,
        gpsLng: (r.gps_lng || 0) as number,
      })));
    }
  }, []);

  // Fetch drivers (employees where category = 'Driver' or 'Rider')
  const fetchDrivers = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').in('category', ['Driver', 'Rider']).order('first_name', { ascending: true });
    if (data) {
      setDrivers(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        firstName: (r.first_name || '') as string,
        lastName: (r.last_name || '') as string,
        phone: (r.phone || '') as string,
        status: (r.status || 'Active') as string,
      })));
    }
  }, []);

  // Fetch vehicles (assets where category contains 'Vehicle')
  const fetchVehicles = useCallback(async () => {
    const { data } = await supabase.from('assets').select('*').ilike('category', '%Vehicle%').order('name', { ascending: true });
    if (data) {
      setVehicles(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r.name || '') as string,
        category: (r.category || '') as string,
        serialNumber: (r.serial_number || '') as string,
        status: (r.status || 'Active') as string,
      })));
    }
  }, []);

  // Fetch recent orders for import
  const fetchRecentOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_phone')
      .in('status', ['Pending', 'Confirmed', 'Processing', 'Ready'])
      .order('created_at', { ascending: false })
      .limit(30);
    if (data && data.length > 0) {
      const withItems = await Promise.all(data.map(async (r: Record<string, unknown>) => {
        const { data: items } = await supabase.from('order_items').select('product_name, quantity').eq('order_id', r.id);
        return {
          id: r.id as string,
          orderNumber: (r.order_number || '') as string,
          customerName: (r.customer_name || '') as string,
          customerPhone: (r.customer_phone || '') as string,
          items: (items || []).map((i: Record<string, unknown>) => ({ productName: (i.product_name || '') as string, quantity: (i.quantity || 1) as number })),
        };
      }));
      setRecentOrders(withItems);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    fetchCustomers();
    fetchDrivers();
    fetchVehicles();
    fetchRecentOrders();
  }, [fetchDeliveries, fetchCustomers, fetchDrivers, fetchVehicles, fetchRecentOrders]);

  // Import from order: populate customer + items
  const importFromOrder = (orderId: string) => {
    const order = recentOrders.find(o => o.id === orderId);
    if (!order) return;
    // Try to match customer from customers list
    const matchedCustomer = customers.find(
      c => c.name.toLowerCase() === order.customerName.toLowerCase()
        || c.phone === order.customerPhone
    );
    setFormData(prev => ({
      ...prev,
      customerId: matchedCustomer?.id || '',
      items: order.items.length > 0
        ? order.items.map(i => ({ name: i.productName, quantity: i.quantity, unit: 'pcs' }))
        : [{ ...emptyItem }],
    }));
    if (matchedCustomer) setCustomerSearch('');
  };

  // Get selected customer details
  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const selectedDriver = drivers.find(d => d.id === formData.driverId);
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  // Filter customers by search
  const filteredCustomers = customerSearch
    ? customers.filter(c =>
        `${c.name} ${c.phone} ${c.location}`.toLowerCase().includes(customerSearch.toLowerCase())
      )
    : customers;

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customerId);
    const driver = drivers.find(d => d.id === formData.driverId);
    const vehicle = vehicles.find(v => v.id === formData.vehicleId);

    const row: Record<string, unknown> = {
      tracking_number: formData.trackingNumber,
      customer_id: formData.customerId || null,
      customer_name: customer?.name || '',
      customer_phone: customer?.phone || '',
      customer_location: customer?.location || '',
      customer_address: customer?.address || '',
      customer_gps_lat: customer?.gpsLat || null,
      customer_gps_lng: customer?.gpsLng || null,
      destination: customer?.location || '',
      driver_id: formData.driverId || null,
      driver: driver ? `${driver.firstName} ${driver.lastName}` : '',
      driver_name: driver ? `${driver.firstName} ${driver.lastName}` : '',
      vehicle_id: formData.vehicleId || null,
      vehicle: vehicle?.name || '',
      vehicle_name: vehicle?.name || '',
      status: formData.status,
      scheduled_date: formData.scheduledDate || null,
      time_slot: formData.timeSlot || null,
      items: JSON.stringify(formData.items.filter(i => i.name.trim())),
      items_count: formData.items.filter(i => i.name.trim()).length,
      notes: formData.notes,
      special_instructions: formData.specialInstructions,
    };

    try {
      if (editingId) {
        await supabase.from('deliveries').update(row).eq('id', editingId);
        logAudit({
          action: 'UPDATE',
          module: 'Delivery',
          record_id: editingId,
          details: { driver: driver ? `${driver.firstName} ${driver.lastName}` : '', status: formData.status },
        });
      } else {
        const { data: inserted } = await supabase.from('deliveries').insert(row).select('id').single();
        logAudit({
          action: 'CREATE',
          module: 'Delivery',
          record_id: inserted?.id || formData.trackingNumber,
          details: { driver: driver ? `${driver.firstName} ${driver.lastName}` : '', status: formData.status },
        });
      }
      await fetchDeliveries();
    } catch {
      // fallback: update local state
    }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      trackingNumber: '',
      customerId: '',
      driverId: '',
      vehicleId: '',
      status: 'Pending',
      scheduledDate: '',
      timeSlot: '',
      items: [{ ...emptyItem }],
      notes: '',
      specialInstructions: '',
    });
    setCustomerSearch('');
  };

  const openNewForm = () => {
    resetForm();
    setFormData(prev => ({ ...prev, trackingNumber: generateTrackingNumber() }));
    setShowForm(true);
  };

  const handleEdit = (d: Delivery) => {
    setFormData({
      trackingNumber: d.trackingNumber,
      customerId: d.customerId,
      driverId: d.driverId,
      vehicleId: d.vehicleId,
      status: d.status,
      scheduledDate: d.scheduledDate,
      timeSlot: d.timeSlot,
      items: d.items.length > 0 ? d.items : [{ ...emptyItem }],
      notes: d.notes,
      specialInstructions: d.specialInstructions,
    });
    setEditingId(d.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this delivery?')) {
      const deletedDelivery = deliveries.find(d => d.id === id);
      await supabase.from('deliveries').delete().eq('id', id);
      logAudit({
        action: 'DELETE',
        module: 'Delivery',
        record_id: id,
        details: { driver: deletedDelivery?.driverName || '', status: deletedDelivery?.status || '' },
      });
      setDeliveries(deliveries.filter(d => d.id !== id));
    }
  };

  const handleStatusChange = async (id: string, newStatus: Delivery['status']) => {
    const oldDelivery = deliveries.find(d => d.id === id);
    await supabase.from('deliveries').update({ status: newStatus }).eq('id', id);
    logAudit({
      action: 'UPDATE',
      module: 'Delivery',
      record_id: id,
      details: { driver: oldDelivery?.driverName || '', status: newStatus, previousStatus: oldDelivery?.status || '' },
    });
    setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: newStatus } : d));
  };

  // Items management
  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] });
  };

  const removeItem = (idx: number) => {
    if (formData.items.length <= 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx: number, field: keyof DeliveryItem, value: string | number) => {
    const updated = formData.items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setFormData({ ...formData, items: updated });
  };

  // Status color helper
  const getStatusColor = (s: Delivery['status']) => {
    switch (s) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
    }
  };

  // Map helpers
  const getMapUrl = (lat: number, lng: number) =>
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  const getMapLinkUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`;

  // Filter and paginate
  const filtered = deliveries.filter(d => {
    const matchSearch = `${d.trackingNumber} ${d.customerName} ${d.driverName} ${d.customerLocation}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const totalDeliveries = deliveries.length;
  const pendingCount = deliveries.filter(d => d.status === 'Pending' || d.status === 'Assigned').length;
  const inTransitCount = deliveries.filter(d => d.status === 'In Transit').length;
  const deliveredTodayCount = deliveries.filter(d => d.status === 'Delivered' && d.scheduledDate === today).length;

  // ── Batch Delivery Selection ──
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [batchDriverId, setBatchDriverId] = useState('');
  const [batchVehicleId, setBatchVehicleId] = useState('');

  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending' || d.status === 'Assigned');

  const toggleBatchSelect = (id: string) => {
    setSelectedBatchIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllBatch = () => {
    if (selectedBatchIds.size === pendingDeliveries.length) {
      setSelectedBatchIds(new Set());
    } else {
      setSelectedBatchIds(new Set(pendingDeliveries.map(d => d.id)));
    }
  };

  const handleBatchDispatch = async () => {
    if (selectedBatchIds.size === 0) return;
    const driver = drivers.find(d => d.id === batchDriverId);
    const vehicle = vehicles.find(v => v.id === batchVehicleId);
    const driverName = driver ? `${driver.firstName} ${driver.lastName}` : '';

    for (const deliveryId of selectedBatchIds) {
      const updateData: Record<string, unknown> = {
        status: 'In Transit',
      };
      if (batchDriverId) {
        updateData.driver_id = batchDriverId;
        updateData.driver = driverName;
        updateData.driver_name = driverName;
      }
      if (batchVehicleId) {
        updateData.vehicle_id = batchVehicleId;
        updateData.vehicle = vehicle?.name || '';
        updateData.vehicle_name = vehicle?.name || '';
      }
      await supabase.from('deliveries').update(updateData).eq('id', deliveryId);
      logAudit({
        action: 'UPDATE',
        module: 'Delivery',
        record_id: deliveryId,
        details: { driver: driverName, status: 'In Transit', batchDispatch: true, batchSize: selectedBatchIds.size },
      });
    }

    await fetchDeliveries();
    setSelectedBatchIds(new Set());
    setBatchDriverId('');
    setBatchVehicleId('');
    setShowBatchModal(false);
  };

  const handleBatchComplete = async () => {
    if (selectedBatchIds.size === 0) return;
    for (const deliveryId of selectedBatchIds) {
      await supabase.from('deliveries').update({ status: 'Delivered' }).eq('id', deliveryId);
      const del = deliveries.find(d => d.id === deliveryId);
      logAudit({
        action: 'UPDATE',
        module: 'Delivery',
        record_id: deliveryId,
        details: { driver: del?.driverName || '', status: 'Delivered', batchComplete: true, batchSize: selectedBatchIds.size },
      });
    }
    await fetchDeliveries();
    setSelectedBatchIds(new Set());
    setShowBatchModal(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Delivery Management</h1>
        <p className="text-muted-foreground">Schedule deliveries, assign drivers, and track shipments in real time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Deliveries</p>
          <p className="text-2xl font-bold">{totalDeliveries}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">In Transit</p>
          <p className="text-2xl font-bold text-blue-600">{inTransitCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Delivered Today</p>
          <p className="text-2xl font-bold text-green-600">{deliveredTodayCount}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search deliveries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none w-64"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
          >
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {pendingDeliveries.length > 1 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 font-medium"
            >
              Batch Deliver ({pendingDeliveries.length} pending)
            </button>
          )}
          <button
          onClick={openNewForm}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + Schedule Delivery
        </button>
        </div>
      </div>

      {/* ── Schedule / Edit Delivery Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editingId ? 'Edit Delivery' : 'Schedule New Delivery'}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

          {/* Section: Import from Order */}
          {recentOrders.length > 0 && (
            <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                📦 Import from Recent Order
                <span className="text-xs font-normal text-muted-foreground">— auto-fills customer & items</span>
              </p>
              <select
                onChange={(e) => e.target.value && importFromOrder(e.target.value)}
                defaultValue=""
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background text-sm"
              >
                <option value="">— Select an order to import —</option>
                {recentOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} · {o.customerName} · {o.items.length} item(s)
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">After selecting, review and adjust the items below as needed.</p>
            </div>
          )}

          {/* Section: Delivery Info */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <p className="text-sm font-semibold mb-3">Delivery Information</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background font-mono text-sm"
                  readOnly={!editingId}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Time Slot *</label>
                <select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                  required
                >
                  <option value="">Select time slot</option>
                  {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
            </div>
            {editingId && (
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Delivery['status'] })}
                  className="w-full max-w-xs px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Section: Customer Selection */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <p className="text-sm font-semibold mb-3">Customer</p>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search customer by name, phone, or location..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background text-sm"
              />
            </div>
            <select
              value={formData.customerId}
              onChange={(e) => {
                setFormData({ ...formData, customerId: e.target.value });
                setCustomerSearch('');
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              required
            >
              <option value="">Select a customer</option>
              {filteredCustomers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.phone} {c.location ? `(${c.location})` : ''}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-3 p-3 bg-background border border-border rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Name:</span> <strong>{selectedCustomer.name}</strong></div>
                  <div><span className="text-muted-foreground">Phone:</span> <strong>{selectedCustomer.phone}</strong></div>
                  <div><span className="text-muted-foreground">Location:</span> <strong>{selectedCustomer.location || '—'}</strong></div>
                  <div><span className="text-muted-foreground">Address:</span> <strong>{selectedCustomer.address || '—'}</strong></div>
                </div>
                {selectedCustomer.gpsLat !== 0 && (
                  <p className="text-xs text-muted-foreground mt-2">GPS: {selectedCustomer.gpsLat.toFixed(6)}, {selectedCustomer.gpsLng.toFixed(6)}</p>
                )}
              </div>
            )}
          </div>

          {/* Section: Driver & Vehicle Assignment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-4 bg-secondary/30">
              <p className="text-sm font-semibold mb-3">Driver Assignment</p>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              >
                <option value="">Select a driver</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} {d.status !== 'Active' ? `(${d.status})` : ''}
                  </option>
                ))}
              </select>
              {selectedDriver && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Phone: {selectedDriver.phone || '—'} | Status: <span className={selectedDriver.status === 'Active' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{selectedDriver.status}</span>
                </div>
              )}
              {drivers.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">No drivers found. Add employees with category &quot;Driver&quot; in Employee Management.</p>
              )}
            </div>

            <div className="border border-border rounded-lg p-4 bg-secondary/30">
              <p className="text-sm font-semibold mb-3">Vehicle Assignment</p>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              >
                <option value="">Select a vehicle</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.serialNumber ? `(${v.serialNumber})` : ''} {v.status !== 'Active' ? `[${v.status}]` : ''}
                  </option>
                ))}
              </select>
              {selectedVehicle && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Category: {selectedVehicle.category} | Status: <span className={selectedVehicle.status === 'Active' ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>{selectedVehicle.status}</span>
                </div>
              )}
              {vehicles.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">No vehicles found. Add assets with category containing &quot;Vehicle&quot; in Asset Management.</p>
              )}
            </div>
          </div>

          {/* Section: Items List */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Delivery Items</p>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    {idx === 0 && <label className="block text-xs text-muted-foreground mb-1">Item Name</label>}
                    <input
                      type="text"
                      placeholder="e.g. White Bread Loaves"
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="block text-xs text-muted-foreground mb-1">Qty</label>}
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    {idx === 0 && <label className="block text-xs text-muted-foreground mb-1">Unit</label>}
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background text-sm"
                    >
                      <option value="pcs">Pieces</option>
                      <option value="trays">Trays</option>
                      <option value="boxes">Boxes</option>
                      <option value="kg">Kilograms</option>
                      <option value="crates">Crates</option>
                      <option value="packets">Packets</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="px-2 py-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Remove item"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Notes & Special Instructions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Delivery Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                rows={3}
                placeholder="General delivery notes..."
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Special Instructions</label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                rows={3}
                placeholder="e.g. Call before delivery, gate code, fragile items..."
              />
            </div>
          </div>

          {/* Form actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              {editingId ? 'Update Delivery' : 'Schedule Delivery'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Detail View Modal ── */}
      <Modal
        isOpen={!!showDetail}
        onClose={() => setShowDetail(null)}
        title={showDetail ? `Delivery ${showDetail.trackingNumber}` : ''}
        size="3xl"
      >
        {showDetail && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

            {/* Status bar */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusColor(showDetail.status)}`}>
                {showDetail.status}
              </span>
              <div className="flex gap-2">
                {showDetail.status !== 'Delivered' && showDetail.status !== 'Failed' && (
                  <select
                    value={showDetail.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Delivery['status'];
                      handleStatusChange(showDetail.id, newStatus);
                      setShowDetail({ ...showDetail, status: newStatus });
                    }}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Status progress */}
            <div className="flex items-center gap-1">
              {STATUSES.map((s, idx) => {
                const currentIdx = STATUSES.indexOf(showDetail.status);
                const isActive = idx <= currentIdx;
                const isFailed = showDetail.status === 'Failed';
                return (
                  <div key={s} className="flex-1">
                    <div className={`h-2 rounded-full ${isFailed && idx === currentIdx ? 'bg-red-500' : isActive ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <p className={`text-xs mt-1 text-center ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</p>
                  </div>
                );
              })}
            </div>

            {/* Delivery info grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm border border-border rounded-lg p-4">
              <div><span className="text-muted-foreground">Tracking #:</span> <span className="font-mono font-medium ml-2">{showDetail.trackingNumber}</span></div>
              <div><span className="text-muted-foreground">Scheduled:</span> <span className="font-medium ml-2">{showDetail.scheduledDate || '—'}</span></div>
              <div><span className="text-muted-foreground">Time Slot:</span> <span className="font-medium ml-2">{showDetail.timeSlot || '—'}</span></div>
              <div><span className="text-muted-foreground">Driver:</span> <span className="font-medium ml-2">{showDetail.driverName || '—'}</span></div>
              <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium ml-2">{showDetail.vehicleName || '—'}</span></div>
              <div><span className="text-muted-foreground">Items:</span> <span className="font-medium ml-2">{showDetail.items.length} item(s)</span></div>
            </div>

            {/* Customer details */}
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm font-semibold mb-3">Customer Details</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <strong className="ml-2">{showDetail.customerName || '—'}</strong></div>
                <div><span className="text-muted-foreground">Phone:</span> <strong className="ml-2">{showDetail.customerPhone || '—'}</strong></div>
                <div><span className="text-muted-foreground">Location:</span> <strong className="ml-2">{showDetail.customerLocation || '—'}</strong></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <strong className="ml-2">{showDetail.customerAddress || '—'}</strong></div>
              </div>
              {showDetail.customerGpsLat !== 0 && showDetail.customerGpsLng !== 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">GPS: {showDetail.customerGpsLat.toFixed(6)}, {showDetail.customerGpsLng.toFixed(6)}</p>
                    <a
                      href={getMapLinkUrl(showDetail.customerGpsLat, showDetail.customerGpsLng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                  <iframe
                    src={getMapUrl(showDetail.customerGpsLat, showDetail.customerGpsLng)}
                    width="100%"
                    height="200"
                    className="rounded-lg border border-border"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Items */}
            {showDetail.items.length > 0 && (
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm font-semibold mb-3">Delivery Items</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">#</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Item</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Quantity</th>
                      <th className="text-left py-2 pl-4 text-muted-foreground font-medium">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showDetail.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 pl-4 text-muted-foreground">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes */}
            {(showDetail.notes || showDetail.specialInstructions) && (
              <div className="grid grid-cols-2 gap-4">
                {showDetail.notes && (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-semibold mb-2">Delivery Notes</p>
                    <p className="text-sm text-muted-foreground">{showDetail.notes}</p>
                  </div>
                )}
                {showDetail.specialInstructions && (
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">Special Instructions</p>
                    <p className="text-sm text-yellow-700">{showDetail.specialInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <button
                onClick={() => { setShowDetail(null); handleEdit(showDetail); }}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 font-medium text-sm"
              >
                Edit Delivery
              </button>
              <button
                onClick={() => setShowDetail(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Loading */}
      {loading && <p className="text-center py-4 text-muted-foreground text-sm">Loading deliveries...</p>}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Tracking #</th>
              <th className="px-4 py-3 text-left font-semibold">Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-left font-semibold">Driver</th>
              <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold">Date / Slot</th>
              <th className="px-4 py-3 text-center font-semibold">Items</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && !loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No deliveries found</td>
              </tr>
            ) : (
              paginated.map((d) => (
                <tr key={d.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{d.trackingNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{d.customerName || '—'}</div>
                    <div className="text-xs text-muted-foreground">{d.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{d.customerLocation || '—'}</td>
                  <td className="px-4 py-3 text-sm">{d.driverName || '—'}</td>
                  <td className="px-4 py-3 text-sm">{d.vehicleName || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs">{d.scheduledDate || '—'}</div>
                    <div className="text-xs text-muted-foreground">{d.timeSlot}</div>
                  </td>
                  <td className="px-4 py-3 text-center">{d.items.length}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded font-semibold ${getStatusColor(d.status)}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setShowDetail(d)} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium">View</button>
                      <button onClick={() => handleEdit(d)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button>
                      <button onClick={() => handleDelete(d.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > perPage && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, filtered.length)} of {filtered.length} deliveries
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 border rounded-lg text-sm font-medium ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Batch Delivery Modal ── */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => { setShowBatchModal(false); setSelectedBatchIds(new Set()); }}
        title={`Batch Delivery (${pendingDeliveries.length} pending)`}
        size="3xl"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-blue-900">Select Multiple Deliveries</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Select deliveries going in the same direction and dispatch or complete them all at once. This improves rider productivity by combining trips.
            </p>
          </div>

          {/* Driver & Vehicle Selection for batch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Assign Driver</label>
              <select
                value={batchDriverId}
                onChange={(e) => setBatchDriverId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background text-sm"
              >
                <option value="">Keep existing drivers</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Assign Vehicle</label>
              <select
                value={batchVehicleId}
                onChange={(e) => setBatchVehicleId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background text-sm"
              >
                <option value="">Keep existing vehicles</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBatchIds.size === pendingDeliveries.length && pendingDeliveries.length > 0}
                onChange={selectAllBatch}
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium">Select All ({pendingDeliveries.length})</span>
            </label>
            <span className="text-xs text-muted-foreground">{selectedBatchIds.size} selected</span>
          </div>

          {/* Delivery list */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-3 py-2 w-8"></th>
                  <th className="px-3 py-2 text-left font-semibold">Tracking #</th>
                  <th className="px-3 py-2 text-left font-semibold">Customer</th>
                  <th className="px-3 py-2 text-left font-semibold">Location</th>
                  <th className="px-3 py-2 text-left font-semibold">Driver</th>
                  <th className="px-3 py-2 text-center font-semibold">Items</th>
                  <th className="px-3 py-2 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeliveries.map(d => (
                  <tr
                    key={d.id}
                    className={`border-b border-border cursor-pointer transition-colors ${selectedBatchIds.has(d.id) ? 'bg-orange-50' : 'hover:bg-secondary/50'}`}
                    onClick={() => toggleBatchSelect(d.id)}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBatchIds.has(d.id)}
                        onChange={() => toggleBatchSelect(d.id)}
                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{d.trackingNumber}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{d.customerName || '-'}</div>
                      <div className="text-xs text-muted-foreground">{d.customerPhone}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{d.customerLocation || '-'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.driverName || '-'}</td>
                    <td className="px-3 py-2 text-center">{d.items.length}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded font-semibold ${getStatusColor(d.status)}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
                {pendingDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No pending deliveries</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button
              onClick={() => { setShowBatchModal(false); setSelectedBatchIds(new Set()); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleBatchDispatch}
              disabled={selectedBatchIds.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-40"
            >
              Dispatch Selected ({selectedBatchIds.size})
            </button>
            <button
              onClick={handleBatchComplete}
              disabled={selectedBatchIds.size === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-40"
            >
              Mark Delivered ({selectedBatchIds.size})
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
