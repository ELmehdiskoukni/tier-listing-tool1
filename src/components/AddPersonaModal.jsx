import React, { useState, useEffect } from 'react';

const AddPersonaModal = ({ isOpen, onClose, onSave, persona }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (persona) {
      setForm({ name: persona.name, email: persona.email, password: '', role: persona.role || 'Member' });
    } else {
      setForm({ name: '', email: '', password: '', role: 'Member' });
    }
    setError(''); // Clear any previous errors when opening the modal
  }, [persona, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    // Validation
    if (!form.name.trim()) {
      setError('Name is required');
      setSaving(false);
      return;
    }
    
    if (!form.email.trim()) {
      setError('Email is required');
      setSaving(false);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      setSaving(false);
      return;
    }
    
    if (!persona && !form.password.trim()) {
      setError('Password is required');
      setSaving(false);
      return;
    }
    
    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setSaving(false);
      return;
    }
    
    try {
      await onSave({ ...form, userId: persona?.userId });
      onClose();
      setForm({ name: '', email: '', password: '', role: 'Member' }); // Reset form
    } catch (error) {
      console.error('Failed to save persona:', error);
      if (error.response?.data?.error?.includes('User with this email already exists')) {
        setError('A persona with this email already exists. Please use a different email address.');
      } else {
        setError('Failed to save persona. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {persona ? 'Edit Persona' : 'Add New Persona'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              value={form.name} 
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} 
              className="w-full border rounded px-3 py-2" 
              required 
              placeholder="Enter persona name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} 
              className={`w-full border rounded px-3 py-2 ${error.includes('email') ? 'border-red-500' : ''}`} 
              required 
              placeholder="Enter email address"
            />
            {error.includes('email') && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={form.password} 
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} 
              className="w-full border rounded px-3 py-2" 
              required={!persona}
              placeholder={persona ? "Leave blank to keep current password" : "Enter password (min 6 characters)"}
            />
            {persona && <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current password.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} className="w-full border rounded px-3 py-2">
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {error && !error.includes('email') && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : persona ? 'Update Persona' : 'Save Persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonaModal;
