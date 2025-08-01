import React, { useState, useEffect } from 'react'

const ImportCardsModal = ({ isOpen, onClose, onImportCards, sourceCards, tierName, selectedSourceType }) => {
  const [selectedCards, setSelectedCards] = useState({})
  const [isImporting, setIsImporting] = useState(false)

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCards({})
    }
  }, [isOpen])

  const handleCardToggle = (cardId, sourceCategory) => {
    setSelectedCards(prev => ({
      ...prev,
      [cardId]: prev[cardId] ? false : { cardId, sourceCategory }
    }))
  }

  const handleSelectAll = (sourceCategory) => {
    const cards = sourceCards[sourceCategory] || []
    const newSelection = { ...selectedCards }
    
    cards.forEach(card => {
      newSelection[card.id] = { cardId: card.id, sourceCategory }
    })
    
    setSelectedCards(newSelection)
  }

  const handleDeselectAll = (sourceCategory) => {
    const cards = sourceCards[sourceCategory] || []
    const newSelection = { ...selectedCards }
    
    cards.forEach(card => {
      delete newSelection[card.id]
    })
    
    setSelectedCards(newSelection)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const cardsToImport = Object.values(selectedCards).filter(Boolean)
    
    if (cardsToImport.length === 0) {
      alert('Please select at least one card to import')
      return
    }

    setIsImporting(true)

    try {
      await onImportCards(cardsToImport)
      setSelectedCards({})
      onClose()
    } catch (error) {
      alert('Failed to import cards. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedCards({})
    onClose()
  }

  const sourceRows = selectedSourceType ? [
    {
      id: selectedSourceType,
      label: selectedSourceType.charAt(0).toUpperCase() + selectedSourceType.slice(1),
      cards: sourceCards[selectedSourceType] || []
    }
  ] : []

  const getSelectedCount = (sourceCategory) => {
    return Object.values(selectedCards).filter(selection => 
      selection && selection.sourceCategory === sourceCategory
    ).length
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Import Cards to Tier {tierName}
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

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Source Cards Selection */}
          <div className="flex-1 overflow-y-auto mb-6">
            <div className="space-y-6">
              {sourceRows.map((row) => (
                <div key={row.id} className="border border-gray-200 rounded-lg">
                  {/* Row Header */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                    <h3 className="text-lg font-medium text-gray-800">{row.label}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {getSelectedCount(row.id)} of {row.cards.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(row.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeselectAll(row.id)}
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="p-4">
                    {row.cards.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No {row.label.toLowerCase()} cards available</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {row.cards.map(card => (
                          <div
                            key={card.id}
                            className={`
                              border rounded-lg p-3 cursor-pointer transition-all duration-200
                              ${selectedCards[card.id] 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                            onClick={() => handleCardToggle(card.id, row.id)}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={!!selectedCards[card.id]}
                                onChange={() => handleCardToggle(card.id, row.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {card.text}
                                </div>
                                {card.subtype && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {card.subtype}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              disabled={isImporting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting || Object.values(selectedCards).filter(Boolean).length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isImporting ? 'Importing...' : `Import ${Object.values(selectedCards).filter(Boolean).length} Cards`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ImportCardsModal 