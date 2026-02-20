'use client';

import { useState } from 'react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setEmployees(employees.map(emp => emp.id === editingId ? { ...formData, id: editingId } : emp));
      setEditingId(null);
    } else {
      setEmployees([...employees, { ...formData, id: Date.now().toString() }]);
    }
    setFormData({
      id: '',
      firstName: '',
      lastName: '',
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
    setShowForm(false);
  };

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
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
            className="px-4 py-2 border border-border rounded"
          />
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold"
        >
          + Add Employee
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded border border-border max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-background">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-lg text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="px-3 py-2 border border-border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="px-3 py-2 border border-border rounded"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-3 py-2 border border-border rounded"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="px-3 py-2 border border-border rounded"
                />
                <input
                  type="text"
                  placeholder="ID Number"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="px-3 py-2 border border-border rounded"
                />
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="px-3 py-2 border border-border rounded"
                />
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="px-3 py-2 border border-border rounded"
                >
                  {departments.map(dept => <option key={dept}>{dept}</option>)}
                </select>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="px-3 py-2 border border-border rounded"
                >
                  <option>Select Role</option>
                  {roles.map(role => <option key={role}>{role}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Next of Kin"
                  value={formData.nextOfKin}
                  onChange={(e) => setFormData({ ...formData, nextOfKin: e.target.value })}
                  className="px-3 py-2 border border-border rounded col-span-2"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="px-3 py-2 border border-border rounded col-span-2"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="px-3 py-2 border border-border rounded"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Leave</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-border rounded hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold"
                >
                  {editingId ? 'Update' : 'Create'} Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded overflow-x-auto">
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
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{emp.firstName} {emp.lastName}</td>
                <td className="px-4 py-3">{emp.email}</td>
                <td className="px-4 py-3">{emp.department}</td>
                <td className="px-4 py-3">{emp.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
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
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
