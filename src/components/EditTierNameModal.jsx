import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

const EditTierNameModal = ({ isOpen, onClose, currentName, onSave }) => {
  const [tierName, setTierName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTierName(currentName)
    }
  }, [isOpen, currentName])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedName = tierName.trim()
    
    if (!trimmedName) {
      toast.error('Tier name cannot be empty')
      return
    }

    if (trimmedName.length > 10) {
      toast.error('Tier name is too long. Must not be more than 10 characters.')
      return
    }

    setIsSaving(true)

    try {
      await onSave(trimmedName)
      onClose()
    } catch (error) {
      toast.error('Failed to save tier name. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setTierName(currentName) // Reset to original name
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Edit Tier Name
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tier Name Input */}
          <div className="mb-6">
            <label htmlFor="tierName" className="block text-sm font-medium text-gray-700 mb-2">
              Tier Name
            </label>
            <input
              type="text"
              id="tierName"
              value={tierName}
              onChange={(e) => setTierName(e.target.value)}
              placeholder="Enter tier name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={10}
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-500">
              {tierName.length}/10 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !tierName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTierNameModal