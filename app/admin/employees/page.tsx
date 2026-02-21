'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';
import { mapToDb } from '@/lib/db-utils';

interface Certificate {
  id: string;
  name: string;
  number: string;
  issueDate: string;
  expiryDate: string;
}

interface Employee {
  id: string;
  employeeIdNumber: string;
  firstName: string;
  lastName: string;
  designation: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
  email: string;
  phone: string;
  department: string;
  role: string;
  category: 'Baker' | 'Driver' | 'Sales' | 'Admin' | 'Quality' | 'Packer' | 'Supervisor' | 'Manager' | 'Rider' | 'Cleaner' | string;
  hireDate: string;
  status: 'Active' | 'Inactive' | 'Leave' | 'Probation';
  nextOfKin: string;
  nextOfKinPhone: string;
  address: string;
  idNumber: string;
  profilePhotoUrl: string;
  driverLicenseId: string;
  driverLicenseExpiry: string;
  hygieneCertNo: string;
  hygieneCertExpiry: string;
  certificates: Certificate[];
  bankName: string;
  bankAccountNo: string;
  nhifNo: string;
  nssfNo: string;
  kraPin: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
  systemAccess: boolean;
  loginEmail: string;
  loginRole: 'Admin' | 'Baker' | 'Driver' | 'Sales' | 'Viewer';
  permissions: string[];
}

function dbToEmployee(row: Record<string, unknown>): Employee {
  let parsedCerts: Certificate[] = [];
  if (row.certificates) {
    try {
      parsedCerts = typeof row.certificates === 'string'
        ? JSON.parse(row.certificates as string)
        : (row.certificates as Certificate[]);
    } catch { parsedCerts = []; }
  }
  let parsedPermissions: string[] = [];
  if (row.permissions) {
    try {
      parsedPermissions = typeof row.permissions === 'string'
        ? JSON.parse(row.permissions as string)
        : (row.permissions as string[]);
    } catch { parsedPermissions = []; }
  }
  return {
    id: row.id as string,
    employeeIdNumber: (row.employee_id_number as string) || '',
    firstName: (row.first_name as string) || '',
    lastName: (row.last_name as string) || '',
    designation: (row.designation as Employee['designation']) || 'Mr',
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    department: (row.department as string) || '',
    role: (row.role as string) || '',
    category: (row.category as Employee['category']) || 'Baker',
    hireDate: (row.hire_date as string) || '',
    status: (row.status as Employee['status']) || 'Active',
    nextOfKin: (row.next_of_kin as string) || '',
    nextOfKinPhone: (row.next_of_kin_phone as string) || '',
    address: (row.address as string) || '',
    idNumber: (row.id_number as string) || '',
    profilePhotoUrl: (row.profile_photo_url as string) || '',
    driverLicenseId: (row.driver_license_id as string) || '',
    driverLicenseExpiry: (row.driver_license_expiry as string) || '',
    hygieneCertNo: (row.hygiene_cert_no as string) || '',
    hygieneCertExpiry: (row.hygiene_cert_expiry as string) || '',
    certificates: parsedCerts,
    bankName: (row.bank_name as string) || '',
    bankAccountNo: (row.bank_account_no as string) || '',
    nhifNo: (row.nhif_no as string) || '',
    nssfNo: (row.nssf_no as string) || '',
    kraPin: (row.kra_pin as string) || '',
    emergencyContact: (row.emergency_contact as string) || '',
    emergencyPhone: (row.emergency_phone as string) || '',
    notes: (row.notes as string) || '',
    systemAccess: (row.system_access as boolean) || false,
    loginEmail: (row.login_email as string) || '',
    loginRole: (row.login_role as Employee['loginRole']) || 'Viewer',
    permissions: parsedPermissions,
  };
}

