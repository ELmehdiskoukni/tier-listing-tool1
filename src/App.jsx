import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
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
        <ToastContainer position="top-right" autoClose={3500} newestOnTop closeOnClick pauseOnHover theme="colored" />
      </div>
    </div>
  )
}

export default App