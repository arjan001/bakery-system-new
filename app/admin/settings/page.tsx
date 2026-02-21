'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { products } from '@/lib/products';
import type { Offer } from '@/lib/products';

type SettingsTab = 'general' | 'receipt' | 'payment' | 'security' | 'backup' | 'sessions';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // ── General Settings ──
  const [general, setGeneral] = useState({
    businessName: 'SNACKOH BITES',
    tagline: 'Quality Baked Goods',
    phone: '+254 700 000 000',
    email: 'info@snackoh.com',
    address: 'Nairobi, Kenya',
    currency: 'KES',
    taxRate: 16,
    timezone: 'Africa/Nairobi',
    language: 'en',
    logoUrl: '',
  });

  // ── Receipt Settings ──
  const [receipt, setReceipt] = useState({
    showLogo: true,
    headerText: 'SNACKOH BITES',
    subHeaderText: 'Quality Baked Goods',
    footerText: 'Thank you for choosing Snackoh!',
    showTax: true,
    showCashier: true,
    showCustomer: true,
    showPaymentDetails: true,
    disclaimer: 'Goods once sold are not returnable',
    paperWidth: '80mm',
    autoPrint: false,
  });

  // ── Payment Details Settings ──
  const [paymentDetails, setPaymentDetails] = useState({
    mpesaType: 'paybill' as 'paybill' | 'till',
    paybillNumber: '',
    accountNumber: '',
    tillNumber: '',
    mpesaName: 'SNACKOH BITES',
    bankName: '',
    bankAccount: '',
    bankBranch: '',
    showOnReceipt: true,
  });

  // ── Security Settings ──
  const [security, setSecurity] = useState({
    requirePosPin: true,
    pinLength: 4,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enforceStrongPasswords: false,
    twoFactorAuth: false,
    auditLogging: true,
    ipWhitelist: '',
  });

  // ── Backup Settings ──
  const [backup, setBackup] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    lastBackup: 'Never',
    backupLocation: 'supabase',
  });

  // ── Offers ──
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerForm, setOfferForm] = useState<OfferForm>(emptyOffer);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offerRotation, setOfferRotation] = useState({ enabled: true, interval: 5 });

  const loadOffers = async () => {
    setOffersLoading(true);
    try {
      const { data, error } = await supabase.from('offers').select('*').order('sort_order', { ascending: true });
      if (!error && data) setOffers(data as Offer[]);
    } catch { /* table may not exist yet */ }

    // Load rotation settings from localStorage
    try {
      const rot = localStorage.getItem('snackoh_offer_rotation');
      if (rot) setOfferRotation(JSON.parse(rot));
    } catch { /* ignore */ }

    // Also load from localStorage as fallback
    try {
      const local = localStorage.getItem('snackoh_offers');
      if (local) {
        const parsed = JSON.parse(local) as Offer[];
        setOffers(prev => prev.length > 0 ? prev : parsed);
      }
    } catch { /* ignore */ }
    setOffersLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'offers') loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const saveOffer = async () => {
    const now = new Date().toISOString();
    const offerData: Partial<Offer> = {
      title: offerForm.title,
      description: offerForm.description,
      image_url: offerForm.image_url,
      link_url: offerForm.link_url || '/shop',
      badge_text: offerForm.badge_text || 'Limited Time',
      discount_text: offerForm.discount_text || undefined,
      product_id: offerForm.product_id || undefined,
      is_active: offerForm.is_active,
      start_date: offerForm.start_date || now,
      end_date: offerForm.end_date || undefined,
      sort_order: offerForm.sort_order,
    };

    try {
      if (editingOfferId) {
        const { error } = await supabase.from('offers').update(offerData).eq('id', editingOfferId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('offers').insert(offerData);
        if (error) throw error;
      }
    } catch {
      // Fallback to localStorage if Supabase table doesn't exist
      const localOffers = [...offers];
      if (editingOfferId) {
        const idx = localOffers.findIndex(o => o.id === editingOfferId);
        if (idx >= 0) localOffers[idx] = { ...localOffers[idx], ...offerData };
      } else {
        localOffers.push({ ...offerData, id: crypto.randomUUID(), created_at: now } as Offer);
      }
      localStorage.setItem('snackoh_offers', JSON.stringify(localOffers));
    }

    // Save rotation settings
    localStorage.setItem('snackoh_offer_rotation', JSON.stringify(offerRotation));

    setShowOfferForm(false);
    setEditingOfferId(null);
    setOfferForm(emptyOffer);
    setSavedMsg(editingOfferId ? 'Offer updated!' : 'Offer created!');
    setTimeout(() => setSavedMsg(''), 3000);
    loadOffers();
  };

  const deleteOffer = async (id: string) => {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
    } catch {
      const localOffers = offers.filter(o => o.id !== id);
      localStorage.setItem('snackoh_offers', JSON.stringify(localOffers));
    }
    setSavedMsg('Offer deleted');
    setTimeout(() => setSavedMsg(''), 3000);
    loadOffers();
  };

  const toggleOfferActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('offers').update({ is_active: !current }).eq('id', id);
      if (error) throw error;
    } catch {
      const localOffers = offers.map(o => o.id === id ? { ...o, is_active: !current } : o);
      localStorage.setItem('snackoh_offers', JSON.stringify(localOffers));
    }
    loadOffers();
  };

  const editOffer = (offer: Offer) => {
    setOfferForm({
      id: offer.id,
      title: offer.title,
      description: offer.description || '',
      image_url: offer.image_url || '',
      link_url: offer.link_url || '/shop',
      badge_text: offer.badge_text || 'Limited Time',
      discount_text: offer.discount_text || '',
      product_id: offer.product_id || '',
      is_active: offer.is_active,
      start_date: offer.start_date ? offer.start_date.slice(0, 16) : '',
      end_date: offer.end_date ? offer.end_date.slice(0, 16) : '',
      sort_order: offer.sort_order || 0,
    });
    setEditingOfferId(offer.id);
    setShowOfferForm(true);
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('snackoh_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.general) setGeneral(prev => ({ ...prev, ...parsed.general }));
        if (parsed.receipt) setReceipt(prev => ({ ...prev, ...parsed.receipt }));
        if (parsed.paymentDetails) setPaymentDetails(prev => ({ ...prev, ...parsed.paymentDetails }));
        if (parsed.security) setSecurity(prev => ({ ...prev, ...parsed.security }));
        if (parsed.backup) setBackup(prev => ({ ...prev, ...parsed.backup }));
      }
    } catch { /* ignore */ }
  }, []);

  const saveSettings = () => {
    setSaving(true);
    localStorage.setItem('snackoh_settings', JSON.stringify({ general, receipt, paymentDetails, security, backup }));
    setTimeout(() => { setSaving(false); setSavedMsg('Settings saved successfully!'); setTimeout(() => setSavedMsg(''), 3000); }, 500);
  };

  // ── Active Sessions (from Supabase) ──
  const [sessions, setSessions] = useState<{ id: string; email: string; lastActive: string; device: string }[]>([]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessions([{ id: data.session.access_token.slice(-8), email: data.session.user.email || 'admin', lastActive: new Date().toLocaleString(), device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop' }]);
      }
    });
  }, []);

  const tabs: { key: SettingsTab; label: string; icon: string; tip: string }[] = [
    { key: 'general', label: 'General', icon: '🏢', tip: 'Business name, contact, tax & currency' },
    { key: 'offers', label: 'Offers', icon: '🏷️', tip: 'Manage promotional offers & banner content' },
    { key: 'receipt', label: 'Receipt', icon: '🧾', tip: 'Receipt layout, header, footer & printing' },
    { key: 'payment', label: 'Payment', icon: '💳', tip: 'M-Pesa paybill/till & bank details for receipts' },
    { key: 'security', label: 'Security', icon: '🔒', tip: 'PIN policy, sessions, audit & access control' },
    { key: 'backup', label: 'Backup', icon: '💾', tip: 'Auto-backup schedule & data retention' },
    { key: 'sessions', label: 'Sessions', icon: '👤', tip: 'Active login sessions & devices' },
  ];

  const inputCls = 'w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background';
  const labelCls = 'block text-xs text-muted-foreground mb-1 font-medium';

  // Products for the offer form dropdown
  const saleProducts = products.filter(p => p.isSale || p.inStock);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2">System Settings</h1>
          <p className="text-muted-foreground">Configure system preferences, receipt printing, payment details, security & backups</p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-green-600 font-medium">{savedMsg}</span>}
          <button onClick={saveSettings} disabled={saving} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} title={tab.tip} className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL ── */}
      {activeTab === 'general' && (
        <div className="max-w-2xl space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Business Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Business Name</label><input type="text" value={general.businessName} onChange={e => setGeneral({ ...general, businessName: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Tagline</label><input type="text" value={general.tagline} onChange={e => setGeneral({ ...general, tagline: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input type="tel" value={general.phone} onChange={e => setGeneral({ ...general, phone: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Email</label><input type="email" value={general.email} onChange={e => setGeneral({ ...general, email: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Address</label><input type="text" value={general.address} onChange={e => setGeneral({ ...general, address: e.target.value })} className={inputCls} /></div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Regional & Tax</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelCls}>Currency</label><select value={general.currency} onChange={e => setGeneral({ ...general, currency: e.target.value })} className={inputCls}><option>KES</option><option>USD</option><option>EUR</option><option>GBP</option></select></div>
              <div><label className={labelCls}>Tax Rate (%)</label><input type="number" value={general.taxRate} onChange={e => setGeneral({ ...general, taxRate: parseFloat(e.target.value) || 0 })} className={inputCls} /></div>
              <div><label className={labelCls}>Timezone</label><select value={general.timezone} onChange={e => setGeneral({ ...general, timezone: e.target.value })} className={inputCls}><option>Africa/Nairobi</option><option>UTC</option><option>Europe/London</option></select></div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Logo</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center text-2xl font-black text-primary border-2 border-dashed border-border">
                {general.logoUrl ? <img src={general.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" /> : 'S'}
              </div>
              <div>
                <input type="text" placeholder="Logo URL (or upload to Supabase Storage)" value={general.logoUrl} onChange={e => setGeneral({ ...general, logoUrl: e.target.value })} className={`${inputCls} w-80`} />
                <p className="text-xs text-muted-foreground mt-1">Paste a URL or upload to Supabase Storage bucket</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OFFERS ── */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {/* Rotation Settings */}
          <div className="border border-border rounded-lg p-6 bg-card max-w-2xl">
            <h3 className="font-semibold mb-4">Banner Rotation Settings</h3>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3">
                <span className="text-sm font-medium">Auto-rotate banners</span>
                <button type="button" onClick={() => setOfferRotation({ ...offerRotation, enabled: !offerRotation.enabled })} className={`w-10 h-5 rounded-full transition-colors ${offerRotation.enabled ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${offerRotation.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>
              <div className="flex items-center gap-2">
                <label className={labelCls + ' mb-0'}>Interval (seconds)</label>
                <input type="number" min={2} max={30} value={offerRotation.interval} onChange={e => setOfferRotation({ ...offerRotation, interval: parseInt(e.target.value) || 5 })} className={`${inputCls} w-20`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Active offers will rotate automatically in the hero banner on the customer website. Product offers (items on sale) are also included dynamically.</p>
          </div>

          {/* Offer List + Add */}
          <div className="flex items-center justify-between max-w-4xl">
            <div>
              <h3 className="font-semibold">Promotional Offers</h3>
              <p className="text-xs text-muted-foreground">Create custom banner offers for the customer website. Products currently on sale are automatically included.</p>
            </div>
            <button onClick={() => { setOfferForm(emptyOffer); setEditingOfferId(null); setShowOfferForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium text-sm">
              + Add Offer
            </button>
          </div>

          {/* Offer Form Modal */}
          {showOfferForm && (
            <div className="border border-primary/30 rounded-lg p-6 bg-primary/5 max-w-2xl space-y-4">
              <h4 className="font-semibold text-sm">{editingOfferId ? 'Edit Offer' : 'New Offer'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={labelCls}>Offer Title *</label><input type="text" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} placeholder="e.g. 25% Off All Cakes" className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Description</label><textarea value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} placeholder="Brief description shown under the title" className={`${inputCls} h-20 resize-none`} /></div>
                <div className="col-span-2"><label className={labelCls}>Banner Image URL</label><input type="text" value={offerForm.image_url} onChange={e => setOfferForm({ ...offerForm, image_url: e.target.value })} placeholder="https://images.unsplash.com/... or upload to storage" className={inputCls} /></div>
                {offerForm.image_url && (
                  <div className="col-span-2">
                    <div className="rounded-lg overflow-hidden h-32 bg-gray-100">
                      <img src={offerForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                <div><label className={labelCls}>Badge Text</label><input type="text" value={offerForm.badge_text} onChange={e => setOfferForm({ ...offerForm, badge_text: e.target.value })} placeholder="e.g. Limited Time, Weekend Special" className={inputCls} /></div>
                <div><label className={labelCls}>Discount Text</label><input type="text" value={offerForm.discount_text} onChange={e => setOfferForm({ ...offerForm, discount_text: e.target.value })} placeholder="e.g. 25% OFF, Buy 1 Get 1 Free" className={inputCls} /></div>
                <div><label className={labelCls}>Link URL</label><input type="text" value={offerForm.link_url} onChange={e => setOfferForm({ ...offerForm, link_url: e.target.value })} placeholder="/shop or /shop?category=Cake" className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Link to Product (optional)</label>
                  <select value={offerForm.product_id} onChange={e => setOfferForm({ ...offerForm, product_id: e.target.value })} className={inputCls}>
                    <option value="">-- No product link --</option>
                    {saleProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category}) — KES {p.price}</option>
                    ))}
                  </select>
                </div>
                <div><label className={labelCls}>Start Date</label><input type="datetime-local" value={offerForm.start_date} onChange={e => setOfferForm({ ...offerForm, start_date: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>End Date</label><input type="datetime-local" value={offerForm.end_date} onChange={e => setOfferForm({ ...offerForm, end_date: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Sort Order</label><input type="number" value={offerForm.sort_order} onChange={e => setOfferForm({ ...offerForm, sort_order: parseInt(e.target.value) || 0 })} className={inputCls} /></div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3">
                    <span className="text-sm font-medium">Active</span>
                    <button type="button" onClick={() => setOfferForm({ ...offerForm, is_active: !offerForm.is_active })} className={`w-10 h-5 rounded-full transition-colors ${offerForm.is_active ? 'bg-primary' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${offerForm.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveOffer} disabled={!offerForm.title} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium text-sm disabled:opacity-50">
                  {editingOfferId ? 'Update Offer' : 'Create Offer'}
                </button>
                <button onClick={() => { setShowOfferForm(false); setEditingOfferId(null); setOfferForm(emptyOffer); }} className="px-5 py-2 border border-border rounded-lg hover:bg-secondary text-sm font-medium">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing Offers */}
          <div className="max-w-4xl space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Custom Offers</h4>
            {offersLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading offers...</p>
            ) : offers.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground text-sm">No custom offers yet. Click &quot;+ Add Offer&quot; to create your first promotional banner.</p>
              </div>
            ) : (
              offers.map(offer => (
                <div key={offer.id} className={`border rounded-lg p-4 flex items-center gap-4 ${offer.is_active ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-70'}`}>
                  {offer.image_url ? (
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 text-2xl">🏷️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{offer.title}</p>
                      {offer.badge_text && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">{offer.badge_text}</span>}
                      {offer.is_active ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">Active</span> : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">Inactive</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{offer.description || 'No description'}</p>
                    {offer.discount_text && <p className="text-xs font-bold text-orange-600 mt-0.5">{offer.discount_text}</p>}
                    {offer.product_id && <p className="text-[10px] text-muted-foreground mt-0.5">Linked product: {products.find(p => p.id === offer.product_id)?.name || offer.product_id}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleOfferActive(offer.id, offer.is_active)} className={`px-3 py-1.5 rounded text-xs font-medium ${offer.is_active ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                      {offer.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => editOffer(offer)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium">Edit</button>
                    <button onClick={() => deleteOffer(offer.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-medium">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Auto-generated Product Offers Preview */}
          <div className="max-w-4xl space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Auto-Generated Product Banners</h4>
            <p className="text-xs text-muted-foreground">These banners are automatically generated from products that have sale prices. They rotate alongside your custom offers.</p>
            <div className="space-y-2">
              {products.filter(p => p.isSale && p.originalPrice).map(p => (
                <div key={p.id} className="border border-border rounded-lg p-3 flex items-center gap-3 bg-card">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category} — <span className="text-orange-600 font-bold">KES {p.price}</span> <span className="line-through text-gray-400">KES {p.originalPrice}</span> — Save {Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)}%</p>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold shrink-0">Auto</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIPT ── */}
      {activeTab === 'receipt' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4">Receipt Content</h3>
              <div className="space-y-3">
                <div><label className={labelCls}>Header Text (Business Name on Receipt)</label><input type="text" value={receipt.headerText} onChange={e => setReceipt({ ...receipt, headerText: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Sub-Header</label><input type="text" value={receipt.subHeaderText} onChange={e => setReceipt({ ...receipt, subHeaderText: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Footer Message</label><input type="text" value={receipt.footerText} onChange={e => setReceipt({ ...receipt, footerText: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Disclaimer</label><input type="text" value={receipt.disclaimer} onChange={e => setReceipt({ ...receipt, disclaimer: e.target.value })} className={inputCls} /></div>
              </div>
            </div>
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4">Receipt Options</h3>
              <div className="space-y-3">
                {[
                  { key: 'showLogo', label: 'Show logo on receipt' },
                  { key: 'showTax', label: 'Show tax breakdown' },
                  { key: 'showCashier', label: 'Show cashier name' },
                  { key: 'showCustomer', label: 'Show customer name' },
                  { key: 'showPaymentDetails', label: 'Show payment details (Paybill/Till)' },
                  { key: 'autoPrint', label: 'Auto-print after sale' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">{opt.label}</span>
                    <button type="button" onClick={() => setReceipt({ ...receipt, [opt.key]: !receipt[opt.key as keyof typeof receipt] })} className={`w-10 h-5 rounded-full transition-colors ${receipt[opt.key as keyof typeof receipt] ? 'bg-primary' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${receipt[opt.key as keyof typeof receipt] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                ))}
                <div><label className={labelCls}>Paper Width</label><select value={receipt.paperWidth} onChange={e => setReceipt({ ...receipt, paperWidth: e.target.value })} className={inputCls}><option>58mm</option><option>80mm</option></select></div>
              </div>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Receipt Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-[300px] mx-auto font-mono text-[11px] shadow-sm">
              <div className="text-center mb-2">
                <p className="text-sm font-black">{receipt.headerText}</p>
                <p className="text-[10px]">{receipt.subHeaderText}</p>
                <p className="text-[10px]">{general.phone}</p>
                <p className="text-[10px]">{general.address}</p>
                <hr className="border-dashed my-2" />
                <p className="text-[10px]">Receipt: SNK-SAMPLE</p>
                <p className="text-[10px]">{new Date().toLocaleString()}</p>
                {receipt.showCashier && <p className="text-[10px]">Cashier: John Mwangi</p>}
                {receipt.showCustomer && <p className="text-[10px]">Customer: Walk-in</p>}
              </div>
              <hr className="border-dashed my-2" />
              <div className="space-y-1">
                <div className="flex justify-between"><span>White Bread x2</span><span>400</span></div>
                <div className="flex justify-between"><span>Croissant x3</span><span>450</span></div>
              </div>
              <hr className="border-dashed my-2" />
              <div className="flex justify-between"><span>Subtotal:</span><span>850</span></div>
              {receipt.showTax && <div className="flex justify-between"><span>VAT ({general.taxRate}%):</span><span>{Math.round(850 * general.taxRate / 100)}</span></div>}
              <div className="flex justify-between font-bold text-xs mt-1"><span>TOTAL:</span><span>{general.currency} {850 + Math.round(850 * general.taxRate / 100)}</span></div>
              <hr className="border-dashed my-2" />
              <div className="flex justify-between"><span>Cash:</span><span>1000</span></div>
              <div className="flex justify-between"><span>Change:</span><span>{1000 - 850 - Math.round(850 * general.taxRate / 100)}</span></div>

              {/* Payment Details Preview */}
              {receipt.showPaymentDetails && paymentDetails.showOnReceipt && (
                <>
                  <hr className="border-dashed my-2" />
                  <div className="text-center text-[10px]">
                    <p className="font-bold mb-0.5">Payment Info:</p>
                    {paymentDetails.mpesaType === 'paybill' && paymentDetails.paybillNumber && (
                      <>
                        <p>M-Pesa Paybill: {paymentDetails.paybillNumber}</p>
                        {paymentDetails.accountNumber && <p>Account: {paymentDetails.accountNumber}</p>}
                      </>
                    )}
                    {paymentDetails.mpesaType === 'till' && paymentDetails.tillNumber && (
                      <p>M-Pesa Till: {paymentDetails.tillNumber}</p>
                    )}
                    {paymentDetails.mpesaName && <p>Name: {paymentDetails.mpesaName}</p>}
                  </div>
                </>
              )}

              <hr className="border-dashed my-2" />
              <div className="text-center text-[10px]">
                <p>{receipt.footerText}</p>
                <p>{receipt.disclaimer}</p>
                <p className="font-bold mt-1">*** {receipt.headerText} ***</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT DETAILS ── */}
      {activeTab === 'payment' && (
        <div className="max-w-2xl space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">M-Pesa Payment Details</h3>
            <p className="text-sm text-muted-foreground mb-4">Configure your M-Pesa payment details. These will appear on receipts so customers know where to pay.</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>M-Pesa Type</label>
                <div className="flex gap-3">
                  {(['paybill', 'till'] as const).map(type => (
                    <button key={type} onClick={() => setPaymentDetails({ ...paymentDetails, mpesaType: type })} className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${paymentDetails.mpesaType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                      {type === 'paybill' ? 'Paybill Number' : 'Till Number (Buy Goods)'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentDetails.mpesaType === 'paybill' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Paybill Number</label>
                    <input type="text" placeholder="e.g. 522533" value={paymentDetails.paybillNumber} onChange={e => setPaymentDetails({ ...paymentDetails, paybillNumber: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Account Number</label>
                    <input type="text" placeholder="e.g. SNK001" value={paymentDetails.accountNumber} onChange={e => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })} className={inputCls} />
                  </div>
                </div>
              )}

              {paymentDetails.mpesaType === 'till' && (
                <div>
                  <label className={labelCls}>Till Number</label>
                  <input type="text" placeholder="e.g. 5143433" value={paymentDetails.tillNumber} onChange={e => setPaymentDetails({ ...paymentDetails, tillNumber: e.target.value })} className={inputCls} />
                </div>
              )}

              <div>
                <label className={labelCls}>M-Pesa Registered Name</label>
                <input type="text" placeholder="e.g. SNACKOH BITES" value={paymentDetails.mpesaName} onChange={e => setPaymentDetails({ ...paymentDetails, mpesaName: e.target.value })} className={inputCls} />
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Show on Receipt</p>
                  <p className="text-xs text-muted-foreground">Display M-Pesa payment details on printed receipts</p>
                </div>
                <button type="button" onClick={() => setPaymentDetails({ ...paymentDetails, showOnReceipt: !paymentDetails.showOnReceipt })} className={`w-10 h-5 rounded-full transition-colors ${paymentDetails.showOnReceipt ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${paymentDetails.showOnReceipt ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
          </div>

          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Bank Details (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-4">For bank transfer payments.</p>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelCls}>Bank Name</label><input type="text" placeholder="e.g. Equity Bank" value={paymentDetails.bankName} onChange={e => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Account Number</label><input type="text" placeholder="Account number" value={paymentDetails.bankAccount} onChange={e => setPaymentDetails({ ...paymentDetails, bankAccount: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Branch</label><input type="text" placeholder="Branch name" value={paymentDetails.bankBranch} onChange={e => setPaymentDetails({ ...paymentDetails, bankBranch: e.target.value })} className={inputCls} /></div>
            </div>
          </div>

          {/* Preview of how it looks on receipt */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Receipt Payment Info Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-[300px] mx-auto font-mono text-[11px] shadow-sm">
              <div className="text-center">
                <p className="font-bold mb-1">--- Payment Info ---</p>
                {paymentDetails.mpesaType === 'paybill' && paymentDetails.paybillNumber ? (
                  <>
                    <p>M-Pesa Paybill: <strong>{paymentDetails.paybillNumber}</strong></p>
                    {paymentDetails.accountNumber && <p>Account: <strong>{paymentDetails.accountNumber}</strong></p>}
                  </>
                ) : paymentDetails.mpesaType === 'till' && paymentDetails.tillNumber ? (
                  <p>M-Pesa Till: <strong>{paymentDetails.tillNumber}</strong></p>
                ) : (
                  <p className="text-gray-400 italic">No M-Pesa details configured</p>
                )}
                {paymentDetails.mpesaName && <p>Name: {paymentDetails.mpesaName}</p>}
                {paymentDetails.bankName && (
                  <>
                    <hr className="border-dashed my-1" />
                    <p>Bank: {paymentDetails.bankName}</p>
                    {paymentDetails.bankAccount && <p>A/C: {paymentDetails.bankAccount}</p>}
                    {paymentDetails.bankBranch && <p>Branch: {paymentDetails.bankBranch}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY ── */}
      {activeTab === 'security' && (
        <div className="max-w-2xl space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">POS Authentication</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Require PIN for POS login</p><p className="text-xs text-muted-foreground">Cashiers must enter a PIN before accessing POS</p></div>
                <button type="button" onClick={() => setSecurity({ ...security, requirePosPin: !security.requirePosPin })} className={`w-10 h-5 rounded-full transition-colors ${security.requirePosPin ? 'bg-primary' : 'bg-gray-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${security.requirePosPin ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>PIN Length</label><select value={security.pinLength} onChange={e => setSecurity({ ...security, pinLength: parseInt(e.target.value) })} className={inputCls}><option value={4}>4 digits</option><option value={6}>6 digits</option></select></div>
                <div><label className={labelCls}>Max Login Attempts</label><input type="number" value={security.maxLoginAttempts} onChange={e => setSecurity({ ...security, maxLoginAttempts: parseInt(e.target.value) || 5 })} className={inputCls} /></div>
              </div>
            </div>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Session & Access</h3>
            <div className="space-y-3">
              <div><label className={labelCls}>Session Timeout (minutes)</label><input type="number" value={security.sessionTimeout} onChange={e => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) || 30 })} className={`${inputCls} max-w-xs`} /></div>
              {[
                { key: 'enforceStrongPasswords', label: 'Enforce Strong Passwords', desc: 'Require uppercase, lowercase, number & special char' },
                { key: 'twoFactorAuth', label: 'Two-Factor Authentication', desc: 'Require 2FA for admin accounts' },
                { key: 'auditLogging', label: 'Audit Logging', desc: 'Log all user actions for compliance' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div>
                  <button type="button" onClick={() => setSecurity({ ...security, [opt.key]: !security[opt.key as keyof typeof security] })} className={`w-10 h-5 rounded-full transition-colors ${security[opt.key as keyof typeof security] ? 'bg-primary' : 'bg-gray-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${security[opt.key as keyof typeof security] ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BACKUP ── */}
      {activeTab === 'backup' && (
        <div className="max-w-2xl space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Automatic Backup</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Enable Auto-Backup</p><p className="text-xs text-muted-foreground">Automatically backup data on schedule</p></div>
                <button type="button" onClick={() => setBackup({ ...backup, autoBackup: !backup.autoBackup })} className={`w-10 h-5 rounded-full transition-colors ${backup.autoBackup ? 'bg-primary' : 'bg-gray-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${backup.autoBackup ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelCls}>Frequency</label><select value={backup.backupFrequency} onChange={e => setBackup({ ...backup, backupFrequency: e.target.value })} className={inputCls}><option>hourly</option><option>daily</option><option>weekly</option><option>monthly</option></select></div>
                <div><label className={labelCls}>Time</label><input type="time" value={backup.backupTime} onChange={e => setBackup({ ...backup, backupTime: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Retention (days)</label><input type="number" value={backup.retentionDays} onChange={e => setBackup({ ...backup, retentionDays: parseInt(e.target.value) || 30 })} className={inputCls} /></div>
              </div>
            </div>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Backup Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg"><p className="text-xs text-muted-foreground">Last Backup</p><p className="font-bold">{backup.lastBackup}</p></div>
              <div className="p-4 bg-secondary rounded-lg"><p className="text-xs text-muted-foreground">Storage</p><p className="font-bold capitalize">{backup.backupLocation}</p></div>
            </div>
            <button className="mt-4 px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm font-medium">Run Manual Backup Now</button>
          </div>
        </div>
      )}

      {/* ── SESSIONS ── */}
      {activeTab === 'sessions' && (
        <div className="max-w-2xl space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Active Sessions</h3>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active sessions detected</p>
              ) : sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">●</div>
                    <div>
                      <p className="text-sm font-medium">{s.email}</p>
                      <p className="text-xs text-muted-foreground">{s.device} &bull; Last active: {s.lastActive}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Current</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-2">Session Management</h3>
            <p className="text-sm text-muted-foreground mb-4">Sign out from all other devices and sessions.</p>
            <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium">Sign Out All Other Sessions</button>
          </div>
        </div>
      )}
    </div>
  );
}
