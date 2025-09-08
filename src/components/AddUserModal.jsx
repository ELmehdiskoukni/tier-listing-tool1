import React, { useState, useEffect } from 'react';

const AddUserModal = ({ isOpen, onClose, onSave, user }) => {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'User' });
    const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role: user.role || 'User' });
    } else {
      setForm({ name: '', email: '', password: '', role: 'User' });
    }
    setError(''); // Clear any previous errors when opening the modal
  }, [user, isOpen]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, userId: user?.userId });
      onClose();
      setForm({ name: '', email: '', password: '', role: 'User' }); // Reset form
    } catch (error) {
      console.error('Failed to save user:', error);
      if (error.response?.data?.error?.includes('duplicate key value violates unique constraint')) {
        setError('A user with this email already exists. Please use a different email address.');
      } else {
        setError('Failed to save user. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} 
              className={`w-full border rounded px-3 py-2 ${error.includes('email') ? 'border-red-500' : ''}`} 
              required 
            />
            {error.includes('email') && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="w-full border rounded px-3 py-2" required={!user} />
            {user && <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current password.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} className="w-full border rounded px-3 py-2">
              <option value="User">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded px-3 py-2">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2">{saving ? 'Saving...' : (user ? 'Save Changes' : 'Save User')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
