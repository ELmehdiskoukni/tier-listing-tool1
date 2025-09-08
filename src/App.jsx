import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './contexts/AuthContext'
import LoginPage from './components/LoginPage'
import AdminPage from './components/AdminPage'
import BoardPage from './components/BoardPage'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/board" 
              element={
                <ProtectedRoute>
                  <BoardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          
          <ToastContainer 
            position="top-right" 
            autoClose={3500} 
            newestOnTop 
            closeOnClick 
            pauseOnHover 
            theme="colored" 
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App