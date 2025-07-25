import React from 'react'
import TierBoard from './components/TierBoard'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Tier Listing Tool
        </h1>
        <TierBoard />
      </div>
    </div>
  )
}

export default App