function generateEmployeeId(category: string): string {
  const prefix = category.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${timestamp}${random}`;
}

function maskValue(value: string): string {
  if (!value) return '---';
  if (value.length <= 4) return '****';
  return '****' + value.slice(-4);
}

function isExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30 && diffDays >= 0;
}

function isExpired(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const ALL_PERMISSIONS = [
  'View Dashboard',
  'Manage Orders',
  'Manage Inventory',
  'Manage Employees',
  'Manage Customers',
  'Manage Deliveries',
  'View Reports',
  'Manage Recipes',
  'Manage Pricing',
  'Manage Purchases',
  'System Settings',
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    const empList = (!error && data && data.length > 0)
      ? data.map(r => dbToEmployee(r as Record<string, unknown>))
      : [];

    // Also fetch Supabase Auth users who may not be in employees table (e.g. super admins)
    try {
      const { data: authUsersResponse } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (authUsersResponse && authUsersResponse.length > 0) {
        const existingEmails = new Set(empList.map(e => (e.loginEmail || e.email || '').toLowerCase()).filter(Boolean));
        for (const authUser of authUsersResponse) {
          const email = ((authUser.email || '') as string).toLowerCase();
          if (email && !existingEmails.has(email)) {
            const meta = (authUser.user_metadata || authUser.raw_user_meta_data || {}) as Record<string, unknown>;
            const fullName = (meta.full_name || authUser.full_name || email.split('@')[0] || '') as string;
            const nameParts = fullName.split(' ');
            empList.push({
              ...emptyForm,
              id: authUser.id as string,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: email,
              role: (meta.role || authUser.role || 'Super Admin') as string,
              category: 'Admin',
              department: 'Administration',
              status: 'Active',
              systemAccess: true,
              loginEmail: email,
              loginRole: 'Admin',
              permissions: [...ALL_PERMISSIONS],
            });
            existingEmails.add(email);
          }
        }
      }
    } catch {
      // users table may not exist or not be accessible
    }

    setEmployees(empList);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // Fetch employee categories from database
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase.from('employee_categories').select('name').order('name');
        if (!error && data && data.length > 0) {
          const dbCategories = data.map((c: { name: string }) => c.name);
          setCategories(prev => {
            const merged = new Set([...prev, ...dbCategories]);
            return Array.from(merged).sort();
          });
        }
      } catch {
        // employee_categories table may not exist yet, use defaults
      }
    }
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setNewCategoryName('');
      return;
    }
    // Save to database
    try {
      await supabase.from('employee_categories').insert({ name: trimmed });
    } catch {
      // Table may not exist, just add locally
    }
    setCategories(prev => [...prev, trimmed].sort());
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'employment' | 'certificates' | 'payroll' | 'systemAccess'>('personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const itemsPerPage = 10;

  const emptyForm: Employee = {
    id: '',
    employeeIdNumber: '',
    firstName: '',
    lastName: '',
    designation: 'Mr',
    email: '',
    phone: '',
    department: 'Production',
    role: '',
    category: 'Baker',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    nextOfKin: '',
    nextOfKinPhone: '',
    address: '',
    idNumber: '',
    profilePhotoUrl: '',
    driverLicenseId: '',
    driverLicenseExpiry: '',
    hygieneCertNo: '',
    hygieneCertExpiry: '',
    certificates: [],
    bankName: '',
    bankAccountNo: '',
    nhifNo: '',
    nssfNo: '',
    kraPin: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    systemAccess: false,
    loginEmail: '',
    loginRole: 'Viewer',
    permissions: [],
  };

  const [formData, setFormData] = useState<Employee>(emptyForm);
  const [newCert, setNewCert] = useState({ name: '', number: '', issueDate: '', expiryDate: '' });
  const [loginPassword, setLoginPassword] = useState('');

  const departments = ['Production', 'Sales', 'Delivery', 'Administration', 'Quality Control', 'Packaging', 'Cleaning'];
  const [categories, setCategories] = useState<string[]>(['Baker', 'Driver', 'Sales', 'Admin', 'Quality', 'Packer', 'Supervisor', 'Manager', 'Rider', 'Cleaner']);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const designations: Employee['designation'][] = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'];
  const loginRoles: Employee['loginRole'][] = ['Admin', 'Baker', 'Driver', 'Sales', 'Viewer'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (autoGenerateId && !editingId && !dataToSave.employeeIdNumber) {
      dataToSave.employeeIdNumber = generateEmployeeId(dataToSave.category);
    }
    const dbRow = mapToDb(dataToSave as unknown as Record<string, unknown>, ['id', 'certificates', 'permissions']);
    // Store certificates and permissions as JSON strings
    (dbRow as Record<string, unknown>)['certificates'] = JSON.stringify(dataToSave.certificates);
    (dbRow as Record<string, unknown>)['permissions'] = JSON.stringify(dataToSave.permissions);
    try {
      if (editingId) {
        const { error } = await supabase.from('employees').update(dbRow).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('employees').insert(dbRow);
        if (error) throw error;
      }

      // Create Supabase Auth user if system access is enabled and password is provided
      if (dataToSave.systemAccess && loginPassword && dataToSave.loginEmail) {
        try {
          const { error: signUpError } = await supabase.auth.signUp({
            email: dataToSave.loginEmail,
            password: loginPassword,
            options: {
              data: {
                full_name: `${dataToSave.firstName} ${dataToSave.lastName}`.trim(),
                role: dataToSave.loginRole,
              },
            },
          });
          if (signUpError && !signUpError.message.includes('already registered')) {
            console.error('Auth user creation error:', signUpError.message);
          }
        } catch (authErr) {
          console.error('Auth creation failed:', authErr);
        }
      }

      await fetchEmployees();
    } catch (err) {
      console.error('Employee save error:', err);
      if (editingId) {
        setEmployees(employees.map(emp => emp.id === editingId ? { ...dataToSave, id: editingId } : emp));
      } else {
        setEmployees([...employees, { ...dataToSave, id: Date.now().toString() }]);
      }
    }
    setEditingId(null);
    setLoginPassword('');
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setNewCert({ name: '', number: '', issueDate: '', expiryDate: '' });
    setActiveFormTab('personal');
    setAutoGenerateId(true);
    setLoginPassword('');
  };

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
    setActiveFormTab('personal');
    setAutoGenerateId(!emp.employeeIdNumber);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
      } catch (err) { console.error('Delete error:', err); }
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const handleAddCert = () => {
    if (newCert.name && newCert.number) {
      setFormData({
        ...formData,
        certificates: [
          ...formData.certificates,
          { ...newCert, id: Date.now().toString() },
        ],
      });
      setNewCert({ name: '', number: '', issueDate: '', expiryDate: '' });
    }
  };

  const handleRemoveCert = (certId: string) => {
    setFormData({
      ...formData,
      certificates: formData.certificates.filter(c => c.id !== certId),
    });
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.role} ${emp.employeeIdNumber}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'All' || emp.category === filterCategory;
    const matchDepartment = filterDepartment === 'All' || emp.department === filterDepartment;
    return matchSearch && matchCategory && matchDepartment;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory, filterDepartment]);

  const activeCount = employees.filter(e => e.status === 'Active').length;
  const driverCount = employees.filter(e => e.category === 'Driver').length;
  const bakerCount = employees.filter(e => e.category === 'Baker').length;

  const formTabs = ['personal', 'employment', 'certificates', 'payroll', 'systemAccess'] as const;
  const formTabLabels: Record<string, string> = {
    personal: 'Personal',
    employment: 'Employment',
    certificates: 'Certificates',
    payroll: 'Payroll',
    systemAccess: 'System Access',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">Employee Management (HR)</h1>
        <p className="text-muted-foreground">Full HR system -- manage profiles, certificates, payroll details, system access, and compliance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Bakers</p>
          <p className="text-2xl font-bold text-amber-600">{bakerCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Drivers</p>
          <p className="text-2xl font-bold text-blue-600">{driverCount}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none w-64"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 font-medium whitespace-nowrap"
          >
            + Add Category
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              resetForm();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium whitespace-nowrap"
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* Employee Form Modal */}
      <Modal isOpen={showForm} onClose={closeModal} title={editingId ? 'Edit Employee' : 'Onboard New Employee'} size="3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form Tabs */}
          <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
            {formTabs.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFormTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFormTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {formTabLabels[tab]}
              </button>
            ))}
          </div>

          <div className="max-h-[28rem] overflow-y-auto space-y-4 pr-1">
            {/* Personal Tab */}
            {activeFormTab === 'personal' && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Title / Designation</label>
                    <select value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value as Employee['designation'] })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required>
                      {designations.map(des => <option key={des} value={des}>{des}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">First Name</label>
                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Last Name</label>
                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Profile Photo URL</label>
                    <input type="url" value={formData.profilePhotoUrl} onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="https://..." />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">National ID Number</label>
                    <input type="text" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium mb-3">Next of Kin / Emergency Contacts</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Next of Kin Name</label>
                      <input type="text" value={formData.nextOfKin} onChange={(e) => setFormData({ ...formData, nextOfKin: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Next of Kin Phone</label>
                      <input type="tel" value={formData.nextOfKinPhone} onChange={(e) => setFormData({ ...formData, nextOfKinPhone: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Emergency Contact Name</label>
                      <input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Emergency Contact Phone</label>
                      <input type="tel" value={formData.emergencyPhone} onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Employment Tab */}
            {activeFormTab === 'employment' && (
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-secondary/30">
                  <p className="text-sm font-medium mb-3">Employee ID</p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoGenerateId}
                        onChange={(e) => {
                          setAutoGenerateId(e.target.checked);
                          if (e.target.checked) {
                            setFormData({ ...formData, employeeIdNumber: '' });
                          }
                        }}
                        className="rounded border-border"
                      />
                      Auto-generate ID
                    </label>
                    {!autoGenerateId && (
                      <input
                        type="text"
                        value={formData.employeeIdNumber}
                        onChange={(e) => setFormData({ ...formData, employeeIdNumber: e.target.value })}
                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="Enter employee ID manually"
                      />
                    )}
                    {autoGenerateId && (
                      <span className="text-sm text-muted-foreground">ID will be auto-generated on save (e.g. BAK-123456XX)</span>
                    )}
                  </div>
                  {editingId && formData.employeeIdNumber && (
                    <p className="text-sm mt-2">Current ID: <span className="font-mono font-medium">{formData.employeeIdNumber}</span></p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Department</label>
                    <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                      {departments.map(dept => <option key={dept}>{dept}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as Employee['category'] })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Role / Job Title</label>
                    <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. Head Baker, Delivery Rider" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Hire Date</label>
                    <input type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Employee['status'] })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Leave</option>
                      <option>Probation</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" rows={3} />
                </div>
              </div>
            )}

            {/* Certificates Tab */}
            {activeFormTab === 'certificates' && (
              <div className="space-y-4">
                {/* Driver-specific */}
                {formData.category === 'Driver' && (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-3">Driver License (Required for Drivers)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">License ID</label>
                        <input type="text" value={formData.driverLicenseId} onChange={(e) => setFormData({ ...formData, driverLicenseId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white" placeholder="DL-XXXX-XXXX" />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">License Expiry</label>
                        <input type="date" value={formData.driverLicenseExpiry} onChange={(e) => setFormData({ ...formData, driverLicenseExpiry: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Baker-specific */}
                {formData.category === 'Baker' && (
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <p className="text-sm font-semibold text-green-800 mb-3">Hygiene Certificate (Required for Bakers)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Certificate No.</label>
                        <input type="text" value={formData.hygieneCertNo} onChange={(e) => setFormData({ ...formData, hygieneCertNo: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white" placeholder="HYG-XXXX-XXX" />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Expiry Date</label>
                        <input type="date" value={formData.hygieneCertExpiry} onChange={(e) => setFormData({ ...formData, hygieneCertExpiry: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Certificates */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium mb-3">Additional Certificates</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <input type="text" placeholder="Certificate Name" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                    <input type="text" placeholder="Certificate No." value={newCert.number} onChange={(e) => setNewCert({ ...newCert, number: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                    <input type="date" value={newCert.issueDate} onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" title="Issue Date" />
                    <input type="date" value={newCert.expiryDate} onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" title="Expiry Date" />
                  </div>
                  <button type="button" onClick={handleAddCert} className="text-sm text-primary hover:text-primary/80 font-medium">+ Add Certificate</button>

                  {formData.certificates.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.certificates.map(cert => (
                        <div key={cert.id} className="flex items-center justify-between bg-secondary p-3 rounded-lg text-sm">
                          <div>
                            <span className="font-medium">{cert.name}</span>
                            <span className="text-muted-foreground ml-2">#{cert.number}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">Issued: {cert.issueDate || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">Expires: {cert.expiryDate || 'N/A'}</span>
                            <button type="button" onClick={() => handleRemoveCert(cert.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payroll Tab */}
            {activeFormTab === 'payroll' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Bank Name</label>
                  <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Bank Account No.</label>
                  <input type="text" value={formData.bankAccountNo} onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">NHIF No.</label>
                  <input type="text" value={formData.nhifNo} onChange={(e) => setFormData({ ...formData, nhifNo: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">NSSF No.</label>
                  <input type="text" value={formData.nssfNo} onChange={(e) => setFormData({ ...formData, nssfNo: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">KRA PIN</label>
                  <input type="text" value={formData.kraPin} onChange={(e) => setFormData({ ...formData, kraPin: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
              </div>
            )}

            {/* System Access Tab */}
            {activeFormTab === 'systemAccess' && (
              <div className="space-y-5">
                <div className="p-4 border border-border rounded-lg bg-secondary/30">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.systemAccess}
                      onChange={(e) => setFormData({ ...formData, systemAccess: e.target.checked })}
                      className="w-5 h-5 rounded border-border"
                    />
                    <div>
                      <span className="text-sm font-medium">Enable System Access</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Allow this employee to log in to the system</p>
                    </div>
                  </label>
                </div>

                {formData.systemAccess && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Login Email</label>
                        <input
                          type="email"
                          value={formData.loginEmail}
                          onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                          placeholder="employee@snackoh.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Login Role</label>
                        <select
                          value={formData.loginRole}
                          onChange={(e) => setFormData({ ...formData, loginRole: e.target.value as Employee['loginRole'] })}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                        >
                          {loginRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-muted-foreground mb-1">
                          Password {!editingId && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                          placeholder={editingId ? 'Leave blank to keep current password' : 'Set login password (min 6 chars)'}
                          minLength={6}
                          required={!editingId}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {editingId ? 'Leave empty to keep current password. Enter a new value to reset it.' : 'This password will be used to create a system login for this employee.'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-3">Permissions</p>
                      <div className="grid grid-cols-3 gap-2">
                        {ALL_PERMISSIONS.map(perm => (
                          <label key={perm} className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors text-sm">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                              className="rounded border-border"
                            />
                            {perm}
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, permissions: [...ALL_PERMISSIONS] })}
                          className="text-xs text-primary hover:text-primary/80 font-medium"
                        >
                          Select All
                        </button>
                        <span className="text-xs text-muted-foreground">|</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, permissions: [] })}
                          className="text-xs text-primary hover:text-primary/80 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={closeModal} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editingId ? 'Update' : 'Create'} Employee</button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => { setShowCategoryModal(false); setNewCategoryName(''); }} title="Add Employee Category" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Add a new employee category for classification.</p>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Category Name</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="e.g. Rider, Cleaner, Cashier..."
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Current categories:</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <span key={cat} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">{cat}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => { setShowCategoryModal(false); setNewCategoryName(''); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
            >
              Add Category
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail View Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail ? `${showDetail.designation} ${showDetail.firstName} ${showDetail.lastName}` : ''} size="3xl">
        {showDetail && (
          <div className="space-y-6 max-h-[32rem] overflow-y-auto pr-1">
            {/* Header with photo and basic info */}
            <div className="flex gap-6 items-start">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-muted-foreground flex-shrink-0 overflow-hidden border-2 border-border">
                {showDetail.profilePhotoUrl ? (
                  <img src={showDetail.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{showDetail.firstName.charAt(0)}{showDetail.lastName.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold">{showDetail.designation} {showDetail.firstName} {showDetail.lastName}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    showDetail.status === 'Active' ? 'bg-green-100 text-green-800' :
                    showDetail.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                    showDetail.status === 'Probation' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{showDetail.status}</span>
                  {showDetail.systemAccess && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">System User</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{showDetail.role} -- {showDetail.department}</p>
                {showDetail.employeeIdNumber && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">ID: {showDetail.employeeIdNumber}</p>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Personal Information</h4>
              <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium ml-2">{showDetail.email || '---'}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium ml-2">{showDetail.phone || '---'}</span></div>
                <div><span className="text-muted-foreground">National ID:</span> <span className="font-medium ml-2">{showDetail.idNumber || '---'}</span></div>
                <div className="col-span-3"><span className="text-muted-foreground">Address:</span> <span className="font-medium ml-2">{showDetail.address || '---'}</span></div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Employment Information</h4>
              <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div><span className="text-muted-foreground">Category:</span> <span className="font-medium ml-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    showDetail.category === 'Baker' ? 'bg-amber-100 text-amber-800' :
                    showDetail.category === 'Driver' ? 'bg-blue-100 text-blue-800' :
                    showDetail.category === 'Sales' ? 'bg-purple-100 text-purple-800' :
                    showDetail.category === 'Rider' ? 'bg-cyan-100 text-cyan-800' :
                    showDetail.category === 'Cleaner' ? 'bg-lime-100 text-lime-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{showDetail.category}</span>
                </span></div>
                <div><span className="text-muted-foreground">Department:</span> <span className="font-medium ml-2">{showDetail.department}</span></div>
                <div><span className="text-muted-foreground">Hire Date:</span> <span className="font-medium ml-2">{showDetail.hireDate}</span></div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Emergency Contacts</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><span className="text-muted-foreground">Next of Kin:</span> <span className="font-medium ml-2">{showDetail.nextOfKin || '---'}</span></div>
                <div><span className="text-muted-foreground">Kin Phone:</span> <span className="font-medium ml-2">{showDetail.nextOfKinPhone || '---'}</span></div>
                <div><span className="text-muted-foreground">Emergency Contact:</span> <span className="font-medium ml-2">{showDetail.emergencyContact || '---'}</span></div>
                <div><span className="text-muted-foreground">Emergency Phone:</span> <span className="font-medium ml-2">{showDetail.emergencyPhone || '---'}</span></div>
              </div>
            </div>

            {/* Certificates */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Certificates &amp; Compliance</h4>
              <div className="space-y-2">
                {showDetail.category === 'Driver' && (
                  <div className={`p-3 rounded-lg text-sm border ${
                    !showDetail.driverLicenseId ? 'border-red-200 bg-red-50' :
                    isExpired(showDetail.driverLicenseExpiry) ? 'border-red-200 bg-red-50' :
                    isExpiringSoon(showDetail.driverLicenseExpiry) ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Driver License</p>
                        <p className="text-muted-foreground">ID: {showDetail.driverLicenseId || 'Not provided'} -- Expires: {showDetail.driverLicenseExpiry || 'N/A'}</p>
                      </div>
                      {!showDetail.driverLicenseId && <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-semibold">MISSING</span>}
                      {showDetail.driverLicenseId && isExpired(showDetail.driverLicenseExpiry) && <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-semibold">EXPIRED</span>}
                      {showDetail.driverLicenseId && isExpiringSoon(showDetail.driverLicenseExpiry) && <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">EXPIRING SOON</span>}
                    </div>
                  </div>
                )}

                {showDetail.category === 'Baker' && (
                  <div className={`p-3 rounded-lg text-sm border ${
                    !showDetail.hygieneCertNo ? 'border-red-200 bg-red-50' :
                    isExpired(showDetail.hygieneCertExpiry) ? 'border-red-200 bg-red-50' :
                    isExpiringSoon(showDetail.hygieneCertExpiry) ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Hygiene Certificate</p>
                        <p className="text-muted-foreground">No: {showDetail.hygieneCertNo || 'Not provided'} -- Expires: {showDetail.hygieneCertExpiry || 'N/A'}</p>
                      </div>
                      {!showDetail.hygieneCertNo && <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-semibold">MISSING</span>}
                      {showDetail.hygieneCertNo && isExpired(showDetail.hygieneCertExpiry) && <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-semibold">EXPIRED</span>}
                      {showDetail.hygieneCertNo && isExpiringSoon(showDetail.hygieneCertExpiry) && <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">EXPIRING SOON</span>}
                    </div>
                  </div>
                )}

                {showDetail.certificates.length > 0 && (
                  <div className="space-y-2">
                    {showDetail.certificates.map(cert => (
                      <div key={cert.id} className={`p-3 rounded-lg text-sm border ${
                        isExpired(cert.expiryDate) ? 'border-red-200 bg-red-50' :
                        isExpiringSoon(cert.expiryDate) ? 'border-yellow-200 bg-yellow-50' :
                        'border-border bg-secondary/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{cert.name}</span>
                            <span className="text-muted-foreground ml-2">#{cert.number}</span>
                            <span className="text-muted-foreground ml-3 text-xs">Issued: {cert.issueDate || 'N/A'} -- Expires: {cert.expiryDate || 'N/A'}</span>
                          </div>
                          {isExpired(cert.expiryDate) && <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-semibold">EXPIRED</span>}
                          {isExpiringSoon(cert.expiryDate) && !isExpired(cert.expiryDate) && <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">EXPIRING SOON</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showDetail.category !== 'Driver' && showDetail.category !== 'Baker' && showDetail.certificates.length === 0 && (
                  <p className="text-sm text-muted-foreground">No certificates on file.</p>
                )}
              </div>
            </div>

            {/* Payroll Details (masked) */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Payroll Details</h4>
              <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium ml-2">{showDetail.bankName || '---'}</span></div>
                <div><span className="text-muted-foreground">Account:</span> <span className="font-medium ml-2 font-mono">{maskValue(showDetail.bankAccountNo)}</span></div>
                <div><span className="text-muted-foreground">NHIF:</span> <span className="font-medium ml-2 font-mono">{maskValue(showDetail.nhifNo)}</span></div>
                <div><span className="text-muted-foreground">NSSF:</span> <span className="font-medium ml-2 font-mono">{maskValue(showDetail.nssfNo)}</span></div>
                <div><span className="text-muted-foreground">KRA PIN:</span> <span className="font-medium ml-2 font-mono">{maskValue(showDetail.kraPin)}</span></div>
              </div>
            </div>

            {/* System Access */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">System Access</h4>
              {showDetail.systemAccess ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    <div><span className="text-muted-foreground">Status:</span> <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">Enabled</span></div>
                    <div><span className="text-muted-foreground">Login Email:</span> <span className="font-medium ml-2">{showDetail.loginEmail}</span></div>
                    <div><span className="text-muted-foreground">Role:</span> <span className="font-medium ml-2">{showDetail.loginRole}</span></div>
                  </div>
                  {showDetail.permissions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {showDetail.permissions.map(perm => (
                          <span key={perm} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs">{perm}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No system access configured for this employee.</p>
              )}
            </div>

            {/* Documents Placeholder */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Uploaded Documents</h4>
              <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Document upload functionality coming soon.</p>
              </div>
            </div>

            {/* Notes */}
            {showDetail.notes && (
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Notes</h4>
                <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-lg">{showDetail.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {loading && <div className="text-center py-4 text-muted-foreground text-sm">Loading employees...</div>}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Employee</th>
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Compliance</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-center font-semibold">Access</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  {loading ? 'Loading...' : 'No employees found'}
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0 overflow-hidden">
                        {emp.profilePhotoUrl ? (
                          <img src={emp.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{emp.firstName.charAt(0)}{emp.lastName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{emp.designation} {emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{emp.employeeIdNumber || '---'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      emp.category === 'Baker' ? 'bg-amber-100 text-amber-800' :
                      emp.category === 'Driver' ? 'bg-blue-100 text-blue-800' :
                      emp.category === 'Sales' ? 'bg-purple-100 text-purple-800' :
                      emp.category === 'Admin' ? 'bg-teal-100 text-teal-800' :
                      emp.category === 'Rider' ? 'bg-cyan-100 text-cyan-800' :
                      emp.category === 'Cleaner' ? 'bg-lime-100 text-lime-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{emp.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{emp.department}</td>
                  <td className="px-4 py-3 text-sm">{emp.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {emp.category === 'Driver' && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          !emp.driverLicenseId ? 'bg-red-100 text-red-700' :
                          isExpired(emp.driverLicenseExpiry) ? 'bg-red-100 text-red-700' :
                          isExpiringSoon(emp.driverLicenseExpiry) ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          DL {emp.driverLicenseId ? (isExpired(emp.driverLicenseExpiry) ? 'EXP' : 'OK') : 'N/A'}
                        </span>
                      )}
                      {emp.category === 'Baker' && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          !emp.hygieneCertNo ? 'bg-red-100 text-red-700' :
                          isExpired(emp.hygieneCertExpiry) ? 'bg-red-100 text-red-700' :
                          isExpiringSoon(emp.hygieneCertExpiry) ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Hygiene {emp.hygieneCertNo ? (isExpired(emp.hygieneCertExpiry) ? 'EXP' : 'OK') : 'N/A'}
                        </span>
                      )}
                      {emp.certificates.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                          +{emp.certificates.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-800' :
                      emp.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      emp.status === 'Probation' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>{emp.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {emp.systemAccess ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">{emp.loginRole}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">---</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setShowDetail(emp)} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors font-medium">View</button>
                      <button onClick={() => handleEdit(emp)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">Edit</button>
                      <button onClick={() => handleDelete(emp.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-secondary'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
