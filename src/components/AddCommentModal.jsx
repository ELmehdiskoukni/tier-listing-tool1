import React, { useState } from 'react'

const AddCommentModal = ({ isOpen, onClose, card, onAddComment }) => {
  const [comment, setComment] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedComment = comment.trim()
    
    if (!trimmedComment) {
      alert('Comment cannot be empty')
      return
    }

    if (trimmedComment.length < 3) {
      alert('Comment is too short. Must be at least 3 characters.')
      return
    }

    if (trimmedComment.length > 200) {
      alert('Comment is too long. Must not be more than 200 characters.')
      return
    }

    setIsAdding(true)

    try {
      await onAddComment(card, {
        text: trimmedComment,
        timestamp: new Date().toISOString(),
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })
      
      setComment('')
      onClose()
    } catch (error) {
      alert('Failed to add comment. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setComment('')
    onClose()
  }

  if (!isOpen || !card) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Add Comment
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

        {/* Card Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Card:</span>
            <span className="text-sm text-gray-900">{card.text}</span>
            <span className="text-xs text-gray-500 capitalize">({card.type})</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Comment Input */}
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Your Comment
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comment about this card..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={200}
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-500">
              {comment.length}/200 characters
            </div>
          </div>

          {/* Existing Comments */}
          {card.comments && card.comments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Previous Comments ({card.comments.length})
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {card.comments.map((existingComment) => (
                  <div key={existingComment.id} className="p-2 bg-gray-50 rounded text-sm flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-gray-800">{existingComment.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(existingComment.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this comment?')) {
                          const updatedComments = card.comments.filter(c => c.id !== existingComment.id)
                          onAddComment(card, null, updatedComments)
                        }
                      }}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs"
                      title="Delete this comment"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              disabled={isAdding}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !comment.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isAdding ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCommentModal