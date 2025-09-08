import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TierBoard from './TierBoard';

const BoardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with user info and logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Tier Listing Tool - Member Board
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.name} ({user?.role})
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            Logout
          </button>
        </div>
        
        {/* Main content - TierBoard without SourceCards for members */}
        <TierBoard hideSourceCards={true} />
      </div>
    </div>
  );
};

export default BoardPage;
