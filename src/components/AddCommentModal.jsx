import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

// Normalize timestamps to display in the user's local time accurately
// Do NOT force a timezone; preserve original semantics and rely on the browser to render local time
const formatLocalDateTime = (value) => {
  if (!value) return ''
  const raw = typeof value === 'string' ? value : (value?.toString ? value.toString() : '')
  if (!raw) return ''
  const isoLike = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)
  const spacedLike = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)
  // Normalize space-separated to ISO-like without changing timezone semantics
  const normalized = (spacedLike && !isoLike) ? raw.replace(' ', 'T') : raw
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString()
}

const AddCommentModal = ({ isOpen, onClose, card, onAddComment }) => {
  const [comment, setComment] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [localComments, setLocalComments] = useState([])
  const [commentToDelete, setCommentToDelete] = useState(null)

  // Sync local comments with card comments when card changes
  useEffect(() => {
    if (card && card.comments) {
      // Check if comments is a string that needs to be parsed
      let parsedComments = card.comments
      if (typeof card.comments === 'string') {
        try {
          parsedComments = JSON.parse(card.comments)
        } catch (e) {
          console.error('🔍 AddCommentModal: failed to parse comments string:', e)
          parsedComments = []
        }
      }
      
      setLocalComments(parsedComments)
    } else {
      setLocalComments([])
    }
  }, [card])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedComment = comment.trim()
    if (!trimmedComment) return
    
    setIsAdding(true)
    
    try {
      await onAddComment(card, trimmedComment)
      
      setComment('')
      onClose()
    } catch (error) {
      toast.error('Failed to add comment. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setComment('')
    setCommentToDelete(null)
    onClose()
  }

  const handleDeleteComment = (commentToDelete) => {
    const updatedComments = localComments.filter(c => c.id !== commentToDelete.id)
    setLocalComments(updatedComments)
    onAddComment(card, null, updatedComments)
    setCommentToDelete(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative z-[99999999999]">
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
          {localComments && localComments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Previous Comments ({localComments.length})
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {localComments.map((existingComment) => {
                  return (
                    <div key={existingComment.id} className="p-2 bg-gray-50 rounded text-sm flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800">{existingComment.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatLocalDateTime(existingComment.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCommentToDelete(existingComment)
                        }}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs"
                        title="Delete this comment"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
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

      {/* Comment Deletion Confirmation Dialog */}
      {commentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Comment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-800">{commentToDelete.text}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCommentToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteComment(commentToDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Delete Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddCommentModal