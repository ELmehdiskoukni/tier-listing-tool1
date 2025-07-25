import React, { useState } from 'react'

const CardCreationModal = ({ isOpen, onClose, onCreateCard, tierName }) => {
  const [selectedType, setSelectedType] = useState('')
  const [cardText, setCardText] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Available card types with color indicators - NO ICONS
  const cardTypes = [
    { value: 'image', label: 'Image', color: 'bg-purple-100 border-purple-300 text-purple-800' },
    { value: 'text', label: 'Text', color: 'bg-gray-100 border-gray-300 text-gray-800' },
    { value: 'page', label: 'Page', color: 'bg-green-100 border-green-300 text-green-800' },
    { value: 'personas', label: 'Personas', color: 'bg-blue-100 border-blue-300 text-blue-800' },
    { value: 'competitor', label: 'Competitor', color: 'bg-orange-100 border-orange-300 text-orange-800' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedType || !cardText.trim()) {
      alert('Please select a card type and enter text')
      return
    }

    if (cardText.length < 2) {
      alert('Text is too short. Must be at least 2 characters.')
      return
    }

    if (cardText.length > 20) {
      alert('Text is too long. Must not be more than 20 characters.')
      return
    }

    setIsCreating(true)

    try {
      await onCreateCard({
        text: cardText.trim(),
        type: selectedType
      })
      
      setCardText('')
      setSelectedType('')
      onClose()
    } catch (error) {
      alert('Failed to create card. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setCardText('')
    setSelectedType('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Add Card to Tier {tierName}
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cardTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`
                    p-3 border rounded-lg text-left transition-colors duration-200 flex items-center gap-3
                    ${selectedType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <div 
                    className={`w-4 h-4 rounded-full border ${type.color}`}
                    title={`${type.label} card color`}
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="cardText" className="block text-sm font-medium text-gray-700 mb-2">
              Card Text
            </label>
            <input
              type="text"
              id="cardText"
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
              placeholder="Enter card text (2-20 characters)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
            />
            <div className="mt-1 text-xs text-gray-500">
              {cardText.length}/20 characters
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !selectedType || !cardText.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isCreating ? 'Creating...' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CardCreationModal