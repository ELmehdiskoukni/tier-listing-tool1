import React from 'react';

const DeleteUserModal = ({ isOpen, onClose, onConfirm, user }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Delete User</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to delete the user "{user?.name}"? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border rounded px-3 py-2">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded px-3 py-2">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
