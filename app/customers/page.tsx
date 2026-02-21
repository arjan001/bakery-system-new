'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  name: string;
  type: 'Retail' | 'Wholesale' | 'Individual';
  phone: string;
  email: string;
  location: string;
  address: string;
  gpsLat: number;
  gpsLng: number;
  creditLimit: number;
  purchaseVolume: number;
  rating: number;
  status: string;
  notes: string;
  landmark: string;
  deliveryInstructions: string;
}

const emptyForm = {
  name: '',
  type: 'Retail' as Customer['type'],
  phone: '',
  email: '',
  location: '',
  address: '',
  gpsLat: 0,
  gpsLng: 0,
  creditLimit: 0,
  purchaseVolume: 0,
  rating: 5,
  status: 'Active',
  notes: '',
  landmark: '',
  deliveryInstructions: '',
};

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Customer | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) {
      setCustomers(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r.name || '') as string,
        type: (r.type || 'Retail') as Customer['type'],
        phone: (r.phone || '') as string,
        email: (r.email || '') as string,
        location: (r.location || '') as string,
        address: (r.address || '') as string,
        gpsLat: (r.gps_lat || 0) as number,
        gpsLng: (r.gps_lng || 0) as number,
        creditLimit: (r.credit_limit || 0) as number,
        purchaseVolume: (r.purchase_volume || 0) as number,
        rating: (r.rating || 0) as number,
        status: (r.status || 'Active') as string,
        notes: (r.notes || '') as string,
        landmark: (r.landmark || '') as string,
        deliveryInstructions: (r.delivery_instructions || '') as string,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset to page 1 when search/filter changes
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType]);

  // Location search using Nominatim (free, no API key)
  const searchLocation = async () => {
    if (!locationSearch.trim()) return;
    setSearchingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&countrycodes=ke&limit=5`
      );
      const data = await res.json();
      setLocationResults(
        data.map((r: Record<string, unknown>) => ({
          name: r.display_name as string,
          lat: parseFloat(r.lat as string),
          lon: parseFloat(r.lon as string),
        }))
      );
    } catch {
      setLocationResults([]);
    }
    setSearchingLocation(false);
  };

  const selectLocation = (loc: { name: string; lat: number; lon: number }) => {
    setFormData({
      ...formData,
      location: loc.name.split(',')[0],
      address: loc.name,
      gpsLat: loc.lat,
      gpsLng: loc.lon,
    });
    setLocationResults([]);
    setLocationSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = {
      name: formData.name,
      type: formData.type,
      phone: formData.phone,
      email: formData.email,
      location: formData.location,
      address: formData.address,
      gps_lat: formData.gpsLat || null,
      gps_lng: formData.gpsLng || null,
      credit_limit: formData.creditLimit,
      purchase_volume: formData.purchaseVolume,
      rating: formData.rating,
      status: formData.status,
      notes: formData.notes,
      landmark: formData.landmark,
      delivery_instructions: formData.deliveryInstructions,
    };
    try {
      if (editingId) await supabase.from('customers').update(row).eq('id', editingId);
      else await supabase.from('customers').insert(row);
      await fetchData();
    } catch { /* fallback */ }
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (c: Customer) => {
    setFormData({
      name: c.name,
      type: c.type,
      phone: c.phone,
      email: c.email,
      location: c.location,
      address: c.address,
      gpsLat: c.gpsLat,
      gpsLng: c.gpsLng,
      creditLimit: c.creditLimit,
      purchaseVolume: c.purchaseVolume,
      rating: c.rating,
      status: c.status,
      notes: c.notes,
      landmark: c.landmark,
      deliveryInstructions: c.deliveryInstructions,
    });
    setEditingId(c.id);
    setLocationResults([]);
    setLocationSearch('');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this customer?')) {
      await supabase.from('customers').delete().eq('id', id);
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const getMapUrl = (lat: number, lng: number) =>
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`;

  const getMapLinkUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`;

  const filtered = customers.filter(c => {
    const matchSearch = `${c.name} ${c.phone} ${c.location} ${c.email} ${c.landmark}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || c.type === filterType;
    return matchSearch && matchType;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedCustomers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalCustomers = customers.length;
  const wholesaleCount = customers.filter(c => c.type === 'Wholesale').length;
  const retailCount = customers.filter(c => c.type === 'Retail').length;
  const individualCount = customers.filter(c => c.type === 'Individual').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Customer Management</h1>
        <p className="text-muted-foreground">Manage customers with geo-location, segmentation, and delivery mapping</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-2xl font-bold">{totalCustomers}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Wholesale</p>
          <p className="text-2xl font-bold text-blue-600">{wholesaleCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Retail</p>
          <p className="text-2xl font-bold text-green-600">{retailCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Individual</p>
          <p className="text-2xl font-bold text-orange-600">{individualCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">With Location</p>
          <p className="text-2xl font-bold text-purple-600">{customers.filter(c => c.gpsLat).length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none w-64"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
          >
            <option value="All">All Types</option>
            <option>Retail</option>
            <option>Wholesale</option>
            <option>Individual</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData(emptyForm); setLocationResults([]); setLocationSearch(''); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + Add Customer
        </button>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); }}
        title={editingId ? 'Edit Customer' : 'New Customer'}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Customer Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Customer['type'] })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option>Retail</option>
                <option>Wholesale</option>
                <option>Individual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Credit Limit (KES)</label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Suspended</option>
              </select>
            </div>
          </div>

          {/* Location Search with Map */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <label className="block text-sm font-medium mb-2">Delivery Location</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Search location (e.g. Westlands, Nairobi)"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchLocation();
                  }
                }}
                className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
              />
              <button
                type="button"
                onClick={searchLocation}
                disabled={searchingLocation}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium disabled:opacity-50"
              >
                {searchingLocation ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Location search results with map preview */}
            {locationResults.length > 0 && (
              <div className="mb-3 border border-border rounded-lg overflow-hidden bg-background">
                <div className="p-2 bg-secondary/50 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground">Select a location from the results below:</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="space-y-1 max-h-[200px] overflow-y-auto p-2">
                    {locationResults.map((loc, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => selectLocation(loc)}
                        className="w-full text-left px-3 py-2 text-xs bg-background border border-border rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-colors"
                      >
                        <span className="font-medium">{loc.name.split(',')[0]}</span>
                        <br />
                        <span className="text-muted-foreground">{loc.name.split(',').slice(1).join(',').trim()}</span>
                        <br />
                        <span className="text-muted-foreground">GPS: {loc.lat.toFixed(5)}, {loc.lon.toFixed(5)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-l border-border">
                    <iframe
                      src={getMapUrl(locationResults[0].lat, locationResults[0].lon)}
                      width="100%"
                      height="200"
                      className="border-0"
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Location Name</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                  placeholder="e.g. Westlands"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Full Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                  placeholder="Full address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">GPS Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.gpsLat || ''}
                  onChange={(e) => setFormData({ ...formData, gpsLat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                  placeholder="-1.2921"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">GPS Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.gpsLng || ''}
                  onChange={(e) => setFormData({ ...formData, gpsLng: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                  placeholder="36.8219"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Landmark / Nearby Reference Point</label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                placeholder="e.g. Next to Sarit Centre, opposite Total petrol station"
              />
            </div>

            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Delivery Instructions</label>
              <textarea
                value={formData.deliveryInstructions}
                onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                rows={2}
                placeholder="e.g. Call on arrival, use back entrance, ask for John at reception..."
              />
            </div>

            {/* Map preview - at least 250px height */}
            {formData.gpsLat !== 0 && formData.gpsLng !== 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">
                    GPS: {formData.gpsLat.toFixed(6)}, {formData.gpsLng.toFixed(6)}
                  </p>
                  <a
                    href={getMapLinkUrl(formData.gpsLat, formData.gpsLng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Open in Google Maps
                  </a>
                </div>
                <iframe
                  src={getMapUrl(formData.gpsLat, formData.gpsLng)}
                  width="100%"
                  height="250"
                  className="rounded-lg border border-border"
                  style={{ border: 0, minHeight: '250px' }}
                  loading="lazy"
                ></iframe>
              </div>
            )}

            {formData.gpsLat === 0 && formData.gpsLng === 0 && (
              <div className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-border bg-background" style={{ minHeight: '120px' }}>
                <p className="text-sm text-muted-foreground text-center px-4">
                  Search for a location above or enter GPS coordinates to see the map preview
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              {editingId ? 'Update' : 'Create'} Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!showDetail}
        onClose={() => setShowDetail(null)}
        title={showDetail?.name || ''}
        size="3xl"
      >
        {showDetail && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Customer Info Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium ml-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    showDetail.type === 'Wholesale' ? 'bg-purple-100 text-purple-800' :
                    showDetail.type === 'Individual' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{showDetail.type}</span>
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium ml-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    showDetail.status === 'Active' ? 'bg-green-100 text-green-800' :
                    showDetail.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>{showDetail.status}</span>
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium ml-2">{showDetail.phone}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium ml-2">{showDetail.email || '\u2014'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Credit Limit:</span>
                <span className="font-medium ml-2">KES {showDetail.creditLimit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium ml-2">{showDetail.location || '\u2014'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium ml-2">{showDetail.address || '\u2014'}</span>
              </div>
            </div>

            {/* Delivery Information Section */}
            <div className="border border-border rounded-lg p-4 bg-secondary/30">
              <h3 className="text-sm font-semibold mb-3">Delivery Information</h3>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium ml-2">{showDetail.location || '\u2014'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">GPS Coordinates:</span>
                  <span className="font-medium ml-2">
                    {showDetail.gpsLat ? `${showDetail.gpsLat.toFixed(6)}, ${showDetail.gpsLng.toFixed(6)}` : '\u2014'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Full Address:</span>
                  <span className="font-medium ml-2">{showDetail.address || '\u2014'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Landmark:</span>
                  <span className="font-medium ml-2">{showDetail.landmark || '\u2014'}</span>
                </div>
                {showDetail.deliveryInstructions && (
                  <div className="col-span-2 mt-1">
                    <p className="text-muted-foreground mb-1">Delivery Instructions:</p>
                    <div className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
                      {showDetail.deliveryInstructions}
                    </div>
                  </div>
                )}
              </div>

              {/* Map in detail view - at least 300px */}
              {showDetail.gpsLat !== 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Location on Map</p>
                    <a
                      href={getMapLinkUrl(showDetail.gpsLat, showDetail.gpsLng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Open in Google Maps &rarr;
                    </a>
                  </div>
                  <iframe
                    src={getMapUrl(showDetail.gpsLat, showDetail.gpsLng)}
                    width="100%"
                    height="300"
                    className="rounded-lg border border-border"
                    style={{ border: 0, minHeight: '300px' }}
                    loading="lazy"
                  ></iframe>
                </div>
              )}
            </div>

            {showDetail.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{showDetail.notes}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t border-border">
              <button
                onClick={() => { handleEdit(showDetail); setShowDetail(null); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                Edit Customer
              </button>
              <button
                onClick={() => setShowDetail(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Table */}
      {loading && <p className="text-center py-4 text-muted-foreground text-sm">Loading...</p>}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-left font-semibold">Landmark</th>
              <th className="px-4 py-3 text-center font-semibold">GPS</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 && !loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No customers found
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((cust) => (
                <tr key={cust.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{cust.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      cust.type === 'Wholesale' ? 'bg-purple-100 text-purple-800' :
                      cust.type === 'Individual' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {cust.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{cust.phone}</td>
                  <td className="px-4 py-3 text-sm">{cust.location || '\u2014'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{cust.landmark ? (cust.landmark.length > 25 ? cust.landmark.substring(0, 25) + '...' : cust.landmark) : '\u2014'}</td>
                  <td className="px-4 py-3 text-center">
                    {cust.gpsLat ? (
                      <span className="text-green-600 text-xs font-bold" title={`${cust.gpsLat.toFixed(4)}, ${cust.gpsLng.toFixed(4)}`}>
                        Yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">\u2014</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      cust.status === 'Active' ? 'bg-green-100 text-green-800' :
                      cust.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {cust.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowDetail(cust)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(cust)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cust.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} customers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm border rounded-lg font-medium ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Footer showing total result count */}
      {filtered.length <= PAGE_SIZE && filtered.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {totalCustomers} customers
          </p>
        </div>
      )}
    </div>
  );
}
