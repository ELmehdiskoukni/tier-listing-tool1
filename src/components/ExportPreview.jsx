import React from 'react'
import apiClient from '../api/apiClient'

const ExportPreview = ({ tiers = [], sourceCards = {}, exportOptions = {} }) => {
  // Define card styles based on type - same as Card.jsx
  const getCardStyle = (type) => {
    switch (type) {
      case 'image':
        return 'bg-purple-100 border-purple-300 text-purple-800'
      case 'text':
        return 'bg-gray-100 border-gray-300 text-gray-800'
      case 'page':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'personas':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'competitor':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      // Legacy support for old card types
      case 'sitemaps-page':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'competitor-text':
      case 'competitor-img':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'persona':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-white border-gray-300 text-gray-800'
    }
  }

  // Check if a card references a deleted source item
  const isCardFromDeletedSource = (card) => {
    // Only check cards that are from source areas (competitor, page, personas)
    if (!(card.type === 'competitor' || card.type === 'page' || card.type === 'personas')) {
      return false
    }

    // Get all current source cards
    const allSourceCards = [
      ...(sourceCards.competitors || []),
      ...(sourceCards.pages || []),
      ...(sourceCards.personas || [])
    ]
    
    // Check if there's a matching source card with the same text and type
    const matchingSourceCard = allSourceCards.find(sourceCard => 
      sourceCard.text === card.text && sourceCard.type === card.type
    )
    
    // If no matching source card is found, this card references a deleted source item
    return !matchingSourceCard
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4 text-center">Tier Board Preview</h2>
      

      {/* Tiers Preview - Completely static, no interactive elements */}
      <div className="space-y-3">
        {tiers.map(tier => {
          // Ensure tier.cards is always an array
          const cards = tier.cards || []
          
          return (
            <div key={tier.id} className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="flex items-stretch min-h-[80px]">
                {/* Tier Label - Static only */}
                <div className={`flex items-center justify-center w-16 ${tier.color} border-r border-gray-300`}>
                  <span className="text-xl font-bold text-gray-800">
                    {tier.name}
                  </span>
                </div>
                
                {/* Cards Area - Static only, no buttons or controls */}
                <div className="flex-1 flex items-center p-4 bg-gray-50 min-h-[80px]">
                  <div className="flex items-center gap-3 flex-wrap w-full">
                    {cards
                      .filter(card => !card.hidden || exportOptions.includeHiddenCards)
                      .map(card => {
                        const isDeletedSource = isCardFromDeletedSource(card)
                        // Apply proper card styling based on type
                        const cardStyleClasses = card.hidden ? 'bg-gray-200 border-gray-400' : getCardStyle(card.type)
                        const hasImage = (card.imageUrl && card.imageUrl !== null) || (card.image && card.image !== null)
                        const isImageCard = card.subtype === 'image' && hasImage
                        const rawImage = card.imageUrl || card.image
                        const isBase64 = typeof rawImage === 'string' && rawImage.startsWith('data:image')
                        const baseApi = apiClient?.defaults?.baseURL || 'http://localhost:4000/api'
                        const proxiedUrl = rawImage && !isBase64 ? `${baseApi}/proxy/image?url=${encodeURIComponent(rawImage)}` : null
                        
                        return (
                          <div 
                            key={card.id} 
                            className={`${cardStyleClasses} border rounded-lg p-3 shadow-sm min-w-[120px] max-w-[200px] relative`}
                          >
                            {/* Hidden card indicator */}
                            {card.hidden && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                            {isImageCard ? (
                              <div className="flex flex-col items-center gap-1">
                                <img
                                  src={isBase64 ? rawImage : proxiedUrl}
                                  alt={card.text}
                                  crossOrigin="anonymous"
                                  className={`w-12 h-12 object-cover rounded ${card.hidden ? 'opacity-50 grayscale' : ''}`}
                                  style={{ display: 'block' }}
                                  onError={(e) => {
                                    // graceful fallback to placeholder if proxy fails
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                                <span className={`text-xs text-center leading-tight px-1 ${card.hidden ? 'text-gray-500 italic' : ''}`}>
                                  {card.hidden ? 'This item is hidden' : card.text}
                                </span>
                              </div>
                            ) : (
                              <div className={`font-medium text-gray-800 mb-1 ${
                                card.hidden ? 'text-gray-500 italic line-through' : ''
                              }`}>
                                {card.hidden ? 'This item is hidden' : card.text}
                              </div>
                            )}
                            {exportOptions.includeComments && card.comments && card.comments.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {card.comments.length} comment{card.comments.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ExportPreview 