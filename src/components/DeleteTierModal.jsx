import React, { useState } from 'react'
import { toast } from 'react-toastify'

const DeleteTierModal = ({ isOpen, onClose, tierName, cardCount, onDeleteCardsAndTier }) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDelete = async () => {
    setIsProcessing(true)
    
    try {
      await onDeleteCardsAndTier()
      onClose()
    } catch (error) {
      console.error('Action failed:', error)
      toast.error('Action failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Delete Tier "{tierName}"
            </h2>
            <p className="text-sm text-gray-500">
              This tier contains {cardCount} card{cardCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Warning Message */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-red-800 font-medium mb-1">
                ⚠️ Permanent Deletion Warning
              </p>
              <p className="text-red-700 text-sm">
                This will permanently delete tier "{tierName}" and all {cardCount} card{cardCount === 1 ? '' : 's'} in it. 
                This action cannot be undone and the data will be lost forever.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isProcessing ? 'Deleting...' : 'Delete Tier & Cards'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteTierModal