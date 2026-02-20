'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  designation: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
  email: string;
  phone: string;
  department: string;
  role: string;
  hireDate: string;
  status: 'Active' | 'Inactive' | 'Leave';
  nextOfKin: string;
  address: string;
  idNumber: string;
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
      hireDate: '2024-01-15',
      status: 'Active',
      nextOfKin: 'Jane Mwangi',
      address: '123 Main St, Nairobi',
      idNumber: 'ID12345678',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Employee>({
    id: '',
    firstName: '',
    lastName: '',
    designation: 'Mr',
    email: '',
    phone: '',
    department: 'Production',
    role: '',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    nextOfKin: '',
    address: '',
    idNumber: '',
  });

  const departments = ['Production', 'Sales', 'Delivery', 'Administration', 'Quality Control'];
  const roles = ['Manager', 'Supervisor', 'Operator', 'Driver', 'Packer', 'Admin'];
  const designations: Array<'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof'> = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'];

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
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
      designation: 'Mr',
      email: '',
      phone: '',
      department: 'Production',
      role: '',
      hireDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      nextOfKin: '',
      address: '',
      idNumber: '',
    });
  };

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Employee Management</h1>
        <p className="text-muted-foreground">Manage employee profiles, departments, and assignments</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search employees..."
            className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
          />
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
          className="btn-primary"
        >
          + Add Employee
        </button>
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={closeModal} title={editingId ? 'Edit Employee' : 'Add New Employee'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <select
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value as any })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            >
              {designations.map(des => <option key={des} value={des}>{des}</option>)}
            </select>
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <input
              type="text"
              placeholder="ID Number"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <input
              type="date"
              value={formData.hireDate}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              {departments.map(dept => <option key={dept}>{dept}</option>)}
            </select>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option>Select Role</option>
              {roles.map(role => <option key={role}>{role}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Next of Kin"
              value={formData.nextOfKin}
              onChange={(e) => setFormData({ ...formData, nextOfKin: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Leave</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none w-full"
          />

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {editingId ? 'Update' : 'Create'} Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Hire Date</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No employees found. Create your first employee.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{emp.designation} {emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-3 text-sm">{emp.email}</td>
                  <td className="px-4 py-3 text-sm">{emp.department}</td>
                  <td className="px-4 py-3 text-sm">{emp.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-800' :
                      emp.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{emp.hireDate}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium"
                    >
                      Delete
                    </button>
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
