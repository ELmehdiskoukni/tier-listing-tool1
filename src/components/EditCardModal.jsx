import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

const EditCardModal = ({ isOpen, onClose, card, onSave }) => {
  const [cardText, setCardText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Card type display configuration
  const cardTypeConfig = {
    image: { label: 'Image', color: 'bg-purple-100 border-purple-300 text-purple-800' },
    text: { label: 'Text', color: 'bg-gray-100 border-gray-300 text-gray-800' },
    page: { label: 'Page', color: 'bg-green-100 border-green-300 text-green-800' },
    personas: { label: 'Personas', color: 'bg-blue-100 border-blue-300 text-blue-800' },
    competitor: { label: 'Competitor', color: 'bg-orange-100 border-orange-300 text-orange-800' },
    // Legacy support for old card types
    'sitemaps-page': { label: 'Page', color: 'bg-green-100 border-green-300 text-green-800' },
    'competitor-text': { label: 'Competitor', color: 'bg-orange-100 border-orange-300 text-orange-800' },
    'competitor-img': { label: 'Competitor', color: 'bg-orange-100 border-orange-300 text-orange-800' },
    'persona': { label: 'Personas', color: 'bg-blue-100 border-blue-300 text-blue-800' }
  }

  // Update local state when modal opens
  useEffect(() => {
    if (isOpen && card) {
      setCardText(card.text || '')
    }
  }, [isOpen, card])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedText = cardText.trim()
    
    if (!trimmedText) {
      toast.error('Card text cannot be empty')
      return
    }

    if (trimmedText.length < 2) {
      toast.error('Text is too short. Must be at least 2 characters.')
      return
    }

    if (trimmedText.length > 20) {
      toast.error('Text is too long. Must not be more than 20 characters.')
      return
    }

    setIsSaving(true)

    try {
      await onSave(card, { text: trimmedText })
      onClose()
    } catch (error) {
      toast.error('Failed to save card. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (card) {
      setCardText(card.text || '') // Reset to original text
    }
    onClose()
  }

  if (!isOpen || !card) return null

  const cardType = cardTypeConfig[card.type] || cardTypeConfig.text

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Edit Card
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
          {/* Card Type Display (Read-only) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Type
            </label>
            <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-md bg-gray-50">
              <div 
                className={`w-4 h-4 rounded-full border ${cardType.color}`}
                title={`${cardType.label} card color`}
              />
              <span className="text-sm font-medium text-gray-600">{cardType.label}</span>
              <span className="text-xs text-gray-500 ml-auto">(Cannot be changed)</span>
            </div>
          </div>

          {/* Card Text Input */}
          <div className="mb-6">
            <label htmlFor="cardText" className="block text-sm font-medium text-gray-700 mb-2">
              Card Text
            </label>
            <input
              type="text"
              id="cardText"
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
              placeholder="Enter card text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-500">
              {cardText.length}/20 characters
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
              disabled={isSaving || !cardText.trim()}
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

export default EditCardModal