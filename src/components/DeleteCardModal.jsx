import React, { useState } from 'react'

const DeleteCardModal = ({ isOpen, onClose, card, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      await onConfirm(card)
      onClose()
    } catch (error) {
      alert('Failed to delete card. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !card) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              Delete Card
            </h2>
            <p className="text-sm text-gray-500">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Card Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Card:</span>
            <span className="text-sm text-gray-900 font-medium">{card.text}</span>
            <span className="text-xs text-gray-500 capitalize">({card.type})</span>
          </div>
        </div>

        {/* Warning Message */}
        <div className="mb-6">
          <p className="text-gray-700 text-sm">
            Are you sure you want to delete this card?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isDeleting ? 'Deleting...' : 'Delete Card'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteCardModal