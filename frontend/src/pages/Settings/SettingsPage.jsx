import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [companyData, setCompanyData] = useState({
    name: 'SteelTrack Pvt. Ltd.',
    address: '47, GIDC Estate, Phase 2',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382024',
    phone: '+91 79 2634 5678',
    email: 'info@steeltrack.com',
    gstNumber: '24AAACS1234Z1ZP',
    panNumber: 'AAACS1234Z',
    bankName: 'State Bank of India',
    accountNumber: '12345678901',
    ifscCode: 'SBIN0001234',
  });

  const tabs = [
    { id: 'company', label: 'Company Profile' },
    { id: 'users', label: 'Users' },
    { id: 'gst', label: 'GST Config' },
    { id: 'invoice', label: 'Invoice Settings' },
  ];

  const mockUsers = [
    { id: 1, name: 'Admin User', email: 'admin@steeltrack.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Sales Rep', email: 'sales@steeltrack.com', role: 'Sales', status: 'Active' },
  ];

  const handleCompanyChange = (e) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-[#1A1F2E] mb-6">Settings</h2>

      {/* Tabs */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-btn text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-[#1A1F2E] hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company Profile Tab */}
      {activeTab === 'company' && (
        <div className="bg-white shadow-card rounded-card p-6">
          <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Company Name *</label>
              <input
                type="text"
                name="name"
                value={companyData.name}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={companyData.email}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Address *</label>
              <input
                type="text"
                name="address"
                value={companyData.address}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={companyData.city}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">State *</label>
              <input
                type="text"
                name="state"
                value={companyData.state}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={companyData.pincode}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Phone *</label>
              <input
                type="text"
                name="phone"
                value={companyData.phone}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">GST Number *</label>
              <input
                type="text"
                name="gstNumber"
                value={companyData.gstNumber}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">PAN Number *</label>
              <input
                type="text"
                name="panNumber"
                value={companyData.panNumber}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={companyData.bankName}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={companyData.accountNumber}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={companyData.ifscCode}
                onChange={handleCompanyChange}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Company Logo</label>
              <input
                type="file"
                accept="image/*"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-btn text-sm font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white shadow-card rounded-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">User Management</h3>
            <button
              onClick={() => alert('Add user modal would open')}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-btn text-sm font-medium"
            >
              + Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map(user => (
                  <tr key={user.id} className="border-t border-border">
                    <td className="px-4 py-3 text-sm">{user.name}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm">{user.role}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-bg text-success">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-primary hover:text-primary-hover text-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST Config Tab */}
      {activeTab === 'gst' && (
        <div className="bg-white shadow-card rounded-card p-6">
          <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">GST Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">CGST Rate (%)</label>
              <input
                type="number"
                defaultValue="9"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">SGST Rate (%)</label>
              <input
                type="number"
                defaultValue="9"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">IGST Rate (%)</label>
              <input
                type="number"
                defaultValue="18"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Default HSN Code</label>
              <input
                type="text"
                defaultValue="73063010"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-btn text-sm font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Invoice Settings Tab */}
      {activeTab === 'invoice' && (
        <div className="bg-white shadow-card rounded-card p-6">
          <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Invoice Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Invoice Prefix</label>
              <input
                type="text"
                defaultValue="INV"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Next Invoice Number</label>
              <input
                type="number"
                defaultValue="2025-0039"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Invoice Terms</label>
              <textarea
                rows={4}
                defaultValue="Payment due within 15 days. Late payments subject to 2% monthly interest."
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">Invoice Footer Text</label>
              <textarea
                rows={3}
                defaultValue="Thank you for your business!"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-btn text-sm font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
