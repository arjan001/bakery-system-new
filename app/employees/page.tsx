'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface Certificate {
  id: string;
  name: string;
  number: string;
  issueDate: string;
  expiryDate: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  designation: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
  email: string;
  phone: string;
  department: string;
  role: string;
  category: 'Baker' | 'Driver' | 'Sales' | 'Admin' | 'Quality' | 'Packer' | 'Supervisor' | 'Manager';
  hireDate: string;
  status: 'Active' | 'Inactive' | 'Leave' | 'Probation';
  nextOfKin: string;
  nextOfKinPhone: string;
  address: string;
  idNumber: string;
  // HR fields
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
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Mwangi',
      designation: 'Mr',
      email: 'john@bakery.com',
      phone: '+254712345678',
      department: 'Production',
      role: 'Production Manager',
      category: 'Baker',
      hireDate: '2024-01-15',
      status: 'Active',
      nextOfKin: 'Jane Mwangi',
      nextOfKinPhone: '+254798765432',
      address: '123 Main St, Nairobi',
      idNumber: 'ID12345678',
      driverLicenseId: '',
      driverLicenseExpiry: '',
      hygieneCertNo: 'HYG-2024-001',
      hygieneCertExpiry: '2025-01-15',
      certificates: [
        { id: '1', name: 'Food Safety Level 2', number: 'FS-001', issueDate: '2024-01-01', expiryDate: '2025-01-01' },
      ],
      bankName: 'KCB',
      bankAccountNo: '1234567890',
      nhifNo: 'NHIF-001',
      nssfNo: 'NSSF-001',
      kraPin: 'A001234567Z',
      emergencyContact: 'Jane Mwangi',
      emergencyPhone: '+254798765432',
      notes: '',
    },
    {
      id: '2',
      firstName: 'Peter',
      lastName: 'Odhiambo',
      designation: 'Mr',
      email: 'peter@bakery.com',
      phone: '+254723456789',
      department: 'Delivery',
      role: 'Delivery Rider',
      category: 'Driver',
      hireDate: '2024-02-01',
      status: 'Active',
      nextOfKin: 'Mary Odhiambo',
      nextOfKinPhone: '+254787654321',
      address: '456 Mombasa Rd, Nairobi',
      idNumber: 'ID87654321',
      driverLicenseId: 'DL-2024-5678',
      driverLicenseExpiry: '2026-02-01',
      hygieneCertNo: '',
      hygieneCertExpiry: '',
      certificates: [],
      bankName: 'Equity',
      bankAccountNo: '9876543210',
      nhifNo: 'NHIF-002',
      nssfNo: 'NSSF-002',
      kraPin: 'B002345678Z',
      emergencyContact: 'Mary Odhiambo',
      emergencyPhone: '+254787654321',
      notes: 'Has motorcycle license',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'employment' | 'certificates' | 'payroll'>('personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const emptyForm: Employee = {
    id: '',
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
  };

  const [formData, setFormData] = useState<Employee>(emptyForm);
  const [newCert, setNewCert] = useState({ name: '', number: '', issueDate: '', expiryDate: '' });

  const departments = ['Production', 'Sales', 'Delivery', 'Administration', 'Quality Control', 'Packaging'];
  const categories: Employee['category'][] = ['Baker', 'Driver', 'Sales', 'Admin', 'Quality', 'Packer', 'Supervisor', 'Manager'];
  const designations: Employee['designation'][] = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setEmployees(employees.map(emp => emp.id === editingId ? { ...formData, id: editingId } : emp));
      setEditingId(null);
    } else {
      setEmployees([...employees, { ...formData, id: Date.now().toString() }]);
    }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setNewCert({ name: '', number: '', issueDate: '', expiryDate: '' });
    setActiveFormTab('personal');
  };

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
    setActiveFormTab('personal');
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
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

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.role}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'All' || emp.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const activeCount = employees.filter(e => e.status === 'Active').length;
  const driverCount = employees.filter(e => e.category === 'Driver').length;
  const bakerCount = employees.filter(e => e.category === 'Baker').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Employee Management (HR)</h1>
        <p className="text-muted-foreground">Full HR system — manage profiles, certificates, payroll details, and compliance</p>
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
          <p className="text-2xl font-bold">{bakerCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Drivers</p>
          <p className="text-2xl font-bold">{driverCount}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="flex gap-3">
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
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + Add Employee
        </button>
      </div>

      {/* Employee Form Modal */}
      <Modal isOpen={showForm} onClose={closeModal} title={editingId ? 'Edit Employee' : 'Onboard New Employee'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form Tabs */}
          <div className="flex gap-2 border-b border-border pb-2">
            {(['personal', 'employment', 'certificates', 'payroll'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFormTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFormTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-4">
            {/* Personal Tab */}
            {activeFormTab === 'personal' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Title</label>
                    <select value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value as any })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required>
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
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Address</label>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium mb-3">Next of Kin / Emergency</p>
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
                      <label className="block text-xs text-muted-foreground mb-1">Emergency Contact</label>
                      <input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Emergency Phone</label>
                      <input type="tel" value={formData.emergencyPhone} onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Employment Tab */}
            {activeFormTab === 'employment' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Department</label>
                  <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                    {departments.map(dept => <option key={dept}>{dept}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Role / Job Title</label>
                  <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. Head Baker, Delivery Rider" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Hire Date</label>
                  <input type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Leave</option>
                    <option>Probation</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" rows={2} />
                </div>
              </div>
            )}

            {/* Certificates Tab */}
            {activeFormTab === 'certificates' && (
              <div className="space-y-4">
                {/* Driver-specific */}
                {(formData.category === 'Driver') && (
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
                {(formData.category === 'Baker') && (
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
                    <input type="text" placeholder="Certificate Name" value={newCert.name} onChange={(e) => setNewCert({...newCert, name: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                    <input type="text" placeholder="Certificate No." value={newCert.number} onChange={(e) => setNewCert({...newCert, number: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                    <input type="date" placeholder="Issue Date" value={newCert.issueDate} onChange={(e) => setNewCert({...newCert, issueDate: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                    <input type="date" placeholder="Expiry Date" value={newCert.expiryDate} onChange={(e) => setNewCert({...newCert, expiryDate: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
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
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={closeModal} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editingId ? 'Update' : 'Create'} Employee</button>
          </div>
        </form>
      </Modal>

      {/* Detail View Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail ? `${showDetail.designation} ${showDetail.firstName} ${showDetail.lastName}` : ''} size="lg">
        {showDetail && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><span className="text-muted-foreground">Category:</span> <span className="font-medium ml-2">{showDetail.category}</span></div>
              <div><span className="text-muted-foreground">Department:</span> <span className="font-medium ml-2">{showDetail.department}</span></div>
              <div><span className="text-muted-foreground">Role:</span> <span className="font-medium ml-2">{showDetail.role}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className="font-medium ml-2">{showDetail.status}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium ml-2">{showDetail.email}</span></div>
              <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium ml-2">{showDetail.phone}</span></div>
              <div><span className="text-muted-foreground">ID:</span> <span className="font-medium ml-2">{showDetail.idNumber}</span></div>
              <div><span className="text-muted-foreground">Hire Date:</span> <span className="font-medium ml-2">{showDetail.hireDate}</span></div>
            </div>

            {showDetail.category === 'Driver' && showDetail.driverLicenseId && (
              <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg text-sm">
                <p className="font-semibold text-blue-800 mb-1">Driver License</p>
                <p>License ID: {showDetail.driverLicenseId} — Expires: {showDetail.driverLicenseExpiry}</p>
              </div>
            )}

            {showDetail.category === 'Baker' && showDetail.hygieneCertNo && (
              <div className="p-3 border border-green-200 bg-green-50 rounded-lg text-sm">
                <p className="font-semibold text-green-800 mb-1">Hygiene Certificate</p>
                <p>Cert No: {showDetail.hygieneCertNo} — Expires: {showDetail.hygieneCertExpiry}</p>
              </div>
            )}

            {showDetail.certificates.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium mb-2">Additional Certificates</p>
                {showDetail.certificates.map(cert => (
                  <div key={cert.id} className="text-sm py-1">
                    <span className="font-medium">{cert.name}</span> — #{cert.number} (Expires: {cert.expiryDate || 'N/A'})
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium ml-2">{showDetail.bankName} — {showDetail.bankAccountNo}</span></div>
              <div><span className="text-muted-foreground">NHIF:</span> <span className="font-medium ml-2">{showDetail.nhifNo}</span></div>
              <div><span className="text-muted-foreground">NSSF:</span> <span className="font-medium ml-2">{showDetail.nssfNo}</span></div>
              <div><span className="text-muted-foreground">KRA:</span> <span className="font-medium ml-2">{showDetail.kraPin}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Compliance</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Hire Date</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No employees found
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{emp.designation} {emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      emp.category === 'Baker' ? 'bg-amber-100 text-amber-800' :
                      emp.category === 'Driver' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{emp.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{emp.department}</td>
                  <td className="px-4 py-3 text-sm">{emp.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {emp.category === 'Driver' && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${emp.driverLicenseId ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {emp.driverLicenseId ? 'DL ✓' : 'DL ✗'}
                        </span>
                      )}
                      {emp.category === 'Baker' && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${emp.hygieneCertNo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {emp.hygieneCertNo ? 'Hygiene ✓' : 'Hygiene ✗'}
                        </span>
                      )}
                      {emp.certificates.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                          +{emp.certificates.length} cert{emp.certificates.length > 1 ? 's' : ''}
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
                  <td className="px-4 py-3 text-xs text-muted-foreground">{emp.hireDate}</td>
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
    </div>
  );
}
