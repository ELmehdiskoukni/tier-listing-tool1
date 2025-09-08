import React from 'react';

const UserManagementModal = ({ isOpen, onClose, users, onAddUser, onEditUser, onDeleteUser }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">User Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button onClick={() => { onAddUser(); onClose(); }} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Email</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Role</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map(user => (
                <tr key={user.userId} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => { onEditUser(user); onClose(); }} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    <button onClick={() => { onDeleteUser(user); onClose(); }} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
